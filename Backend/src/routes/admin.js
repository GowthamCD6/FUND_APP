const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const groupManagement = require('../controllers/admin/groupManagement');
const manageGroupController = require('../controllers/admin/manageGroupController');
const groupMessaging = require('../controllers/admin/groupMessaging');
const monthlyCollection = require('../controllers/admin/monthlyCollection');
const userManagement = require('../controllers/admin/userManagement');
const reportsController = require('../controllers/admin/reportsController');
const { otpRateLimiter, authAttemptRateLimiter } = require('../middleware/rateLimiter');
const {
  validateCreateGroupPayload,
  validatePaymentStatusPayload,
  validateSendOtpPayload,
  validateVerifyOtpPayload,
} = require('../middleware/validators');

// Using the new Manage Group separate controller page
router.post('/groups/createGroup', authenticateToken, requireAdmin, validateCreateGroupPayload, manageGroupController.createGroup);
router.get('/groups/getGroups', authenticateToken, requireAdmin, manageGroupController.getGroups);

// Group Info internals
router.post('/groups/updateGroup', authenticateToken, requireAdmin, groupManagement.updateGroup);
router.post('/groups/renameGroup', authenticateToken, requireAdmin, groupManagement.renameGroup);

router.post('/groups/addMembers', authenticateToken, requireAdmin, groupManagement.addGroupMembers);
router.get('/groups/getMembers', authenticateToken, requireAdmin, groupManagement.getGroupMembers);
router.post('/groups/removeMembers', authenticateToken, requireAdmin, groupManagement.removeGroupMembers);
router.post('/groups/activate', authenticateToken, requireAdmin, groupManagement.activateGroup);
router.post('/groups/delete', authenticateToken, requireAdmin, groupManagement.deleteGroup);
router.post('/groups/saveMonthlyDetails', authenticateToken, requireAdmin, groupManagement.saveGroupMonthlyDetails);
router.post('/groups/saveAuctionWinner', authenticateToken, requireAdmin, groupManagement.saveAuctionWinner);
router.post('/groups/notifyAuctionMembers', authenticateToken, groupManagement.notifyAuctionMembers);
router.get('/groups/getMonthlySnapshot', authenticateToken, groupManagement.getGroupMonthSnapshot);
router.get('/groups/getCompletedAuctions', authenticateToken, groupManagement.getCompletedAuctions);
router.get('/groups/getPendingAuctionWinner', authenticateToken, groupManagement.getPendingAuctionWinner);
router.get('/dashboard-overview', authenticateToken, groupManagement.getDashboardOverview);
router.get('/notifications', authenticateToken, groupManagement.getAdminNotifications);

router.post('/users/addUser', authenticateToken, requireAdmin, userManagement.addUser);
router.get('/users/getAllUsers', authenticateToken, userManagement.getAllUsers);
router.get('/users/locations', authenticateToken, userManagement.getUserLocations);
router.post('/users/updateUser', authenticateToken, requireAdmin, userManagement.updateUser);
router.post('/users/deleteUser', authenticateToken, requireAdmin, userManagement.deleteUser);
router.post('/users/updatePassword', authenticateToken, requireAdmin, userManagement.updatePassword);
router.post('/users/resetPassword', authenticateToken, requireAdmin, userManagement.resetPassword);
router.get('/users/:userId/passwordDetails', authenticateToken, requireAdmin, userManagement.getUserPasswordDetails);
router.post('/users/block', authenticateToken, requireAdmin, userManagement.blockUser);
router.post('/users/unblock', authenticateToken, requireAdmin, userManagement.unblockUser);

router.get('/collections/getMemberHistory', authenticateToken, monthlyCollection.getMemberPaymentHistory);
router.get('/collections/defaulters', authenticateToken, monthlyCollection.getGlobalDefaulters);

router.get('/reports/groups', authenticateToken, requireAdmin, reportsController.getReportGroups);
router.get('/reports/group-members', authenticateToken, requireAdmin, reportsController.getGroupMemberPayments);
router.post(
  '/reports/payment-status',
  authenticateToken,
  requireAdmin,
  validatePaymentStatusPayload,
  reportsController.updateMemberPaymentStatus,
);
router.get('/reports/member-chit-card', authenticateToken, requireAdmin, reportsController.getMemberChitCard);
router.post(
  '/reports/send-otp',
  authenticateToken,
  requireAdmin,
  otpRateLimiter,
  validateSendOtpPayload,
  reportsController.sendPaymentOTP,
);
router.post(
  '/reports/verify-otp',
  authenticateToken,
  requireAdmin,
  authAttemptRateLimiter,
  validateVerifyOtpPayload,
  reportsController.verifyPaymentOTP,
);

module.exports = router;