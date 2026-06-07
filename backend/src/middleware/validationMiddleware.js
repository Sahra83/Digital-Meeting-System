const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new ApiError(422, 'Validation failed', errors.array()));
    return;
  }

  next();
}

module.exports = validateRequest;
