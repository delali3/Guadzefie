import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SEO from '../../components/SEO';
import { 
  ChevronRight, 
  User, 
  Camera, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Lock,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

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

// Gender options
const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

// Countries list (sample)
const COUNTRIES = [
  { value: '', label: 'Select country' },
  { value: 'ghana', label: 'Ghana' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'south_africa', label: 'South Africa' },
  { value: 'usa', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'other', label: 'Other' }
];

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
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');
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
  
  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [needsProfileTable, setNeedsProfileTable] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  // Store temporary migration status for UI
  const [migrationStatus, _setMigrationStatus] = useState<{
    show: boolean;
    success?: boolean;
    message?: string;
  }>({ show: false });

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

  // Input change handlers for different field types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is modified
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is modified
    if (validationErrors[`address.${name}`]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[`address.${name}`];
        return newErrors;
      });
    }
    
    setProfileData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is modified
    if (validationErrors[`social_links.${name}`]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[`social_links.${name}`];
        return newErrors;
      });
    }
    
    setProfileData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [name]: value
      }
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
      }
      
      if (file.size > maxSize) {
        toast.error('Image is too large. Maximum size is 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return profileData.avatar_url;

    // Create a unique filename
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      // Check for active storage bucket
      let { data: _bucketExists, error: bucketError } = await supabase.storage
        .getBucket('profiles');
        
      if (bucketError) {
        if (bucketError.message.includes('does not exist')) {
          // Create the bucket if it doesn't exist
          const { error: createBucketError } = await supabase.storage.createBucket('profiles', {
            public: true
          });
          
          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            throw createBucketError;
          }
        } else {
          throw bucketError;
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar: ' + error.message);
      return null;
    }
  };

  // Validate all fields before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields validation
    if (!profileData.first_name.trim()) errors['first_name'] = 'First name is required';
    if (!profileData.last_name.trim()) errors['last_name'] = 'Last name is required';
    
    // Phone number validation (basic, but allow empty)
    if (profileData.phone && profileData.phone.trim() !== '' && !/^\+?[0-9\s\-()]{7,20}$/.test(profileData.phone)) {
      errors['phone'] = 'Please enter a valid phone number or leave empty';
    }
    
    // Website validation (if provided)
    if (profileData.website && !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(profileData.website)) {
      errors['website'] = 'Please enter a valid website URL';
    }
    
    // Social media validation (if provided)
    if (profileData.social_links.facebook && !profileData.social_links.facebook.includes('facebook.com')) {
      errors['social_links.facebook'] = 'Please enter a valid Facebook URL';
    }
    
    if (profileData.social_links.twitter && !profileData.social_links.twitter.includes('twitter.com') && !profileData.social_links.twitter.includes('x.com')) {
      errors['social_links.twitter'] = 'Please enter a valid Twitter/X URL';
    }
    
    if (profileData.social_links.instagram && !profileData.social_links.instagram.includes('instagram.com')) {
      errors['social_links.instagram'] = 'Please enter a valid Instagram URL';
    }
    
    if (profileData.social_links.linkedin && !profileData.social_links.linkedin.includes('linkedin.com')) {
      errors['social_links.linkedin'] = 'Please enter a valid LinkedIn URL';
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    // Validate form data
    if (!validateForm()) {
      toast.error("Please fix the validation errors before saving");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Upload avatar if changed
      let newAvatarUrl = profileData.avatar_url;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }
      
      // Format date for database
      let formattedBirthDate = null;
      if (profileData.birth_date) {
        try {
          // Ensure correct format for Postgres (YYYY-MM-DD)
          const date = new Date(profileData.birth_date);
          if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting birth date:', e);
        }
      }
      
      // Prepare profile data for update
      const profileUpdateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone ? profileData.phone.trim() : null,
        avatar_url: newAvatarUrl,
        bio: profileData.bio || null,
        birth_date: formattedBirthDate,
        gender: profileData.gender || null,
        occupation: profileData.occupation || null,
        address: profileData.address,
        website: profileData.website || null,
        social_links: profileData.social_links,
        privacy_level: profileData.privacy_level,
        updated_at: new Date().toISOString()
      };
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([
          {
            id: user.id,
            ...profileUpdateData
          }
        ]);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
      
      // Also update basic information in the custom users table for consistency
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone ? profileData.phone.trim() : null,
          avatar_url: newAvatarUrl,
          address: profileData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (userError) {
        console.error('Error updating user data:', userError);
        // Don't throw here, as the profiles update succeeded
        toast.error('Profile updated, but some changes could not be synced to user account.');
      } else {
        // Update local storage with new user data
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            const updatedUser = {
              ...userData,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              phone: profileData.phone ? profileData.phone.trim() : null,
              avatar_url: newAvatarUrl,
              address: profileData.address
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
      }
      
      // Show success message
      toast.success('Profile updated successfully!');
      
      // Reset states
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Update profile completeness
      calculateProfileCompleteness();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving your profile');
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // Since we're using a custom users table, we need a different approach
      // This needs to be implemented on your backend API
      
      // For a custom users table, you would typically:
      // 1. Send the current and new password to a secure API endpoint
      // 2. Verify the current password server-side
      // 3. Hash the new password and update the database
      
      // Example implementation (simplified - this will need to be replaced with your actual API call):
      toast.success('Password changes cannot be processed directly. Please use the dedicated password reset function or contact support.');
      
      // If you have an API endpoint for password changes, you would use it like this:
      /*
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` // If you're using tokens
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }
      
      toast.success('Password changed successfully');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      */
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicInfoTab();
      case 'additional':
        return renderAdditionalInfoTab();
      case 'social':
        return renderSocialLinksTab();
      case 'security':
        return renderSecurityTab();
      default:
        return renderBasicInfoTab();
    }
  };

  // Render basic info tab
  const renderBasicInfoTab = () => (
    <>
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative">
          <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-600">
            {avatarPreview || profileData.avatar_url ? (
              <img 
                src={avatarPreview || profileData.avatar_url || ''} 
                alt={`${profileData.first_name}'s avatar`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Camera icon overlay */}
          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 h-10 w-10 bg-green-500 rounded-full flex items-center justify-center cursor-pointer border-2 border-white dark:border-gray-600">
            <Camera className="h-5 w-5 text-white" />
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
              aria-label="Upload profile picture"
            />
          </label>
        </div>
        
        {avatarPreview && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            <span>New avatar selected</span>
          </div>
        )}
      </div>
      
      {/* Basic Form Fields */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="first_name"
            id="first_name"
            value={profileData.first_name}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['first_name'] ? 'border-red-300 dark:border-red-500' : ''}`}
            placeholder="First Name"
          />
          {validationErrors['first_name'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['first_name']}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            name="last_name"
            id="last_name"
            value={profileData.last_name}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['last_name'] ? 'border-red-300 dark:border-red-500' : ''}`}
            placeholder="Last Name"
          />
          {validationErrors['last_name'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['last_name']}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={profileData.phone || ''}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['phone'] ? 'border-red-300 dark:border-red-500' : ''}`}
            placeholder="Phone Number"
          />
          {validationErrors['phone'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['phone']}</p>
          )}
        </div>
        
        {user && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={user.email}
              readOnly
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 text-base py-2 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
          </div>
        )}
        
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            id="bio"
            rows={4}
            value={profileData.bio}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
            placeholder="Tell us about yourself"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Brief description for your profile. This will be visible to others depending on your privacy settings.
          </p>
        </div>
      </div>
    </>
  );
  
  // Render additional info tab
  const renderAdditionalInfoTab = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date of Birth
        </label>
        <input
          type="date"
          name="birth_date"
          id="birth_date"
          value={profileData.birth_date}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
        />
      </div>
      
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gender
        </label>
        <select
          name="gender"
          id="gender"
          value={profileData.gender}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
        >
          {GENDER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Occupation
        </label>
        <input
          type="text"
          name="occupation"
          id="occupation"
          value={profileData.occupation}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
          placeholder="Your occupation or job title"
        />
      </div>
      
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Website
        </label>
        <input
          type="url"
          name="website"
          id="website"
          value={profileData.website}
          onChange={handleInputChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['website'] ? 'border-red-300 dark:border-red-500' : ''}`}
          placeholder="https://yourwebsite.com"
        />
        {validationErrors['website'] && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['website']}</p>
        )}
      </div>
      
      <div className="sm:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
      </div>
      
      <div className="sm:col-span-2">
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Street Address
        </label>
        <input
          type="text"
          name="street"
          id="street"
          value={profileData.address.street}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
          placeholder="123 Main St, Apt 4B"
        />
      </div>
      
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          City
        </label>
        <input
          type="text"
          name="city"
          id="city"
          value={profileData.address.city}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
          placeholder="City"
        />
      </div>
      
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          State/Province
        </label>
        <input
          type="text"
          name="state"
          id="state"
          value={profileData.address.state}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
          placeholder="State/Province"
        />
      </div>
      
      <div>
        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Postal Code
        </label>
        <input
          type="text"
          name="postal_code"
          id="postal_code"
          value={profileData.address.postal_code}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
          placeholder="Postal Code"
        />
      </div>
      
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Country
        </label>
        <select
          name="country"
          id="country"
          value={profileData.address.country}
          onChange={handleAddressChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2"
        >
          {COUNTRIES.map(country => (
            <option key={country.value} value={country.value}>{country.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
  
  // Render social links tab
  const renderSocialLinksTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Media Profiles</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Link your social media profiles to connect with other users and enhance your profile.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Facebook
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 text-base">
              https://
            </span>
            <input
              type="text"
              name="facebook"
              id="facebook"
              value={profileData.social_links.facebook.replace(/^https?:\/\//, '')}
              onChange={handleSocialLinkChange}
              className={`flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['social_links.facebook'] ? 'border-red-300 dark:border-red-500' : ''}`}
              placeholder="facebook.com/username"
            />
          </div>
          {validationErrors['social_links.facebook'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['social_links.facebook']}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Twitter/X
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 text-base">
              https://
            </span>
            <input
              type="text"
              name="twitter"
              id="twitter"
              value={profileData.social_links.twitter.replace(/^https?:\/\//, '')}
              onChange={handleSocialLinkChange}
              className={`flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['social_links.twitter'] ? 'border-red-300 dark:border-red-500' : ''}`}
              placeholder="twitter.com/username"
            />
          </div>
          {validationErrors['social_links.twitter'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['social_links.twitter']}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Instagram
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 text-base">
              https://
            </span>
            <input
              type="text"
              name="instagram"
              id="instagram"
              value={profileData.social_links.instagram.replace(/^https?:\/\//, '')}
              onChange={handleSocialLinkChange}
              className={`flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base py-2 ${validationErrors['social_links.instagram'] ? 'border-red-300 dark:border-red-500' : ''}`}
              placeholder="instagram.com/username"
            />
          </div>
          {validationErrors['social_links.instagram'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['social_links.instagram']}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            LinkedIn
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 text-base">
              https://
            </span>
            <input
              type="text"
              name="linkedin"
              id="linkedin"
              value={profileData.social_links.linkedin.replace(/^https?:\/\//, '')}
              onChange={handleSocialLinkChange}
              className={`flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm ${validationErrors['social_links.linkedin'] ? 'border-red-300 dark:border-red-500' : ''}`}
              placeholder="linkedin.com/in/username"
            />
          </div>
          {validationErrors['social_links.linkedin'] && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors['social_links.linkedin']}</p>
          )}
        </div>
      </div>
      
      <div className="py-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
        
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Profile Visibility
          </label>
          
          <div className="mt-2 space-y-2">
            <div className="flex items-center">
              <input
                id="privacy-public"
                name="privacy_level"
                type="radio"
                value="public"
                checked={profileData.privacy_level === 'public'}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <label htmlFor="privacy-public" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Public - Your profile is visible to everyone
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="privacy-friends"
                name="privacy_level"
                type="radio"
                value="friends_only"
                checked={profileData.privacy_level === 'friends_only'}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <label htmlFor="privacy-friends" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Friends Only - Only your connections can view your profile
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="privacy-private"
                name="privacy_level"
                type="radio"
                value="private"
                checked={profileData.privacy_level === 'private'}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <label htmlFor="privacy-private" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Private - Only you can view your profile details
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render security tab
  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                name="current-password"
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                name="new-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 8 characters long
            </p>
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
            className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className="py-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Security</h3>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Coming Soon</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                <p>
                  Two-factor authentication and additional security features will be available soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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