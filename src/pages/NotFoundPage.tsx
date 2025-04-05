// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">YourStore</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-xl mx-auto text-center">
            {/* 404 illustration */}
            <div className="h-64 flex items-center justify-center">
              <div className="relative">
                <div className="text-9xl font-extrabold text-gray-900 dark:text-white opacity-10">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    Page Not Found
                  </div>
                </div>
              </div>
            </div>

            <h1 className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
              Oops! We couldn't find that page.
            </h1>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              The page you're looking for doesn't exist or may have been moved.
            </p>

            {/* Helpful links */}
            <div className="mt-10">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                You might want to check out:
              </h2>
              <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Browse Products
                </Link>
                <Link
                  to="/search"
                  className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Link>
              </div>
            </div>

            {/* Back button */}
            <div className="mt-8">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Go back to previous page
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Recent products (optional section) */}
      <section className="bg-gray-50 dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Popular products you might like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {/* This would typically be dynamically populated */}
            {[1, 2, 3, 4].map((item) => (
              <Link 
                key={item} 
                to={`/products/${item}`}
                className="group"
              >
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={`https://source.unsplash.com/random/300x300/?product=${item}`} 
                    alt="Product" 
                    className="object-center object-cover group-hover:opacity-75 transition-opacity"
                  />
                </div>
                <h3 className="mt-2 text-sm text-gray-700 dark:text-gray-300">Popular Product {item}</h3>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">${(19.99 * item).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center">
              <ShoppingBag className="h-6 w-6 text-gray-400" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} YourStore. All rights reserved.
              </span>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link to="/help" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Help Center
              </Link>
              <Link to="/contact" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Contact Us
              </Link>
              <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;