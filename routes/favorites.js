const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Add to favorites
  router.post('/favorites', async (req, res) => {
    const { user_id, hairstyle_id } = req.body;
    
    try {
      // Check if already favorited
      const [existing] = await db.promise().query(
        'SELECT * FROM favorites WHERE user_id = ? AND hairstyle_id = ?',
        [user_id, hairstyle_id]
      );

      if (existing.length > 0) {
        // If already favorited, remove it
        await db.promise().query(
          'DELETE FROM favorites WHERE user_id = ? AND hairstyle_id = ?',
          [user_id, hairstyle_id]
        );
        res.json({ message: 'Removed from favorites', isFavorite: false });
      } else {
        // If not favorited, add it
        await db.promise().query(
          'INSERT INTO favorites (user_id, hairstyle_id) VALUES (?, ?)',
          [user_id, hairstyle_id]
        );
        res.json({ message: 'Added to favorites', isFavorite: true });
      }
    } catch (error) {
      console.error('Error managing favorites:', error);
      res.status(500).json({ error: 'Failed to manage favorites' });
    }
  });

  // Get user's favorites
  router.get('/favorites/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
      const [favorites] = await db.promise().query(
        'SELECT hairstyle_id FROM favorites WHERE user_id = ?',
        [userId]
      );
      res.json(favorites.map(f => f.hairstyle_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });

  // Add this new route to get favorite hairstyles with details
  router.get('/favorites/details/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
      const [favorites] = await db.promise().query(
        `SELECT h.* 
         FROM hairstyle h
         INNER JOIN favorites f ON h.hairstyle_id = f.hairstyle_id
         WHERE f.user_id = ?`,
        [userId]
      );
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorite hairstyles:', error);
      res.status(500).json({ error: 'Failed to fetch favorite hairstyles' });
    }
  });

  return router;
};
