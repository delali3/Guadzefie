import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider } from './contexts/ProductContext';
import { AuthProvider } from './contexts/AuthContext';
import { ShippingAddressProvider } from './contexts/ShippingAddressContext';
import { PaymentMethodProvider } from './contexts/PaymentMethodContext';
import { migrateDatabase } from './lib/migrateDB';
import toast from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import FarmLayout from './components/layout/FarmLayout';
import ConsumerLayout from './components/layout/ConsumerLayout';

// Private Route Component
import PrivateRoute from './components/auth/PrivateRoute';

// Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import MainProductListPage from './pages/ProductListPage';
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

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminCustomersPage from './pages/admin/CustomersPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import DiscountPage from './pages/admin/DiscountPage';

// Farm Pages
import FarmDashboardPage from './pages/farm/FarmDashboardPage';
import FarmProductListPage from './pages/farm/ProductListPage';
import FarmOrdersPage from './pages/farm/FarmOrdersPage';
import FarmOrderDetailsPage from './pages/farm/FarmOrderDetailsPage';
import FarmDeliveriesPage from './pages/farm/FarmDeliveriesPage';
import FarmDeliveryDetailsPage from './pages/farm/FarmDeliveryDetailsPage';
import FarmCustomersPage from './pages/farm/FarmCustomersPage';
import FarmCustomerFormPage from './pages/farm/FarmCustomerFormPage';
import FarmReportsPage from './pages/farm/FarmReportsPage';
import FarmSettingsPage from './pages/farm/FarmSettingsPage';
import AddProductPage from './pages/farm/AddProductPage';

// Consumer Pages
import ConsumerDashboardPage from './pages/consumer/ConsumerDashboardPage';
import ConsumerOrdersPage from './pages/consumer/OrdersPage';
import OrderDetailsPage from './pages/consumer/OrderDetailsPage';
import PaymentMethodsPage from './pages/consumer/PaymentMethodsPage';
import ConsumerWishlistPage from './pages/consumer/WishlistPage';
import AddressPage from './pages/consumer/AddressPage';
import SubscriptionPage from './pages/consumer/SubscriptionPage';
import ProfilePage from './pages/consumer/ProfilePage';
import ConsumerSettingsPage from './pages/consumer/SettingsPage';

// Types
type Session = {
  user: any;
} | null;

// User role type
type UserRole = 'admin' | 'farm' | 'consumer' | null;

// Extend the Window interface
declare global {
  interface Window {
    debugNavigation?: {
      checkAuth: () => boolean;
      clearAuth: () => void;
    };
  }
}

