const express = require('express');
const MeetingDocumentController = require('../controllers/MeetingDocumentController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

// List documents for a meeting
router.get('/meeting/:meetingId/documents', MeetingDocumentController.listDocuments);

// Upload documents (organizer only) - accept multiple files
router.post('/meeting/:meetingId/documents', upload.array('files', 10), MeetingDocumentController.uploadDocuments);

// Download a specific document
router.get('/meeting/:meetingId/documents/:docId/download', MeetingDocumentController.downloadDocument);

module.exports = router;
