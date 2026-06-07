const db = require('../src/config/db');

async function migrate() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS external_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        fullname VARCHAR(120) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(40),
        organization VARCHAR(120),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ext_participants_meeting 
      ON external_participants(meeting_id);
    `);
    console.log('✅ external_participants table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
