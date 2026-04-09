const express = require('express');
const { query, validationResult } = require('express-validator');
const { searchOperations } = require('../config/opensearch');

const router = express.Router();

/* =========================
   🔥 DEPLOYMENT INFO (KEEP THIS)
========================= */
router.get('/deployment-info', (req, res) => {
  res.json({
    service: 'search-service',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
  });
});

/* =========================
   🔥 HEALTH INFO (KEEP THIS)
========================= */
router.get('/health/info', (req, res) => {
  res.status(200).json({
    service: 'search-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   🔍 SEARCH PRODUCTS (FIXED)
========================= */
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
          error: {
            message: 'Validation failed',
            details: errors.array(),
          },
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

      if (minPrice !== undefined && !isNaN(minPrice)) {
        filters.minPrice = parseFloat(minPrice);
      }

      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        filters.maxPrice = parseFloat(maxPrice);
      }

      if (inStock !== undefined) {
        filters.inStock = inStock === 'true';
      }

      console.log('🔍 SEARCH REQUEST:', {
        q,
        filters,
        page,
        limit,
      });

      const results = await searchOperations.searchProducts(
        q,
        filters,
        {},
        parseInt(page),
        parseInt(limit)
      );

      console.log('✅ SEARCH RESULT COUNT:', results.products?.length || 0);

      res.json(results);

    } catch (error) {
      console.error('🔥 SEARCH ERROR:', JSON.stringify(error, null, 2));

      res.status(500).json({
        error: {
          message: error.message || 'Internal server error',
        },
      });
    }
  }
);

module.exports = router;