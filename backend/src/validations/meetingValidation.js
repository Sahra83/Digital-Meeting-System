const { body } = require('express-validator');

const meetingValidation = [
  body('title').trim().notEmpty().withMessage('Meeting title is required')
    .isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),

  body('agenda').optional({ checkFalsy: true }).trim(),

  body('location').optional({ checkFalsy: true }).trim()
    .isLength({ max: 255 }).withMessage('Location must be less than 255 characters'),

  body('meeting_date')
    .notEmpty().withMessage('Meeting date is required')
    .isDate().withMessage('Invalid meeting date')
    .custom((value, { req }) => {
      // Only enforce 'no past dates' for new meetings (POST)
      // For updates (PUT), we allow existing meetings to remain in the past
      if (req.method.toUpperCase() === 'POST') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value);
        if (selectedDate < today) {
          throw new Error('Meeting date cannot be in the past');
        }
      }
      return true;
    }),

  body('meeting_time')
    .notEmpty().withMessage('Meeting time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage('Invalid meeting time format (HH:MM or HH:MM:SS)')
    .custom((value, { req }) => {
      // Only enforce 'future time' for new meetings (POST)
      if (req.method.toUpperCase() === 'POST') {
        const { meeting_date } = req.body;
        const today = new Date();
        const selectedDate = new Date(meeting_date);
        if (selectedDate.toDateString() === today.toDateString()) {
          const [hours, minutes] = value.split(':').map(Number);
          const selectedTime = new Date(today);
          selectedTime.setHours(hours, minutes, 0, 0);
          if (selectedTime <= today) {
            throw new Error('Meeting time must be in the future for today');
          }
        }
      }
      return true;
    }),

  body('participants').optional().isArray().withMessage('Participants must be an array of user IDs'),
  body('participants.*').optional().isUUID().withMessage('Invalid participant user ID'),

  // ── New participant inline registration validation ──
  body('newParticipant.fullname')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .trim().notEmpty().withMessage('Participant full name is required')
    .isLength({ max: 120 }).withMessage('Full name must be less than 120 characters'),

  body('newParticipant.createLogin')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .optional()
    .isBoolean().withMessage('Create login must be true or false')
    .toBoolean(),

  body('newParticipant.roleId')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Participant role is invalid'),

  body('newParticipant.username')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .trim()
    .custom((value, { req }) => {
      if (req.body.newParticipant?.createLogin && !value) {
        throw new Error('Participant username is required when login access is enabled');
      }
      if (value && (value.length < 3 || value.length > 80)) {
        throw new Error('Username must be between 3 and 80 characters');
      }
      return true;
    }),

  body('newParticipant.email')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .custom((value, { req }) => {
      if (!req.body.newParticipant?.createLogin && !value) {
        throw new Error('Participant email is required when login access is disabled');
      }
      return true;
    })
    .bail()
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Participant email must be a valid email address')
    .normalizeEmail(),

  body('newParticipant.phone')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .optional({ checkFalsy: true })
    .trim().isLength({ max: 40 }).withMessage('Phone number is too long'),

  body('newParticipant.password')
    .if(body('newParticipant').exists({ checkNull: true, checkFalsy: true }))
    .custom((value, { req }) => {
      if (req.body.newParticipant?.createLogin && !value) {
        throw new Error('Participant password is required when login access is enabled');
      }
      if (value && value.length < 4) {
        throw new Error('Participant password must be at least 4 characters');
      }
      return true;
    }),
];

module.exports = { meetingValidation };
