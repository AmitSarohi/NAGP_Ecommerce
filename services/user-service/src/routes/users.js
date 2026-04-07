const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { userOperations } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/* =========================
   Helper: Remove password
========================= */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

/* =========================
   GET ALL USERS (ADMIN ONLY)
========================= */
router.get(
  '/',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('lastEvaluatedKey').optional().isString(),
  ],
  async (req, res) => {
    try {
      // 🔥 Only admin can list users
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: { message: 'Admin access required' },
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: { message: 'Validation failed', details: errors.array() },
        });
      }

      const limit = parseInt(req.query.limit) || 50;

      let lastEvaluatedKey = null;
      try {
        if (req.query.lastEvaluatedKey) {
          lastEvaluatedKey = JSON.parse(req.query.lastEvaluatedKey);
        }
      } catch {
        return res.status(400).json({
          error: { message: 'Invalid pagination key' },
        });
      }

      const result = await userOperations.listUsers(
        limit,
        lastEvaluatedKey
      );

      const users = result.users.map(sanitizeUser);

      res.json({
        users,
        lastEvaluatedKey: result.lastEvaluatedKey
          ? JSON.stringify(result.lastEvaluatedKey)
          : null,
      });
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({
        error: { message: 'Internal server error' },
      });
    }
  }
);

/* =========================
   GET USER BY ID
========================= */
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔥 Allow admin OR self
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: { message: 'Access denied' },
      });
    }

    const user = await userOperations.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});

/* =========================
   UPDATE USER
========================= */
router.put(
  '/:userId',
  authMiddleware,
  [
    body('firstName').trim().isLength({ min: 1, max: 50 }),
    body('lastName').trim().isLength({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: { message: 'Validation failed', details: errors.array() },
        });
      }

      const { userId } = req.params;
      const { firstName, lastName } = req.body;

      // 🔥 Only self OR admin
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: { message: 'Access denied' },
        });
      }

      const existingUser = await userOperations.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({
          error: { message: 'User not found' },
        });
      }

      const updatedUser = await userOperations.updateUser(userId, {
        firstName,
        lastName,
      });

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        error: { message: 'Internal server error' },
      });
    }
  }
);

/* =========================
   DELETE USER (SELF ONLY)
========================= */
router.delete('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
      return res.status(403).json({
        error: { message: 'You can only delete your own account' },
      });
    }

    const existingUser = await userOperations.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    const deletedUser = await userOperations.deleteUser(userId);

    res.json(sanitizeUser(deletedUser));
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});

/* =========================
   HEALTH CHECK
========================= */
router.get('/health/info', (req, res) => {
  res.json({
    service: 'user-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;