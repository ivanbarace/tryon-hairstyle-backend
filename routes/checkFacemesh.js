const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/checkFacemesh/:userId', (req, res) => {
    const { userId } = req.params;

    const query = 'SELECT * FROM user_facemesh WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error checking facemesh data:', err);
        return res.status(500).json({ message: 'Error checking facemesh data.' });
      }

      if (results.length > 0) {
        res.status(200).json({ exists: true });
      } else {
        res.status(200).json({ exists: false });
      }
    });
  });

  return router;
};
