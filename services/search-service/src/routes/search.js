const express = require('express');
const { query, validationResult } = require('express-validator');
const { searchOperations } = require('../config/opensearch');

const router = express.Router();

router.get(
  '/',
  [
    query('q').optional().isString().trim(),

    query('categoryId').optional().isString(),

    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),

    // ✅ FIXED (string-safe boolean)
    query('inStock').optional().isIn(['true', 'false']),

    query('sortBy')
      .optional()
      .isIn([
        'relevance',
        'price_asc',
        'price_desc',
        'name_asc',
        'name_desc',
        'newest',
      ]),

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
        sortBy = 'relevance',
        page = 1,
        limit = 20,
      } = req.query;

      // 🔥 CLEAN FILTERS
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

      const sort = { sortBy };

      console.log('🔍 Search Request:', {
        q,
        filters,
        sort,
        page,
        limit,
      });

      const results = await searchOperations.searchProducts(
        q,
        filters,
        sort,
        parseInt(page),
        parseInt(limit)
      );

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