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
    console.log('\n🔍 Checking database health on startup...\n');

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
      console.warn(`⚠️  Database '${DB_CONFIG.database}' not found!`);
      console.log('📋 Please restore the database using:');
      console.log(`   node restore-schema.js\n`);
      await connection.end();
      process.exit(1);
    }

    console.log(`✅ Database '${DB_CONFIG.database}' exists\n`);

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
      console.error(`❌ Missing ${missingTables.length} required table(s):`);
      missingTables.forEach(t => console.error(`   - ${t}`));
      console.log('\n📋 Please restore the database using:');
      console.log(`   node restore-schema.js\n`);
      await connection.end();
      process.exit(1);
    }

    console.log(`📊 All ${requiredTables.length} required tables found\n`);

    // Check table row counts
    console.log('📈 Table status:');
    for (const table of requiredTables) {
      const [result] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result[0].count;
      const icon = count > 0 ? '✅' : '⚠️ ';
      console.log(`   ${icon} ${table.padEnd(25)} ${count} rows`);
    }

    await connection.end();

    console.log('\n✅ Database health check PASSED\n');
    console.log('═'.repeat(60));
    console.log('🎉 Database is ready for use!');
    console.log('═'.repeat(60));
    console.log();

    return true;

  } catch (error) {
    console.error('\n❌ Database health check FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access Denied:');
      console.error('   - Check your DB credentials in .env file');
      console.error('   - Verify MySQL server is running');
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection Error:');
      console.error('   - MySQL server may not be running');
      console.error('   - Check host and port in .env file');
      console.error('\n   For XAMPP, start MySQL from XAMPP Control Panel');
    }
    
    process.exit(1);
  }
}

module.exports = checkAndInitializeDatabase;
