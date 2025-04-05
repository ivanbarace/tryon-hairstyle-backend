const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (db) => {
  router.post('/admin/verify-credentials', async (req, res) => {
    const { email, currentPassword } = req.body;

    try {
      const [admin] = await db.promise().query(
        'SELECT * FROM admin WHERE email = ?',
        [email]
      );

      if (admin.length === 0 || !(await bcrypt.compare(currentPassword, admin[0].password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      res.json({ success: true, admin_id: admin[0].admin_id });
    } catch (error) {
      console.error('Error verifying credentials:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.put('/admin/update-password/:admin_id', async (req, res) => {
    const { newPassword } = req.body;
    const { admin_id } = req.params;

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await db.promise().query(
        'UPDATE admin SET password = ? WHERE admin_id = ?',
        [hashedPassword, admin_id]
      );

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
