// src/pages/admin/VendorPerformancePage.tsx
import React, { useState, useEffect } from 'react';
import { useVendor } from '../../contexts/VendorContext';
import {
  TrendingUp,
  TrendingDown,
  Star,
  DollarSign,
  Package,
  Users,
  Award,
  AlertTriangle,
  Eye,
  Filter,
  Download,
  BarChart3,
  Target,
  Clock,
  CheckCircle
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { VendorProfile, VendorPerformanceMetrics } from '../../types/vendor';

interface VendorWithMetrics extends VendorProfile {
  metrics: VendorPerformanceMetrics;
}

const VendorPerformancePage: React.FC = () => {
  const { applications, isLoading } = useVendor();

  const [vendors, setVendors] = useState<VendorWithMetrics[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'performance' | 'sales' | 'rating' | 'commission'>('performance');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [showTopPerformers, setShowTopPerformers] = useState(true);

  const periods = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 3 Months' },
    { value: 'year', label: 'Last 12 Months' }
  ];

  const sortOptions = [
    { value: 'performance', label: 'Overall Performance' },
    { value: 'sales', label: 'Sales Volume' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'commission', label: 'Commission Generated' }
  ];

  useEffect(() => {
    generateMockVendorData();
  }, [applications, selectedPeriod]);

  const generateMockVendorData = () => {
    // Generate mock vendor performance data
    const mockVendors: VendorWithMetrics[] = [
      {
        id: '1',
        user_id: 'user1',
        application_id: 'app1',
        business_name: 'Green Valley Farms',
        business_type: 'farm',
        status: 'active',
        commission_rate: 0.15,
        total_sales: 2500000,
        total_commission: 375000,
        total_products: 45,
        rating: 4.8,
        performance_score: 92,
        joining_date: '2023-01-15',
        last_active: new Date().toISOString(),
        settings: {
          auto_approve_products: true,
          notification_preferences: {
            new_orders: true,
            low_stock: true,
            commission_updates: true,
            performance_reports: true
          }
        },
        created_at: '2023-01-15',
        updated_at: new Date().toISOString(),
        metrics: {
          vendor_id: 'user1',
          overall_score: 92,
          sales_performance: 95,
          customer_satisfaction: 89,
          product_quality: 94,
          shipping_performance: 88,
          communication_score: 91,
          compliance_score: 97,
          last_updated: new Date().toISOString()
        }
      },
      {
        id: '2',
        user_id: 'user2',
        application_id: 'app2',
        business_name: 'Sunrise Organic',
        business_type: 'farm',
        status: 'active',
        commission_rate: 0.12,
        total_sales: 1800000,
        total_commission: 216000,
        total_products: 32,
        rating: 4.6,
        performance_score: 85,
        joining_date: '2023-03-20',
        last_active: new Date().toISOString(),
        settings: {
          auto_approve_products: false,
          notification_preferences: {
            new_orders: true,
            low_stock: true,
            commission_updates: true,
            performance_reports: false
          }
        },
        created_at: '2023-03-20',
        updated_at: new Date().toISOString(),
        metrics: {
          vendor_id: 'user2',
          overall_score: 85,
          sales_performance: 82,
          customer_satisfaction: 86,
          product_quality: 88,
          shipping_performance: 84,
          communication_score: 87,
          compliance_score: 89,
          last_updated: new Date().toISOString()
        }
      },
      {
        id: '3',
        user_id: 'user3',
        application_id: 'app3',
        business_name: 'Fresh Harvest Co.',
        business_type: 'distributor',
        status: 'active',
        commission_rate: 0.18,
        total_sales: 3200000,
        total_commission: 576000,
        total_products: 67,
        rating: 4.4,
        performance_score: 78,
        joining_date: '2022-11-10',
        last_active: new Date().toISOString(),
        settings: {
          auto_approve_products: true,
          notification_preferences: {
            new_orders: true,
            low_stock: false,
            commission_updates: true,
            performance_reports: true
          }
        },
        created_at: '2022-11-10',
        updated_at: new Date().toISOString(),
        metrics: {
          vendor_id: 'user3',
          overall_score: 78,
          sales_performance: 88,
          customer_satisfaction: 76,
          product_quality: 74,
          shipping_performance: 82,
          communication_score: 71,
          compliance_score: 85,
          last_updated: new Date().toISOString()
        }
      }
    ];

    // Sort vendors based on selected criteria
    const sortedVendors = [...mockVendors].sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.performance_score - a.performance_score;
        case 'sales':
          return b.total_sales - a.total_sales;
        case 'rating':
          return b.rating - a.rating;
        case 'commission':
          return b.total_commission - a.total_commission;
        default:
          return b.performance_score - a.performance_score;
      }
    });

    setVendors(sortedVendors);
  };

  const filteredVendors = vendors.filter(vendor => {
    if (filterStatus === 'all') return true;
    return vendor.status === filterStatus;
  });

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (score >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    if (score >= 70) return { label: 'Average', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  };

  const topPerformers = filteredVendors.slice(0, 5);
  const averagePerformance = filteredVendors.reduce((sum, v) => sum + v.performance_score, 0) / filteredVendors.length;

  // Chart data
  const performanceChartData = filteredVendors.map(vendor => ({
    name: vendor.business_name.slice(0, 15),
    performance: vendor.performance_score,
    sales: vendor.total_sales / 10000, // Scale down for chart
    commission: vendor.total_commission / 1000
  }));

  const metricsComparisonData = [
    { metric: 'Sales Performance', average: 88.3, top: 95, poor: 72 },
    { metric: 'Customer Satisfaction', average: 83.7, top: 89, poor: 68 },
    { metric: 'Product Quality', average: 85.3, top: 94, poor: 74 },
    { metric: 'Shipping Performance', average: 84.7, top: 88, poor: 76 },
    { metric: 'Communication', average: 83.0, top: 91, poor: 71 },
    { metric: 'Compliance', average: 90.3, top: 97, poor: 85 }
  ];

  const radarData = topPerformers[0] ? [
    { metric: 'Sales', score: topPerformers[0].metrics.sales_performance },
    { metric: 'Satisfaction', score: topPerformers[0].metrics.customer_satisfaction },
    { metric: 'Quality', score: topPerformers[0].metrics.product_quality },
    { metric: 'Shipping', score: topPerformers[0].metrics.shipping_performance },
    { metric: 'Communication', score: topPerformers[0].metrics.communication_score },
    { metric: 'Compliance', score: topPerformers[0].metrics.compliance_score }
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Performance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and analyze vendor performance metrics
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
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Performance</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {averagePerformance.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Performers</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {filteredVendors.filter(v => v.performance_score >= 90).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Need Attention</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {filteredVendors.filter(v => v.performance_score < 70).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Rating</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(filteredVendors.reduce((sum, v) => sum + v.rating, 0) / filteredVendors.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Filter
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Vendors</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowTopPerformers(!showTopPerformers)}
              className={`px-4 py-2 rounded-md ${
                showTopPerformers
                  ? 'bg-green-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Show Top Performers
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
              <XAxis dataKey="name" className="dark:text-gray-400" tick={{ fontSize: 12 }} />
              <YAxis className="dark:text-gray-400" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="performance" fill="#10B981" name="Performance Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performer Radar Chart */}
        {topPerformers[0] && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Top Performer: {topPerformers[0].business_name}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="dark:text-gray-400" />
                <PolarRadiusAxis angle={0} domain={[0, 100]} className="dark:text-gray-400" />
                <Radar
                  name="Performance"
                  dataKey="score"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Metrics Comparison */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Metrics Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={metricsComparisonData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
            <XAxis dataKey="metric" className="dark:text-gray-400" />
            <YAxis className="dark:text-gray-400" />
            <Tooltip />
            <Legend />
            <Bar dataKey="top" fill="#10B981" name="Top Performers" />
            <Bar dataKey="average" fill="#3B82F6" name="Average" />
            <Bar dataKey="poor" fill="#EF4444" name="Poor Performers" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vendor Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vendor Performance Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVendors.map((vendor, index) => {
                const badge = getPerformanceBadge(vendor.performance_score);
                return (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {vendor.business_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {vendor.business_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(vendor.performance_score)}`}>
                          {vendor.performance_score}
                        </div>
                        <div className="ml-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₦{vendor.total_sales.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {vendor.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      ₦{vendor.total_commission.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vendor.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : vendor.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorPerformancePage;