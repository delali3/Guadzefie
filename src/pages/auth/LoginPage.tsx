// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  ShoppingBag
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form validation
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
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
  
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError(null);
      return true;
    }
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const {error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Successful login
      setSuccess('Login successful! Redirecting...');
      
      // If "remember me" is checked, extend session
      if (rememberMe) {
        // This would typically set a longer expiry on the session
        console.log('Remember me enabled');
      }
      
      // Navigate to the previous page or home
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
      
    } catch (err) {
      console.error('Error logging in:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDemoLogin = async () => {
    setEmail('demo@example.com');
    setPassword('demo123456');
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Simulate API call delay
    setTimeout(async () => {
      try {
        // In a real app, you would uncomment this to use actual auth
        // const { data, error } = await supabase.auth.signInWithPassword({
        //   email: 'demo@example.com',
        //   password: 'demo123456'
        // });
        // 
        // if (error) throw error;
        
        // For demo purposes, we'll just pretend login was successful
        setSuccess('Demo login successful! Redirecting...');
        
        // Navigate to the previous page or home
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1500);
        
      } catch (err) {
        console.error('Error with demo login:', err);
        setError(err instanceof Error ? err.message : 'Failed to sign in with demo account.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8"> 
        <div className="max-w-md w-full">
          <div className="md:hidden flex items-center justify-center mb-8">
            <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">YourStore</span>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to your account</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Or{' '}
              <Link to="/register" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500">
                create a new account
              </Link>
            </p>
          </div>
          
          {/* Success message */}
          {success && (
            <div className="mt-6 rounded-lg bg-green-50 dark:bg-green-900/30 p-4 shadow-sm">
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
            <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/30 p-4 shadow-sm">
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
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className={`appearance-none block w-full px-3 py-3 pl-10 rounded-lg border ${
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
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className="space-y-3">
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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Try Demo Account
              </button>
            </div>
          </form>
          
          {/* Social login options */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="h-5 w-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;