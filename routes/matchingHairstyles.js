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
    const { faceshape } = req.params;
    const { status = 'active' } = req.query;

    const query = `
      SELECT DISTINCT
        h.hairstyle_id as id,
        h.hairstyle_name as name,
        h.hairstyle_picture as image_url,
        h.hairtype,
        h.hair_length,
        h.description,
        h.created_at,
        GROUP_CONCAT(DISTINCT hf.faceshape) as faceshapes
      FROM hairstyle h
      LEFT JOIN hairstyle_faceshape hf ON h.hairstyle_id = hf.hairstyle_id
      WHERE h.status = ?
      AND EXISTS (
        SELECT 1 
        FROM hairstyle_faceshape hf2 
        WHERE hf2.hairstyle_id = h.hairstyle_id 
        AND LOWER(hf2.faceshape) = LOWER(?)
      )
      GROUP BY 
        h.hairstyle_id,
        h.hairstyle_name,
        h.hairstyle_picture,
        h.hairtype,
        h.hair_length,
        h.description,
        h.created_at
      ORDER BY h.created_at DESC
    `;

    db.query(query, [status, faceshape], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          message: 'Error fetching matching hairstyles',
          error: err.message 
        });
      }

      try {
        const processedResults = results.map(row => ({
          ...row,
          faceshapes: row.faceshapes ? row.faceshapes.split(',') : []
        }));

        res.json(processedResults);
      } catch (error) {
        console.error('Error processing results:', error);
        res.status(500).json({ 
          message: 'Error processing hairstyle data',
          error: error.message 
        });
      }
    });
  });

  return router;
};
