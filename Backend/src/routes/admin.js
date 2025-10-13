const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const groupManagement = require('../controllers/admin/groupManagement');
const groupMessaging = require('../controllers/admin/groupMessaging');
const monthlyCollection = require('../controllers/admin/monthlyCollection');

router.post('/groups/createGroup', authenticateToken, groupManagement.createGroup);
router.post('/users/addUser', authenticateToken, groupManagement.addUser);
// router.get('/groups', authenticateToken, groupManagement.getAllGroups);
// router.get('/groups/:groupId', authenticateToken, groupManagement.getGroupById);
// router.put('/groups/:groupId', authenticateToken, groupManagement.updateGroup);
// router.delete('/groups/:groupId', authenticateToken, groupManagement.deleteGroup);

module.exports = router;