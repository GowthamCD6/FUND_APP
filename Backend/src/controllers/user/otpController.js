const db = require('../../config/db');

// Get all active OTP requests for the logged-in user
exports.getOTPRequests = async (req, res) => {
  const userId = req.user.userId || req.user.id;

  try {
    // First, auto-expire any OTP requests that have passed their expiry time
    await db.promise().query(
      `UPDATE otp_requests SET status = 'expired' WHERE user_id = ? AND status IN ('pending', 'viewed') AND expires_at <= NOW()`,
      [userId]
    );

    // Fetch active (pending/viewed) OTP requests
    const [rows] = await db.promise().query(
      `SELECT id, group_id, group_name, otp_code, status, expires_at, created_at
       FROM otp_requests
       WHERE user_id = ? AND status IN ('pending', 'viewed') AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        groupId: row.group_id,
        groupName: row.group_name,
        otpCode: row.otp_code,
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching OTP requests:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Mark an OTP request as viewed when user opens it
exports.markOTPViewed = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { id } = req.params;

  try {
    const [result] = await db.promise().query(
      `UPDATE otp_requests SET status = 'viewed', updated_at = NOW() WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [id, userId]
    );

    return res.json({
      success: true,
      message: result.affectedRows > 0 ? 'OTP marked as viewed' : 'No pending OTP found',
    });
  } catch (error) {
    console.error('Error marking OTP as viewed:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
