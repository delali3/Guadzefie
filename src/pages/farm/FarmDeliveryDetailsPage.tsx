import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  User, 
  Check, 
  AlertTriangle,
  Clock,
  FileText,
  Printer,
  Mail,
  ExternalLink
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
    created_at: string;
    total_amount: number;
    user: {
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    } | null;
    order_items: {
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      product: {
        id: string;
        name: string;
        price: number;
        image_url?: string;
      };
    }[];
    shipping_address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  };
}

const FarmDeliveryDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmProductsOnly, setFarmProductsOnly] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [id]);

  const fetchDeliveryDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!id) {
        throw new Error("Delivery ID is missing");
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

      // Get delivery with details
      const { data: deliveryData, error: deliveryError } = await supabase
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
            created_at,
            total_amount,
            user:user_id(id, email, first_name, last_name, phone),
            shipping_address,
            order_items(id, product_id, quantity, price, product:product_id(id, name, price, image_url))
          )
        `)
        .eq('id', id)
        .single();

      if (deliveryError) throw deliveryError;

      if (!deliveryData) {
        throw new Error("Delivery not found");
      }

      // Filter to only show items from this farm's products
      const order = Array.isArray(deliveryData.order) ? deliveryData.order[0] : deliveryData.order;
      const farmItems = order.order_items.filter((item: any) => 
        farmProductIds.includes(item.product_id)
      );

      // Fix type inconsistency by normalizing the structure
      const normalizedDelivery = {
        ...deliveryData,
        order: order
      };
      
      setDelivery(normalizedDelivery as any);
      setFarmProductsOnly(farmItems);
    } catch (err) {
      console.error('Error fetching delivery details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (newStatus: string) => {
    if (!delivery) return;
    
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', delivery.id);

      if (error) throw error;

      // Update local state
      setDelivery(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Error updating delivery status:', err);
      alert('Failed to update delivery status');
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
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCarrierTrackingUrl = (carrier: string, trackingNumber: string) => {
    carrier = carrier.toLowerCase();
    if (carrier.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    } else if (carrier.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    } else if (carrier.includes('usps')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    } else if (carrier.includes('dhl')) {
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    } else {
      return null;
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
          onClick={() => navigate('/farm/deliveries')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Back to Deliveries
        </button>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">Delivery not found.</p>
        <button 
          onClick={() => navigate('/farm/deliveries')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Back to Deliveries
        </button>
      </div>
    );
  }

  const trackingUrl = delivery.tracking_number 
    ? getCarrierTrackingUrl(delivery.carrier, delivery.tracking_number)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Link 
              to="/farm/deliveries" 
              className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {delivery.tracking_number 
                  ? `Tracking #${delivery.tracking_number}` 
                  : `Delivery #${delivery.id.substring(0, 8)}`
                }
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Created on {new Date(delivery.created_at).toLocaleDateString()} for Order #{delivery.order_id.substring(0, 8)}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(delivery.status)}`}>
                {getStatusIcon(delivery.status)}
                <span className="ml-1 capitalize">{delivery.status.replace('_', ' ')}</span>
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
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Status Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Delivery Status</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                  <select
                    value={delivery.status}
                    onChange={(e) => handleUpdateDeliveryStatus(e.target.value)}
                    disabled={updatingStatus}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Update delivery status"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
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
                      <div className={`-m-1.5 p-1.5 rounded-full ${['pending', 'processing', 'in_transit', 'out_for_delivery', 'delivered'].includes(delivery.status) ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Processing</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${['in_transit', 'out_for_delivery', 'delivered'].includes(delivery.status) ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">In Transit</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${['out_for_delivery', 'delivered'].includes(delivery.status) ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Out for Delivery</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`-m-1.5 p-1.5 rounded-full ${delivery.status === 'delivered' ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Shipping Details</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Shipping Method</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{delivery.shipping_method}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Carrier</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{delivery.carrier}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tracking Number</h3>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">
                    {delivery.tracking_number ? (
                      <div className="flex items-center">
                        {delivery.tracking_number}
                        {trackingUrl && (
                          <a 
                          href={trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          aria-label="Track shipment"
                          title="Track shipment"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        )}
                      </div>
                    ) : (
                      'Not available'
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Delivery</h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {delivery.estimated_delivery 
                      ? new Date(delivery.estimated_delivery).toLocaleDateString()
                      : 'Not scheduled'}
                  </p>
                </div>
              </div>

              {delivery.order?.shipping_address && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Address</h3>
                  <div className="mt-2 text-sm text-gray-900 dark:text-white">
                    <p>{delivery.order.shipping_address.street}</p>
                    <p>{delivery.order.shipping_address.city}, {delivery.order.shipping_address.state} {delivery.order.shipping_address.postal_code}</p>
                    <p>{delivery.order.shipping_address.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-lg text-gray-900 dark:text-white">Order Items</h2>
                <Link 
                  to={`/farm/orders/${delivery.order_id}`}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  View Order
                </Link>
              </div>
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
                        <Package className="h-8 w-8" />
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
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery Notes */}
          {delivery.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white mb-2">Delivery Notes</h2>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{delivery.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
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
                    {delivery.order?.user
                      ? ((delivery.order.user.first_name || '') + ' ' + (delivery.order.user.last_name || '')).trim() || 'Customer'
                      : 'Unknown Customer'}
                  </h3>
                  {delivery.order?.user?.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{delivery.order.user.email}</p>
                  )}
                  {delivery.order?.user?.phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{delivery.order.user.phone}</p>
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

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-lg text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Printer className="h-4 w-4 mr-2" />
                Print Shipping Label
              </button>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <FileText className="h-4 w-4 mr-2" />
                Generate Packing Slip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmDeliveryDetailsPage; 