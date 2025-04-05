// src/components/dashboard/AdminSidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart2, 
  Settings, 
  CreditCard,
  Tag,
  Truck,
  HelpCircle,
  LogOut
} from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/admin/dashboard' },
    { name: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
    { name: 'Products', icon: Package, path: '/admin/products' },
    { name: 'Customers', icon: Users, path: '/admin/customers' },
    { name: 'Categories', icon: Tag, path: '/admin/categories' },
    { name: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { name: 'Shipping', icon: Truck, path: '/admin/shipping' },
    { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' }
  ];
  
  return (
    <div className="bg-white dark:bg-gray-800 h-full w-64 fixed left-0 top-0 overflow-y-auto shadow-md">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">E-Commerce Admin</h1>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Main
          </p>
        </div>
        
        <ul className="space-y-1 px-2">
          {navItems.slice(0, 4).map(item => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm rounded-lg ${
                  isActive(item.path)
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="px-4 py-2 mt-8">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Management
          </p>
        </div>
        
        <ul className="space-y-1 px-2">
          {navItems.slice(4, 9).map(item => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm rounded-lg ${
                  isActive(item.path)
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="px-4 py-2 mt-8">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Support
          </p>
        </div>
        
        <ul className="space-y-1 px-2">
          <li>
              <a href="#" className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <HelpCircle className="h-5 w-5 mr-3" />
              Help Center
            </a>
          </li>
          <li>
            <button
              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;