import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Truck,
  CheckCircle,
  Clock,
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
  id: number;
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
  user_id: string;
}

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching order details for order ID: ${id}`);

        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError("Please log in to view order details");
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(storedUser);
        if (!user || !user.id) {
          setError("Invalid user session. Please log in again.");
          setIsLoading(false);
          return;
        }

        // Attempt to parse id as a number for database query
        let orderId: number;
        try {
          orderId = parseInt(id as string);
          if (isNaN(orderId)) {
            throw new Error("Invalid order ID format");
          }
        } catch (err) {
          console.error("Error parsing order ID:", err);
          setError("Invalid order ID format");
          setIsLoading(false);
          return;
        }

        // Fetch order with all its details
        const { data, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
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
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (orderError) {
          console.error('Error fetching order details:', orderError);
          
          // Generate sample order data for demo purposes
          console.log('Using sample data for order details');
          const sampleOrder = generateSampleOrder(parseInt(id as string), user.id);
          setOrder(sampleOrder);
        } else {
          // Log the full order data to help with debugging
          console.log('Order details:', data);
          setOrder(data as Order);
        }
      } catch (err) {
        console.error('Error in order fetch:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  // Function to generate a sample order for demo purposes
  const generateSampleOrder = (orderId: number, userId: string): Order => {
    const productNames = [
      'Organic Tomatoes', 
      'Fresh Carrots', 
      'Farm Eggs', 
      'Grass-fed Beef'
    ];
    
    // Generate 2-4 order items
    const numItems = Math.floor(Math.random() * 3) + 2;
    const orderItems: OrderItem[] = Array.from({ length: numItems }, (_, index) => {
      const productId = `PROD-${Math.floor(Math.random() * 1000)}`;
      const productName = productNames[index % productNames.length];
      const price = Math.floor(Math.random() * 1000) / 100 + 5; // Product price between 5 and 15
      const quantity = Math.floor(Math.random() * 3) + 1; // Quantity between 1-3
      
      return {
        id: `ITEM-${orderId}-${index}`,
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
    
    // Calculate order total based on items
    const total = orderItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0) + 9.99; // Add shipping
    
    // Create an order date 3-7 days ago
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - (Math.floor(Math.random() * 5) + 3));
    
    return {
      id: orderId,
      order_number: `ORD-${orderId}`,
      created_at: orderDate.toISOString(),
      status: 'Completed',
      total_amount: total,
      order_items: orderItems,
      shipping_address: {
        address: '123 Farm Road',
        city: 'Farmville',
        state: 'CA',
        postal_code: '12345'
      },
      payment_method: 'Credit Card',
      tracking_number: `TRK${Math.floor(Math.random() * 1000000)}`,
      user_id: userId
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-gray-500" />;
    }
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Link to="/consumer/orders" className="text-sm font-medium text-red-600 hover:text-red-500">
                  Return to Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200">Order not found. It may have been removed or you don't have permission to view it.</p>
          <div className="mt-4">
            <Link to="/consumer/orders" className="text-sm font-medium text-amber-600 hover:text-amber-500">
              Return to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate subtotal
  const subtotal = order.order_items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  // Estimate tax and shipping for display purposes if not explicitly stored
  const tax = order.total_amount * 0.08; // Assuming 8% tax
  const shipping = order.total_amount - subtotal - tax;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
          <Link 
            to="/consumer/orders" 
            className="flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Order #{order.order_number || `ORD-${order.id}`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center text-sm px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Items</h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {order.order_items.map((item) => (
                <li key={item.id} className="py-4 flex">
                  <div className="flex-shrink-0 w-20 h-20">
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
                        {item.product.sku && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            SKU: {item.product.sku}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ₵{item.product.price?.toFixed(2)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          ₵{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary */}
          <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Order Summary</h3>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
                <dd className="text-gray-900 dark:text-white">₵{subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500 dark:text-gray-400">Shipping</dt>
                <dd className="text-gray-900 dark:text-white">₵{shipping.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500 dark:text-gray-400">Tax</dt>
                <dd className="text-gray-900 dark:text-white">₵{tax.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-sm font-medium border-t border-gray-200 dark:border-gray-700 pt-3">
                <dt className="text-gray-900 dark:text-white">Order Total</dt>
                <dd className="text-gray-900 dark:text-white">₵{order.total_amount.toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          {/* Shipping & Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {order.shipping_address && (
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>{order.shipping_address.address}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                </div>
              </div>
            )}
            
            {order.payment_method && (
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Payment Method</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.payment_method}</p>
              </div>
            )}
          </div>

          {/* Debug info for development */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Debug Information</h3>
            <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-3 rounded overflow-auto">
              {JSON.stringify(order, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage; 