const app = require('./src/app');
const PORT = process.env.PORT || 5000;
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const server = http.createServer(app);

const db = require('./src/config/db');
const checkAndInitializeDatabase = require('./src/utils/dbHealthCheck');
const setupGracefulShutdown = require('./src/utils/gracefulShutdown');
const fcmPushService = require('./src/services/fcmPushService');

// Initialize WebSocket servers
const wss = new WebSocket.Server({ noServer: true });
const chatWss = new WebSocket.Server({ noServer: true });

// Handle WebSocket upgrade routing manually to prevent multi-listener conflicts
server.on('upgrade', (request, socket, head) => {
  try {
    const urlObj = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    if (pathname === '/api/auction') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/api/chat') {
      chatWss.handleUpgrade(request, socket, head, (ws) => {
        chatWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    console.error('Error during WebSocket upgrade routing:', err);
    socket.destroy();
  }
});

// Store active auction sessions
const auctionSessions = new Map();
const clientSessions = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  let clientId = null;
  let clientUserType = 'user';
  let isAuthenticated = false;

  const initSession = (token, userId, userType) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const verifiedRole = (decoded.role && String(decoded.role).toLowerCase() === 'admin') 
        ? 'admin' 
        : (userType === 'admin' && String(decoded.role).toLowerCase() === 'admin' ? 'admin' : 'user');
      const finalUserId = decoded.id ? String(decoded.id) : String(userId);

      clientId = `${finalUserId}-${Date.now()}`;
      clientUserType = verifiedRole;
      isAuthenticated = true;

      clientSessions.set(clientId, {
        ws,
        userId: finalUserId,
        userName: decoded.name || `User ${finalUserId}`,
        userType: verifiedRole,
        timestamp: Date.now(),
      });

      console.log(`✅ WebSocket authenticated: ${clientId} (${verifiedRole})`);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { clientId, userType: verifiedRole }
      }));

      // Check for active or setup auctions for this user in the database on connection
      db.promise().query(
        `SELECT ga.id as auction_id, ga.group_id, ga.auction_type, ga.initial_amount, ga.duration, ga.status, g.group_name, gap.joined_status
         FROM group_auctions ga
         JOIN \`groups\` g ON ga.group_id = g.id
         JOIN group_auction_participants gap ON ga.id = gap.auction_id
         WHERE gap.user_id = ? AND ga.status IN ('setup', 'active')`,
        [finalUserId]
      ).then(async ([rows]) => {
        for (const row of rows) {
          if (row.status === 'setup' && row.joined_status === 'pending') {
            try {
              const [parts] = await db.promise().query(
                'SELECT user_id FROM group_auction_participants WHERE auction_id = ?',
                [row.auction_id]
              );
              const participantIds = parts.map(p => p.user_id);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'auction_created_alert',
                  data: {
                    groupId: row.group_id,
                    groupName: row.group_name,
                    auctionType: row.auction_type,
                    participantIds
                  }
                }));
              }
            } catch (err) {
              console.error('Error fetching participant IDs for connect alert:', err);
            }
          } else if (row.status === 'active') {
            const auctionId = `auction-${row.group_id}`;
            const activeAuction = auctionSessions.get(auctionId);
            if (activeAuction && ws.readyState === WebSocket.OPEN) {
              const elapsed = Math.floor((Date.now() - activeAuction.startTime) / 1000);
              const remainingTime = Math.max(0, activeAuction.duration - elapsed);
              ws.send(JSON.stringify({
                type: 'auction_started',
                data: {
                  groupId: activeAuction.groupId,
                  initialAmount: activeAuction.initialAmount,
                  duration: activeAuction.duration,
                  startTime: activeAuction.startTime,
                  remainingTime,
                  bids: activeAuction.bids,
                }
              }));
            }
          }
        }
      }).catch(err => console.error('Error fetching active/setup auctions on connection:', err));

      return true;
    } catch (err) {
      console.error('WebSocket JWT verification failed:', err.message);
      ws.close(1008, 'Authentication failed');
      return false;
    }
  };

  try {
    // Check for query parameters (backward-compatibility fallback)
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const queryToken = url.searchParams.get('token');
    const queryUserId = url.searchParams.get('userId');
    const queryUserType = url.searchParams.get('userType') || 'user';

    if (queryToken && queryUserId) {
      initSession(queryToken, queryUserId, queryUserType);
    } else {
      // Clean URL: Expect first frame 'auth' message within 6 seconds
      const authTimeout = setTimeout(() => {
        if (!isAuthenticated) {
          console.warn('WebSocket auth timeout: no auth message received within 6s');
          ws.close(1008, 'Authentication timeout');
        }
      }, 6000);

      ws.once('close', () => clearTimeout(authTimeout));
    }

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        const { type, data } = parsed;

        if (type === 'auth') {
          const authData = data || parsed;
          initSession(authData.token, authData.userId, authData.userType);
          return;
        }

        if (!isAuthenticated) {
          console.warn('Rejected unauthenticated message frame');
          ws.close(1008, 'Unauthenticated');
          return;
        }

        handleAuctionMessage(type, data, clientId, clientUserType);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (clientId) {
        clientSessions.delete(clientId);
        console.log(`🔌 WebSocket disconnected: ${clientId}`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

  } catch (error) {
    console.error('WebSocket connection error:', error.message);
    ws.close(1008, 'Authentication failed');
  }
});

