const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

module.exports = (db) => {
  // Ensure the savetryon directory exists
  const saveTryonDir = path.join(__dirname, '../public/savetryon');
  if (!fs.existsSync(saveTryonDir)) {
    fs.mkdirSync(saveTryonDir, { recursive: true });
  }

  router.post('/save-tryon', async (req, res) => {
    try {
      const { userId, faceShape, imageData } = req.body;

      // Ensure the image data is valid
      if (!imageData || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      // Remove the data URL prefix to get just the base64 data
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      
      // Create unique filename
      const filename = `tryon_${userId}_${Date.now()}.png`;
      const filepath = path.join(saveTryonDir, filename);
      
      // Save the image file
      fs.writeFileSync(filepath, base64Data, 'base64');

      // Save to database
      const relativePath = `/public/savetryon/${filename}`;
      const query = `
        INSERT INTO user_tryon (user_id, faceshape, tryon_picture)
        VALUES (?, ?, ?)
      `;

      db.query(query, [userId, faceShape, relativePath], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save try-on data' });
        }

        res.json({
          success: true,
          message: 'Try-on saved successfully',
          tryonId: result.insertId,
          imagePath: relativePath
        });
      });

    } catch (error) {
      console.error('Error saving try-on:', error);
      res.status(500).json({ error: 'Failed to save try-on', details: error.message });
    }
  });

  return router;
};
