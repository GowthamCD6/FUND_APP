const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyAuctionSchema() {
  console.log('Connecting to database for live auction schema updates...');
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
    console.log('1. Creating group_auctions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS group_auctions (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        group_id BIGINT(20) UNSIGNED NOT NULL,
        auction_type ENUM('betting', 'random') NOT NULL,
        initial_amount DECIMAL(12,2) NOT NULL,
        duration INT(11) NOT NULL DEFAULT 300,
        status ENUM('setup', 'active', 'paused', 'ended') NOT NULL DEFAULT 'setup',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_group_auctions_group FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   group_auctions table verified/created.');

    console.log('2. Creating group_auction_participants table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS group_auction_participants (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        auction_id BIGINT(20) UNSIGNED NOT NULL,
        user_id BIGINT(20) UNSIGNED NOT NULL,
        joined_status ENUM('pending', 'joined') NOT NULL DEFAULT 'pending',
        joined_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_auction_user (auction_id, user_id),
        CONSTRAINT fk_gap_auction FOREIGN KEY (auction_id) REFERENCES group_auctions(id) ON DELETE CASCADE,
        CONSTRAINT fk_gap_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   group_auction_participants table verified/created.');

    console.log('Database schema for live auctions applied successfully!');
  } catch (error) {
    console.error('Error applying live auction database schema:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

applyAuctionSchema();
