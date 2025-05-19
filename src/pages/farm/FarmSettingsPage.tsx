import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  // ChevronRight, 
  Settings, 
  Sun, 
  Moon, 
  Bell, 
  User, 
  Shield, 
  CheckCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Store,
  MapPin,
  Truck,
  ShoppingBag,
  Eye,
  Lock
} from 'lucide-react';

// Add global animation keyframes
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.bg-pattern-leaf {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0ZM49.3688 44.8312C48.9809 45.2191 48.3754 45.2191 47.9875 44.8312L44.8312 41.675C44.4433 41.2871 44.4433 40.6816 44.8312 40.2937C45.2191 39.9058 45.8246 39.9058 46.2125 40.2937L49.3688 43.45C49.7567 43.8379 49.7567 44.4433 49.3688 44.8312ZM15.0125 19.7062C14.6246 19.3183 14.0191 19.3183 13.6312 19.7062L10.475 22.8625C10.0871 23.2504 10.0871 23.8559 10.475 24.2438C10.8629 24.6317 11.4684 24.6317 11.8563 24.2438L15.0125 21.0875C15.4004 20.6996 15.4004 20.0941 15.0125 19.7062ZM15.1687 31.5C15.1687 31.5 20.625 40.9687 30 30C39.375 19.0312 44.8313 31.5 44.8313 31.5C44.8313 31.5 39.375 22.0312 30 33C20.625 43.9687 15.1687 31.5 15.1687 31.5Z' fill='%23ffffff'/%3E%3C/svg%3E");
}
`;

interface FarmerSettings {
  id: string;
  farm_display_name: string;
  farm_description: string;
  farmer_id: string;
  email_notifications: boolean;
  order_updates: boolean;
  marketing_emails: boolean;
  dark_mode_preference: 'system' | 'light' | 'dark';
  language_preference: string;
  privacy_setting: 'public' | 'private';
  two_factor_auth: boolean;
  // Farm-specific settings
  delivery_radius: number;
  minimum_order_amount: number;
  free_delivery_amount: number;
  order_auto_accept: boolean;
  tax_rate: number;
  organic_certification_visible: boolean;
  allow_pickups: boolean;
  product_visibility: 'public' | 'private' | 'selective';
}

interface FarmSettingsPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

const FarmSettingsPage: React.FC<FarmSettingsPageProps> = ({ darkMode = false, toggleDarkMode }) => {
  const [settings, setSettings] = useState<FarmerSettings>({
    id: '',
    farm_display_name: '',
    farm_description: '',
    farmer_id: '',
    email_notifications: true,
    order_updates: true,
    marketing_emails: false,
    dark_mode_preference: 'system',
    language_preference: 'en',
    privacy_setting: 'private',
    two_factor_auth: false,
    delivery_radius: 25,
    minimum_order_amount: 15,
    free_delivery_amount: 50,
    order_auto_accept: true,
    tax_rate: 0,
    organic_certification_visible: true,
    allow_pickups: true,
    product_visibility: 'public'
  });
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'notifications' | 'appearance' | 'privacy'>('profile');
  const [userProfile, setUserProfile] = useState<{
    full_name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detect current theme setting
  useEffect(() => {
    // First check localStorage for explicit preference
    const savedPreference = localStorage.getItem('darkMode');
    
    if (savedPreference === null) {
      // No explicit preference, must be using system
      setSettings(prev => ({
        ...prev,
        dark_mode_preference: 'system'
      }));
    } else {
      // Explicit preference set
      setSettings(prev => ({
        ...prev,
        dark_mode_preference: savedPreference === 'true' ? 'dark' : 'light'
      }));
    }
  }, []);

  useEffect(() => {
    const fetchFarmerSettings = async () => {
      setLoading(true);
      setErrorMessage(null);
      
      try {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error("You need to be logged in to view settings");
        }
        
        const user = JSON.parse(storedUser);
        if (!user || !user.id) {
          throw new Error("Invalid user session");
        }
        
        // Fetch user profile first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setUserProfile({
            full_name: profileData.full_name,
            phone: profileData.phone,
            address: profileData.address,
            city: profileData.city,
            state: profileData.state,
            postal_code: profileData.postal_code
          });
        }
        
        // Try to fetch farm settings 
        const { data: farmData, error: farmError } = await supabase
          .from('farm_settings')
          .select('*')
          .eq('farmer_id', user.id)
          .single();
          
        if (farmError && farmError.code !== 'PGRST116') {
          console.error("Error fetching farm settings:", farmError);
        }
        
        // Also fetch from user_settings for general settings
        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (userError && userError.code !== 'PGRST116') {
          console.error("Error fetching user settings:", userError);
        }
          
        // Combine farm and user settings
        setSettings(prev => ({
          ...prev,
          id: user.id,
          farmer_id: user.id,
          farm_display_name: farmData?.farm_name || '',
          farm_description: farmData?.farm_description || '',
          email_notifications: userData?.email_notifications ?? prev.email_notifications,
          order_updates: userData?.order_updates ?? prev.order_updates,
          marketing_emails: userData?.marketing_emails ?? prev.marketing_emails,
          dark_mode_preference: userData?.dark_mode_preference ?? prev.dark_mode_preference,
          language_preference: userData?.language_preference ?? prev.language_preference,
          privacy_setting: userData?.privacy_setting ?? prev.privacy_setting,
          two_factor_auth: userData?.two_factor_auth ?? prev.two_factor_auth,
          delivery_radius: farmData?.delivery_radius ?? prev.delivery_radius,
          minimum_order_amount: farmData?.minimum_order_amount ?? prev.minimum_order_amount,
          free_delivery_amount: farmData?.free_delivery_amount ?? prev.free_delivery_amount,
          order_auto_accept: farmData?.order_auto_accept ?? prev.order_auto_accept,
          tax_rate: farmData?.tax_rate ?? prev.tax_rate,
          organic_certification_visible: farmData?.show_certification ?? prev.organic_certification_visible,
          allow_pickups: farmData?.allow_pickups ?? prev.allow_pickups,
          product_visibility: farmData?.product_visibility ?? prev.product_visibility
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Error fetching settings:", error);
        setErrorMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerSettings();
  }, []);
  
  // Listen for system color scheme changes
  useEffect(() => {
    if (settings.dark_mode_preference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Define the handler to update the theme when system preference changes
      const handleChange = (e: MediaQueryListEvent) => {
        if (toggleDarkMode && e.matches !== darkMode) {
          toggleDarkMode();
        }
      };
      
      // Add the listener
      mediaQuery.addEventListener('change', handleChange);
      
      // Clean up
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [settings.dark_mode_preference, darkMode, toggleDarkMode]);

  const handleToggleSetting = (setting: keyof FarmerSettings) => {
    if (typeof settings[setting] === 'boolean') {
      setSettings({ ...settings, [setting]: !settings[setting as keyof FarmerSettings] });
    }
  };

  const handleChangeValue = (setting: keyof FarmerSettings, value: any) => {
    setSettings({ ...settings, [setting]: value });
    
    // If changing dark mode preference, apply it immediately
    if (setting === 'dark_mode_preference' && toggleDarkMode) {
      applyDarkModePreference(value);
    }
  };
  
  const applyDarkModePreference = (preference: 'system' | 'light' | 'dark') => {
    if (!toggleDarkMode) {
      console.warn("toggleDarkMode function is not available");
      return;
    }
    
    let shouldBeDark = false;
    
    switch (preference) {
      case 'dark':
        shouldBeDark = true;
        break;
      case 'light':
        shouldBeDark = false;
        break;
      case 'system':
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        break;
    }
    
    // Update localStorage
    if (preference === 'system') {
      localStorage.removeItem('darkMode'); // Let system decide
    } else {
      localStorage.setItem('darkMode', shouldBeDark.toString());
    }
    
    // Only toggle if current state doesn't match desired state
    if ((darkMode && !shouldBeDark) || (!darkMode && shouldBeDark)) {
      toggleDarkMode();
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      // Create or update the farm_settings table if it doesn't exist
      const createFarmSettingsTable = async () => {
        const { error } = await supabase.rpc('create_farm_settings_table_if_not_exists');
        if (error) throw error;
      };

      try {
        // Check if farm_settings table exists
        const { error: tableCheckError } = await supabase
          .from('farm_settings')
          .select('count')
          .limit(1);
          
        if (tableCheckError) {
          // Table doesn't exist yet, create it
          await createFarmSettingsTable();
        }
      } catch (error) {
        console.error("Error checking farm settings table:", error);
        // Try to create it anyway
        await createFarmSettingsTable();
      }
      
      // Save farm-specific settings
      const { error: farmError } = await supabase
        .from('farm_settings')
        .upsert({
          farmer_id: settings.farmer_id,
          farm_name: settings.farm_display_name,
          farm_description: settings.farm_description,
          delivery_radius: settings.delivery_radius,
          minimum_order_amount: settings.minimum_order_amount,
          free_delivery_amount: settings.free_delivery_amount,
          order_auto_accept: settings.order_auto_accept,
          tax_rate: settings.tax_rate,
          show_certification: settings.organic_certification_visible,
          allow_pickups: settings.allow_pickups,
          product_visibility: settings.product_visibility,
          updated_at: new Date().toISOString()
        });
        
      if (farmError) throw farmError;
      
      // Also save general user settings
      // Check if user_settings table exists
      try {
        const { error: tableCheckError } = await supabase
          .from('user_settings')
          .select('count')
          .limit(1);
          
        if (tableCheckError) {
          // Table doesn't exist yet, create it
          await supabase.rpc('create_settings_table_if_not_exists');
        }
      } catch (error) {
        console.error("Error checking user settings table:", error);
        await supabase.rpc('create_settings_table_if_not_exists');
      }
      
      const { error: userError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: settings.id,
          email_notifications: settings.email_notifications,
          order_updates: settings.order_updates,
          marketing_emails: settings.marketing_emails,
          dark_mode_preference: settings.dark_mode_preference,
          language_preference: settings.language_preference,
          privacy_setting: settings.privacy_setting,
          two_factor_auth: settings.two_factor_auth,
          updated_at: new Date().toISOString()
        });
        
      if (userError) throw userError;
      
      // Apply the theme setting after successfully saving to database
      applyDarkModePreference(settings.dark_mode_preference);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Helper toggle component
  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
  }> = ({ checked, onChange, label }) => {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{label}</span>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
            checked ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          onClick={onChange}
          aria-label={`Toggle ${label}`}
        >
          <span className="sr-only">Toggle {label}</span>
          <span
            className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            <span
              className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
                checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
              }`}
              aria-hidden="true"
            >
              <ToggleLeft className="h-3 w-3 text-gray-400" />
            </span>
            <span
              className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
                checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
              }`}
              aria-hidden="true"
            >
              <ToggleRight className="h-3 w-3 text-green-600" />
            </span>
          </span>
        </button>
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Add animations to the page */}
      <style>{animationStyles}</style>
      
      {/* Header with background */}
      <div className="relative mb-6 bg-gradient-to-r from-green-600 to-green-400 rounded-xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-pattern-leaf"></div>
        <div className="relative px-6 py-8 sm:px-8 text-white">
          <h1 className="text-2xl font-bold">Farm Settings</h1>
          <p className="mt-2 text-green-50">Manage your farm profile, business settings, and preferences</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden">
        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Improved Tabs */}
        <div className="px-2 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative py-4 px-3 sm:px-6 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === 'profile'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                <span>Profile</span>
              </div>
              {activeTab === 'profile' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 dark:bg-green-400 transform transition-transform duration-300"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('business')}
              className={`relative py-4 px-3 sm:px-6 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === 'business'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Store className="w-5 h-5 mr-2" />
                <span>Business</span>
              </div>
              {activeTab === 'business' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 dark:bg-green-400 transform transition-transform duration-300"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative py-4 px-3 sm:px-6 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === 'notifications'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                <span>Notifications</span>
              </div>
              {activeTab === 'notifications' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 dark:bg-green-400 transform transition-transform duration-300"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('appearance')}
              className={`relative py-4 px-3 sm:px-6 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === 'appearance'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 mr-2" />
                ) : (
                  <Sun className="w-5 h-5 mr-2" />
                )}
                <span>Appearance</span>
              </div>
              {activeTab === 'appearance' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 dark:bg-green-400 transform transition-transform duration-300"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('privacy')}
              className={`relative py-4 px-3 sm:px-6 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === 'privacy'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>Privacy</span>
              </div>
              {activeTab === 'privacy' && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-green-500 dark:bg-green-400 transform transition-transform duration-300"></div>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-500" />
                  Farm Profile
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This information will be displayed publicly on your farm's profile page.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Farm Name
                    </label>
                    <input
                      type="text"
                      id="farmName"
                      value={settings.farm_display_name}
                      onChange={(e) => handleChangeValue('farm_display_name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="farmDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Farm Description
                    </label>
                    <textarea
                      id="farmDescription"
                      value={settings.farm_description}
                      onChange={(e) => handleChangeValue('farm_description', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Brief description of your farm for customers to see.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 pt-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-500" />
                  Contact Information
                </h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={userProfile.full_name || ''}
                      onChange={(e) => setUserProfile({...userProfile, full_name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={userProfile.phone || ''}
                      onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 pt-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-500" />
                  Farm Address
                </h3>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={userProfile.address || ''}
                      onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={userProfile.city || ''}
                      onChange={(e) => setUserProfile({...userProfile, city: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={userProfile.state || ''}
                      onChange={(e) => setUserProfile({...userProfile, state: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={userProfile.postal_code || ''}
                      onChange={(e) => setUserProfile({...userProfile, postal_code: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Settings */}
          {activeTab === 'business' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Store className="h-5 w-5 mr-2 text-green-500" />
                  Business Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure your business operations, delivery, and product settings.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center mb-4">
                  <Truck className="h-5 w-5 mr-2 text-green-500" />
                  Delivery Settings
                </h4>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="deliveryRadius" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delivery Radius (miles)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="deliveryRadius"
                        value={settings.delivery_radius}
                        onChange={(e) => handleChangeValue('delivery_radius', parseFloat(e.target.value))}
                        min="0"
                        step="1"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pr-12 focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">miles</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      How far you're willing to deliver from your farm location.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Minimum Order Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="minOrderAmount"
                        value={settings.minimum_order_amount}
                        onChange={(e) => handleChangeValue('minimum_order_amount', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pl-7 focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                  <div>
                    <label htmlFor="freeDeliveryAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Free Delivery Threshold
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="freeDeliveryAmount"
                        value={settings.free_delivery_amount}
                        onChange={(e) => handleChangeValue('free_delivery_amount', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pl-7 focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Orders above this amount qualify for free delivery.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tax Rate
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="taxRate"
                        value={settings.tax_rate}
                        onChange={(e) => handleChangeValue('tax_rate', parseFloat(e.target.value))}
                        min="0"
                        max="100"
                        step="0.01"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pr-12 focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center mb-4">
                  <ShoppingBag className="h-5 w-5 mr-2 text-green-500" />
                  Order Management
                </h4>
                
                <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700">
                  <ToggleSwitch 
                    checked={settings.order_auto_accept} 
                    onChange={() => handleToggleSetting('order_auto_accept')}
                    label="Auto-accept new orders"
                  />
                  
                  <ToggleSwitch 
                    checked={settings.allow_pickups} 
                    onChange={() => handleToggleSetting('allow_pickups')}
                    label="Allow customers to pick up orders from the farm"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center mb-4">
                  <Eye className="h-5 w-5 mr-2 text-green-500" />
                  Product Visibility
                </h4>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who can see your products
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visibility-public"
                          name="product-visibility"
                          type="radio"
                          checked={settings.product_visibility === 'public'}
                          onChange={() => handleChangeValue('product_visibility', 'public')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="visibility-public" className="font-medium text-gray-700 dark:text-gray-300">
                          Public
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Visible to everyone browsing the marketplace</p>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visibility-private"
                          name="product-visibility"
                          type="radio"
                          checked={settings.product_visibility === 'private'}
                          onChange={() => handleChangeValue('product_visibility', 'private')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="visibility-private" className="font-medium text-gray-700 dark:text-gray-300">
                          Private
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Only visible to approved customers</p>
                      </div>
                    </div>
                    
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visibility-selective"
                          name="product-visibility"
                          type="radio"
                          checked={settings.product_visibility === 'selective'}
                          onChange={() => handleChangeValue('product_visibility', 'selective')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="visibility-selective" className="font-medium text-gray-700 dark:text-gray-300">
                          Selective
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">Choose visibility settings per product</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <ToggleSwitch 
                    checked={settings.organic_certification_visible} 
                    onChange={() => handleToggleSetting('organic_certification_visible')}
                    label="Display organic certification badge on products"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Settings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage how you receive notifications and updates.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                
                <ToggleSwitch 
                  checked={settings.email_notifications} 
                  onChange={() => handleToggleSetting('email_notifications')}
                  label="Receive email notifications"
                />
                
                <ToggleSwitch 
                  checked={settings.order_updates} 
                  onChange={() => handleToggleSetting('order_updates')}
                  label="Order updates and confirmations"
                />
                
                <ToggleSwitch 
                  checked={settings.marketing_emails} 
                  onChange={() => handleToggleSetting('marketing_emails')}
                  label="Marketing emails and promotions"
                />
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance Settings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Customize the look and feel of your dashboard.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Theme Preferences</h4>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors ${
                        settings.dark_mode_preference === 'light'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleChangeValue('dark_mode_preference', 'light')}
                    >
                      <Sun className="h-8 w-8 text-amber-500 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                    </div>
                    <div
                      className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors ${
                        settings.dark_mode_preference === 'dark'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleChangeValue('dark_mode_preference', 'dark')}
                    >
                      <Moon className="h-8 w-8 text-blue-700 dark:text-blue-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                    </div>
                    <div
                      className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors ${
                        settings.dark_mode_preference === 'system'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleChangeValue('dark_mode_preference', 'system')}
                    >
                      <div className="flex items-center mb-2">
                        <Sun className="h-8 w-8 text-amber-500" />
                        <span className="mx-1">/</span>
                        <Moon className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    System settings will automatically follow your device preferences.
                  </p>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    id="language"
                    aria-label="Select language"
                    value={settings.language_preference}
                    onChange={(e) => handleChangeValue('language_preference', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm text-gray-900 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Privacy & Security</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage your privacy preferences and security settings.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Account Privacy</h4>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Visibility
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        id="privacy-public"
                        name="privacy-setting"
                        type="radio"
                        checked={settings.privacy_setting === 'public'}
                        onChange={() => handleChangeValue('privacy_setting', 'public')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                      />
                      <label htmlFor="privacy-public" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Public Profile
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="privacy-private"
                        name="privacy-setting"
                        type="radio"
                        checked={settings.privacy_setting === 'private'}
                        onChange={() => handleChangeValue('privacy_setting', 'private')}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                      />
                      <label htmlFor="privacy-private" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Private Profile
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Security</h4>
                  
                  <ToggleSwitch 
                    checked={settings.two_factor_auth} 
                    onChange={() => handleToggleSetting('two_factor_auth')}
                    label="Enable two-factor authentication"
                  />
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="sticky bottom-8 mt-8 pt-5">
            <div className="flex justify-end">
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saveStatus === 'saving'}
                  className={`relative inline-flex justify-center py-3 px-6 text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ${
                    saveStatus === 'saving'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : saveStatus === 'success'
                      ? 'bg-green-600'
                      : saveStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Saving Changes...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle className="-ml-1 mr-2 h-5 w-5 text-white" />
                      Settings Saved!
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <AlertTriangle className="-ml-1 mr-2 h-5 w-5 text-white" />
                      Error - Try Again
                    </>
                  ) : (
                    <>
                      <Settings className="-ml-1 mr-2 h-5 w-5 text-white" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmSettingsPage; 