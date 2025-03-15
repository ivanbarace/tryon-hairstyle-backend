const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/matching_hairstyles/:faceshape/:hairtype/:hair_length', (req, res) => {
    const { faceshape, hairtype, hair_length } = req.params;

    const query = `
      SELECT 
        hairstyle_id as id,
        hairstyle_name as name,
        hairstyle_picture as image_url,
        faceshape,
        hairtype,
        hair_length,
        description,
        created_at
      FROM hairstyle 
      WHERE faceshape = ? 
      AND hairtype = ? 
      AND hair_length = ? 
      AND status = "active"
      ORDER BY created_at DESC
    `;

    db.query(query, [faceshape, hairtype, hair_length], (err, results) => {
      if (err) {
        console.error('Error fetching matching hairstyles:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
      }
      res.json(results);
    });
  });

  router.get('/matching-hairstyles/:faceshape', (req, res) => {
    const faceshape = req.params.faceshape;

    const query = `
        SELECT * FROM hairstyle 
        WHERE faceshape = ? 
        AND status = 'active'
        ORDER BY created_at DESC
    `;

    db.query(query, [faceshape], (err, results) => {
        if (err) {
            console.error('Error fetching matching hairstyles:', err);
            return res.status(500).json({ message: 'Error fetching matching hairstyles' });
        }
        
        // Add logging to help debug
        console.log(`Found ${results.length} hairstyles for face shape: ${faceshape}`);
        
        res.json(results.map(hairstyle => ({
            id: hairstyle.hairstyle_id,
            name: hairstyle.hairstyle_name,
            image_url: hairstyle.hairstyle_picture,
            hairtype: hairstyle.hairtype,
            hair_length: hairstyle.hair_length,
            description: hairstyle.description
        })));
    });
  });

  return router;
};
