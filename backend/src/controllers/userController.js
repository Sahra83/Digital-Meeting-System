const userService = require('../services/userService');
const { recordUserLog } = require('../services/auditService');

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
    await recordUserLog({
      actor: req.user,
      action: 'user_created',
      entityType: 'user',
      entityId: user.id,
      targetUser: user,
      details: `Created user ${user.username}`,
      metadata: { role: user.role_name },
      req,
    });
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
    await recordUserLog({
      actor: req.user,
      action: 'profile_updated',
      entityType: 'user',
      entityId: user.id,
      targetUser: user,
      details: `Updated own profile ${user.username}`,
      req,
    });
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
    await recordUserLog({
      actor: req.user,
      action: 'user_updated',
      entityType: 'user',
      entityId: user.id,
      targetUser: user,
      details: `Updated user ${user.username}`,
      metadata: { role: user.role_name },
      req,
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);
    const actor = req.user.id === deletedUser.id ? { ...req.user, id: null } : req.user;
    await recordUserLog({
      actor,
      action: 'user_deleted',
      entityType: 'user',
      entityId: deletedUser.id,
      targetUser: { ...deletedUser, id: null },
      details: `Deleted user ${deletedUser.username}`,
      metadata: {
        deletedUser: {
          id: deletedUser.id,
          fullname: deletedUser.fullname,
          username: deletedUser.username,
          role: deletedUser.role_name,
        },
      },
      req,
    });
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
