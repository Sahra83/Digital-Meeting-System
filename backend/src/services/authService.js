const bcrypt = require('bcrypt');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/jwt');
const userService = require('./userService');

async function login(username, password) {
  // 1. Fetch user by username
  const authRecord = await userService.getPasswordHashByUsername(username);

  if (!authRecord) {
    throw new ApiError(401, 'Invalid username or password');
  }

  // 2. Compare hashed passwords correctly
  const passwordMatches = await bcrypt.compare(password, authRecord.password);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid username or password');
  }

  // 3. Get full user details
  const user = await userService.findUserById(authRecord.id);

  if (!user) {
    throw new ApiError(401, 'User record not found');
  }

  // 4. Generate token and return session data
  return {
    token: signToken(user),
    user: user,
  };
}

module.exports = {
  login,
};
