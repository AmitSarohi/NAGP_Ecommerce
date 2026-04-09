const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const { productOperations, categoryOperations } = require('../config/database');

const router = express.Router();

/* =========================
   CONFIG
========================= */
const SEARCH_SERVICE_URL =
  process.env.SEARCH_SERVICE_URL || 'http://search-service:3003';

const http = axios.create({
  timeout: 5000,
});

/* =========================
   DEPLOYMENT INFO
========================= */
router.get('/deployment-info', (req, res) => {
  res.json({
    service: 'product-service',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
  });
});

/* =========================
   HEALTH INFO
========================= */
router.get('/health/info', (req, res) => {
  res.status(200).json({
    service: 'product-service',
    version: '1.0.0',
    deploymentGuid: process.env.DEPLOYMENT_GUID || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   CREATE PRODUCT
========================= */
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  [
    body('sku').trim().isLength({ min: 1, max: 50 }),
    body('name').trim().isLength({ min: 1, max: 200 }),
    body('description').trim().isLength({ min: 1, max: 2000 }),
    body('price').isFloat({ min: 0 }),
    body('categoryId').isString(),
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
        sku,
        name,
        description,
        price,
        categoryId,
        inventoryCount,
        images,
        attributes,
      } = req.body;

      const category = await categoryOperations.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({
          error: { message: 'Category not found' },
        });
      }

      const productId = uuidv4();

      const newProduct = {
        productId,
        sku,
        name,
        description,
        price,
        categoryId,
        categoryName: category.name,
        inventoryCount: inventoryCount || 0,
        images: images || [],
        attributes: attributes || {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await productOperations.createProduct(newProduct);

      const product = await productOperations.getProductById(productId);

      // 🔥 AUTO INDEX (FIXED)
      try {
        await http.post(
          `${SEARCH_SERVICE_URL}/api/search/index`,
          product
        );
        console.log('✅ Product indexed');
      } catch (err) {
        console.error('❌ Indexing failed:', err.message);
      }

      res.status(201).json(product);

    } catch (error) {
      console.error('🔥 CREATE ERROR:', error);
      res.status(500).json({
        error: { message: error.message },
      });
    }
  }
);

/* =========================
   GET PRODUCTS
========================= */
router.get(
  '/',
  [
    query('search').optional().isString(),
    query('categoryId').optional().isString(),
  ],
  async (req, res) => {
    try {
      const { search, categoryId } = req.query;

      let result;

      if (search && productOperations.searchProducts) {
        result = await productOperations.searchProducts(search);
      } else if (categoryId && productOperations.getProductsByCategory) {
        result = await productOperations.getProductsByCategory(categoryId);
      } else {
        const products = await productOperations.listProducts?.() || [];
        result = { products };
      }

      res.json({
        products: result.products || [],
      });

    } catch (error) {
      console.error('🔥 GET PRODUCTS ERROR:', error);
      res.status(500).json({
        error: { message: error.message },
      });
    }
  }
);

/* =========================
   GET PRODUCT BY ID
========================= */
router.get('/:productId', async (req, res) => {
  try {
    const product = await productOperations.getProductById(req.params.productId);

    if (!product || product.isActive === false) {
      return res.status(404).json({
        error: { message: 'Product not found' },
      });
    }

    res.json(product);

  } catch (error) {
    console.error('🔥 GET PRODUCT ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/* =========================
   UPDATE PRODUCT
========================= */
router.put('/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const existing = await productOperations.getProductById(productId);
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Product not found' },
      });
    }

    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    await productOperations.updateProduct(productId, updated);

    const updatedProduct = await productOperations.getProductById(productId);

    // 🔥 AUTO UPDATE INDEX
    try {
      await http.put(
        `${SEARCH_SERVICE_URL}/api/search/index/${productId}`,
        updatedProduct
      );
      console.log('🔄 Index updated');
    } catch (err) {
      console.error('❌ Index update failed:', err.message);
    }

    res.json(updatedProduct);

  } catch (error) {
    console.error('🔥 UPDATE ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/* =========================
   DELETE PRODUCT
========================= */
router.delete('/:productId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const existing = await productOperations.getProductById(productId);
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Product not found' },
      });
    }

    await productOperations.deleteProduct(productId);

    // 🔥 AUTO DELETE INDEX
    try {
      await http.delete(
        `${SEARCH_SERVICE_URL}/api/search/index/${productId}`
      );
      console.log('🗑 Index deleted');
    } catch (err) {
      console.error('❌ Index delete failed:', err.message);
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('🔥 DELETE ERROR:', error);
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

module.exports = router;