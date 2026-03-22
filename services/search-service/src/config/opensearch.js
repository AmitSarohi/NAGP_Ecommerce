const { Client } = require('@opensearch-project/opensearch');

// OpenSearch client configuration
const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || 'http://localhost:9200';
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME || 'admin';
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || 'admin';
const OPENSEARCH_INDEX = process.env.OPENSEARCH_INDEX || 'products';

// Create OpenSearch client
const client = new Client({
  node: OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.OPENSEARCH_USERNAME || "admin",
    password: process.env.OPENSEARCH_PASSWORD || "admin",
  },
  ssl: {
    rejectUnauthorized: false, // For development only
  },
});

// Initialize OpenSearch index and mapping
const initializeOpenSearch = async () => {
  try {
    console.log('Initializing OpenSearch...');
    await waitForOpenSearch();
    // Check if OpenSearch is accessible
    const health = await client.cluster.health({});
    console.log('OpenSearch cluster health:', health.body.status);

    // Check if index exists
    const indexExists = await client.indices.exists({
      index: OPENSEARCH_INDEX,
    });

    if (!indexExists.body) {
      console.log(`Creating index: ${OPENSEARCH_INDEX}`);
      
      // Create index with product mapping
      const indexMapping = {
        mappings: {
          properties: {
            productId: {
              type: 'keyword',
            },
            sku: {
              type: 'keyword',
            },
            name: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: {
                  type: 'keyword',
                },
                suggest: {
                  type: 'completion',
                },
              },
            },
            description: {
              type: 'text',
              analyzer: 'standard',
            },
            price: {
              type: 'float',
            },
            categoryId: {
              type: 'keyword',
            },
            categoryName: {
              type: 'keyword',
            },
            inventoryCount: {
              type: 'integer',
            },
            images: {
              type: 'keyword',
            },
            attributes: {
              type: 'object',
              dynamic: true,
            },
            isActive: {
              type: 'boolean',
            },
            createdAt: {
              type: 'date',
            },
            updatedAt: {
              type: 'date',
            },
            tags: {
              type: 'keyword',
            },
          },
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              product_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball'],
              },
            },
          },
        },
      };

      await client.indices.create({
        index: OPENSEARCH_INDEX,
        body: indexMapping,
      });

      console.log(`Index ${OPENSEARCH_INDEX} created successfully`);
    } else {
      console.log(`Index ${OPENSEARCH_INDEX} already exists`);
    }

    console.log('OpenSearch initialization completed');
  } catch (error) {
    console.error('Error initializing OpenSearch:', error);
    throw error;
  }
};

