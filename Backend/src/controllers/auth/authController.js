const bcrypt = require('bcryptjs');
const { passwordEncryptAES } = require('../../utils/decryptAES');
const db = require('../../config/db');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../middleware/auth');
const fs = require('fs');
const path = require('path');

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    // Check if user already exists
    const checkUserSql = 'SELECT * FROM users WHERE phone = ? AND deleted_at IS NULL';
    const [results] = await db.promise().query(checkUserSql, [phone]);

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'User with this phone already exists' });
    }
    
    // Encrypt password with AES, then hash with bcrypt (consistent with password management)
    const encryptedPassword = passwordEncryptAES(password);
    const hashedPassword = await bcrypt.hash(encryptedPassword, 12);
    
    const insertUserSql = `INSERT INTO users (name, phone, password, created_at) VALUES (?, ?, ?, NOW())`;
    const [result] = await db.promise().query(insertUserSql, [name, phone, hashedPassword]);
    
    const userId = result.insertId;
    const tokenPayload = { userId, username: name, phone };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId });
    
    const storeTokenSql = 'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))';
    await db.promise().query(storeTokenSql, [userId, refreshToken]);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: { id: userId, username: name, phone }, accessToken, refreshToken }
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

    const findUserSql = 'SELECT id, name as username, phone, role, password, is_active FROM users WHERE phone = ? AND deleted_at IS NULL';
    const [results] = await db.promise().query(findUserSql, [phone]);

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid phone or password' });
    }

    const user = results[0];

    if (user.is_active === 0) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by an administrator. Please contact the admin.' });
    }

    // Encrypt the password with AES first, then compare with bcrypt
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

    const storeTokenSql = 'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))';
    await db.promise().query(storeTokenSql, [user.id, refreshToken]);

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
    const checkTokenSql = 'SELECT * FROM refresh_tokens WHERE token_hash = ? AND user_id = ? AND expires_at > NOW()';
    const [results] = await db.promise().query(checkTokenSql, [refreshToken, decoded.userId]);

    if (!results || results.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Get user details
    const getUserSql = 'SELECT * FROM users WHERE id = ?';
    const [userResults] = await db.promise().query(getUserSql, [decoded.userId]);

    if (!userResults || userResults.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResults[0];

    if (user.is_active === 0) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by an administrator. Please contact the admin.'
      });
    }

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

  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({
        success: false,
        message: 'Refresh token store not configured'
      });
    }
    console.error('Refresh Token Error:', error);
    return res.status(500).json({
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
      const deleteTokenSql = 'DELETE FROM refresh_tokens WHERE token_hash = ?';
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
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const getUserSql = `
      SELECT
        u.id,
        u.name,
        u.nick_name,
        u.mail,
        u.phone,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        p.name AS profile_name,
        p.email AS profile_email,
        DATE_FORMAT(p.date_of_birth, '%Y-%m-%d') AS date_of_birth,
        p.street_address,
        p.city,
        p.state,
        p.user_image
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id AND p.deleted_at IS NULL
      WHERE u.id = ? AND u.deleted_at IS NULL
      LIMIT 1
    `;

    const [results] = await db.promise().query(getUserSql, [userId]);

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = results[0];

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.profile_name || user.nick_name || user.name,
          nickName: user.nick_name,
          email: user.profile_email || user.mail,
          phone: user.phone,
          role: user.role,
          isActive: Boolean(user.is_active),
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        },
        profile: {
          name: user.profile_name || user.name,
          email: user.profile_email || user.mail,
          dateOfBirth: user.date_of_birth,
          streetAddress: user.street_address,
          city: user.city,
          state: user.state,
          userImage: user.user_image
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const {
      name,
      email,
      dateOfBirth,
      streetAddress,
      city,
      state,
      userImage,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userUpdates = [];
    const userValues = [];

    const profileUpdates = [];
    const profileValues = [];

    if (typeof name === 'string') {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty'
        });
      }
      userUpdates.push('name = ?');
      userValues.push(trimmedName);
      profileUpdates.push('name = ?');
      profileValues.push(trimmedName);
    }

    if (typeof email === 'string') {
      const trimmedEmail = email.trim();
      if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
      userUpdates.push('mail = ?');
      userValues.push(trimmedEmail || null);
      profileUpdates.push('email = ?');
      profileValues.push(trimmedEmail || null);
    }

    if (typeof dateOfBirth === 'string') {
      const trimmedDate = dateOfBirth.trim();
      if (trimmedDate) {
        const normalizedDate = trimmedDate.includes('/')
          ? (() => {
              const [month, day, year] = trimmedDate.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            })()
          : trimmedDate;
        profileUpdates.push('date_of_birth = ?');
        profileValues.push(normalizedDate);
      } else {
        profileUpdates.push('date_of_birth = ?');
        profileValues.push(null);
      }
    }

    if (typeof streetAddress === 'string') {
      profileUpdates.push('street_address = ?');
      profileValues.push(streetAddress.trim() || null);
    }

    if (typeof city === 'string') {
      profileUpdates.push('city = ?');
      profileValues.push(city.trim() || null);
    }

    if (typeof state === 'string') {
      profileUpdates.push('state = ?');
      profileValues.push(state.trim() || null);
    }

    if (typeof userImage === 'string') {
      const trimmedImage = userImage.trim();
      let imagePathToSave = null;
      if (trimmedImage) {
        if (trimmedImage.startsWith('data:image/')) {
          try {
            // Process Base64 string
            const matches = trimmedImage.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              const fileName = `user_${userId}_${Date.now()}.${extension}`;
              const uploadDir = path.join(__dirname, '../../../uploads/profiles');
              
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              
              const filePath = path.join(uploadDir, fileName);
              fs.writeFileSync(filePath, buffer);
              
              imagePathToSave = `/uploads/profiles/${fileName}`;

              // Attempt to delete old image file to save space
              try {
                const [oldProfile] = await db.promise().query(
                  'SELECT user_image FROM user_profiles WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
                  [userId]
                );
                if (oldProfile.length > 0 && oldProfile[0].user_image) {
                  const oldImagePath = path.join(__dirname, '../../..', oldProfile[0].user_image);
                  if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                  }
                }
              } catch (delErr) {
                console.error('Failed to delete old image:', delErr);
              }

            }
          } catch (e) {
            console.error('Failed to parse or save base64 image:', e);
          }
        } else {
          imagePathToSave = trimmedImage;
        }
      }
      
      profileUpdates.push('user_image = ?');
      profileValues.push(imagePathToSave);
    }

    if (userUpdates.length === 0 && profileUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No profile fields provided'
      });
    }

    if (userUpdates.length > 0) {
      userUpdates.push('updated_by = ?');
      userUpdates.push('version = version + 1');
      userValues.push(Number(userId));
      userValues.push(userId);

      const [result] = await db.promise().query(
        `
          UPDATE users
          SET ${userUpdates.join(', ')}
          WHERE id = ? AND deleted_at IS NULL
        `,
        userValues
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    if (profileUpdates.length > 0) {
      const [profileRows] = await db.promise().query(
        'SELECT id FROM user_profiles WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
        [userId]
      );

      if (profileRows.length > 0) {
        profileUpdates.push('updated_by = ?');
        profileUpdates.push('version = version + 1');
        profileValues.push(Number(userId));

        await db.promise().query(
          `
            UPDATE user_profiles
            SET ${profileUpdates.join(', ')}
            WHERE user_id = ? AND deleted_at IS NULL
          `,
          [...profileValues, userId]
        );
      } else {
        const columns = ['user_id', ...profileUpdates.map(item => item.split(' = ')[0]), 'created_by', 'updated_by'];
        const placeholders = columns.map(() => '?').join(', ');
        const insertValues = [
          userId,
          ...profileValues,
          Number(userId),
          Number(userId),
        ];

        await db.promise().query(
          `INSERT INTO user_profiles (${columns.join(', ')}) VALUES (${placeholders})`,
          insertValues
        );
      }
    }

    const [rows] = await db.promise().query(
      `
        SELECT
          u.id,
          u.name,
          u.nick_name,
          u.mail,
          u.phone,
          u.role,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          p.name AS profile_name,
          p.email AS profile_email,
          DATE_FORMAT(p.date_of_birth, '%Y-%m-%d') AS date_of_birth,
          p.street_address,
          p.city,
          p.state,
          p.user_image
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id AND p.deleted_at IS NULL
        WHERE u.id = ? AND u.deleted_at IS NULL
        LIMIT 1
      `,
      [userId]
    );

    const user = rows[0];

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.profile_name || user.nick_name || user.name,
          nickName: user.nick_name,
          email: user.profile_email || user.mail,
          phone: user.phone,
          role: user.role,
          isActive: Boolean(user.is_active),
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        },
        profile: {
          name: user.profile_name || user.name,
          email: user.profile_email || user.mail,
          dateOfBirth: user.date_of_birth,
          streetAddress: user.street_address,
          city: user.city,
          state: user.state,
          userImage: user.user_image
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get Nominee Details
exports.getNomineeDetails = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const [rows] = await db.promise().query(
      `
        SELECT
          nominee_name,
          nominee_phone,
          relationship
        FROM user_nominees
        WHERE user_id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId]
    );

    const nominee = rows[0] || null;

    return res.json({
      success: true,
      data: {
        nominee: nominee
          ? {
              nomineeName: nominee.nominee_name,
              nomineePhone: nominee.nominee_phone,
              relationship: nominee.relationship,
            }
          : null
      }
    });
  } catch (error) {
    console.error('Get nominee details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Upsert Nominee Details
exports.upsertNomineeDetails = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { nomineeName, nomineePhone, relationship } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const trimmedName = typeof nomineeName === 'string' ? nomineeName.trim() : '';
    const trimmedPhone = typeof nomineePhone === 'string' ? nomineePhone.trim() : '';
    const trimmedRelationship = typeof relationship === 'string' ? relationship.trim() : '';

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Nominee name is required'
      });
    }

    if (!trimmedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Nominee phone is required'
      });
    }

    if (!/^\d{10,15}$/.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid nominee phone number'
      });
    }

    if (!trimmedRelationship) {
      return res.status(400).json({
        success: false,
        message: 'Relationship is required'
      });
    }

    await db.promise().query(
      `
        INSERT INTO user_nominees (
          user_id,
          nominee_name,
          nominee_phone,
          relationship,
          created_by,
          updated_by,
          deleted_at,
          version
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1)
        ON DUPLICATE KEY UPDATE
          nominee_name = VALUES(nominee_name),
          nominee_phone = VALUES(nominee_phone),
          relationship = VALUES(relationship),
          updated_by = VALUES(updated_by),
          deleted_at = NULL,
          version = version + 1
      `,
      [
        userId,
        trimmedName,
        trimmedPhone,
        trimmedRelationship,
        Number(userId),
        Number(userId),
      ]
    );

    const [rows] = await db.promise().query(
      `
        SELECT
          nominee_name,
          nominee_phone,
          relationship
        FROM user_nominees
        WHERE user_id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId]
    );

    const nominee = rows[0] || null;

    return res.json({
      success: true,
      message: 'Nominee details saved successfully',
      data: {
        nominee: nominee
          ? {
              nomineeName: nominee.nominee_name,
              nomineePhone: nominee.nominee_phone,
              relationship: nominee.relationship,
            }
          : null
      }
    });
  } catch (error) {
    console.error('Upsert nominee details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
