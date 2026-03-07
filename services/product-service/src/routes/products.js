const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { productOperations, categoryOperations } = require('../config/database');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - sku
 *         - name
 *         - description
 *         - price
 *         - categoryId
 *       properties:
 *         productId:
 *           type: string
 *           description: Auto-generated product ID
 *         sku:
 *           type: string
 *           description: Unique stock keeping unit
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           format: float
 *           description: Product price
 *         categoryId:
 *           type: string
 *           description: Category ID
 *         inventoryCount:
 *           type: integer
 *           description: Number of items in stock
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Product image URLs
 *         attributes:
 *           type: object
 *           description: Additional product attributes
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Product creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - name
 *               - description
 *               - price
 *               - categoryId
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               inventoryCount:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               attributes:
 *                 type: object
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or product already exists
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.post('/', [
  body('sku').trim().isLength({ min: 1, max: 50 }),
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1, max: 2000 }),
  body('price').isFloat({ min: 0 }),
  body('categoryId').isUUID(),
  body('inventoryCount').optional().isInt({ min: 0 }),
  body('images').optional().isArray(),
  body('attributes').optional().isObject(),
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

    const { sku, name, description, price, categoryId, inventoryCount, images, attributes } = req.body;

    // Check if category exists
    const category = await categoryOperations.getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({
        error: {
          message: 'Category not found',
        },
      });
    }

    // Check if SKU already exists
    const existingProduct = await productOperations.getProductBySku(sku);
    if (existingProduct) {
      return res.status(400).json({
        error: {
          message: 'Product with this SKU already exists',
        },
      });
    }

    // Create product
    const productId = uuidv4();
    await productOperations.createProduct({
      productId,
      sku,
      name,
      description,
      price,
      categoryId,
      inventoryCount,
      images,
      attributes,
    });

    // Get created product
    const product = await productOperations.getProductById(productId);

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get list of products (with optional search and category filter)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product names and descriptions
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of products to return
 *       - in: query
 *         name: lastEvaluatedKey
 *         schema:
 *           type: string
 *         description: Pagination token for next page
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 lastEvaluatedKey:
 *                   type: string
 *                   description: Token for next page
 *       500:
 *         description: Internal server error
 */
router.get('/', [
  query('search').optional().isString(),
  query('categoryId').optional().isUUID(),
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

    const { search, categoryId, limit, lastEvaluatedKey } = req.query;
    const limitNum = parseInt(limit) || 50;
    const lastKey = lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : null;

    let result;

    if (search) {
      result = await productOperations.searchProducts(search, limitNum, lastKey);
    } else if (categoryId) {
      result = await productOperations.getProductsByCategory(categoryId, limitNum, lastKey);
    } else {
      // Get all products (scan)
      const params = {
        TableName: process.env.PRODUCT_TABLE || 'products',
        FilterExpression: '#isActive = :isActive',
        ExpressionAttributeNames: {
          '#isActive': 'isActive',
        },
        ExpressionAttributeValues: {
          ':isActive': true,
        },
        Limit: limitNum,
      };

      if (lastKey) {
        params.ExclusiveStartKey = lastKey;
      }

      const scanResult = await require('../config/database').docClient.scan(params).promise();
      result = {
        products: scanResult.Items,
        lastEvaluatedKey: scanResult.LastEvaluatedKey,
      };
    }

    res.json({
      products: result.products,
      lastEvaluatedKey: result.lastEvaluatedKey ? JSON.stringify(result.lastEvaluatedKey) : null,
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productOperations.getProductById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        error: {
          message: 'Product not found',
        },
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /products/{productId}:
 *   put:
 *     summary: Update product information
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               inventoryCount:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               attributes:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/:productId', [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('inventoryCount').optional().isInt({ min: 0 }),
  body('images').optional().isArray(),
  body('attributes').optional().isObject(),
  body('isActive').optional().isBoolean(),
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

    const { productId } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await productOperations.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        error: {
          message: 'Product not found',
        },
      });
    }

    // Update product
    const updatedProduct = await productOperations.updateProduct(productId, updateData);

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /products/{productId}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const existingProduct = await productOperations.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        error: {
          message: 'Product not found',
        },
      });
    }

    // Delete product (soft delete)
    const deletedProduct = await productOperations.deleteProduct(productId);

    res.json(deletedProduct);
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

module.exports = router;
