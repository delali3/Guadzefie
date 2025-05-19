import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ChevronRight, 
  Bell, 
  Lock, 
  Moon, 
  Sun,
  Shield, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';

interface UserSettings {
  id: string;
  email_notifications: boolean;
  order_updates: boolean;
  marketing_emails: boolean;
  dark_mode_preference: 'system' | 'light' | 'dark';
  language_preference: string;
  privacy_setting: 'public' | 'private';
  two_factor_auth: boolean;
}

interface SettingsPageProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ darkMode = false, toggleDarkMode }) => {
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    email_notifications: true,
    order_updates: true,
    marketing_emails: false,
    dark_mode_preference: 'system', // Default to system
    language_preference: 'en',
    privacy_setting: 'private',
    two_factor_auth: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'notifications' | 'appearance' | 'privacy' | 'security'>('appearance'); // Default to appearance tab
  const [showDebug, setShowDebug] = useState(false);

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
    const fetchUserSettings = async () => {
      setLoading(true);
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
        
        // Try to fetch user settings from the settings table
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          // If table doesn't exist or no settings, use defaults but set the user id
          console.log("Using default settings");
          
          // Set user ID while preserving other state
          setSettings(prev => ({
            ...prev,
            id: user.id
          }));
        } else if (data) {
          // Map database fields to our settings interface
          setSettings({
            id: user.id,
            email_notifications: data.email_notifications ?? true,
            order_updates: data.order_updates ?? true,
            marketing_emails: data.marketing_emails ?? false,
            dark_mode_preference: data.dark_mode_preference ?? 'system',
            language_preference: data.language_preference ?? 'en',
            privacy_setting: data.privacy_setting ?? 'private',
            two_factor_auth: data.two_factor_auth ?? false
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, []);
  
  // Add a useEffect to listen for system color scheme changes
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

  const handleToggleSetting = (setting: keyof UserSettings) => {
    if (typeof settings[setting] === 'boolean') {
      setSettings({ ...settings, [setting]: !settings[setting as keyof UserSettings] });
    }
  };

  const handleChangeValue = (setting: keyof UserSettings, value: any) => {
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
    
    console.log("Applying dark mode preference:", preference);
    
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
    
    console.log("Current darkMode:", darkMode, "Should be dark:", shouldBeDark);
    
    // Update localStorage
    if (preference === 'system') {
      localStorage.removeItem('darkMode'); // Let system decide
    } else {
      localStorage.setItem('darkMode', shouldBeDark.toString());
    }
    
    // Only toggle if current state doesn't match desired state
    if ((darkMode && !shouldBeDark) || (!darkMode && shouldBeDark)) {
      console.log("Toggling dark mode");
      toggleDarkMode();
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      // Check if user_settings table exists - if not, the upsert will fail
      try {
        const { error: tableCheckError } = await supabase
          .from('user_settings')
          .select('count')
          .limit(1);
          
        if (tableCheckError) {
          // Table doesn't exist yet, create it with migration
          await createSettingsTable();
        }
      } catch (error) {
        console.error("Error checking settings table:", error);
      }
      
      // Now save/update the settings
      const { error } = await supabase
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
        
      if (error) throw error;
      
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
  
  const createSettingsTable = async () => {
    // This would typically be a server-side operation
    // But for demo purposes, we'll attempt to create the table client-side
    console.log("Attempting to create settings table");
    try {
      const { error } = await supabase.rpc('create_settings_table_if_not_exists');
      if (error) throw error;
    } catch (error) {
      console.error("Error creating settings table:", error);
      // Continue anyway, as the table might be created by another process
    }
  };
  
  // Debug info about current theme state
  const ThemeDebugger = () => {
    if (!showDebug) return null;
    
    return (
      <div className="debug-theme">
        <button onClick={() => setShowDebug(false)} className="absolute top-1 right-1 text-white">&times;</button>
        <h4 className="text-sm font-bold mb-1">Theme Debug</h4>
        <div className="text-xs space-y-1">
          <p>Dark Mode State: {darkMode ? 'true' : 'false'}</p>
          <p>Preference: {settings.dark_mode_preference}</p>
          <p>HTML Class: {document.documentElement.classList.contains('dark') ? 'dark' : 'light'}</p>
          <p>localStorage: {localStorage.getItem('darkMode')}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 theme-bg">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="theme-text">Settings</span>
      </nav>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold theme-text">Account Settings</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            title="Debug Theme"
          >
            <Info size={18} />
          </button>
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              saveStatus === 'saving' 
                ? 'bg-gray-400' 
                : saveStatus === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : saveStatus === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
      
      <div className="shadow-sm rounded-lg overflow-hidden border theme-border theme-card">
        {/* Tabs */}
        <div className="border-b theme-border">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bell className="w-5 h-5 inline-block mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'appearance'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Moon className="w-5 h-5 inline-block mr-2" />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'privacy'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-5 h-5 inline-block mr-2" />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock className="w-5 h-5 inline-block mr-2" />
              Security
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Notification Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications about your account</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('email_notifications')}
                    className="focus:outline-none"
                  >
                    {settings.email_notifications ? (
                      <ToggleRight className="w-10 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Order Updates</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about your order status</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('order_updates')}
                    className="focus:outline-none"
                  >
                    {settings.order_updates ? (
                      <ToggleRight className="w-10 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Marketing Emails</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive emails about promotions, offers, and new products</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('marketing_emails')}
                    className="focus:outline-none"
                  >
                    {settings.marketing_emails ? (
                      <ToggleRight className="w-10 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Appearance Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Theme Preference</h4>
                  
                  {/* Current theme indicator */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Current theme: <strong>{darkMode ? 'Dark' : 'Light'}</strong>
                    </p>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">Quick toggle:</span>
                      <button 
                        onClick={toggleDarkMode} 
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                      >
                        {darkMode ? (
                          <Sun className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Moon className="h-5 w-5 text-gray-700" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <button
                      onClick={() => handleChangeValue('dark_mode_preference', 'light')}
                      className={`border rounded-lg px-4 py-3 text-center ${
                        settings.dark_mode_preference === 'light'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Light Mode
                    </button>
                    <button
                      onClick={() => handleChangeValue('dark_mode_preference', 'dark')}
                      className={`border rounded-lg px-4 py-3 text-center ${
                        settings.dark_mode_preference === 'dark'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Dark Mode
                    </button>
                    <button
                      onClick={() => handleChangeValue('dark_mode_preference', 'system')}
                      className={`border rounded-lg px-4 py-3 text-center ${
                        settings.dark_mode_preference === 'system'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      System Default
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {settings.dark_mode_preference === 'system'
                      ? 'Your theme will automatically change based on your system preferences.'
                      : settings.dark_mode_preference === 'dark'
                        ? 'Dark mode is easier on the eyes in low-light environments.'
                        : 'Light mode provides better visibility in bright environments.'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Language</h4>
                  <div className="mt-2">
                    <select
                      value={settings.language_preference}
                      onChange={(e) => handleChangeValue('language_preference', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                      aria-label="Select language"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Privacy Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">Profile Visibility</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => handleChangeValue('privacy_setting', 'public')}
                      className={`border rounded-lg px-4 py-3 text-center ${
                        settings.privacy_setting === 'public'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Public
                    </button>
                    <button
                      onClick={() => handleChangeValue('privacy_setting', 'private')}
                      className={`border rounded-lg px-4 py-3 text-center ${
                        settings.privacy_setting === 'private'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Private
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {settings.privacy_setting === 'public' 
                      ? 'Your profile information will be visible to other marketplace users.' 
                      : 'Your profile will only be visible to yourself and the admins.'}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Data Preferences</h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage how your data is used and stored.
                      </p>
                    </div>
                    <Link to="/privacy-settings" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-500">
                      Advanced settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('two_factor_auth')}
                    className="focus:outline-none"
                  >
                    {settings.two_factor_auth ? (
                      <ToggleRight className="w-10 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Password</h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Update your password regularly for better security.
                      </p>
                    </div>
                    <Link to="/change-password" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-500">
                      Change password
                    </Link>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Login Sessions</h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your active sessions and sign out from other devices.
                      </p>
                    </div>
                    <Link to="/sessions" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-500">
                      Manage sessions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ThemeDebugger />
    </div>
  );
};

export default SettingsPage; 