const { Client } = require('@opensearch-project/opensearch');

const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || 'http://opensearch:9200';
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'products';

const client = new Client({
  node: OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.OPENSEARCH_USERNAME || "admin",
    password: process.env.OPENSEARCH_PASSWORD || "admin",
  },
  ssl: {
    rejectUnauthorized: false,
  },
});


// 🚀 INIT
async function initializeOpenSearch(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.ping();
      console.log("✅ OpenSearch connected");
      return;
    } catch (err) {
      console.error(`⚠️ OpenSearch not ready (${i + 1}/${retries})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}


// 🚀 INDEX PRODUCT
async function indexProduct(product) {
  try {
    await client.index({
      index: OPENSEARCH_INDEX,
      id: product.productId,
      body: product,
      refresh: true, // 🔥 IMPORTANT
    });

    return { success: true };
  } catch (error) {
    console.error("❌ indexProduct error:", error);
    throw error;
  }
}


// 🚀 UPDATE PRODUCT
async function updateProduct(productId, product) {
  try {
    await client.index({
      index: OPENSEARCH_INDEX,
      id: productId,
      body: product,
      refresh: true,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ updateProduct error:", error);
    throw error;
  }
}


// 🚀 DELETE PRODUCT
const deleteProduct = async (productId) => {
  return client.delete({
    index: process.env.OPENSEARCH_INDEX || 'products',
    id: productId,
  });
};


// 🔍 SEARCH OPERATIONS
const searchOperations = {

  indexProduct,
  updateProduct,
  deleteProduct,

  async searchProducts(query, filters = {}, sort = {}, page = 1, limit = 20) {
    try {
      const searchBody = {
        query: this.buildSearchQuery(query, filters),
        sort: this.buildSortQuery(sort),
        from: (page - 1) * limit,
        size: limit,

        aggs: {
          categories: {
            terms: {
              field: 'categoryName.keyword', // 🔥 FIXED
              size: 10,
            },
          },
        },
      };

      const response = await client.search({
        index: OPENSEARCH_INDEX,
        body: searchBody,
      });

      const hits = response.body?.hits?.hits || [];
      const total = response.body?.hits?.total?.value || 0;

      return {
        products: hits.map(hit => ({
          ...hit._source,
          score: hit._score,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

    } catch (error) {
      console.error('🔥 SEARCH ERROR:', error);
      return {
        products: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  },

  buildSearchQuery(query, filters) {
  const must = [];
  const filter = [];

  if (query && query.trim()) {
    must.push({
      multi_match: {
        query,
        fields: ['name^5', 'description^2', 'sku^3'],
        fuzziness: 'AUTO',
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  if (filters.categoryId) {
    filter.push({ term: { categoryId: filters.categoryId } });
  }

  if (filters.minPrice || filters.maxPrice) {
    filter.push({
      range: {
        price: {
          ...(filters.minPrice && { gte: filters.minPrice }),
          ...(filters.maxPrice && { lte: filters.maxPrice }),
        },
      },
    });
  }

  return {
    bool: { must, filter },
  };
},

  buildSortQuery(sort) {
    return [{ _score: 'desc' }];
  },
};


module.exports = {
  searchOperations,
  client,
  OPENSEARCH_INDEX,
  initializeOpenSearch,
};