// Chat WebSocket Connection Handler
const chatClients = new Map(); // Store chat clients

chatWss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId');
    const userType = url.searchParams.get('userType') || 'User'; // Admin or User

    if (!token || !userId) {
      ws.close(1008, 'Missing authentication');
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Store chat client session
    const clientId = `${userId}-${Date.now()}`;
    chatClients.set(clientId, {
      ws,
      userId: Number(userId),
      userType,
      rooms: new Set() // Store active rooms they are looking at
    });

    // Mark user as Online in DB on WebSocket connection
    try {
      db.promise().query('UPDATE users SET is_online = 1 WHERE id = ?', [Number(userId)]);
      // Broadcast online status to chat clients
      chatClients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN && client.userId !== Number(userId)) {
          client.ws.send(JSON.stringify({
            type: 'user_presence',
            data: { userId: Number(userId), isOnline: true }
          }));
        }
      });
    } catch (presErr) { console.error('Error setting user online:', presErr); }

    ws.on('message', async (message) => {
      try {
        const payload = JSON.parse(message);
        
        if (payload.type === 'ping') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          return;
        }
        else if (payload.type === 'join_room') {
          const client = chatClients.get(clientId);
          if (client && payload.roomId !== undefined && payload.roomId !== null) {
            client.rooms.add(payload.roomId);
            client.rooms.add(String(payload.roomId));
            client.rooms.add(Number(payload.roomId));
            console.log(`Client ${clientId} joined room ${payload.roomId}`);
          }
        } 
        else if (payload.type === 'leave_room') {
          const client = chatClients.get(clientId);
          if (client && payload.roomId !== undefined && payload.roomId !== null) {
            client.rooms.delete(payload.roomId);
            client.rooms.delete(String(payload.roomId));
            client.rooms.delete(Number(payload.roomId));
          }
        }
        else if (payload.type === 'typing_start' || payload.type === 'typing_stop' || payload.type === 'recording_start' || payload.type === 'recording_stop') {
          const { roomId } = payload.data || payload;
          if (!roomId) return;

          chatClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN && Number(client.userId) !== Number(userId)) {
              const isLooking = client.rooms.has(roomId) || client.rooms.has(String(roomId)) || client.rooms.has(Number(roomId));
              if (isLooking) {
                client.ws.send(JSON.stringify({
                  type: payload.type,
                  data: { roomId, userId: Number(userId), userName: decoded.name || 'User' }
                }));
              }
            }
          });
        }
        else if (payload.type === 'message_delivered') {
          const { messageId, roomId } = payload.data || payload;
          if (messageId) {
            try {
              await db.promise().query(
                "UPDATE chat_messages SET status = 'DELIVERED', delivered_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'SENT'",
                [messageId]
              );
            } catch (e) { }
            // Notify sender if connected
            chatClients.forEach(client => {
              if (client.ws.readyState === WebSocket.OPEN) {
                const isLooking = client.rooms.has(roomId) || client.rooms.has(String(roomId)) || client.rooms.has(Number(roomId));
                if (isLooking) {
                  client.ws.send(JSON.stringify({
                    type: 'message_status_update',
                    data: { messageId, status: 'DELIVERED' }
                  }));
                }
              }
            });
          }
        }
        else if (payload.type === 'mark_read') {
          // Client opened a room — mark messages from others as READ and notify senders
          const { roomId } = payload;
          if (!roomId) return;

          try {
            // Find which message IDs were unread (so we know whose messages to notify)
            const [unreadRows] = await db.promise().query(
              `SELECT id, sender_id FROM chat_messages WHERE room_id = ? AND sender_id != ? AND (read_at IS NULL OR status != 'READ')`,
              [roomId, Number(userId)]
            );

            if (unreadRows.length > 0) {
              // Mark them all read
              try {
                await db.promise().query(
                  `UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP, status = 'READ' WHERE room_id = ? AND sender_id != ? AND (read_at IS NULL OR status != 'READ')`,
                  [roomId, Number(userId)]
                );
              } catch (e) {
                await db.promise().query(
                  `UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE room_id = ? AND sender_id != ? AND read_at IS NULL`,
                  [roomId, Number(userId)]
                );
              }

              // Gather unique sender IDs whose messages were just read
              const senderIds = [...new Set(unreadRows.map(r => Number(r.sender_id)))];
              const msgIds = unreadRows.map(r => r.id);

              // Push read_receipt to those senders if they are connected
              chatClients.forEach(client => {
                if (client.ws.readyState === WebSocket.OPEN && senderIds.includes(Number(client.userId))) {
                  client.ws.send(JSON.stringify({
                    type: 'read_receipt',
                    data: { roomId, messageIds: msgIds, readBy: Number(userId), status: 'READ' }
                  }));
                }
              });
            }
          } catch (e) {
            console.warn('[mark_read] WS error:', e.message);
          }
        }
        else if (payload.type === 'send_message') {
          // Send via WebSocket (fallback for POST API)
          const { roomId, text, replyTo } = payload.data;
          
          // Verify room and routing logic similar to chatController
          const [roomArr] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ? AND deleted_at IS NULL', [roomId]);
          if (roomArr.length === 0) return;
          const room = roomArr[0];

          let targetRoomId = roomId;
          let sourceRoomId = null;

          if (userType === 'User' && room.type === 'group_broadcast') {
            // Find the admin who created/manages this group
            let adminId = null;

            if (room.group_id) {
              const [groupRows] = await db.promise().query(
                'SELECT created_by FROM `groups` WHERE id = ? AND deleted_at IS NULL',
                [room.group_id]
              );
              if (groupRows.length > 0 && groupRows[0].created_by) {
                adminId = groupRows[0].created_by;
              }
            }

            // Fallback: first active admin if group has no creator
            if (!adminId) {
              const [adminUsers] = await db.promise().query(
                "SELECT id FROM users WHERE role = 'Admin' AND is_active = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1"
              );
              adminId = adminUsers.length > 0 ? adminUsers[0].id : 1;
            }

            const u1 = Math.min(userId, adminId);
            const u2 = Math.max(userId, adminId);
            
            const [existingConv] = await db.promise().query('SELECT room_id FROM private_conversations WHERE user1 = ? AND user2 = ?', [u1, u2]);
            
            if (existingConv.length > 0) {
              targetRoomId = existingConv[0].room_id;
            } else {
              const [insertRes] = await db.promise().query("INSERT INTO chat_rooms (type, group_id, user_id) VALUES ('private', NULL, ?)", [u2]);
              targetRoomId = insertRes.insertId;
              await db.promise().query('INSERT INTO private_conversations (user1, user2, room_id) VALUES (?, ?, ?)', [u1, u2, targetRoomId]);
              await db.promise().query("INSERT IGNORE INTO chat_room_members (room_id, user_id, role) VALUES (?, ?, 'Member'), (?, ?, 'Member')", [targetRoomId, u1, targetRoomId, u2]);
            }
            sourceRoomId = roomId;
          }

          let replyToMessageText = null;
          if (replyTo) {
            const [replyRows] = await db.promise().query('SELECT message FROM chat_messages WHERE id = ?', [replyTo]);
            if (replyRows.length > 0) {
              replyToMessageText = replyRows[0].message;
            }
          }

          // Save message with fallback if status column is absent
          let insertMsg;
          try {
            const [res] = await db.promise().query(
              "INSERT INTO chat_messages (room_id, sender_id, sender_type, message, source_room_id, message_type, reply_to, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'SENT')",
              [targetRoomId, userId, userType, text, sourceRoomId, 'text', replyTo || null]
            );
            insertMsg = res;
          } catch (e) {
            const [res] = await db.promise().query(
              "INSERT INTO chat_messages (room_id, sender_id, sender_type, message, source_room_id, message_type, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [targetRoomId, userId, userType, text, sourceRoomId, 'text', replyTo || null]
            );
            insertMsg = res;
          }

          const msgData = {
            id: insertMsg.insertId,
            roomId: targetRoomId,
            sourceRoomId: sourceRoomId,
            senderId: Number(userId),
            senderType: userType,
            message: text,
            status: 'SENT',
            created_at: new Date(),
            sender_name: decoded.name || 'User',
            reply_to: replyTo || null,
            replied_to_message: replyToMessageText
          };

          // Fetch members to notify for group, community, or broadcast room
          let memberUserIds = [];
          if (room.type === 'group' || room.type === 'community') {
            const [memberRows] = await db.promise().query(
              'SELECT user_id FROM chat_room_members WHERE room_id = ?',
              [targetRoomId]
            );
            memberUserIds = memberRows.map(row => Number(row.user_id));
          } else if (room.type === 'group_broadcast') {
            const [memberRows] = await db.promise().query(
              'SELECT user_id FROM user_grouping WHERE group_id = ?',
              [room.group_id]
            );
            memberUserIds = memberRows.map(row => Number(row.user_id));
          }

          // Broadcast to connected clients who are in this room, or notify members/admins
          chatClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
              const isSender = Number(client.userId) === Number(userId);
              const isAdmin = String(client.userType).toLowerCase() === 'admin';

              if (sourceRoomId) {
                // If it's a private reply from group broadcast, ONLY sender and admins should receive it.
                if (isSender || isAdmin) {
                  const isLookingAtRoom = client.rooms.has(targetRoomId) || client.rooms.has(String(targetRoomId)) || client.rooms.has(Number(targetRoomId)) || (isSender && (client.rooms.has(roomId) || client.rooms.has(String(roomId)) || client.rooms.has(Number(roomId))));
                  if (isLookingAtRoom) {
                    client.ws.send(JSON.stringify({
                      type: 'new_message',
                      data: msgData
                    }));
                  } else {
                    client.ws.send(JSON.stringify({
                      type: 'new_message_notification',
                      data: msgData
                    }));
                  }
                }
              } else {
                // Standard room broadcast (not a private reply from group broadcast)
                const isLookingAtRoom = client.rooms.has(targetRoomId) || client.rooms.has(String(targetRoomId)) || client.rooms.has(Number(targetRoomId)) || client.rooms.has(roomId) || client.rooms.has(String(roomId)) || client.rooms.has(Number(roomId));
                const isMember = memberUserIds.includes(Number(client.userId));

                if (isLookingAtRoom) {
                  client.ws.send(JSON.stringify({
                    type: 'new_message',
                    data: msgData
                  }));
                } else if (!isSender && (isMember || isAdmin)) {
                  // Notify other members or admin so chat list updates
                  client.ws.send(JSON.stringify({
                    type: 'new_message_notification',
                    data: msgData
                  }));
                }
              }
            }
          });
        }
      } catch (err) {
        console.error('Error handling chat WS message', err);
      }
    });

    ws.on('close', async () => {
      chatClients.delete(clientId);
      console.log(`🔌 Chat WebSocket disconnected: ${clientId}`);
      try {
        await db.promise().query('UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?', [Number(userId)]);
        chatClients.forEach(client => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: 'user_presence',
              data: { userId: Number(userId), isOnline: false, lastSeen: new Date() }
            }));
          }
        });
      } catch (e) { }
    });

  } catch (error) {
    try { ws.close(1008, 'Authentication failed'); } catch (e) { }
  }
});

