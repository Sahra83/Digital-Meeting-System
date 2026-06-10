const { body } = require('express-validator');

const userValidation = [
  body('fullname').trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters'),
  body('username').trim().isLength({ min: 3, max: 80 }).withMessage('Username must be between 3 and 80 characters'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('roleId').isInt({ min: 1 }).withMessage('Role is required'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Phone must be 40 characters or fewer'),
];

const userUpdateValidation = [
  body('fullname').trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters'),
  body('username').trim().isLength({ min: 3, max: 80 }).withMessage('Username must be between 3 and 80 characters'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('roleId').isInt({ min: 1 }).withMessage('Role is required'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Phone must be 40 characters or fewer'),
];

const profileValidation = [
  body('fullname').trim().isLength({ min: 2, max: 120 }).withMessage('Full name must be between 2 and 120 characters'),
  body('username').optional({ checkFalsy: true }).trim().isLength({ min: 3, max: 80 }).withMessage('Username must be between 3 and 80 characters'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Phone must be 40 characters or fewer'),
  body('currentPassword').if(body('newPassword').exists({ checkFalsy: true })).notEmpty().withMessage('Current password is required'),
  body('newPassword').optional({ checkFalsy: true }).isLength({ min: 4 }).withMessage('New password must be at least 4 characters'),
];

module.exports = {
  profileValidation,
  userValidation,
  userUpdateValidation,
};
