const express = require('express');
const { query, validationResult } = require('express-validator');
const { searchOperations } = require('../config/opensearch');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               score:
 *                 type: number
 *                 description: Search relevance score
 *               highlights:
 *                 type: object
 *                 description: Highlighted text snippets
 *         total:
 *           type: integer
 *           description: Total number of matching products
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of results per page
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         aggregations:
 *           type: object
 *           properties:
 *             categories:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                   doc_count:
 *                     type: integer
 *             price_ranges:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                   doc_count:
 *                     type: integer
 *                   from:
 *                     type: number
 *                   to:
 *                     type: number
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search products with filters and sorting
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query text
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter for in-stock products only
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price_asc, price_desc, name_asc, name_desc, newest]
 *           default: relevance
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResult'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/', [
  query('q').optional().isString(),
  query('categoryId').optional().isUUID(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('inStock').optional().isBoolean(),
  query('sortBy').optional().isIn(['relevance', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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

    const {
      q: query,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {
      categoryId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock,
    };

    const sort = { sortBy };

    const searchResults = await searchOperations.searchProducts(
      query || '',
      filters,
      sort,
      parseInt(page),
      parseInt(limit)
    );

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /search/autocomplete:
 *   get:
 *     summary: Get autocomplete suggestions for search
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Partial search query
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: Autocomplete suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                     description: Suggestion text
 *                   source:
 *                     type: object
 *                     description: Source product data
 *                   score:
 *                     type: number
 *                     description: Suggestion score
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/autocomplete', [
  query('q').isString().isLength({ min: 2, max: 100 }),
  query('size').optional().isInt({ min: 1, max: 20 }),
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

    const { q: query, size = 10 } = req.query;

    const suggestions = await searchOperations.getAutocompleteSuggestions(query, parseInt(size));

    res.json(suggestions);
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /search/popular:
 *   get:
 *     summary: Get popular search terms and categories
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Popular search data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 popularCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 popularQueries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                       count:
 *                         type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/popular', async (req, res) => {
  try {
    // For now, return static popular data
    // In a real implementation, this would come from analytics or search logs
    const popularData = {
      popularCategories: [
        { categoryId: 'electronics', categoryName: 'Electronics', count: 1250 },
        { categoryId: 'clothing', categoryName: 'Clothing', count: 980 },
        { categoryId: 'books', categoryName: 'Books', count: 756 },
        { categoryId: 'home', categoryName: 'Home & Garden', count: 623 },
        { categoryId: 'sports', categoryName: 'Sports', count: 445 },
      ],
      popularQueries: [
        { query: 'laptop', count: 342 },
        { query: 'phone', count: 289 },
        { query: 'book', count: 234 },
        { query: 'shoes', count: 198 },
        { query: 'watch', count: 167 },
      ],
    };

    res.json(popularData);
  } catch (error) {
    console.error('Error getting popular search data:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

/**
 * @swagger
 * /search/stats:
 *   get:
 *     summary: Get search index statistics
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Search statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentCount:
 *                   type: integer
 *                   description: Number of indexed documents
 *                 indexSize:
 *                   type: integer
 *                   description: Index size in bytes
 *                 indexName:
 *                   type: string
 *                   description: Name of the search index
 *       500:
 *         description: Internal server error
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await searchOperations.getSearchStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting search stats:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
      },
    });
  }
});

module.exports = router;
