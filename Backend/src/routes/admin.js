const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const groupManagement = require('../controllers/admin/groupManagement');
const groupMessaging = require('../controllers/admin/groupMessaging');
const monthlyCollection = require('../controllers/admin/monthlyCollection');
const userManagement = require('../controllers/admin/userManagement');

router.post('/groups/createGroup', authenticateToken, groupManagement.createGroup);
router.get('/groups/getGroups', authenticateToken, groupManagement.getGroups);
router.post('/groups/updateGroup', authenticateToken, groupManagement.updateGroup);

router.post('/groups/addMembers', authenticateToken, groupManagement.addGroupMembers);
router.get('/groups/getMembers', authenticateToken, groupManagement.getGroupMembers);
router.post('/groups/removeMembers', authenticateToken, groupManagement.removeGroupMembers);
router.post('/groups/activate', authenticateToken, groupManagement.activateGroup);
router.post('/groups/delete', authenticateToken, groupManagement.deleteGroup);

router.post('/users/addUser', authenticateToken, userManagement.addUser);
router.get('/users/getAllUsers', authenticateToken, userManagement.getAllUsers);


module.exports = router;