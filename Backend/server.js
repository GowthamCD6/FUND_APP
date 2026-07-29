const app = require('./src/app');
const PORT = process.env.PORT || 5000;
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const server = http.createServer(app);

const db = require('./src/config/db');
const checkAndInitializeDatabase = require('./src/utils/dbHealthCheck');
const setupGracefulShutdown = require('./src/utils/gracefulShutdown');

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
  try {
    // Parse URL params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId');
    const userType = url.searchParams.get('userType') || 'user';

    if (!token || !userId) {
      ws.close(1008, 'Missing authentication');
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Store client session
    const clientId = `${userId}-${Date.now()}`;
    clientSessions.set(clientId, {
      ws,
      userId,
      userName: decoded.name || `User ${userId}`,
      userType,
      timestamp: Date.now(),
    });

    console.log(`✅ WebSocket connected: ${clientId} (${userType})`);

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      data: { clientId, userType }
    }));

    // Check for active or setup auctions for this user in the database on connection
    db.promise().query(
      `SELECT ga.id as auction_id, ga.group_id, ga.auction_type, ga.initial_amount, ga.duration, ga.status, g.group_name, gap.joined_status
       FROM group_auctions ga
       JOIN \`groups\` g ON ga.group_id = g.id
       JOIN group_auction_participants gap ON ga.id = gap.auction_id
       WHERE gap.user_id = ? AND ga.status IN ('setup', 'active')`,
      [userId]
    ).then(async ([rows]) => {
      for (const row of rows) {
        if (row.status === 'setup' && row.joined_status === 'pending') {
          // User has a pending auction invitation, fetch participant IDs and alert them
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
          // Active auction: check if we have it in-memory
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

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const { type, data } = JSON.parse(message);
        handleAuctionMessage(type, data, clientId, userType);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      clientSessions.delete(clientId);
      console.log(`🔌 WebSocket disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

  } catch (error) {
    console.error('WebSocket authentication failed:', error.message);
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

    console.log(`✅ Chat WebSocket connected: ${clientId} (${userType})`);

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
          if (client) {
            client.rooms.add(payload.roomId);
            console.log(`Client ${clientId} joined room ${payload.roomId}`);
          }
        } 
        else if (payload.type === 'leave_room') {
          const client = chatClients.get(clientId);
          if (client) {
            client.rooms.delete(payload.roomId);
          }
        }
        else if (payload.type === 'mark_read') {
          // Client opened a room — mark messages from others as read and notify senders
          const { roomId } = payload;
          if (!roomId) return;

          // Find which message IDs were unread (so we know whose messages to notify)
          const [unreadRows] = await db.promise().query(
            `SELECT id, sender_id FROM chat_messages WHERE room_id = ? AND sender_id != ? AND read_at IS NULL`,
            [roomId, Number(userId)]
          );

          if (unreadRows.length > 0) {
            // Mark them all read
            await db.promise().query(
              `UPDATE chat_messages SET read_at = CURRENT_TIMESTAMP WHERE room_id = ? AND sender_id != ? AND read_at IS NULL`,
              [roomId, Number(userId)]
            );

            // Gather unique sender IDs whose messages were just read
            const senderIds = [...new Set(unreadRows.map(r => r.sender_id))];
            const msgIds = unreadRows.map(r => r.id);

            // Push read_receipt to those senders if they are connected
            chatClients.forEach(client => {
              if (client.ws.readyState === WebSocket.OPEN && senderIds.includes(client.userId)) {
                client.ws.send(JSON.stringify({
                  type: 'read_receipt',
                  data: { roomId, messageIds: msgIds, readBy: Number(userId) }
                }));
              }
            });
          }
        }
        else if (payload.type === 'send_message') {
          // Send via WebSocket (fallback for POST API)
          const { roomId, text, replyTo } = payload.data;
          
          // Verify room and routing logic similar to chatController
          const [roomArr] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
          if (roomArr.length === 0) return;
          const room = roomArr[0];

          let targetRoomId = roomId;
          let sourceRoomId = null;

          if (userType === 'User' && room.type === 'group_broadcast') {
            // Find the admin who created/manages this group
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

            // Fallback: first active admin if group has no creator
            if (!adminId) {
              const [adminUsers] = await db.promise().query(
                "SELECT id FROM users WHERE role = 'Admin' AND is_active = 1 ORDER BY id ASC LIMIT 1"
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

          // Save message
          const [insertMsg] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, source_room_id, message_type, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [targetRoomId, userId, userType, text, sourceRoomId, 'text', replyTo || null]
          );

          const msgData = {
            id: insertMsg.insertId,
            roomId: targetRoomId,
            sourceRoomId: sourceRoomId,
            senderId: Number(userId),
            senderType: userType,
            message: text,
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
            memberUserIds = memberRows.map(row => row.user_id);
          } else if (room.type === 'group_broadcast') {
            const [memberRows] = await db.promise().query(
              'SELECT user_id FROM user_grouping WHERE group_id = ?',
              [room.group_id]
            );
            memberUserIds = memberRows.map(row => row.user_id);
          }

          // Broadcast to connected clients who are in this room, or notify members/admins
          chatClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
              const isSender = client.userId === Number(userId);
              const isAdmin = client.userType === 'Admin';

              if (sourceRoomId) {
                // If it's a private reply from group broadcast, ONLY sender and admins should receive it.
                if (isSender || isAdmin) {
                  const isLookingAtRoom = client.rooms.has(targetRoomId) || (isSender && client.rooms.has(roomId));
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
                const isLookingAtRoom = client.rooms.has(targetRoomId) || client.rooms.has(roomId);
                const isMember = memberUserIds.includes(client.userId);

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

    ws.on('close', () => {
      chatClients.delete(clientId);
      console.log(`🔌 Chat WebSocket disconnected: ${clientId}`);
    });

  } catch (error) {
    ws.close(1008, 'Authentication failed');
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
        const { groupId, duration, finalValue, winner } = data;
        try {
          // Update state in database
          db.promise().query(
            "UPDATE group_auctions SET status = 'active', duration = ? WHERE group_id = ? AND status = 'setup'",
            [Math.floor(duration / 1000), groupId]
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
                winner
              }
            }));
          }
        });
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

function placeBid(data, clientId) {
  const { groupId, amount, userId, userName, timestamp } = data;
  const auctionId = `auction-${groupId}`;
  const auction = auctionSessions.get(auctionId);

  if (!auction) {
    const client = clientSessions.get(clientId);
    if (client?.ws) {
      client.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Auction not found or not active' }
      }));
    }
    return;
  }

  // Get current lowest bid
  let currentLowest = auction.initialAmount;
  if (auction.bids.length > 0) {
    currentLowest = Math.min(...auction.bids.map(b => b.amount));
  }

  // Validate bid amount (must be strictly lower than current lowest bid)
  if (Number(amount) >= currentLowest) {
    const client = clientSessions.get(clientId);
    if (client?.ws) {
      client.ws.send(JSON.stringify({
        type: 'error',
        data: { message: `Your bid must be lower than current lowest bid (₹${currentLowest.toLocaleString('en-IN')})` }
      }));
    }
    return;
  }

  // Add bid to auction history
  auction.bids.push({
    userId,
    userName,
    amount,
    timestamp,
    clientId,
  });

  auction.participants.add(userId);

  console.log(`💰 Bid placed: ${userName} - ₹${amount}`);

  // Broadcast bid to all clients
  broadcastToGroup(groupId, {
    type: 'bid_placed',
    data: {
      userId,
      userName,
      amount,
      timestamp,
      totalBids: auction.bids.length,
    }
  });
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
      totalBids: auction.bids.length,
    }
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
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
})();