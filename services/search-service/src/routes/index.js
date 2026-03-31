const express = require('express');
const { body, validationResult } = require('express-validator');
const { searchOperations } = require('../config/opensearch');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ✅ FIXED: use internal K8s service name
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

// ✅ Axios instance with timeout
const http = axios.create({
  timeout: 5000,
});


// 🚀 INDEX SINGLE PRODUCT - PROTECTED
router.post('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    let product;

    try {
      const response = await http.get(
        `${PRODUCT_SERVICE_URL}/api/products/${productId}`
      );
      product = response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json({
          error: { message: 'Product not found' },
        });
      }

      console.error('❌ Product service error:', err.message);

      return res.status(503).json({
        error: { message: 'Product service unavailable' },
      });
    }

    const result = await searchOperations.indexProduct(product);

    res.json(result);
  } catch (error) {
    console.error('🔥 Index product error:', error);

    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});


// 🚀 UPDATE PRODUCT - PROTECTED
router.put(
  '/product/:productId',
  authMiddleware,
  [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('price').optional().isFloat({ min: 0 }),
    body('inventoryCount').optional().isInt({ min: 0 }),
    body('categoryId').optional().isUUID(),
    body('categoryName').optional().isString(),
    body('isActive').optional().isBoolean(),
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

      const { productId } = req.params;

      const result = await searchOperations.updateProduct(
        productId,
        req.body
      );

      res.json(result);
    } catch (error) {
      console.error('🔥 Update index error:', error);

      res.status(500).json({
        error: { message: 'Internal server error' },
      });
    }
  }
);


// 🚀 DELETE PRODUCT - PROTECTED
router.delete('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await searchOperations.deleteProduct(productId);

    res.json(result);
  } catch (error) {
    console.error('🔥 Delete index error:', error);

    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});


// 🚀 SYNC ALL PRODUCTS - PROTECTED
router.post('/sync/all', authMiddleware, async (req, res) => {
  try {
    const response = await http.get(`${PRODUCT_SERVICE_URL}/api/products`);

    const products = response.data.products || [];

    const results = {
      success: true,
      indexed: 0,
      failed: 0,
      errors: [],
    };

    // ✅ LIMIT batch size (avoid crash)
    for (const product of products.slice(0, 100)) {
      try {
        await searchOperations.indexProduct(product);
        results.indexed++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          productId: product.productId,
          error: err.message,
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('🔥 Sync error:', error);

    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});


// 🚀 RECREATE INDEX - PROTECTED
router.post('/recreate', authMiddleware, async (req, res) => {
  try {
    const { client, OPENSEARCH_INDEX, initializeOpenSearch } = require('../config/opensearch');

    try {
      await client.indices.delete({ index: OPENSEARCH_INDEX });
      console.log(`🗑️ Deleted index: ${OPENSEARCH_INDEX}`);
    } catch (err) {
      if (err.statusCode !== 404) throw err;
    }

    // ✅ SAFE INIT
    try {
      await initializeOpenSearch();
    } catch (err) {
      console.error('⚠️ Init failed but continuing');
    }

    res.json({
      success: true,
      message: 'Index recreated successfully',
    });
  } catch (error) {
    console.error('🔥 Recreate error:', error);

    res.status(500).json({
      error: { message: 'Internal server error' },
    });
  }
});

module.exports = router;