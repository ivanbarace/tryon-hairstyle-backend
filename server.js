const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();  // Add this line at the top

// Create an instance of Express app
const app = express();

// Enable CORS for both localhost and the IP address range
const allowedOrigins = [
  'https://tryon-hairstyle.vercel.app', // Add your Vercel domain
  'https://tryon-hairstyle-christian-ivan-baraces-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost',
  'https://tryon-hairstyle-git-main-christian-ivan-baraces-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

// Update CORS headers for static files
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
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

// Add this utility function after your imports
const normalizeFilePath = (path) => {
  return path.replace(/^\/+/, ''); // Remove leading slashes
};

// Update hairstyles static serving
app.use('/hairstyles', express.static(path.join(__dirname, 'public/hairstyles'), {
  setHeaders: (res, path) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Update facemesh static serving
app.use('/facemesh', express.static(path.join(__dirname, 'public/facemesh'), {
  setHeaders: (res, path) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'image/png');
  }
}));

// Add debugging for facemesh requests
app.use((req, res, next) => {
  if (req.url.includes('facemesh')) {
    console.log('Facemesh request:', {
      url: req.url,
      method: req.method,
      path: path.join(__dirname, 'public', req.url)
    });
  }
  next();
});

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

// Add a debugging middleware specifically for hairstyle images
app.use((req, res, next) => {
  if (req.url.startsWith('/hairstyles/')) {
    console.log('Accessing hairstyle:', {
      url: req.url,
      absolutePath: path.join(__dirname, 'public', req.url)
    });
  }
  next();
});

// Add debug middleware for hairstyle routes
app.use((req, res, next) => {
  if (req.url.startsWith('/hairstyles')) {
    console.log('Accessing hairstyle:', {
      url: req.url,
      absolutePath: path.join(__dirname, 'public', 'hairstyles', path.basename(req.url))
    });
  }
  next();
});

// Add this debug middleware for hairstyle routes
app.use((req, res, next) => {
  if (req.url.includes('hairstyles')) {
    console.log('Accessing hairstyle:', {
      url: req.url,
      fullPath: path.join(__dirname, 'public', req.url)
    });
  }
  next();
});

// MySQL database connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Remove the db.connect() check since pool handles connections automatically
// Instead, test the pool connection like this:
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
  connection.release();
});

// Add error handling for the pool
db.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
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
app.use('/', dashboardStatsRoute);
app.use('/', contactRoute); // Add this with your other route uses
app.use('/', messagesRoute);

// Add this before error handling middleware
app.get('/', (req, res) => {
  res.json({
    message: 'TryOn Hairstyle API is running',
    status: 'active',
    version: '1.0.0',
    endpoints: [
      '/login',
      '/register',
      '/users',
      '/hairstyles',
      // Add other main endpoints here
    ]
  });
});

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

// Update the server listening configuration
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});