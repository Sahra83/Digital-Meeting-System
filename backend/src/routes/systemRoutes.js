const express = require('express');
const systemController = require('../controllers/systemController');

console.log('--- Registering System Routes ---');
const router = express.Router();

router.get('/overview', systemController.getOverview);

module.exports = router;
