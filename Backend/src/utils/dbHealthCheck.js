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
    ];

    const existingTables = new Set(tables.map(t => t.TABLE_NAME));
    const missingTables = requiredTables.filter(t => !existingTables.has(t));

    if (missingTables.length > 0) {
      console.error(`❌ Missing required tables: ${missingTables.join(', ')}`);
      await connection.end();
      process.exit(1);
    }

    await connection.end();

    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = checkAndInitializeDatabase;
