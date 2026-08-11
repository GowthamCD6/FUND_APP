const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { groupDecryptAES } = require('../utils/decryptAES');
const { getOrCreateGlobalCommunity } = require('../utils/communityHelper');

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

        // Ensure user is in global community room
        try {
            const { addUserToGlobalCommunity } = require('../utils/communityHelper');
            await addUserToGlobalCommunity(userId, role === 'Admin' ? 'Admin' : 'Member');
        } catch (commErr) {
            console.error('Error ensuring community room in getChats:', commErr);
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
                    ANY_VALUE(cr.name) as room_name,
                    ANY_VALUE(cr.avatar) as room_avatar,
                    ANY_VALUE(g.group_name) as group_name,
                    ANY_VALUE(g.avatar) as group_avatar,
                    ANY_VALUE(u.name) as user_name,
                    ANY_VALUE(up.user_image) as user_avatar,
                    ANY_VALUE(COALESCE(ucs.is_pinned, 0)) as is_pinned,
                    ANY_VALUE(COALESCE(ucs.is_muted, 0)) as is_muted,
                    ANY_VALUE(COALESCE(ucs.is_archived, 0)) as is_archived,
                    (SELECT message FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as timestamp,
                    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.read_at IS NULL AND cm.sender_id != ?) as unread
                FROM chat_rooms cr
                LEFT JOIN \`groups\` g ON cr.group_id = g.id
                LEFT JOIN private_conversations pc ON cr.id = pc.room_id
                LEFT JOIN users u ON u.id = CASE WHEN pc.user1 = ? THEN pc.user2 ELSE pc.user1 END
                LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
                LEFT JOIN chat_room_members crm ON cr.id = crm.room_id
                LEFT JOIN user_chat_settings ucs ON cr.id = ucs.room_id AND ucs.user_id = ?
                WHERE (
                   cr.type = 'group_broadcast'
                   OR (cr.type = 'private' AND (pc.user1 = ? OR pc.user2 = ?))
                   OR (cr.type IN ('group', 'community') AND crm.user_id = ?)
                )
                AND (cr.group_id IS NULL OR (g.deleted_at IS NULL AND (g.status IS NULL OR LOWER(g.status) NOT IN ('completed', 'ended'))))
                AND cr.id NOT IN (SELECT room_id FROM user_deleted_chats WHERE user_id = ?)
                GROUP BY cr.id
                ORDER BY is_pinned DESC, timestamp DESC
            `;
            const [rows] = await db.promise().query(sql, [userId, userId, userId, userId, userId, userId, userId]);

            const chats = rows.map(r => {
                let name = '';
                let avatar = null;
                if (r.type === 'group_broadcast') {
                    name = r.group_name;
                    avatar = r.group_avatar || null;
                } else if (r.type === 'private') {
                    name = r.user_name || 'User Support';
                    avatar = r.user_avatar || null;
                } else {
                    name = r.room_name;
                    avatar = r.room_avatar || null;
                }

                let lastMsg = r.lastMessage || 'No messages yet';
                if (typeof lastMsg === 'string' && lastMsg.startsWith('[GROUP_INVITE]')) {
                    try {
                        const jsonStr = lastMsg.replace('[GROUP_INVITE]', '');
                        const inviteObj = JSON.parse(jsonStr);
                        lastMsg = `📢 Invite: ${inviteObj.groupName || 'Fund Group'}`;
                    } catch {
                        lastMsg = '📢 Group Invite';
                    }
                }

                return {
                    id: r.id,
                    name: name || 'Unnamed Room',
                    lastMessage: lastMsg,
                    timestamp: r.timestamp || new Date(),
                    avatar: avatar,
                    unread: r.unread || 0,
                    isGroup: r.type === 'group_broadcast' || r.type === 'group' || r.type === 'community',
                    type: r.type,
                    groupId: r.group_id,
                    userId: r.user_id,
                    isPinned: Boolean(r.is_pinned),
                    isMuted: Boolean(r.is_muted),
                    isArchived: Boolean(r.is_archived)
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
                    ANY_VALUE(cr.name) as room_name,
                    ANY_VALUE(cr.avatar) as room_avatar,
                    ANY_VALUE(g.group_name) as group_name,
                    ANY_VALUE(g.avatar) as group_avatar,
                    ANY_VALUE(u.name) as user_name,
                    ANY_VALUE(up.user_image) as user_avatar,
                    ANY_VALUE(COALESCE(ucs.is_pinned, 0)) as is_pinned,
                    ANY_VALUE(COALESCE(ucs.is_muted, 0)) as is_muted,
                    ANY_VALUE(COALESCE(ucs.is_archived, 0)) as is_archived,
                    (SELECT message FROM chat_messages cm WHERE (cm.room_id = cr.id OR (cm.source_room_id = cr.id AND cm.sender_id = ?)) ORDER BY cm.created_at DESC LIMIT 1) as lastMessage,
                    (SELECT created_at FROM chat_messages cm WHERE (cm.room_id = cr.id OR (cm.source_room_id = cr.id AND cm.sender_id = ?)) ORDER BY cm.created_at DESC LIMIT 1) as timestamp,
                    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.read_at IS NULL AND cm.sender_id != ?) as unread
                FROM chat_rooms cr
                LEFT JOIN \`groups\` g ON cr.group_id = g.id
                LEFT JOIN user_grouping ug ON g.id = ug.group_id AND g.deleted_at IS NULL
                LEFT JOIN private_conversations pc ON cr.id = pc.room_id
                LEFT JOIN users u ON u.id = CASE WHEN pc.user1 = ? THEN pc.user2 ELSE pc.user1 END
                LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
                LEFT JOIN chat_room_members crm ON cr.id = crm.room_id
                LEFT JOIN user_chat_settings ucs ON cr.id = ucs.room_id AND ucs.user_id = ?
                WHERE (
                   (cr.type = 'group_broadcast' AND ug.user_id = ?) 
                   OR (cr.type = 'private' AND (pc.user1 = ? OR pc.user2 = ?))
                   OR (cr.type IN ('group', 'community') AND crm.user_id = ?)
                )
                AND (cr.group_id IS NULL OR (g.deleted_at IS NULL AND (g.status IS NULL OR LOWER(g.status) NOT IN ('completed', 'ended'))))
                AND cr.id NOT IN (SELECT room_id FROM user_deleted_chats WHERE user_id = ?)
                GROUP BY cr.id
                ORDER BY is_pinned DESC, timestamp DESC
            `;
            const [rows] = await db.promise().query(sql, [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]);

            const chats = rows.map(r => {
                let name = '';
                let avatar = null;
                if (r.type === 'group_broadcast') {
                    name = r.group_name;
                    avatar = r.group_avatar || null;
                } else if (r.type === 'private') {
                    name = 'Admin Support';
                    avatar = r.user_avatar || null;
                } else {
                    name = r.room_name;
                    avatar = r.room_avatar || null;
                }

                let lastMsg = r.lastMessage || 'No messages yet';
                if (typeof lastMsg === 'string' && lastMsg.startsWith('[GROUP_INVITE]')) {
                    try {
                        const jsonStr = lastMsg.replace('[GROUP_INVITE]', '');
                        const inviteObj = JSON.parse(jsonStr);
                        lastMsg = `📢 Invite: ${inviteObj.groupName || 'Fund Group'}`;
                    } catch {
                        lastMsg = '📢 Group Invite';
                    }
                }

                return {
                    id: r.id,
                    name: name || 'Unnamed Room',
                    lastMessage: lastMsg,
                    timestamp: r.timestamp || new Date(),
                    avatar: avatar,
                    unread: r.unread || 0,
                    isGroup: r.type === 'group_broadcast' || r.type === 'group' || r.type === 'community',
                    type: r.type,
                    groupId: r.group_id,
                    userId: r.user_id,
                    isPinned: Boolean(r.is_pinned),
                    isMuted: Boolean(r.is_muted),
                    isArchived: Boolean(r.is_archived)
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
        const { after } = req.query; // After message ID for polling
        const userId = req.user.id || req.user.userId;
        
        let messages = [];
        try {
            let sql = `
                SELECT cm.id, cm.room_id, cm.source_room_id, cm.sender_id, cm.sender_type, cm.message, cm.message_type,
                       COALESCE(cm.status, 'SENT') as status, cm.delivered_at, COALESCE(cm.edited, 0) as edited, cm.edited_at, COALESCE(cm.is_forwarded, 0) as is_forwarded, COALESCE(cm.deleted_for_everyone, 0) as deleted_for_everyone,
                       cm.created_at,
                       cm.read_at,
                       cm.reply_to,
                       parent.message as replied_to_message,
                       u.name as sender_name,
                       (SELECT COUNT(*) FROM starred_messages sm WHERE sm.message_id = cm.id AND sm.user_id = ?) as isStarred,
                       (SELECT JSON_ARRAYAGG(JSON_OBJECT('reaction', mr.reaction, 'userId', mr.user_id)) 
                        FROM message_reactions mr WHERE mr.message_id = cm.id) as reactions
                FROM chat_messages cm
                LEFT JOIN users u ON cm.sender_id = u.id
                LEFT JOIN chat_messages parent ON cm.reply_to = parent.id
                WHERE (cm.room_id = ? OR (cm.source_room_id = ? AND cm.sender_id = ?))
                  AND cm.id NOT IN (SELECT message_id FROM user_deleted_messages WHERE user_id = ?)
            `;
            const params = [userId, roomId, roomId, userId, userId];
            if (after) {
                sql += ` AND cm.id > ?`;
                params.push(after);
            }
            sql += ` ORDER BY cm.created_at ASC`;
            const [rows] = await db.promise().query(sql, params);
            messages = rows;
        } catch (subErr) {
            console.warn('[getMessages] Enhanced query error, using base fallback:', subErr.message);
            let fallbackSql = `
                SELECT cm.id, cm.room_id, cm.source_room_id, cm.sender_id, cm.sender_type, cm.message, cm.message_type,
                       cm.created_at, cm.read_at, cm.reply_to, parent.message as replied_to_message, u.name as sender_name
                FROM chat_messages cm
                LEFT JOIN users u ON cm.sender_id = u.id
                LEFT JOIN chat_messages parent ON cm.reply_to = parent.id
                WHERE cm.room_id = ? OR (cm.source_room_id = ? AND cm.sender_id = ?)
            `;
            const params = [roomId, roomId, userId];
            if (after) {
                fallbackSql += ` AND cm.id > ?`;
                params.push(after);
            }
            fallbackSql += ` ORDER BY cm.created_at ASC`;
            const [rows] = await db.promise().query(fallbackSql, params);
            messages = rows;
        }

        // Dynamically update group invite message payloads with live member counts from DB
        const [allGroups] = await db.promise().query(
            "SELECT id, group_code, total_members, current_members, (SELECT COUNT(*) FROM user_grouping WHERE group_id = `groups`.id) AS live_members FROM `groups` WHERE deleted_at IS NULL"
        );

        const groupMapById = {};
        const groupMapByCode = {};

        allGroups.forEach(g => {
            const liveCount = Number(g.live_members) || 0;
            const totalCount = Number(g.total_members) || 20;

            groupMapById[g.id] = { liveMembers: liveCount, totalMembers: totalCount };

            try {
                const plainCode = groupDecryptAES(g.group_code);
                if (plainCode) {
                    groupMapByCode[plainCode.toUpperCase()] = { liveMembers: liveCount, totalMembers: totalCount };
                }
            } catch (e) {
                // ignore decrypt error for unencrypted fallback codes
            }
            if (g.group_code) {
                groupMapByCode[String(g.group_code).toUpperCase()] = { liveMembers: liveCount, totalMembers: totalCount };
            }
        });

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.message && typeof msg.message === 'string' && msg.message.startsWith('[GROUP_INVITE]')) {
                try {
                    const jsonStr = msg.message.replace('[GROUP_INVITE]', '');
                    const inviteObj = JSON.parse(jsonStr);

                    let groupInfo = null;
                    if (inviteObj.groupId && groupMapById[inviteObj.groupId]) {
                        groupInfo = groupMapById[inviteObj.groupId];
                    } else if (inviteObj.groupCode && groupMapByCode[String(inviteObj.groupCode).toUpperCase()]) {
                        groupInfo = groupMapByCode[String(inviteObj.groupCode).toUpperCase()];
                    }

                    if (groupInfo) {
                        inviteObj.currentMembers = groupInfo.liveMembers;
                        inviteObj.totalMembers = groupInfo.totalMembers;
                        messages[i].message = `[GROUP_INVITE]${JSON.stringify(inviteObj)}`;
                    }
                } catch (e) {
                    console.error('Error updating live member count in getMessages:', e);
                }
            }
        }

        // Mark as read — set read_at for messages sent by others
        await db.promise().query(`UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE room_id = ? AND sender_id != ? AND read_at IS NULL`, [roomId, userId]);

        return res.json({ success: true, messages });
    } catch (error) {
        console.error('Error in getMessages:', error);
        return res.status(500).json({ success: false, message: 'Failed to load messages' });
    }
};

// Helper function for Get or Create Private Room logic
const getOrCreatePrivateRoomInternal = async (userId1, userId2, db) => {
    const u1 = Math.min(userId1, userId2);
    const u2 = Math.max(userId1, userId2);

    const [existingConv] = await db.promise().query(
        'SELECT room_id FROM private_conversations WHERE user1 = ? AND user2 = ?',
        [u1, u2]
    );

    if (existingConv.length > 0) {
        return existingConv[0].room_id;
    }

    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
        const [checkAgain] = await connection.query(
            'SELECT room_id FROM private_conversations WHERE user1 = ? AND user2 = ? FOR UPDATE',
            [u1, u2]
        );
        
        if (checkAgain.length > 0) {
            await connection.rollback();
            connection.release();
            return checkAgain[0].room_id;
        }

        // The legacy user_id was the non-admin user. We will store u2 as user_id for backward compatibility just in case.
        const [roomRes] = await connection.query(
            "INSERT INTO chat_rooms (type, group_id, user_id) VALUES ('private', NULL, ?)",
            [u2]
        );
        const roomId = roomRes.insertId;

        await connection.query(
            'INSERT INTO private_conversations (user1, user2, room_id) VALUES (?, ?, ?)',
            [u1, u2, roomId]
        );

        await connection.query(
            "INSERT IGNORE INTO chat_room_members (room_id, user_id, role) VALUES (?, ?, 'Member'), (?, ?, 'Member')",
            [roomId, u1, roomId, u2]
        );

        await connection.commit();
        connection.release();

        return roomId;
    } catch (txnErr) {
        await connection.rollback();
        connection.release();
        throw txnErr;
    }
};

// HTTP fallback for sending a message (WebSocket handles real-time)
exports.sendMessage = async (req, res) => {
    try {
        const { roomId, message, replyTo } = req.body;
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
        // If User replies to a group broadcast, route to the admin who manages that group
        if (senderType === 'User' && room.type === 'group_broadcast') {
            // Find the admin who created/manages this group (groups.created_by)
            let adminId = null;

            if (room.group_id) {
                const [groupRows] = await db.promise().query(
                    'SELECT created_by FROM `groups` WHERE id = ?',
                    [room.group_id]
                );
                if (groupRows.length > 0 && groupRows[0].created_by) {
                    adminId = groupRows[0].created_by;
                }
            }

            // Fallback: pick the first admin if group has no creator recorded
            if (!adminId) {
                const [adminUsers] = await db.promise().query(
                    "SELECT id FROM users WHERE role = 'Admin' AND is_active = 1 ORDER BY id ASC LIMIT 1"
                );
                adminId = adminUsers.length > 0 ? adminUsers[0].id : 1;
            }

            targetRoomId = await getOrCreatePrivateRoomInternal(senderId, adminId, db);
            sourceRoomId = roomId;
        }

        // Save message (using read_at instead of is_read, as is_read was dropped)
        const [insertMsg] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, source_room_id, message_type, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [targetRoomId, senderId, senderType, message, sourceRoomId, 'text', replyTo || null]
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

// Edit a message (only sender allowed within 15 mins)
exports.editMessage = async (req, res) => {
    try {
        const { messageId, text } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!messageId || !text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'messageId and text are required' });
        }

        const [msgRows] = await db.promise().query('SELECT id, sender_id FROM chat_messages WHERE id = ?', [messageId]);
        if (msgRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (Number(msgRows[0].sender_id) !== Number(userId)) {
            return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
        }

        await db.promise().query(
            'UPDATE chat_messages SET message = ?, edited = 1, edited_at = CURRENT_TIMESTAMP WHERE id = ?',
            [text.trim(), messageId]
        );

        return res.json({ success: true, message: 'Message edited successfully', messageId, text: text.trim() });
    } catch (error) {
        console.error('Error in editMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to edit message' });
    }
};

