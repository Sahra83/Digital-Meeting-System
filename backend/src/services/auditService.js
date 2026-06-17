const db = require('../config/db');

async function ensureUserLogsTable() {
  await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_name VARCHAR(120),
      actor_username VARCHAR(80),
      actor_role VARCHAR(80),
      action VARCHAR(80) NOT NULL,
      entity_type VARCHAR(80),
      entity_id UUID,
      target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      target_username VARCHAR(80),
      details TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON user_logs(created_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_logs_actor_id ON user_logs(actor_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_logs_action ON user_logs(action)');
}

function getRequestInfo(req) {
  if (!req) {
    return { ipAddress: null, userAgent: null };
  }

  return {
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get?.('user-agent') || null,
  };
}

async function recordUserLog({
  actor = null,
  action,
  entityType = null,
  entityId = null,
  targetUser = null,
  details = null,
  metadata = {},
  req = null,
}) {
  const { ipAddress, userAgent } = getRequestInfo(req);

  try {
    await ensureUserLogsTable();
    await db.query(
      `
        INSERT INTO user_logs (
          actor_id,
          actor_name,
          actor_username,
          actor_role,
          action,
          entity_type,
          entity_id,
          target_user_id,
          target_username,
          details,
          metadata,
          ip_address,
          user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
        actor?.id || null,
        actor?.fullname || null,
        actor?.username || null,
        actor?.role_name || null,
        action,
        entityType,
        entityId,
        targetUser?.id || null,
        targetUser?.username || null,
        details,
        metadata,
        ipAddress,
        userAgent,
      ],
    );
  } catch (error) {
    console.error('[auditService] Failed to record user log:', error.message);
  }
}

async function recordActivity({ userId = null, action, entityType, entityId = null, metadata = {} }) {
  await recordUserLog({
    actor: userId ? { id: userId } : null,
    action,
    entityType,
    entityId,
    metadata,
  });
}

module.exports = {
  ensureUserLogsTable,
  recordActivity,
  recordUserLog,
};
