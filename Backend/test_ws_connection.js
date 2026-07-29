const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  { userId: 1, username: 'Admin User' },
  process.env.JWT_SECRET || '72436349ff907fc7c4042de11a7e55098bb615804c75323133ebc6609d821852',
  { expiresIn: '1d' }
);

const url = `ws://localhost:5000/api/auction?token=${token}&userId=1&userType=admin`;
console.log('Connecting to:', url);

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('✅ Connected successfully!');
  ws.close();
});

ws.on('message', (data) => {
  console.log('Message:', data.toString());
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Closed:', code, reason.toString());
});
