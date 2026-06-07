const authService = require('../services/authService');

async function login(req, res, next) {
  console.log(`[AUTH] Login attempt for user: ${req.body.username}`);
  try {
    const result = await authService.login(req.body.username, req.body.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function session(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  login,
  session,
};
