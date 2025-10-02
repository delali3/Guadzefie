import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Save,
  AlertCircle,
  CreditCard,
  Truck,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Image,
  Instagram,
  Facebook,
  Twitter
} from 'lucide-react';

interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_region: string;
  store_country: string;
  store_postal_code: string;
  store_currency: string;
  store_logo_url: string;
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
}

interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
  api_key?: string;
  api_secret?: string;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: '',
    store_email: '',
    store_phone: '',
    store_address: '',
    store_city: '',
    store_region: '',
    store_country: '',
    store_postal_code: '',
    store_currency: 'GHS',
    store_logo_url: '',
    social_instagram: '',
    social_facebook: '',
    social_twitter: ''
  });
  
  // Shipping methods
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([
    { id: 1, name: 'Standard Shipping', description: '3-5 business days', price: 20, is_active: true },
    { id: 2, name: 'Express Shipping', description: '1-2 business days', price: 50, is_active: true },
    { id: 3, name: 'Free Pickup', description: 'Pick up at our store', price: 0, is_active: true }
  ]);
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 1, name: 'Mobile Money', is_active: true },
    { id: 2, name: 'Cash on Delivery', is_active: true },
    { id: 3, name: 'Credit Card', is_active: false, api_key: '', api_secret: '' }
  ]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch store settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (settingsError) {
        if (settingsError.code === 'PGRST116') {
          // No settings found, create a default record
          console.log('No settings found, creating default settings');
          
          const defaultSettings = {
            store_name: 'My Store',
            store_email: '',
            store_phone: '',
            store_address: '',
            store_city: '',
            store_region: '',
            store_country: 'Ghana',
            store_postal_code: '',
            store_currency: 'GHS',
            store_logo_url: '',
            social_instagram: '',
            social_facebook: '',
            social_twitter: ''
          };
          
          // Create default settings record
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert(defaultSettings)
            .select()
            .single();
            
          if (insertError) {
            throw insertError;
          }
          
          if (newSettings) {
            setStoreSettings(newSettings);
          } else {
            setStoreSettings(defaultSettings);
          }
        } else {
          throw settingsError;
        }
      } else if (settingsData) {
        setStoreSettings(settingsData);
      }

      // Fetch shipping methods
      const { data: shippingData, error: shippingError } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('id');

      if (shippingError) throw shippingError;
      if (shippingData && shippingData.length > 0) {
        setShippingMethods(shippingData);
      }

      // Fetch payment methods from admin_payment_methods table
      const { data: paymentData, error: paymentError } = await supabase
        .from('admin_payment_methods')
        .select('*')
        .order('id');

      if (paymentError) throw paymentError;
      if (paymentData && paymentData.length > 0) {
        setPaymentMethods(paymentData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShippingMethodChange = (id: number, field: keyof ShippingMethod, value: any) => {
    setShippingMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    );
  };

  const handlePaymentMethodChange = (id: number, field: keyof PaymentMethod, value: any) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    );
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Save store settings
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert(storeSettings, { onConflict: 'id' });

      if (settingsError) throw settingsError;

      // Save shipping methods
      for (const method of shippingMethods) {
        const { error: shippingError } = await supabase
          .from('shipping_methods')
          .upsert(method, { onConflict: 'id' });

        if (shippingError) throw shippingError;
      }

      // Save payment methods to admin_payment_methods table
      for (const method of paymentMethods) {
        const { error: paymentError } = await supabase
          .from('admin_payment_methods')
          .upsert(method, { onConflict: 'id' });

        if (paymentError) throw paymentError;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your store settings and configurations</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-md">
          Settings saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('store')}
            className={`${
              activeTab === 'store'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Store className="h-5 w-5 mr-2" />
            Store Settings
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`${
              activeTab === 'account'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <User className="h-5 w-5 mr-2" />
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`${
              activeTab === 'payment'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`${
              activeTab === 'shipping'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Truck className="h-5 w-5 mr-2" />
            Shipping Options
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="py-6">
        {/* Store Settings */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Store Information</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Store Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="store_name"
                    id="store_name"
                    value={storeSettings.store_name}
                    onChange={handleStoreSettingsChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="store_currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency
                </label>
                <div className="mt-1">
                  <select
                    name="store_currency"
                    id="store_currency"
                    value={storeSettings.store_currency}
                    onChange={handleStoreSettingsChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="GHS">GHS - Ghanaian Cedi</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="store_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    name="store_email"
                    id="store_email"
                    value={storeSettings.store_email}
                    onChange={handleStoreSettingsChange}
                    className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="store_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    name="store_phone"
                    id="store_phone"
                    value={storeSettings.store_phone}
                    onChange={handleStoreSettingsChange}
                    className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="store_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Store Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  name="store_address"
                  id="store_address"
                  value={storeSettings.store_address}
                  onChange={handleStoreSettingsChange}
                  className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="store_city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </label>
                <input
                  type="text"
                  name="store_city"
                  id="store_city"
                  value={storeSettings.store_city}
                  onChange={handleStoreSettingsChange}
                  className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="store_region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Region
                </label>
                <input
                  type="text"
                  name="store_region"
                  id="store_region"
                  value={storeSettings.store_region}
                  onChange={handleStoreSettingsChange}
                  className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="store_postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="store_postal_code"
                  id="store_postal_code"
                  value={storeSettings.store_postal_code}
                  onChange={handleStoreSettingsChange}
                  className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="store_country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Globe className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  name="store_country"
                  id="store_country"
                  value={storeSettings.store_country}
                  onChange={handleStoreSettingsChange}
                  className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ghana"
                />
              </div>
            </div>

            <div>
              <label htmlFor="store_logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Store Logo URL
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Image className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  name="store_logo_url"
                  id="store_logo_url"
                  value={storeSettings.store_logo_url}
                  onChange={handleStoreSettingsChange}
                  className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <h2 className="text-lg font-medium text-gray-900 dark:text-white pt-4">Social Media</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="social_instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Instagram
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Instagram className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="social_instagram"
                    id="social_instagram"
                    value={storeSettings.social_instagram}
                    onChange={handleStoreSettingsChange}
                    className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="@yourusername"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="social_facebook" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Facebook
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Facebook className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="social_facebook"
                    id="social_facebook"
                    value={storeSettings.social_facebook}
                    onChange={handleStoreSettingsChange}
                    className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="facebook.com/yourpage"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="social_twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Twitter
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Twitter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="social_twitter"
                    id="social_twitter"
                    value={storeSettings.social_twitter}
                    onChange={handleStoreSettingsChange}
                    className="pl-12 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="@yourusername"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Settings</h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-300">
                Account settings are managed through your Supabase Auth settings. Please contact your administrator.
              </p>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payment Methods</h2>
            
            <div className="mt-4 space-y-6">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                      {method.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="mr-3 text-sm text-gray-500 dark:text-gray-400">Active</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={method.is_active}
                          onChange={(e) => handlePaymentMethodChange(method.id, 'is_active', e.target.checked)}
                          className="sr-only peer"
                          aria-label={`Toggle ${method.name} payment method`}
                          title={`Toggle ${method.name} payment method`}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  {method.name === 'Credit Card' && method.is_active && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`api_key_${method.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Key
                        </label>
                        <input
                          type="password"
                          id={`api_key_${method.id}`}
                          value={method.api_key || ''}
                          onChange={(e) => handlePaymentMethodChange(method.id, 'api_key', e.target.value)}
                          className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={`api_secret_${method.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Secret
                        </label>
                        <input
                          type="password"
                          id={`api_secret_${method.id}`}
                          value={method.api_secret || ''}
                          onChange={(e) => handlePaymentMethodChange(method.id, 'api_secret', e.target.value)}
                          className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping Options */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Shipping Options</h2>
            
            <div className="mt-4 space-y-6">
              {shippingMethods.map((method) => (
                <div key={method.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                      <Truck className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                      {method.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="mr-3 text-sm text-gray-500 dark:text-gray-400">Active</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={method.is_active}
                          onChange={(e) => handleShippingMethodChange(method.id, 'is_active', e.target.checked)}
                          className="sr-only peer"
                          aria-label={`Toggle ${method.name} shipping method`}
                          title={`Toggle ${method.name} shipping method`}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`name_${method.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        id={`name_${method.id}`}
                        value={method.name}
                        onChange={(e) => handleShippingMethodChange(method.id, 'name', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`description_${method.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <input
                        type="text"
                        id={`description_${method.id}`}
                        value={method.description}
                        onChange={(e) => handleShippingMethodChange(method.id, 'description', e.target.value)}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`price_${method.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Price (GHS)
                      </label>
                      <input
                        type="number"
                        id={`price_${method.id}`}
                        value={method.price}
                        onChange={(e) => handleShippingMethodChange(method.id, 'price', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center justify-center hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 