const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Get user's favorite hairstyles with complete details
  router.get('/user/favorites/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
      const [userFavorites] = await db.promise().query(
        `SELECT h.*, f.created_at as favorited_at
         FROM hairstyle h
         INNER JOIN favorites f ON h.hairstyle_id = f.hairstyle_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
        [userId]
      );

      if (userFavorites.length === 0) {
        return res.json([]);
      }

      res.json(userFavorites);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      res.status(500).json({ error: 'Failed to fetch user favorites' });
    }
  });

  return router;
};
