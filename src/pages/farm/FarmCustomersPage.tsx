import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Search, 
  Mail,
  Phone,
  ShoppingBag,
  User,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  DollarSign,
  List,
  Eye,
  Edit,
  Plus,
  UserX,
  Grid
} from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
}

// Customer card component for a more visually appealing display
const CustomerCard = ({ customer, onSelectCustomer, isSelected }: { 
  customer: Customer; 
  onSelectCustomer: (id: string) => void; 
  isSelected: boolean;
}) => {
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer';
  const nameInitials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${isSelected ? 'border-green-500 dark:border-green-400 ring-2 ring-green-500/20' : 'border-gray-200 dark:border-gray-700'} shadow-sm hover:shadow-md transition-all duration-200 p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium text-lg">
            {nameInitials || '?'}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{fullName}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customer.email || 'No email'}</p>
            </div>
            <div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectCustomer(customer.id)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                aria-label={`Select ${fullName}`}
                title={`Select ${fullName}`}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {customer.phone || 'No phone'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'No orders'}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {formatCurrency(customer.total_spent)}
              </span>
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                ({customer.total_orders} orders)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Format currency for better display
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const FarmCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Handle customer action selection
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    fetchCustomers();
  }, [timeFilter, currentPage]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    
    try {
      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error("No authenticated user found");
      const user = JSON.parse(storedUser);

      // Initialize customerMap
      const customerMap = new Map<string, Customer>();
      
      // Get customers associated with this farm through the farm_customers table
      const { data: farmCustomers, error: farmCustomersError } = await supabase
        .from('farm_customers')
        .select(`
          customer_id,
          created_at,
          customer:customer_id(
            id, 
            email, 
            first_name, 
            last_name, 
            phone,
            created_at
          )
        `)
        .eq('farm_id', user.id);

      if (farmCustomersError) throw farmCustomersError;
      
      // Add direct customers to the map
      if (farmCustomers && farmCustomers.length > 0) {
        farmCustomers.forEach(relation => {
          if (relation.customer) {
            customerMap.set((relation.customer as any).id, {
              id: (relation.customer as any).id,
              email: (relation.customer as any).email,
              first_name: (relation.customer as any).first_name,
              last_name: (relation.customer as any).last_name,
              phone: (relation.customer as any).phone,
              total_orders: 0,
              total_spent: 0,
              created_at: (relation.customer as any).created_at
            });
          }
        });
      }

      // Get all products for this farm
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('owner_id', user.id);

      if (productsError) throw productsError;

      if (productsData && productsData.length > 0) {
        const farmProductIds = productsData.map(product => product.id);

        // Get orders with farm products and their users
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total_amount,
            user:user_id(id, email, first_name, last_name, phone, created_at),
            order_items!inner(product_id)
          `)
          .in('order_items.product_id', farmProductIds);

        if (ordersError) throw ordersError;

        if (ordersData && ordersData.length > 0) {
          // Process orders to update customer data
          ordersData.forEach(order => {
            if (!order.user) return;

            const customerId = (order.user as any).id;
            const existingCustomer = customerMap.get(customerId);

            if (existingCustomer) {
              // Update existing customer
              existingCustomer.total_orders += 1;
              existingCustomer.total_spent += order.total_amount;
              
              // Update last order date if this order is more recent
              const orderDate = new Date(order.created_at);
              const lastOrderDate = existingCustomer.last_order_date 
                ? new Date(existingCustomer.last_order_date) 
                : new Date(0);
                
              if (orderDate > lastOrderDate) {
                existingCustomer.last_order_date = order.created_at;
              }
            } else {
              // Create new customer entry
              customerMap.set(customerId, {
                id: (order.user as any).id,
                email: (order.user as any).email,
                first_name: (order.user as any).first_name,
                last_name: (order.user as any).last_name,
                phone: (order.user as any).phone,
                total_orders: 1,
                total_spent: order.total_amount,
                last_order_date: order.created_at,
                created_at: (order.user as any).created_at
              });
            }
          });
        }
      }

      // Convert map to array and sort by total spent
      let customersList = Array.from(customerMap.values()).sort((a, b) => 
        b.total_spent - a.total_spent
      );

      // Apply time filter if needed
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate;

        if (timeFilter === 'last30') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
        } else if (timeFilter === 'last90') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
        } else if (timeFilter === 'last365') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 365);
        }

        if (startDate) {
          customersList = customersList.filter(customer => 
            customer.last_order_date && new Date(customer.last_order_date) >= startDate
          );
        }
      }

      // Apply pagination
      const total = customersList.length;
      const start = (currentPage - 1) * itemsPerPage;
      const end = Math.min(start + itemsPerPage, total);
      const paginatedCustomers = customersList.slice(start, end);

      setCustomers(paginatedCustomers);
      setTotalCustomers(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(customer => customer.id));
    }
  };

  // Filter customers based on search term
  const filteredCustomers = searchTerm
    ? customers.filter(customer => 
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((customer.first_name || '') + ' ' + (customer.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
    : customers;

  // Handle customer action selection
  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const action = e.target.value;
    setSelectedAction(action);
    
    if (!action) return;
    
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer first.');
      setSelectedAction('');
      return;
    }
    
    // Handle different actions
    switch (action) {
      case 'email':
        // Example action - in a real app, this would open an email composer
        alert(`You would now send an email to ${selectedCustomers.length} customers`);
        break;
      case 'tag':
        // Example action - in a real app, this would open a tag selector
        alert(`You would now tag ${selectedCustomers.length} customers`);
        break;
      case 'export':
        // Example action - in a real app, this would trigger an export
        alert(`You would now export ${selectedCustomers.length} customers`);
        break;
      default:
        break;
    }
    
    setSelectedAction('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with modern design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Customers</h1>
            <p className="text-gray-500 dark:text-gray-400">View and manage customers who have purchased your farm products.</p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-end">
            <Link 
              to="/farm/customers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
            <button 
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => alert('Export customers functionality would go here')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Customers</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{totalCustomers}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Orders</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {customers.reduce((sum, customer) => sum + customer.total_orders, 0)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Revenue</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customers.reduce((sum, customer) => sum + customer.total_spent, 0))}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters & Actions Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="pl-10 py-2 block w-full border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300 focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-full sm:w-auto">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
                    aria-label="Filter by time period"
                  >
                    <option value="all">All Time</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="last365">Last Year</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    aria-label="Table view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    aria-label="Grid view"
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {selectedCustomers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCustomers.length} selected
                </span>
                <select
                  value={selectedAction}
                  onChange={handleActionChange}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
                  aria-label="Bulk actions"
                >
                  <option value="">Actions</option>
                  <option value="email">Email</option>
                  <option value="tag">Add Tag</option>
                  <option value="export">Export</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Customer List - Table or Grid view */}
        {filteredCustomers.length > 0 ? (
          <div>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                            checked={selectedCustomers.length === customers.length && customers.length > 0}
                            onChange={handleSelectAllCustomers}
                            aria-label="Select all customers"
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Orders
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Order
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCustomers.map((customer) => {
                      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer';
                      return (
                        <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                                checked={selectedCustomers.includes(customer.id)}
                                onChange={() => handleSelectCustomer(customer.id)}
                                aria-label={`Select ${fullName}`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                {fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{fullName}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Added: {new Date(customer.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{customer.email}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone || 'No phone'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {customer.total_orders}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(customer.total_spent)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                <Mail className="h-4 w-4" />
                                <span className="sr-only">Email</span>
                              </button>
                              <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </button>
                              <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCustomers.map((customer) => (
                    <CustomerCard 
                      key={customer.id}
                      customer={customer}
                      onSelectCustomer={handleSelectCustomer}
                      isSelected={selectedCustomers.includes(customer.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <UserX className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search term' : 'Start by adding a new customer to your farm'}.
            </p>
            <div className="mt-6">
              <Link
                to="/farm/customers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add New Customer
              </Link>
            </div>
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * 10, totalCustomers)}</span> of{" "}
                    <span className="font-medium">{totalCustomers}</span> customers
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ${currentPage === 1 ? 'cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-750'} focus:z-20 focus:outline-offset-0`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page 
                          ? 'z-10 bg-green-600 dark:bg-green-700 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600' 
                          : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 focus:z-20 focus:outline-offset-0'}`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ${currentPage === totalPages ? 'cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-750'} focus:z-20 focus:outline-offset-0`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmCustomersPage; 