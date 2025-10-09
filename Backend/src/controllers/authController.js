const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');

// User Registration
// exports.register = async (req, res) => {
//   try {
//     const { username, email, password, fullName, state } = req.body;

//     // Validation
//     if (!username || !email || !password || !fullName) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required'
//       });
//     }

//     // Check if user already exists
//     const checkUserSql = 'SELECT * FROM users WHERE email = ? OR username = ?';
//     db.query(checkUserSql, [email, username], async (err, results) => {
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
//         INSERT INTO users (username, email, password_hash, full_name, state, created_at) 
//         VALUES (?, ?, ?, ?, ?, NOW())
//       `;

//       db.query(insertUserSql, [username, email, hashedPassword, fullName, state || null], (err, result) => {
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
//           username: username,
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
//               username: username,
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
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

    // Find user by phone
    const findUserSql = 'SELECT * FROM users WHERE phone = ?';
    db.query(findUserSql, [phone], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone or password'
        });
      }

      const user = results[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone or password'
        });
      }

      // Update last login
      const updateLoginSql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
      db.query(updateLoginSql, [user.id], (err) => {
        if (err) {
          console.error('Error updating last login:', err);
        }
      });

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        name: user.user,
        // email: user.email,
        phone: user.phone
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken({ userId: user.id });

      // Store refresh token
      const storeTokenSql = 'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))';
      db.query(storeTokenSql, [user.id, refreshToken], (err) => {
        if (err) {
          console.error('Error storing refresh token:', err);
        }
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            // email: user.email,
            phone: user.phone,
          },
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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
          username: user.username,
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

    const getUserSql = 'SELECT id, username, email, full_name, state, created_at, last_login FROM users WHERE id = ?';
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
            username: user.username,
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
