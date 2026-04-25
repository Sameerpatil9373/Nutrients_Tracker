const dns = require("node:dns");
// Set custom DNS servers (Cloudflare + Google)
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');

// Load env vars
dotenv.config();

// Passport config
require('./src/middleware/passport');

const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Passport middleware
app.use(passport.initialize());

// ✅ Mount routers (IMPORTANT)
app.use('/api/auth', authRoutes);

// ✅ TEST ROUTE (optional but useful)
app.get('/', (req, res) => {
  res.send("API is running 🚀");
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