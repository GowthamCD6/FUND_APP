const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const { authenticateToken } = require('../middleware/auth');
const { authAttemptRateLimiter } = require('../middleware/rateLimiter');

// Authentication routes
// router.post('/register', authController.register);
router.post('/login', authAttemptRateLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.patch('/profile', authenticateToken, authController.updateProfile);
router.get('/nominee', authenticateToken, authController.getNomineeDetails);
router.patch('/nominee', authenticateToken, authController.upsertNomineeDetails);

module.exports = router;
