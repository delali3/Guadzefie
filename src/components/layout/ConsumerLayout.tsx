import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  User, 
  Settings, 
  LogOut, 
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Heart,
  CreditCard,
  MapPin,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ConsumerLayoutProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ConsumerLayout: React.FC<ConsumerLayoutProps> = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Define navigation items
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/consumer' },
    { name: 'My Orders', icon: <ShoppingBag size={20} />, href: '/consumer/orders' },
    { name: 'Wishlist', icon: <Heart size={20} />, href: '/consumer/wishlist' },
    { name: 'Payment Methods', icon: <CreditCard size={20} />, href: '/consumer/payment' },
    { name: 'Delivery Addresses', icon: <MapPin size={20} />, href: '/consumer/address' },
    { name: 'Subscriptions', icon: <Calendar size={20} />, href: '/consumer/subscription' },
    { name: 'My Profile', icon: <User size={20} />, href: '/consumer/profile' },
    { name: 'Settings', icon: <Settings size={20} />, href: '/consumer/settings' },
  ];

  // Get current path
  const isActive = (path: string) => {
    if (path === '/consumer') {
      return location.pathname === '/consumer';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for mobile */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-40 lg:hidden`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 transition-all transform duration-300">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link to="/consumer" className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Guadzefie</span>
              </Link>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                >
                  <div className="mr-4">{item.icon}</div>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 group block w-full flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200 dark:border-gray-700">
              <Link to="/consumer" className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Guadzefie</span>
              </Link>
            </div>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <div className="mr-3">{item.icon}</div>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={handleSignOut}
                className="flex-shrink-0 w-full group flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <button
            className="px-4 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0">
                <label htmlFor="search-field" className="sr-only">Search</label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-400">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search products, orders..."
                    type="search"
                  />
                </div>
              </form>
            </div>
            <div className="ml-4 flex items-center space-x-4 md:ml-6">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" />
                </button>
                {/* Notification badge */}
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  2
                </span>

                {/* Dropdown panel, show/hide based on dropdown state */}
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <div className="block px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium">Notifications</p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {/* Sample notifications */}
                        <a href="#" className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                <ShoppingBag className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Your order has shipped!</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Order #12345 is on its way</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">10 minutes ago</p>
                            </div>
                          </div>
                        </a>
                        <a href="#" className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                                <Package className="h-5 w-5" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Special offer!</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">20% off on selected products</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">1 hour ago</p>
                            </div>
                          </div>
                        </a>
                      </div>
                      <div className="block px-4 py-2 text-center text-sm text-green-600 dark:text-green-400 border-t border-gray-200 dark:border-gray-700">
                        <a href="#">View all notifications</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                    <span className="text-sm font-medium">CN</span>
                  </div>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                      <Link
                        to="/consumer/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/consumer/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                {/* Breadcrumbs */}
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link to="/consumer" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        My Account
                      </Link>
                    </li>
                    {location.pathname !== '/consumer' && (
                      <>
                        <li>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </li>
                        <li>
                          <span className="text-gray-700 dark:text-gray-300">
                            {(() => {
                              const lastSegment = location.pathname.split('/').pop() || '';
                              return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
                            })()}
                          </span>
                        </li>
                      </>
                    )}
                  </ol>
                </nav>

                {/* Shop CTA */}
                <div className="mt-4 sm:mt-0">
                  <Link
                    to="/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Shop Products
                  </Link>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              {/* Main content */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConsumerLayout;