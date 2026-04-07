const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { userOperations } = require('../config/database');
const { passport } = require('../config/oauth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/* =========================
   REGISTER
========================= */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: { message: 'Validation failed', details: errors.array() },
        });
      }

      const { email, firstName, lastName, password } = req.body;

      const existingUser = await userOperations.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: { message: 'User already exists' },
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userId = uuidv4();

      await userOperations.createUser({
        userId,
        email,
        firstName,
        lastName,
        passwordHash,
        role: 'user',
      });

      const user = await userOperations.getUserById(userId);

      const token = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          role: user.role || 'user',
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      delete user.passwordHash;

      res.status(201).json({ token, user });
    } catch (error) {
      console.error('REGISTER ERROR:', error);
      res.status(500).json({
        error: { message: 'Internal server error' },
      });
    }
  }
);

/* =========================
   LOGIN
========================= */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: { message: 'Validation failed', details: errors.array() },
        });
      }

      const { email, password } = req.body;

      const user = await userOperations.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          error: { message: 'User not found' },
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          error: { message: 'Account deactivated' },
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          error: { message: 'Invalid credentials' },
        });
      }

      const token = jwt.sign(
        {
          userId: user.userId,
          email: user.email,
          role: user.role || 'user',
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      delete user.passwordHash;

      res.json({ token, user });
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      res.status(500).json({
        error: { message: 'Internal server error' },
      });
    }
  }
);

/* =========================
   VERIFY TOKEN
========================= */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: { message: 'No token provided' },
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await userOperations.getUserById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: { message: 'Invalid user' },
      });
    }

    delete user.passwordHash;

    res.json({
      valid: true,
      user,
    });
  } catch (error) {
    console.error('VERIFY ERROR:', error);
    res.status(401).json({
      error: { message: 'Invalid or expired token' },
    });
  }
});

/* =========================
   GOOGLE LOGIN
========================= */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/* =========================
   GOOGLE CALLBACK
========================= */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      const { user, token } = req.user;

      const FRONTEND_URL =
        process.env.FRONTEND_URL || 'http://localhost:3000';

      // send user + token
      const encodedUser = encodeURIComponent(JSON.stringify(user));

      res.redirect(
        `${FRONTEND_URL}/login?token=${token}&user=${encodedUser}`
      );
    } catch (error) {
      console.error('GOOGLE CALLBACK ERROR:', error);

      const FRONTEND_URL =
        process.env.FRONTEND_URL || 'http://localhost:3000';

      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;