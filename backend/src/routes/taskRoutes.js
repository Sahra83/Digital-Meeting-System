const express = require('express');
const TaskController = require('../controllers/TaskController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// List meetings for dropdown (used in task creation UI)
router.get('/meetings', TaskController.getMeetings);

// Get tasks for a specific meeting
router.get('/meetings/:meetingId', TaskController.getTasksByMeeting);

// Update a task
router.put('/:taskId', TaskController.updateTask);

// Delete a task
router.delete('/:taskId', TaskController.deleteTask);

// Resend reminder email for a task (non-blocking)
router.post('/:taskId/resend-email', TaskController.resendEmail);

module.exports = router;
