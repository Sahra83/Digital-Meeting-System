const db = require('../config/db');

class Task {
  static async getAllMeetingsForDropdown() {
    const result = await db.query(
      `SELECT id, title, meeting_date 
       FROM meetings 
       ORDER BY meeting_date DESC, created_at DESC`
    );
    return result.rows;
  }

  static async getTasksByMeetingId(meetingId) {
    const query = `
      SELECT 
        t.id, 
        t.task_description, 
        t.deadline, 
        t.status,
        t.assigned_to,
        u.fullname AS assigned_to_name,
        u.email AS assigned_to_email
      FROM assigned_tasks t
      JOIN meeting_minutes m ON t.minutes_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE m.meeting_id = $1
      ORDER BY t.created_at ASC
    `;
    const result = await db.query(query, [meetingId]);
    return result.rows;
  }

  static async getTaskById(taskId) {
    const query = `
      SELECT 
        t.id, 
        t.task_description, 
        t.deadline, 
        t.status,
        t.assigned_to,
        u.fullname AS assigned_to_name,
        u.email AS assigned_to_email
      FROM assigned_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
    `;
    const result = await db.query(query, [taskId]);
    return result.rows[0] || null;
  }

  static async updateTask(taskId, { task_description, assigned_to, deadline, status }) {
    const query = `
      UPDATE assigned_tasks 
      SET 
        task_description = COALESCE($1, task_description),
        assigned_to = COALESCE($2, assigned_to),
        deadline = COALESCE($3, deadline),
        status = COALESCE($4, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const values = [task_description, assigned_to, deadline, status, taskId];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async deleteTask(taskId) {
    const query = `
      DELETE FROM assigned_tasks 
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [taskId]);
    return result.rows[0];
  }
}

module.exports = Task;
