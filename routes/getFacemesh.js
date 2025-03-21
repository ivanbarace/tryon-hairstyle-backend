const express = require('express');
const router = express.Router();
const path = require('path');

module.exports = (db) => {
  // Debug endpoint
  router.get('/getFacemesh/test', (req, res) => {
    res.json({ message: 'getFacemesh route is working' });
  });

  router.get('/getFacemesh/:userId', (req, res) => {
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

      // Construct the full URL including the backend URL
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const imageUrl = `${baseUrl}/facemesh/${facemeshData.facemesh_data}`;

      console.log('Sending response with full URL:', {
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
