const express = require('express');
const { query, validationResult } = require('express-validator');
const axios = require('axios');
const { searchOperations } = require('../config/opensearch');

const router = express.Router();

/* =========================
   CONFIG
========================= */
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

const http = axios.create({ timeout: 5000 });


/* =========================
   🔥 DEPLOYMENT INFO
========================= */
router.get('/deployment-info', (req, res) => {
  res.json({
    service: 'search-service',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
  });
});

/* =========================
   🔥 HEALTH INFO
========================= */
router.get('/health/info', (req, res) => {
  res.status(200).json({
    service: 'search-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   🔍 SEARCH PRODUCTS (EXISTING - KEEP)
========================================================= */
router.get(
  '/',
  [
    query('q').optional().isString().trim(),
    query('categoryId').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('inStock').optional().isIn(['true', 'false']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: { message: 'Validation failed', details: errors.array() },
        });
      }

      const {
        q = '',
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        page = 1,
        limit = 20,
      } = req.query;

      const filters = {};

      if (categoryId) filters.categoryId = categoryId;
      if (minPrice !== undefined) filters.minPrice = parseFloat(minPrice);
      if (maxPrice !== undefined) filters.maxPrice = parseFloat(maxPrice);
      if (inStock !== undefined) filters.inStock = inStock === 'true';

      const results = await searchOperations.searchProducts(
        q,
        filters,
        {},
        parseInt(page),
        parseInt(limit)
      );

      res.json(results);

    } catch (error) {
      console.error('🔥 SEARCH ERROR:', error);
      res.status(500).json({
        error: { message: error.message },
      });
    }
  }
);

/* =========================================================
   🔥 INDEX SINGLE PRODUCT (CREATE)
========================================================= */
router.post('/index', async (req, res) => {
  try {
    const product = req.body;

    if (!product?.productId) {
      return res.status(400).json({
        error: { message: 'productId is required' },
      });
    }

    await searchOperations.indexProduct(product);

    console.log('✅ Indexed product:', product.productId);

    res.json({ success: true });

  } catch (error) {
    console.error('❌ INDEX ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/* =========================================================
   🔄 UPDATE INDEX
========================================================= */
router.put('/index/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = req.body;

    await searchOperations.indexProduct(product);

    console.log('🔄 Updated index:', productId);

    res.json({ success: true });

  } catch (error) {
    console.error('❌ UPDATE INDEX ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/* =========================================================
   🗑 DELETE FROM INDEX
========================================================= */
router.delete('/index/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    await searchOperations.deleteProduct(productId);

    console.log('🗑 Deleted from index:', productId);

    res.json({ success: true });

  } catch (error) {
    console.error('❌ DELETE INDEX ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/* =========================================================
   🔁 BULK SYNC (OPTIONAL - KEEP)
========================================================= */
router.get('/index/sync/all', async (req, res) => {
  try {
    console.log('🔄 Syncing all products...');

    const response = await http.get(`${PRODUCT_SERVICE_URL}/api/products`);
    const products = response.data.products || [];

    let success = 0;
    let failed = 0;

    for (const product of products) {
      try {
        await searchOperations.indexProduct(product);
        success++;
      } catch (err) {
        failed++;
      }
    }

    res.json({
      success: true,
      indexed: success,
      failed,
    });

  } catch (error) {
    console.error('❌ BULK SYNC ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

module.exports = router;