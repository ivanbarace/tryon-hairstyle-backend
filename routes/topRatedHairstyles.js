const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/top-rated-hairstyles', async (req, res) => {
    try {
      const query = `
        SELECT 
          h.hairstyle_id,
          h.hairstyle_name,
          h.hairstyle_picture,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.rating) as rating_count
        FROM hairstyle h
        LEFT JOIN ratings r ON h.hairstyle_id = r.hairstyle_id
        WHERE h.status = 'active'
        GROUP BY h.hairstyle_id
        ORDER BY average_rating DESC
        LIMIT 10
      `;

      db.query(query, (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Format the results to ensure average_rating is a number
        const formattedResults = results.map(item => ({
          ...item,
          average_rating: Number(item.average_rating)
        }));

        res.json(formattedResults);
      });
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
