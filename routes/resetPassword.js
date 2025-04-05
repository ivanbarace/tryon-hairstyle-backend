const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Changed from bcrypt to bcryptjs

const validatePassword = (password) => {
    // Check minimum length
    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }

    // Check if password is only numbers
    if (/^\d+$/.test(password)) {
        return "Password cannot contain only numbers";
    }

    // Check for common number sequences
    if (/123456789|987654321|12345678|11111111|00000000/.test(password)) {
        return "Password cannot contain common number sequences";
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    // Check for at least 2 numbers
    if ((password.match(/\d/g) || []).length < 2) {
        return "Password must contain at least 2 numbers";
    }

    // Check for special characters
    if (!/[~!@#$%^&*()_+{:">?"`|}-]/.test(password)) {
        return "Password must contain at least one special character";
    }

    // Check for common phrases
    const commonPhrases = [
        "iloveyou",
        "password",
        "qwerty",
        "abc123",
        "admin123",
        "welcome",
        "monkey",
    ];
    const lowerPassword = password.toLowerCase().replace(/\s/g, '');
    if (commonPhrases.some(phrase => lowerPassword.includes(phrase))) {
        return "Password contains common phrases that are not allowed";
    }

    return null; // Password is valid
};

const isPasswordInUse = async (db, plainPassword, excludeEmail = null) => {
  try {
    // Get passwords from both tables, excluding the current user's email
    const [userPasswords, adminPasswords] = await Promise.all([
      new Promise((resolve, reject) => {
        const query = excludeEmail 
          ? 'SELECT password FROM users WHERE email != ?' 
          : 'SELECT password FROM users';
        const params = excludeEmail ? [excludeEmail] : [];
        db.query(query, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      }),
      new Promise((resolve, reject) => {
        const query = excludeEmail 
          ? 'SELECT password FROM admin WHERE email != ?' 
          : 'SELECT password FROM admin';
        const params = excludeEmail ? [excludeEmail] : [];
        db.query(query, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
    ]);

    // Combine all passwords
    const allPasswords = [...userPasswords, ...adminPasswords];

    // Check if the plain password matches any of the hashed passwords
    for (const row of allPasswords) {
      if (row.password) {  // Make sure password exists
        const isMatch = await bcrypt.compare(plainPassword, row.password);
        if (isMatch) {
          return true;  // Password matches an existing hash
        }
      }
    }
    return false;  // No matches found
  } catch (error) {
    console.error('Error checking password:', error);
    throw error;
  }
};

module.exports = (db) => {
  router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        return res.status(400).json({ message: passwordError });
    }

    try {
      // Check if password is already in use by other users
      const passwordInUse = await isPasswordInUse(db, newPassword, email);
      if (passwordInUse) {
        return res.status(400).json({
          message: 'This password is already in use by another user. Please choose a different password.'
        });
      }
    } catch (error) {
      return res.status(500).json({
        message: 'Error checking password uniqueness',
        error: error.message
      });
    }

    try {
      const salt = await bcrypt.genSalt(10); // Add salt generation
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // First, check if email exists in users table
      db.query('SELECT * FROM users WHERE email = ?', [email], async (err, userResults) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err });
        }

        // If found in users table, update user password
        if (userResults.length > 0) {
          db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (updateErr, updateResult) => {
            if (updateErr) {
              return res.status(500).json({ message: 'Error updating password', error: updateErr });
            }
            return res.json({ message: 'Password updated successfully' });
          });
        } else {
          // If not found in users table, check admin table
          db.query('SELECT * FROM admin WHERE email = ?', [email], async (adminErr, adminResults) => {
            if (adminErr) {
              return res.status(500).json({ message: 'Database error', error: adminErr });
            }

            // If found in admin table, update admin password
            if (adminResults.length > 0) {
              db.query('UPDATE admin SET password = ? WHERE email = ?', [hashedPassword, email], (updateErr, updateResult) => {
                if (updateErr) {
                  return res.status(500).json({ message: 'Error updating password', error: updateErr });
                }
                return res.json({ message: 'Password updated successfully' });
              });
            } else {
              // If email not found in either table
              return res.status(404).json({ message: 'Account not found' });
            }
          });
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  return router;
};