// Handle auction messages
async function handleAuctionMessage(type, data, clientId, userType) {
  if (type === 'ping') {
    const client = clientSessions.get(clientId);
    if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type: 'pong' }));
    }
    return;
  }

  console.log(`📨 [${userType}] ${type}:`, data);

  switch (type) {
    case 'start_auction':
      if (userType === 'admin') {
        startAuction(data, clientId);
      }
      break;
    
    case 'place_bid':
      placeBid(data, clientId);
      break;
    
    case 'pause_auction':
      if (userType === 'admin') {
        pauseAuction(data.groupId, clientId);
      }
      break;
    
    case 'resume_auction':
      if (userType === 'admin') {
        resumeAuction(data.groupId, clientId);
      }
      break;
    
    case 'end_auction':
      if (userType === 'admin') {
        endAuction(data.groupId, clientId);
      }
      break;
    
    case 'reset_auction':
      if (userType === 'admin') {
        resetAuction(data.groupId, clientId);
      }
      break;

    case 'set_auto_bid': {
      const { groupId, floorAmount, enabled } = data;
      const auctionId = `auction-${groupId}`;
      const auction = auctionSessions.get(auctionId);
      const client = clientSessions.get(clientId);
      if (auction && client) {
        if (!auction.autoBidders) {
          auction.autoBidders = new Map();
        }
        if (enabled) {
          auction.autoBidders.set(client.userId, {
            userId: client.userId,
            userName: client.userName,
            clientId,
            floorAmount: Number(floorAmount),
          });
          console.log(`🤖 Auto-bid enabled for ${client.userName} (floor: ₹${floorAmount})`);
        } else {
          auction.autoBidders.delete(client.userId);
          console.log(`🤖 Auto-bid disabled for ${client.userName}`);
        }
        if (client.ws?.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'auto_bid_status',
            data: { enabled: Boolean(enabled), floorAmount: Number(floorAmount) }
          }));
        }
      }
      break;
    }

    case 'check_eligibility': {
      const { groupId } = data;
      const client = clientSessions.get(clientId);
      if (client) {
        (async () => {
          try {
            const [existingWins] = await db.promise().query(
              `SELECT id FROM group_auction_winners WHERE group_id = ? AND winner_user_id = ? AND deleted_at IS NULL LIMIT 1`,
              [groupId, client.userId]
            );
            const [overdueRows] = await db.promise().query(
              `SELECT id FROM monthly_collections WHERE group_id = ? AND user_id = ? AND status = 'overdue' AND deleted_at IS NULL LIMIT 1`,
              [groupId, client.userId]
            );

            const alreadyWon = existingWins.length > 0;
            const isOverdue = overdueRows.length > 0;
            const isEligible = !alreadyWon && !isOverdue;

            let reason = 'You are eligible to participate in this auction.';
            if (alreadyWon) reason = 'Ineligible: You have already won an auction in this group.';
            if (isOverdue) reason = 'Ineligible: You have overdue pending monthly installments.';

            if (client.ws?.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'eligibility_status',
                data: {
                  isEligible,
                  reason,
                  alreadyWon,
                  isOverdue,
                }
              }));
            }
          } catch (err) {
            console.error('Error checking eligibility in WS:', err);
          }
        })();
      }
      break;
    }
    
    case 'setup_auction':
      if (userType === 'admin') {
        const { groupId, type: auctionType, participantIds } = data;
        try {
          // A. Mark any previous setup/active auctions for this group as ended
          await db.promise().query(
            "UPDATE group_auctions SET status = 'ended' WHERE group_id = ? AND status IN ('setup', 'active')",
            [groupId]
          );

          // B. Create a new auction entry with status 'setup'
          const [result] = await db.promise().query(
            "INSERT INTO group_auctions (group_id, auction_type, initial_amount, duration, status) VALUES (?, ?, ?, ?, ?)",
            [groupId, auctionType, 0.00, 300, 'setup']
          );
          const auctionId = result.insertId;

          // C. Add the participants to the auction
          if (participantIds && participantIds.length > 0) {
            const insertPromises = participantIds.map(pid => {
              return db.promise().query(
                "INSERT INTO group_auction_participants (auction_id, user_id, joined_status) VALUES (?, ?, 'pending')",
                [auctionId, pid]
              );
            });
            await Promise.all(insertPromises);
          }

          // D. Fetch group name for the broadcast notification
          const [rows] = await db.promise().query(
            'SELECT group_name FROM `groups` WHERE id = ?',
            [groupId]
          );
          const groupName = rows[0]?.group_name || 'Group';

          // E. Broadcast setup alert to selected participants
          clientSessions.forEach((session, cid) => {
            const match = participantIds && participantIds.map(pid => pid.toString()).includes(session.userId?.toString());
            if (match && session.ws.readyState === WebSocket.OPEN) {
              session.ws.send(JSON.stringify({
                type: 'auction_created_alert',
                data: {
                  groupId,
                  groupName,
                  auctionType, // 'betting' or 'random'
                  participantIds
                }
              }));
            }
          });
        } catch (err) {
          console.error('Error setting up auction in DB:', err);
        }
      }
      break;
    
    case 'roll_dice':
      if (userType === 'admin') {
        const { groupId, duration, finalValue, winner, initialAmount } = data;
        const rollInitialAmount = Number(initialAmount) || 0;
        try {
          // Update state in database — store initial_amount too
          db.promise().query(
            "UPDATE group_auctions SET status = 'active', initial_amount = ?, duration = ? WHERE group_id = ? AND status = 'setup'",
            [rollInitialAmount, Math.floor(duration / 1000), groupId]
          );
        } catch (err) {
          console.error('Error updating auction status to active (roll_dice) in DB:', err);
        }
        // Broadcast dice rolling to all users
        clientSessions.forEach((session, cid) => {
          if (session.ws.readyState === WebSocket.OPEN) {
            session.ws.send(JSON.stringify({
              type: 'dice_rolling',
              data: {
                groupId,
                duration,
                finalValue,
                winner,
                initialAmount: rollInitialAmount,
              }
            }));
          }
        });

        // Auto-save the random auction winner to the database after dice roll completes
        if (winner) {
          // Mark auction as ended
          db.promise().query(
            "UPDATE group_auctions SET status = 'ended' WHERE group_id = ? AND status IN ('setup', 'active')",
            [groupId]
          ).catch(err => console.error('Error ending random auction in DB:', err));

          // Save winner to group_auction_winners — use initialAmount as the amount taken
          saveAuctionWinnerToDb(groupId, {
            userId: winner.id || winner.userId,
            userName: winner.name || winner.userName,
            amount: rollInitialAmount,
          });
          console.log(`🎲 Random auction winner auto-saved: ${winner.name || winner.userName}, Amount: ₹${rollInitialAmount}`);
        }
      }
      break;
    
    case 'user_joined_auction':
      if (userType === 'user' || userType === 'User') {
        const { groupId, userId } = data;
        try {
          // A. Find the active/setup auction for this group
          const [auctions] = await db.promise().query(
            "SELECT id FROM group_auctions WHERE group_id = ? AND status IN ('setup', 'active') LIMIT 1",
            [groupId]
          );

          if (auctions.length > 0) {
            const auctionId = auctions[0].id;
            // B. Update participant status to 'joined'
            await db.promise().query(
              "UPDATE group_auction_participants SET joined_status = 'joined', joined_at = NOW() WHERE auction_id = ? AND user_id = ?",
              [auctionId, userId]
            );
          }

          // C. Broadcast to admins that a user has joined
          clientSessions.forEach((session, cid) => {
            if ((session.userType === 'admin' || session.userType === 'Admin') && session.ws.readyState === WebSocket.OPEN) {
              session.ws.send(JSON.stringify({
                type: 'user_joined_auction',
                data: {
                  groupId,
                  userId
                }
              }));
            }
          });
        } catch (err) {
          console.error('Error updating user join status in DB:', err);
        }
      }
      break;

    default:
      console.warn('Unknown message type:', type);
  }
}