// Delete a message (supports "Delete for Me" and "Delete for Everyone")
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId, deleteForEveryone = false } = req.body;
        const userId = req.user.id || req.user.userId;

        const [msgRows] = await db.promise().query('SELECT id, sender_id, room_id FROM chat_messages WHERE id = ?', [messageId]);
        if (msgRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const msg = msgRows[0];

        if (deleteForEveryone) {
            if (Number(msg.sender_id) !== Number(userId) && req.user.role !== 'Admin') {
                return res.status(403).json({ success: false, message: 'You can only delete your own messages for everyone' });
            }
            await db.promise().query(
                "UPDATE chat_messages SET deleted_for_everyone = 1, message = 'This message was deleted' WHERE id = ?",
                [messageId]
            );
        } else {
            // Delete for Me
            await db.promise().query(
                'INSERT IGNORE INTO user_deleted_messages (user_id, message_id) VALUES (?, ?)',
                [userId, messageId]
            );
        }

        return res.json({ success: true, message: 'Message deleted', messageId, deleteForEveryone });
    } catch (error) {
        console.error('Error in deleteMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
};

// Forward a message to another room
exports.forwardMessage = async (req, res) => {
    try {
        const { targetRoomId, messageText, originalMessageId } = req.body;
        const senderId = req.user.id || req.user.userId;
        const senderType = req.user.role || 'User';

        if (!targetRoomId || !messageText) {
            return res.status(400).json({ success: false, message: 'targetRoomId and messageText are required' });
        }

        const [insertMsg] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, is_forwarded, message_type) VALUES (?, ?, ?, ?, 1, ?)',
            [targetRoomId, senderId, senderType, messageText, 'text']
        );

        return res.json({
            success: true,
            message: 'Message forwarded successfully',
            data: { id: insertMsg.insertId, roomId: targetRoomId, senderId, senderType, message: messageText, is_forwarded: 1, created_at: new Date() }
        });
    } catch (error) {
        console.error('Error in forwardMessage:', error);
        return res.status(500).json({ success: false, message: 'Failed to forward message' });
    }
};

