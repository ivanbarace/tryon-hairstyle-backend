const express = require('express');
module.exports = (db) => {
  const router = express.Router();

  // Fetch user details by ID
  router.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    // Add email to the SELECT statement
    const query = 'SELECT user_id, fullname, username, email, role, profile_picture, created_at FROM users WHERE user_id = ?';

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user details:', err);
        return res.status(500).json({ error: 'Database query error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(results[0]);
    });
  });

  return router;
};
