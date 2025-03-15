const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get all users who have sent messages
  router.get('/messages/users', (req, res) => {
    const query = `
      SELECT DISTINCT 
        u.user_id, 
        u.fullname, 
        u.profile_picture,
        u.email,
        (SELECT COUNT(*) FROM contact_messages WHERE user_id = u.user_id AND status = 'pending') as pending_count
      FROM users u
      INNER JOIN contact_messages cm ON u.user_id = cm.user_id
      ORDER BY cm.created_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching users with messages:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });

  // Get messages for a specific user
  router.get('/messages/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
      SELECT * FROM contact_messages 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Mark messages as read
      const updateQuery = `
        UPDATE contact_messages 
        SET status = 'read' 
        WHERE user_id = ? AND status = 'unread'
      `;
      
      db.query(updateQuery, [userId]);
      
      res.json(results);
    });
  });

router.put('/messages/update-status/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
      UPDATE contact_messages 
      SET status = 'seen' 
      WHERE user_id = ? AND status = 'pending'
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error updating message status:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json({ success: true, message: 'Messages updated successfully' });
    });
  });

  router.get('/messages/total-pending', (req, res) => {
    const query = `
      SELECT COUNT(*) as total 
      FROM contact_messages 
      WHERE status = 'pending'
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching total pending:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json({ total: results[0].total });
    });
  });

  return router;
};
