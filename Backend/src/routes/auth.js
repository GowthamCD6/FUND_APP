const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const { authenticateToken } = require('../middleware/auth');

// Authentication routes
// router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.patch('/profile', authenticateToken, authController.updateProfile);
router.get('/nominee', authenticateToken, authController.getNomineeDetails);
router.patch('/nominee', authenticateToken, authController.upsertNomineeDetails);

module.exports = router;
