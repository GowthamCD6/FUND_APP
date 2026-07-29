const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyWhatsAppFeatures() {
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
    console.log('Modifying chat_rooms table columns...');
    
    // Modify column ENUM values to include 'group' and 'community'
    await connection.query(`
      ALTER TABLE chat_rooms 
      MODIFY COLUMN type ENUM('group_broadcast', 'private', 'group', 'community') NOT NULL;
    `);
    console.log('Updated chat_rooms type ENUM.');

    // Helper function to check if a column exists
    const columnExists = async (table, column) => {
      const [rows] = await connection.query(`
        SHOW COLUMNS FROM \`${table}\` LIKE ?
      `, [column]);
      return rows.length > 0;
    };

    // Add name column if not exists
    if (!(await columnExists('chat_rooms', 'name'))) {
      await connection.query(`
        ALTER TABLE chat_rooms ADD COLUMN name VARCHAR(255) DEFAULT NULL;
      `);
      console.log('Added name column to chat_rooms.');
    }

    // Add avatar column if not exists
    if (!(await columnExists('chat_rooms', 'avatar'))) {
      await connection.query(`
        ALTER TABLE chat_rooms ADD COLUMN avatar TEXT DEFAULT NULL;
      `);
      console.log('Added avatar column to chat_rooms.');
    }

    // Add description column if not exists
    if (!(await columnExists('chat_rooms', 'description'))) {
      await connection.query(`
        ALTER TABLE chat_rooms ADD COLUMN description TEXT DEFAULT NULL;
      `);
      console.log('Added description column to chat_rooms.');
    }

    // Add parent_room_id column if not exists
    if (!(await columnExists('chat_rooms', 'parent_room_id'))) {
      await connection.query(`
        ALTER TABLE chat_rooms 
        ADD COLUMN parent_room_id BIGINT(20) UNSIGNED DEFAULT NULL;
      `);
      await connection.query(`
        ALTER TABLE chat_rooms
        ADD CONSTRAINT FK_chat_rooms_parent FOREIGN KEY (parent_room_id) REFERENCES chat_rooms(id) ON DELETE SET NULL;
      `);
      console.log('Added parent_room_id column and foreign key to chat_rooms.');
    }

    console.log('Creating chat_room_members table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_room_members (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        room_id BIGINT(20) UNSIGNED NOT NULL,
        user_id BIGINT(20) UNSIGNED NOT NULL,
        role ENUM('Admin', 'Member') DEFAULT 'Member',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_room_user (room_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('chat_room_members table ready.');

    console.log('Creating starred_messages table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS starred_messages (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT(20) UNSIGNED NOT NULL,
        message_id BIGINT(20) UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_message (user_id, message_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('starred_messages table ready.');

    // Add source_room_id to chat_messages if not exists
    if (!(await columnExists('chat_messages', 'source_room_id'))) {
      await connection.query(`
        ALTER TABLE chat_messages 
        ADD COLUMN source_room_id BIGINT(20) UNSIGNED DEFAULT NULL;
      `);
      await connection.query(`
        ALTER TABLE chat_messages
        ADD CONSTRAINT FK_chat_messages_source FOREIGN KEY (source_room_id) REFERENCES chat_rooms(id) ON DELETE SET NULL;
      `);
      console.log('Added source_room_id column and foreign key to chat_messages.');
    }

    console.log('WhatsApp features schema applied successfully!');
  } catch (error) {
    console.error('Error applying schema extensions:', error);
  } finally {
    await connection.end();
  }
}

applyWhatsAppFeatures();
