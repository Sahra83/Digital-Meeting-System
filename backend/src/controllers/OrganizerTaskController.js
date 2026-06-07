const { pool } = require('../config/db');
const ApiError = require('../utils/apiError');
const path = require('path');
const fs = require('fs');

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

class OrganizerTaskController {
  // GET /organizer/tasks/submitted - tasks submitted for meetings owned by organizer
  static async getSubmittedTasks(req, res, next) {
    try {
      const organizerId = req.user.id;
      const query = `
        SELECT t.id, t.task_description, t.deadline, t.status, t.completion_note,
               m.title AS meeting_title, m.meeting_date,
               u.fullname AS participant_name, u.id AS participant_id,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', ta.id,
                     'file_path', ta.file_path,
                     'original_name', ta.original_name,
                     'mime_type', ta.mime_type,
                     'uploaded_at', ta.uploaded_at
                   )
                 ) FILTER (WHERE ta.id IS NOT NULL),
                 '[]'::json
               ) AS attachments
        FROM assigned_tasks t
        JOIN meeting_minutes mm ON t.minutes_id = mm.id
        JOIN meetings m ON mm.meeting_id = m.id
        JOIN users u ON t.assigned_to = u.id
        LEFT JOIN task_attachments ta ON ta.task_id = t.id
        WHERE m.organizer_id = $1 AND t.status = 'submitted'
        GROUP BY t.id, m.title, m.meeting_date, u.fullname, u.id
        ORDER BY t.created_at DESC;
      `;
      const { rows } = await pool.query(query, [organizerId]);
      res.json({ tasks: rows });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /organizer/tasks/:taskId/approve
  static async approveTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const organizerId = req.user.id;
      // Verify organizer owns the meeting for this task
      const verifyQuery = `
        SELECT 1 FROM assigned_tasks at
        JOIN meeting_minutes mm ON at.minutes_id = mm.id
        JOIN meetings m ON mm.meeting_id = m.id
        WHERE at.id = $1 AND m.organizer_id = $2 AND at.status = 'submitted'
      `;
      const { rowCount } = await pool.query(verifyQuery, [taskId, organizerId]);
      if (rowCount === 0) {
        throw new ApiError(403, 'Not authorized to approve this task');
      }
      const updateQuery = `
        UPDATE assigned_tasks
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      const { rows } = await pool.query(updateQuery, [taskId]);
      res.json({ message: 'Task approved', task: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /organizer/tasks/:taskId/reject
  static async rejectTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const organizerId = req.user.id;
      const { rejection_reason } = req.body;

      const verifyQuery = `
        SELECT 1 FROM assigned_tasks at
        JOIN meeting_minutes mm ON at.minutes_id = mm.id
        JOIN meetings m ON mm.meeting_id = m.id
        WHERE at.id = $1 AND m.organizer_id = $2 AND at.status = 'submitted'
      `;
      const { rowCount } = await pool.query(verifyQuery, [taskId, organizerId]);
      if (rowCount === 0) {
        throw new ApiError(403, 'Not authorized to reject this task');
      }

      const updateQuery = `
        UPDATE assigned_tasks
        SET status = 'in_progress', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      const { rows } = await pool.query(updateQuery, [taskId, rejection_reason || null]);
      res.json({ message: 'Task rejected', task: rows[0] });
    } catch (err) {
      next(err);
    }
  }

  static async downloadTaskAttachment(req, res, next) {
    try {
      const { attachmentId } = req.params;
      const organizerId = req.user.id;
      const query = `
        SELECT ta.file_path, ta.original_name
        FROM task_attachments ta
        JOIN assigned_tasks t ON t.id = ta.task_id
        JOIN meeting_minutes mm ON mm.id = t.minutes_id
        JOIN meetings m ON m.id = mm.meeting_id
        WHERE ta.id = $1 AND m.organizer_id = $2
      `;
      const { rows } = await pool.query(query, [attachmentId, organizerId]);
      if (rows.length === 0) {
        throw new ApiError(403, 'Not authorized to download this attachment');
      }

      res.download(resolveStoredUpload(rows[0].file_path), rows[0].original_name);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrganizerTaskController;
