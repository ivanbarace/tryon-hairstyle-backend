const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/hairstyles');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created directory:', uploadDir);
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}

// Configure multer for file upload with error handling
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + path.extname(file.originalname);
        cb(null, filename);
    }
});

// Add error handling to multer
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

    // Route to add a new hairstyle
    router.post('/hairstyles', (req, res) => {
        upload(req, res, function(err) {
            if (err) {
                console.error('Error in file upload:', err);
                return res.status(400).json({ message: err.message });
            }

            try {
                const { hairstyle_name, faceshape, hairtype, hair_length, description } = req.body;
                
                if (!req.file) {
                    return res.status(400).json({ message: 'No image file uploaded' });
                }

                const hairstyle_picture = `/hairstyles/${req.file.filename}`;

                const query = `
                    INSERT INTO hairstyle 
                    (hairstyle_name, hairstyle_picture, faceshape, hairtype, hair_length, description, status)
                    VALUES (?, ?, ?, ?, ?, ?, "active")
                `;

                db.query(
                    query,
                    [hairstyle_name, hairstyle_picture, faceshape, hairtype, hair_length, description],
                    (err, result) => {
                        if (err) {
                            console.error('Error adding hairstyle to database:', err);
                            return res.status(500).json({ message: 'Error adding hairstyle to database' });
                        }
                        res.status(201).json({ 
                            message: 'Hairstyle added successfully', 
                            id: result.insertId,
                            filepath: hairstyle_picture
                        });
                    }
                );
            } catch (error) {
                console.error('Error in hairstyle upload:', error);
                res.status(500).json({ message: 'Server error while uploading hairstyle' });
            }
        });
    });

    return router;
};