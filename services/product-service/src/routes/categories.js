const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { categoryOperations } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         categoryId:
 *           type: string
 *           description: Auto-generated category ID
 *         name:
 *           type: string
 *           description: Category name
 *         description:
 *           type: string
 *           description: Category description
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error or category already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
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

    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await categoryOperations.getCategoryByName(name);
    if (existingCategory) {
      return res.status(400).json({
        error: {
          message: 'Category with this name already exists',
        },
      });
    }

    // Create category
    const categoryId = uuidv4();
    await categoryOperations.createCategory({
      categoryId,
      name,
      description,
    });

    // Get created category
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
});

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const categories = await categoryOperations.listCategories();
    res.json(categories);
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
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
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

module.exports = router;
