const { pool } = require('../config/db');

class Meeting {
  static async create(meetingData) {
    const { title, agenda, meeting_date, meeting_time, location, organizer_id, participants } = meetingData;
    const client = await pool.connect();
    
    try {
      console.log(`[Meeting model] Starting create transaction for "${title}"`);
      await client.query('BEGIN');
      
      const meetingResult = await client.query(
        `INSERT INTO meetings (title, agenda, meeting_date, meeting_time, location, organizer_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, agenda, meeting_date, meeting_time, location, organizer_id]
      );
      
      const meeting = meetingResult.rows[0];
      console.log(`[Meeting model] Meeting row inserted: ${meeting.id}`);
      
      if (participants && participants.length > 0) {
        const uniqueParticipants = [...new Set(participants)];
        console.log(`[Meeting model] Inserting ${uniqueParticipants.length} participant link(s) for meeting ${meeting.id}`);
        const participantQueries = uniqueParticipants.map(userId => 
          client.query(
            'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)',
            [meeting.id, userId]
          )
        );
        await Promise.all(participantQueries);
      } else {
        console.log(`[Meeting model] No participants to insert for meeting ${meeting.id}`);
      }
      
      await client.query('COMMIT');
      console.log(`[Meeting model] Create transaction committed for meeting ${meeting.id}`);
      return meeting;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Meeting model] Create transaction failed and rolled back:', {
        title,
        message: err.message,
        code: err.code,
        detail: err.detail,
      });
      throw err;
    } finally {
      client.release();
    }
  }

  static async findAll(filters = '') {
    const normalizedFilters = typeof filters === 'string' ? { search: filters } : (filters || {});
    const {
      search = '',
      date = '',
      dateFrom = '',
      dateTo = '',
      organizer = '',
      project = '',
      participant = '',
      status = '',
    } = normalizedFilters;

    let query = `
      SELECT m.*, u.fullname as organizer_name,
      (SELECT json_agg(json_build_object('id', users.id, 'fullname', users.fullname, 'username', users.username))
       FROM meeting_participants mp
       JOIN users ON mp.user_id = users.id
       WHERE mp.meeting_id = m.id) as participants
      FROM meetings m
      JOIN users u ON m.organizer_id = u.id
    `;
    
    const params = [];
    const conditions = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(
        m.title ILIKE $${params.length}
        OR m.agenda ILIKE $${params.length}
        OR m.location ILIKE $${params.length}
        OR u.fullname ILIKE $${params.length}
        OR EXISTS (
          SELECT 1
          FROM meeting_participants mp_search
          JOIN users participant_search ON participant_search.id = mp_search.user_id
          WHERE mp_search.meeting_id = m.id
            AND participant_search.fullname ILIKE $${params.length}
        )
      )`);
    }

    if (date) {
      params.push(date);
      conditions.push(`m.meeting_date = $${params.length}`);
    }

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`m.meeting_date >= $${params.length}`);
    }

    if (dateTo) {
      params.push(dateTo);
      conditions.push(`m.meeting_date <= $${params.length}`);
    }

    if (organizer) {
      params.push(`%${organizer}%`);
      conditions.push(`u.fullname ILIKE $${params.length}`);
    }

    if (project) {
      params.push(`%${project}%`);
      conditions.push(`(m.title ILIKE $${params.length} OR m.agenda ILIKE $${params.length})`);
    }

    if (participant) {
      params.push(`%${participant}%`);
      conditions.push(`EXISTS (
        SELECT 1
        FROM meeting_participants mp_filter
        JOIN users participant_filter ON participant_filter.id = mp_filter.user_id
        WHERE mp_filter.meeting_id = m.id
          AND (
            participant_filter.fullname ILIKE $${params.length}
            OR participant_filter.username ILIKE $${params.length}
            OR participant_filter.email ILIKE $${params.length}
          )
      )`);
    }

    if (status) {
      if (status.toLowerCase() === 'upcoming') {
        conditions.push(`m.meeting_date >= CURRENT_DATE AND m.status ILIKE 'scheduled'`);
      } else if (status.toLowerCase() === 'completed') {
        conditions.push(`(m.meeting_date < CURRENT_DATE OR m.status ILIKE 'completed')`);
      } else {
        params.push(status);
        conditions.push(`m.status ILIKE $${params.length}`);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY m.meeting_date DESC, m.meeting_time DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getDashboardSummary(filters = {}) {
    const { dateFrom = '', dateTo = '' } = filters;
    const params = [];
    const conditions = [];

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`m.meeting_date >= $${params.length}`);
    }

    if (dateTo) {
      params.push(dateTo);
      conditions.push(`m.meeting_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [
      statsResult, 
      upcomingResult, 
      meetingTaskComparisonResult, 
      topParticipantsResult, 
      delinquentMeetingsResult,
      statusDistResult,
      distinctStatusResult
    ] = await Promise.all([
      pool.query(
        `
          SELECT
            COUNT(DISTINCT m.id)::int AS total_meetings,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status ILIKE 'scheduled')::int AS scheduled_meetings,
            COUNT(DISTINCT m.id) FILTER (WHERE m.meeting_date < CURRENT_DATE)::int AS completed_meetings,
            COUNT(DISTINCT m.id) FILTER (WHERE m.meeting_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3)::int AS upcoming_soon,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status ILIKE 'scheduled' AND m.meeting_date < CURRENT_DATE)::int AS scheduled_past_meetings,
            COUNT(DISTINCT m.id) FILTER (WHERE m.meeting_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3)::int AS closing_soon_meetings,
            COUNT(DISTINCT mm.id)::int AS meetings_with_minutes,
            COUNT(DISTINCT at.id) FILTER (WHERE COALESCE(at.status, 'pending') = 'pending')::int AS pending_action_items,
            COUNT(DISTINCT at.id)::int AS total_action_items,
            (SELECT COUNT(*)::int FROM users) AS total_users,
            (SELECT COUNT(*)::int FROM users WHERE status = 'active') AS active_users
          FROM meetings m
          LEFT JOIN meeting_minutes mm ON mm.meeting_id = m.id
          LEFT JOIN assigned_tasks at ON at.minutes_id = mm.id
          ${whereClause}
        `,
        params
      ),
      pool.query(
        `
          SELECT m.id, m.title, m.meeting_date, m.meeting_time, m.location, m.status, u.fullname AS organizer_name
          FROM meetings m
          JOIN users u ON u.id = m.organizer_id
          WHERE m.status ILIKE 'scheduled' AND m.meeting_date >= CURRENT_DATE
          ORDER BY m.meeting_date ASC, m.meeting_time ASC
          LIMIT 6
        `
      ),
      pool.query(
        `
          SELECT 
            m.id AS meeting_id,
            m.title AS meeting_title, 
            COUNT(at.id)::int AS total_tasks,
            COUNT(at.id) FILTER (WHERE at.status IN ('completed', 'approved', 'submitted'))::int AS completed_tasks,
            COUNT(at.id) FILTER (WHERE COALESCE(at.status, 'pending') IN ('pending', 'in_progress', 'rejected'))::int AS pending_tasks,
            CASE WHEN COUNT(at.id) > 0 
              THEN ROUND((COUNT(at.id) FILTER (WHERE at.status IN ('completed', 'approved', 'submitted'))::numeric / COUNT(at.id)) * 100)::int 
              ELSE 0 END AS completed_pct,
            (SELECT string_agg(DISTINCT u2.fullname, ', ')
             FROM assigned_tasks at2
             JOIN meeting_minutes mm2 ON mm2.id = at2.minutes_id
             JOIN users u2 ON u2.id = at2.assigned_to
             WHERE mm2.meeting_id = m.id AND at2.status IN ('completed', 'approved', 'submitted')
            ) AS top_submitters
          FROM meetings m
          LEFT JOIN meeting_minutes mm ON mm.meeting_id = m.id
          LEFT JOIN assigned_tasks at ON at.minutes_id = mm.id
          GROUP BY m.id, m.title
          ORDER BY m.meeting_date DESC
          LIMIT 10
        `
      ),
      pool.query(
        `
          SELECT 
            u.fullname AS participant_name,
            COUNT(DISTINCT m.id)::int AS meetings_attended,
            COUNT(at.id)::int AS tasks_assigned,
            COUNT(at.id) FILTER (WHERE at.status IN ('completed', 'approved', 'submitted'))::int AS tasks_completed,
            COUNT(at.id) FILTER (WHERE COALESCE(at.status, 'pending') IN ('pending', 'in_progress', 'rejected'))::int AS tasks_pending
          FROM users u
          JOIN meeting_participants mp ON mp.user_id = u.id
          JOIN meetings m ON m.id = mp.meeting_id
          LEFT JOIN meeting_minutes mm ON mm.meeting_id = m.id
          LEFT JOIN assigned_tasks at ON at.minutes_id = mm.id AND at.assigned_to = u.id
          GROUP BY u.id, u.fullname
          ORDER BY tasks_assigned DESC, meetings_attended DESC
          LIMIT 6
        `
      ),
      pool.query(
        `
          SELECT 
            m.id, m.title, m.meeting_date,
            COUNT(at.id)::int AS total_tasks,
            COUNT(at.id) FILTER (WHERE COALESCE(at.status, 'pending') IN ('pending', 'in_progress', 'rejected'))::int AS pending_tasks
          FROM meetings m
          JOIN meeting_minutes mm ON mm.meeting_id = m.id
          JOIN assigned_tasks at ON at.minutes_id = mm.id
          GROUP BY m.id, m.title, m.meeting_date
          HAVING COUNT(at.id) FILTER (WHERE COALESCE(at.status, 'pending') IN ('pending', 'in_progress', 'rejected')) > 0
          ORDER BY pending_tasks DESC, m.meeting_date DESC
          LIMIT 6
        `
      ),
      pool.query(
        `
          SELECT COALESCE(m.status, 'scheduled') AS label, COUNT(m.id)::int AS value
          FROM meetings m
          GROUP BY m.status
        `
      ),
      pool.query(
        `
          SELECT DISTINCT COALESCE(status, 'scheduled') AS status_value
          FROM meetings
          ORDER BY status_value
        `
      )
    ]);

    return {
      stats: statsResult.rows[0],
      upcomingMeetings: upcomingResult.rows,
      meetingTaskComparison: meetingTaskComparisonResult.rows,
      topParticipants: topParticipantsResult.rows,
      delinquentMeetings: delinquentMeetingsResult.rows,
      statusDistribution: statusDistResult.rows,
      distinctStatuses: [...new Set(['upcoming', 'completed', ...distinctStatusResult.rows.map(r => r.status_value)])]
    };
  }

  static async findById(id) {
    const query = `
      SELECT m.*, u.fullname as organizer_name,
      (SELECT json_agg(json_build_object('id', users.id, 'fullname', users.fullname, 'username', users.username))
       FROM meeting_participants mp
       JOIN users ON mp.user_id = users.id
       WHERE mp.meeting_id = m.id) as participants
      FROM meetings m
      JOIN users u ON m.organizer_id = u.id
      WHERE m.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, meetingData) {
    const { title, agenda, meeting_date, meeting_time, location, participants, status = 'scheduled' } = meetingData;
    const client = await pool.connect();
    
    try {
      console.log(`[Meeting model] Starting update transaction for meeting ${id}`);
      await client.query('BEGIN');
      
      const meetingResult = await client.query(
        `UPDATE meetings 
         SET title = $1, agenda = $2, meeting_date = $3, meeting_time = $4, location = $5, status = $6, updated_at = now()
         WHERE id = $7
         RETURNING *`,
        [title, agenda, meeting_date, meeting_time, location, status, id]
      );
      
      const meeting = meetingResult.rows[0];
      if (!meeting) {
        console.log(`[Meeting model] No meeting found to update: ${id}`);
      } else {
        console.log(`[Meeting model] Meeting row updated: ${meeting.id}`);
      }
      
      if (participants) {
        // Clear existing participants and re-add
        console.log(`[Meeting model] Replacing participant links for meeting ${id}`);
        await client.query('DELETE FROM meeting_participants WHERE meeting_id = $1', [id]);
        if (participants.length > 0) {
          const uniqueParticipants = [...new Set(participants)];
          console.log(`[Meeting model] Inserting ${uniqueParticipants.length} participant link(s) for meeting ${id}`);
          const participantQueries = uniqueParticipants.map(userId => 
            client.query(
              'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)',
              [id, userId]
            )
          );
          await Promise.all(participantQueries);
        } else {
          console.log(`[Meeting model] No participants to insert for meeting ${id}`);
        }
      }
      
      await client.query('COMMIT');
      console.log(`[Meeting model] Update transaction committed for meeting ${id}`);
      return meeting;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Meeting model] Update transaction failed and rolled back:', {
        id,
        title,
        message: err.message,
        code: err.code,
        detail: err.detail,
      });
      throw err;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM meetings WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Helper: check if a user participates in a meeting (organizer or participant list)
  static async isParticipant(meetingId, userId) {
    const query = `
      SELECT 1 FROM meeting_participants
      WHERE meeting_id = $1 AND user_id = $2
    `;
    const { rowCount } = await pool.query(query, [meetingId, userId]);
    return rowCount > 0;
  }
}

module.exports = Meeting;
