const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSetup() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'setup.sql'), 'utf8');
  try {
    console.log('Running setup.sql...');
    await pool.query(sql);
    console.log('Database updated successfully.');
  } catch (err) {
    console.error('Error running setup.sql:', err);
  } finally {
    await pool.end();
  }
}

runSetup();
