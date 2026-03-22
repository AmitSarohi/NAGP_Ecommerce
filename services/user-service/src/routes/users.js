const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { userOperations } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get list of users (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of users to return
 *       - in: query
 *         name: lastEvaluatedKey
 *         schema:
 *           type: string
 *         description: Pagination token for next page
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 *                 lastEvaluatedKey:
 *                   type: string
 *                   description: Token for next page
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('lastEvaluatedKey').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const lastEvaluatedKey = req.query.lastEvaluatedKey ? JSON.parse(req.query.lastEvaluatedKey) : null;

    const result = await userOperations.listUsers(limit, lastEvaluatedKey);

    // Remove password hashes from response
    const users = result.users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users,
      lastEvaluatedKey: result.lastEvaluatedKey ? JSON.stringify(result.lastEvaluatedKey) : null,
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userOperations.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
        },
      });
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update user information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (can only update own profile)
 *       500:
 *         description: Internal server error
 */
router.put('/:userId', authMiddleware, [
  body('firstName').trim().isLength({ min: 1, max: 50 }),
  body('lastName').trim().isLength({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { userId } = req.params;
    const { firstName, lastName } = req.body;

    // Users can only update their own profile
    if (req.user.userId !== userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden: You can only update your own profile',
        },
      });
    }

    // Check if user exists
    const existingUser = await userOperations.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: {
          message: 'User not found',
        },
      });
    }

    // Update user
    const updatedUser = await userOperations.updateUser(userId, {
      firstName,
      lastName,
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Deactivate user account (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (can only deactivate own account)
 *       500:
 *         description: Internal server error
 */
router.delete('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only deactivate their own account
    if (req.user.userId !== userId) {
      return res.status(403).json({
        error: {
          message: 'Forbidden: You can only deactivate your own account',
        },
      });
    }

    // Check if user exists
    const existingUser = await userOperations.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: {
          message: 'User not found',
        },
      });
    }

    // Deactivate user (soft delete)
    const deactivatedUser = await userOperations.deleteUser(userId);

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = deactivatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

module.exports = router;
