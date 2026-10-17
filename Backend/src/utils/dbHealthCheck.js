/**
 * Database Initialization & Startup Check
 * Ensures database schema exists and is properly initialized on startup
 * Prevents data loss from accidental cleanup
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fundapp',
  port: parseInt(process.env.DB_PORT) || 3306,
};

/**
 * Check if database exists and has all required tables
 */
async function checkAndInitializeDatabase() {
  try {
    // Connect to MySQL without specifying database
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      port: DB_CONFIG.port,
      ssl: DB_CONFIG.host && DB_CONFIG.host.includes('tidbcloud.com') ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      } : undefined,
    });

    // Check if database exists
    const [databases] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [DB_CONFIG.database]
    );

    if (databases.length === 0) {
      console.error(`❌ Database '${DB_CONFIG.database}' not found!`);
      await connection.end();
      process.exit(1);
    }

    // Select the database
    await connection.query(`USE ${DB_CONFIG.database}`);

    // Ensure user_preferences table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL UNIQUE,
        language VARCHAR(10) DEFAULT 'en',
        security_enabled TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure app_ratings table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_ratings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        rating INT NOT NULL,
        feedback TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_app_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure otp_requests table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        group_id INT NOT NULL,
        group_name VARCHAR(255) NULL,
        otp_code VARCHAR(10) NOT NULL,
        status ENUM('pending', 'viewed', 'used', 'expired') DEFAULT 'pending',
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_otp_user_status (user_id, status),
        INDEX idx_otp_verify (user_id, group_id, status, expires_at),
        CONSTRAINT fk_otp_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check for required tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [DB_CONFIG.database]
    );

    const requiredTables = [
      'users',
      'groups',
      'user_grouping',
      'group_monthly_details',
      'group_auction_winners',
      'monthly_collections',
      'refresh_tokens',
      'group_settings',
      'payment_transactions',
      'audit_logs',
      'group_auctions',
      'group_auction_participants',
      'user_preferences',
      'app_ratings',
      'otp_requests',
      'system_settings',
      'device_revocation_logs',
    ];

    const existingTables = new Set(tables.map(t => t.TABLE_NAME));
    const missingTables = requiredTables.filter(t => !existingTables.has(t));

    // Ensure V5 WhatsApp columns exist (TiDB Cloud requires individual ALTER TABLE statements)
    const alterQueries = [
      "ALTER TABLE chat_messages ADD COLUMN status ENUM('SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'SENT'",
      "ALTER TABLE chat_messages ADD COLUMN delivered_at TIMESTAMP NULL DEFAULT NULL",
      "ALTER TABLE chat_messages ADD COLUMN edited TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE chat_messages ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL",
      "ALTER TABLE chat_messages ADD COLUMN is_forwarded TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE chat_messages ADD COLUMN deleted_for_everyone TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE users ADD COLUMN is_online TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE users ADD COLUMN last_seen TIMESTAMP NULL DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN bound_device_id VARCHAR(255) NULL",
      "ALTER TABLE users ADD COLUMN device_name VARCHAR(255) NULL",
      "ALTER TABLE users ADD COLUMN device_platform VARCHAR(50) NULL",
      "ALTER TABLE users ADD COLUMN device_model VARCHAR(100) NULL",
      "ALTER TABLE users ADD COLUMN device_bound_at TIMESTAMP NULL",
      "ALTER TABLE users ADD COLUMN device_last_login TIMESTAMP NULL",
      "ALTER TABLE users ADD COLUMN device_status ENUM('UNBOUND', 'BOUND', 'REVOKED') NOT NULL DEFAULT 'UNBOUND'"
    ];

    for (const q of alterQueries) {
      try {
        await connection.query(q);
      } catch (e) { /* Column may already exist */ }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        message_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        reaction VARCHAR(32) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_msg_user_react (message_id, user_id),
        CONSTRAINT fk_react_msg FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
        CONSTRAINT fk_react_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_deleted_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        message_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_del_msg (user_id, message_id),
        CONSTRAINT fk_del_usr FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_del_msg FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_chat_settings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        room_id BIGINT UNSIGNED NOT NULL,
        is_pinned TINYINT(1) NOT NULL DEFAULT 0,
        is_muted TINYINT(1) NOT NULL DEFAULT 0,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_room_stg (user_id, room_id),
        CONSTRAINT fk_stg_usr FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_stg_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS starred_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        message_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_usr_star_msg (user_id, message_id),
        CONSTRAINT fk_star_usr FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_star_msg FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_deleted_chats (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        room_id BIGINT UNSIGNED NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_usr_del_room (user_id, room_id),
        CONSTRAINT fk_del_room_usr FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_del_room_chat FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value JSON NOT NULL,
        description VARCHAR(255) NULL,
        updated_by BIGINT UNSIGNED NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
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
    `);

    await connection.end();

    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = checkAndInitializeDatabase;
