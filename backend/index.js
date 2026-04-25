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

// ✅ 404 Catch-all
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.url}`);
  res.status(404).send(`Route ${req.url} not found on this server.`);
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