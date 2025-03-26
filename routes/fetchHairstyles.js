const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/hairstyles', (req, res) => {
        const query = `
            SELECT 
                h.hairstyle_id,
                h.hairstyle_name,
                h.hairstyle_picture,
                h.hairtype,
                h.hair_length,
                h.description,
                h.created_at,
                h.status,
                GROUP_CONCAT(DISTINCT hf.faceshape SEPARATOR ', ') as faceshape,
                GROUP_CONCAT(DISTINCT hf.faceshape) as face_shapes
            FROM hairstyle h
            LEFT JOIN hairstyle_faceshape hf ON h.hairstyle_id = hf.hairstyle_id
            WHERE h.status = "active"
            GROUP BY 
                h.hairstyle_id,
                h.hairstyle_name,
                h.hairstyle_picture,
                h.hairtype,
                h.hair_length,
                h.description,
                h.created_at,
                h.status
            ORDER BY h.created_at DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching hairstyles:', err);
                return res.status(500).json({ message: 'Error fetching hairstyles' });
            }

            // Process the results to handle multiple face shapes
            const processedResults = results.map(row => ({
                ...row,
                face_shapes: row.face_shapes ? row.face_shapes.split(',') : [],
                faceshape: row.faceshape || '' // Keep the comma-separated string for faceshape
            }));

            res.json(processedResults);
        });
    });

    return router;
};