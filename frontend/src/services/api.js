import axios from 'axios';

// API base URL
const API_BASE_URL = '/api';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (Auth)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (Auth error)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// ======================
// PRODUCT API
// ======================
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


// ======================
// CATEGORY API (FIXED)
// ======================
export const categoryAPI = {
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data; // ✅ returns ARRAY
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