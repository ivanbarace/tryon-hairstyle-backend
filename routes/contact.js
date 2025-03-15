const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.post('/contact', async (req, res) => {
    const { userId, message, fullname } = req.body;

    try {
      // Debug log to verify received data
      console.log('Received contact form data:', { userId, message, fullname });

      const query = `
        INSERT INTO contact_messages 
        (user_id, fullname, message, status, created_at) 
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `;

      const [result] = await db.promise().execute(query, [userId, fullname, message]);

      if (result.affectedRows > 0) {
        res.status(200).json({
          success: true,
          message: 'Message sent successfully'
        });
      } else {
        throw new Error('Failed to insert message');
      }
    } catch (error) {
      console.error('Error details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  });

  return router;
};