// Auction functions
function startAuction(data, adminClientId) {
  const { groupId, initialAmount, duration } = data;
  const auctionId = `auction-${groupId}`;
  
  const auction = {
    groupId,
    initialAmount,
    duration,
    startTime: Date.now(),
    status: 'active',
    bids: [],
    adminClientId,
    participants: new Set(),
  };

  auctionSessions.set(auctionId, auction);

  // Update state in database
  db.promise().query(
    "UPDATE group_auctions SET status = 'active', initial_amount = ?, duration = ? WHERE group_id = ? AND status = 'setup'",
    [initialAmount, duration, groupId]
  ).catch(err => console.error('Error updating auction status to active in DB:', err));

  // Broadcast to all clients
  broadcastToGroup(groupId, {
    type: 'auction_started',
    data: {
      groupId,
      initialAmount,
      duration,
      startTime: auction.startTime,
    }
  });

  // High-Priority FCM Push Notification to all group subscribers (wakes up killed app)
  fcmPushService.sendAuctionStartAlert(groupId, initialAmount).catch(err => {
    console.error('Error sending auction start push notification:', err);
  });

  // Start timer broadcast every second
  const timerInterval = setInterval(() => {
    const auction = auctionSessions.get(auctionId);
    if (!auction) {
      clearInterval(timerInterval);
      return;
    }

    const elapsed = Math.floor((Date.now() - auction.startTime) / 1000);
    const remainingTime = Math.max(0, auction.duration - elapsed);

    broadcastToGroup(groupId, {
      type: 'time_update',
      data: { remainingTime, elapsed }
    });

    if (remainingTime === 0) {
      clearInterval(timerInterval);
      endAuction(groupId, adminClientId);
    }
  }, 1000);

  auction.timerInterval = timerInterval;
  console.log(`🎯 Auction started: ${auctionId}`);
}

