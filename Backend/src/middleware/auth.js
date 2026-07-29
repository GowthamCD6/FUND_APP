const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const db = require('../config/db');

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    try {
      const [rows] = await db.promise().query(
        'SELECT is_active FROM users WHERE id = ? AND deleted_at IS NULL',
        [user.userId || user.id]
      );
      
      if (rows.length === 0 || rows[0].is_active === 0) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked by an administrator. Please contact the admin.'
        });
      }
    } catch (dbErr) {
      console.error('Error in auth token validation db check:', dbErr);
    }
    
    req.user = user;
    next();
  });
};

// Middleware to optionally verify JWT tokens (won't fail if no token provided)
const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Generate JWT token
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  authenticateOptional,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWT_SECRET
};