// Toggle Emoji Reaction on a message
exports.toggleReaction = async (req, res) => {
    try {
        const { messageId, reaction } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!messageId) {
            return res.status(400).json({ success: false, message: 'messageId is required' });
        }

        if (!reaction) {
            // Remove reaction
            await db.promise().query(
                'DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?',
                [messageId, userId]
            );
        } else {
            // Add or update reaction
            await db.promise().query(
                `INSERT INTO message_reactions (message_id, user_id, reaction)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)`,
                [messageId, userId, reaction]
            );
        }

        const [reactionRows] = await db.promise().query(
            'SELECT reaction, COUNT(*) as count FROM message_reactions WHERE message_id = ? GROUP BY reaction',
            [messageId]
        );

        return res.json({ success: true, messageId, reactions: reactionRows });
    } catch (error) {
        console.error('Error in toggleReaction:', error);
        return res.status(500).json({ success: false, message: 'Failed to update reaction' });
    }
};

// Toggle Pin / Mute / Archive per user
exports.toggleChatSetting = async (req, res) => {
    try {
        const { roomId, isPinned, isMuted, isArchived } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'roomId is required' });
        }

        await db.promise().query(
            `INSERT INTO user_chat_settings (user_id, room_id, is_pinned, is_muted, is_archived)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               is_pinned = COALESCE(?, is_pinned),
               is_muted = COALESCE(?, is_muted),
               is_archived = COALESCE(?, is_archived)`,
            [
                userId, roomId, 
                isPinned ? 1 : 0, isMuted ? 1 : 0, isArchived ? 1 : 0,
                isPinned !== undefined ? (isPinned ? 1 : 0) : null,
                isMuted !== undefined ? (isMuted ? 1 : 0) : null,
                isArchived !== undefined ? (isArchived ? 1 : 0) : null
            ]
        );

        return res.json({ success: true, message: 'Chat settings updated' });
    } catch (error) {
        console.error('Error in toggleChatSetting:', error);
        return res.status(500).json({ success: false, message: 'Failed to update chat setting' });
    }
};

