const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// Multer storage config: save to uploads/ with original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

// All chat routes require authentication
router.use(authenticateToken);

router.get('/', chatController.getChats);
router.get('/contacts', chatController.getContacts);
router.get('/messages/:roomId', chatController.getMessages);
router.post('/send', chatController.sendMessage);
router.post('/delete', chatController.deleteMessage);
router.post('/privateRoom', chatController.getOrCreatePrivateRoom);
router.post('/groups/updateAvatar', chatController.updateGroupAvatar);
router.post('/upload', chatController.uploadChatFile);
router.post('/upload-file', upload.single('file'), chatController.uploadChatFileMultipart);

// WhatsApp Feature Routes
router.post('/groups/create', chatController.createCustomGroup);
router.post('/communities/create', chatController.createCommunity);
router.post('/messages/star', chatController.starMessage);
router.get('/messages/starred', chatController.getStarredMessages);
router.get('/rooms/:roomId/members', chatController.getRoomMembers);
router.post('/rooms/:roomId/members/add', chatController.addRoomMembers);
router.post('/rooms/:roomId/members/remove', chatController.removeRoomMembers);
router.post('/rooms/delete', chatController.deleteRoom);
router.post('/community/share-group', chatController.shareGroupToCommunity);

module.exports = router;
