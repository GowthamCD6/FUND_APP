const db = require('../config/db');

// Get all chats for the logged-in user (Admin or User)
exports.getChats = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        let role = req.user.role; // 'Admin' or 'User'

        // Fallback: If role is not in token, fetch from DB
        if (!role) {
            const [userRows] = await db.promise().query('SELECT role FROM users WHERE id = ?', [userId]);
            if (userRows.length > 0) {
                role = userRows[0].role;
            } else {
                role = 'User';
            }
        }

        console.log('[chatController.getChats] userId:', userId, 'role:', role);

        if (role === 'Admin') {
            // Admin sees:
            // 1. all group_broadcast (Chit) rooms
            // 2. all private (Support) rooms
            // 3. custom groups & communities they are in (via chat_room_members)
            const sql = `
                SELECT 
                    cr.id, 
                    ANY_VALUE(cr.type) as type, 
                    ANY_VALUE(cr.group_id) as group_id, 
                    ANY_VALUE(cr.user_id) as user_id,
                    ANY_VALUE(cr.name) as room_name,
                    ANY_VALUE(cr.avatar) as room_avatar,
                    ANY_VALUE(g.group_name) as group_name,
                    ANY_VALUE(g.avatar) as group_avatar,
                    ANY_VALUE(u.name) as user_name,
                    (SELECT message FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as timestamp,
                    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.is_read = 0 AND cm.sender_id != ?) as unread
                FROM chat_rooms cr
                LEFT JOIN \`groups\` g ON cr.group_id = g.id
                LEFT JOIN users u ON cr.user_id = u.id
                LEFT JOIN chat_room_members crm ON cr.id = crm.room_id
                WHERE cr.type IN ('group_broadcast', 'private')
                   OR (cr.type IN ('group', 'community') AND crm.user_id = ?)
                GROUP BY cr.id
                ORDER BY timestamp DESC
            `;
            const [rows] = await db.promise().query(sql, [userId, userId]);

            const chats = rows.map(r => {
                let name = '';
                let avatar = '';
                if (r.type === 'group_broadcast') {
                    name = r.group_name;
                    avatar = r.group_avatar || '👥';
                } else if (r.type === 'private') {
                    name = r.user_name || 'User Support';
                    avatar = '👤';
                } else {
                    name = r.room_name;
                    avatar = r.room_avatar || (r.type === 'community' ? '📢' : '👥');
                }

                return {
                    id: r.id,
                    name: name || 'Unnamed Room',
                    lastMessage: r.lastMessage || 'No messages yet',
                    timestamp: r.timestamp || new Date(),
                    avatar: avatar,
                    unread: r.unread || 0,
                    isGroup: r.type === 'group_broadcast' || r.type === 'group' || r.type === 'community',
                    type: r.type,
                    groupId: r.group_id,
                    userId: r.user_id
                };
            });

            console.log('[chatController.getChats] Admin returning chats:', chats.length);
            return res.json({ success: true, chats });
        } else {
            // User sees:
            // 1. group broadcasts for groups they are in (via user_grouping)
            // 2. their private room with Admin Support
            // 3. custom groups & communities they are in (via chat_room_members)
            const sql = `
                SELECT 
                    cr.id, 
                    ANY_VALUE(cr.type) as type, 
                    ANY_VALUE(cr.group_id) as group_id, 
                    ANY_VALUE(cr.user_id) as user_id,
                    ANY_VALUE(cr.name) as room_name,
                    ANY_VALUE(cr.avatar) as room_avatar,
                    ANY_VALUE(g.group_name) as group_name,
                    ANY_VALUE(g.avatar) as group_avatar,
                    'Admin Support' as user_name,
                    (SELECT message FROM chat_messages cm WHERE (cm.room_id = cr.id OR (cm.source_room_id = cr.id AND cm.sender_id = ?)) ORDER BY cm.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM chat_messages cm WHERE (cm.room_id = cr.id OR (cm.source_room_id = cr.id AND cm.sender_id = ?)) ORDER BY cm.created_at DESC LIMIT 1) as timestamp,
                    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.is_read = 0 AND cm.sender_id != ?) as unread
                FROM chat_rooms cr
                LEFT JOIN \`groups\` g ON cr.group_id = g.id
                LEFT JOIN user_grouping ug ON g.id = ug.group_id
                LEFT JOIN chat_room_members crm ON cr.id = crm.room_id
                WHERE (cr.type = 'group_broadcast' AND ug.user_id = ?) 
                   OR (cr.type = 'private' AND cr.user_id = ?)
                   OR (cr.type IN ('group', 'community') AND crm.user_id = ?)
                GROUP BY cr.id
                ORDER BY timestamp DESC
            `;
            const [rows] = await db.promise().query(sql, [userId, userId, userId, userId, userId, userId]);

            const chats = rows.map(r => {
                let name = '';
                let avatar = '';
                if (r.type === 'group_broadcast') {
                    name = r.group_name;
                    avatar = r.group_avatar || '👥';
                } else if (r.type === 'private') {
                    name = 'Admin Support';
                    avatar = '👨‍💻';
                } else {
                    name = r.room_name;
                    avatar = r.room_avatar || (r.type === 'community' ? '📢' : '👥');
                }

                return {
                    id: r.id,
                    name: name || 'Unnamed Room',
                    lastMessage: r.lastMessage || 'No messages yet',
                    timestamp: r.timestamp || new Date(),
                    avatar: avatar,
                    unread: r.unread || 0,
                    isGroup: r.type === 'group_broadcast' || r.type === 'group' || r.type === 'community',
                    type: r.type,
                    groupId: r.group_id,
                    userId: r.user_id
                };
            });

            console.log('[chatController.getChats] User returning chats:', chats.length);
            return res.json({ success: true, chats });
        }
    } catch (error) {
        console.error('Error in getChats:', error);
        return res.status(500).json({ success: false, message: 'Failed to load chats' });
    }
};

