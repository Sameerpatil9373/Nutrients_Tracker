const express = require('express');
const passport = require('passport');
const { register, login, getMe, googleAuth, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Normal Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// 🔥 Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Test route
router.get('/test', (req, res) => {
  res.send("API working 🚀");
});

module.exports = router;