async function placeBid(data, clientId) {
  const client = clientSessions.get(clientId);
  if (!client || !client.ws) {
    return;
  }

  const { groupId, amount, idempotencyKey } = data;
  const auctionId = `auction-${groupId}`;
  const auction = auctionSessions.get(auctionId);

  if (!auction || auction.status !== 'active') {
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Auction not found or not active' }
    }));
    return;
  }

  // 1. Identity Verification: Always use server session identity, NEVER trust client identity
  const userId = client.userId;
  const userName = client.userName;
  const serverTimestamp = Date.now();

  // 2. Clock & Remaining Time Verification: Check server clock
  const elapsed = Math.floor((serverTimestamp - auction.startTime) / 1000);
  const remainingTime = Math.max(0, auction.duration - elapsed);
  if (remainingTime <= 0) {
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Auction time has expired' }
    }));
    return;
  }

  // 3. Idempotency Check: Prevent duplicate bids from network retries
  if (!auction.processedIdempotencyKeys) {
    auction.processedIdempotencyKeys = new Set();
  }
  if (idempotencyKey) {
    if (auction.processedIdempotencyKeys.has(idempotencyKey)) {
      console.log(`[Idempotency] Duplicate bid dropped for key: ${idempotencyKey}`);
      return;
    }
    auction.processedIdempotencyKeys.add(idempotencyKey);
  }

  // 4. Ineligibility Check: Has user already won an auction in a previous cycle for this group?
  try {
    const [existingWins] = await db.promise().query(
      `SELECT id FROM group_auction_winners WHERE group_id = ? AND (winner_user_id = ? OR LOWER(winner_name) = LOWER(?)) AND deleted_at IS NULL LIMIT 1`,
      [groupId, userId, userName]
    );

    if (existingWins && existingWins.length > 0) {
      client.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'STRICT RULE: You have ALREADY won an auction in a previous cycle for this group and cannot participate again.' }
      }));
      return;
    }
  } catch (err) {
    console.error('Error checking past auction winner in placeBid:', err);
  }

  // 5. Defaulter Check: Is the user overdue on any monthly collections for this group?
  try {
    const [overdueRows] = await db.promise().query(
      `SELECT id FROM monthly_collections WHERE group_id = ? AND user_id = ? AND status = 'overdue' AND deleted_at IS NULL LIMIT 1`,
      [groupId, userId]
    );

    if (overdueRows && overdueRows.length > 0) {
      client.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'ELIGIBILITY RESTRICTION: You have overdue pending payments for this group and are ineligible to place bids.' }
      }));
      return;
    }
  } catch (defaulterErr) {
    console.error('Error checking defaulter status in placeBid:', defaulterErr);
  }

  // 6. Minimum Bid Decrement Validation
  let currentLowest = auction.initialAmount;
  if (auction.bids.length > 0) {
    currentLowest = Math.min(...auction.bids.map(b => b.amount));
  }

  const MIN_BID_STEP = 500; // minimum bid decrement step ₹500
  const bidAmount = Number(amount);

  if (isNaN(bidAmount) || bidAmount <= 0) {
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Invalid bid amount' }
    }));
    return;
  }

  if (bidAmount > currentLowest - MIN_BID_STEP) {
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { 
        message: `Your bid must be at least ₹${MIN_BID_STEP.toLocaleString('en-IN')} lower than the current lowest bid (Maximum allowable bid: ₹${(currentLowest - MIN_BID_STEP).toLocaleString('en-IN')})` 
      }
    }));
    return;
  }

  // 7. Anti-Sniping Protection: If a bid arrives in the final 30 seconds, extend clock by 30 seconds
  let antiSnipingExtended = false;
  let updatedRemainingTime = remainingTime;
  if (remainingTime <= 30) {
    const extensionSeconds = 30;
    auction.duration += extensionSeconds;
    antiSnipingExtended = true;
    updatedRemainingTime = Math.max(0, auction.duration - Math.floor((serverTimestamp - auction.startTime) / 1000));
    console.log(`⏱️ [Anti-Sniping] Extended clock by ${extensionSeconds}s for group ${groupId}. New remaining: ${updatedRemainingTime}s`);
  }

  // 8. Record Bid with Server Timestamp
  auction.bids.push({
    userId,
    userName,
    amount: bidAmount,
    timestamp: serverTimestamp,
    clientId,
    idempotencyKey: idempotencyKey || null,
  });

  auction.participants.add(userId);

  console.log(`💰 Verified bid accepted: ${userName} (#${userId}) - ₹${bidAmount} (serverTime: ${new Date(serverTimestamp).toISOString()})`);

  // 9. Broadcast Verified Bid to All Group Clients
  broadcastToGroup(groupId, {
    type: 'bid_placed',
    data: {
      userId,
      userName,
      amount: bidAmount,
      timestamp: serverTimestamp,
      totalBids: auction.bids.length,
      antiSnipingExtended,
      newRemainingTime: updatedRemainingTime,
      newDuration: auction.duration,
    }
  });

  // 10. Process Auto-Bidders (Proxy Bidding)
  if (auction.autoBidders && auction.autoBidders.size > 0) {
    setTimeout(() => {
      for (const [autoUserId, autoBid] of auction.autoBidders.entries()) {
        if (String(autoUserId) !== String(userId)) {
          const nextBidAmount = bidAmount - MIN_BID_STEP;
          if (nextBidAmount >= autoBid.floorAmount) {
            console.log(`🤖 [Auto-Bid] Executing automated bid for ${autoBid.userName} at ₹${nextBidAmount}`);
            placeBid({
              groupId,
              amount: nextBidAmount,
              idempotencyKey: `autobid-${autoUserId}-${nextBidAmount}-${Date.now()}`
            }, autoBid.clientId);
            break;
          }
        }
      }
    }, 1200);
  }
}

