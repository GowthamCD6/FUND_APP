#!/usr/bin/env node
/**
 * FundApp Database Setup Script
 * Creates database schema automatically and ensures MySQL is running
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('', 'reset');
  log('╔════════════════════════════════════════════════════╗', 'cyan');
  log(`║  ${title.padEnd(48)}║`, 'cyan');
  log('╚════════════════════════════════════════════════════╝', 'cyan');
  log('', 'reset');
}

async function main() {
  logSection('FundApp Database Setup');

  const SQL_FILE = path.join(__dirname, 'CREATE_FUNDAPP_DATABASE.sql');

  // Check if SQL file exists
  if (!fs.existsSync(SQL_FILE)) {
    log('❌ SQL file not found: ' + SQL_FILE, 'red');
    process.exit(1);
  }

  log('📋 Reading SQL schema file...', 'yellow');
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  log(`📋 Found ${statements.length} SQL statements`, 'green');
  log('', 'reset');

  // Test connection
  log('🔗 Step 1: Testing MySQL connection...', 'yellow');
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: undefined, // No database selected initially
      port: parseInt(process.env.DB_PORT) || 3306,
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com') ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      } : undefined,
    });

    log('✅ MySQL connection successful!', 'green');
  } catch (error) {
    log('❌ MySQL connection failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('', 'reset');
    log('Troubleshooting:', 'yellow');
    log('  1. Is MySQL running? Check Services (Windows) or use: sudo systemctl status mysql', 'yellow');
    log('  2. Check credentials in .env file', 'yellow');
    log('  3. Verify host/port: ' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || '3306'), 'yellow');
    log('', 'reset');
    process.exit(1);
  }

  // Create database and tables
  log('🔄 Step 2: Creating database schema...', 'yellow');
  log('', 'reset');

  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.query(statement + ';');
          
          // Extract statement type for logging
          const type = statement.split(/\s+/)[0].toUpperCase();
          const name = statement.match(/(?:TABLE|DATABASE)\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
          const objName = name ? name[1] : 'object';
          
          log(`  ✅ ${type}: ${objName}`, 'green');
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists')) {
            const type = statement.split(/\s+/)[0].toUpperCase();
            const name = statement.match(/(?:TABLE|DATABASE)\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
            const objName = name ? name[1] : 'object';
            log(`  ℹ️  ${type}: ${objName} (already exists)`, 'yellow');
          } else {
            log(`  ❌ Error executing statement ${i + 1}:`, 'red');
            log(`      ${err.message}`, 'red');
            throw err;
          }
        }
      }
    }

    log('', 'reset');
    logSection('✅ Setup Complete!');

    log('Database created successfully!', 'green');
    log('', 'reset');
    log('Your database schema is now created and will persist in MySQL.', 'cyan');
    log('', 'reset');
    log('Next steps:', 'yellow');
    log('  1. Start the backend server: node server.js', 'cyan');
    log('  2. Test login from the mobile app', 'cyan');
    log('', 'reset');

  } catch (error) {
    log('', 'reset');
    log('❌ Setup failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('', 'reset');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
