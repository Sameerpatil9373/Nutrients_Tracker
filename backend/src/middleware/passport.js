const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL || 'https://nutrients-tracker.onrender.com/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile received:", profile.id, profile.emails?.[0]?.value);

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        const newUser = {
          googleId: profile.id,
          name: profile.displayName || 'Google User',
          email: email,
          avatar: profile.photos?.[0]?.value || '',
        };

        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log("Existing Google user found:", user.email);
          return done(null, user);
        }

        // Check if user with same email exists
        user = await User.findOne({ email: email });
        
        if (user) {
          console.log("Linking existing email to Google account:", email);
          // Update existing user with googleId
          user.googleId = profile.id;
          if (!user.avatar) user.avatar = profile.photos?.[0]?.value || '';
          await user.save();
          return done(null, user);
        }

        console.log("Creating new Google user:", email);
        // Create new user
        user = await User.create(newUser);
        return done(null, user);
        
      } catch (err) {
        console.error("Passport Verify Callback Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
