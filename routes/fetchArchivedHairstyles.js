const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/archived-hairstyles', (req, res) => {
        const query = 'SELECT * FROM hairstyle WHERE status = "archived" ORDER BY created_at DESC';
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching archived hairstyles:', err);
                return res.status(500).json({ message: 'Error fetching archived hairstyles' });
            }
            res.json(results);
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
