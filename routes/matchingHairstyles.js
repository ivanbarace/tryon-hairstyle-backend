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
        h.hairstyle_id,
        h.hairstyle_name,
        h.hairstyle_picture as image_url,
        h.hairtype,
        h.hair_length,
        h.description,
        GROUP_CONCAT(hf.faceshape) as faceshape
      FROM hairstyle h
      INNER JOIN hairstyle_faceshape hf ON h.hairstyle_id = hf.hairstyle_id
      WHERE h.status = ?
      AND hf.faceshape = ?
      GROUP BY 
        h.hairstyle_id,
        h.hairstyle_name,
        h.hairstyle_picture,
        h.hairtype,
        h.hair_length,
        h.description
    `;

    db.query(query, [status, faceshape], (err, results) => {
      if (err) {
        console.error('Error fetching matching hairstyles:', err);
        return res.status(500).json({ message: 'Error fetching matching hairstyles' });
      }

      // Process results to include all face shapes
      const processedResults = results.map(row => ({
        ...row,
        face_shapes: row.faceshape ? row.faceshape.split(',') : [],
        faceshape: row.faceshape ? row.faceshape.split(',')[0] : ''
      }));

      res.json(processedResults);
    });
  });

  return router;
};
