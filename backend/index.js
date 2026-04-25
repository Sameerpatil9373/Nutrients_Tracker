const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');

// Load env vars
dotenv.config();

// Passport config
require('./src/middleware/passport');

const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Trust proxy (Required for Render/Heroku to handle HTTPS cookies)
app.set('trust proxy', 1);

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Session middleware (Required for some Passport strategies even if not used)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// ✅ TEST ROUTE (at the top)
app.get('/', (req, res) => {
  res.status(200).json({ message: "API is running 🚀", timestamp: new Date() });
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ✅ Mount routers
app.use('/api/auth', authRoutes);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  
  if (res.headersSent) {
    return next(err);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
  
  res.redirect(`${redirectBase}/login?error=server_error&details=${encodeURIComponent(err.message || 'unknown_error')}`);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI || process.env.MONGO_URI.trim() === '') {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected...');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error(`❌ Server Initialization Error: ${err.message}`);
    // Still start server to serve the status route even if DB fails
    app.listen(PORT, () => {
      console.log(`⚠️ Server running on port ${PORT} (Database connection failed)`);
    });
  }
};

startServer();