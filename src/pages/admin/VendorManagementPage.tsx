// src/pages/admin/VendorManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVendor } from '../../contexts/VendorContext';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Ban,
  MoreVertical,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  AlertTriangle
} from 'lucide-react';
import { VendorApplication, VendorProfile } from '../../types/vendor';
import toast from 'react-hot-toast';

interface VendorWithProfile extends VendorApplication {
  profile?: VendorProfile;
}

const VendorManagementPage: React.FC = () => {
  const {
    applications,
    getApplications,
    updateApplicationStatus,
    isLoading,
    error
  } = useVendor();

  const [selectedTab, setSelectedTab] = useState<'applications' | 'vendors'>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [vendors, setVendors] = useState<VendorWithProfile[]>([]);

  const tabs = [
    { id: 'applications', label: 'Applications', icon: <Clock className="w-4 h-4" /> },
    { id: 'vendors', label: 'Active Vendors', icon: <Users className="w-4 h-4" /> }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const businessTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'farm', label: 'Farm/Agriculture' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'retailer', label: 'Retailer' }
  ];

  useEffect(() => {
    loadApplications();
  }, [statusFilter, businessTypeFilter]);

  const loadApplications = async () => {
    try {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (businessTypeFilter !== 'all') filters.businessType = businessTypeFilter;

      await getApplications(filters);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: VendorApplication['status'], notes?: string) => {
    try {
      await updateApplicationStatus(applicationId, status, notes);
      toast.success(`Application ${status} successfully`);
      setShowApplicationModal(false);
      loadApplications();
    } catch (error) {
      toast.error(`Failed to ${status} application`);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' ||
      app.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.business_email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: Eye },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: Ban }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const ApplicationModal = ({ application }: { application: VendorApplication }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vendor Application Review
          </h3>
          <button
            onClick={() => setShowApplicationModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Business Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {application.business_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.business_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.business_email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.business_phone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.business_address.street}, {application.business_address.city}, {application.business_address.state}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.business_description}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Business Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Years in Business
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.years_in_business} years
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estimated Monthly Sales
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    ₦{application.estimated_monthly_sales.toLocaleString()}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Categories
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {application.product_categories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.bank_account_info.bank_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Holder
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {application.bank_account_info.account_holder_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Number
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    •••• •••• {application.bank_account_info.account_number.slice(-4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Application Status
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
                  {getStatusBadge(application.status)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Submitted: {new Date(application.created_at).toLocaleDateString()}</p>
                  {application.approved_at && (
                    <p>Approved: {new Date(application.approved_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {application.status === 'pending' && (
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleStatusUpdate(application.id, 'approved', 'Application meets all requirements')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(application.id, 'rejected', 'Application does not meet requirements')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(application.id, 'under_review', 'Application under review')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Mark Under Review
                  </button>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Documents
              </h4>
              <div className="space-y-2">
                {Object.entries(application.documents || {}).map(([type, url]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage vendor applications and active vendors
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Applications</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {applications.filter(app => app.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Vendors</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {applications.filter(app => app.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Commission</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">₦0</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">+0%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as 'applications' | 'vendors')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search by business name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={businessTypeFilter}
              onChange={(e) => setBusinessTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              {businessTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {selectedTab === 'applications' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading applications...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-6 text-center">
              <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.business_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {application.years_in_business} years in business
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize">
                          {application.business_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1 text-gray-400" />
                            {application.business_email}
                          </div>
                          <div className="flex items-center mt-1">
                            <Phone className="w-4 h-4 mr-1 text-gray-400" />
                            {application.business_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowApplicationModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
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
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedApplication && (
        <ApplicationModal application={selectedApplication} />
      )}
    </div>
  );
};

export default VendorManagementPage;