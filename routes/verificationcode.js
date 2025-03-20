const express = require('express');
const router = express.Router();
const { sendVerificationEmail } = require('./mailer');

module.exports = (db) => {
  router.post('/send-verification', async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
      const result = await sendVerificationEmail(email, verificationCode);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false,
          message: result.message
        });
      }

      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code.',
        error: error.message 
      });
    }
  });

  router.post('/check-email', (req, res) => {
    const { email } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking email', error: err });
      }

      res.json({ exists: results.length > 0 });
    });
  });

  router.post('/check-username', (req, res) => {
    const { username } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking username', error: err });
      }

      res.json({ exists: results.length > 0 });
    });
  });

  return router;
};