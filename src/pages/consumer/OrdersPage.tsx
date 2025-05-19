import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingBag, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Truck,
  AlertCircle
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    sku?: string;
  };
}

interface Order {
  id: number | string;
  order_number?: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_items: OrderItem[];
  shipping_address?: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
  };
  payment_method?: string;
  tracking_number?: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<{ [key: string]: boolean }>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError("Please log in to view your orders");
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(storedUser);
        if (!user || !user.id) {
          setError("Invalid user session. Please log in again.");
          setIsLoading(false);
          return;
        }

        // Fetch orders with related order items and products
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id, 
            created_at, 
            status, 
            total_amount,
            shipping_address,
            payment_method,
            tracking_number,
            order_items (
              id,
              product_id,
              quantity,
              product:product_id (
                id,
                name,
                price,
                image_url,
                sku
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // If no orders found, generate sample data
        if (!data || data.length === 0) {
          console.log('No orders found in database, generating sample data');
          const sampleOrders = generateSampleOrders();
          setOrders(sampleOrders);
        } else {
          // Transform the data to match our interface
          const ordersData = data as unknown as Order[];
          
          console.log('Orders fetched:', ordersData);
          setOrders(ordersData);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load your orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Function to generate sample orders for demo purposes
  const generateSampleOrders = (): Order[] => {
    const statuses = ['Processing', 'Shipped', 'Completed', 'Cancelled'];
    const productNames = [
      'Organic Tomatoes', 
      'Fresh Carrots', 
      'Farm Eggs', 
      'Grass-fed Beef', 
      'Organic Milk',
      'Fresh Spinach',
      'Sweet Potatoes',
      'Honey Jar'
    ];
    const now = new Date();
    
    // Generate 8 sample orders with different dates and statuses
    return Array.from({ length: 8 }, (_, index) => {
      const orderDate = new Date();
      orderDate.setDate(now.getDate() - (index * 5)); // Each order is 5 days apart
      const status = statuses[index % statuses.length];
      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      
      // Generate tracking number for shipped orders
      const trackingNumber = status === 'Shipped' ? `TRK${Math.floor(Math.random() * 1000000)}` : undefined;
      
      // Random order total between 50 and 250
      const orderTotal = Math.floor(Math.random() * 20000) / 100 + 50;
      
      // Generate order items
      const orderItems: OrderItem[] = Array.from({ length: numItems }, (_, itemIndex) => {
        const productId = `PROD-${Math.floor(Math.random() * 1000)}`;
        const productName = productNames[Math.floor(Math.random() * productNames.length)];
        const price = Math.floor(Math.random() * 1000) / 100 + 5; // Product price between 5 and 15
        const quantity = Math.floor(Math.random() * 3) + 1; // Quantity between 1-3
        
        return {
          id: `ITEM-${index}-${itemIndex}`,
          product_id: productId,
          quantity: quantity,
          product: {
            id: productId,
            name: productName,
            price: price,
            image_url: `https://source.unsplash.com/100x100/?food,${productName.toLowerCase().replace(' ', ',')}`,
            sku: `SKU-${Math.floor(Math.random() * 10000)}`
          }
        };
      });
      
      return {
        id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        created_at: orderDate.toISOString(),
        status: status,
        total_amount: orderTotal,
        order_items: orderItems,
        tracking_number: trackingNumber,
        shipping_address: {
          address: '123 Farm Road',
          city: 'Farmville',
          state: 'CA',
          postal_code: '12345'
        },
        payment_method: index % 2 === 0 ? 'Credit Card' : 'Paystack'
      };
    });
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status.toLowerCase() === filterStatus.toLowerCase());

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Link to="/" className="text-sm font-medium text-red-600 hover:text-red-500">
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Orders</h1>
          <Link 
            to="/consumer/dashboard" 
            className="flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View and track all your orders in one place.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filterStatus === 'all'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilterStatus('processing')}
              className={`px-3 py-1 rounded-full text-sm ${
                filterStatus === 'processing'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilterStatus('shipped')}
              className={`px-3 py-1 rounded-full text-sm ${
                filterStatus === 'shipped'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Shipped
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-full text-sm ${
                filterStatus === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-3 py-1 rounded-full text-sm ${
                filterStatus === 'cancelled'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Order #{order.id}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => toggleOrderExpanded(order.id.toString())}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      {expandedOrders[order.id.toString()] ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-between items-center mt-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total: <span className="font-medium text-gray-900 dark:text-white">₵{order.total_amount.toFixed(2)}</span>
                    </p>
                  </div>
                  <div>
                    {order.tracking_number && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tracking: <span className="font-medium">{order.tracking_number}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {expandedOrders[order.id.toString()] && (
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Order Items</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="py-3 flex">
                          <div className="flex-shrink-0 w-16 h-16">
                            <img
                              src={item.product.image_url || `https://source.unsplash.com/random/80x80/?product=${item.product_id}`}
                              alt={item.product.name}
                              className="w-full h-full object-center object-cover rounded-md"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.product.name}
                                </h4>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {item.product.sku && `SKU: ${item.product.sku}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  ₵{item.product.price.toFixed(2)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Shipping & Payment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {order.shipping_address && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>{order.shipping_address.address}</p>
                          <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.payment_method && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Payment Method</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.payment_method}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link 
                      to={`/consumer/orders/${order.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                    
                    {order.status === 'Shipped' && order.tracking_number && (
                      <a 
                        href="#" 
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Track Shipment
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow text-center py-16 px-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400" />
          <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">No orders found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filterStatus === 'all' 
              ? "You haven't placed any orders yet." 
              : `You don't have any ${filterStatus} orders.`}
          </p>
          <div className="mt-6">
            <Link 
              to="/products" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 