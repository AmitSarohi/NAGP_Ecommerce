const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { userOperations } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

/**
 * Initialize Passport with Google OAuth strategy
 */
const initializeOAuth = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth credentials not configured');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const firstName = profile.name.givenName;
          const lastName = profile.name.familyName;
          const googleId = profile.id;

          // Check if user exists
          let user = await userOperations.getUserByEmail(email);

          if (!user) {
            // Create new user from Google profile
            const userId = uuidv4();
            await userOperations.createUser({
              userId,
              email,
              firstName,
              lastName,
              googleId,
              isOAuthUser: true,
              isActive: true,
            });
            user = await userOperations.getUserById(userId);
            console.log('✅ Created new user from Google OAuth:', email);
          } else {
            // Update existing user with Google ID if not set
            if (!user.googleId) {
              await userOperations.updateUser(user.userId, {
                googleId,
                isOAuthUser: true,
              });
              user = await userOperations.getUserById(user.userId);
            }
          }

          // Generate JWT token
          const token = jwt.sign(
            { userId: user.userId, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );

          return done(null, { user, token });
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize/deserialize user for session (not used with JWT but required by Passport)
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  console.log('✅ Google OAuth initialized');
};

module.exports = {
  initializeOAuth,
  passport,
};
