const express = require('express');
const router = express.Router();

const searchRoutes = require('./search');
const { searchOperations } = require('../config/opensearch');
const axios = require('axios');

/* =========================
   BASE SEARCH ROUTES
========================= */
router.use('/', searchRoutes);

/* =========================
   🔥 INDEX SYNC ALL PRODUCTS (FIXED)
   URL: /api/index/sync/all
   METHOD: GET
========================= */
router.get('/sync/all', async (req, res) => {
  try {
    const PRODUCT_SERVICE_URL =
      process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

    console.log('🔄 Fetching products from product-service...');

    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`);

    const products = response.data?.products || response.data || [];

    console.log(`📦 Found ${products.length} products`);

    let indexedCount = 0;
    let failedCount = 0;

    for (const product of products) {
      try {
        await searchOperations.indexProduct(product);
        indexedCount++;
      } catch (err) {
        failedCount++;
        console.error(
          `❌ Failed to index product ${product.productId}:`,
          err.message
        );
      }
    }

    console.log(`✅ Indexed: ${indexedCount}, Failed: ${failedCount}`);

    res.json({
      success: true,
      indexed: indexedCount,
      failed: failedCount,
    });

  } catch (error) {
    console.error('🔥 SYNC ERROR:', error.message);

    res.status(500).json({
      error: {
        message: error.message || 'Index sync failed',
      },
    });
  }
});

module.exports = router;