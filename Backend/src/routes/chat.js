const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// All chat routes require authentication
router.use(authenticateToken);

router.get('/', chatController.getChats);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/send', chatController.sendMessage);
router.post('/delete', chatController.deleteMessage);
router.post('/privateRoom', chatController.getOrCreatePrivateRoom);
router.post('/groups/updateAvatar', chatController.updateGroupAvatar);

// WhatsApp Feature Routes
router.post('/groups/create', chatController.createCustomGroup);
router.post('/communities/create', chatController.createCommunity);
router.post('/messages/star', chatController.starMessage);
router.get('/messages/starred', chatController.getStarredMessages);
router.get('/rooms/:roomId/members', chatController.getRoomMembers);
router.post('/rooms/:roomId/members/add', chatController.addRoomMembers);
router.post('/rooms/:roomId/members/remove', chatController.removeRoomMembers);

module.exports = router;
