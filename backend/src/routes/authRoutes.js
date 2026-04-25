const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Normal Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// 🔥 Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

    try {
      if (!req.user) {
        console.error("No user found in request after Google auth");
        return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=no_user_found`);
      }

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing");
        return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=missing_jwt_secret`);
      }

      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );

      return res.redirect(`${redirectBase}/login?token=${token}`);
    } catch (err) {
      console.error("Google Callback Error:", err);
      return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=${encodeURIComponent(err.message)}`);
    }
  }
);

// Test route
router.get('/test', (req, res) => {
  res.send("API working 🚀");
});
router.get('/google-test', (req, res) => {
  res.send("Google route working");
});

module.exports = router;