// Get target user presence & last seen info
exports.getUserPresence = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const [rows] = await db.promise().query(
            'SELECT id, name, is_online, last_seen FROM users WHERE id = ?',
            [targetUserId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const u = rows[0];
        return res.json({
            success: true,
            presence: {
                userId: u.id,
                name: u.name,
                isOnline: Boolean(u.is_online),
                lastSeen: u.last_seen || null
            }
        });
    } catch (error) {
        console.error('Error in getUserPresence:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch user presence' });
    }
};

// Get media, docs, and links for a specific room (Chat Info Media Gallery)
exports.getRoomMedia = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id || req.user.userId;

        const [rows] = await db.promise().query(
            `SELECT cm.id, cm.message, cm.message_type, cm.created_at, u.name as sender_name
             FROM chat_messages cm
             LEFT JOIN users u ON cm.sender_id = u.id
             WHERE cm.room_id = ? 
               AND cm.id NOT IN (SELECT message_id FROM user_deleted_messages WHERE user_id = ?)
               AND (cm.message LIKE 'http%' OR cm.message LIKE 'data:image%' OR cm.message LIKE 'Document:%' OR cm.message LIKE 'Audio:%' OR cm.message_type IN ('image', 'video', 'document', 'audio'))
             ORDER BY cm.created_at DESC`,
            [roomId, userId]
        );

        const media = [];
        const docs = [];
        const links = [];

        rows.forEach(r => {
            const text = r.message || '';
            if (text.startsWith('Document:') || r.message_type === 'document') {
                docs.push({ id: r.id, title: text, timestamp: r.created_at, senderName: r.sender_name });
            } else if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image')) {
                if (text.match(/\.(jpeg|jpg|gif|png|webp|mp4)/i) || text.includes('/uploads/')) {
                    media.push({ id: r.id, url: text, type: r.message_type || 'image', timestamp: r.created_at });
                } else {
                    links.push({ id: r.id, url: text, timestamp: r.created_at });
                }
            }
        });

        return res.json({ success: true, media, docs, links });
    } catch (error) {
        console.error('Error in getRoomMedia:', error);
        return res.status(500).json({ success: false, message: 'Failed to load room media' });
    }
};

