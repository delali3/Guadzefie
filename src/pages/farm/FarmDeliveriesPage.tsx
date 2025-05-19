import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Truck, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Package, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
} from 'lucide-react';

interface Delivery {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  estimated_delivery: string;
  actual_delivery?: string;
  tracking_number?: string;
  shipping_method: string;
  carrier: string;
  notes?: string;
  order: {
    id: string;
    status: string;
    user: {
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
    } | null;
    shipping_address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  };
}

const statusOptions = [
  { value: 'all', label: 'All Deliveries' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' }
];

const FarmDeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter, timeFilter, currentPage]);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error("No authenticated user found");
      const user = JSON.parse(storedUser);

      // First, get all products for this farm
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('owner_id', user.id);

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setDeliveries([]);
        setIsLoading(false);
        return;
      }

      const farmProductIds = productsData.map(product => product.id);

      // Get orders that contain farm products
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, 
          order_items!inner(product_id)
        `)
        .in('order_items.product_id', farmProductIds);

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setDeliveries([]);
        setIsLoading(false);
        return;
      }

      const orderIds = ordersData.map(order => order.id);

      // Build query for deliveries
      let query = supabase
        .from('deliveries')
        .select(`
          id, 
          order_id,
          status, 
          created_at, 
          estimated_delivery,
          actual_delivery,
          tracking_number,
          shipping_method,
          carrier,
          notes,
          order:order_id(
            id,
            status,
            user:user_id(id, email, first_name, last_name),
            shipping_address
          )
        `)
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      // Apply status filter if needed
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply time filter if needed
      if (timeFilter !== 'all') {
        const now = new Date();
        let startDate;

        if (timeFilter === 'today') {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'week') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (timeFilter === 'month') {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data: deliveriesData, error: deliveriesError, count } = await query;

      if (deliveriesError) throw deliveriesError;

  // Process data to match Delivery interface
  const processedDeliveries = deliveriesData?.map(item => ({
    ...item,
    order: Array.isArray(item.order) ? item.order[0] : item.order,
    ...(Array.isArray(item.order) && item.order[0] && {
      order: {
        ...item.order[0],
        user: Array.isArray(item.order[0].user) ? item.order[0].user[0] : item.order[0].user
      }
    })
  }));
  
  setDeliveries(processedDeliveries as Delivery[]);
  
      setTotalDeliveries(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error fetching farm deliveries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
    } finally {
      setIsLoading(false);
    }
  };


  const handleUpdateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', deliveryId);

      if (error) throw error;

      // Update local state
      setDeliveries(deliveries.map(delivery => 
        delivery.id === deliveryId 
          ? { ...delivery, status: newStatus } 
          : delivery
      ));
    } catch (err) {
      console.error('Error updating delivery status:', err);
      alert('Failed to update delivery status');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectDelivery = (deliveryId: string) => {
    setSelectedDeliveries(prev => 
      prev.includes(deliveryId)
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const handleSelectAllDeliveries = () => {
    if (selectedDeliveries.length === deliveries.length) {
      setSelectedDeliveries([]);
    } else {
      setSelectedDeliveries(deliveries.map(delivery => delivery.id));
    }
  };

  // Filter deliveries based on search term
  const filteredDeliveries = searchTerm
    ? deliveries.filter(delivery => 
        delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (delivery.tracking_number && delivery.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (delivery.order?.user?.email && delivery.order.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((delivery.order?.user?.first_name || '') + ' ' + (delivery.order?.user?.last_name || '')).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : deliveries;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'in_transit':
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'in_transit':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case 'out_for_delivery':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Deliveries</h1>
            <p className="text-gray-500 dark:text-gray-400">Track and manage shipments of your farm products.</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => alert('Export deliveries functionality would go here')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search deliveries..."
                  className="pl-10 py-2 block w-full border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300 focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
                    aria-label="Filter by status"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
                    aria-label="Filter by time period"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/20">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={selectedDeliveries.length === deliveries.length && deliveries.length > 0}
                      onChange={handleSelectAllDeliveries}
                      aria-label="Select all deliveries"
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tracking/Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ship Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDeliveries.length > 0 ? (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                        checked={selectedDeliveries.includes(delivery.id)}
                        onChange={() => handleSelectDelivery(delivery.id)}
                        aria-label={`Select delivery ${delivery.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/farm/deliveries/${delivery.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                        {delivery.tracking_number || `#${delivery.id.substring(0, 8)}`}
                      </Link>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Order: <Link to={`/farm/orders/${delivery.order_id}`} className="hover:underline">{delivery.order_id.substring(0, 8)}</Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {delivery.order?.user ? (
                          ((delivery.order.user.first_name || '') + ' ' + (delivery.order.user.last_name || '')).trim() || delivery.order.user.email
                        ) : (
                          'Unknown Customer'
                        )}
                      </div>
                      {delivery.order?.shipping_address && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {delivery.order.shipping_address.city}, {delivery.order.shipping_address.state}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          <span className="ml-1">{delivery.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {delivery.carrier} - {delivery.shipping_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(delivery.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {delivery.actual_delivery 
                        ? new Date(delivery.actual_delivery).toLocaleDateString()
                        : delivery.estimated_delivery 
                          ? <>Est: {new Date(delivery.estimated_delivery).toLocaleDateString()}</>
                          : 'Not scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <select
                        value={delivery.status}
                        onChange={(e) => handleUpdateDeliveryStatus(delivery.id, e.target.value)}
                        className="text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-1 focus:ring-green-500 focus:border-green-500"
                        aria-label={`Update status for delivery ${delivery.id}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                    {searchTerm ? 'No deliveries match your search criteria.' : 'No deliveries found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalDeliveries)}
                  </span>{' '}
                  of <span className="font-medium">{totalDeliveries}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmDeliveriesPage; 