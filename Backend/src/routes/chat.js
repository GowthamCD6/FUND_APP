const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const chatController = require('../controllers/chatController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname) || '.m4a';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});
const upload = multer({ storage: storage });

// All chat routes require authentication
router.use(authenticateToken);

router.get('/', chatController.getChats);
router.get('/contacts', chatController.getContacts);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/send', chatController.sendMessage);
router.post('/edit', chatController.editMessage);
router.post('/delete', chatController.deleteMessage);
router.post('/forward', chatController.forwardMessage);
router.post('/privateRoom', chatController.getOrCreatePrivateRoom);
router.post('/groups/updateAvatar', requireAdmin, chatController.updateGroupAvatar);
router.post('/upload', upload.single('file'), chatController.uploadChatFile);
router.post('/upload-file', upload.single('file'), chatController.uploadChatFile);

// WhatsApp Feature Routes
router.post('/groups/create', requireAdmin, chatController.createCustomGroup);
router.post('/communities/create', requireAdmin, chatController.createCommunity);
router.post('/messages/star', chatController.starMessage);
router.get('/messages/starred', chatController.getStarredMessages);
router.post('/messages/react', chatController.toggleReaction);
router.post('/settings', chatController.toggleChatSetting);
router.get('/presence/:targetUserId', chatController.getUserPresence);
router.get('/rooms/:roomId/media', chatController.getRoomMedia);
router.get('/rooms/:roomId/members', chatController.getRoomMembers);
router.post('/rooms/:roomId/members/add', chatController.addRoomMembers);
router.post('/rooms/:roomId/members/remove', chatController.removeRoomMembers);
router.post('/rooms/delete', chatController.deleteRoom);
router.post('/community/share-group', requireAdmin, chatController.shareGroupToCommunity);

module.exports = router;