const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyChatSchema() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fundapp',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com') ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    } : undefined,
  });

  try {
    console.log('Creating chat_rooms table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        type ENUM('group_broadcast', 'private') NOT NULL,
        group_id BIGINT(20) UNSIGNED DEFAULT NULL,
        user_id BIGINT(20) UNSIGNED DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating chat_messages table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        room_id BIGINT(20) UNSIGNED NOT NULL,
        sender_id BIGINT(20) UNSIGNED NOT NULL,
        sender_type ENUM('Admin', 'User') NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Checking for existing groups to retroactively create broadcast rooms...');
    const [groups] = await connection.query(`SELECT id FROM \`groups\``);
    
    for (const group of groups) {
      const [existing] = await connection.query(
        `SELECT id FROM chat_rooms WHERE type = 'group_broadcast' AND group_id = ?`,
        [group.id]
      );
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO chat_rooms (type, group_id) VALUES ('group_broadcast', ?)`,
          [group.id]
        );
        console.log(`Created broadcast room for group ID ${group.id}`);
      }
    }

    console.log('Chat schema applied successfully!');
  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    await connection.end();
  }
}

applyChatSchema();
