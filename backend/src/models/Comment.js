// src/models/Comment.js
const { pool } = require('../config/db');

class Comment {
  // Fetch comments for a meeting, optionally filtered by item_type and item_id
  static async list(meetingId, itemType = null, itemId = null) {
    const params = [meetingId];
    let query = `SELECT * FROM comments WHERE meeting_id = $1`;
    if (itemType) {
      params.push(itemType);
      query += ` AND item_type = $${params.length}`;
    }
    if (itemId) {
      params.push(itemId);
      query += ` AND item_id = $${params.length}`;
    }
    query += ` ORDER BY created_at ASC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(commentId) {
    const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    return rows[0];
  }

  static async create({ meetingId, minutesId = null, itemType = null, itemId = null, authorId, commentText, parentId = null }) {
    const query = `INSERT INTO comments (meeting_id, minutes_id, item_type, item_id, author_id, comment_text, parent_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [meetingId, minutesId, itemType, itemId, authorId, commentText, parentId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async update(commentId, commentText) {
    const query = `UPDATE comments SET comment_text = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
    const { rows } = await pool.query(query, [commentText, commentId]);
    return rows[0];
  }

  static async delete(commentId) {
    const query = `DELETE FROM comments WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [commentId]);
    return rows[0];
  }
}

module.exports = Comment;
