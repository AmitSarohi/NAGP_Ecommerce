import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AddProductPage from './pages/AddProductPage';
import AddCategoryPage from './pages/AddCategoryPage';

// Route Guards
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <Box component="main" sx={{ flexGrow: 1, pt: 2, pb: 4 }}>
        <Routes>

          {/* =========================
              PUBLIC ROUTES
          ========================= */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />

          {/* =========================
              PROTECTED ROUTES
          ========================= */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* =========================
              ADMIN ROUTES 🔥
          ========================= */}
          <Route
            path="/add-product"
            element={
              <AdminRoute>
                <AddProductPage />
              </AdminRoute>
            }
          />

          <Route
            path="/add-category"
            element={
              <AdminRoute>
                <AddCategoryPage />
              </AdminRoute>
            }
          />

          {/* =========================
              FALLBACK
          ========================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Box>

      <Footer />
    </Box>
  );
}

export default App;