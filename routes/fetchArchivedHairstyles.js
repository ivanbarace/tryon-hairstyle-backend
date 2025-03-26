const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/archived-hairstyles', (req, res) => {
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
                GROUP_CONCAT(DISTINCT hf.faceshape) as faceshape
            FROM hairstyle h
            LEFT JOIN hairstyle_faceshape hf ON h.hairstyle_id = hf.hairstyle_id
            WHERE h.status = "archived"
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
                console.error('Error fetching archived hairstyles:', err);
                return res.status(500).json({ message: 'Error fetching archived hairstyles' });
            }

            // Process results to handle multiple face shapes
            const processedResults = results.map(row => ({
                ...row,
                face_shapes: row.faceshape ? row.faceshape.split(',') : [],
                faceshape: row.faceshape ? row.faceshape.split(',')[0] : ''
            }));

            res.json(processedResults);
        });
    });

    // Add route to restore archived hairstyle
    router.put('/restore-hairstyle/:id', async (req, res) => {
        const hairstyleId = req.params.id;

        try {
            await db.promise().query(
                'UPDATE hairstyle SET status = "active" WHERE hairstyle_id = ?',
                [hairstyleId]
            );

            res.json({ message: 'Hairstyle restored successfully' });
        } catch (error) {
            console.error('Error restoring hairstyle:', error);
            res.status(500).json({ message: 'Error restoring hairstyle' });
        }
    });

    return router;
};
