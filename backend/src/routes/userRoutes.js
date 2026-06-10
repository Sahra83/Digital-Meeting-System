const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');
const { profileValidation, userValidation, userUpdateValidation } = require('../validations/userValidation');

console.log('--- Registering User Routes ---');
const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getProfile);
router.put('/me', profileValidation, validateRequest, userController.updateProfile);
router.get('/roles', authorize('Admin'), userController.listRoles);
router.get('/logs', authorize('Admin'), userController.listUserLogs);
router.get('/', authorize('Admin'), userController.listUsers);
router.post('/', authorize('Admin'), userValidation, validateRequest, userController.createUser);
router.put('/:id', authorize('Admin'), userUpdateValidation, validateRequest, userController.updateUser);
router.get('/:id/participation', authorize('Admin'), userController.getUserParticipation);
router.delete('/:id', authorize('Admin'), userController.deleteUser);

module.exports = router;
