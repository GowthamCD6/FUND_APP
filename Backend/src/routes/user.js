const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/user/portfolioController');
const groupController = require('../controllers/user/groupController');
const notificationsController = require('../controllers/user/notificationsController');
const locationController = require('../controllers/user/locationController');
const { authenticateToken } = require('../middleware/auth');

const groupManagement = require('../controllers/admin/groupManagement');

router.get('/portfolio', authenticateToken, portfolioController.getPortfolio);
router.get('/portfolio/:groupId/months', authenticateToken, groupController.getGroupMonthlyInfo);
router.get('/groups/getMembers', authenticateToken, groupManagement.getGroupMembers);
router.get('/notifications', authenticateToken, notificationsController.getNotifications);
router.post('/save-location', authenticateToken, locationController.saveLocation);
router.get('/location', authenticateToken, locationController.getMyLocation);
router.get('/locations', authenticateToken, locationController.getMyLocation);
router.get('/admins/locations', authenticateToken, locationController.getAdminLocations);
router.post('/groups/join', authenticateToken, groupController.joinGroup);

module.exports = router;