// Get messages for a specific room
exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id || req.user.userId;
        const sql = `
            SELECT cm.id, cm.room_id, cm.source_room_id, cm.sender_id, cm.sender_type, cm.message, cm.created_at, u.name as sender_name,
                   (SELECT COUNT(*) FROM starred_messages sm WHERE sm.message_id = cm.id AND sm.user_id = ?) as isStarred
            FROM chat_messages cm
            LEFT JOIN users u ON cm.sender_id = u.id
            WHERE cm.room_id = ?
               OR (cm.source_room_id = ? AND cm.sender_id = ?)
            ORDER BY cm.created_at ASC
        `;
        const [messages] = await db.promise().query(sql, [userId, roomId, roomId, userId]);

        // Mark as read
        await db.promise().query(`UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_id != ?`, [roomId, userId]);

        return res.json({ success: true, messages });
    } catch (error) {
        console.error('Error in getMessages:', error);
        return res.status(500).json({ success: false, message: 'Failed to load messages' });
    }
};

// HTTP fallback for sending a message (WebSocket handles real-time)
exports.sendMessage = async (req, res) => {
    try {
        const { roomId, message } = req.body;
        const senderId = req.user.id || req.user.userId;
        let senderType = req.user.role;

        if (!senderType) {
            const [userRows] = await db.promise().query('SELECT role FROM users WHERE id = ?', [senderId]);
            if (userRows.length > 0) {
                senderType = userRows[0].role;
            } else {
                senderType = 'User';
            }
        }

        // Verify room exists
        const [roomArr] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
        if (roomArr.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        const room = roomArr[0];

        let targetRoomId = roomId;
        let sourceRoomId = null;

        // Custom Routing Logic
        // If User replies to a group broadcast, route to the main private support chat (group_id IS NULL)
        if (senderType === 'User' && room.type === 'group_broadcast') {
            const [privateRoom] = await db.promise().query('SELECT id FROM chat_rooms WHERE type = ? AND user_id = ? AND group_id IS NULL', ['private', senderId]);
            
            if (privateRoom.length > 0) {
                targetRoomId = privateRoom[0].id;
            } else {
                // Create a new main private support room
                const [insertRes] = await db.promise().query('INSERT INTO chat_rooms (type, group_id, user_id) VALUES (?, NULL, ?)', ['private', senderId]);
                targetRoomId = insertRes.insertId;
            }
            sourceRoomId = roomId;
        }

        // Save message
        const [insertMsg] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, source_room_id) VALUES (?, ?, ?, ?, ?)',
            [targetRoomId, senderId, senderType, message, sourceRoomId]
        );

        return res.json({ 
            success: true, 
            message: 'Message sent', 
            data: { id: insertMsg.insertId, roomId: targetRoomId, sourceRoomId, senderId, senderType, message, created_at: new Date() } 
        });
    } catch (error) {
        console.error('Error in sendMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Delete a message (only allowed if sender matches)
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.body;
        const userId = req.user.id || req.user.userId;

        // Verify message belongs to user
        const [msgRows] = await db.promise().query('SELECT id, sender_id FROM chat_messages WHERE id = ?', [messageId]);
        if (msgRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        if (msgRows[0].sender_id != userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        await db.promise().query('DELETE FROM chat_messages WHERE id = ?', [messageId]);

        return res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Error in deleteMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
};

// Get or Create a Private Room (1-on-1 without group)
exports.getOrCreatePrivateRoom = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        
        // Find existing pure private room (group_id IS NULL)
        const sql = `SELECT id FROM chat_rooms WHERE type = 'private' AND user_id = ? AND group_id IS NULL`;
        const [rooms] = await db.promise().query(sql, [targetUserId]);

        if (rooms.length > 0) {
            return res.json({ success: true, roomId: rooms[0].id });
        }

        // Create new room if none exists
        const [insert] = await db.promise().query(`INSERT INTO chat_rooms (type, group_id, user_id) VALUES ('private', NULL, ?)`, [targetUserId]);
        
        return res.json({ success: true, roomId: insert.insertId });
    } catch (error) {
        console.error('Error in getOrCreatePrivateRoom:', error);
        return res.status(500).json({ success: false, message: 'Failed to open private room' });
    }
};

// Update Group Avatar
exports.updateGroupAvatar = async (req, res) => {
    try {
        const { groupId, avatarBase64 } = req.body;
        if (!groupId || !avatarBase64) {
            return res.status(400).json({ success: false, message: 'groupId and avatarBase64 are required' });
        }

        const [result] = await db.promise().query(
            'UPDATE `groups` SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [avatarBase64, groupId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        return res.json({ success: true, message: 'Group avatar updated successfully' });
    } catch (error) {
        console.error('Error in updateGroupAvatar:', error);
        return res.status(500).json({ success: false, message: 'Failed to update group avatar' });
    }
};

// Create Custom Chat Group
exports.createCustomGroup = async (req, res) => {
    try {
        const { name, description, avatar, userIds } = req.body;
        const creatorId = req.user.id || req.user.userId;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Group name is required' });
        }

        // 1. Create the chat room
        const [roomResult] = await db.promise().query(
            'INSERT INTO chat_rooms (type, name, description, avatar) VALUES (?, ?, ?, ?)',
            ['group', name, description || null, avatar || null]
        );
        const roomId = roomResult.insertId;

        // 2. Add creator and other users as members
        const membersToInsert = Array.from(new Set([creatorId, ...(userIds || [])])); // remove duplicates
        
        const memberQueries = membersToInsert.map(userId => {
            const role = userId === creatorId ? 'Admin' : 'Member';
            return db.promise().query(
                'INSERT INTO chat_room_members (room_id, user_id, role) VALUES (?, ?, ?)',
                [roomId, userId, role]
            );
        });
        
        await Promise.all(memberQueries);

        return res.json({ 
            success: true, 
            roomId, 
            message: 'Group created successfully',
            data: { id: roomId, name, description, avatar, type: 'group' } 
        });
    } catch (error) {
        console.error('Error in createCustomGroup:', error);
        return res.status(500).json({ success: false, message: 'Failed to create group' });
    }
};

// Create Community
exports.createCommunity = async (req, res) => {
    try {
        const { name, description, avatar, groupIds } = req.body; // groupIds are linked chat_rooms.id
        const creatorId = req.user.id || req.user.userId;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Community name is required' });
        }

        // 1. Create the community chat room
        const [commResult] = await db.promise().query(
            'INSERT INTO chat_rooms (type, name, description, avatar) VALUES (?, ?, ?, ?)',
            ['community', name, description || null, avatar || null]
        );
        const communityId = commResult.insertId;

        // 2. Link groups to this community by setting parent_room_id
        if (groupIds && groupIds.length > 0) {
            await db.promise().query(
                'UPDATE chat_rooms SET parent_room_id = ? WHERE id IN (?)',
                [communityId, groupIds]
            );
        }

        // 3. Add members of the linked groups to the community announcement room
        let communityMembers = new Set([creatorId]);

        if (groupIds && groupIds.length > 0) {
            // Get custom group members
            const [customGroupMembers] = await db.promise().query(
                'SELECT user_id FROM chat_room_members WHERE room_id IN (?)',
                [groupIds]
            );
            customGroupMembers.forEach(row => communityMembers.add(row.user_id));

            // Get group broadcast (chit) members
            const [broadcastGroupMembers] = await db.promise().query(
                'SELECT ug.user_id FROM user_grouping ug JOIN chat_rooms cr ON ug.group_id = cr.group_id WHERE cr.id IN (?)',
                [groupIds]
            );
            broadcastGroupMembers.forEach(row => communityMembers.add(row.user_id));
        }

        // Insert unique members to community
        const memberQueries = Array.from(communityMembers).map(userId => {
            const role = userId === creatorId ? 'Admin' : 'Member';
            return db.promise().query(
                'INSERT INTO chat_room_members (room_id, user_id, role) VALUES (?, ?, ?)',
                [communityId, userId, role]
            );
        });

        await Promise.all(memberQueries);

        return res.json({ 
            success: true, 
            roomId: communityId, 
            message: 'Community created successfully',
            data: { id: communityId, name, description, avatar, type: 'community' } 
        });
    } catch (error) {
        console.error('Error in createCommunity:', error);
        return res.status(500).json({ success: false, message: 'Failed to create community' });
    }
};

