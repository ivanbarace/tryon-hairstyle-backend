const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (db) => {
  router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
      // First check if user exists
      const [currentUser] = await db.promise().query(
        'SELECT user_id, password FROM users WHERE email = ?',
        [email]
      );

      if (currentUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get all other users' passwords to check for duplicates
      const [allUsers] = await db.promise().query(
        'SELECT password FROM users WHERE email != ?',
        [email]
      );

      // Check if the new password matches any existing passwords
      for (const user of allUsers) {
        const passwordExists = await bcrypt.compare(newPassword, user.password);
        if (passwordExists) {
          return res.status(400).json({
            message: 'This password is already in use by another user. Please choose a different password.'
          });
        }
      }

      // Check if new password is same as current password
      const isSamePassword = await bcrypt.compare(newPassword, currentUser[0].password);
      if (isSamePassword) {
        return res.status(400).json({
          message: 'New password cannot be the same as your current password'
        });
      }

      // Hash and update the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.promise().query(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error in reset-password:', error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
    }
  });

  return router;
};
