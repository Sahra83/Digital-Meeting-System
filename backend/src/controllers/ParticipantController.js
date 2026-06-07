const { pool } = require('../config/db');
const { isParticipantInMeeting, isTaskOwner } = require('../middleware/permissionHelpers');
const ApiError = require('../utils/apiError');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const normalizeUploadPath = (file) => path.posix.join('uploads', file.filename);

function resolveStoredUpload(filePath) {
  const absolutePath = path.resolve(__dirname, '..', '..', filePath);
  const uploadRoot = path.resolve(__dirname, '..', '..', 'uploads');

  if (!absolutePath.startsWith(uploadRoot + path.sep)) {
    throw new ApiError(400, 'Invalid file path');
  }

  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, 'File is missing from server storage. Please upload it again.');
  }

  return absolutePath;
}

class ParticipantController {
  // GET /participant/meetings
  static async getMyMeetings(req, res, next) {
    try {
      const userId = req.user.id;
      const query = `
        SELECT m.id, m.title, m.meeting_date, m.meeting_time, m.location, m.status, u.fullname AS organizer_name
        FROM meetings m
        JOIN users u ON m.organizer_id = u.id
        JOIN meeting_participants mp ON mp.meeting_id = m.id
        WHERE mp.user_id = $1
        ORDER BY m.meeting_date DESC, m.meeting_time DESC;
      `;
      const { rows } = await pool.query(query, [userId]);
      res.json({ meetings: rows });
    } catch (err) {
      next(err);
    }
  }

