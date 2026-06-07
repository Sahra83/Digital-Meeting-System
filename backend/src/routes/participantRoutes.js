const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const protectParticipant = require('../middleware/protectParticipant');
const ParticipantController = require('../controllers/ParticipantController');
const upload = require('../middleware/upload');

const router = express.Router();

// All participant routes require authentication and participant role
router.use(authenticate);
router.use(protectParticipant);

// Dashboard statistics
router.get('/dashboard', ParticipantController.getDashboardStats);

// My Meetings list
router.get('/meetings', ParticipantController.getMyMeetings);

// Meeting details (minutes, docs, tasks)
router.get('/meetings/:id', ParticipantController.getMeetingDetails);
router.get('/documents/:documentId/download', ParticipantController.downloadMeetingDocument);
router.get('/task-attachments/:attachmentId/download', ParticipantController.downloadTaskAttachment);

// My Tasks list
router.get('/tasks', ParticipantController.getMyTasks);

// Task workflow
router.patch('/tasks/:taskId/start', ParticipantController.startTask);
router.post('/tasks/:taskId/submit', upload.array('attachments'), ParticipantController.submitTask);

// Profile endpoints
router.get('/profile', ParticipantController.getProfile);
router.put('/profile', ParticipantController.updateProfile);
router.put('/profile/password', ParticipantController.changePassword);

module.exports = router;
