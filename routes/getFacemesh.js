const express = require('express');
const router = express.Router();
const path = require('path');

// Add allowed origins array at the top
const allowedOrigins = [
  'https://tryon-hairstyle.vercel.app',
  'https://tryon-hairstyle-christian-ivan-baraces-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost',
  'https://tryon-hairstyle-git-main-christian-ivan-baraces-projects.vercel.app'
];

module.exports = (db) => {
  // Debug endpoint
  router.get('/getFacemesh/test', (req, res) => {
    res.json({ message: 'getFacemesh route is working' });
  });

  router.get('/getFacemesh/:userId', (req, res) => {
    // Update CORS headers
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');

    const userId = req.params.userId;
    console.log('Fetching facemesh for user:', userId); // Debug log

    const query = `
      SELECT uf.facemesh_data, uf.faceshape 
      FROM user_facemesh uf
      WHERE uf.user_id = ?
      ORDER BY uf.created_at DESC 
      LIMIT 1`;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Database error',
          details: err.message 
        });
      }

      console.log('Query results:', results); // Debug log

      if (!results || results.length === 0) {
        return res.status(404).json({ 
          error: 'No facemesh found',
          userId: userId
        });
      }

      const facemeshData = results[0];
      
      // Verify the data exists
      if (!facemeshData.facemesh_data) {
        return res.status(404).json({ 
          error: 'Facemesh data is missing',
          userId: userId
        });
      }

      // Construct the full URL for the image
      const imageUrl = `/facemesh/${facemeshData.facemesh_data}`;
      
      console.log('Sending response:', {
        imageUrl,
        faceShape: facemeshData.faceshape
      }); // Debug log

      res.json({
        facemeshImage: imageUrl,
        faceShape: facemeshData.faceshape
      });
    });
  });

  return router;
};
