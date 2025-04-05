const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const isPasswordInUse = async (db, plainPassword, excludeEmail) => {
  try {
    // Get all existing hashed passwords from both tables except current user
    const [userPasswords, adminPasswords] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query('SELECT password FROM users WHERE email != ?', [excludeEmail], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        db.query('SELECT password FROM admin WHERE email != ?', [excludeEmail], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
    ]);

    const allPasswords = [...userPasswords, ...adminPasswords];

    for (const row of allPasswords) {
      if (row.password) {
        const isMatch = await bcrypt.compare(plainPassword, row.password);
        if (isMatch) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking password:', error);
    throw error;
  }
};

module.exports = (db) => {
  router.post('/update-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
      // Check if password is already in use
      const passwordInUse = await isPasswordInUse(db, newPassword, email);
      if (passwordInUse) {
        return res.status(400).json({
          message: 'This password is already in use by another user. Please choose a different password.'
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in appropriate table
      const updateUser = async () => {
        return new Promise((resolve, reject) => {
          db.query('UPDATE users SET password = ? WHERE email = ?', 
            [hashedPassword, email], 
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
          });
        });
      };

      const updateAdmin = async () => {
        return new Promise((resolve, reject) => {
          db.query('UPDATE admin SET password = ? WHERE email = ?', 
            [hashedPassword, email], 
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
          });
        });
      };

      const [userResult, adminResult] = await Promise.all([updateUser(), updateAdmin()]);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }
  });

  return router;
};
