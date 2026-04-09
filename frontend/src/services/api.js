import axios from 'axios';

// API base URL
const API_BASE_URL = '/api';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // ⬆️ increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/* =========================
   🔥 REQUEST INTERCEPTOR (ADD TOKEN + DEBUG)
========================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ DEBUG LOG
    console.log('➡️ API Request:', {
      url: config.url,
      method: config.method,
      params: config.params,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR (BETTER DEBUG)
========================= */
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized - clearing token');
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

/* =========================
   🔍 SEARCH API (NEW - IMPORTANT)
========================= */
export const searchAPI = {
  search: async (params = {}) => {
    const res = await api.get('/search', { params });
    return res.data;
  },
};

/* =========================
   PRODUCT API
========================= */
export const productAPI = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (data) => {
    const res = await api.post('/products', data);
    return res.data;
  },

  updateProduct: async (id, data) => {
    const res = await api.put(`/products/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  // ⚠️ keep if needed, but NOT used for global search
  searchProducts: async (searchTerm, params = {}) => {
    const res = await api.get('/products', {
      params: { search: searchTerm, ...params },
    });
    return res.data;
  },

  getProductsByCategory: async (categoryId, params = {}) => {
    const res = await api.get('/products', {
      params: { categoryId, ...params },
    });
    return res.data;
  },
};

/* =========================
   CATEGORY API
========================= */
export const categoryAPI = {
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },

  getCategoryById: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  createCategory: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  },

  updateCategory: async (id, data) => {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

export default api;