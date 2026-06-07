const ApiError = require('../utils/apiError');
const { verifyToken } = require('../utils/jwt');
const userService = require('../services/userService');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new ApiError(401, 'Authentication token is required');
    }

    const payload = verifyToken(token);
    const user = await userService.findUserById(payload.sub);

    if (!user || user.status !== 'active') {
      throw new ApiError(401, 'User account is not active');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Invalid or expired authentication token'));
      return;
    }

    next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role_name)) {
      next(new ApiError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
