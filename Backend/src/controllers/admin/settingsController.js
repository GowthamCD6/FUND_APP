const connection = require('../../config/db');

const DEFAULT_AUCTION_CONFIG = {
  defaultDurationMinutes: 5,
  defaultDurationSeconds: 300,
  minBidStep: 1000,
  maxDiscountPercent: 30,
  autoExtendOnLastSeconds: true,
  extendMinutes: 1,
  extendSeconds: 60,
  foremanCommissionPercent: 5
};

const getAuctionSettings = async (req, res) => {
  try {
    const [rows] = await connection.promise().query(
      "SELECT setting_value, updated_at FROM system_settings WHERE setting_key = 'auction_engine'"
    );

    if (rows && rows.length > 0) {
      let val = rows[0].setting_value;
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) {}
      }
      return res.status(200).json({
        success: true,
        data: { ...DEFAULT_AUCTION_CONFIG, ...val },
        updatedAt: rows[0].updated_at
      });
    }

    return res.status(200).json({
      success: true,
      data: DEFAULT_AUCTION_CONFIG
    });
  } catch (err) {
    console.error('Error fetching auction settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve auction engine configuration',
      error: err.message
    });
  }
};

const saveAuctionSettings = async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const durationMins = Number(settings.defaultDurationMinutes) || Math.round((Number(settings.defaultDurationSeconds) || 300) / 60);
    const extMins = Number(settings.extendMinutes) || Math.max(1, Math.round((Number(settings.extendSeconds) || 60) / 60));
    const minBidStep = Number(settings.minBidStep) || 1000;
    const foremanCommission = Number(settings.foremanCommissionPercent) || 5;
    const maxDiscount = Number(settings.maxDiscountPercent) || 30;

    if (durationMins < 1 || durationMins > 60) {
      return res.status(400).json({ success: false, message: 'Duration must be between 1 and 60 minutes' });
    }
    if (minBidStep < 100) {
      return res.status(400).json({ success: false, message: 'Minimum bid step cannot be less than ₹100' });
    }
    if (foremanCommission < 1 || foremanCommission > 10) {
      return res.status(400).json({ success: false, message: 'Commission must be between 1% and 10%' });
    }
    if (maxDiscount < 5 || maxDiscount > 40) {
      return res.status(400).json({ success: false, message: 'Discount cap must be between 5% and 40%' });
    }

    const sanitizedSettings = {
      defaultDurationMinutes: durationMins,
      defaultDurationSeconds: durationMins * 60,
      autoExtendOnLastSeconds: Boolean(settings.autoExtendOnLastSeconds),
      extendMinutes: extMins,
      extendSeconds: extMins * 60,
      minBidStep,
      foremanCommissionPercent: foremanCommission,
      maxDiscountPercent: maxDiscount
    };

    const adminUserId = req.user?.id || req.user?.userId || null;

    const sql = `
      INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
      VALUES ('auction_engine', ?, 'Reverse auction engine default parameters', ?)
      ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        updated_by = VALUES(updated_by),
        updated_at = CURRENT_TIMESTAMP
    `;

    await connection.promise().query(sql, [JSON.stringify(sanitizedSettings), adminUserId]);

    return res.status(200).json({
      success: true,
      message: 'Auction engine configuration saved successfully in database',
      data: sanitizedSettings
    });
  } catch (err) {
    console.error('Error saving auction settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save auction configuration in database',
      error: err.message
    });
  }
};

module.exports = {
  getAuctionSettings,
  saveAuctionSettings
};