// Toggle Star message
exports.starMessage = async (req, res) => {
    try {
        const { messageId, isStarred } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!messageId) {
            return res.status(400).json({ success: false, message: 'messageId is required' });
        }

        if (isStarred) {
            // Star the message
            await db.promise().query(
                'INSERT IGNORE INTO starred_messages (user_id, message_id) VALUES (?, ?)',
                [userId, messageId]
            );
            return res.json({ success: true, message: 'Message starred' });
        } else {
            // Unstar the message
            await db.promise().query(
                'DELETE FROM starred_messages WHERE user_id = ? AND message_id = ?',
                [userId, messageId]
            );
            return res.json({ success: true, message: 'Message unstarred' });
        }
    } catch (error) {
        console.error('Error in starMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to star/unstar message' });
    }
};

// Get Starred Messages
exports.getStarredMessages = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        // Fetch starred messages along with room details
        const sql = `
            SELECT 
                sm.id as star_id,
                cm.id,
                cm.room_id,
                cm.sender_id,
                cm.sender_type,
                cm.message as text,
                cm.created_at as timestamp,
                u.name as sender_name,
                cr.type as room_type,
                cr.name as room_name,
                g.group_name as broadcast_room_name
            FROM starred_messages sm
            JOIN chat_messages cm ON sm.message_id = cm.id
            JOIN chat_rooms cr ON cm.room_id = cr.id
            LEFT JOIN users u ON cm.sender_id = u.id
            LEFT JOIN \`groups\` g ON cr.group_id = g.id
            WHERE sm.user_id = ?
            ORDER BY sm.created_at DESC
        `;
        const [rows] = await db.promise().query(sql, [userId]);

        const starred = rows.map(r => ({
            id: r.id,
            roomId: r.room_id,
            text: r.text,
            timestamp: r.timestamp,
            senderName: r.sender_type === 'Admin' ? 'Admin' : (r.sender_name || 'User'),
            roomName: r.room_type === 'group_broadcast' ? r.broadcast_room_name : 
                      r.room_type === 'private' ? 'Private Support' : r.room_name,
            isStarred: true
        }));

        return res.json({ success: true, starred });
    } catch (error) {
        console.error('Error in getStarredMessages:', error);
        return res.status(500).json({ success: false, message: 'Failed to load starred messages' });
    }
};

