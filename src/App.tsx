import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ProductProvider } from './contexts/ProductContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import FarmLayout from './components/layout/FarmLayout';  // You'll need to create this
import ConsumerLayout from './components/layout/ConsumerLayout';  // You'll need to create this

// Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProductListPage from './pages/ProductListPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { Toaster } from 'react-hot-toast';
import { ShippingAddressProvider } from './contexts/ShippingAddressContext';

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';

// Farm Pages
import FarmDashboardPage from './pages/farm/FarmDashboardPage';
// import FarmProductsPage from './pages/farm/FarmProductsPage';  // You'll need to create this
// import FarmProductFormPage from './pages/farm/FarmProductFormPage';  // You'll need to create this
// import FarmOrdersPage from './pages/farm/FarmOrdersPage';  // You'll need to create this

// Consumer Pages
import ConsumerDashboardPage from './pages/consumer/ConsumerDashboardPage';
// import OrderHistoryPage from './pages/consumer/OrderHistoryPage';  // You'll need to create this
// import OrderDetailsPage from './pages/consumer/OrderDetailsPage';  // You'll need to create this

// Types
type Session = {
  user: any;
} | null;

// User role type
type UserRole = 'admin' | 'farm' | 'consumer' | null;

const App: React.FC = () => {
  const [session, setSession] = useState<Session>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('darkMode') === 'true' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_farm')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Determine role based on is_farm value
      // In a real app, you might have a more complex role system
      if (data.is_farm) {
        setUserRole('farm');
      } else {
        setUserRole('consumer');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to consumer if there's an error
      setUserRole('consumer');
    } finally {
      setLoading(false);
    }
  };
  
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

  // Farm route component
  const FarmRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    
    if (userRole !== 'farm') {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  };
  
  // Consumer route component
  const ConsumerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    
    if (userRole !== 'consumer') {
      return <Navigate to="/dashboard" replace />;
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
    const isAdmin = session?.user?.user_metadata?.role === 'admin';

    if (!session || !isAdmin) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };
  
  // Dashboard redirect component
  const DashboardRedirect: React.FC = () => {
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
    
    if (userRole === 'farm') {
      return <Navigate to="/farm" replace />;
    } else if (userRole === 'consumer') {
      return <Navigate to="/consumer" replace />;
    } else if (session?.user?.user_metadata?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    // Default fallback
    return <Navigate to="/consumer" replace />;
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

              {/* Dashboard redirect */}
              <Route path="dashboard" element={<DashboardRedirect />} />

              {/* Protected Routes */}
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Farm Routes */}
            <Route
              path="/farm"
              element={
                <FarmRoute>
                  <FarmLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                </FarmRoute>
              }
            >
              <Route index element={<FarmDashboardPage />} />
              {/* <Route path="products" element={<FarmProductsPage />} />
              <Route path="products/new" element={<FarmProductFormPage />} />
              <Route path="products/:id/edit" element={<FarmProductFormPage />} />
              <Route path="orders" element={<FarmOrdersPage />} /> */}
            </Route>
            
            {/* Consumer Routes */}
            <Route
              path="/consumer"
              element={
                <ConsumerRoute>
                  <ConsumerLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
                </ConsumerRoute>
              }
            >
              <Route index element={<ConsumerDashboardPage />} />
              {/* <Route path="orders" element={<OrderHistoryPage />} />
              <Route path="orders/:id" element={<OrderDetailsPage />} /> */}
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