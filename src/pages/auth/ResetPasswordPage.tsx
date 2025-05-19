// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowRight, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  ShoppingBag,
  Eye,
  EyeOff
} from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isValidLink, setIsValidLink] = useState(true);
  
  // Form validation
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  
  // Check if the reset link is valid
  useEffect(() => {
    const checkResetLink = async () => {
      // Get the hash from the URL
      const hash = window.location.hash.substring(1);
      
      if (!hash) {
        setIsValidLink(false);
        setError('Invalid or expired password reset link. Please request a new link.');
        return;
      }
      
      try {
        // Verify the hash contains type=recovery parameter
        const params = new URLSearchParams(hash);
        if (!params.get('type') || params.get('type') !== 'recovery') {
          setIsValidLink(false);
          setError('Invalid password reset link. Please request a new link.');
        }
      } catch (err) {
        console.error('Error checking reset link:', err);
        setIsValidLink(false);
        setError('Invalid password reset link. Please request a new link.');
      }
    };
    
    checkResetLink();
  }, []);
  
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    } else if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    } else {
      setPasswordError(null);
      return true;
    }
  };
  
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError(null);
      return true;
    }
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
    if (confirmPassword && confirmPasswordError) validateConfirmPassword(confirmPassword);
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) validateConfirmPassword(e.target.value);
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the password fields
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) throw error;
      
      // Successful password reset
      setSuccess('Your password has been reset successfully.');
      
      // After 2 seconds, redirect to login page
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again or request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Guadzefie</span>
          </div>
          
          <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Please create a new password for your account.
          </p>
        </div>
        
        {/* Success message */}
        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">Redirecting to login page...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                {!isValidLink && (
                  <div className="mt-2">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm font-medium text-red-800 dark:text-red-200 underline"
                    >
                      Request a new password reset link
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {isValidLink && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    className={`appearance-none block w-full px-3 py-3 pl-10 pr-10 rounded-lg border ${
                      passwordError 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                    } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    className={`appearance-none block w-full px-3 py-3 pl-10 pr-10 rounded-lg border ${
                      confirmPasswordError 
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                    } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={toggleShowConfirmPassword}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{confirmPasswordError}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                  loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              >
                {loading ? (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <ArrowRight className="h-5 w-5 text-green-400 group-hover:text-green-300" aria-hidden="true" />
                  </span>
                )}
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
        
        {!isValidLink && (
          <div className="flex justify-center mt-4">
            <Link to="/login" className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500">
              Return to login page
            </Link>
          </div>
        )}
        
        {/* Security note */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Security tips:</h3>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-5 list-disc">
            <li>Use a unique password that you don't use on other sites.</li>
            <li>Consider using a password manager to generate and store strong passwords.</li>
            <li>Enable two-factor authentication for added security.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;