// Get or Create a Private Room (1-on-1 without group)
exports.getOrCreatePrivateRoom = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const loggedInUserId = req.user.id || req.user.userId;
        
        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'targetUserId is required' });
        }
        
        const roomId = await getOrCreatePrivateRoomInternal(loggedInUserId, targetUserId, db);
        
        return res.json({ success: true, roomId });
    } catch (error) {
        console.error('Error in getOrCreatePrivateRoom:', error);
        return res.status(500).json({ success: false, message: 'Failed to open private room' });
    }
};

// Update Group Avatar
exports.updateGroupAvatar = async (req, res) => {
    try {
        const { groupId, roomId, id, avatarBase64, avatar } = req.body || {};
        const targetGroupId = groupId || roomId || id;
        let avatarInput = avatarBase64 || avatar;

        if (!targetGroupId || !avatarInput) {
            return res.status(400).json({ success: false, message: 'groupId and avatarBase64 are required' });
        }

        let savedAvatarUrl = avatarInput;

        // If avatarInput is base64, convert to file and save in /uploads directory
        if (avatarInput.startsWith('data:image/') || avatarInput.length > 500) {
            const matches = avatarInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            let mimeType = 'image/jpeg';
            let base64Data = avatarInput;

            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }

            let ext = 'jpg';
            if (mimeType.includes('png')) ext = 'png';
            else if (mimeType.includes('gif')) ext = 'gif';
            else if (mimeType.includes('webp')) ext = 'webp';

            const uploadsDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const fileName = `group_avatar_${Date.now()}_${Math.round(Math.random() * 1e6)}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);

            fs.writeFileSync(filePath, base64Data, 'base64');
            savedAvatarUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        }

        // 1. Try updating `groups` table
        let groupUpdated = false;
        try {
            const [gResult] = await db.promise().query(
                'UPDATE `groups` SET avatar = ? WHERE id = ?',
                [savedAvatarUrl, targetGroupId]
            );
            if (gResult.affectedRows > 0) groupUpdated = true;
        } catch (gErr) {
            console.log('Update groups avatar notice:', gErr.message);
        }

        // 2. Try updating `chat_rooms` table
        let roomUpdated = false;
        try {
            const [rResult] = await db.promise().query(
                'UPDATE chat_rooms SET avatar = ? WHERE id = ?',
                [savedAvatarUrl, targetGroupId]
            );
            if (rResult.affectedRows > 0) roomUpdated = true;
        } catch (rErr) {
            console.log('Update chat_rooms avatar notice:', rErr.message);
        }

        // 3. If targetGroupId is a chat_room whose group_id points to `groups`, update that group as well
        try {
            const [roomRows] = await db.promise().query('SELECT group_id FROM chat_rooms WHERE id = ?', [targetGroupId]);
            if (roomRows.length > 0 && roomRows[0].group_id) {
                const linkedGroupId = roomRows[0].group_id;
                await db.promise().query('UPDATE `groups` SET avatar = ? WHERE id = ?', [savedAvatarUrl, linkedGroupId]);
                groupUpdated = true;
            }
        } catch (linkedErr) {}

        if (!groupUpdated && !roomUpdated) {
            return res.status(404).json({ success: false, message: 'Group or community not found' });
        }

        return res.json({ 
            success: true, 
            message: 'Group avatar updated successfully',
            avatarUrl: savedAvatarUrl 
        });
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

// Get Room Members list & Group Metadata (Includes start date, permissions, member list without phone numbers)
exports.getRoomMembers = async (req, res) => {
    try {
        const { roomId } = req.params;
        const queryGroupId = req.query.groupId;
        
        // 1. Find room details by room id or group_id
        const [roomRows] = await db.promise().query(
            'SELECT * FROM chat_rooms WHERE id = ? OR group_id = ? OR id = (SELECT id FROM chat_rooms WHERE group_id = ? LIMIT 1)', 
            [roomId, queryGroupId || roomId, queryGroupId || roomId]
        );

        let targetRoomId = roomId;
        let targetGroupId = queryGroupId || null;
        let roomRecord = null;

        if (roomRows.length > 0) {
            roomRecord = roomRows[0];
            targetRoomId = roomRows[0].id;
            targetGroupId = roomRows[0].group_id || targetGroupId;
        }

        // 2. Fetch associated group details from `groups` table if available
        let groupRecord = null;
        if (targetGroupId) {
            const [gRows] = await db.promise().query(
                'SELECT id, group_code, group_name, total_members, group_amount, duration, start_date, created_at FROM `groups` WHERE id = ? AND deleted_at IS NULL',
                [targetGroupId]
            );
            if (gRows.length > 0) {
                groupRecord = gRows[0];
            }
        }

        // 3. Query members from chat_room_members or user_grouping with real-time profile images
        const memberSql = `
            SELECT DISTINCT 
                u.id AS userId, 
                CASE 
                    WHEN u.name IS NOT NULL AND u.name != '' AND u.name NOT REGEXP '^[0-9+ -]+$' THEN u.name
                    WHEN u.nick_name IS NOT NULL AND u.nick_name != '' AND u.nick_name NOT REGEXP '^[0-9+ -]+$' THEN u.nick_name
                    ELSE CONCAT('Member ', u.id)
                END AS name, 
                up.user_image AS avatar, 
                COALESCE(crm.role, CASE WHEN u.role = 'Admin' THEN 'Admin' ELSE 'Member' END) AS role
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
            LEFT JOIN chat_room_members crm ON u.id = crm.user_id AND crm.room_id = ?
            LEFT JOIN user_grouping ug ON u.id = ug.user_id AND ug.group_id = ?
            WHERE (crm.room_id = ? OR (ug.group_id = ? AND ug.group_id IS NOT NULL))
              AND u.deleted_at IS NULL
            ORDER BY role ASC, name ASC
        `;

        let [members] = await db.promise().query(memberSql, [targetRoomId, targetGroupId, targetRoomId, targetGroupId]);
        
        // Fallback 1: If no members matched, query user_grouping by targetGroupId directly
        if (members.length === 0 && targetGroupId) {
            const [gRows] = await db.promise().query(`
                SELECT DISTINCT 
                    u.id AS userId, 
                    CASE 
                        WHEN u.name IS NOT NULL AND u.name != '' AND u.name NOT REGEXP '^[0-9+ -]+$' THEN u.name
                        WHEN u.nick_name IS NOT NULL AND u.nick_name != '' AND u.nick_name NOT REGEXP '^[0-9+ -]+$' THEN u.nick_name
                        ELSE CONCAT('Member ', u.id)
                    END AS name, 
                    up.user_image AS avatar, 
                    CASE WHEN u.role = 'Admin' THEN 'Admin' ELSE 'Member' END AS role
                FROM user_grouping ug
                JOIN users u ON ug.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
                WHERE ug.group_id = ? AND u.deleted_at IS NULL
                ORDER BY role ASC, name ASC
            `, [targetGroupId]);
            members = gRows;
        }

        // Fallback 2: Query chat_messages senders
        if (members.length === 0) {
            const [mRows] = await db.promise().query(`
                SELECT DISTINCT 
                    u.id AS userId, 
                    CASE 
                        WHEN u.name IS NOT NULL AND u.name != '' AND u.name NOT REGEXP '^[0-9+ -]+$' THEN u.name
                        WHEN u.nick_name IS NOT NULL AND u.nick_name != '' AND u.nick_name NOT REGEXP '^[0-9+ -]+$' THEN u.name
                        ELSE CONCAT('Member ', u.id)
                    END AS name, 
                    up.user_image AS avatar, 
                    CASE WHEN u.role = 'Admin' THEN 'Admin' ELSE 'Member' END AS role
                FROM chat_messages cm
                JOIN users u ON cm.sender_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
                WHERE (cm.room_id = ? OR cm.source_room_id = ?) AND u.deleted_at IS NULL
                ORDER BY role ASC, name ASC
            `, [targetRoomId, targetRoomId]);
            members = mRows;
        }

        // Fallback 3: If still empty, return active users as general fallback
        if (members.length === 0) {
            const [allUsers] = await db.promise().query(`
                SELECT 
                    u.id AS userId, 
                    CASE 
                        WHEN u.name IS NOT NULL AND u.name != '' AND u.name NOT REGEXP '^[0-9+ -]+$' THEN u.name
                        WHEN u.nick_name IS NOT NULL AND u.nick_name != '' AND u.nick_name NOT REGEXP '^[0-9+ -]+$' THEN u.nick_name
                        ELSE CONCAT('Member ', u.id)
                    END AS name, 
                    up.user_image AS avatar, 
                    CASE WHEN u.role = 'Admin' THEN 'Admin' ELSE 'Member' END AS role
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id AND up.deleted_at IS NULL
                WHERE u.deleted_at IS NULL
                ORDER BY u.id ASC
                LIMIT 20
            `);
            members = allUsers;
        }

        // 4. Construct metadata
        const roomType = roomRecord?.type || (targetGroupId ? 'group_broadcast' : 'group');
        const startDate = groupRecord?.start_date || groupRecord?.created_at || roomRecord?.created_at || new Date();
        const createdAt = roomRecord?.created_at || groupRecord?.created_at || startDate;

        const isBroadcast = roomType === 'group_broadcast' || roomType === 'community';

        const groupInfo = {
            id: targetRoomId,
            groupId: targetGroupId,
            name: groupRecord?.group_name || roomRecord?.name || 'Group Chat',
            avatar: groupRecord?.avatar || roomRecord?.avatar || null,
            startDate: startDate,
            createdAt: createdAt,
            totalMembers: members.length,
            groupType: isBroadcast ? 'Chit Group Broadcast' : 'Group Chat',
            permissions: {
                sendMessages: isBroadcast ? 'Only Admins' : 'All Members',
                editGroupInfo: 'Only Admins',
                addMembers: 'Only Admins',
                pinMessages: 'Only Admins'
            },
            groupAmount: groupRecord?.group_amount || null,
            duration: groupRecord?.duration || null
        };
        
        return res.json({ 
            success: true, 
            members: members,
            groupInfo: groupInfo 
        });
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
        const requestingUserRole = req.user.role || 'User';

        if (requestingUserRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only Admins can add members to chat rooms' });
        }

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'userIds array is required' });
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
        const { userId } = req.body;
        const requestingUserRole = req.user.role || 'User';

        if (requestingUserRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Only Admins can remove members from chat rooms' });
        }

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        await db.promise().query(
            'DELETE FROM chat_room_members WHERE room_id = ? AND user_id = ?',
            [roomId, userId]
        );

        return res.json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error in removeRoomMembers:', error);
        return res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
};

// Delete a chat room (Hides room ONLY for the requesting user; keeps room & messages intact in DB)
exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'roomId is required' });
        }

        // Create table user_deleted_chats if not exists
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS user_deleted_chats (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              room_id VARCHAR(255) NOT NULL,
              deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY user_room_unique (user_id, room_id)
            )
        `);

        // Record per-user soft deletion (chat remains 100% intact for all other users in DB)
        await db.promise().query(`
            INSERT INTO user_deleted_chats (user_id, room_id, deleted_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE deleted_at = NOW()
        `, [userId, String(roomId)]);

        return res.json({ success: true, message: 'Chat deleted for you' });
    } catch (error) {
        console.error('Error in deleteRoom:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete chat' });
    }
};

