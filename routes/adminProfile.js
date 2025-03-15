const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');  // Add this line

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'admin-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = (db) => {
  router.get('/admin/:id', (req, res) => {
    const adminId = req.params.id;
    
    // Update the query to use admin_id instead of id
    const query = 'SELECT admin_id, fullname, email, username, profile_picture, role, phone_number, address FROM admin WHERE admin_id = ?';
    
    db.query(query, [adminId], (err, results) => {
      if (err) {
        console.error('Error fetching admin data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      res.json(results[0]);
    });
  });

  router.put('/admin/:id/update', upload.single('profile_picture'), (req, res) => {
    const adminId = req.params.id;
    const { fullname, phone_number, address } = req.body;
    const profile_picture = req.file ? req.file.filename : undefined;

    // First get the current profile picture
    db.query(
      'SELECT profile_picture FROM admin WHERE admin_id = ?',
      [adminId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error fetching current profile' });
        }

        const oldPicture = results[0]?.profile_picture;

        let query = 'UPDATE admin SET fullname = ?, phone_number = ?, address = ?';
        let params = [fullname, phone_number, address];

        if (profile_picture) {
          query += ', profile_picture = ?';
          params.push(profile_picture);
        }

        query += ' WHERE admin_id = ?';
        params.push(adminId);

        db.query(query, params, (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error updating admin profile' });
          }

          // Delete old profile picture if it exists and a new one was uploaded
          if (oldPicture && profile_picture) {
            const oldPicturePath = path.join(__dirname, '../uploads', oldPicture);
            fs.unlink(oldPicturePath, (err) => {
              if (err) {
                console.error('Error deleting old profile picture:', err);
                // Continue anyway since the update was successful
              }
            });
          }

          // Fetch updated admin data
          db.query(
            'SELECT admin_id, fullname, username, email, profile_picture, role, phone_number, address FROM admin WHERE admin_id = ?',
            [adminId],
            (err, results) => {
              if (err) {
                return res.status(500).json({ message: 'Error fetching updated admin data' });
              }
              res.json(results[0]);
            }
          );
        });
      }
    );
  });

  return router;
};
