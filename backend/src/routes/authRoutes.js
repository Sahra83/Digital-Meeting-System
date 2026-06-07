const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');
const { loginValidation } = require('../validations/authValidation');

console.log('--- Registering Auth Routes ---');
const router = express.Router();

router.post('/login', loginValidation, validateRequest, authController.login);
router.get('/session', authenticate, authController.session);

module.exports = router;
