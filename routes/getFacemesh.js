const express = require('express');
const router = express.Router();
const path = require('path');

module.exports = (db) => {
  // Debug endpoint
  router.get('/getFacemesh/test', (req, res) => {
    res.json({ message: 'getFacemesh route is working' });
  });

  router.get('/getFacemesh/:userId', (req, res) => {
    // Set CORS headers specifically for this route
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
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

      // Return the complete data
      res.json({
        success: true,
        facemeshData: facemeshData.facemesh_data,
        faceShape: facemeshData.faceshape,
        fullPath: `public/facemesh/${facemeshData.facemesh_data}` // Add this line
      });
    });
  });

  return router;
};
