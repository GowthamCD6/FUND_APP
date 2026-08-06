const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const groupManagement = require('../controllers/admin/groupManagement');
const manageGroupController = require('../controllers/admin/manageGroupController');
const groupMessaging = require('../controllers/admin/groupMessaging');
const monthlyCollection = require('../controllers/admin/monthlyCollection');
const userManagement = require('../controllers/admin/userManagement');
const reportsController = require('../controllers/admin/reportsController');

// Using the new Manage Group separate controller page
router.post('/groups/createGroup', authenticateToken, manageGroupController.createGroup);
router.get('/groups/getGroups', authenticateToken, manageGroupController.getGroups);

// Group Info internals
router.post('/groups/updateGroup', authenticateToken, groupManagement.updateGroup);
router.post('/groups/renameGroup', authenticateToken, groupManagement.renameGroup);

router.post('/groups/addMembers', authenticateToken, groupManagement.addGroupMembers);
router.get('/groups/getMembers', authenticateToken, groupManagement.getGroupMembers);
router.post('/groups/removeMembers', authenticateToken, groupManagement.removeGroupMembers);
router.post('/groups/activate', authenticateToken, groupManagement.activateGroup);
router.post('/groups/delete', authenticateToken, groupManagement.deleteGroup);
router.post('/groups/saveMonthlyDetails', authenticateToken, groupManagement.saveGroupMonthlyDetails);
router.post('/groups/saveAuctionWinner', authenticateToken, groupManagement.saveAuctionWinner);
router.post('/groups/notifyAuctionMembers', authenticateToken, groupManagement.notifyAuctionMembers);
router.get('/groups/getMonthlySnapshot', authenticateToken, groupManagement.getGroupMonthSnapshot);
router.get('/groups/getCompletedAuctions', authenticateToken, groupManagement.getCompletedAuctions);
router.get('/groups/getPendingAuctionWinner', authenticateToken, groupManagement.getPendingAuctionWinner);
router.get('/notifications', authenticateToken, groupManagement.getAdminNotifications);

router.post('/users/addUser', authenticateToken, userManagement.addUser);
router.get('/users/getAllUsers', authenticateToken, userManagement.getAllUsers);
router.get('/users/locations', authenticateToken, userManagement.getUserLocations);
router.post('/users/deleteUser', authenticateToken, userManagement.deleteUser);
router.post('/users/updatePassword', authenticateToken, userManagement.updatePassword);
router.post('/users/resetPassword', authenticateToken, userManagement.resetPassword);
router.get('/users/:userId/passwordDetails', authenticateToken, userManagement.getUserPasswordDetails);
router.post('/users/block', authenticateToken, userManagement.blockUser);
router.post('/users/unblock', authenticateToken, userManagement.unblockUser);

router.get('/collections/getMemberHistory', authenticateToken, monthlyCollection.getMemberPaymentHistory);
router.get('/collections/defaulters', authenticateToken, monthlyCollection.getGlobalDefaulters);

router.get('/reports/groups', authenticateToken, reportsController.getReportGroups);
router.get('/reports/group-members', authenticateToken, reportsController.getGroupMemberPayments);
router.post('/reports/payment-status', authenticateToken, reportsController.updateMemberPaymentStatus);
router.get('/reports/member-chit-card', authenticateToken, reportsController.getMemberChitCard);
router.post('/reports/send-otp', authenticateToken, reportsController.sendPaymentOTP);
router.post('/reports/verify-otp', authenticateToken, reportsController.verifyPaymentOTP);


module.exports = router;