  // GET /participant/tasks
  static async getMyTasks(req, res, next) {
    try {
      const userId = req.user.id;
      const query = `
        SELECT t.id, t.task_description, t.deadline, t.status, t.created_at,
               m.title AS meeting_title, m.meeting_date,
               org.fullname AS organizer_name,
               t.completion_note,
               t.rejection_reason,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', ta.id,
                     'original_name', ta.original_name,
                     'mime_type', ta.mime_type,
                     'uploaded_at', ta.uploaded_at
                   )
                 ) FILTER (WHERE ta.id IS NOT NULL),
                 '[]'::json
               ) AS attachments,
               CASE
                 WHEN t.deadline IS NULL THEN 'normal'
                 WHEN t.status = 'completed' THEN 'normal'
                 WHEN t.deadline <= CURRENT_DATE + INTERVAL '1 day' THEN 'high'
                 WHEN t.deadline <= CURRENT_DATE + INTERVAL '4 days' THEN 'medium'
                 ELSE 'normal'
               END AS priority
        FROM assigned_tasks t
        JOIN meeting_minutes mm ON t.minutes_id = mm.id
        JOIN meetings m ON mm.meeting_id = m.id
        JOIN users org ON m.organizer_id = org.id
        LEFT JOIN task_attachments ta ON ta.task_id = t.id
        WHERE t.assigned_to = $1
        GROUP BY t.id, m.title, m.meeting_date, org.fullname
        ORDER BY t.created_at DESC;
      `;
      const { rows } = await pool.query(query, [userId]);
      res.json({ tasks: rows });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /participant/tasks/:taskId/start
  static async startTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;
      // Verify ownership
      if (!(await isTaskOwner(taskId, userId))) {
        throw new ApiError(403, 'Not authorized to start this task');
      }
      const query = `
        UPDATE assigned_tasks
        SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'pending'
        RETURNING *;
      `;
      const { rows } = await pool.query(query, [taskId]);
      if (rows.length === 0) {
        throw new ApiError(400, 'Task cannot be started (maybe not pending)');
      }
      res.json({ message: 'Task started', task: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  // POST /participant/tasks/:taskId/submit
  static async submitTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;
      const { completion_note } = req.body || {};

      // Verify ownership and that task is in_progress or pending
      if (!(await isTaskOwner(taskId, userId))) {
        throw new ApiError(403, 'Not authorized to submit this task');
      }

      // Update task status and note
      const updateQuery = `
        UPDATE assigned_tasks
        SET status = 'submitted', completion_note = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND status IN ('in_progress', 'pending')
        RETURNING *;
      `;
      const { rows } = await pool.query(updateQuery, [completion_note || null, taskId]);
      if (rows.length === 0) {
        throw new ApiError(400, 'Task cannot be submitted (invalid status)');
      }
      const updatedTask = rows[0];

      // Handle file attachments (if any)
      if (req.files && req.files.length > 0) {
        const attachmentPromises = req.files.map(file => {
          const insertQuery = `
            INSERT INTO task_attachments (task_id, file_path, original_name, mime_type)
            VALUES ($1, $2, $3, $4) RETURNING id;
          `;
          const filePath = normalizeUploadPath(file);
          return pool.query(insertQuery, [taskId, filePath, file.originalname, file.mimetype]);
        });
        await Promise.all(attachmentPromises);
      }

      res.json({ message: 'Task submitted', task: updatedTask });
    } catch (err) {
      next(err);
    }
  }
  // GET /participant/dashboard stats
  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;
      const meetingsQuery = `
        SELECT COUNT(*) AS meeting_count FROM meetings m
        JOIN meeting_participants mp ON mp.meeting_id = m.id
        WHERE mp.user_id = $1;
      `;
      const tasksQuery = `
        SELECT
          COUNT(*) AS task_count,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
          COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_count,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
        FROM assigned_tasks
        WHERE assigned_to = $1;
      `;
      const recentMeetingsQuery = `
        SELECT m.id, m.title, m.meeting_date, m.meeting_time, m.location, m.status, u.fullname AS organizer_name
        FROM meetings m
        JOIN users u ON m.organizer_id = u.id
        JOIN meeting_participants mp ON mp.meeting_id = m.id
        WHERE mp.user_id = $1
        ORDER BY m.meeting_date DESC, m.meeting_time DESC
        LIMIT 5;
      `;
      const urgentTasksQuery = `
        SELECT t.id, t.task_description, t.deadline, t.status, t.created_at, m.title AS meeting_title,
               CASE
                 WHEN t.deadline IS NULL THEN 'normal'
                 WHEN t.status = 'completed' THEN 'normal'
                 WHEN t.deadline <= CURRENT_DATE + INTERVAL '1 day' THEN 'high'
                 WHEN t.deadline <= CURRENT_DATE + INTERVAL '4 days' THEN 'medium'
                 ELSE 'normal'
               END AS priority
        FROM assigned_tasks t
        JOIN meeting_minutes mm ON t.minutes_id = mm.id
        JOIN meetings m ON mm.meeting_id = m.id
        WHERE t.assigned_to = $1
        ORDER BY
          CASE
            WHEN t.deadline IS NULL THEN 3
            WHEN t.deadline <= CURRENT_DATE + INTERVAL '1 day' THEN 0
            WHEN t.deadline <= CURRENT_DATE + INTERVAL '4 days' THEN 1
            ELSE 2
          END,
          t.deadline ASC NULLS LAST
        LIMIT 5;
      `;
      const [{ rows: meetingRows }, { rows: taskRows }, { rows: recentMeetings }, { rows: urgentTasks }] = await Promise.all([
        pool.query(meetingsQuery, [userId]),
        pool.query(tasksQuery, [userId]),
        pool.query(recentMeetingsQuery, [userId]),
        pool.query(urgentTasksQuery, [userId]),
      ]);
      res.json({
        meetingCount: Number(meetingRows[0].meeting_count),
        taskCount: Number(taskRows[0].task_count),
        taskStats: {
          pending: Number(taskRows[0].pending_count),
          in_progress: Number(taskRows[0].in_progress_count),
          submitted: Number(taskRows[0].submitted_count),
          completed: Number(taskRows[0].completed_count),
        },
        meetings: recentMeetings,
        tasks: urgentTasks,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /participant/meetings/:id details
  static async getMeetingDetails(req, res, next) {
    try {
      const userId = req.user.id;
      const meetingId = req.params.id;
      // Verify participant access
      if (!(await isParticipantInMeeting(meetingId, userId))) {
        throw new ApiError(403, 'Not authorized to view this meeting');
      }
      // Meeting basic info
      const meetingQuery = `
        SELECT m.*, u.fullname AS organizer_name FROM meetings m
        JOIN users u ON m.organizer_id = u.id
        WHERE m.id = $1;
      `;
      const minutesQuery = `
        SELECT * FROM meeting_minutes WHERE meeting_id = $1 ORDER BY created_at DESC LIMIT 1;
      `;
      const docsQuery = `
        SELECT * FROM meeting_documents WHERE meeting_id = $1;
      `;
      const tasksQuery = `
        SELECT t.* FROM assigned_tasks t
        JOIN meeting_minutes mm ON t.minutes_id = mm.id
        WHERE mm.meeting_id = $1 AND t.assigned_to = $2;
      `;
      const discussionQuery = `
        SELECT dp.*
        FROM discussion_points dp
        JOIN meeting_minutes mm ON mm.id = dp.minutes_id
        WHERE mm.meeting_id = $1
        ORDER BY dp.created_at, dp.id;
      `;
      const decisionsQuery = `
        SELECT d.*, u.fullname AS made_by_name
        FROM decisions d
        JOIN meeting_minutes mm ON mm.id = d.minutes_id
        LEFT JOIN users u ON u.id = d.made_by
        WHERE mm.meeting_id = $1
        ORDER BY d.created_at, d.id;
      `;
      const [{ rows: meetingRows }, { rows: minutesRows }, { rows: docsRows }, { rows: tasksRows }, { rows: discussionRows }, { rows: decisionRows }] = await Promise.all([
        pool.query(meetingQuery, [meetingId]),
        pool.query(minutesQuery, [meetingId]),
        pool.query(docsQuery, [meetingId]),
        pool.query(tasksQuery, [meetingId, userId]),
        pool.query(discussionQuery, [meetingId]),
        pool.query(decisionsQuery, [meetingId]),
      ]);
      res.json({
        meeting: meetingRows[0],
        minutes: minutesRows[0] || null,
        discussionPoints: discussionRows,
        decisions: decisionRows,
        documents: docsRows,
        tasks: tasksRows,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /participant/profile
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const query = `
        SELECT u.id, u.username, u.email, u.fullname, u.phone, u.status, r.role_name
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
      `;
      const { rows } = await pool.query(query, [userId]);
      res.json({ profile: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  // PUT /participant/profile
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { username } = req.body;
      if (!username || username.trim().length < 3) {
        throw new ApiError(400, 'Username must be at least 3 characters');
      }
      const existing = await pool.query(
        'SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2',
        [username.trim(), userId]
      );
      if (existing.rowCount > 0) {
        throw new ApiError(409, 'A user with this username already exists');
      }
      const query = `
        UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 RETURNING id, username, email, fullname, phone, status;
      `;
      const { rows } = await pool.query(query, [username.trim(), userId]);
      res.json({ profile: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  // PUT /participant/profile/password
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        throw new ApiError(400, 'Password must be at least 8 characters and include letters and numbers');
      }
      const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      if (rows.length === 0) {
        throw new ApiError(404, 'User not found');
      }
      const match = await bcrypt.compare(currentPassword, rows[0].password);
      if (!match) {
        throw new ApiError(400, 'Current password is incorrect');
      }
      const newHash = await bcrypt.hash(newPassword, 12);
      await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async downloadMeetingDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const query = `
        SELECT md.file_path, md.original_name
        FROM meeting_documents md
        JOIN meeting_participants mp ON mp.meeting_id = md.meeting_id
        WHERE md.id = $1 AND mp.user_id = $2
      `;
      const { rows } = await pool.query(query, [documentId, req.user.id]);
      if (rows.length === 0) {
        throw new ApiError(403, 'Not authorized to download this document');
      }

      res.download(resolveStoredUpload(rows[0].file_path), rows[0].original_name);
    } catch (err) {
      next(err);
    }
  }

  static async downloadTaskAttachment(req, res, next) {
    try {
      const { attachmentId } = req.params;
      const query = `
        SELECT ta.file_path, ta.original_name
        FROM task_attachments ta
        JOIN assigned_tasks t ON t.id = ta.task_id
        WHERE ta.id = $1 AND t.assigned_to = $2
      `;
      const { rows } = await pool.query(query, [attachmentId, req.user.id]);
      if (rows.length === 0) {
        throw new ApiError(403, 'Not authorized to download this attachment');
      }

      res.download(resolveStoredUpload(rows[0].file_path), rows[0].original_name);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ParticipantController;