function pauseAuction(groupId, adminClientId) {
  const auctionId = `auction-${groupId}`;
  const auction = auctionSessions.get(auctionId);

  if (auction && auction.timerInterval) {
    clearInterval(auction.timerInterval);
    auction.status = 'paused';
    
    db.promise().query(
      "UPDATE group_auctions SET status = 'paused' WHERE group_id = ? AND status = 'active'",
      [groupId]
    ).catch(err => console.error('Error pausing auction in DB:', err));

    broadcastToGroup(groupId, {
      type: 'auction_paused',
      data: { groupId }
    });
  }
}

function resumeAuction(groupId, adminClientId) {
  const auctionId = `auction-${groupId}`;
  const auction = auctionSessions.get(auctionId);

  if (auction && auction.status === 'paused') {
    auction.status = 'active';
    auction.startTime = Date.now() - (auction.duration - auction.remainingTime) * 1000;

    db.promise().query(
      "UPDATE group_auctions SET status = 'active' WHERE group_id = ? AND status = 'paused'",
      [groupId]
    ).catch(err => console.error('Error resuming auction in DB:', err));

    const timerInterval = setInterval(() => {
      const auction = auctionSessions.get(auctionId);
      if (!auction) {
        clearInterval(timerInterval);
        return;
      }

      const elapsed = Math.floor((Date.now() - auction.startTime) / 1000);
      const remainingTime = Math.max(0, auction.duration - elapsed);

      broadcastToGroup(groupId, {
        type: 'time_update',
        data: { remainingTime }
      });

      if (remainingTime === 0) {
        clearInterval(timerInterval);
        endAuction(groupId, adminClientId);
      }
    }, 1000);

    auction.timerInterval = timerInterval;

    broadcastToGroup(groupId, {
      type: 'auction_resumed',
      data: { groupId }
    });
  }
}

