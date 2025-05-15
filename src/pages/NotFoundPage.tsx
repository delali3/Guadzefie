// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">

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
    </div>
  );
};

export default NotFoundPage;