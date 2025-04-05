// src/routes/ProductRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import product-related pages
// import ProductsListPage from '../pages/ProductsListPage';
// import ProductPage from '../pages/ProductPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import ProductFormPage from '../pages/admin/ProductFormPage';

// Import auth context (for checking admin access)
// import { useAuth } from '../contexts/AuthContext';

const ProductRoutes: React.FC = () => {
//   const { isAuthenticated, user } = useAuth();
  
  // Check if user is admin
//   const isAdmin = isAuthenticated && user?.role === 'admin';
  const isAdmin = true;
  
  return (
    <Routes>
      {/* Public routes */}
      {/* <Route path="/" element={<ProductsListPage />} />
      <Route path="/:id" element={<ProductPage />} /> */}
      
      {/* Admin routes - protected */}
      <Route 
        path="/admin" 
        element={isAdmin ? <AdminProductsPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/admin/new" 
        element={isAdmin ? <ProductFormPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/admin/:id/edit" 
        element={isAdmin ? <ProductFormPage /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
};

export default ProductRoutes;