require('dotenv').config();
const express = require('express');
const cors = require('cors');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Log requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`, req.body);
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));
app.use('/api/chats', require('./routes/chat'));

module.exports = app;