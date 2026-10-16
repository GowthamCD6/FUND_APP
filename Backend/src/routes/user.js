const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/user/portfolioController');
const groupController = require('../controllers/user/groupController');
const notificationsController = require('../controllers/user/notificationsController');
const locationController = require('../controllers/user/locationController');
const { authenticateToken } = require('../middleware/auth');

const groupManagement = require('../controllers/admin/groupManagement');
const manageGroupController = require('../controllers/admin/manageGroupController');

const preferencesController = require('../controllers/user/preferencesController');
const ratingsController = require('../controllers/user/ratingsController');
const otpController = require('../controllers/user/otpController');

router.get('/portfolio', authenticateToken, portfolioController.getPortfolio);
router.get('/portfolio/:groupId/months', authenticateToken, groupController.getGroupMonthlyInfo);
router.get('/groups/getMembers', authenticateToken, groupManagement.getGroupMembers);
router.get('/notifications', authenticateToken, notificationsController.getNotifications);
router.put('/notifications/read', authenticateToken, notificationsController.markAsRead);
router.post('/notifications/clear', authenticateToken, notificationsController.clearNotifications);
router.delete('/notifications', authenticateToken, notificationsController.clearNotifications);
router.post('/fcm-token', authenticateToken, notificationsController.saveFCMToken);
router.post('/fcm-token/delete', authenticateToken, notificationsController.deleteFCMToken);
router.delete('/fcm-token', authenticateToken, notificationsController.deleteFCMToken);
router.post('/save-location', authenticateToken, locationController.saveLocation);
router.get('/location', authenticateToken, locationController.getMyLocation);
router.get('/locations', authenticateToken, locationController.getMyLocation);
router.get('/admins/locations', authenticateToken, locationController.getAdminLocations);
router.get('/groups', authenticateToken, manageGroupController.getGroups);
router.post('/groups/join', authenticateToken, groupController.joinGroup);
router.get('/preferences', authenticateToken, preferencesController.getPreferences);
router.put('/preferences', authenticateToken, preferencesController.updatePreferences);
router.get('/rate-app', authenticateToken, ratingsController.submitRating);
router.get('/my-rating', authenticateToken, ratingsController.getMyRating);
router.get('/auctions/active', authenticateToken, groupController.checkActiveAuction);

// OTP Routes
router.get('/otp-requests', authenticateToken, otpController.getOTPRequests);
router.post('/otp-requests/:id/viewed', authenticateToken, otpController.markOTPViewed);

module.exports = router;