// Get Room Members list
exports.getRoomMembers = async (req, res) => {
    try {
        const { roomId } = req.params;
        
        // Find room details
        const [roomRows] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
        if (roomRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        const room = roomRows[0];

        let members = [];
        if (room.type === 'group_broadcast') {
            const sql = `
                SELECT u.id AS userId, u.name, u.phone, u.avatar, 'Member' as role
                FROM user_grouping ug
                JOIN users u ON ug.user_id = u.id
                WHERE ug.group_id = ? AND u.deleted_at IS NULL
            `;
            const [rows] = await db.promise().query(sql, [room.group_id]);
            members = rows;
        } else {
            const sql = `
                SELECT u.id AS userId, u.name, u.phone, u.avatar, crm.role
                FROM chat_room_members crm
                JOIN users u ON crm.user_id = u.id
                WHERE crm.room_id = ? AND u.deleted_at IS NULL
            `;
            const [rows] = await db.promise().query(sql, [roomId]);
            members = rows;
        }
        
        return res.json({ success: true, members });
    } catch (error) {
        console.error('Error in getRoomMembers:', error);
        return res.status(500).json({ success: false, message: 'Failed to load room members' });
    }
};

// Add Members to custom group
exports.addRoomMembers = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userIds } = req.body;

        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'userIds are required' });
        }

        const queries = userIds.map(userId => 
            db.promise().query(
                'INSERT IGNORE INTO chat_room_members (room_id, user_id, role) VALUES (?, ?, ?)',
                [roomId, userId, 'Member']
            )
        );
        await Promise.all(queries);

        return res.json({ success: true, message: 'Members added successfully' });
    } catch (error) {
        console.error('Error in addRoomMembers:', error);
        return res.status(500).json({ success: false, message: 'Failed to add members' });
    }
};

