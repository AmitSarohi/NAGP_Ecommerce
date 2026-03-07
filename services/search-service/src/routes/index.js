const express = require('express');
const { body, validationResult } = require('express-validator');
const { searchOperations } = require('../config/opensearch');
const axios = require('axios');

const router = express.Router();

// Product service URL for syncing
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

/**
 * @swagger
 * components:
 *   schemas:
 *     IndexResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         documentId:
 *           type: string
 *         result:
 *           type: string
 */

/**
 * @swagger
 * /index/product/{productId}:
 *   post:
 *     summary: Index a product in the search engine
 *     tags: [Index Management]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to index
 *     responses:
 *       200:
 *         description: Product indexed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndexResponse'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Fetch product from product service
    try {
      const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
      const product = productResponse.data;

      // Index the product
      const result = await searchOperations.indexProduct(product);

      res.json(result);
    } catch (axiosError) {
      if (axiosError.response?.status === 404) {
        return res.status(404).json({
          error: {
            message: 'Product not found',
          },
        });
      }
      throw axiosError;
    }
  } catch (error) {
    console.error('Error indexing product:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /index/product/{productId}:
 *   put:
 *     summary: Update a product in the search index
 *     tags: [Index Management]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to update
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
 *               categoryId:
 *                 type: string
 *               categoryName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated in search index successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndexResponse'
 *       500:
 *         description: Internal server error
 */
router.put('/product/:productId', [
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('price').optional().isFloat({ min: 0 }),
  body('inventoryCount').optional().isInt({ min: 0 }),
  body('categoryId').optional().isUUID(),
  body('categoryName').optional().isString(),
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

    // Update product in search index
    const result = await searchOperations.updateProduct(productId, updateData);

    res.json(result);
  } catch (error) {
    console.error('Error updating product in search index:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /index/product/{productId}:
 *   delete:
 *     summary: Remove a product from the search index
 *     tags: [Index Management]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to remove from index
 *     responses:
 *       200:
 *         description: Product removed from search index successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndexResponse'
 *       500:
 *         description: Internal server error
 */
router.delete('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Delete product from search index
    const result = await searchOperations.deleteProduct(productId);

    res.json(result);
  } catch (error) {
    console.error('Error deleting product from search index:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /index/sync/all:
 *   post:
 *     summary: Sync all products from product service to search index
 *     tags: [Index Management]
 *     responses:
 *       200:
 *         description: Sync operation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 indexed:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.post('/sync/all', async (req, res) => {
  try {
    // Fetch all products from product service
    let allProducts = [];
    let lastEvaluatedKey = null;

    do {
      const url = lastEvaluatedKey 
        ? `${PRODUCT_SERVICE_URL}/api/products?lastEvaluatedKey=${encodeURIComponent(lastEvaluatedKey)}`
        : `${PRODUCT_SERVICE_URL}/api/products`;

      const response = await axios.get(url);
      allProducts = allProducts.concat(response.data.products);
      lastEvaluatedKey = response.data.lastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Index all products
    const results = {
      success: true,
      indexed: 0,
      failed: 0,
      errors: [],
    };

    for (const product of allProducts) {
      try {
        await searchOperations.indexProduct(product);
        results.indexed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          productId: product.productId,
          error: error.message,
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error syncing all products:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /index/recreate:
 *   post:
 *     summary: Recreate the search index (delete and recreate)
 *     tags: [Index Management]
 *     responses:
 *       200:
 *         description: Index recreated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.post('/recreate', async (req, res) => {
  try {
    const { client, OPENSEARCH_INDEX } = require('../config/opensearch');

    // Delete existing index
    try {
      await client.indices.delete({
        index: OPENSEARCH_INDEX,
      });
      console.log(`Deleted existing index: ${OPENSEARCH_INDEX}`);
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
      console.log('Index does not exist, continuing...');
    }

    // Recreate index
    const { initializeOpenSearch } = require('../config/opensearch');
    await initializeOpenSearch();

    res.json({
      success: true,
      message: 'Search index recreated successfully',
    });
  } catch (error) {
    console.error('Error recreating search index:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

module.exports = router;
