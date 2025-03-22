const express = require('express');
const router = express.Router();
const { sendVerificationEmail } = require('./mailer');

module.exports = (db) => {
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

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