const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please input all fields.' });
    }

    // First, try to find admin
    const adminQuery = 'SELECT * FROM admin WHERE username = ?';
    db.query(adminQuery, [username], async (err, adminResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (adminResults.length > 0) {
        const admin = adminResults[0];
        const match = await bcrypt.compare(password, admin.password);

        if (match) {
          // Send admin data without password
          const { password, ...adminData } = admin;
          console.log('Admin login data:', adminData); // Debug log
          return res.json({
            success: true,
            message: 'Admin login successful',
            user: {
              admin_id: admin.admin_id,
              fullname: admin.fullname,
              username: admin.username,
              profile_picture: admin.profile_picture,
              role: 'admin'
            },
            isAdmin: true
          });
        }
      }

      // If not found in admin table, check users table
      const userQuery = 'SELECT user_id, fullname, username, password, role, profile_picture FROM users WHERE username = ?';
      
      db.query(userQuery, [username], (err, userResults) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error occurred.' });
        }

        if (userResults.length === 0) {
          return res.status(401).json({ message: 'Username does not exist.' });
        }

        const user = userResults[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Bcrypt error:', err);
            return res.status(500).json({ message: 'Authentication error occurred.' });
          }

          if (isMatch) {
            const userSession = {
              id: user.user_id,
              username: user.username,
              fullname: user.fullname,
              profilePicture: user.profile_picture ? user.profile_picture : null,
            };

            return res.status(200).json({ 
              message: 'Login successful',
              role: user.role,
              user: userSession,
            });
          } else {
            return res.status(401).json({ message: 'Wrong credentials.' });
          }
        });
      });
    });
  });

  return router;
};