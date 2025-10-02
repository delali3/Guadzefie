// src/components/layout/MainLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Search,
  Heart,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Leaf,
  CloudRain
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../contexts/ProductContext';

interface MainLayoutProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAuthenticated: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  darkMode,
  toggleDarkMode,
  isAuthenticated
}) => {
  const location = useLocation();
  const { state } = useProducts();
  const { cart } = state;

  // Add refs for dropdowns
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileCategoryDropdownRef = useRef<HTMLDivElement>(null);

  // Replace your existing state definitions with these:
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories from the database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, description')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Calculate cart item count
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Handle scroll events for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      // Navigate to search page with query parameter
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Note: Click-outside handlers removed - now using hover for desktop dropdowns

  return (
    <div className="flex flex-col min-h-screen bg-green-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      {/* Header with overflow fixes */}
      <header className={`sticky top-0 z-30 w-full transition-all duration-300 ${scrolled ? 'bg-white dark:bg-gray-800 shadow-md' : 'bg-white dark:bg-gray-800'}`}>
        {/* Top bar */}
        <div className="bg-green-600 dark:bg-green-800 text-white py-2 text-center text-sm overflow-hidden whitespace-nowrap text-ellipsis px-2">
          Direct from farm to table | Connecting Ghana's farmers with customers nationwide
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo - reduced margins on mobile */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <svg className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6.5C12 6.5 7.5 13 7.5 16C7.5 18.4853 9.51472 20.5 12 20.5C14.4853 20.5 16.5 18.4853 16.5 16C16.5 13 12 6.5 12 6.5Z" fill="currentColor" />
                  <path d="M12 6.5C12 6.5 7.5 13 7.5 16C7.5 18.4853 9.51472 20.5 12 20.5C14.4853 20.5 16.5 18.4853 16.5 16C16.5 13 12 6.5 12 6.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 8.5L7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 8.5L17 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 2.5V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="ml-1 sm:ml-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Guadzefie</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4 lg:space-x-8">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <div
                className="relative"
                ref={categoryDropdownRef}
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                <button
                  className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  Farm Categories
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute z-40 top-full pt-2 w-48">
                    <div className="rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1" role="list" aria-orientation="vertical" aria-labelledby="category-dropdown-label" title="Category dropdown">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/products?category=${category.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setCategoryDropdownOpen(false)}
                            role="listitem"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link to="/products" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium">
                All Produce
              </Link>
              <Link to="/products?organic=true" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium flex items-center">
                <Leaf className="mr-1 h-4 w-4" />
                Organic
              </Link>
              <Link to="/farmers" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium">
                Our Farmers
              </Link>
            </nav>

            {/* Right-side actions - with reduced spacing */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                aria-label="Search"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 relative" aria-label="Wishlist">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                {state.wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {state.wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 relative" aria-label="Cart">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Account - desktop only */}
              {isAuthenticated ? (
                <div
                  className="relative hidden sm:block"
                  ref={userDropdownRef}
                  onMouseEnter={() => setUserDropdownOpen(true)}
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <button
                    className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                    aria-label="Account"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  {userDropdownOpen && (
                    <div className="absolute right-0 z-40 top-full pt-2 w-48">
                      <div className="rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <Link
                            to="/consumer/profile"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            My Account
                          </Link>
                          <Link
                            to="/consumer/orders"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            Orders
                          </Link>
                          <Link
                            to="/my-farm"
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            My Farm
                          </Link>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              handleSignOut();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              <LogOut className="h-4 w-4 mr-2" />
                              Sign Out
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:block text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 px-2 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu button - made slightly smaller */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1 sm:p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu - with max-height and overflow control */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-md max-h-[85vh] overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <div ref={mobileCategoryDropdownRef}>
                <button
                  onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Farm Categories
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobileCategoryOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {mobileCategoryOpen && (
                  <div className="pl-4">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${category.id}`}
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/products"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Produce
              </Link>
              <Link
                to="/products?organic=true"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Leaf className="mr-2 h-4 w-4" />
                Organic
              </Link>
              <Link
                to="/farmers"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Our Farmers
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/consumer/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    to="/consumer/orders"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    to="/my-farm"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Farm
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Search overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Search Farm Products</h2>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for farm produce..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 w-full bg-green-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">About Us</h3>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Guadzefie connects farmers across Ghana directly with buyers, ensuring fair prices and supporting sustainable agriculture.
              </p>
              <div className="mt-4 flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Farm Products</h3>
              <ul className="mt-4 space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      to={`/products?category=${category.id}`}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/products?organic=true"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center"
                  >
                    <Leaf className="mr-1 h-3 w-3" />
                    Organic Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products?sort=newest"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Fresh Harvests
                  </Link>
                </li>
              </ul>
            </div>

            {/* Farmer Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">For Farmers</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    to="/sell"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Sell Your Produce
                  </Link>
                </li>
                <li>
                  <Link
                    to="/training"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Farming Resources
                  </Link>
                </li>
                <li>
                  <Link
                    to="/weather"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 flex items-center"
                  >
                    <CloudRain className="mr-1 h-3 w-3" />
                    Weather Forecasts
                  </Link>
                </li>
                <li>
                  <Link
                    to="/community"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Farmer Community
                  </Link>
                </li>
              </ul>
            </div>

            {/* Farm Updates (Newsletter) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Farm Updates</h3>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Subscribe for farming tips, weather alerts, and market price updates for your region.
              </p>
              <form className="mt-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Your email"
                    className="w-full px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>

                <div className="mt-2">
                  <select
                    className="w-full px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">Select your region</option>
                    <option value="eastern">Eastern Region</option>
                    <option value="western">Western Region</option>
                    <option value="ashanti">Ashanti Region</option>
                    <option value="central">Central Region</option>
                    <option value="northern">Northern Region</option>
                    <option value="upper-east">Upper East Region</option>
                    <option value="upper-west">Upper West Region</option>
                    <option value="volta">Volta Region</option>
                    <option value="greater-accra">Greater Accra</option>
                  </select>
                </div>

                <div className="mt-2">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                Delivery Information
              </a>
            </div>
            <p className="mt-8 text-sm text-gray-600 dark:text-gray-400 md:mt-0 md:order-1">
              &copy; {new Date().getFullYear()} Guadzefie. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;