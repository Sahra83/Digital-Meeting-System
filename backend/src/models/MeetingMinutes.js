const db = require('../config/db');
const { pool } = require('../config/db');

class MeetingMinutes {
  static async ensureVersionTable(client = db) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_minutes_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        minutes_id UUID NOT NULL REFERENCES meeting_minutes(id) ON DELETE CASCADE,
        meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        snapshot JSONB NOT NULL,
        edited_by UUID REFERENCES users(id),
        change_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (minutes_id, version_number)
      )
    `);

    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_meeting_minutes_versions_meeting_id ON meeting_minutes_versions(meeting_id)'
    );
  }

  static async findParticipantsByMeetingId(meetingId) {
    const result = await db.query(
      `
        SELECT DISTINCT u.id, u.fullname, u.email
        FROM users u
        WHERE u.id = (
          SELECT m.organizer_id
          FROM meetings m
          WHERE m.id = $1
        )
        OR u.id IN (
          SELECT mp.user_id
          FROM meeting_participants mp
          WHERE mp.meeting_id = $1
        )
        ORDER BY u.fullname
      `,
      [meetingId]
    );

    return result.rows;
  }

  static async findByMeetingId(meetingId) {
    const minutesResult = await db.query(
      `
        SELECT mm.*, u.fullname AS created_by_name
        FROM meeting_minutes mm
        LEFT JOIN users u ON u.id = mm.created_by
        WHERE mm.meeting_id = $1
      `,
      [meetingId]
    );

    const minutes = minutesResult.rows[0] || null;
    if (!minutes) {
      return null;
    }

    const [discussionResult, decisionsResult, tasksResult] = await Promise.all([
      db.query(
        `
          SELECT
            dp.*,
            COALESCE(
              (
                SELECT json_agg(json_build_object('id', u.id, 'fullname', u.fullname) ORDER BY u.fullname)
                FROM users u
                WHERE u.id = ANY(COALESCE(dp.who_talked, ARRAY[]::uuid[]))
              ),
              '[]'::json
            ) AS who_talked_people
          FROM discussion_points dp
          WHERE dp.minutes_id = $1
          ORDER BY dp.created_at, dp.id
        `,
        [minutes.id]
      ),
      db.query(
        `
          SELECT d.*, u.fullname AS made_by_name
          FROM decisions d
          LEFT JOIN users u ON u.id = d.made_by
          WHERE d.minutes_id = $1
          ORDER BY d.created_at, d.id
        `,
        [minutes.id]
      ),
      db.query(
        `
          SELECT at.*, u.fullname AS assigned_to_name
          FROM assigned_tasks at
          LEFT JOIN users u ON u.id = at.assigned_to
          WHERE at.minutes_id = $1
          ORDER BY at.created_at, at.id
        `,
        [minutes.id]
      ),
    ]);

    return {
      ...minutes,
      discussion_points: discussionResult.rows,
      decisions: decisionsResult.rows,
      assigned_tasks: tasksResult.rows,
    };
  }

  static async create(meetingId, payload, createdBy) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const minutesResult = await client.query(
        `
          INSERT INTO meeting_minutes (meeting_id, created_by)
          VALUES ($1, $2)
          RETURNING *
        `,
        [meetingId, createdBy]
      );

      const minutes = minutesResult.rows[0];
      await this.replaceMinuteItems(client, minutes.id, payload);

      await client.query('COMMIT');
      return this.findByMeetingId(meetingId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async update(meetingId, payload, editedBy = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureVersionTable(client);

      const existingMinutes = await this.findByMeetingId(meetingId);
      const minutesResult = await client.query(
        `
          UPDATE meeting_minutes
          SET updated_at = now()
          WHERE meeting_id = $1
          RETURNING *
        `,
        [meetingId]
      );

      const minutes = minutesResult.rows[0] || null;
      if (!minutes) {
        await client.query('ROLLBACK');
        return null;
      }

      if (existingMinutes) {
        await this.createVersionSnapshot(client, existingMinutes, editedBy, payload.change_note || 'Minutes updated');
      }

      await client.query('DELETE FROM discussion_points WHERE minutes_id = $1', [minutes.id]);
      await client.query('DELETE FROM decisions WHERE minutes_id = $1', [minutes.id]);
      await client.query('DELETE FROM assigned_tasks WHERE minutes_id = $1', [minutes.id]);
      await this.replaceMinuteItems(client, minutes.id, payload);

      await client.query('COMMIT');
      return this.findByMeetingId(meetingId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async createVersionSnapshot(client, minutes, editedBy, changeNote) {
    const versionResult = await client.query(
      `
        SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
        FROM meeting_minutes_versions
        WHERE minutes_id = $1
      `,
      [minutes.id]
    );

    await client.query(
      `
        INSERT INTO meeting_minutes_versions (minutes_id, meeting_id, version_number, snapshot, edited_by, change_note)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        minutes.id,
        minutes.meeting_id,
        versionResult.rows[0].next_version,
        JSON.stringify({
          discussion_points: minutes.discussion_points || [],
          decisions: minutes.decisions || [],
          assigned_tasks: minutes.assigned_tasks || [],
          saved_at: new Date().toISOString(),
        }),
        editedBy,
        changeNote,
      ]
    );
  }

  static async listVersions(meetingId) {
    await this.ensureVersionTable();
    const result = await db.query(
      `
        SELECT mmv.id, mmv.version_number, mmv.change_note, mmv.created_at, u.fullname AS edited_by_name
        FROM meeting_minutes_versions mmv
        LEFT JOIN users u ON u.id = mmv.edited_by
        WHERE mmv.meeting_id = $1
        ORDER BY mmv.version_number DESC
      `,
      [meetingId]
    );

    return result.rows;
  }

  static async restoreVersion(meetingId, versionId, editedBy) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await this.ensureVersionTable(client);

      const versionResult = await client.query(
        `
          SELECT mmv.*, mm.id AS minutes_id
          FROM meeting_minutes_versions mmv
          JOIN meeting_minutes mm ON mm.id = mmv.minutes_id
          WHERE mmv.id = $1 AND mmv.meeting_id = $2
        `,
        [versionId, meetingId]
      );

      const version = versionResult.rows[0];
      if (!version) {
        await client.query('ROLLBACK');
        return null;
      }

      const currentMinutes = await this.findByMeetingId(meetingId);
      if (currentMinutes) {
        await this.createVersionSnapshot(client, currentMinutes, editedBy, `Restored version ${version.version_number}`);
      }

      await client.query('UPDATE meeting_minutes SET updated_at = now() WHERE meeting_id = $1', [meetingId]);
      await client.query('DELETE FROM discussion_points WHERE minutes_id = $1', [version.minutes_id]);
      await client.query('DELETE FROM decisions WHERE minutes_id = $1', [version.minutes_id]);
      await client.query('DELETE FROM assigned_tasks WHERE minutes_id = $1', [version.minutes_id]);
      await this.replaceMinuteItems(client, version.minutes_id, version.snapshot || {});

      await client.query('COMMIT');
      return this.findByMeetingId(meetingId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getMeetingAccess(meetingId, userId) {
    const result = await db.query(
      `
        SELECT
          m.id,
          m.organizer_id,
          EXISTS (
            SELECT 1
            FROM meeting_participants mp
            WHERE mp.meeting_id = m.id
              AND mp.user_id = $2
          ) AS is_participant
        FROM meetings m
        WHERE m.id = $1
      `,
      [meetingId, userId]
    );

    const meeting = result.rows[0];
    if (!meeting) {
      return null;
    }

    return {
      meetingId: meeting.id,
      isOrganizer: meeting.organizer_id === userId,
      isParticipant: meeting.is_participant,
    };
  }

  static async replaceMinuteItems(client, minutesId, payload) {
    const discussionPoints = Array.isArray(payload.discussion_points) ? payload.discussion_points : [];
    const decisions = Array.isArray(payload.decisions) ? payload.decisions : [];
    const assignedTasks = Array.isArray(payload.assigned_tasks) ? payload.assigned_tasks : [];

    for (const point of discussionPoints) {
      if (!point.topic || !point.topic.trim()) continue;

      await client.query(
        `
          INSERT INTO discussion_points (minutes_id, topic, who_talked)
          VALUES ($1, $2, $3)
        `,
        [minutesId, point.topic.trim(), Array.isArray(point.who_talked) ? point.who_talked : []]
      );
    }

    for (const decision of decisions) {
      if (!decision.decision_text || !decision.decision_text.trim()) continue;

      await client.query(
        `
          INSERT INTO decisions (minutes_id, decision_text, made_by)
          VALUES ($1, $2, $3)
        `,
        [minutesId, decision.decision_text.trim(), decision.made_by || null]
      );
    }

    for (const task of assignedTasks) {
      if (!task.task_description || !task.task_description.trim()) continue;

      await client.query(
        `
          INSERT INTO assigned_tasks (minutes_id, task_description, assigned_to, deadline, status)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          minutesId,
          task.task_description.trim(),
          task.assigned_to || null,
          task.deadline || null,
          task.status || 'pending',
        ]
      );
    }
  }
}

module.exports = MeetingMinutes;
