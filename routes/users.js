const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all users
  router.get('/users', (req, res) => {
    const query = 'SELECT user_id, fullname, username, role, created_at, profile_picture FROM users';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Error fetching users' });
      }
      res.json(results);
    });
  });

  // Modified profile picture endpoint
  router.get('/users/:id/profile-picture', (req, res) => {
    const userId = req.params.id;
    console.log('Fetching profile picture for user:', userId); // Debug log

    const query = 'SELECT profile_picture FROM users WHERE user_id = ?';
    
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching profile picture:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        console.log('No user found with ID:', userId);
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't add extra 'uploads/' prefix since it's already in the database path
      const profilePicture = results[0].profile_picture;
      console.log('Profile picture path:', profilePicture);
      res.json({ profilePicture });
    });
  });
  
  return router;
};