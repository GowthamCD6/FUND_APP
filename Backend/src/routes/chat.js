const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// All chat routes require authentication
router.use(authenticateToken);

router.get('/', chatController.getChats);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/send', chatController.sendMessage);

module.exports = router;
