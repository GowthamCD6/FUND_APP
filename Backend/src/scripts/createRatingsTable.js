require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/db');

async function run() {
    try {
        console.log('Connecting to database:', process.env.DB_HOST);
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS app_ratings (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                rating INT NOT NULL,
                feedback TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_app_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('🎉 SUCCESS! Table app_ratings created successfully in database:', process.env.DB_NAME);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating table app_ratings:', err);
        process.exit(1);
    }
}

run();
