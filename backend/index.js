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

// Passport middleware
app.use(passport.initialize());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '') {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB Connected...');
    } else {
      console.log('⚠️  MongoDB URI not found — auth endpoints will fail until you add it to .env');
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    console.log('⚠️  Server started without database — auth will not work');
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  }
};

startServer();