// GET /chats/contacts — Returns list of users & groups available to start a new chat with
exports.getContacts = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const role = req.user.role;

        let users = [];
        let groups = [];

        if (role === 'Admin') {
            // Admin can message all registered users
            const [userRows] = await db.promise().query(
                `SELECT id, name, phone, email, role FROM users 
                 WHERE deleted_at IS NULL AND is_active = 1 AND id != ? 
                 ORDER BY name ASC`,
                [userId]
            );
            users = userRows;

            // Admin can also access all custom groups and communities
            const [groupRows] = await db.promise().query(
                `SELECT cr.id, COALESCE(g.name, cr.id) as group_name, cr.type,
                    (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as totalMembers
                 FROM chat_rooms cr
                 LEFT JOIN \`groups\` g ON g.id = cr.group_id
                 WHERE cr.type IN ('group', 'community')
                 ORDER BY cr.id DESC`
            );
            groups = groupRows;
        } else {
            // Regular user: can chat with admins
            const [adminRows] = await db.promise().query(
                `SELECT id, name, phone, email, role FROM users 
                 WHERE role = 'Admin' AND deleted_at IS NULL AND is_active = 1 
                 ORDER BY name ASC`
            );
            users = adminRows;

            // Also show custom groups the user is a member of
            const [groupRows] = await db.promise().query(
                `SELECT cr.id, COALESCE(g.name, CONCAT('Group #', cr.id)) as group_name, cr.type,
                    (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as totalMembers
                 FROM chat_rooms cr
                 LEFT JOIN \`groups\` g ON g.id = cr.group_id
                 INNER JOIN chat_room_members crm ON crm.room_id = cr.id AND crm.user_id = ?
                 WHERE cr.type IN ('group', 'community')
                 ORDER BY cr.id DESC`,
                [userId]
            );
            groups = groupRows;
        }

        return res.json({ success: true, users, groups });
    } catch (error) {
        console.error('Error in getContacts:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
};

// Upload chat file (base64 image or multipart file upload)
exports.uploadChatFile = async (req, res) => {
    try {
        // If uploaded via FormData (multer)
        if (req.file) {
            const fileName = req.file.filename;
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
            return res.json({
                success: true,
                fileUrl,
                fileName
            });
        }

        const { fileBase64, fileName: clientFileName } = req.body || {};
        if (!fileBase64) {
            return res.status(400).json({ success: false, message: 'fileBase64 or file upload is required' });
        }

        // Clean up base64 header if it exists
        // e.g. "data:image/jpeg;base64,/9j/4AAQSkZ..." -> "/9j/4AAQSkZ..."
        const matches = fileBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        let mimeType = 'image/jpeg';
        let base64Data = fileBase64;

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
        }

        // Determine extension
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('gif')) ext = 'gif';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('pdf')) ext = 'pdf';
        else if (mimeType.includes('audio') || mimeType.includes('m4a') || mimeType.includes('aac') || mimeType.includes('mp3') || mimeType.includes('ogg') || mimeType.includes('wav') || mimeType.includes('3gp')) ext = 'm4a';

        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, base64Data, 'base64');

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

        return res.json({
            success: true,
            fileUrl,
            fileName
        });
    } catch (error) {
        console.error('Error uploading chat file:', error);
        return res.status(500).json({ success: false, message: 'Failed to upload chat file' });
    }
};

