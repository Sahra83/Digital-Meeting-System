const bcrypt = require('bcrypt');
const db = require('../src/config/db');

/**
 * Migration script to hash any plain-text passwords in the database.
 * Detects bcrypt hashes to prevent double-hashing.
 */
async function hashPasswords() {
  try {
    console.log('--- Password Hashing Script Started ---');
    
    // 1. Fetch all users
    const result = await db.query('SELECT id, username, password FROM users');
    const users = result.rows;
    console.log(`Found ${users.length} users in the database.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // 3. Check if password already hashed
      // Bcrypt hashes typically start with $2b$ and are 60 chars long
      const isAlreadyHashed = typeof user.password === 'string' && (
        user.password.startsWith('$2a$') || 
        user.password.startsWith('$2b$') || 
        user.password.startsWith('$2y$')
      ) && user.password.length === 60;

      if (isAlreadyHashed) {
        skippedCount++;
        continue;
      }

      // 4. Hash plain passwords
      console.log(`Hashing password for user: ${user.username}`);
      const hashedPassword = await bcrypt.hash(user.password, 12);

      // 5. Update database
      await db.query('UPDATE users SET password = $1, updated_at = now() WHERE id = $2', [hashedPassword, user.id]);
      updatedCount++;
    }

    // 6. Print success logs
    console.log('--- Migration Completed ---');
    console.log(`Successfully updated: ${updatedCount} users.`);
    console.log(`Already hashed (skipped): ${skippedCount} users.`);
    
  } catch (error) {
    console.error('--- Migration Error ---');
    console.error(error);
  } finally {
    // Close the pool so the script can exit
    await db.pool.end();
  }
}

hashPasswords();
