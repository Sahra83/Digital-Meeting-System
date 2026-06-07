const { Pool } = require('pg');
require('dotenv').config();

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE || 'digital_meeting_minutes',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    };

const pool = new Pool({
  ...connectionConfig,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  statement_timeout: 10000, // 10 seconds timeout to prevent hanging
});

// Test the database connection
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL Database connection error:', err.message);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
