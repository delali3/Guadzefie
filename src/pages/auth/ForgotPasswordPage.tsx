// src/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowRight, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form validation
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!re.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError(null);
      return true;
    }
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the email
    const isEmailValid = validateEmail(email);
    
    if (!isEmailValid) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use Supabase's password reset functionality
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      // Successful password reset request
      setSuccess(`Password reset link sent to ${email}. Please check your email inbox.`);
      
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError(err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.');
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
            Reset your password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
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
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`appearance-none block w-full px-3 py-3 pl-12 rounded-lg border ${
                    emailError
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                  } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="you@example.com"
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
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
              {loading ? 'Sending reset link...' : 'Send password reset link'}
            </button>
          </div>
        </form>
        
        <div className="flex justify-center mt-4">
          <Link to="/login" className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
        
        {/* Additional information */}
        {success && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Next steps:</h3>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-5 list-disc">
              <li>Check your email inbox for the password reset link.</li>
              <li>If you don't see it, check your spam or junk folder.</li>
              <li>The link will expire after 24 hours.</li>
              <li>If you need help, please contact our support team.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;