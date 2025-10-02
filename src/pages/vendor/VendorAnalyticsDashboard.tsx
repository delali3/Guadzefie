// src/pages/vendor/VendorAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useVendor } from '../../contexts/VendorContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  Package,
  Eye,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { VendorAnalytics } from '../../types/vendor';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  period: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon, period }) => {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'negative':
        return <ArrowDownRight className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
        <div className={`flex items-center ${getChangeColor(changeType)}`}>
          {getChangeIcon(changeType)}
          <span className="ml-1 text-sm font-medium">
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          vs previous {period}
        </p>
      </div>
    </div>
  );
};

const VendorAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getVendorAnalytics, getVendorCommissions, vendorProfile, isLoading } = useVendor();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const periods = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' }
  ];

  const categoryColors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (user && vendorProfile) {
      loadAnalytics();
    }
  }, [user, vendorProfile, selectedPeriod]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      const analyticsData = await getVendorAnalytics(user.id, selectedPeriod);
      setAnalytics(analyticsData);

      // Generate sample sales data for charts
      generateSalesData();
      generateCategoryData(analyticsData);
      generatePerformanceData();
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateSalesData = () => {
    const data = [];
    const now = new Date();
    const dataPoints = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : selectedPeriod === 'quarter' ? 90 : 365;

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 50) + 5,
        commission: Math.floor(Math.random() * 7500) + 1500
      });
    }

    setSalesData(data);
  };

  const generateCategoryData = (analyticsData: VendorAnalytics) => {
    const categories = [
      { name: 'Fruits & Vegetables', value: 35, color: '#10B981' },
      { name: 'Grains & Cereals', value: 25, color: '#3B82F6' },
      { name: 'Dairy Products', value: 20, color: '#F59E0B' },
      { name: 'Organic Products', value: 12, color: '#EF4444' },
      { name: 'Others', value: 8, color: '#8B5CF6' }
    ];

    setCategoryData(categories);
  };

  const generatePerformanceData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map(month => ({
      month,
      sales: Math.floor(Math.random() * 100000) + 50000,
      orders: Math.floor(Math.random() * 200) + 100,
      customers: Math.floor(Math.random() * 150) + 75,
      rating: (Math.random() * 2 + 3).toFixed(1)
    }));

    setPerformanceData(data);
  };

  const refreshData = async () => {
    await loadAnalytics();
  };

  const exportData = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  if (!vendorProfile) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Vendor Profile Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to complete your vendor profile to access analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your business performance and insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={`₦${analytics?.total_sales.toLocaleString() || '0'}`}
          change={12.5}
          changeType="positive"
          icon={<DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />}
          period={selectedPeriod}
        />
        <MetricCard
          title="Total Orders"
          value={analytics?.total_orders.toString() || '0'}
          change={8.2}
          changeType="positive"
          icon={<ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-400" />}
          period={selectedPeriod}
        />
        <MetricCard
          title="Commission Earned"
          value={`₦${analytics?.total_commission.toLocaleString() || '0'}`}
          change={15.3}
          changeType="positive"
          icon={<TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />}
          period={selectedPeriod}
        />
        <MetricCard
          title="Avg. Order Value"
          value={`₦${analytics?.average_order_value.toLocaleString() || '0'}`}
          change={-2.1}
          changeType="negative"
          icon={<BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />}
          period={selectedPeriod}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Trend</h3>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sales</span>
              <span className="w-3 h-3 bg-blue-500 rounded-full ml-4"></span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Commission</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
              <XAxis
                dataKey="date"
                className="dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis className="dark:text-gray-400" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-bg-opacity)',
                  border: '1px solid var(--tw-border-opacity)',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="commission"
                stackId="2"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                dataKey="value"
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{category.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance Overview</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
            <XAxis dataKey="month" className="dark:text-gray-400" />
            <YAxis className="dark:text-gray-400" />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#10B981" name="Sales (₦)" />
            <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
            <Bar dataKey="customers" fill="#F59E0B" name="Customers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Insights */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Insights</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">New Customers</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">45</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Returning Customers</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">123</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Customer Retention</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">73%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</span>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">4.7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Performance</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Products</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {vendorProfile.total_products}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Best Seller</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Fresh Tomatoes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">2,847</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Commission Rate</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {(vendorProfile.commission_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Earned</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                ₦{vendorProfile.total_commission.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">₦15,750</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Next Payout</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Mar 15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalyticsDashboard;