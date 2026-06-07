const express = require('express');
const authRoutes = require('./authRoutes');
const systemRoutes = require('./systemRoutes');
const userRoutes = require('./userRoutes');
const meetingRoutes = require('./meetingRoutes');
const participantRoutes = require('./participantRoutes');
const organizerTaskRoutes = require('./organizerTaskRoutes');
const meetingDocumentRoutes = require('./meetingDocumentRoutes');
const taskRoutes = require('./taskRoutes');
const collaborationRoutes = require('./collaborationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/system', systemRoutes);
router.use('/users', userRoutes);
router.use('/meetings', meetingRoutes);
router.use('/participant', participantRoutes);
router.use('/organizer', organizerTaskRoutes);
router.use('/meeting-documents', meetingDocumentRoutes);
router.use('/tasks', taskRoutes); // Register task routes
router.use('/collaboration', collaborationRoutes);

module.exports = router;
