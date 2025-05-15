import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 dark:text-white">Subscriptions</span>
      </nav>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Subscriptions</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
        <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <Calendar className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Subscription Management</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This feature is coming soon. You'll be able to subscribe to regular deliveries of your favorite products.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage; 