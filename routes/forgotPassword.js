const express = require('express');
const router = express.Router();
const { sendVerificationEmail } = require('./mailer');

module.exports = (db) => {
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Check if email exists in database
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error', error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'No account found with this email address.' });
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        // Send verification email
        const success = await sendVerificationEmail(email, verificationCode);
        
        if (success) {
          // Store the verification code temporarily (you might want to save this in the database)
          res.json({ 
            message: 'Verification code sent successfully',
            verificationCode: verificationCode 
          });
        } else {
          res.status(500).json({ message: 'Failed to send verification email' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    });
  });

  return router;
};