const { Client } = require('@opensearch-project/opensearch');

const OPENSEARCH_ENDPOINT = process.env.OPENSEARCH_ENDPOINT || 'http://localhost:9200';
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

const searchOperations = {

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
              field: 'categoryName', // ✅ FIXED
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

      const hits = response.body?.hits?.hits || [];
      const total = response.body?.hits?.total?.value || 0;

      return {
        products: hits.map(hit => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight,
        })),
        total,
        aggregations: response.body?.aggregations || {},
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

    } catch (error) {
      console.error('🔥 OPENSEARCH ERROR:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  buildSearchQuery(query, filters) {
    const must = [];
    const filter = [{ term: { isActive: true } }];

    // 🔥 TEXT SEARCH
    if (query && query.trim()) {
      must.push({
        multi_match: {
          query,
          fields: [
            'name^5',
            'name.keyword^10',
            'description^2',
            'sku^4',
            'tags^3'
          ],
          fuzziness: 'AUTO',
        },
      });
    }

    // CATEGORY
    if (filters.categoryId) {
      filter.push({ term: { categoryId: filters.categoryId } });
    }

    // PRICE
    if (filters.minPrice || filters.maxPrice) {
      const range = {};
      if (filters.minPrice) range.gte = filters.minPrice;
      if (filters.maxPrice) range.lte = filters.maxPrice;

      filter.push({ range: { price: range } });
    }

    // 🔥 FIXED BOOLEAN
    if (filters.inStock === true) {
      filter.push({ range: { inventoryCount: { gt: 0 } } });
    }

    return {
      bool: {
        must,
        filter,
      },
    };
  },

  buildSortQuery(sort) {
    switch (sort.sortBy) {
      case 'price_asc':
        return [{ price: 'asc' }];
      case 'price_desc':
        return [{ price: 'desc' }];
      case 'name_asc':
        return [{ 'name.keyword': 'asc' }];
      case 'name_desc':
        return [{ 'name.keyword': 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      default:
        return [{ _score: 'desc' }];
    }
  },
};

module.exports = {
  searchOperations,
  client,
  OPENSEARCH_INDEX,
};