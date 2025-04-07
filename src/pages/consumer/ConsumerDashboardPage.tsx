import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    ShoppingBag,
    Clock,
    Heart,
    Truck,
    MapPin,
    CreditCard,
    Calendar,
    Leaf,
    Package,
    User
} from 'lucide-react';


// First, define proper interfaces for all data structures
interface UserProfile {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    // Add other properties as needed
}

interface OrderItem {
    id: number;
    product_id: number;
}

interface Order {
    id: number;
    created_at: string;
    status: string;
    total_amount: number;
    order_items: OrderItem[];
    estimated_delivery?: string;
    items_count?: number;
}

interface Farm {
    id: string;
    name: string;
    image_url?: string;
    products: { count: number }[];
}

interface SavedFarm {
    farm_id: string;
    farm: Farm;
}

interface ProcessedFarm {
    id: string;
    name: string;
    image_url?: string;
    product_count: number;
}

interface Product {
    id: number;
    name: string;
    price: number;
    image_url?: string;
}

interface WishlistItem {
    id: number;
    product_id: number;
    product: Product;
}

interface Stats {
    totalOrders: number;
    savedFarms: number;
    wishlistItems: number;
}

const ConsumerDashboardPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [savedFarms, setSavedFarms] = useState<ProcessedFarm[]>([]);
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [upcomingDeliveries, setUpcomingDeliveries] = useState<Order[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        savedFarms: 0,
        wishlistItems: 0
    });

    // The updated useEffect with proper type handling
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No authenticated user found");

                // Get user profile
                const { data: profileData, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                setUserProfile(profileData as UserProfile);

                // Get recent orders
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select(`
            id, 
            created_at, 
            status, 
            total_amount,
            order_items(id, product_id)
          `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (ordersError) throw ordersError;

                // Process orders and count items
                // Explicitly cast orders to the correct type
                const orders = ordersData as unknown as Order[];
                const processedOrders = orders.map(order => ({
                    ...order,
                    items_count: order.order_items.length
                }));

                setRecentOrders(processedOrders);

                // Get upcoming deliveries (orders with status "Processing" or "Shipped")
                const { data: deliveriesData, error: deliveriesError } = await supabase
                    .from('orders')
                    .select(`
            id, 
            created_at, 
            status, 
            total_amount,
            order_items(id, product_id),
            estimated_delivery
          `)
                    .eq('user_id', user.id)
                    .in('status', ['Processing', 'Shipped'])
                    .order('created_at', { ascending: false });

                if (deliveriesError) throw deliveriesError;

                // Use type assertion for deliveries data
                const deliveries = deliveriesData as unknown as Order[];
                setUpcomingDeliveries(deliveries);

                // Get saved farms
                const { data: savedFarmsData, error: savedFarmsError } = await supabase
                    .from('saved_farms')
                    .select(`
                        farm_id,
                        farm:farm_id(
                        id,
                        name,
                        image_url,
                        products(count)
                        )
                    `)
                    .eq('user_id', user.id);

                if (savedFarmsError) throw savedFarmsError;

                // Process saved farms data with proper typing
                const savedFarms = savedFarmsData as unknown as SavedFarm[];
                const processedFarms: ProcessedFarm[] = savedFarms.map(item => ({
                    id: item.farm.id,
                    name: item.farm.name,
                    image_url: item.farm.image_url,
                    product_count: item.farm.products[0]?.count || 0 // Access count from first element if it exists
                }));

                setSavedFarms(processedFarms);

                // Get wishlist items
                const { data: wishlistData, error: wishlistError } = await supabase
                    .from('wishlist')
                    .select(`
            id,
            product_id,
            product:product_id(
              id,
              name,
              price,
              image_url
            )
          `)
                    .eq('user_id', user.id);

                if (wishlistError) throw wishlistError;

                // Use type assertion to fix product type issues
                const wishlistItems = wishlistData.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    product: Array.isArray(item.product) ? item.product[0] : item.product
                })) as WishlistItem[];

                setWishlistItems(wishlistItems);

                // Set stats
                const { count: totalOrdersCount, error: countError } = await supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (countError) throw countError;

                const statsData: Stats = {
                    totalOrders: totalOrdersCount || 0,
                    savedFarms: processedFarms.length,
                    wishlistItems: wishlistItems.length
                };

                setStats(statsData);

            } catch (err) {
                console.error('Error fetching consumer dashboard data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);


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
            {/* Welcome Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <User className="h-7 w-7" />
                    </div>
                    <div className="ml-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Welcome{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Track your orders, manage your saved farms, and discover fresh products.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders}</h3>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                            <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saved Farms</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.savedFarms}</h3>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                            <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wishlist Items</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.wishlistItems}</h3>
                        </div>
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                            <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders & Upcoming Deliveries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Orders</h2>
                        <Link to="/orders" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            View All
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order) => (
                                <div key={order.id} className="px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <Link to={`/orders/${order.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                                                Order #{order.id}
                                            </Link>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">${order.total_amount.toFixed(2)}</p>
                                            <span className={`inline-flex text-xs px-2 py-1 rounded-full ${order.status === 'Completed'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                : order.status === 'Processing'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                    : order.status === 'Shipped'
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="mt-4 text-gray-500 dark:text-gray-400">No orders yet</p>
                                <Link to="/products" className="mt-2 inline-block text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                                    Browse products
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Deliveries */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Deliveries</h2>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {upcomingDeliveries.length > 0 ? (
                            upcomingDeliveries.map((delivery) => (
                                <div key={delivery.id} className="px-6 py-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="flex justify-between">
                                                <Link to={`/orders/${delivery.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                                                    Order #{delivery.id}
                                                </Link>
                                                <span className={`inline-flex text-xs px-2 py-1 rounded-full ${delivery.status === 'Shipped'
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                    }`}>
                                                    {delivery.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {delivery.estimated_delivery
                                                    ? `Expected: ${new Date(delivery.estimated_delivery).toLocaleDateString()}`
                                                    : 'Processing'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <Truck className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="mt-4 text-gray-500 dark:text-gray-400">No upcoming deliveries</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Saved Farms & Wishlist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Saved Farms */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Saved Farms</h2>
                        <Link to="/farms" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            Discover Farms
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {savedFarms.length > 0 ? (
                            savedFarms.map((farm) => (
                                <div key={farm.id} className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center overflow-hidden">
                                                {farm.image_url ? (
                                                    <img src={farm.image_url} alt={farm.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <Link to={`/farms/${farm.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                                                {farm.name}
                                            </Link>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {farm.product_count} product{farm.product_count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <Leaf className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="mt-4 text-gray-500 dark:text-gray-400">No saved farms</p>
                                <Link to="/farms" className="mt-2 inline-block text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                                    Discover farms
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wishlist */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Wishlist</h2>
                        <Link to="/wishlist" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            View All
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {wishlistItems.length > 0 ? (
                            wishlistItems.slice(0, 5).map((item) => (
                                <div key={item.id} className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                {item.product.image_url ? (
                                                    <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-6 w-6 text-gray-500" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <div className="flex justify-between">
                                                <Link to={`/products/${item.product_id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                                                    {item.product.name}
                                                </Link>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    ${item.product.price.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center">
                                <Heart className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="mt-4 text-gray-500 dark:text-gray-400">Your wishlist is empty</p>
                                <Link to="/products" className="mt-2 inline-block text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                                    Browse products
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/products" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Shop Products</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Browse fresh farm products</p>
                </Link>

                <Link to="/address" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Manage Addresses</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Update delivery locations</p>
                </Link>

                <Link to="/payment" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Payment Methods</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Manage payment options</p>
                </Link>

                <Link to="/subscription" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Subscriptions</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Manage recurring deliveries</p>
                </Link>
            </div>
        </div>
    );
}

export default ConsumerDashboardPage;