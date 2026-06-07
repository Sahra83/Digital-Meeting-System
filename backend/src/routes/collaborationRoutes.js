// src/routes/collaborationRoutes.js
const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const collaborationController = require('../controllers/collaborationController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List comments for a meeting (optional item filters)
router.get('/:meetingId/comments', collaborationController.listComments);

// CRUD for individual comments
router.get('/comments/:id', collaborationController.getComment);
router.post('/:meetingId/comments', collaborationController.createComment);
router.put('/comments/:id', collaborationController.updateComment);
router.delete('/comments/:id', collaborationController.deleteComment);

module.exports = router;
