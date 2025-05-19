import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Truck, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  Download,
  FileText,
  Printer,
  Mail,
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  } | null;
  order_items: OrderItem[];
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  estimated_delivery?: string;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
}

const FarmOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmProductsOnly, setFarmProductsOnly] = useState<OrderItem[]>([]);
  const [farmSubtotal, setFarmSubtotal] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!id) {
        throw new Error("Order ID is missing");
      }

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
        throw new Error("No products found for this farm");
      }

      const farmProductIds = productsData.map(product => product.id);

      // Get order with details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id, 
          created_at, 
          status, 
          total_amount,
          order_items(id, product_id, quantity, price, product:product_id(id, name, price, quantity, image_url)),
          user:user_id(id, email, first_name, last_name, phone),
          shipping_address,
          estimated_delivery,
          payment_method,
          payment_status,
          notes
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      if (!orderData) {
        throw new Error("Order not found");
      }

      // Map order items to correct format (product comes as array from Supabase)
      const formattedOrderItems = orderData.order_items.map(item => ({
        ...item,
        product: item.product[0] // Extract single product object from array
      }));

      // Filter to only show items from this farm's products
      const formattedFarmItems = formattedOrderItems.filter(item => 
        farmProductIds.includes(item.product_id)
      );

      // Calculate subtotal for this farm's items only
      const subtotal = formattedFarmItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Format the complete order data with correct types
      const formattedOrderData = {
        ...orderData,
        user: orderData.user?.[0] || null,
        order_items: formattedOrderItems
      };

      setOrder(formattedOrderData);
      setFarmProductsOnly(formattedFarmItems);
      setFarmSubtotal(subtotal);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      // Update local state
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'canceled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'processing':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'canceled':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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
        <button 
          onClick={() => navigate('/farm/orders')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">Order not found.</p>
        <button 
          onClick={() => navigate('/farm/orders')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Link 
              to="/farm/orders" 
              className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Order #{order.id.substring(0, 8)}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button 
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Order Status</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                    disabled={updatingStatus}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Update order status"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
                {updatingStatus && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    Updating...
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-between">
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${order.status !== 'canceled' ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Ordered</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Processing</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${['shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Shipped</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Order Items</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {farmProductsOnly.length} {farmProductsOnly.length === 1 ? 'item' : 'items'} from your farm in this order
              </p>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {farmProductsOnly.map((item) => (
                <li key={item.id} className="p-4 flex items-center">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                          {item.product.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                <p>Farm Subtotal</p>
                <p>${farmSubtotal.toFixed(2)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This represents your portion of the total order value.
              </p>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white mb-2">Order Notes</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Order Info Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Customer</h2>
            </div>
            <div className="p-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {order.user
                      ? ((order.user.first_name || '') + ' ' + (order.user.last_name || '')).trim() || 'Customer'
                      : 'Unknown Customer'}
                  </h3>
                  {order.user?.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{order.user.email}</p>
                  )}
                  {order.user?.phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.user.phone}</p>
                  )}
                  <button 
                    className="mt-2 inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Contact Customer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          {order.shipping_address && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-medium text-lg text-gray-900 dark:text-white">Shipping Details</h2>
              </div>
              <div className="p-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Delivery Address</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.shipping_address.street}<br />
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                      {order.shipping_address.country}
                    </p>
                  </div>
                </div>
                {order.estimated_delivery && (
                  <div className="mt-4 flex items-start">
                    <Truck className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Estimated Delivery</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.estimated_delivery).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Payment Information</h2>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
                <span className="text-gray-900 dark:text-white">{order.payment_method || 'Credit Card'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 dark:text-gray-400">Payment Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.payment_status === 'paid' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'Pending'}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-900 dark:text-white">Total Paid</span>
                  <span className="text-gray-900 dark:text-white">${order.total_amount.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This is the total order amount. Your farm's portion is ${farmSubtotal.toFixed(2)}.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Printer className="h-4 w-4 mr-2" />
                Print Packing Slip
              </button>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmOrderDetailsPage; 