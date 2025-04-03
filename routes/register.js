const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { sendWelcomeEmail } = require('./mailer');

module.exports = (db) => {
  // Configure multer storage
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

  const validatePassword = (password) => {
    // Check minimum length
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }

    // Check if password is only numbers
    if (/^\d+$/.test(password)) {
      return "Password cannot contain only numbers";
    }

    // Check for common number sequences
    if (/123456789|987654321|12345678|11111111|00000000/.test(password)) {
      return "Password cannot contain common number sequences";
    }

    // Check for upper and lowercase
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      return "Password must contain both uppercase and lowercase letters";
    }

    // Check for common phrases
    const commonPhrases = [
      "iloveyou",
      "password",
      "qwerty",
      "abc123",
      "admin123",
      "welcome",
      "monkey",
    ];
    const lowerPassword = password.toLowerCase().replace(/\s/g, '');
    if (commonPhrases.some(phrase => lowerPassword.includes(phrase))) {
      return "Password contains common phrases that are not allowed";
    }

    return null; // Password is valid
  };

  router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { fullname, username, email, password } = req.body;
    const profilePicture = req.file ? `uploads/${req.file.filename}` : null;

    if (!profilePicture || !fullname || !username || !email || !password) {
      return res.status(400).json({
        message: 'Please input all fields'
      });
    }

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        message: passwordError
      });
    }

    // Additional validations
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      });
    }

    // Check if username exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, usernameResults) => {
      if (err) {
        return res.status(500).json({ message: 'Error checking username', error: err });
      }

      if (usernameResults.length > 0) {
        return res.status(400).json({ message: 'Username already exists. Please choose a different username.' });
      }

      // Check if email exists
      db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error checking email', error: err });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
        }

        // Hash password and create user
        bcrypt.hash(password, 10, async (err, hashedPassword) => {
          if (err) {
            return res.status(500).json({ message: 'Error hashing password', error: err });
          }

          const userRole = 'user';
          const query = 'INSERT INTO users (fullname, username, email, password, role, profile_picture) VALUES (?, ?, ?, ?, ?, ?)';

          db.query(query, [fullname, username, email, hashedPassword, userRole, profilePicture], async (err, result) => {
            if (err) {
              console.error('Error during registration:', err);
              return res.status(500).json({ message: 'Error registering user', error: err });
            }

            // Send welcome email
            try {
              await sendWelcomeEmail(email, fullname);
            } catch (emailError) {
              console.error('Error sending welcome email:', emailError);
              // Continue with registration even if email fails
            }

            // Return more complete user data
            res.status(201).json({ 
              message: 'User registered successfully',
              user: {
                id: result.insertId,
                fullname,
                username,
                email,
                role: userRole,
                profilePicture
              }
            });
          });
        });
      });
    });
  });

  return router;
};