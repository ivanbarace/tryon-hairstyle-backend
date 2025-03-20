const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create an instance of Express app
const app = express();

// Enable CORS for both localhost and the IP address range
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.1.53:5173',
  'http://192.168.1.53',
  'http://localhost',
  'http://192.168.1.22:5173',  // Add your IP address
  'http://192.168.1.22',        // Add your IP address without port
  'https://your-frontend-app.vercel.app', // Add your Vercel frontend URL here
  'https://my-hairstyle.vercel.app'       // Add this if this is your frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin (e.g., mobile apps)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);  // Add logging for debugging
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Update the CORS configuration to explicitly allow image sharing
app.use((req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Middleware to parse JSON
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (e.g., profile pictures, hairstyles, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/hairstyles', express.static(path.join(__dirname, 'public/hairstyles'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Update facemesh static serving to use the correct path
app.use('/facemesh', express.static(path.join(__dirname, 'public/facemesh'), {
  setHeaders: (res, path) => {
    res.setHeader('Content-Type', 'image/png');
  }
}));

// Update static file serving to include CORS headers
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
  }
}));

// Update the static file serving configuration - remove the '/uploads' prefix
app.use('/', express.static(path.join(__dirname)));

// Add debugging middleware for static files
app.use((req, res, next) => {
  if (req.url.includes('uploads')) {
    console.log('Accessing file:', {
      url: req.url,
      absolutePath: path.join(__dirname, req.url)
    });
  }
  next();
});

// Add debugging middleware for static files
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Add this debugging middleware for static files
app.use((req, res, next) => {
  if (req.url.startsWith('/uploads')) {
    console.log('Accessing uploads:', req.url);
  }
  next();
});

// MySQL database connection
const db = mysql.createConnection({
  host: 'b3tlpznphrifzbxlyv7f-mysql.services.clever-cloud.com',
  user: 'unozpclfmu6tzhkc',
  password: 'tVsmyuKsrtTvPiqfqsXE',
  database: 'b3tlpznphrifzbxlyv7f',
});

// Check DB connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the MySQL database.');
  }
});

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add this route before your other routes
app.get('/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'public/facemesh', filename);
  
  if (fs.existsSync(filepath)) {
    res.json({
      exists: true,
      path: filepath,
      stats: fs.statSync(filepath)
    });
  } else {
    res.json({
      exists: false,
      path: filepath
    });
  }
});

// Import routes
const loginRoute = require('./routes/login')(db);
const registerRoute = require('./routes/register')(db);
const verificationRoute = require('./routes/verificationcode')(db); // Add this line
const usersRoute = require('./routes/users')(db);
const fetchHairstylesRoute = require('./routes/fetchHairstyles')(db);
const addHairstyleRoute = require('./routes/addHairstyle')(db);
const editHairstyleRoute = require('./routes/editHairstyle')(db);
const deleteHairstyleRoute = require('./routes/deleteHairstyle')(db);
const fetchHairstylesInUserRoute = require('./routes/fetch_hairstyles_in_User')(db);
const usersProfileRoute = require('./routes/users_profile')(db);
const updateUserRoute = require('./routes/updateUser')(db);
const saveFacemeshRoute = require('./routes/saveFacemesh')(db);
const checkFacemeshRouter = require('./routes/checkFacemesh')(db);
const getFacemeshRoute = require('./routes/getFacemesh')(db);
const favoritesRoute = require('./routes/favorites')(db);
const userFavoritesRoute = require('./routes/userFavorites')(db);
const ratingsRoute = require('./routes/ratings')(db);
const adminRatingsRoute = require('./routes/adminRatings')(db);
const adminProfileRoute = require('./routes/adminProfile')(db);
const topRatedHairstylesRoute = require('./routes/topRatedHairstyles')(db);
const matchingHairstylesRoute = require('./routes/matchingHairstyles')(db);
const forgotPasswordRoute = require('./routes/forgotPassword')(db);
const resetPasswordRoute = require('./routes/resetPassword')(db);
const verifyCredentialsRoute = require('./routes/verifyCredentials')(db); // Add this line
const updatePasswordRoute = require('./routes/updatePassword')(db); // Add this line with your other route imports
const fetchArchivedHairstylesRoute = require('./routes/fetchArchivedHairstyles')(db);
const adminUpdatePasswordRoute = require('./routes/adminUpdatePassword')(db);
const saveTryOnRoute = require('./routes/saveTryOn')(db);
const dashboardStatsRoute = require('./routes/dashboardStats')(db);
const contactRoute = require('./routes/contact')(db); // Add this with your other route imports
const messagesRoute = require('./routes/messages')(db);

// Use routes
app.use('/', loginRoute);
app.use('/', registerRoute);
app.use('/', verificationRoute);
app.use('/', usersRoute);
app.use('/', fetchHairstylesRoute);
app.use('/', addHairstyleRoute);
app.use('/', editHairstyleRoute);
app.use('/', deleteHairstyleRoute);
app.use('/', fetchHairstylesInUserRoute);
app.use('/', usersProfileRoute);
app.use('/', updateUserRoute);
app.use('/', saveFacemeshRoute);
app.use('/', checkFacemeshRouter);
app.use('/', getFacemeshRoute);
app.use('/', favoritesRoute);
app.use('/', userFavoritesRoute);
app.use('/', ratingsRoute);
app.use('/', adminRatingsRoute);
app.use('/', adminProfileRoute);
app.use('/', topRatedHairstylesRoute);
app.use('/', matchingHairstylesRoute);
app.use('/', forgotPasswordRoute);
app.use('/', resetPasswordRoute);
app.use('/', verifyCredentialsRoute); // Add this line
app.use('/', updatePasswordRoute); // Add this line with your other route uses
app.use('/', fetchArchivedHairstylesRoute);
app.use('/', adminUpdatePasswordRoute);
app.use('/', saveTryOnRoute);
app.use('/', dashboardStatsRoute);
app.use('/', contactRoute); // Add this with your other route uses
app.use('/', messagesRoute);

// Add this debug middleware
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Update the listen configuration at the bottom of the file
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Add this for Vercel
module.exports = app;