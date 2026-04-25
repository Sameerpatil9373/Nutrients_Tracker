const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Google OAuth
// @route   GET /api/auth/google
// @access  Public
exports.googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const redirectBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error("Google Auth Error:", err || info);
      const errorMsg = err ? encodeURIComponent(err.message) : (info ? encodeURIComponent(info.message || 'auth_failed') : 'unknown_error');
      return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=${errorMsg}`);
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
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

  res.status(statusCode).json({
    success: true,
    token,
  });
};
