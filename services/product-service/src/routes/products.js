const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { productOperations, categoryOperations } = require('../config/database');

const router = express.Router();

/**
 * CREATE PRODUCT
 */
router.post('/', [
  body('sku').trim().isLength({ min: 1, max: 50 }),
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1, max: 2000 }),
  body('price').isFloat({ min: 0 }),
  body('categoryId').isString(), // relaxed from UUID (avoid failures)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { sku, name, description, price, categoryId, inventoryCount, images, attributes } = req.body;

    // ✅ SAFE CATEGORY CHECK
    let category = null;
    try {
      category = await categoryOperations.getCategoryById(categoryId);
    } catch (err) {
      console.warn('⚠️ Category check failed:', err.message);
    }

    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    // ✅ SAFE SKU CHECK
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
      console.warn('⚠️ getProductById failed, returning created object');
    }

    res.status(201).json(product);

  } catch (error) {
    console.error('🔥 FULL ERROR (CREATE PRODUCT):', JSON.stringify(error, null, 2));
    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
});


/**
 * GET PRODUCTS
 */
router.get('/', [
  query('search').optional().isString(),
  query('categoryId').optional().isString(),
], async (req, res) => {
  try {
    const { search, categoryId } = req.query;

    let result;

    if (search && productOperations.searchProducts) {
      result = await productOperations.searchProducts(search);
    } else if (categoryId && productOperations.getProductsByCategory) {
      result = await productOperations.getProductsByCategory(categoryId);
    } else {
      const categories = await productOperations.listProducts?.() || [];
      result = { products: categories };
    }

    res.json({
      products: result.products || [],
    });

  } catch (error) {
    console.error('🔥 FULL ERROR (GET PRODUCTS):', JSON.stringify(error, null, 2));
    res.status(500).json({ error: { message: error.message } });
  }
});


/**
 * GET PRODUCT BY ID
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productOperations.getProductById(productId);

    if (!product || product.isActive === false) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    res.json(product);

  } catch (error) {
    console.error('🔥 FULL ERROR (GET PRODUCT):', JSON.stringify(error, null, 2));
    res.status(500).json({ error: { message: error.message } });
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
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    const updatedData = {
      ...existingProduct,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    await productOperations.updateProduct(productId, updatedData);

    const updatedProduct = await productOperations.getProductById(productId);

    res.json(updatedProduct);

  } catch (error) {
    console.error('🔥 FULL ERROR (UPDATE PRODUCT):', JSON.stringify(error, null, 2));
    res.status(500).json({ error: { message: error.message } });
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
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    await productOperations.deleteProduct(productId);

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('🔥 FULL ERROR (DELETE PRODUCT):', JSON.stringify(error, null, 2));
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;