const db = require('../config/db');

/**
 * Get or create the global "GDK Community" chat room.
 * When first created, all existing active users are bulk-added as members.
 * Returns the community room ID.
 */
async function getOrCreateGlobalCommunity() {
    // Check if community room already exists
    const [existing] = await db.promise().query(
        "SELECT id FROM chat_rooms WHERE type = 'community' AND name = 'GDK Community' LIMIT 1"
    );

    if (existing.length > 0) {
        return existing[0].id;
    }

    // Create the community room
    const [result] = await db.promise().query(
        "INSERT INTO chat_rooms (type, name, description, avatar) VALUES ('community', 'GDK Community', 'Welcome to GDK Community! Stay updated with group announcements and invites.', '🌐')"
    );
    const communityId = result.insertId;

    // Bulk-add all existing active users as members
    const [allUsers] = await db.promise().query(
        "SELECT id, role FROM users WHERE deleted_at IS NULL AND is_active = 1"
    );

    if (allUsers.length > 0) {
        const values = allUsers.map(u => [communityId, u.id, u.role === 'Admin' ? 'Admin' : 'Member']);
        await db.promise().query(
            'INSERT IGNORE INTO chat_room_members (room_id, user_id, role) VALUES ?',
            [values]
        );
    }

    console.log(`✅ Global Community room created (ID: ${communityId}) with ${allUsers.length} members`);
    return communityId;
}

/**
 * Add a single user to the global community room.
 * Safe to call even if the user is already a member (uses INSERT IGNORE).
 */
async function addUserToGlobalCommunity(userId, role = 'Member') {
    try {
        const communityId = await getOrCreateGlobalCommunity();
        await db.promise().query(
            'INSERT IGNORE INTO chat_room_members (room_id, user_id, role) VALUES (?, ?, ?)',
            [communityId, userId, role]
        );
        return communityId;
    } catch (error) {
        console.error('Error adding user to global community:', error);
        // Non-fatal — don't break registration/addUser flow
        return null;
    }
}

module.exports = { getOrCreateGlobalCommunity, addUserToGlobalCommunity };
