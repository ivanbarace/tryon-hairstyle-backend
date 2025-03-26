const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Route to get all hairstyles for users
    router.get('/user/hairstyles', (req, res) => {
        const query = `
            SELECT 
                hairstyle_id,
                hairstyle_name,
                hairstyle_picture,
                faceshape,
                hairtype,
                hair_length,
                description
            FROM hairstyle 
            ORDER BY created_at DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching hairstyles for users:', err);
                return res.status(500).json({ message: 'Error fetching hairstyles' });
            }
            res.json(results);
        });
    });

    router.get('/hairstyles-in-user', (req, res) => {
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
                GROUP_CONCAT(DISTINCT hf.faceshape) as face_shapes,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.rating_id) as rating_count
            FROM hairstyle h
            LEFT JOIN hairstyle_faceshape hf ON h.hairstyle_id = hf.hairstyle_id
            LEFT JOIN ratings r ON h.hairstyle_id = r.hairstyle_id
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

            // Process the results to handle both formats
            const processedResults = results.map(row => ({
                ...row,
                face_shapes: row.face_shapes ? row.face_shapes.split(',') : [],
                faceshape: row.faceshape || '',
                average_rating: parseFloat(row.average_rating).toFixed(1)
            }));

            res.json(processedResults);
        });
    });

    router.get('/favorites/details/:userId', (req, res) => {
        const userId = req.params.userId;
        const query = `
            SELECT 
                h.hairstyle_id,
                h.hairstyle_name,
                h.hairstyle_picture,
                h.hairtype,
                h.hair_length,
                h.description,
                GROUP_CONCAT(DISTINCT hf.faceshape SEPARATOR ', ') as faceshape,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.rating_id) as total_ratings
            FROM favorites f
            JOIN hairstyle h ON f.hairstyle_id = h.hairstyle_id
            LEFT JOIN hairstyle_faceshape hf ON h.hairstyle_id = hf.hairstyle_id
            LEFT JOIN ratings r ON h.hairstyle_id = r.hairstyle_id
            WHERE f.user_id = ?
            GROUP BY 
                h.hairstyle_id,
                h.hairstyle_name,
                h.hairstyle_picture,
                h.hairtype,
                h.hair_length,
                h.description
        `;

        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching favorite details:', err);
                return res.status(500).json({ message: 'Error fetching favorites' });
            }

            const processedResults = results.map(row => ({
                ...row,
                faceshape: row.faceshape || '',  // Keep the comma-separated string
                isFavorite: true,
                averageRating: parseFloat(row.average_rating || 0).toFixed(1),
                totalRatings: row.total_ratings || 0
            }));

            res.json(processedResults);
        });
    });

    return router;
};