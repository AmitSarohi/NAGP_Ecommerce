const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { userOperations } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

/* =========================
   Helper: Sanitize user
========================= */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

/* =========================
   Initialize OAuth
========================= */
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
          // 🔥 Safe extraction
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const googleId = profile.id;

          if (!email) {
            return done(new Error('Email not provided by Google'), null);
          }

          let user = await userOperations.getUserByEmail(email);

          /* =========================
             CREATE USER (if not exists)
          ========================= */
          if (!user) {
            const userId = uuidv4();

            await userOperations.createUser({
              userId,
              email,
              firstName,
              lastName,
              googleId,
              isOAuthUser: true,
              isActive: true,
              role: 'user', // default role
            });

            user = await userOperations.getUserById(userId);

            console.log('✅ New Google user created:', email);
          } else {
            /* =========================
               UPDATE EXISTING USER
            ========================= */
            if (!user.googleId) {
              await userOperations.updateUser(user.userId, {
                googleId,
                isOAuthUser: true,
              });

              user = await userOperations.getUserById(user.userId);
            }
          }

          /* =========================
             GENERATE TOKEN
          ========================= */
          const token = jwt.sign(
            {
              userId: user.userId,
              email: user.email,
              role: user.role || 'user',
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );

          return done(null, {
            user: sanitizeUser(user), // 🔥 important
            token,
          });
        } catch (error) {
          console.error('❌ Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  /* =========================
     Passport session (required)
  ========================= */
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  console.log('✅ Google OAuth initialized');
};

module.exports = {
  initializeOAuth,
  passport,
};