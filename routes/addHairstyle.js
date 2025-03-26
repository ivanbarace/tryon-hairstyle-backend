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
        upload(req, res, async function(err) {
            if (err) {
                console.error('Error in file upload:', err);
                return res.status(400).json({ message: err.message });
            }

            try {
                const { hairstyle_name, faceshape, hairtype, hair_length, description } = req.body;
                const additionalFaceShapes = JSON.parse(req.body.additionalFaceShapes || '[]');
                
                if (!req.file) {
                    return res.status(400).json({ message: 'No image file uploaded' });
                }

                const hairstyle_picture = `/hairstyles/${req.file.filename}`;

                // Start a transaction
                const connection = await new Promise((resolve, reject) => {
                    db.getConnection((err, conn) => {
                        if (err) reject(err);
                        resolve(conn);
                    });
                });

                try {
                    await new Promise((resolve, reject) => {
                        connection.beginTransaction(err => {
                            if (err) reject(err);
                            resolve();
                        });
                    });

                    // Insert into hairstyle table (removed faceshape)
                    const [result] = await new Promise((resolve, reject) => {
                        connection.query(
                            `INSERT INTO hairstyle 
                            (hairstyle_name, hairstyle_picture, hairtype, hair_length, description, status)
                            VALUES (?, ?, ?, ?, ?, "active")`,
                            [hairstyle_name, hairstyle_picture, hairtype, hair_length, description],
                            (err, result) => {
                                if (err) reject(err);
                                resolve([result]);
                            }
                        );
                    });

                    // Insert main faceshape and additional face shapes into hairstyle_faceshape
                    const allFaceShapes = [faceshape, ...additionalFaceShapes.filter(shape => shape)];
                    for (const shape of allFaceShapes) {
                        await new Promise((resolve, reject) => {
                            connection.query(
                                'INSERT INTO hairstyle_faceshape (hairstyle_id, faceshape) VALUES (?, ?)',
                                [result.insertId, shape],
                                (err) => {
                                    if (err) reject(err);
                                    resolve();
                                }
                            );
                        });
                    }

                    await new Promise((resolve, reject) => {
                        connection.commit(err => {
                            if (err) reject(err);
                            resolve();
                        });
                    });

                    res.status(201).json({
                        message: 'Hairstyle added successfully',
                        id: result.insertId,
                        filepath: hairstyle_picture
                    });

                } catch (error) {
                    await new Promise(resolve => {
                        connection.rollback(() => resolve());
                    });
                    throw error;
                } finally {
                    connection.release();
                }

            } catch (error) {
                console.error('Error in hairstyle upload:', error);
                res.status(500).json({ message: 'Server error while uploading hairstyle' });
            }
        });
    });

    return router;
};