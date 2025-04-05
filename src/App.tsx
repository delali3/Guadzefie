// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ProductProvider } from './contexts/ProductContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProductListPage from './pages/ProductListPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
// import OrderConfirmationPage from './pages/OrderConfirmationPage';
// import AccountPage from './pages/AccountPage';
import WishlistPage from './pages/WishlistPage';
// import OrderHistoryPage from './pages/OrderHistoryPage';
import NotFoundPage from './pages/NotFoundPage';

// // Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { Toaster } from 'react-hot-toast';
import { ShippingAddressProvider } from './contexts/ShippingAddressContext';

// // Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
// import AdminOrdersPage from './pages/admin/OrdersPage';
// import AdminCustomersPage from './pages/admin/CustomersPage';

// Types
type Session = {
  user: any;
} | null;

const App: React.FC = () => {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('darkMode') === 'true' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  
  // Protected route component
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  };

  // Admin route component
  const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }

    // Check if user has admin role (adjust according to your auth setup)
    const isAdmin = true;
    // const isAdmin = session?.user?.user_metadata?.role === 'admin';

    if (!session || !isAdmin) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };

  return (
    <ProductProvider>
      <ShippingAddressProvider>
        <Router>
          <Routes>
            {/* Public Routes with Main Layout */}
            <Route
              path="/"
              element={
                <MainLayout
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                  isAuthenticated={!!session}
                />
              }
            >
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:id" element={<ProductPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="not-found" element={<NotFoundPage />} />

              {/* Auth Pages */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              {/* <Route 
              path="order-confirmation/:id" 
              element={
                <ProtectedRoute>
                  <OrderConfirmationPage />
                </ProtectedRoute>
              } 
            /> */}
              {/* <Route 
              path="account" 
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              } 
            /> */}
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />
              {/* <Route 
              path="orders" 
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              } 
            /> */}
            </Route>

            {/* Admin Routes with Admin Layout */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/:id/edit" element={<ProductFormPage />} />
            {/* <Route path="orders" element={<AdminOrdersPage />} /> */}
            {/* <Route path="customers" element={<AdminCustomersPage />} /> */} 
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
          <Toaster position='top-right' />
        </Router>
      </ShippingAddressProvider>
    </ProductProvider>
  );
};

export default App;