function endAuction(groupId, adminClientId) {
  const auctionId = `auction-${groupId}`;
  const auction = auctionSessions.get(auctionId);

  if (!auction) return;

  if (auction.timerInterval) {
    clearInterval(auction.timerInterval);
  }

  auction.status = 'ended';

  db.promise().query(
    "UPDATE group_auctions SET status = 'ended' WHERE group_id = ? AND status IN ('active', 'paused')",
    [groupId]
  ).catch(err => console.error('Error ending auction in DB:', err));

  // Find winner (lowest bid)
  let winner = null;
  if (auction.bids.length > 0) {
    const minBid = auction.bids.reduce((min, bid) => 
      bid.amount < min.amount ? bid : min
    );
    winner = minBid;
  }

  // Financial calculations for post-auction summary screen
  const initialAmount = Number(auction.initialAmount || 100000);
  const winningBid = winner ? Number(winner.amount) : initialAmount;
  const discountAmount = Math.max(0, initialAmount - winningBid);
  const commission = Math.round(initialAmount * 0.05); // 5% foreman commission
  const netDividendPool = Math.max(0, discountAmount - commission);
  
  const totalMembers = 20; // standard chit cycle pool
  const dividendPerMember = Math.round(netDividendPool / totalMembers);
  const baseMonthlyInstallment = Math.round(initialAmount / totalMembers);
  const nextInstallmentAmount = Math.max(0, baseMonthlyInstallment - dividendPerMember);

  const summary = {
    chitValue: initialAmount,
    winningBid: winningBid,
    discountAmount: discountAmount,
    commission: commission,
    netDividendPool: netDividendPool,
    totalMembers: totalMembers,
    dividendPerMember: dividendPerMember,
    baseMonthlyInstallment: baseMonthlyInstallment,
    nextInstallmentAmount: nextInstallmentAmount,
  };

  broadcastToGroup(groupId, {
    type: 'auction_ended',
    data: {
      groupId,
      winner: winner ? {
        userId: winner.userId,
        userName: winner.userName,
        amount: winner.amount,
        timestamp: winner.timestamp,
      } : null,
      summary,
      totalBids: auction.bids.length,
    }
  });

  // High-Priority FCM Push Notification with auction results & member dividend
  fcmPushService.sendAuctionResultAlert(groupId, winner, summary).catch(err => {
    console.error('Error sending auction result push notification:', err);
  });

  // Save winner to database
  if (winner) {
    saveAuctionWinnerToDb(groupId, winner);
  }

  auctionSessions.delete(auctionId);
  console.log(`🏁 Auction ended: ${auctionId}`);
}

