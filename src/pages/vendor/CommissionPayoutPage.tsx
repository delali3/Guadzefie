// src/pages/vendor/CommissionPayoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useVendor } from '../../contexts/VendorContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Eye,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react';
import { Commission, Payout } from '../../types/vendor';

interface CommissionFilters {
  status?: Commission['status'];
  dateFrom?: string;
  dateTo?: string;
  productId?: number;
}

const CommissionPayoutPage: React.FC = () => {
  const { user } = useAuth();
  const {
    commissions,
    payouts,
    getVendorCommissions,
    getVendorPayouts,
    vendorProfile,
    isLoading
  } = useVendor();

  const [activeTab, setActiveTab] = useState<'commissions' | 'payouts'>('commissions');
  const [filters, setFilters] = useState<CommissionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'commissions', label: 'Commissions', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'payouts', label: 'Payouts', icon: <Banknote className="w-4 h-4" /> }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'calculated', label: 'Calculated' },
    { value: 'paid', label: 'Paid' },
    { value: 'disputed', label: 'Disputed' }
  ];

  useEffect(() => {
    if (user && vendorProfile) {
      loadData();
    }
  }, [user, vendorProfile, filters]);

  const loadData = async () => {
    if (!user) return;

    try {
      await getVendorCommissions(user.id, filters);
      await getVendorPayouts(user.id);
    } catch (error) {
      console.error('Error loading commission/payout data:', error);
    }
  };

  const handleFilterChange = (key: keyof CommissionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = searchTerm === '' ||
      commission.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalEarnings = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'calculated');
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      calculated: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
      paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      disputed: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertTriangle },
      processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleCommissionSelect = (commissionId: string) => {
    setSelectedCommissions(prev =>
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const handleSelectAll = () => {
    const calculatedCommissions = filteredCommissions
      .filter(c => c.status === 'calculated')
      .map(c => c.id);

    if (selectedCommissions.length === calculatedCommissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(calculatedCommissions);
    }
  };

  const selectedCommissionAmount = selectedCommissions.reduce((sum, id) => {
    const commission = commissions.find(c => c.id === id);
    return sum + (commission?.commission_amount || 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Commission & Payouts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your earnings and payout history
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₦{totalEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₦{pendingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Receipt className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₦{Math.floor(totalEarnings * 0.3).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Commission Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {((vendorProfile?.commission_rate || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value as Commission['status'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'commissions' | 'payouts')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search commissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {selectedCommissions.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCommissions.length} selected (₦{selectedCommissionAmount.toLocaleString()})
                </span>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Request Payout
                </button>
              </div>
            )}
          </div>

          {/* Commissions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading commissions...</p>
              </div>
            ) : filteredCommissions.length === 0 ? (
              <div className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No commissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedCommissions.length === pendingCommissions.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sale Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={() => handleCommissionSelect(commission.id)}
                            disabled={commission.status !== 'calculated'}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{commission.order_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          ₦{commission.sale_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          ₦{commission.commission_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {(commission.commission_rate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(commission.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Payouts Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {payouts.length === 0 ? (
              <div className="p-6 text-center">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No payouts yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Payouts are processed monthly on the 15th
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Payout ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Commission Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {payout.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          ₦{payout.net_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payout.commission_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                          {payout.payment_method.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payout.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionPayoutPage;