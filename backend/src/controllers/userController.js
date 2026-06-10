const userService = require('../services/userService');

async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function listRoles(req, res, next) {
  try {
    const roles = await userService.listRoles();
    res.json({ roles });
  } catch (error) {
    next(error);
  }
}

async function listUserLogs(req, res, next) {
  try {
    const logs = await userService.listUserLogs(req.query.limit);
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function getUserParticipation(req, res, next) {
  try {
    const meetings = await userService.getParticipation(req.params.id);
    res.json({ meetings });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  deleteUser,
  getProfile,
  getUserParticipation,
  listUserLogs,
  listRoles,
  listUsers,
  updateProfile,
  updateUser,
};
