import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, 
  Download,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Users,
  Package
} from 'lucide-react';

interface ReportData {
  salesByProduct: Array<{
    product_name: string;
    total_sales: number;
    quantity_sold: number;
  }>;
  salesByMonth: Array<{
    month: string;
    total_sales: number;
  }>;
  topCustomers: Array<{
    customer_id: string;
    customer_name: string;
    email: string;
    total_spent: number;
    orders_count: number;
  }>;
  orderStatus: Array<{
    status: string;
    count: number;
  }>;
  inventoryStatus: Array<{
    product_name: string;
    stock: number;
    min_stock: number;
  }>;
}

const defaultReportData: ReportData = {
  salesByProduct: [],
  salesByMonth: [],
  topCustomers: [],
  orderStatus: [],
  inventoryStatus: []
};

// Component for time range selector with improved UI
interface TimeRangeSelectorProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ timeRange, setTimeRange }) => (
  <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
    {[
      { value: '7days', label: '7 Days' },
      { value: '30days', label: '30 Days' },
      { value: '90days', label: '90 Days' },
      { value: 'year', label: 'This Year' },
    ].map(({ value, label }) => (
      <button
        key={value}
        onClick={() => setTimeRange(value)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          timeRange === value
            ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

// Component for report tabs with improved UI
interface ReportTabsProps {
  activeReport: string;
  setActiveReport: (report: string) => void;
}

const ReportTabs: React.FC<ReportTabsProps> = ({ activeReport, setActiveReport }) => (
  <div className="border-b border-gray-200 dark:border-gray-700">
    <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Report Sections">
      {[
        { id: 'sales', label: 'Sales Analytics', icon: <DollarSign className="h-4 w-4" /> },
        { id: 'customers', label: 'Customer Insights', icon: <Users className="h-4 w-4" /> },
        { id: 'inventory', label: 'Inventory Status', icon: <Package className="h-4 w-4" /> },
      ].map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setActiveReport(id)}
          className={`inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeReport === id
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <span className="inline-flex items-center">
            {icon}
            <span className="ml-2">{label}</span>
          </span>
        </button>
      ))}
    </nav>
  </div>
);

// Component for stats cards with improved UI
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: number;
  bgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, trend, bgColor, iconColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${bgColor} ${iconColor} mr-4 flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <div className="flex items-baseline">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h3>
          {trend && (
            <span className={`ml-2 text-xs font-medium ${
              trend > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const FarmReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>(defaultReportData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [activeReport, setActiveReport] = useState('sales');
  const [salesTotal, setSalesTotal] = useState(0);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [customersTotal, setCustomersTotal] = useState(0);
  
  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error("No authenticated user found");
      const user = JSON.parse(storedUser);

      // Set date range based on selected time range
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (timeRange === '90days') {
        startDate.setDate(now.getDate() - 90);
      } else if (timeRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (timeRange === 'all') {
        startDate = new Date(0); // Beginning of time
      }

      // Get all products for this farm
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, quantity, min_quantity')
        .eq('owner_id', user.id);

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setIsLoading(false);
        return;
      }

      const farmProductIds = productsData.map(product => product.id);
      
      // Get orders with farm products
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total_amount,
          user_id,
          user:user_id(id, email, first_name, last_name),
          order_items!inner(id, quantity, product_id, price, product:product_id(name))
        `)
        .in('order_items.product_id', farmProductIds)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Process data for reports
      const newReportData: ReportData = {
        salesByProduct: [],
        salesByMonth: [],
        topCustomers: [],
        orderStatus: [],
        inventoryStatus: []
      };

      // Process inventory status
      newReportData.inventoryStatus = productsData.map(product => ({
        product_name: product.name,
        stock: product.quantity || 0,
        min_stock: product.min_quantity || 0
      }));

      let totalSales = 0;
      let totalOrders = new Set();
      let customerMap = new Map();

      // Process order data
      if (ordersData && ordersData.length > 0) {
        // Track sales by product
        const productSalesMap = new Map();
        
        ordersData.forEach(order => {
          totalSales += order.total_amount || 0;
          totalOrders.add(order.id);
          
          // Track customer data
          if (order.user) {
            // Ensure we're accessing a single user object, not an array
            const userData = Array.isArray(order.user) ? order.user[0] : order.user;
            if (!userData) return;
            
            const customerId = userData.id;
            const customerName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Unnamed Customer';
            
            if (customerMap.has(customerId)) {
              const customer = customerMap.get(customerId);
              customer.total_spent += order.total_amount || 0;
              customer.orders_count += 1;
            } else {
              customerMap.set(customerId, {
                customer_id: customerId,
                customer_name: customerName,
                email: userData.email,
                total_spent: order.total_amount || 0,
                orders_count: 1
              });
            }
          }
          
          // Process order items for product sales
          order.order_items.forEach(item => {
            const productId = item.product_id;
            // Handle product data properly
            const productData = item.product && (Array.isArray(item.product) ? item.product[0] : item.product);
            const productName = productData?.name || 'Unknown Product';
            const itemTotal = item.price * item.quantity;
            
            if (productSalesMap.has(productId)) {
              const product = productSalesMap.get(productId);
              product.total_sales += itemTotal;
              product.quantity_sold += item.quantity;
            } else {
              productSalesMap.set(productId, {
                product_name: productName,
                total_sales: itemTotal,
                quantity_sold: item.quantity
              });
            }
          });
          
          // Track order status
          const status = order.status || 'Unknown';
          const statusIndex = newReportData.orderStatus.findIndex(s => s.status === status);
          if (statusIndex >= 0) {
            newReportData.orderStatus[statusIndex].count += 1;
          } else {
            newReportData.orderStatus.push({
              status,
              count: 1
            });
          }
          
          // Track sales by month
          const orderDate = new Date(order.created_at);
          const monthYear = `${orderDate.toLocaleString('default', { month: 'short' })} ${orderDate.getFullYear()}`;
          
          const monthIndex = newReportData.salesByMonth.findIndex(m => m.month === monthYear);
          if (monthIndex >= 0) {
            newReportData.salesByMonth[monthIndex].total_sales += order.total_amount || 0;
          } else {
            newReportData.salesByMonth.push({
              month: monthYear,
              total_sales: order.total_amount || 0
            });
          }
        });
        
        // Sort sales by month chronologically
        newReportData.salesByMonth.sort((a, b) => {
          const [aMonth, aYear] = a.month.split(' ');
          const [bMonth, bYear] = b.month.split(' ');
          
          const aDate = new Date(`${aMonth} 1, ${aYear}`);
          const bDate = new Date(`${bMonth} 1, ${bYear}`);
          
          return aDate.getTime() - bDate.getTime();
        });
        
        // Convert maps to arrays and sort
        newReportData.salesByProduct = Array.from(productSalesMap.values())
          .sort((a, b) => b.total_sales - a.total_sales);
          
        newReportData.topCustomers = Array.from(customerMap.values())
          .sort((a, b) => b.total_spent - a.total_spent)
          .slice(0, 10); // Top 10 customers
      }

      // Update state with report data
      setReportData(newReportData);
      setSalesTotal(totalSales);
      setOrdersTotal(totalOrders.size);
      setCustomersTotal(customerMap.size);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Function to export current report data as CSV
  const exportReportData = () => {
    let csvContent = '';
    let fileName = '';
    
    if (activeReport === 'sales') {
      // Export sales by product
      csvContent = 'Product Name,Total Sales,Quantity Sold\n';
      reportData.salesByProduct.forEach(item => {
        csvContent += `"${item.product_name}",${item.total_sales},${item.quantity_sold}\n`;
      });
      fileName = 'sales_by_product_report.csv';
    } else if (activeReport === 'customers') {
      // Export customers
      csvContent = 'Customer Name,Email,Total Spent,Orders Count\n';
      reportData.topCustomers.forEach(customer => {
        csvContent += `"${customer.customer_name}","${customer.email}",${customer.total_spent},${customer.orders_count}\n`;
      });
      fileName = 'top_customers_report.csv';
    } else if (activeReport === 'inventory') {
      // Export inventory
      csvContent = 'Product Name,Current Stock,Minimum Stock Level\n';
      reportData.inventoryStatus.forEach(item => {
        csvContent += `"${item.product_name}",${item.stock},${item.min_stock}\n`;
      });
      fileName = 'inventory_status_report.csv';
    }
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading report data...</span>
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
      {/* Header with improved design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reports & Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400">View detailed insights about your farm's performance.</p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-end">
            <TimeRangeSelector timeRange={timeRange} setTimeRange={setTimeRange} />
            
            <button 
              onClick={fetchReportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            
            <button 
              onClick={exportReportData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats Row with improved cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={<DollarSign className="h-6 w-6" />}
          title="Total Sales"
          value={formatCurrency(salesTotal)}
          trend={5.3} // Example trend data
          bgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
        />
        
        <StatCard 
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Total Orders"
          value={ordersTotal}
          trend={2.8} // Example trend data
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        
        <StatCard 
          icon={<Users className="h-6 w-6" />}
          title="Total Customers"
          value={customersTotal}
          trend={7.1} // Example trend data
          bgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>
      
      {/* Report Tabs with improved navigation */}
      <ReportTabs activeReport={activeReport} setActiveReport={setActiveReport} />
      
      {/* Report Content with improved layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {activeReport === 'sales' && (
          <div className="p-6 space-y-6">
            {/* Sales Over Time with improved chart */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sales Over Time</h3>
              {reportData.salesByMonth.length > 0 ? (
                <div className="h-72 flex items-end space-x-2">
                  {reportData.salesByMonth.map((item, index) => {
                    const maxSales = Math.max(...reportData.salesByMonth.map(s => s.total_sales));
                    const height = (item.total_sales / maxSales) * 100;
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 group">
                        <div className="relative w-full flex justify-center">
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 text-xs py-1 px-2 rounded pointer-events-none">
                            {formatCurrency(item.total_sales)}
                          </div>
                        </div>
                        <div 
                          className={`w-full bg-gradient-to-t from-green-500 to-green-400 dark:from-green-600 dark:to-green-500 rounded-t group-hover:from-green-600 group-hover:to-green-500 dark:group-hover:from-green-500 dark:group-hover:to-green-400 transition-colors h-[${height}%] min-h-[4px]`}
                        ></div>
                        <div className="text-xs mt-2 text-gray-600 dark:text-gray-400 text-center">
                          {item.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <BarChart className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No sales data available for the selected period.</p>
                </div>
              )}
            </div>
          
            {/* Sales by Product Table with improved design */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sales by Product</h3>
              {reportData.salesByProduct.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Quantity Sold
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Sales
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.salesByProduct.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {product.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {product.quantity_sold}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatCurrency(product.total_sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No product sales data available for the selected period.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeReport === 'customers' && (
          <div className="p-6 space-y-6">
            {/* Top Customers Table with improved design */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Customers</h3>
              {reportData.topCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Orders
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Spent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.topCustomers.map((customer, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  {customer.customer_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {customer.customer_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {customer.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {customer.orders_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatCurrency(customer.total_spent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No customer data available for the selected period.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeReport === 'inventory' && (
          <div className="p-6 space-y-6">
            {/* Inventory Status Table with improved design */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Inventory Status</h3>
              {reportData.inventoryStatus.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Min Stock Level
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.inventoryStatus.map((item, index) => {
                        const stockStatus = item.stock <= item.min_stock
                          ? 'low'
                          : item.stock <= item.min_stock * 1.5
                            ? 'medium'
                            : 'good';
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {item.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {item.stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {item.min_stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                stockStatus === 'low'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : stockStatus === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                                {stockStatus === 'low'
                                  ? 'Low Stock'
                                  : stockStatus === 'medium'
                                    ? 'Medium Stock'
                                    : 'In Stock'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No inventory data available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmReportsPage; 