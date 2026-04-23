const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/user/portfolioController');
const { authenticateToken } = require('../middleware/auth');

router.get('/portfolio', authenticateToken, portfolioController.getPortfolio);
router.get('/portfolio/:groupId/months', authenticateToken, portfolioController.getGroupMonthlyInfo);

module.exports = router;