// Share Group Code to Global Community
exports.shareGroupToCommunity = async (req, res) => {
    try {
        const { groupId } = req.body;
        const senderId = req.user.id || req.user.userId;

        if (!groupId) {
            return res.status(400).json({ success: false, message: 'groupId is required' });
        }

        // 1. Fetch group details
        const [groups] = await db.promise().query(
            'SELECT id, group_code, group_name, group_amount, total_members, current_members, duration, start_date FROM `groups` WHERE id = ? AND deleted_at IS NULL',
            [groupId]
        );

        if (groups.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const group = groups[0];

        // 2. Decrypt the group code
        let plainGroupCode = '';
        try {
            plainGroupCode = groupDecryptAES(group.group_code);
        } catch (decErr) {
            return res.status(500).json({ success: false, message: 'Failed to process group code' });
        }

        // 3. Find or create the global community room
        const communityRoomId = await getOrCreateGlobalCommunity();

        // Query real-time count of members currently in this group
        const [liveCountRow] = await db.promise().query(
            'SELECT COUNT(*) as live_count FROM user_grouping WHERE group_id = ?',
            [group.id]
        );
        const liveMembersCount = liveCountRow[0]?.live_count || 0;

        // 4. Build the invite message payload with groupId and live count
        const invitePayload = JSON.stringify({
            type: 'group_invite',
            groupId: group.id,
            groupCode: plainGroupCode,
            groupName: group.group_name,
            groupAmount: group.group_amount,
            totalMembers: group.total_members,
            currentMembers: liveMembersCount,
            duration: group.duration
        });

        const messageText = `[GROUP_INVITE]${invitePayload}`;

        // 5. Insert the message into community chat
        const [insertResult] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, message_type) VALUES (?, ?, ?, ?, ?)',
            [communityRoomId, senderId, 'Admin', messageText, 'group_invite']
        );

        return res.json({
            success: true,
            message: 'Group code shared to community successfully!',
            data: {
                messageId: insertResult.insertId,
                roomId: communityRoomId,
                groupCode: plainGroupCode,
                groupName: group.group_name
            }
        });
    } catch (error) {
        console.error('Error sharing group to community:', error);
        return res.status(500).json({ success: false, message: 'Failed to share group to community' });
    }
};