// Remove Members from custom group
exports.removeRoomMembers = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userIds } = req.body;

        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'userIds are required' });
        }

        await db.promise().query(
            'DELETE FROM chat_room_members WHERE room_id = ? AND user_id IN (?)',
            [roomId, userIds]
        );

        return res.json({ success: true, message: 'Members removed successfully' });
    } catch (error) {
        console.error('Error in removeRoomMembers:', error);
        return res.status(500).json({ success: false, message: 'Failed to remove members' });
    }
};

// Delete a chat room (only Admin or the authorized members/creator)
exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user.id || req.user.userId;
        const role = req.user.role;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'roomId is required' });
        }

        // Verify room exists
        const [roomRows] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
        if (roomRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        const room = roomRows[0];

        // Authorization check: Admin can delete any room.
        // For standard Users, they can only delete if it's a private chat that belongs to them, or if they are admin of custom group.
        if (role !== 'Admin') {
            if (room.type === 'private' && room.user_id != userId) {
                return res.status(403).json({ success: false, message: 'You are not authorized to delete this room' });
            }
            if (room.type === 'group' || room.type === 'community') {
                const [memberRows] = await db.promise().query(
                    'SELECT role FROM chat_room_members WHERE room_id = ? AND user_id = ?',
                    [roomId, userId]
                );
                if (memberRows.length === 0 || memberRows[0].role !== 'Admin') {
                    return res.status(403).json({ success: false, message: 'Only group admins can delete group chats' });
                }
            }
            if (room.type === 'group_broadcast') {
                return res.status(403).json({ success: false, message: 'Only Admins can delete group broadcast rooms' });
            }
        }

        // Delete the room
        await db.promise().query('DELETE FROM chat_rooms WHERE id = ?', [roomId]);

        return res.json({ success: true, message: 'Chat room deleted successfully' });
    } catch (error) {
        console.error('Error in deleteRoom:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete chat room' });
    }
};
