const express = require('express');
const OrganizerTaskController = require('../controllers/OrganizerTaskController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// GET /organizer/tasks/submitted - list submitted tasks for meetings the organizer owns
router.get('/tasks/submitted', OrganizerTaskController.getSubmittedTasks);

// PATCH /organizer/tasks/:taskId/approve - approve task (submitted -> completed)
router.patch('/tasks/:taskId/approve', OrganizerTaskController.approveTask);

// PATCH /organizer/tasks/:taskId/reject - reject task (submitted -> in_progress) with optional reason
router.patch('/tasks/:taskId/reject', OrganizerTaskController.rejectTask);
router.get('/task-attachments/:attachmentId/download', OrganizerTaskController.downloadTaskAttachment);

module.exports = router;
