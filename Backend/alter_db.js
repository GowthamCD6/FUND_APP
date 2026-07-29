require('dotenv').config();
const db = require('./src/config/db');

async function run() {
    try {
        console.log("Checking if avatar column exists...");
        const [columns] = await db.promise().query("SHOW COLUMNS FROM `groups` LIKE 'avatar'");
        
        if (columns.length === 0) {
            console.log("Adding avatar column to groups table...");
            await db.promise().query("ALTER TABLE `groups` ADD COLUMN avatar MEDIUMTEXT DEFAULT NULL");
            console.log("Avatar column added successfully!");
        } else {
            console.log("Avatar column already exists.");
        }
    } catch (e) {
        console.error("Error updating database:", e);
    } finally {
        process.exit(0);
    }
}

run();