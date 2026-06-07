const db = require('./config/db');

async function run() {
  try {
    console.log('Altering users table to add block_reason...');
    await db.promise().query('ALTER TABLE users ADD COLUMN block_reason VARCHAR(255) DEFAULT NULL');
    console.log('Altered successfully!');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column block_reason already exists.');
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

run();
