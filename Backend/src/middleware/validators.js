const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&'"]/g, '').trim();
};

const validateCreateGroupPayload = (req, res, next) => {
  const { groupName, totalMembers, groupAmount, duration } = req.body;

  const cleanName = sanitizeString(groupName);
  const numMembers = Number(totalMembers);
  const numAmount = Number(groupAmount);
  const numDuration = Number(duration);

  if (!cleanName || cleanName.length < 3 || cleanName.length > 60) {
    return res.status(400).json({ success: false, message: 'Group name must be between 3 and 60 characters' });
  }

  if (!Number.isInteger(numMembers) || numMembers < 2 || numMembers > 500) {
    return res.status(400).json({ success: false, message: 'Total members must be an integer between 2 and 500' });
  }

  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Group amount must be a positive number' });
  }

  if (!Number.isInteger(numDuration) || numDuration < 1 || numDuration > 120) {
    return res.status(400).json({ success: false, message: 'Duration must be an integer between 1 and 120 months' });
  }

  req.body.groupName = cleanName;
  req.body.totalMembers = numMembers;
  req.body.groupAmount = numAmount;
  req.body.duration = numDuration;

  next();
};

const validatePaymentStatusPayload = (req, res, next) => {
  const { groupId, userId, month, year, status } = req.body;

  const numGroupId = Number(groupId);
  const numUserId = Number(userId);
  const numMonth = Number(month);
  const numYear = Number(year);
  const cleanStatus = String(status || '').toLowerCase().trim();

  if (!Number.isInteger(numGroupId) || numGroupId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive groupId is required' });
  }

  if (!Number.isInteger(numUserId) || numUserId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive userId is required' });
  }

  if (!Number.isInteger(numMonth) || numMonth < 0 || numMonth > 11) {
    return res.status(400).json({ success: false, message: 'Valid month (0-11) is required' });
  }

  if (!Number.isInteger(numYear) || numYear < 2000 || numYear > 2100) {
    return res.status(400).json({ success: false, message: 'Valid year (2000-2100) is required' });
  }

  if (!['paid', 'pending', 'overdue'].includes(cleanStatus)) {
    return res.status(400).json({ success: false, message: 'Status must be paid, pending, or overdue' });
  }

  req.body.groupId = numGroupId;
  req.body.userId = numUserId;
  req.body.month = numMonth;
  req.body.year = numYear;
  req.body.status = cleanStatus;

  if (req.body.notes) {
    req.body.notes = sanitizeString(req.body.notes);
  }

  next();
};

const validateSendOtpPayload = (req, res, next) => {
  const { userId, groupId } = req.body;

  const numUserId = Number(userId);
  const numGroupId = Number(groupId);

  if (!Number.isInteger(numUserId) || numUserId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive userId is required' });
  }

  if (!Number.isInteger(numGroupId) || numGroupId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive groupId is required' });
  }

  req.body.userId = numUserId;
  req.body.groupId = numGroupId;

  if (req.body.phoneNumber) {
    req.body.phoneNumber = sanitizeString(req.body.phoneNumber);
  }

  next();
};

const validateVerifyOtpPayload = (req, res, next) => {
  const { otp, groupId, userId } = req.body;

  const cleanOtp = String(otp || '').trim();
  const numUserId = Number(userId);
  const numGroupId = Number(groupId);

  if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
    return res.status(400).json({ success: false, message: 'A valid 6-digit numeric OTP is required' });
  }

  if (!Number.isInteger(numUserId) || numUserId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive userId is required' });
  }

  if (!Number.isInteger(numGroupId) || numGroupId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive groupId is required' });
  }

  req.body.otp = cleanOtp;
  req.body.userId = numUserId;
  req.body.groupId = numGroupId;

  next();
};

module.exports = {
  validateCreateGroupPayload,
  validatePaymentStatusPayload,
  validateSendOtpPayload,
  validateVerifyOtpPayload,
  sanitizeString,
};
