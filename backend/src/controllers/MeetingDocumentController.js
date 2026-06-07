const { pool } = require('../config/db');
const ApiError = require('../utils/apiError');
const path = require('path');
const fs = require('fs');

function resolveStoredUpload(filePath) {
  const absolutePath = path.resolve(__dirname, '../../', filePath);
  const uploadRoot = path.resolve(__dirname, '../../uploads');

  if (!absolutePath.startsWith(uploadRoot + path.sep)) {
    throw new ApiError(400, 'Invalid file path');
  }

  if (!fs.existsSync(absolutePath)) {
    throw new ApiError(404, 'File is missing from server storage. Please upload it again.');
  }

  return absolutePath;
}

class MeetingDocumentController {
  // GET /meeting/:meetingId/documents - list documents for a meeting (participants only)
  static async listDocuments(req, res, next) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.id;
      // Verify participant or organizer
      const verifyQuery = `
        SELECT 1 FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2
        UNION ALL SELECT 1 FROM meetings WHERE id = $1 AND organizer_id = $2
      `;
      const { rowCount } = await pool.query(verifyQuery, [meetingId, userId]);
      if (rowCount === 0) {
        throw new ApiError(403, 'Access denied to meeting documents');
      }
      const q = `SELECT id, original_name, mime_type, file_path, uploaded_at FROM meeting_documents WHERE meeting_id = $1 ORDER BY uploaded_at DESC`;
      const { rows } = await pool.query(q, [meetingId]);
      res.json({ documents: rows });
    } catch (err) {
      next(err);
    }
  }

  // POST /meeting/:meetingId/documents - upload documents (organizer only)
  static async uploadDocuments(req, res, next) {
    try {
      const { meetingId } = req.params;
      const userId = req.user.id;
      // Verify organizer
      const verifyOrg = `SELECT 1 FROM meetings WHERE id = $1 AND organizer_id = $2`;
      const { rowCount } = await pool.query(verifyOrg, [meetingId, userId]);
      if (rowCount === 0) {
        throw new ApiError(403, 'Only organizer can upload documents');
      }
      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, 'No files uploaded');
      }
      const insertPromises = req.files.map(file => {
        const insertQ = `INSERT INTO meeting_documents (meeting_id, file_path, original_name, mime_type) VALUES ($1, $2, $3, $4) RETURNING id`;
        const filePath = path.posix.join('uploads', file.filename);
        return pool.query(insertQ, [meetingId, filePath, file.originalname, file.mimetype]);
      });
      const results = await Promise.all(insertPromises);
      const ids = results.map(r => r.rows[0].id);
      res.json({ message: 'Documents uploaded', ids });
    } catch (err) {
      next(err);
    }
  }

  // GET /meeting/:meetingId/documents/:docId/download - serve file download
  static async downloadDocument(req, res, next) {
    try {
      const { meetingId, docId } = req.params;
      const userId = req.user.id;
      // Verify participant/organizer
      const verifyQuery = `
        SELECT file_path, original_name FROM meeting_documents md
        WHERE md.id = $1 AND md.meeting_id = $2 AND (
          EXISTS (SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = $2 AND mp.user_id = $3)
          OR EXISTS (SELECT 1 FROM meetings m WHERE m.id = $2 AND m.organizer_id = $3)
        )
      `;
      const { rows } = await pool.query(verifyQuery, [docId, meetingId, userId]);
      if (rows.length === 0) {
        throw new ApiError(404, 'Document not found or access denied');
      }
      const doc = rows[0];
      res.download(resolveStoredUpload(doc.file_path), doc.original_name);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MeetingDocumentController;
