const express = require('express');
const MeetingController = require('../controllers/MeetingController');
const MeetingMinutesController = require('../controllers/MeetingMinutesController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');
const { meetingValidation } = require('../validations/meetingValidation');

console.log('--- Registering Meeting Routes ---');
const router = express.Router();

// All meeting routes require authentication
router.use(authenticate);

router.get('/dashboard', authorize('Admin'), MeetingController.dashboard);
router.get('/reports/dashboard', authorize('Admin'), MeetingController.dashboard);

router.get('/:meetingId/participants', MeetingMinutesController.getParticipants);
router.get('/:meetingId/minutes', MeetingMinutesController.get);
router.get('/:meetingId/minutes/versions', MeetingMinutesController.versions);
router.post('/:meetingId/minutes/versions/:versionId/restore', MeetingMinutesController.restoreVersion);
router.get('/:meetingId/report', MeetingMinutesController.exportReport);
router.post('/:meetingId/minutes', MeetingMinutesController.create);
router.put('/:meetingId/minutes', MeetingMinutesController.update);
router.post('/:meetingId/minutes/notify', MeetingMinutesController.notify);

// Only ADMIN users can access meeting scheduling management
router.use(authorize('Admin'));

router.get('/', MeetingController.getAll);
router.get('/:id', MeetingController.getOne);
router.post('/', meetingValidation, validateRequest, MeetingController.create);
router.put('/:id', meetingValidation, validateRequest, MeetingController.update);
router.delete('/:id', MeetingController.delete);

module.exports = router;
