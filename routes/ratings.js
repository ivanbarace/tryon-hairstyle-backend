const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get ratings for a specific hairstyle
  router.get('/ratings/:hairstyleId', async (req, res) => {
    try {
      // Get all ratings
      const [ratings] = await db.promise().query(
        `SELECT r.*, u.username 
         FROM ratings r 
         JOIN users u ON r.user_id = u.user_id 
         WHERE r.hairstyle_id = ? 
         ORDER BY r.created_at DESC`,
        [req.params.hairstyleId]
      );

      // Calculate average rating and count
      const [avgResult] = await db.promise().query(
        `SELECT 
          COALESCE(ROUND(AVG(rating), 1), 0) as averageRating,
          COUNT(*) as totalRatings
         FROM ratings 
         WHERE hairstyle_id = ?`,
        [req.params.hairstyleId]
      );

      res.json({
        ratings: ratings || [],
        averageRating: avgResult[0].averageRating || 0,
        totalRatings: avgResult[0].totalRatings || 0
      });
    } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add or update a rating
  router.post('/ratings', async (req, res) => {
    const { user_id, hairstyle_id, rating, comment } = req.body;

    try {
      // Check if user has already rated this hairstyle
      const [existing] = await db.promise().query(
        'SELECT rating_id FROM ratings WHERE user_id = ? AND hairstyle_id = ?',
        [user_id, hairstyle_id]
      );

      if (existing.length > 0) {
        // Update existing rating
        await db.promise().query(
          'UPDATE ratings SET rating = ?, comment = ? WHERE user_id = ? AND hairstyle_id = ?',
          [rating, comment, user_id, hairstyle_id]
        );
      } else {
        // Insert new rating
        await db.promise().query(
          'INSERT INTO ratings (user_id, hairstyle_id, rating, comment) VALUES (?, ?, ?, ?)',
          [user_id, hairstyle_id, rating, comment]
        );
      }

      // Get average rating for the hairstyle
      const [avgRating] = await db.promise().query(
        'SELECT AVG(rating) as average FROM ratings WHERE hairstyle_id = ?',
        [hairstyle_id]
      );

      res.json({ 
        success: true, 
        message: existing.length > 0 ? 'Rating updated' : 'Rating added',
        averageRating: avgRating[0].average 
      });
    } catch (error) {
      console.error('Error adding/updating rating:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
