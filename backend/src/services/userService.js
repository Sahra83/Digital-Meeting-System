const bcrypt = require('bcrypt');
const db = require('../config/db');
const userQueries = require('../queries/userQueries');
const ApiError = require('../utils/apiError');

async function findUserByUsername(username) {
  const result = await db.query(userQueries.findByUsername, [username]);
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  if (!email) return null;
  const result = await db.query(userQueries.findByEmail, [email]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await db.query(userQueries.findById, [id]);
  return result.rows[0] || null;
}

async function getPasswordHashByUsername(username) {
  const result = await db.query('SELECT id, password FROM users WHERE lower(username) = lower($1)', [username]);
  return result.rows[0] || null;
}

async function listUsers() {
  const result = await db.query(userQueries.listUsers);
  return result.rows;
}

async function listRoles() {
  const result = await db.query(userQueries.listRoles);
  return result.rows;
}

async function createUser(payload) {
  console.log(
    `[userService] Creating user "${payload.fullname}" with username "${payload.username}" and email "${payload.email || 'no email'}"`
  );

  const existingUser = await findUserByUsername(payload.username);
  if (existingUser) {
    console.error(`[userService] Failed: username already exists "${payload.username}"`);
    throw new ApiError(409, 'A user with this username already exists');
  }

  try {
    const passwordHash = await bcrypt.hash(payload.password, 12);
    const result = await db.query(
      `
        INSERT INTO users (fullname, username, email, password, phone, role_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        payload.fullname,
        payload.username,
        payload.email ? payload.email.toLowerCase() : null,
        passwordHash,
        payload.phone || null,
        payload.roleId,
      ],
    );

    console.log(`[userService] User created successfully: ${result.rows[0].id}`);
    return findUserById(result.rows[0].id);
  } catch (err) {
    console.error('[userService] Failed to create user:', {
      fullname: payload.fullname,
      username: payload.username,
      email: payload.email || null,
      roleId: payload.roleId,
      message: err.message,
      code: err.code,
      detail: err.detail,
    });
    throw err;
  }
}

async function updateProfile(userId, payload) {
  await db.query(
    `
      UPDATE users
      SET fullname = $1,
          phone = $2,
          email = $3,
          updated_at = now()
      WHERE id = $4
    `,
    [
      payload.fullname,
      payload.phone || null,
      payload.email ? payload.email.toLowerCase() : null,
      userId
    ],
  );

  return findUserById(userId);
}

async function updateUser(userId, payload) {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // If username is changing, check if it's already taken
  if (payload.username && payload.username.toLowerCase() !== user.username.toLowerCase()) {
    const existingUser = await findUserByUsername(payload.username);
    if (existingUser) {
      throw new ApiError(409, 'A user with this username already exists');
    }
  }

  let passwordHash = user.password;
  if (payload.password && payload.password.trim().length >= 4) {
    passwordHash = await bcrypt.hash(payload.password, 12);
  }

  // Double check we have a password hash (fallback to existing if user.password was missing)
  if (!passwordHash) {
    const fullUser = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    passwordHash = fullUser.rows[0]?.password;
  }

  await db.query(
    `
      UPDATE users
      SET fullname = $1,
          phone = $2,
          email = $3,
          username = $4,
          password = $5,
          role_id = $6,
          updated_at = now()
      WHERE id = $7
    `,
    [
      payload.fullname !== undefined ? payload.fullname : user.fullname,
      payload.phone !== undefined ? payload.phone : user.phone,
      payload.email !== undefined ? (payload.email ? payload.email.toLowerCase() : null) : user.email,
      payload.username !== undefined ? payload.username : user.username,
      passwordHash,
      payload.roleId !== undefined ? payload.roleId : user.role_id,
      userId,
    ],
  );

  return findUserById(userId);
}

async function deleteUser(userId) {
  console.log(`[userService] Starting deletion for user: ${userId}`);
  try {
    // 1. Manually remove from meeting_participants to be safe
    console.log(`[userService] Deleting from meeting_participants...`);
    await db.query('DELETE FROM meeting_participants WHERE user_id = $1', [userId]);

    // 2. Remove any meetings where this user is the organizer
    console.log(`[userService] Deleting from meetings (organizer)...`);
    await db.query('DELETE FROM meetings WHERE organizer_id = $1', [userId]);

    // 3. Delete the user
    console.log(`[userService] Deleting from users...`);
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

    if (result.rowCount === 0) {
      console.log(`[userService] User not found: ${userId}`);
      throw new ApiError(404, 'User not found');
    }

    console.log(`[userService] User deleted successfully: ${userId}`);
    return true;
  } catch (err) {
    console.error(`[userService] Error in deleteUser for ${userId}:`, err);
    throw err;
  }
}

async function getParticipation(userId) {
  const query = `
    SELECT DISTINCT m.title
    FROM meetings m
    LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
    WHERE mp.user_id = $1 OR m.organizer_id = $1
  `;
  const result = await db.query(query, [userId]);
  return result.rows.map(r => r.title);
}

module.exports = {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  getParticipation,
  getPasswordHashByUsername,
  listRoles,
  listUsers,
  updateProfile,
  updateUser,
};
