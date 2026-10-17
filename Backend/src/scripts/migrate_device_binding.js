const db = require('../config/db');

async function run() {
  try {
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN bound_device_id VARCHAR(255) NULL',
      'ALTER TABLE users ADD COLUMN device_name VARCHAR(255) NULL',
      'ALTER TABLE users ADD COLUMN device_platform VARCHAR(50) NULL',
      'ALTER TABLE users ADD COLUMN device_model VARCHAR(100) NULL',
      'ALTER TABLE users ADD COLUMN device_bound_at TIMESTAMP NULL',
      'ALTER TABLE users ADD COLUMN device_last_login TIMESTAMP NULL',
      "ALTER TABLE users ADD COLUMN device_status ENUM('UNBOUND', 'BOUND', 'REVOKED') NOT NULL DEFAULT 'UNBOUND'"
    ];

    for (const q of alterQueries) {
      try {
        await db.promise().query(q);
        console.log('Executed:', q);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log('Column already exists, skipped.');
        } else {
          console.error('Error on query:', q, e.message);
        }
      }
    }

    const createLogTable = `
      CREATE TABLE IF NOT EXISTS device_revocation_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        revoked_device_id VARCHAR(255) NULL,
        revoked_device_name VARCHAR(255) NULL,
        revoked_by BIGINT UNSIGNED NULL,
        reason VARCHAR(255) NULL,
        revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_drl_user (user_id),
        CONSTRAINT fk_drl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await db.promise().query(createLogTable);
    console.log('device_revocation_logs table ready.');

    const [cols] = await db.promise().query("SHOW COLUMNS FROM users LIKE '%device%'");
    console.log('Users device columns in DB:', cols.map(c => c.Field));

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();