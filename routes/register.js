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

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }

    // Check for at least 2 numbers
    if ((password.match(/\d/g) || []).length < 2) {
      return "Password must contain at least 2 numbers";
    }

    // Check for special characters
    if (!/[~!@#$%^&*()_+{:">?"`|}-]/.test(password)) {
      return "Password must contain at least one special character";
    }

    // Check if password is only numbers
    if (/^\d+$/.test(password)) {
      return "Password cannot contain only numbers";
    }

    // Check for common number sequences
    if (/123456789|987654321|12345678|11111111|00000000/.test(password)) {
      return "Password cannot contain common number sequences";
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

  const isPasswordInUse = async (db, plainPassword) => {
    try {
      // Get all existing hashed passwords from both tables
      const [userPasswords, adminPasswords] = await Promise.all([
        new Promise((resolve, reject) => {
          db.query('SELECT password FROM users', (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query('SELECT password FROM admin', (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        })
      ]);

      // Combine all passwords
      const allPasswords = [...userPasswords, ...adminPasswords];

      // Check if the plain password matches any of the hashed passwords
      for (const row of allPasswords) {
        if (row.password) {  // Make sure password exists
          const isMatch = await bcrypt.compare(plainPassword, row.password);
          if (isMatch) {
            return true;  // Password matches an existing hash
          }
        }
      }
      return false;  // No matches found
    } catch (error) {
      console.error('Error checking password:', error);
      throw error;
    }
  };

  router.post('/check-password', async (req, res) => {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'Password is required'
      });
    }

    try {
      const passwordExists = await isPasswordInUse(db, password);
      return res.json({ exists: passwordExists });
    } catch (error) {
      console.error('Error checking password:', error);
      return res.status(500).json({
        message: 'Error checking password',
        error: error.message
      });
    }
  });

  router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { fullname, username, email, password } = req.body;
    const profilePicture = req.file ? `uploads/${req.file.filename}` : null;

    // Basic validation
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

    try {
      // Check if password is already in use BEFORE hashing
      const passwordInUse = await isPasswordInUse(db, password);
      if (passwordInUse) {
        return res.status(400).json({
          message: 'This password is already in use by another user. Please choose a different password.'
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
    } catch (error) {
      console.error('Error during password check:', error);
      return res.status(500).json({
        message: 'Error checking password uniqueness',
        error: error.message
      });
    }
  });

  return router;
};