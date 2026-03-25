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

      // ✅ SAFE CHECK (avoid crash if function missing)
      if (categoryOperations.getCategoryByName) {
        try {
          existingCategory = await categoryOperations.getCategoryByName(name);
        } catch (err) {
          console.warn('⚠️ getCategoryByName failed, skipping duplicate check:', err.message);
        }
      }

      if (existingCategory) {
        return res.status(400).json({
          error: {
            message: 'Category with this name already exists',
          },
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

      // ✅ CREATE CATEGORY
      await categoryOperations.createCategory(newCategory);

      // ✅ FETCH CREATED CATEGORY
      let category = newCategory;
      try {
        category = await categoryOperations.getCategoryById(categoryId);
      } catch (err) {
        console.warn('⚠️ getCategoryById failed, returning created object');
      }

      res.status(201).json(category);

    } catch (error) {
      console.error('🔥 FULL ERROR (CREATE CATEGORY):', JSON.stringify(error, null, 2));

      res.status(500).json({
        error: {
          message: error.message || 'Internal server error',
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
    res.json(Array.isArray(categories) ? categories : []);
  } catch (error) {
    console.error('🔥 FULL ERROR (GET ALL):', JSON.stringify(error, null, 2));

    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
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

    if (!category || category.isActive === false) {
      return res.status(404).json({
        error: {
          message: 'Category not found',
        },
      });
    }

    res.json(category);
  } catch (error) {
    console.error('🔥 FULL ERROR (GET BY ID):', JSON.stringify(error, null, 2));

    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
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

    const updatedData = {
      ...existingCategory,
      name: name || existingCategory.name,
      description: description || existingCategory.description,
      updatedAt: new Date().toISOString(),
    };

    await categoryOperations.updateCategory(categoryId, updatedData);

    const updatedCategory = await categoryOperations.getCategoryById(categoryId);

    res.json(updatedCategory);
  } catch (error) {
    console.error('🔥 FULL ERROR (UPDATE):', JSON.stringify(error, null, 2));

    res.status(500).json({
      error: { message: error.message || 'Internal server error' },
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
    console.error('🔥 FULL ERROR (DELETE):', JSON.stringify(error, null, 2));

    res.status(500).json({
      error: { message: error.message || 'Internal server error' },
    });
  }
});

module.exports = router;