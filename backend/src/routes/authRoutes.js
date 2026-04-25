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

router.get('/google/callback', (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error("Passport Auth Error:", err);
      return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=${encodeURIComponent(err.message)}`);
    }

    if (!user) {
      console.error("Passport No User Error:", info);
      return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=authentication_failed`);
    }

    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('missing_jwt_secret');
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );

      return res.redirect(`${redirectBase}/login?token=${token}`);
    } catch (tokenErr) {
      console.error("Token Generation Error:", tokenErr);
      return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=${encodeURIComponent(tokenErr.message)}`);
    }
  })(req, res, next);
});

// Test route
router.get('/test', (req, res) => {
  res.send("API working 🚀");
});
router.get('/google-test', (req, res) => {
  res.send("Google route working");
});

module.exports = router;