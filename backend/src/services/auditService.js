const db = require('../config/db');

async function recordActivity({ userId = null, action, entityType, entityId = null, metadata = {} }) {
  await db.query(
    `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [userId, action, entityType, entityId, metadata],
  );
}

module.exports = {
  recordActivity,
};
