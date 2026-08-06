const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyAuctionBidsSchema() {
  console.log('Connecting to database to add group_auction_bids table...');
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
    console.log('1. Creating group_auction_bids table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS group_auction_bids (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        auction_id BIGINT(20) UNSIGNED NOT NULL,
        user_id BIGINT(20) UNSIGNED NOT NULL,
        bid_amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_gab_auction FOREIGN KEY (auction_id) REFERENCES group_auctions(id) ON DELETE CASCADE,
        CONSTRAINT fk_gab_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   group_auction_bids table verified/created.');

    console.log('Database schema for auction bids applied successfully!');
  } catch (error) {
    console.error('Error applying auction bids database schema:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

applyAuctionBidsSchema();
