const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const { productOperations, categoryOperations } = require('../config/database');

const router = express.Router();

// ✅ K8s internal service
const SEARCH_SERVICE_URL =
  process.env.SEARCH_SERVICE_URL || 'http://search-service:3003';

// ✅ axios instance
const http = axios.create({
  timeout: 5000,
});

/**
 * CREATE PRODUCT
 */
router.post(
  '/',
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

      // ✅ CATEGORY FETCH (IMPORTANT)
      let category = null;
      try {
        category = await categoryOperations.getCategoryById(categoryId);
      } catch (err) {
        console.warn('⚠️ Category fetch failed:', err.message);
      }

      if (!category) {
        return res.status(404).json({
          error: { message: 'Category not found' },
        });
      }

      // ✅ SKU CHECK
      let existingProduct = null;
      if (productOperations.getProductBySku) {
        try {
          existingProduct = await productOperations.getProductBySku(sku);
        } catch (err) {
          console.warn('⚠️ SKU check failed:', err.message);
        }
      }

      if (existingProduct) {
        return res.status(400).json({
          error: { message: 'Product with this SKU already exists' },
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
        categoryName: category.name, // 🔥 CRITICAL FOR SEARCH
        inventoryCount: inventoryCount || 0,
        images: images || [],
        attributes: attributes || {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await productOperations.createProduct(newProduct);

      let product = newProduct;
      try {
        product = await productOperations.getProductById(productId);
      } catch (err) {
        console.warn('⚠️ getProductById failed');
      }

      // 🔥 AUTO INDEX INTO SEARCH
      try {
        await http.post(
          `${SEARCH_SERVICE_URL}/api/index/product/${productId}`
        );
        console.log('✅ Indexed product:', productId);
      } catch (err) {
        console.error('❌ Indexing failed:', err.message);
      }

      res.status(201).json(product);

    } catch (error) {
      console.error('🔥 CREATE PRODUCT ERROR:', JSON.stringify(error, null, 2));
      res.status(500).json({
        error: { message: error.message || 'Internal server error' },
      });
    }
  }
);

/**
 * GET PRODUCTS
 */
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
      console.error('🔥 GET PRODUCTS ERROR:', JSON.stringify(error, null, 2));
      res.status(500).json({
        error: { message: error.message },
      });
    }
  }
);

/**
 * GET PRODUCT BY ID
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productOperations.getProductById(productId);

    if (!product || product.isActive === false) {
      return res.status(404).json({
        error: { message: 'Product not found' },
      });
    }

    res.json(product);

  } catch (error) {
    console.error('🔥 GET PRODUCT ERROR:', JSON.stringify(error, null, 2));
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/**
 * UPDATE PRODUCT
 */
router.put('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const existingProduct = await productOperations.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        error: { message: 'Product not found' },
      });
    }

    const updatedData = {
      ...existingProduct,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    await productOperations.updateProduct(productId, updatedData);

    const updatedProduct = await productOperations.getProductById(productId);

    // 🔥 AUTO UPDATE INDEX
    try {
      await http.put(
        `${SEARCH_SERVICE_URL}/api/index/product/${productId}`,
        updatedProduct
      );
      console.log('✅ Updated index:', productId);
    } catch (err) {
      console.error('❌ Index update failed:', err.message);
    }

    res.json(updatedProduct);

  } catch (error) {
    console.error('🔥 UPDATE PRODUCT ERROR:', JSON.stringify(error, null, 2));
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

/**
 * DELETE PRODUCT
 */
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const existingProduct = await productOperations.getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        error: { message: 'Product not found' },
      });
    }

    await productOperations.deleteProduct(productId);

    // 🔥 AUTO DELETE INDEX
    try {
      await http.delete(
        `${SEARCH_SERVICE_URL}/api/index/product/${productId}`
      );
      console.log('✅ Deleted from index:', productId);
    } catch (err) {
      console.error('❌ Index delete failed:', err.message);
    }

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('🔥 DELETE PRODUCT ERROR:', JSON.stringify(error, null, 2));
    res.status(500).json({
      error: { message: error.message },
    });
  }
});

module.exports = router;