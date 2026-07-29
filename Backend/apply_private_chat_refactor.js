const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyPrivateChatRefactor() {
  console.log('Connecting to database for private chat refactoring...');
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
    // Helper function to check if a column exists
    const columnExists = async (table, column) => {
      const [rows] = await connection.query(`
        SHOW COLUMNS FROM \`${table}\` LIKE ?
      `, [column]);
      return rows.length > 0;
    };

    console.log('1. Creating table backups...');
    await connection.query(`CREATE TABLE IF NOT EXISTS chat_rooms_backup LIKE chat_rooms;`);
    await connection.query(`INSERT IGNORE INTO chat_rooms_backup SELECT * FROM chat_rooms;`);
    
    await connection.query(`CREATE TABLE IF NOT EXISTS chat_room_members_backup LIKE chat_room_members;`);
    await connection.query(`INSERT IGNORE INTO chat_room_members_backup SELECT * FROM chat_room_members;`);
    
    await connection.query(`CREATE TABLE IF NOT EXISTS chat_messages_backup LIKE chat_messages;`);
    await connection.query(`INSERT IGNORE INTO chat_messages_backup SELECT * FROM chat_messages;`);
    console.log('   Backups created.');

    console.log('2. Adding audit columns to chat_rooms...');
    if (!(await columnExists('chat_rooms', 'updated_at'))) {
      await connection.query(`
        ALTER TABLE chat_rooms 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
      `);
      console.log('   Added updated_at to chat_rooms.');
    }

    console.log('3. Creating private_conversations table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS private_conversations (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user1 BIGINT(20) UNSIGNED NOT NULL,
        user2 BIGINT(20) UNSIGNED NOT NULL,
        room_id BIGINT(20) UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_private_chat (user1, user2),
        FOREIGN KEY (user1) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user2) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   private_conversations table created.');

    console.log('4. Migrating existing private rooms to private_conversations...');
    // Finding unique user pairs for existing private rooms
    const [existingPrivateRooms] = await connection.query(`
      SELECT cr.id as room_id, cr.user_id as user2, cm.user_id as user1
      FROM chat_rooms cr
      JOIN chat_room_members cm ON cr.id = cm.room_id
      WHERE cr.type = 'private' AND cr.user_id IS NOT NULL AND cm.user_id != cr.user_id
    `);

    let migratedCount = 0;
    for (const room of existingPrivateRooms) {
      const u1 = Math.min(room.user1, room.user2);
      const u2 = Math.max(room.user1, room.user2);
      
      try {
        await connection.query(
          `INSERT IGNORE INTO private_conversations (user1, user2, room_id) VALUES (?, ?, ?)`,
          [u1, u2, room.room_id]
        );
        migratedCount++;
      } catch (err) {
        console.warn(`Could not migrate room ${room.room_id} for users ${u1}, ${u2}: ${err.message}`);
      }
    }
    console.log(`   Migrated ${migratedCount} existing private conversations.`);

    console.log('5. Enhancing chat_room_members...');
    if (!(await columnExists('chat_room_members', 'joined_at'))) {
      await connection.query(`ALTER TABLE chat_room_members ADD COLUMN joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;`);
    }

    console.log('6. Enhancing chat_messages...');
    if (!(await columnExists('chat_messages', 'message_type'))) {
      await connection.query(`ALTER TABLE chat_messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';`);
    }
    if (!(await columnExists('chat_messages', 'reply_to'))) {
      await connection.query(`ALTER TABLE chat_messages ADD COLUMN reply_to BIGINT(20) UNSIGNED DEFAULT NULL;`);
      await connection.query(`
        ALTER TABLE chat_messages 
        ADD CONSTRAINT FK_chat_messages_reply_to FOREIGN KEY (reply_to) REFERENCES chat_messages(id) ON DELETE SET NULL;
      `);
    }
    if (!(await columnExists('chat_messages', 'edited_at'))) {
      await connection.query(`ALTER TABLE chat_messages ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL;`);
    }
    if (!(await columnExists('chat_messages', 'deleted_at'))) {
      await connection.query(`ALTER TABLE chat_messages ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;`);
    }
    if (!(await columnExists('chat_messages', 'read_at'))) {
      await connection.query(`ALTER TABLE chat_messages ADD COLUMN read_at TIMESTAMP NULL DEFAULT NULL;`);
    }
    
    if (await columnExists('chat_messages', 'is_read')) {
      await connection.query(`ALTER TABLE chat_messages DROP COLUMN is_read;`);
      console.log('   Dropped is_read from chat_messages.');
    }

    console.log('7. Adding performance indexes...');
    try {
      await connection.query(`CREATE INDEX idx_chat_room_messages ON chat_messages (room_id, created_at);`);
      await connection.query(`CREATE INDEX idx_sender ON chat_messages (sender_id);`);
      await connection.query(`CREATE INDEX idx_room_members ON chat_room_members (room_id);`);
      await connection.query(`CREATE INDEX idx_room_user ON chat_room_members (user_id);`);
      await connection.query(`CREATE INDEX idx_private_users ON private_conversations (user1, user2);`);
      console.log('   Performance indexes added.');
    } catch(err) {
       console.log('   Note: Indexes might already exist. ' + err.message);
    }

    console.log('Private chat refactor schema applied successfully!');
  } catch (error) {
    console.error('Error applying private chat schema refactor:', error);
  } finally {
    await connection.end();
  }
}

applyPrivateChatRefactor();