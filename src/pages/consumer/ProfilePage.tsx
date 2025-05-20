import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO';
import { 
  ChevronRight, 
  Loader2, 
  AlertCircle
} from 'lucide-react';

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  bio: string;
  birth_date: string;
  gender: string;
  occupation: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  website: string;
  social_links: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };
  privacy_level: 'public' | 'private' | 'friends_only';
}

const ProfilePage: React.FC = () => {
  // Debug localStorage on component mount
  useEffect(() => {
    console.log('==== DEBUG USER DATA ====');
    try {
      const userStr = localStorage.getItem('user');
      console.log('Raw user data:', userStr);
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Parsed user data:', userData);
        console.log('User ID:', userData.id);
        console.log('User structure:', Object.keys(userData));
      } else {
        console.log('No user data found in localStorage');
      }
    } catch (error) {
      console.error('Error debugging user data:', error);
    }
    console.log('========================');
  }, []);

  // Use getCurrentUser from supabase lib
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileForm>({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: null,
    bio: '',
    birth_date: '',
    gender: '',
    occupation: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    },
    website: '',
    social_links: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    privacy_level: 'private'
  });
  
  
  const [, ] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setNeedsProfileTable] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      // Reset component state when mounted
      setLoading(true);
      setProfileData({
        first_name: '',
        last_name: '',
        phone: '',
        avatar_url: null,
        bio: '',
        birth_date: '',
        gender: '',
        occupation: '',
        address: {
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        },
        website: '',
        social_links: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: ''
        },
        privacy_level: 'private'
      });
      
      // Directly retrieve user from localStorage for custom auth
      const userStr = localStorage.getItem('user');
      console.log('Raw user data from localStorage:', userStr ? `found (length: ${userStr.length})` : 'not found');
      
      if (userStr) {
        try {
          const loadedUser = JSON.parse(userStr);
          console.log('Parsed user data:', loadedUser);
          console.log('Parsed user data structure:', Object.keys(loadedUser));
          
          if (loadedUser && loadedUser.id) {
            console.log('Valid user found with ID:', loadedUser.id);
            
            // Set user immediately
            setUser(loadedUser);
            
            // Then fetch profile data - this will happen in the user effect dependency
            console.log('User set to state, profile data will be fetched next');
          } else {
            console.error('Invalid user data format - missing ID:', loadedUser);
            setError("User data format is invalid. Please sign in again.");
            setLoading(false);
            
            // Redirect to login page after a short delay
            const timer = setTimeout(() => {
              console.log('Invalid user data, redirecting to login page');
              window.location.href = '/login';
            }, 2000);
            
            return () => clearTimeout(timer);
          }
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          setError("Failed to read user data. Please sign in again.");
          setLoading(false);
          
          // Redirect to login page after a short delay
          const timer = setTimeout(() => {
            console.log('Error parsing user, redirecting to login page');
            window.location.href = '/login';
          }, 2000);
          
          return () => clearTimeout(timer);
        }
      } else {
        setError("User not authenticated. Please sign in.");
        setLoading(false);
        
        // Redirect to login page after a short delay
        const timer = setTimeout(() => {
          console.log('No user found, redirecting to login page');
          window.location.href = '/login';
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      setError("Error loading user data. Please sign in again.");
      setLoading(false);
      
      // Redirect to login page after a short delay
      const timer = setTimeout(() => {
        console.log('Error loading user, redirecting to login page');
        window.location.href = '/login';
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (user && user.id) {
      console.log('User state is set, now fetching profile with ID:', user.id);
      
      // Only fetch if we're still loading (haven't fetched yet)
      if (loading) {
        fetchProfile();
      }
    } else {
      console.log('Waiting for user to be set before fetching profile...');
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    if (!user || !user.id) {
      console.error('fetchProfile called but user or user.id is missing:', user);
      setLoading(false);
      setError("User not authenticated. Please sign in again.");
      return;
    }

    try {
      console.log('Fetching profile for user ID:', user.id);
            
      // First try to get data directly from users table since that's our primary auth table
      console.log('Checking users table first for ID:', user.id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Log what we got from the users table  
      console.log('Users table query result:', {
        success: !userError,
        data: userData ? 'found' : 'not found',
        error: userError ? userError.message : null
      });
        
      if (userError) {
        console.error('Error fetching from users table:', userError);
        
        // Fall back to profiles table if users query failed
        console.log('Falling back to profiles table check');
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          // Log what we got from the profiles table
          console.log('Profiles table query result:', {
            success: !error,
            data: data ? 'found' : 'not found',
            error: error ? error.message : null
          });
  
          if (error) {
            console.log('Error fetching profile from profiles table:', error);
            
            // Check if error is related to missing table
            if (error.message.includes('does not exist')) {
              console.log('Profiles table does not exist, setting up table...');
              setNeedsProfileTable(true);
              setLoading(false);
              return;
            }
            
            // Use data from localStorage as last resort
            console.log('Using localStorage data as fallback');
            
            // Create a minimal profile from localStorage user data
            const minimalProfile = {
              ...profileData,
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              phone: user.phone || '',
              avatar_url: user.avatar_url || null,
            };
            
            console.log('Setting profile data from localStorage:', minimalProfile);
            setProfileData(minimalProfile);
          } else if (data) {
            // Successfully got profile data
            console.log('Successfully fetched profile data from profiles table:', data);
            
            // Convert address format if it exists
            let addressData = profileData.address;
            if (data.address && typeof data.address === 'object') {
              addressData = {
                street: data.address.street || '',
                city: data.address.city || '',
                state: data.address.state || '',
                postal_code: data.address.postal_code || '',
                country: data.address.country || ''
              };
            }
            
            // Convert social links format if it exists
            let socialLinksData = profileData.social_links;
            if (data.social_links && typeof data.social_links === 'object') {
              socialLinksData = {
                facebook: data.social_links.facebook || '',
                twitter: data.social_links.twitter || '',
                instagram: data.social_links.instagram || '',
                linkedin: data.social_links.linkedin || ''
              };
            }
            
            // Build the complete profile data
            const completeProfile = {
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              phone: data.phone || '',
              avatar_url: data.avatar_url || null,
              bio: data.bio || '',
              birth_date: data.birth_date || '',
              gender: data.gender || '',
              occupation: data.occupation || '',
              address: addressData,
              website: data.website || '',
              social_links: socialLinksData,
              privacy_level: data.privacy_level || 'private'
            };
            
            console.log('Setting profile data from profiles table:', completeProfile);
            // Update profile data with fetched data
            setProfileData(completeProfile);
          }
        } catch (err) {
          console.error('Error in fetchProfile:', err);
          setError(err instanceof Error ? err.message : 'Failed to load profile data');
        }
      } else if (userData) {
        // Successfully got user data
        console.log('Successfully fetched user data from users table:', userData);
        
        // Convert address format if it exists
        let addressData = {
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        };
        
        if (userData.address && typeof userData.address === 'object') {
          addressData = {
            street: userData.address.street || '',
            city: userData.address.city || '',
            state: userData.address.state || '',
            postal_code: userData.address.postal_code || '',
            country: userData.address.country || ''
          };
        }
        
        // Check if profiles table exists and create a profile entry if needed
        const { error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (profileCheckError && !profileCheckError.message.includes('does not exist')) {
          // If profiles table exists but user profile doesn't, create it
          console.log('Creating profile record from user data');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user.id,
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                phone: userData.phone || '',
                avatar_url: userData.avatar_url || null,
                address: addressData
              }
            ]);
            
          if (insertError) {
            console.error("Failed to create initial profile:", insertError);
          }
        } else if (profileCheckError && profileCheckError.message.includes('does not exist')) {
          // If profiles table doesn't exist, mark it for creation
          console.log('Profiles table does not exist, marking for creation');
          setNeedsProfileTable(true);
        }
          
        // Build the profile data object from user data
        const userProfile = {
          ...profileData,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || null,
          address: addressData
        };
        
        console.log('Setting profile data from users table:', userProfile);
        // Set profile data from the users table
        setProfileData(userProfile);
      }
      
      // Calculate profile completeness after loading data
      setTimeout(() => {
        calculateProfileCompleteness();
      }, 500);
      
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completeness score (0-100)
  const calculateProfileCompleteness = () => {
    console.log("Calculating profile completeness...");
    
    // List all fields to check
    const fields = [
      profileData.first_name,
      profileData.last_name, 
      profileData.phone,
      profileData.avatar_url,
      profileData.bio,
      profileData.birth_date,
      profileData.gender,
      profileData.occupation,
      profileData.address.street,
      profileData.address.city,
      profileData.address.state,
      profileData.address.postal_code,
      profileData.address.country,
      profileData.website,
      profileData.social_links.facebook,
      profileData.social_links.twitter,
      profileData.social_links.instagram,
      profileData.social_links.linkedin
    ];
    
    // Debug log to see what fields have values
    console.log("Profile fields:", fields.map(field => field ? 'filled' : 'empty'));
    
    // Count filled fields (non-empty)
    const filledFields = fields.filter(field => field && String(field).trim() !== '').length;
    
    // Calculate percentage (rounded to nearest integer)
    const percentage = Math.round((filledFields / fields.length) * 100);
    
    console.log(`Profile completeness: ${filledFields}/${fields.length} fields = ${percentage}%`);
    
    setProfileCompleteness(percentage);
  };

  // Get CSS class for profile completeness
  const getProfileCompletenessColor = () => {
    if (profileCompleteness < 30) return 'bg-red-500';
    if (profileCompleteness < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // Calculate profile completeness whenever profileData changes
  useEffect(() => {
    if (!loading) {
      calculateProfileCompleteness();
    }
  }, [profileData, loading]);

  // Debug profile data whenever it changes
  useEffect(() => {
    if (!loading) {
      console.log('Current profile data state:', {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        bio: profileData.bio?.substring(0, 20) + (profileData.bio?.length > 20 ? '...' : ''),
        // Log other key fields to verify they're populated correctly
      });
    }
  }, [profileData, loading]);
  
  // Ensure user fetch triggers only once and causes a proper re-render
  useEffect(() => {
    if (user && user.id && !loading) {
      console.log('Profile inputs should now be populated with user data:', user.id);
    }
  }, [user, loading]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="My Profile"
        description="Manage your personal profile and account settings"
        noIndex={true}
      />
      
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 dark:text-white">My Profile</span>
      </nav>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">My Profile</h1>
        
        {/* Profile Completeness */}
        {!loading && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Profile Completeness: {profileCompleteness}%
            </span>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getProfileCompletenessColor()}`}
                style={{ width: `${profileCompleteness}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            {error && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 