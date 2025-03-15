const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
  router.post('/saveFacemesh', async (req, res) => {
    console.log('Received save facemesh request');
    
    const { userId, facemeshData, faceShape } = req.body;

    if (!userId || !facemeshData || !faceShape) {
      console.log('Missing fields:', { userId, hasFacemeshData: !!facemeshData, faceShape });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    try {
      // Create base64 image data
      const base64Data = facemeshData.replace(/^data:image\/png;base64,/, '');

      // Use correct path to public/facemesh directory
      const facemeshDir = path.join(__dirname, '../public/facemesh');
      console.log('Facemesh directory:', facemeshDir);
      
      // Ensure the directory exists
      if (!fs.existsSync(facemeshDir)) {
        console.log('Creating facemesh directory');
        fs.mkdirSync(facemeshDir, { recursive: true });
      }

      // Generate filename using userId and timestamp
      const filename = `facemesh_${userId}_${Date.now()}.png`;
      const filepath = path.join(facemeshDir, filename);

      try {
        // Check if entry exists first to get old image filename
        const [existingRows] = await db.promise().query(
          'SELECT facemesh_data FROM user_facemesh WHERE user_id = ?',
          [userId]
        );

        // Delete old image if it exists
        if (existingRows.length > 0 && existingRows[0].facemesh_data) {
          const oldFilePath = path.join(facemeshDir, existingRows[0].facemesh_data);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
              console.log('Old image deleted successfully:', oldFilePath);
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
              // Continue with the process even if delete fails
            }
          }
        }

        // Save the new image
        fs.writeFileSync(filepath, base64Data, 'base64');
        console.log('New image saved successfully to:', filepath);

        // Database operations
        try {
          if (existingRows.length > 0) {
            // Update existing record
            await db.promise().query(
              'UPDATE user_facemesh SET facemesh_data = ?, faceshape = ? WHERE user_id = ?',
              [filename, faceShape, userId]
            );
            console.log('Updated existing record');
          } else {
            // Insert new record
            await db.promise().query(
              'INSERT INTO user_facemesh (user_id, facemesh_data, faceshape) VALUES (?, ?, ?)',
              [userId, filename, faceShape]
            );
            console.log('Inserted new record');
          }

          res.json({ 
            success: true, 
            message: 'Facemesh data saved successfully',
            filepath: `/facemesh/${filename}`
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Cleanup the new saved image if database operation fails
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          throw dbError;
        }
      } catch (fsError) {
        console.error('File system error:', fsError);
        throw fsError;
      }
    } catch (error) {
      console.error('Error saving facemesh:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error saving facemesh data',
        error: error.message,
        stack: error.stack
      });
    }
  });

  return router;
};
