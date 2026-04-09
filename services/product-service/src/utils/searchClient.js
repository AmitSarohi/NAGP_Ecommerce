const axios = require('axios');

const SEARCH_SERVICE_URL =
  process.env.SEARCH_SERVICE_URL || 'http://localhost:3003';

/* =========================
   INDEX PRODUCT
========================= */
const indexProduct = async (product) => {
  try {
    await axios.post(`${SEARCH_SERVICE_URL}/api/search/index`, product);
    console.log(`✅ Indexed product ${product.productId}`);
  } catch (error) {
    console.error(
      `❌ Failed to index product ${product.productId}:`,
      error.message
    );
  }
};

/* =========================
   UPDATE PRODUCT
========================= */
const updateProductIndex = async (product) => {
  try {
    await axios.put(
      `${SEARCH_SERVICE_URL}/api/search/index/${product.productId}`,
      product
    );
    console.log(`🔄 Updated index for ${product.productId}`);
  } catch (error) {
    console.error(`❌ Update index failed:`, error.message);
  }
};

/* =========================
   DELETE PRODUCT
========================= */
const deleteProductIndex = async (productId) => {
  try {
    await axios.delete(
      `${SEARCH_SERVICE_URL}/api/search/index/${productId}`
    );
    console.log(`🗑 Removed from index ${productId}`);
  } catch (error) {
    console.error(`❌ Delete index failed:`, error.message);
  }
};

module.exports = {
  indexProduct,
  updateProductIndex,
  deleteProductIndex,
};