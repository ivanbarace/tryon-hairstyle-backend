const express = require('express');
const router = express.Router();
const { sendVerificationEmail } = require('./mailer');

// Add validatePassword function
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

module.exports = (db) => {
  router.post('/forgot-password', async (req, res) => {
    const { email, newPassword } = req.body;

    // Add password validation if newPassword is provided
    if (newPassword) {
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }
    }

    try {
      // Check both users and admin tables
      const userQuery = 'SELECT user_id, email, "user" as role FROM users WHERE email = ?';
      const adminQuery = 'SELECT admin_id, email, "admin" as role FROM admin WHERE email = ?';

      // Execute both queries concurrently
      const [userResults, adminResults] = await Promise.all([
        new Promise((resolve, reject) => {
          db.query(userQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(adminQuery, [email], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        })
      ]);

      // Check if email exists in either table
      const account = userResults[0] || adminResults[0];

      if (!account) {
        return res.status(404).json({ 
          message: 'No account found with this email address.' 
        });
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        // Send verification email
        const success = await sendVerificationEmail(email, verificationCode);
        
        if (success) {
          // Return the verification code along with account type
          res.json({ 
            message: 'Verification code sent successfully',
            verificationCode: verificationCode,
            accountType: account.role // This will be either "user" or "admin"
          });
        } else {
          res.status(500).json({ 
            message: 'Failed to send verification email' 
          });
        }
      } catch (error) {
        res.status(500).json({ 
          message: 'Server error', 
          error: error.message 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        message: 'Database error', 
        error: error.message 
      });
    }
  });

  return router;
};