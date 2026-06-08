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
            // Admin sees all group_broadcast rooms + private rooms
            const sql = `
                SELECT 
                    cr.id, 
                    cr.type, 
                    cr.group_id, 
                    cr.user_id,
                    g.group_name,
                    u.name as user_name,
                    (SELECT message FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as timestamp,
                    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.is_read = 0 AND cm.sender_type != 'Admin') as unread
                FROM chat_rooms cr
                LEFT JOIN \`groups\` g ON cr.group_id = g.id
                LEFT JOIN users u ON cr.user_id = u.id
                ORDER BY timestamp DESC
            `;
            const [rows] = await db.promise().query(sql);

            // Format for frontend
            const chats = rows.map(r => ({
                id: r.id,
                name: r.type === 'group_broadcast' ? r.group_name : r.user_name,
                lastMessage: r.lastMessage || 'No messages yet',
                timestamp: r.timestamp || new Date(),
                avatar: r.type === 'group_broadcast' ? '👥' : '👤',
                unread: r.unread || 0,
                isGroup: r.type === 'group_broadcast',
                type: r.type,
                groupId: r.group_id,
                userId: r.user_id
            }));

            console.log('[chatController.getChats] Admin returning chats:', chats);
            return res.json({ success: true, chats });
        } else {
            // User sees group broadcasts for groups they are in + their private room with Admin
            // Wait, we need to know what groups the user is in. For now, we'll fetch all group broadcasts (assuming user is in all or we join user_grouping)
            const sql = `
                SELECT 
                    cr.id, 
                    cr.type, 
                    cr.group_id, 
                    cr.user_id,
                    g.group_name,
                    'Admin Support' as user_name,
                    (SELECT message FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as timestamp,
                    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.is_read = 0 AND cm.sender_type != 'User') as unread
                FROM chat_rooms cr
                LEFT JOIN \`groups\` g ON cr.group_id = g.id
                LEFT JOIN user_grouping ug ON g.id = ug.group_id
                WHERE (cr.type = 'group_broadcast' AND ug.user_id = ?) 
                   OR (cr.type = 'private' AND cr.user_id = ?)
                ORDER BY timestamp DESC
            `;
            const [rows] = await db.promise().query(sql, [userId, userId]);

            const chats = rows.map(r => ({
                id: r.id,
                name: r.type === 'group_broadcast' ? r.group_name : r.user_name,
                lastMessage: r.lastMessage || 'No messages yet',
                timestamp: r.timestamp || new Date(),
                avatar: r.type === 'group_broadcast' ? '👥' : '👨‍💻',
                unread: r.unread || 0,
                isGroup: r.type === 'group_broadcast',
                type: r.type,
                groupId: r.group_id,
                userId: r.user_id
            }));

            console.log('[chatController.getChats] User returning chats:', chats);
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
        const sql = `
            SELECT cm.id, cm.room_id, cm.sender_id, cm.sender_type, cm.message, cm.created_at, u.name as sender_name
            FROM chat_messages cm
            LEFT JOIN users u ON cm.sender_id = u.id
            WHERE cm.room_id = ?
            ORDER BY cm.created_at ASC
        `;
        const [messages] = await db.promise().query(sql, [roomId]);

        // Mark as read (simplified)
        await db.promise().query(`UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_id != ?`, [roomId, req.user.id || req.user.userId]);

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

        // Custom Routing Logic
        // If User replies to a group broadcast, route to a private chat
        if (senderType === 'User' && room.type === 'group_broadcast') {
            const [privateRoom] = await db.promise().query('SELECT id FROM chat_rooms WHERE type = ? AND user_id = ? AND group_id = ?', ['private', senderId, room.group_id]);
            
            if (privateRoom.length > 0) {
                targetRoomId = privateRoom[0].id;
            } else {
                // Create a new private room
                const [insertRes] = await db.promise().query('INSERT INTO chat_rooms (type, group_id, user_id) VALUES (?, ?, ?)', ['private', room.group_id, senderId]);
                targetRoomId = insertRes.insertId;
            }
        }

        // Save message
        const [insertMsg] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)',
            [targetRoomId, senderId, senderType, message]
        );

        return res.json({ 
            success: true, 
            message: 'Message sent', 
            data: { id: insertMsg.insertId, roomId: targetRoomId, senderId, senderType, message, created_at: new Date() } 
        });
    } catch (error) {
        console.error('Error in sendMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};
