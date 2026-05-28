const bcrypt = require('bcryptjs');
const { passwordEncryptAES } = require('../../utils/decryptAES');
const db = require('../../config/db');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../middleware/auth');

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    // Check if user already exists
    const checkUserSql = 'SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL';
    db.query(checkUserSql, [phone], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: 'User with this phone already exists' });
      }
      
      // Encrypt password with AES, then hash with bcrypt (consistent with password management)
      const encryptedPassword = passwordEncryptAES(password);
      const hashedPassword = await bcrypt.hash(encryptedPassword, 12);
      
      const insertUserSql = `INSERT INTO users (name, phone, password, created_at) VALUES (?, ?, ?, NOW())`;
      db.query(insertUserSql, [name, phone, hashedPassword], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Error creating user' });
        }
        const userId = result.insertId;
        const tokenPayload = { userId, username: name, phone };
        const accessToken = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken({ userId });
        const storeTokenSql = 'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))';
        db.query(storeTokenSql, [userId, refreshToken], (e) => {
          if (e) console.error('Error storing refresh token:', e);
        });
        return res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: { user: { id: userId, username: name, phone }, accessToken, refreshToken }
        });
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

    const findUserSql = 'SELECT id, name as username, phone, role, password FROM users WHERE phone = ? AND deleted_at IS NULL';
    db.query(findUserSql, [phone], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid phone or password' });
      }

      const user = results[0];

      // Encrypt the password with AES first, then compare with bcrypt
      // This ensures the same hashing method is used as when password is created/updated
      const encryptedPassword = passwordEncryptAES(password);
      const isPasswordValid = await bcrypt.compare(encryptedPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid phone or password' });
      }

      // Generate JWT tokens
      const tokenPayload = { 
        userId: user.id, 
        username: user.username, 
        phone: user.phone, 
        role: user.role 
      };
      
      const accessToken = generateToken(tokenPayload, '15m');
      const refreshToken = generateRefreshToken({ userId: user.id });

      const storeTokenSql = 'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))';
      db.query(storeTokenSql, [user.id, refreshToken], (e) => {
        if (e) console.error('Error storing refresh token:', e);
      });

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: { 
            id: user.id, 
            username: user.username, 
            phone: user.phone, 
            role: user.role 
          },
          accessToken,
          refreshToken,
        },
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in database
    const checkTokenSql = 'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW()';
    db.query(checkTokenSql, [refreshToken, decoded.userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({
            success: false,
            message: 'Refresh token store not configured'
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      if (!results || results.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Get user details
      const getUserSql = 'SELECT * FROM users WHERE id = ?';
      db.query(getUserSql, [decoded.userId], (err, userResults) => {
        if (err || !userResults || userResults.length === 0) {
          return res.status(500).json({
            success: false,
            message: 'User not found'
          });
        }

        const user = userResults[0];

        // Generate new access token
        const tokenPayload = {
          userId: user.id,
          username: user.name,
          email: user.email,
          fullName: user.full_name
        };

        const accessToken = generateToken(tokenPayload);

        res.json({
          success: true,
          data: {
            accessToken: accessToken
          }
        });
      });
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from database
      const deleteTokenSql = 'DELETE FROM refresh_tokens WHERE token = ?';
      db.query(deleteTokenSql, [refreshToken], (err) => {
        if (err) {
          console.error('Error deleting refresh token:', err);
        }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const getUserSql = 'SELECT id, name, mail, phone, last_login FROM users WHERE id = ?';
    db.query(getUserSql, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = results[0];
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.name,
            email: user.email,
            fullName: user.full_name,
            state: user.state,
            createdAt: user.created_at,
            lastLogin: user.last_login
          }
        }
      });
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
