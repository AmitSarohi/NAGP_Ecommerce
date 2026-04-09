const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { categoryOperations } = require('../config/database');

// ✅ IMPORT AUTH
const {
  authMiddleware,
  adminMiddleware,
} = require('../middleware/auth');

const router = express.Router();

/**
 * CREATE CATEGORY (ADMIN ONLY)
 */
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
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

      const { name, description } = req.body;

      let existingCategory = null;

      if (categoryOperations.getCategoryByName) {
        try {
          existingCategory = await categoryOperations.getCategoryByName(name);
        } catch (err) {
          console.warn('⚠️ getCategoryByName failed:', err.message);
        }
      }

      if (existingCategory) {
        return res.status(400).json({
          error: { message: 'Category already exists' },
        });
      }

      const categoryId = uuidv4();

      const newCategory = {
        categoryId,
        name,
        description: description || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await categoryOperations.createCategory(newCategory);

      res.status(201).json(newCategory);

    } catch (error) {
      console.error('🔥 CREATE ERROR:', error);
      res.status(500).json({
        error: { message: error.message || 'Internal server error' },
      });
    }
  }
);

/**
 * GET ALL (PUBLIC)
 */
router.get('/', async (req, res) => {
  try {
    const categories = await categoryOperations.listCategories();
    res.json(Array.isArray(categories) ? categories : []);
  } catch (error) {
    res.status(500).json({
      error: { message: error.message || 'Internal server error' },
    });
  }
});

/**
 * GET BY ID (PUBLIC)
 */
router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await categoryOperations.getCategoryById(categoryId);

    if (!category || category.isActive === false) {
      return res.status(404).json({
        error: { message: 'Category not found' },
      });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({
      error: { message: error.message || 'Internal server error' },
    });
  }
});

/**
 * UPDATE (ADMIN ONLY)
 */
router.put(
  '/:categoryId',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description } = req.body;

      const existing = await categoryOperations.getCategoryById(categoryId);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Category not found' },
        });
      }

      const updated = {
        ...existing,
        name: name || existing.name,
        description: description || existing.description,
        updatedAt: new Date().toISOString(),
      };

      await categoryOperations.updateCategory(categoryId, updated);

      res.json(updated);

    } catch (error) {
      console.error('🔥 UPDATE ERROR:', error);
      res.status(500).json({
        error: { message: error.message || 'Internal server error' },
      });
    }
  }
);

/**
 * DELETE (ADMIN ONLY)
 */
router.delete(
  '/:categoryId',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { categoryId } = req.params;

      const existing = await categoryOperations.getCategoryById(categoryId);

      if (!existing) {
        return res.status(404).json({
          error: { message: 'Category not found' },
        });
      }

      await categoryOperations.deleteCategory(categoryId);

      res.json({ message: 'Category deleted successfully' });

    } catch (error) {
      console.error('🔥 DELETE ERROR:', error);
      res.status(500).json({
        error: { message: error.message || 'Internal server error' },
      });
    }
  }
);

module.exports = router;