const express = require('express');
const multer = require('multer');
const path = require('path');
module.exports = (db) => {
  const router = express.Router();
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
  });

  // Update user details by ID
  router.put('/user/:id', upload.single('profilePicture'), (req, res) => {
    const userId = req.params.id;
    const { username, fullname } = req.body;
    let profilePicture = req.file ? `uploads/${req.file.filename}` : null;

    // First check if the username is already taken by another user
    const checkUsernameQuery = 'SELECT user_id FROM users WHERE username = ? AND user_id != ?';
    db.query(checkUsernameQuery, [username, userId], (err, results) => {
      if (err) {
        console.error('Error checking username:', err);
        return res.status(500).json({ error: 'Database query error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // If username is available, proceed with update
      const updateQuery = `
        UPDATE users 
        SET username = ?, 
            fullname = ?, 
            profile_picture = COALESCE(?, profile_picture) 
        WHERE user_id = ?
      `;

      db.query(updateQuery, [username, fullname, profilePicture, userId], (err, results) => {
        if (err) {
          console.error('Error updating user details:', err);
          return res.status(500).json({ error: 'Database query error' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Fetch and return updated user data
        const selectQuery = 'SELECT user_id, fullname, username, email, role, profile_picture, created_at FROM users WHERE user_id = ?';
        db.query(selectQuery, [userId], (err, results) => {
          if (err) {
            console.error('Error fetching updated user details:', err);
            return res.status(500).json({ error: 'Database query error' });
          }

          // Update the localStorage data on successful update
          const userData = results[0];
          res.json({
            ...userData,
            message: 'User updated successfully'
          });
        });
      });
    });
  });

  return router;
};
