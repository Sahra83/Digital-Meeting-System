const { body } = require('express-validator');

const loginValidation = [
  body('username').isString().notEmpty().withMessage('Username is required'),
  body('password').isString().isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
];

module.exports = {
  loginValidation,
};
