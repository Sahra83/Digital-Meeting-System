const authService = require('../services/authService');
const { recordUserLog } = require('../services/auditService');

async function login(req, res, next) {
  console.log(`[AUTH] Login attempt for user: ${req.body.username}`);
  try {
    const result = await authService.login(req.body.username, req.body.password);
    await recordUserLog({
      actor: result.user,
      action: 'login_success',
      entityType: 'user',
      entityId: result.user.id,
      targetUser: result.user,
      details: `Login successful for ${result.user.username}`,
      req,
    });
    res.json(result);
  } catch (error) {
    await recordUserLog({
      action: 'login_failed',
      entityType: 'user',
      details: `Login failed for ${req.body.username || 'unknown user'}`,
      metadata: { username: req.body.username || null },
      req,
    });
    next(error);
  }
}

async function session(req, res) {
  res.json({ user: req.user });
}

async function logout(req, res, next) {
  try {
    await recordUserLog({
      actor: req.user,
      action: 'logout',
      entityType: 'user',
      entityId: req.user.id,
      targetUser: req.user,
      details: `Logout for ${req.user.username}`,
      req,
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  session,
};
