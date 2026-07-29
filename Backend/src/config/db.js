const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 20,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  timezone: 'Z', // Set connection time_zone to UTC (+00:00) and parse DATETIME as UTC
  // IMPORTANT: Do NOT add any cleanup SQL here that would delete tables or database!
  // The database should persist between sessions
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com') ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : undefined,
  port: process.env.DB_PORT, 
});

// Test connection on initialization
connection.getConnection((err, conn) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('❌ Database connection error: Connection lost');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('❌ Database connection error: Too many connections');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ Database connection error: Access denied - check credentials');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('❌ Database connection error: Unknown database -', process.env.DB_NAME);
    } else {
      console.error("❌ Database connection error:", err.message || err);
    }
  } else {
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    conn.release();
  }
});

module.exports = connection;