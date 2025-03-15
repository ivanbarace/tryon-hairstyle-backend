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

    router.get('/hairstyles_in_user', (req, res) => {
        const query = 'SELECT * FROM hairstyle WHERE status = "active" ORDER BY created_at DESC';
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching hairstyles:', err);
                return res.status(500).json({ message: 'Error fetching hairstyles' });
            }
            res.json(results);
        });
    });

    return router;
};