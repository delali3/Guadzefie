// src/pages/admin/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    DollarSign,
    ShoppingBag,
    Users,
    Package,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OrderWithUser {
    id: number;
    created_at: string;
    status?: string;
    total_amount?: number;
    user?: {
        email?: string;
        first_name?: string;
        last_name?: string;
    } | null;
}

interface ChartDataPoint {
    date?: Date;
    name: string;
    sales: number;
    orders: number;
}

const DashboardPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState('week');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        salesGrowth: 0,
        ordersGrowth: 0,
        customersGrowth: 0
    });
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Get total products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('id, name, inventory_count');

                if (productsError) throw productsError;

                const totalProducts = productsData?.length || 0;

                // Get products with low stock
                const DEFAULT_THRESHOLD = 10;
                const lowStockItems = productsData
                    ?.filter(product =>
                        product.inventory_count !== null &&
                        product.inventory_count <= DEFAULT_THRESHOLD
                    )
                    .map(product => ({
                        id: product.id,
                        name: product.name,
                        stock: product.inventory_count,
                        threshold: DEFAULT_THRESHOLD
                    })) || [];

                setLowStockProducts(lowStockItems);

                // Get total customers
                const { count: totalCustomers, error: customersError } = await supabase
                    .from('users')
                    .select('id', { count: 'exact', head: true });

                if (customersError) throw customersError;

                // Get orders data
                let startDate;
                const now = new Date();

                if (timeframe === 'week') {
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                } else if (timeframe === 'month') {
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 30);
                } else {
                    startDate = new Date(now);
                    startDate.setFullYear(now.getFullYear() - 1);
                }

                const formattedStartDate = startDate.toISOString();

                // Get all orders for the selected timeframe
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('id, created_at, status, total_amount, user:user_id(email, first_name, last_name)')
                    .gte('created_at', formattedStartDate)
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;

                // Calculate total sales and orders
                const totalOrders = ordersData?.length || 0;
                const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

                // Get recent orders
                const typedOrdersData = ordersData as OrderWithUser[] | null;
                const recentOrdersData = typedOrdersData?.slice(0, 5).map(order => {
                    const customerName = order.user
                        ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || order.user.email || 'Unknown Customer'
                        : 'Unknown Customer';

                    return {
                        id: order.id,
                        customer: customerName,
                        amount: order.total_amount || 0,
                        status: order.status || 'Pending',
                        date: new Date(order.created_at).toLocaleDateString()
                    };
                }) || [];

                setRecentOrders(recentOrdersData);

                // Get previous period data for growth calculation
                let previousPeriodStart;
                if (timeframe === 'week') {
                    previousPeriodStart = new Date(startDate);
                    previousPeriodStart.setDate(startDate.getDate() - 7);
                } else if (timeframe === 'month') {
                    previousPeriodStart = new Date(startDate);
                    previousPeriodStart.setDate(startDate.getDate() - 30);
                } else {
                    previousPeriodStart = new Date(startDate);
                    previousPeriodStart.setFullYear(startDate.getFullYear() - 1);
                }

                const formattedPreviousPeriodStart = previousPeriodStart.toISOString();

                const { data: previousOrdersData, error: previousOrdersError } = await supabase
                    .from('orders')
                    .select('id, created_at, total_amount')
                    .gte('created_at', formattedPreviousPeriodStart)
                    .lt('created_at', formattedStartDate);

                if (previousOrdersError) throw previousOrdersError;

                // Calculate growth percentages
                const previousSales = previousOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
                const previousOrders = previousOrdersData?.length || 0;

                const salesGrowth = previousSales > 0
                    ? ((totalSales - previousSales) / previousSales) * 100
                    : totalSales > 0 ? 100 : 0;

                const ordersGrowth = previousOrders > 0
                    ? ((totalOrders - previousOrders) / previousOrders) * 100
                    : totalOrders > 0 ? 100 : 0;

                // Get customer growth
                const { count: previousCustomers, error: previousCustomersError } = await supabase
                    .from('users')
                    .select('id', { count: 'exact', head: true })
                    .lt('created_at', formattedStartDate);

                if (previousCustomersError) throw previousCustomersError;

                const customersGrowth = previousCustomers && previousCustomers > 0
                    ? (((totalCustomers || 0) - previousCustomers) / previousCustomers) * 100
                    : (totalCustomers || 0) > 0 ? 100 : 0;

                // Prepare chart data
                let chartDataArray: ChartDataPoint[] = [];

                if (timeframe === 'week') {
                    // Group by day for the last week
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dailyData = new Array(7).fill(0).map((_, index) => {
                        const date = new Date(now);
                        date.setDate(now.getDate() - (6 - index));
                        return {
                            date,
                            name: days[date.getDay()],
                            sales: 0,
                            orders: 0
                        };
                    });

                    // Fill with actual order data
                    ordersData?.forEach(order => {
                        const orderDate = new Date(order.created_at);
                        const dayIndex = dailyData.findIndex(item =>
                            item.date?.getDate() === orderDate.getDate() &&
                            item.date?.getMonth() === orderDate.getMonth() &&
                            item.date?.getFullYear() === orderDate.getFullYear()
                        );

                        if (dayIndex !== -1) {
                            dailyData[dayIndex].sales += (order.total_amount || 0);
                            dailyData[dayIndex].orders += 1;
                        }
                    });

                    chartDataArray = dailyData;
                } else if (timeframe === 'month') {
                    // Group by week for the last month
                    const weeksData = new Array(4).fill(0).map((_, index) => ({
                        name: `Week ${index + 1}`,
                        sales: 0,
                        orders: 0
                    }));

                    // Fill with actual order data
                    ordersData?.forEach(order => {
                        const orderDate = new Date(order.created_at);
                        const daysAgo = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                        const weekIndex = Math.min(Math.floor(daysAgo / 7), 3);

                        weeksData[weekIndex].sales += (order.total_amount || 0);
                        weeksData[weekIndex].orders += 1;
                    });

                    chartDataArray = weeksData;
                } else {
                    // Group by month for the last year
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthlyData = new Array(12).fill(0).map((_, index) => {
                        const date = new Date(now);
                        date.setMonth(now.getMonth() - (11 - index));
                        return {
                            date,
                            name: monthNames[date.getMonth()],
                            sales: 0,
                            orders: 0
                        };
                    });

                    // Fill with actual order data
                    ordersData?.forEach(order => {
                        const orderDate = new Date(order.created_at);
                        const monthIndex = monthlyData.findIndex(item =>
                            item.date?.getMonth() === orderDate.getMonth() &&
                            item.date?.getFullYear() === orderDate.getFullYear()
                        );

                        if (monthIndex !== -1) {
                            monthlyData[monthIndex].sales += (order.total_amount || 0);
                            monthlyData[monthIndex].orders += 1;
                        }
                    });

                    chartDataArray = monthlyData;
                }

                // Update state with all the fetched data
                setStats({
                    totalSales,
                    totalOrders,
                    totalCustomers: totalCustomers || 0,
                    totalProducts,
                    salesGrowth: parseFloat(salesGrowth.toFixed(1)),
                    ordersGrowth: parseFloat(ordersGrowth.toFixed(1)),
                    customersGrowth: parseFloat(customersGrowth.toFixed(1))
                });

                setChartData(chartDataArray);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeframe]);

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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs">
                        {stats.salesGrowth >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500">+{stats.salesGrowth}% from previous period</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500">{stats.salesGrowth}% from previous period</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders}</h3>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                            <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs">
                        {stats.ordersGrowth >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500">+{stats.ordersGrowth}% from previous period</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500">{stats.ordersGrowth}% from previous period</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalCustomers}</h3>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs">
                        {stats.customersGrowth >= 0 ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500">+{stats.customersGrowth}% from previous period</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-red-500">{stats.customersGrowth}% from previous period</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalProducts}</h3>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                            <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div className="flex items-center mt-4 text-xs">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-gray-500">{lowStockProducts.length} products low in stock</span>
                    </div>
                </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Sales Overview</h2>
                    <div className="mt-3 sm:mt-0">
                        <select
                            title="Timeframe"
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2"
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="year">Last 12 Months</option>
                        </select>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="sales" name="Sales ($)" fill="#6366f1" />
                            <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Orders & Inventory Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Orders</h2>
                        <Link to="/admin/orders" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            View All
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="px-6 py-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Link to={`/admin/orders/${order.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                                            {order.id}
                                        </Link>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">${order.amount.toFixed(2)}</p>
                                        <span className={`inline-flex text-xs px-2 py-1 rounded-full ${order.status === 'Completed'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                            : order.status === 'Processing'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{order.date}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <Link to="/admin/orders/new" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            Create New Order
                        </Link>
                    </div>
                </div>

                {/* Inventory Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Inventory Alerts</h2>
                        <Link to="/admin/products" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            View All Products
                        </Link>
                    </div>
                    {lowStockProducts.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {lowStockProducts.map((product) => (
                                <div key={product.id} className="px-6 py-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Link to={`/admin/products/${product.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400">
                                                {product.name}
                                            </Link>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {product.stock} units remaining
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                                Below threshold ({product.threshold})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center">
                            <Package className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="mt-4 text-gray-500 dark:text-gray-400">All products are well-stocked!</p>
                        </div>
                    )}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <Link to="/admin/products/new" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                            Add New Product
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/products/new" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Add New Product</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Create and list a new product for sale</p>
                </Link>

                <Link to="/admin/orders" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Manage Orders</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">View and process customer orders</p>
                </Link>

                <Link to="/admin/customers" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Customer Data</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">View customer profiles and activity</p>
                </Link>

                <Link to="/admin/settings" className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Sales Reports</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Generate and view detailed sales reports</p>
                </Link>
            </div>
        </div>
    );
};

export default DashboardPage;