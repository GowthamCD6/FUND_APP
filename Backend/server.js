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
const wss = new WebSocket.Server({ server, path: '/api/auction' });
const chatWss = new WebSocket.Server({ server, path: '/api/chat' });

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

    // Send active auction if one exists for the user's groups
    db.promise().query(
      'SELECT group_id FROM user_grouping WHERE user_id = ?',
      [userId]
    ).then(([rows]) => {
      rows.forEach(row => {
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
      });
    }).catch(err => console.error('Error fetching user groups on connection:', err));

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
        
        if (payload.type === 'join_room') {
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
        else if (payload.type === 'send_message') {
          // Send via WebSocket (fallback for POST API)
          const { roomId, text } = payload.data;
          
          // Verify room and routing logic similar to chatController
          const [roomArr] = await db.promise().query('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
          if (roomArr.length === 0) return;
          const room = roomArr[0];

          let targetRoomId = roomId;
          let sourceRoomId = null;

          if (userType === 'User' && room.type === 'group_broadcast') {
            const [privateRoom] = await db.promise().query('SELECT id FROM chat_rooms WHERE type = ? AND user_id = ? AND group_id IS NULL', ['private', userId]);
            if (privateRoom.length > 0) {
              targetRoomId = privateRoom[0].id;
            } else {
              const [insertRes] = await db.promise().query('INSERT INTO chat_rooms (type, group_id, user_id) VALUES (?, NULL, ?)', ['private', userId]);
              targetRoomId = insertRes.insertId;
            }
            sourceRoomId = roomId;
          }

          // Save message
          const [insertMsg] = await db.promise().query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, source_room_id) VALUES (?, ?, ?, ?, ?)',
            [targetRoomId, userId, userType, text, sourceRoomId]
          );

          const msgData = {
            id: insertMsg.insertId,
            roomId: targetRoomId,
            sourceRoomId: sourceRoomId,
            senderId: Number(userId),
            senderType: userType,
            message: text,
            created_at: new Date(),
            sender_name: decoded.name || 'User'
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
function handleAuctionMessage(type, data, clientId, userType) {
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
        // Broadcast setup alert to selected participants
        db.promise().query(
          'SELECT group_name FROM `groups` WHERE id = ?',
          [groupId]
        ).then(([rows]) => {
          const groupName = rows[0]?.group_name || 'Group';
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
        }).catch(err => console.error('Error fetching group name for alert:', err));
      }
      break;
    
    case 'roll_dice':
      if (userType === 'admin') {
        const { groupId, duration, finalValue, winner } = data;
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
    const query = `
      INSERT INTO group_auction_winners 
      (group_id, winner_user_id, winner_name, amount, month, year, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const date = new Date();
    await db.promise().query(query, [
      groupId,
      winner.userId,
      winner.userName,
      winner.amount,
      date.getMonth() + 1,
      date.getFullYear(),
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