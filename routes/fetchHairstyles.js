const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Route to get all hairstyles
    router.get('/hairstyles', (req, res) => {
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