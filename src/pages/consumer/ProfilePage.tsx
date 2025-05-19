import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, getCurrentUser } from '../../lib/supabase';
import { checkProfileTable, ensureProfilesTable as setupProfilesTable } from '../../lib/migrations';
import SEO from '../../components/SEO';
import { 
  ChevronRight, 
  User, 
  Camera, 
  Loader2, 
  Save,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Globe,
  Shield,
  Lock,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileTableSetup from '../../components/profile/ProfileTableSetup';

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

  // Use a function to handle migration status
  // const handleMigrationComplete = (success: boolean, message: string) => {
  //   setMigrationStatus({
  //     show: true,
  //     success,
  //     message
  //   });
    
  //   if (success) {
  //     toast.success(message);
  //   } else {
  //     toast.error(message);
  //   }
    
  //   // Hide the message after 5 seconds
  //   setTimeout(() => {
  //     setMigrationStatus(prev => ({ ...prev, show: false }));
  //   }, 5000);
  // };

  // Load user from localStorage on mount
  useEffect(() => {
    const loadedUser = getCurrentUser();
    if (loadedUser) {
      console.log('User loaded from localStorage:', loadedUser);
      setUser(loadedUser);
      
      // Run the profiles table migration to fix any schema issues
      setupProfilesTable()
        .then(result => {
          console.log('Profiles table migration result:', result);
          // Only fetch profile if the migration succeeded or the table already exists
          fetchProfile();
        })
        .catch(err => {
          console.error('Error running profiles migration:', err);
          setError('Error preparing the database. Please try again later.');
          setLoading(false);
        });
    } else {
      setError("User not authenticated. Please sign in.");
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      setError("User not authenticated. Please sign in again.");
      return;
    }

    try {
      console.log('Fetching profile for user:', user);
      
      // Check if the profiles table exists
      const tableExists = await checkProfileTable();
      
      if (!tableExists) {
        setNeedsProfileTable(true);
        setLoading(false);
        return;
      }
      
      // First check profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
        
        // Check if error is related to missing table
        if (error.message.includes('does not exist')) {
          setNeedsProfileTable(true);
        } else {
          // Try to create a profile if it doesn't exist (e.g., first login)
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user.id,
                first_name: user.first_name || '',
                last_name: user.last_name || ''
              }
            ]);
          
          if (insertError) {
            console.error("Failed to create initial profile:", insertError);
          }
        }
        
        // Fall back to user data from localStorage
        setProfileData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          phone: user.phone || '',
          avatar_url: user.avatar_url || null,
          bio: user.bio || '',
          birth_date: user.birth_date || '',
          gender: user.gender || '',
          occupation: user.occupation || '',
          address: user.address || {
            street: '',
            city: '',
            state: '',
            postal_code: '',
            country: ''
          },
          website: user.website || '',
          social_links: user.social_links || {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          },
          privacy_level: user.privacy_level || 'private'
        });
      } else {
        console.log('Profile found:', data);
        // Parse JSON fields if they're stored as strings
        const address = typeof data.address === 'string' ? JSON.parse(data.address) : 
                        data.address || {
                          street: '',
                          city: '',
                          state: '',
                          postal_code: '',
                          country: ''
                        };
                        
        const socialLinks = typeof data.social_links === 'string' ? JSON.parse(data.social_links) : 
                          data.social_links || {
                            facebook: '',
                            twitter: '',
                            instagram: '',
                            linkedin: ''
                          };
        
        // Format birth_date for the form (YYYY-MM-DD)
        let formattedBirthDate = '';
        if (data.birth_date) {
          try {
            const date = new Date(data.birth_date);
            if (!isNaN(date.getTime())) {
              formattedBirthDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error formatting birth date:', e);
          }
        }
        
        setProfileData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || null,
          bio: data.bio || '',
          birth_date: formattedBirthDate,
          gender: data.gender || '',
          occupation: data.occupation || '',
          address,
          website: data.website || '',
          social_links: socialLinks,
          privacy_level: data.privacy_level || 'private'
        });
      }

      // Calculate profile completeness
      calculateProfileCompleteness();
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completeness score (0-100)
  const calculateProfileCompleteness = () => {
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
    
    // Count filled fields (non-empty)
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    
    // Calculate percentage (rounded to nearest integer)
    const percentage = Math.round((filledFields / fields.length) * 100);
    
    setProfileCompleteness(percentage);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

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
      toast.error('You must be logged in to update your profile');
      setError('User not authenticated. Please sign in again.');
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload avatar if changed
      let avatarUrl = profileData.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Prepare profile data with updated avatar URL
      const updatedProfile = {
        ...profileData,
        avatar_url: avatarUrl
      };
      
      // Format the birth_date for database (to ISO string)
      let formattedBirthDate = null;
      if (updatedProfile.birth_date) {
        try {
          const date = new Date(updatedProfile.birth_date);
          if (!isNaN(date.getTime())) {
            formattedBirthDate = date.toISOString();
          }
        } catch (e) {
          console.error('Error formatting birth date for save:', e);
        }
      }

      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone ? updatedProfile.phone.trim() : null,
          avatar_url: updatedProfile.avatar_url,
          bio: updatedProfile.bio,
          birth_date: formattedBirthDate,
          gender: updatedProfile.gender,
          occupation: updatedProfile.occupation,
          address: updatedProfile.address,
          website: updatedProfile.website,
          social_links: updatedProfile.social_links,
          privacy_level: updatedProfile.privacy_level,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        // Log the specific error for debugging
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // For custom auth, update the user in localStorage with the new profile data
      try {
        const updatedUser = {
          ...user,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone,
          avatar_url: updatedProfile.avatar_url,
          // Add other fields as needed
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update component state
        setUser(updatedUser);
      } catch (err) {
        console.warn('Error updating local user data:', err);
        // Continue anyway as the database update succeeded
      }

      // Update local avatar state
      setProfileData(prev => ({...prev, avatar_url: avatarUrl}));
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Update profile completeness
      calculateProfileCompleteness();
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileTableSetupSuccess = () => {
    setNeedsProfileTable(false);
    fetchProfile();
    toast.success('Profile table created successfully');
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // First authenticate the user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      // Reset form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      toast.success('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };
  
  // Get CSS class for profile completeness
  const getProfileCompletenessColor = () => {
    if (profileCompleteness < 30) return 'bg-red-500';
    if (profileCompleteness < 70) return 'bg-yellow-500';
    return 'bg-green-500';
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
            value={profileData.phone}
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
                className={`h-2.5 rounded-full ${getProfileCompletenessColor()} w-[${profileCompleteness}%]`}
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
            
            {/* Migration setup message */}
            {migrationStatus.show && migrationStatus.message && (
              <div className={`mb-6 p-4 border rounded-lg flex items-center gap-2 ${
                migrationStatus.success 
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-400' 
                  : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}>
                {migrationStatus.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{migrationStatus.message}</span>
              </div>
            )}
            
            {/* Profile table setup component */}
            {needsProfileTable ? (
              <ProfileTableSetup onSuccess={handleProfileTableSetupSuccess} />
            ) : (
              <>
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('basic')}
                      className={`whitespace-nowrap pb-4 px-3 border-b-2 font-medium text-base ${
                        activeTab === 'basic'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <User className="w-5 h-5 inline-block mr-2" />
                      Basic Information
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('additional')}
                      className={`whitespace-nowrap pb-4 px-3 border-b-2 font-medium text-base ${
                        activeTab === 'additional'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 inline-block mr-2" />
                      Additional Info
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('social')}
                      className={`whitespace-nowrap pb-4 px-3 border-b-2 font-medium text-base ${
                        activeTab === 'social'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Globe className="w-5 h-5 inline-block mr-2" />
                      Social & Privacy
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`whitespace-nowrap pb-4 px-3 border-b-2 font-medium text-base ${
                        activeTab === 'security'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Shield className="w-5 h-5 inline-block mr-2" />
                      Security
                    </button>
                  </nav>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'security' ? (
                  renderSecurityTab()
                ) : (
                  <form onSubmit={handleSubmit}>
                    {renderTabContent()}
                    
                    {activeTab !== 'security' && (
                      <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 