function resetAuction(groupId, adminClientId) {
  const auctionId = `auction-${groupId}`;
  const auction = auctionSessions.get(auctionId);

  if (auction && auction.timerInterval) {
    clearInterval(auction.timerInterval);
  }

  db.promise().query(
    "UPDATE group_auctions SET status = 'ended' WHERE group_id = ? AND status IN ('setup', 'active', 'paused')",
    [groupId]
  ).catch(err => console.error('Error resetting auction in DB:', err));

  auctionSessions.delete(auctionId);

  broadcastToGroup(groupId, {
    type: 'auction_reset',
    data: { groupId }
  });

  console.log(`🔄 Auction reset: ${auctionId}`);
}

// Broadcast to all clients in a group
function broadcastToGroup(groupId, message) {
  clientSessions.forEach((session) => {
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify(message));
    }
  });
}

// Save auction winner to database
async function saveAuctionWinnerToDb(groupId, winner) {
  try {
    // 1. Fetch phone number from the database for the winner
    const [userRows] = await db.promise().query(
      'SELECT phone FROM users WHERE id = ?',
      [winner.userId]
    );
    const winnerPhone = userRows[0]?.phone || null;

    // 2. Determine the current collection period (e.g. YYYY-MM-01)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const collectionPeriod = `${year}-${month}-01`;
    const auctionDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // 3. Insert or update the winner details
    const query = `
      INSERT INTO group_auction_winners 
      (group_id, collection_period, winner_user_id, winner_name, winner_member_phone, amount_taken, auction_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        winner_user_id = VALUES(winner_user_id),
        winner_name = VALUES(winner_name),
        winner_member_phone = VALUES(winner_member_phone),
        amount_taken = VALUES(amount_taken),
        auction_date = VALUES(auction_date),
        updated_at = NOW()
    `;
    
    await db.promise().query(query, [
      groupId,
      collectionPeriod,
      winner.userId,
      winner.userName,
      winnerPhone,
      winner.amount,
      auctionDate,
    ]);

    console.log(`💾 Auction winner saved to database: ${winner.userName}`);
  } catch (error) {
    console.error('Error saving auction winner:', error);
  }
}

app.get("/", (req, res) => {
  res.send("OK");
});

// ========== STARTUP & SHUTDOWN MANAGEMENT ==========

// Setup graceful shutdown handlers
setupGracefulShutdown(server);

// Check database health on startup
(async () => {
  try {
    // Verify database exists and is healthy
    await checkAndInitializeDatabase();
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🌐 WebSocket auction endpoint: ws://localhost:${PORT}/api/auction`);
      console.log('\n📝 Press Ctrl+C to shutdown gracefully\n');

      // Start automated background scan for payment due & overdue alerts (every 12 hours)
      setTimeout(() => {
        fcmPushService.sendDailyPaymentDueAlerts().catch(e => console.error('Initial payment due scan error:', e?.message));
      }, 10000);
      setInterval(() => {
        fcmPushService.sendDailyPaymentDueAlerts().catch(e => console.error('Periodic payment due scan error:', e?.message));
      }, 12 * 60 * 60 * 1000);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();