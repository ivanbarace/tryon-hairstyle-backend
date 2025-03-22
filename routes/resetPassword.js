const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Changed from bcrypt to bcryptjs

module.exports = (db) => {
  router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

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