function App() {
  const [session, setSession] = useState<Session>(null);
  const [_userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [dbMigrated, setDbMigrated] = useState(false);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme on initial load
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('bg-dark');
      document.body.classList.remove('bg-light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.add('bg-light');
      document.body.classList.remove('bg-dark');
    }
  }, []);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setSession({ user: userData });
      
      if (userData.is_farm) {
        setUserRole('farm');
      } else {
        setUserRole('consumer');
      }
    }
    setLoading(false);
  }, []);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', newMode.toString());
      
      document.body.classList.add('theme-transition');
      setTimeout(() => {
        document.body.classList.remove('theme-transition');
      }, 50);
      
      return newMode;
    });
  };

  // Apply dark mode theme whenever it changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('bg-dark');
      document.body.classList.remove('bg-light');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.add('bg-light');
      document.body.classList.remove('bg-dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Set up global error handling
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
        console.log('Additional error details:', args);
      }
    };
    
    const errorHandler = (event: ErrorEvent) => {
      console.log('Global error caught:', {
        message: event.message,
        source: event.filename,
        lineNo: event.lineno,
        colNo: event.colno,
        error: event.error
      });
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  // Set up debug tools
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      window.debugNavigation = {
        checkAuth: () => {
          const userData = localStorage.getItem('user');
          console.log('Current auth state:', {
            userInStorage: !!userData,
            userData: userData ? JSON.parse(userData) : null
          });
          return !!userData;
        },
        clearAuth: () => {
          localStorage.removeItem('user');
          console.log('Auth cleared from localStorage');
          alert('User has been logged out. Redirecting to login page...');
          window.location.href = '/login';
        }
      };
      
      console.log('Navigation debugging enabled. Use window.debugNavigation to access tools.');
    }
  }, []);

  // Run migrations on app start
  useEffect(() => {
    const runMigrations = async () => {
      try {
        const shouldRunMigrations = localStorage.getItem('enable_auto_migrations') === 'true' || 
                                   process.env.NODE_ENV === 'production';
        
        if (shouldRunMigrations) {
          console.log('Running database migrations...');
          const result = await migrateDatabase();
          
          if (result.success) {
            console.log('Database migrations completed successfully');
            setDbMigrated(true);
          } else {
            console.error('Database migrations failed:', result.message);
            if (localStorage.getItem('user')) {
              toast.error('Database setup incomplete. Some features may not work properly.');
            }
          }
        } else {
          console.log('Skipping automatic migrations (development mode)');
          setDbMigrated(true);
        }
      } catch (error) {
        console.error('Error running migrations:', error);
        setDbMigrated(true);
      }
    };
    
    runMigrations();
  }, []);

  // Show loading spinner
  if (loading || !dbMigrated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  // Main app render
  return (
    <HelmetProvider>
      <AuthProvider>
        <ProductProvider>
          <ShippingAddressProvider>
            <PaymentMethodProvider>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                  }
                }} 
              />
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
                    <Route path="products" element={<MainProductListPage />} />
                    <Route path="products/:id" element={<ProductPage />} />
                    <Route path="cart" element={<CartPage />} />
                    <Route path="not-found" element={<NotFoundPage />} />

                    {/* Auth Pages */}
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="reset-password" element={<ResetPasswordPage />} />

                    {/* Protected Routes */}
                    <Route element={<PrivateRoute />}>
                      <Route path="checkout" element={<CheckoutPage />} />
                      <Route path="wishlist" element={<WishlistPage />} />
                    </Route>
                  </Route>

                  {/* Farm Routes */}
                  <Route element={<PrivateRoute allowedRoles={['farm']} />}>
                    <Route
                      path="/farm/*"
                      element={<FarmLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
                    >
                      <Route path="dashboard" element={<FarmDashboardPage />} />
                      {/* Redirect from /farm to /farm/dashboard */}
                      <Route path="" element={<Navigate to="/farm/dashboard" replace />} />
                      <Route path="products" element={<FarmProductListPage />} />
                      <Route path="products/add" element={<AddProductPage />} />
                      <Route path="products/edit/:id" element={<AddProductPage />} />
                      <Route path="orders" element={<FarmOrdersPage />} />
                      <Route path="orders/:id" element={<FarmOrderDetailsPage />} />
                      <Route path="deliveries" element={<FarmDeliveriesPage />} />
                      <Route path="deliveries/:id" element={<FarmDeliveryDetailsPage />} />
                      <Route path="customers" element={<FarmCustomersPage />} />
                      <Route path="customers/new" element={<FarmCustomerFormPage />} />
                      <Route path="reports" element={<FarmReportsPage />} />
                      <Route path="settings" element={<FarmSettingsPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
                    </Route>
                  </Route>
                  
                  {/* Consumer Routes */}
                  <Route element={<PrivateRoute allowedRoles={['consumer']} />}>
                    <Route
                      path="/consumer/*"
                      element={<ConsumerLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
                    >
                      <Route path="dashboard" element={<ConsumerDashboardPage />} />
                      {/* Redirect from /consumer to /consumer/dashboard */}
                      <Route path="" element={<Navigate to="/consumer/dashboard" replace />} />
                      {/* Consumer routes */}
                      <Route path="orders" element={<ConsumerOrdersPage />} />
                      <Route path="orders/:id" element={<OrderDetailsPage />} />
                      <Route path="wishlist" element={<ConsumerWishlistPage />} />
                      <Route path="payment" element={<PaymentMethodsPage />} />
                      <Route path="address" element={<AddressPage />} />
                      <Route path="subscription" element={<SubscriptionPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<ConsumerSettingsPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
                    </Route>
                  </Route>

                  {/* Admin Routes with Admin Layout */}
                  <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                    <Route
                      path="/admin/*"
                      element={<AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
                    >
                      <Route path="" element={<AdminDashboardPage />} />
                      <Route path="dashboard" element={<AdminDashboardPage />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="products/new" element={<ProductFormPage />} />
                      <Route path="products/:id/edit" element={<ProductFormPage />} />
                      <Route path="categories" element={<CategoryManagementPage />} />
                      <Route path="discounts" element={<DiscountPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="customers" element={<AdminCustomersPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>
                  </Route>

                  {/* Catch-all route */}
                  <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Routes>
              </Router>
            </PaymentMethodProvider>
          </ShippingAddressProvider>
        </ProductProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App; 