require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/db');

async function run() {
    try {
        console.log('Connecting to database:', process.env.DB_HOST);
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL UNIQUE,
                language VARCHAR(10) DEFAULT 'en',
                security_enabled TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_user_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('🎉 SUCCESS! Table user_preferences created successfully in database:', process.env.DB_NAME);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating table user_preferences:', err);
        process.exit(1);
    }
}

run();
