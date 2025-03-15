const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/hairstyles');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
}).single('hairstyle_picture');

module.exports = (db) => {
    const router = express.Router();

    // Route to edit a hairstyle
    router.put('/hairstyles/:id', (req, res) => {
        upload(req, res, async function(err) {
            if (err) {
                console.error('Error in file upload:', err);
                return res.status(400).json({ message: err.message });
            }

            const hairstyleId = req.params.id;

            try {
                // First get the current hairstyle to get the old image path
                const [oldHairstyle] = await db.promise().query(
                    'SELECT hairstyle_picture FROM hairstyle WHERE hairstyle_id = ?',
                    [hairstyleId]
                );

                if (oldHairstyle.length === 0) {
                    return res.status(404).json({ message: 'Hairstyle not found' });
                }

                const { hairstyle_name, faceshape, hairtype, hair_length, description } = req.body;
                let hairstyle_picture = oldHairstyle[0].hairstyle_picture; // Keep old picture by default

                if (req.file) {
                    // If new file uploaded, delete old file and update path
                    const oldImagePath = path.join(__dirname, '../public', oldHairstyle[0].hairstyle_picture);
                    try {
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    } catch (error) {
                        console.error('Error deleting old image:', error);
                    }
                    hairstyle_picture = `/hairstyles/${req.file.filename}`;
                }

                const query = `
                    UPDATE hairstyle 
                    SET hairstyle_name = ?, faceshape = ?, hairtype = ?, 
                        hair_length = ?, description = ?, hairstyle_picture = ?
                    WHERE hairstyle_id = ?
                `;

                await db.promise().query(query, [
                    hairstyle_name, 
                    faceshape, 
                    hairtype, 
                    hair_length, 
                    description,
                    hairstyle_picture,
                    hairstyleId
                ]);

                res.status(200).json({ 
                    message: 'Hairstyle updated successfully',
                    hairstyle_picture: hairstyle_picture
                });
            } catch (error) {
                console.error('Error updating hairstyle:', error);
                res.status(500).json({ message: 'Error updating hairstyle' });
            }
        });
    });

    return router;
};
