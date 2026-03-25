const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { categoryOperations } = require('../config/database');

const router = express.Router();

/**
 * CREATE CATEGORY
 */
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
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

      const existingCategory = await categoryOperations.getCategoryByName(name);
      if (existingCategory) {
        return res.status(400).json({
          error: {
            message: 'Category with this name already exists',
          },
        });
      }

      const categoryId = uuidv4();

      await categoryOperations.createCategory({
        categoryId,
        name,
        description,
      });

      const category = await categoryOperations.getCategoryById(categoryId);

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        error: {
          message: 'Internal server error',
        },
      });
    }
  }
);

/**
 * GET ALL CATEGORIES
 */
router.get('/', async (req, res) => {
  try {
    const categories = await categoryOperations.listCategories();
    res.json(categories); // returns array ✅
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * GET CATEGORY BY ID
 */
router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await categoryOperations.getCategoryById(categoryId);

    if (!category || !category.isActive) {
      return res.status(404).json({
        error: {
          message: 'Category not found',
        },
      });
    }

    res.json(category);
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * UPDATE CATEGORY
 */
router.put('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    const existingCategory = await categoryOperations.getCategoryById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        error: { message: 'Category not found' },
      });
    }

    await categoryOperations.updateCategory(categoryId, {
      name,
      description,
    });

    const updatedCategory = await categoryOperations.getCategoryById(categoryId);

    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});

/**
 * DELETE CATEGORY
 */
router.delete('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const existingCategory = await categoryOperations.getCategoryById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        error: { message: 'Category not found' },
      });
    }

    await categoryOperations.deleteCategory(categoryId);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;