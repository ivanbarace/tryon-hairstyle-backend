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

    router.put('/hairstyles/:id', (req, res) => {
        upload(req, res, async function(err) {
            if (err) {
                console.error('Error in file upload:', err);
                return res.status(400).json({ message: err.message });
            }

            const hairstyleId = req.params.id;

            try {
                const connection = await new Promise((resolve, reject) => {
                    db.getConnection((err, conn) => {
                        if (err) reject(err);
                        resolve(conn);
                    });
                });

                try {
                    await connection.promise().beginTransaction();

                    // Get current hairstyle
                    const [oldHairstyle] = await connection.promise().query(
                        'SELECT hairstyle_picture FROM hairstyle WHERE hairstyle_id = ?',
                        [hairstyleId]
                    );

                    if (oldHairstyle.length === 0) {
                        return res.status(404).json({ message: 'Hairstyle not found' });
                    }

                    const { hairstyle_name, face_shapes, hairtype, hair_length, description } = req.body;
                    let hairstyle_picture = oldHairstyle[0].hairstyle_picture;

                    // Handle image update if new file is uploaded
                    if (req.file) {
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

                    // Update main hairstyle table
                    await connection.promise().query(
                        `UPDATE hairstyle 
                        SET hairstyle_name = ?, hairtype = ?, 
                            hair_length = ?, description = ?, hairstyle_picture = ?
                        WHERE hairstyle_id = ?`,
                        [hairstyle_name, hairtype, hair_length, description, hairstyle_picture, hairstyleId]
                    );

                    // Update face shapes
                    if (face_shapes) {
                        const parsedFaceShapes = JSON.parse(face_shapes);
                        
                        // Delete all existing face shapes for this hairstyle
                        await connection.promise().query(
                            'DELETE FROM hairstyle_faceshape WHERE hairstyle_id = ?',
                            [hairstyleId]
                        );

                        // Insert new face shapes
                        if (Array.isArray(parsedFaceShapes) && parsedFaceShapes.length > 0) {
                            const insertPromises = parsedFaceShapes
                                .filter(shape => shape && shape.trim()) // Filter out empty strings
                                .map(shape => 
                                    connection.promise().query(
                                        'INSERT INTO hairstyle_faceshape (hairstyle_id, faceshape) VALUES (?, ?)',
                                        [hairstyleId, shape]
                                    )
                                );
                            
                            await Promise.all(insertPromises);
                        }
                    }

                    await connection.promise().commit();
                    res.status(200).json({ 
                        message: 'Hairstyle updated successfully',
                        hairstyle_picture: hairstyle_picture
                    });

                } catch (error) {
                    await connection.promise().rollback();
                    throw error;
                } finally {
                    connection.release();
                }

            } catch (error) {
                console.error('Error updating hairstyle:', error);
                res.status(500).json({ message: 'Error updating hairstyle' });
            }
        });
    });

    return router;
};
