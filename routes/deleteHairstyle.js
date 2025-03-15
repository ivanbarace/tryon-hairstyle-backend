const express = require('express');
const path = require('path');
const fs = require('fs');

module.exports = (db) => {
    const router = express.Router();

    router.delete('/hairstyles/:id', async (req, res) => {
        const hairstyleId = req.params.id;

        try {
            // Update status to 'archived' instead of deleting
            await db.promise().query(
                'UPDATE hairstyle SET status = "archived" WHERE hairstyle_id = ?', 
                [hairstyleId]
            );

            res.json({ message: 'Hairstyle archived successfully' });
        } catch (error) {
            console.error('Error in archive operation:', error);
            res.status(500).json({ message: 'Error archiving hairstyle' });
        }
    });

    return router;
};