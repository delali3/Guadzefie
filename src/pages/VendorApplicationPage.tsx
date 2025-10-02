// src/pages/VendorApplicationPage.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  CreditCard,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ApplicationFormData {
  business_name: string;
  business_type: 'farm' | 'manufacturer' | 'distributor' | 'retailer';
  business_registration_number: string;
  tax_id: string;
  business_email: string;
  business_phone: string;
  business_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  business_description: string;
  years_in_business: number;
  website_url: string;
  social_media_links: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  product_categories: string[];
  estimated_monthly_sales: number;
  bank_account_info: {
    bank_name: string;
    account_number: string;
    routing_number: string;
    account_holder_name: string;
  };
}

const VendorApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [formData, setFormData] = useState<ApplicationFormData>({
    business_name: '',
    business_type: 'farm',
    business_registration_number: '',
    tax_id: '',
    business_email: '',
    business_phone: '',
    business_address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Nigeria'
    },
    business_description: '',
    years_in_business: 0,
    website_url: '',
    social_media_links: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    product_categories: [],
    estimated_monthly_sales: 0,
    bank_account_info: {
      bank_name: '',
      account_number: '',
      routing_number: '',
      account_holder_name: ''
    }
  });

  const steps = [
    { number: 1, title: 'Business Information', icon: <Building2 className="w-5 h-5" /> },
    { number: 2, title: 'Business Details', icon: <FileText className="w-5 h-5" /> },
    { number: 3, title: 'Payment Information', icon: <CreditCard className="w-5 h-5" /> },
    { number: 4, title: 'Documents & Verification', icon: <Shield className="w-5 h-5" /> }
  ];

  const businessTypes = [
    { value: 'farm', label: 'Farm/Agriculture', description: 'Produce fresh agricultural products' },
    { value: 'manufacturer', label: 'Manufacturer', description: 'Create and produce goods' },
    { value: 'distributor', label: 'Distributor', description: 'Wholesale and distribution' },
    { value: 'retailer', label: 'Retailer', description: 'Retail products to consumers' }
  ];

  const categoryOptions = [
    'Fruits & Vegetables', 'Grains & Cereals', 'Dairy Products', 'Meat & Poultry',
    'Seafood', 'Herbs & Spices', 'Organic Products', 'Processed Foods',
    'Beverages', 'Health & Wellness', 'Home & Garden', 'Electronics',
    'Clothing & Fashion', 'Handicrafts', 'Beauty & Personal Care'
  ];

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = (fileType: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.business_name && formData.business_type && formData.business_email && formData.business_phone);
      case 2:
        return !!(formData.business_description && formData.years_in_business > 0 && formData.product_categories.length > 0);
      case 3:
        return !!(formData.bank_account_info.bank_name && formData.bank_account_info.account_number && formData.bank_account_info.account_holder_name);
      case 4:
        return uploadedFiles.business_license !== undefined;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Please fill in all required fields before continuing.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitApplication = async () => {
    if (!user) {
      toast.error('You must be logged in to submit an application.');
      return;
    }

    if (!validateStep(4)) {
      toast.error('Please complete all required fields and upload required documents.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents first
      const documentUrls: Record<string, string> = {};

      for (const [type, file] of Object.entries(uploadedFiles)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vendor-documents')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${type}: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('vendor-documents')
          .getPublicUrl(uploadData.path);

        documentUrls[type] = urlData.publicUrl;
      }

      // Submit application
      const { error: applicationError } = await supabase
        .from('vendor_applications')
        .insert({
          user_id: user.id,
          ...formData,
          documents: documentUrls,
          status: 'pending'
        });

      if (applicationError) {
        throw applicationError;
      }

      toast.success('Application submitted successfully! We will review your application and get back to you within 3-5 business days.');
      navigate('/vendor/application-status');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => updateFormData('business_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.business_type === type.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                    }`}
                    onClick={() => updateFormData('business_type', type.value)}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">{type.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Email *
                </label>
                <input
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => updateFormData('business_email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Phone *
                </label>
                <input
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => updateFormData('business_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Address
              </label>
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.business_address.street}
                  onChange={(e) => updateFormData('business_address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.business_address.city}
                    onChange={(e) => updateFormData('business_address.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.business_address.state}
                    onChange={(e) => updateFormData('business_address.state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder="State"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Description *
              </label>
              <textarea
                value={formData.business_description}
                onChange={(e) => updateFormData('business_description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describe your business, products, and services..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Years in Business *
                </label>
                <input
                  type="number"
                  value={formData.years_in_business}
                  onChange={(e) => updateFormData('years_in_business', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Monthly Sales (₦)
                </label>
                <input
                  type="number"
                  value={formData.estimated_monthly_sales}
                  onChange={(e) => updateFormData('estimated_monthly_sales', parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Categories * (Select at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryOptions.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.product_categories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('product_categories', [...formData.product_categories, category]);
                        } else {
                          updateFormData('product_categories', formData.product_categories.filter(c => c !== category));
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => updateFormData('website_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://www.yourbusiness.com"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your payment information is encrypted and secure. This will be used for commission payouts.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bank_account_info.bank_name}
                onChange={(e) => updateFormData('bank_account_info.bank_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter bank name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={formData.bank_account_info.account_holder_name}
                onChange={(e) => updateFormData('bank_account_info.account_holder_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Full name as on bank account"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.bank_account_info.account_number}
                  onChange={(e) => updateFormData('bank_account_info.account_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Code / Routing Number
                </label>
                <input
                  type="text"
                  value={formData.bank_account_info.routing_number}
                  onChange={(e) => updateFormData('bank_account_info.routing_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Sort code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Registration Number
                </label>
                <input
                  type="text"
                  value={formData.business_registration_number}
                  onChange={(e) => updateFormData('business_registration_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="RC number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax ID / TIN
                </label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => updateFormData('tax_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tax identification number"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Upload the required documents to verify your business. All documents should be clear and legible.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'business_license', label: 'Business License *', required: true },
                { key: 'tax_certificate', label: 'Tax Certificate', required: false },
                { key: 'insurance_certificate', label: 'Insurance Certificate', required: false }
              ].map((doc) => (
                <div key={doc.key} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {doc.label}
                    </label>
                    {uploadedFiles[doc.key] && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={(el) => fileInputRefs.current[doc.key] = el}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(doc.key, file);
                      }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[doc.key]?.click()}
                      className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadedFiles[doc.key] ? 'Change File' : 'Upload File'}
                    </button>
                    {uploadedFiles[doc.key] && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {uploadedFiles[doc.key].name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Accepted formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Application Review Process</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Your application will be reviewed within 3-5 business days</li>
                <li>• We may contact you for additional information or clarification</li>
                <li>• Once approved, you'll receive your vendor dashboard access</li>
                <li>• Default commission rate is 15% (may vary based on category)</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Become a Vendor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join our marketplace and start selling your products to thousands of customers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Step {step.number}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= step.number
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    currentStep > step.number
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Step {currentStep} of {steps.length}
            </p>
          </div>

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 rounded-md ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentStep} of {steps.length}
            </div>

            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={submitApplication}
                disabled={isSubmitting}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorApplicationPage;