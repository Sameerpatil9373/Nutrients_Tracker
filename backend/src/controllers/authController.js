const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');

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

  passport.authenticate('google', { session: false }, async (err, profile, info) => {
    try {
      if (err || !profile) {
        console.error("Google Auth Error:", err || info);
        const errorMsg = err ? encodeURIComponent(err.message) : (info ? encodeURIComponent(info.message) : 'unknown_error');
        return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=${errorMsg}`);
      }

      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing");
        return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=missing_jwt_secret`);
      }

      // 🔥 Extract email
      const email = profile.emails[0].value;

      // 🔥 Find or create user
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email,
          password: "google_login"
        });
      }

      // 🔥 Create token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRE || '30d',
        }
      );

      // ✅ SUCCESS REDIRECT
      return res.redirect(`${redirectBase}/login?token=${token}`);

    } catch (error) {
      console.error("Callback Error:", error);
      const errorMsg = encodeURIComponent(error.message || 'database_error');
      return res.redirect(`${redirectBase}/login?error=google_auth_failed&details=${errorMsg}`);
    }
  })(req, res, next);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// 🔐 Token helper
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};