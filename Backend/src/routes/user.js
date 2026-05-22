const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/user/portfolioController');
const groupController = require('../controllers/user/groupController');
const notificationsController = require('../controllers/user/notificationsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/portfolio', authenticateToken, portfolioController.getPortfolio);
router.get('/portfolio/:groupId/months', authenticateToken, groupController.getGroupMonthlyInfo);
router.get('/notifications', authenticateToken, notificationsController.getNotifications);

module.exports = router;