// Search operations
const searchOperations = {
  // Index a product document
  async indexProduct(productData) {
    try {
      const document = {
        productId: productData.productId,
        sku: productData.sku,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        categoryName: productData.categoryName || '',
        inventoryCount: productData.inventoryCount || 0,
        images: productData.images || [],
        attributes: productData.attributes || {},
        isActive: productData.isActive !== false,
        createdAt: productData.createdAt || new Date().toISOString(),
        updatedAt: productData.updatedAt || new Date().toISOString(),
        tags: this.extractTags(productData),
      };

      const response = await client.index({
        index: OPENSEARCH_INDEX,
        id: productData.productId,
        body: document,
        refresh: true,
      });

      return {
        success: true,
        documentId: response.body._id,
        result: response.body.result,
      };
    } catch (error) {
      console.error('Error indexing product:', error);
      throw error;
    }
  },

  // Update product document
  async updateProduct(productId, updateData) {
    try {
      const document = {
        ...updateData,
        updatedAt: new Date().toISOString(),
        tags: this.extractTags(updateData),
      };

      const response = await client.update({
        index: OPENSEARCH_INDEX,
        id: productId,
        body: {
          doc: document,
        },
        refresh: true,
      });

      return {
        success: true,
        documentId: response.body._id,
        result: response.body.result,
      };
    } catch (error) {
      console.error('Error updating product in search index:', error);
      throw error;
    }
  },

  // Delete product document
  async deleteProduct(productId) {
    try {
      const response = await client.delete({
        index: OPENSEARCH_INDEX,
        id: productId,
        refresh: true,
      });

      return {
        success: true,
        documentId: response.body._id,
        result: response.body.result,
      };
    } catch (error) {
      console.error('Error deleting product from search index:', error);
      throw error;
    }
  },

  // Search products
  async searchProducts(query, filters = {}, sort = {}, page = 1, limit = 20) {
    try {
      const searchBody = {
        query: this.buildSearchQuery(query, filters),
        sort: this.buildSortQuery(sort),
        from: (page - 1) * limit,
        size: limit,
        highlight: {
          fields: {
            name: {},
            description: {},
          },
        },
        aggs: {
          categories: {
            terms: {
              field: 'categoryName.keyword',
              size: 10,
            },
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { key: 'under_50', to: 50 },
                { key: '50_to_100', from: 50, to: 100 },
                { key: '100_to_200', from: 100, to: 200 },
                { key: 'over_200', from: 200 },
              ],
            },
          },
        },
      };

      const response = await client.search({
        index: OPENSEARCH_INDEX,
        body: searchBody,
      });

      return {
        products: response.body.hits.hits.map(hit => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight,
        })),
        total: response.body.hits.total.value,
        aggregations: response.body.aggregations,
        page,
        limit,
        totalPages: Math.ceil(response.body.hits.total.value / limit),
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Autocomplete suggestions
  async getAutocompleteSuggestions(query, size = 10) {
    try {
      const searchBody = {
        suggest: {
          product_suggest: {
            prefix: query,
            completion: {
              field: 'name.suggest',
              size: size,
            },
          },
        },
      };

      const response = await client.search({
        index: OPENSEARCH_INDEX,
        body: searchBody,
      });

      const suggestions = response.body.suggest.product_suggest[0].options.map(option => ({
        text: option.text,
        source: option._source,
        score: option._score,
      }));

      return suggestions;
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      throw error;
    }
  },

  // Build search query
  buildSearchQuery(query, filters) {
    const must = [];
    const filter = [{ term: { isActive: true } }];

    // Text search
    if (query && query.trim()) {
      must.push({
        multi_match: {
          query: query,
          fields: ['name^3', 'description^2', 'sku', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Category filter
    if (filters.categoryId) {
      filter.push({ term: { categoryId: filters.categoryId } });
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = {};
      if (filters.minPrice) priceRange.gte = filters.minPrice;
      if (filters.maxPrice) priceRange.lte = filters.maxPrice;
      filter.push({ range: { price: priceRange } });
    }

    // In stock filter
    if (filters.inStock === 'true') {
      filter.push({ range: { inventoryCount: { gt: 0 } } });
    }

    return {
      bool: {
        must,
        filter,
      },
    };
  },

  // Build sort query
  buildSortQuery(sort) {
    const sortOptions = [];

    switch (sort.sortBy) {
      case 'price_asc':
        sortOptions.push({ price: { order: 'asc' } });
        break;
      case 'price_desc':
        sortOptions.push({ price: { order: 'desc' } });
        break;
      case 'name_asc':
        sortOptions.push({ 'name.keyword': { order: 'asc' } });
        break;
      case 'name_desc':
        sortOptions.push({ 'name.keyword': { order: 'desc' } });
        break;
      case 'newest':
        sortOptions.push({ createdAt: { order: 'desc' } });
        break;
      case 'relevance':
      default:
        sortOptions.push({ _score: { order: 'desc' } });
        break;
    }

    return sortOptions;
  },

  // Extract tags from product data
  extractTags(productData) {
    const tags = [];
    
    // Add category as tag
    if (productData.categoryName) {
      tags.push(productData.categoryName.toLowerCase());
    }

    // Extract keywords from name
    if (productData.name) {
      const nameWords = productData.name.toLowerCase().split(/\s+/);
      tags.push(...nameWords.filter(word => word.length > 2));
    }

    // Extract from attributes
    if (productData.attributes) {
      Object.values(productData.attributes).forEach(value => {
        if (typeof value === 'string') {
          const words = value.toLowerCase().split(/\s+/);
          tags.push(...words.filter(word => word.length > 2));
        }
      });
    }

    return [...new Set(tags)]; // Remove duplicates
  },

  // Get search statistics
  async getSearchStats() {
    try {
      const stats = await client.indices.stats({
        index: OPENSEARCH_INDEX,
      });

      return {
        documentCount: stats.body.indices[OPENSEARCH_INDEX]?.total?.docs?.count || 0,
        indexSize: stats.body.indices[OPENSEARCH_INDEX]?.total?.store?.size_in_bytes || 0,
        indexName: OPENSEARCH_INDEX,
      };
    } catch (error) {
      console.error('Error getting search stats:', error);
      throw error;
    }
  },
};

const waitForOpenSearch = async (retries = 15, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const health = await client.cluster.health({});
      console.log("OpenSearch cluster health:", health.body.status);
      return;
    } catch (err) {
      console.log(`OpenSearch not ready. Retry ${i + 1}/${retries}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("OpenSearch never became ready");
};

module.exports = {
  initializeOpenSearch,
  searchOperations,
  client,
  OPENSEARCH_INDEX,
};
