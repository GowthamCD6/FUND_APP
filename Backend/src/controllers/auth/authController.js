const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../middleware/auth');
const { passwordDecryptAES } = require('../../utils/decryptAES');

// User Registration
// exports.register = async (req, res) => {
//   try {
//     const { name, phone, password } = req.body;

//     // Validation
//     if (!name || !phone || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required'
//       });
//     }

//     // Check if user already exists
//     const checkUserSql = 'SELECT * FROM users WHERE phone = ?';
//     db.query(checkUserSql, [phone], async (err, results) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({
//           success: false,
//           message: 'Server error'
//         });
//       }

//       if (results.length > 0) {
//         return res.status(409).json({
//           success: false,
//           message: 'User with this email or username already exists'
//         });
//       }

//       // Hash password
//       const saltRounds = 10;

//       const hashedPassword = await bcrypt.hash(password, saltRounds);

//       // Insert new user
//       const insertUserSql = `
//         INSERT INTO users (name, phone, password, created_at) 
//         VALUES (?, ?, ?, ?, ?, NOW())
//       `;

//       db.query(insertUserSql, [name, phone, hashedPassword], (err, result) => {
//         if (err) {
//           console.error('Database error:', err);
//           return res.status(500).json({
//             success: false,
//             message: 'Error creating user'
//           });
//         }

//         const userId = result.insertId;

//         // Generate tokens
//         const tokenPayload = {
//           userId: userId,
//           username: name,
//           email: email,
//           fullName: fullName
//         };

//         const accessToken = generateToken(tokenPayload);
//         const refreshToken = generateRefreshToken({ userId: userId });

//         // Store refresh token in database
//         const storeTokenSql = 'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))';
//         db.query(storeTokenSql, [userId, refreshToken], (err) => {
//           if (err) {
//             console.error('Error storing refresh token:', err);
//           }
//         });

//         res.status(201).json({
//           success: true,
//           message: 'User registered successfully',
//           data: {
//             user: {
//               id: userId,
//               username: name,
//               email: email,
//               fullName: fullName,
//               state: state
//             },
//             accessToken: accessToken,
//             refreshToken: refreshToken
//           }
//         });
//       });
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// User Login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password are required' });
    }

  // Use only `password` column (bcrypt hash) as source of truth
  const findUserSql = 'SELECT id, name, phone, role, password FROM users WHERE phone = ?';
    db.query(findUserSql, [phone], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid phone or password' });
      }

      const user = results[0];

      // Decrypt incoming AES (if client sent AES base64); fallback to plain if not
      let inputPlain = password;
      try {
        const maybePlain = passwordDecryptAES(password);
        if (typeof maybePlain === 'string' && maybePlain.length > 0) {
          inputPlain = maybePlain;
        }
      } catch (_) {
        // Not AES base64, treat as plain
      }
      const isPasswordValid = await bcrypt.compare(inputPlain, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid phone or password' });
      }

      const tokenPayload = {
        userId: user.id,
        username: user.name,
        phone: user.phone,
        role: user.role,
      };

  // Shorter-lived access token (15m) is recommended; refresh token handles longevity
  const accessToken = generateToken(tokenPayload, '15m');
      const refreshToken = generateRefreshToken({ userId: user.id });

      // Persist refresh token (optional but recommended)
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
            username: user.name,
            phone: user.phone,
            role: user.role,
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
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      if (results.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Get user details
      const getUserSql = 'SELECT * FROM users WHERE id = ?';
      db.query(getUserSql, [decoded.userId], (err, userResults) => {
        if (err || userResults.length === 0) {
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
