const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/admin/ratings/:hairstyleId', async (req, res) => {
    const { hairstyleId } = req.params;
    
    try {
      const query = `
        SELECT r.*, u.username 
        FROM ratings r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.hairstyle_id = ?
        ORDER BY r.created_at DESC
      `;
      
      db.query(query, [hairstyleId], (error, results) => {
        if (error) {
          console.error('Error fetching ratings:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        const averageRating = results.length > 0
          ? results.reduce((acc, curr) => acc + curr.rating, 0) / results.length
          : 0;
          
        res.json({
          ratings: results,
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalRatings: results.length
        });
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
