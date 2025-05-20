import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, refreshSupabaseHeaders } from '../../lib/supabase';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import bcrypt from 'bcryptjs';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== LOGIN ATTEMPT STARTED ===");

    if (!email || !password) {
      setError('Please enter your email and password');
      console.log("Login error: Missing email or password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Attempting to find user with email:", email);

      // Find user with this email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      console.log("Query result:", { 
        userFound: !!user, 
        error: userError ? userError.message : 'none'
      });

      if (userError) {
        console.error("User query error:", userError);
        throw new Error('Invalid email or password');
      }

      if (!user) {
        console.error("No user found");
        throw new Error('Invalid email or password');
      }

      // For testing - auto-verify users
      if (!user.is_verified) {
        console.log("User not verified, auto-verifying for testing");

        const { error: updateError } = await supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', user.id);

        if (updateError) {
          console.error("Verification update error:", updateError);
          throw updateError;
        }

        // Update the user object with verified status
        user.is_verified = true;
      }

      console.log("Comparing password");
      // Compare passwords
      // Check if password_hash field exists before comparing
      if (!user.password_hash) {
        console.error("User has no password hash in database!");
        throw new Error('Account setup incomplete. Please contact support.');
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      console.log("Password valid:", isPasswordValid);

      if (!isPasswordValid) {
        console.error("Invalid password");
        throw new Error('Invalid email or password');
      }

      // Create a session
      const sessionData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_farm: user.is_farm,
        is_admin: user.is_admin || false,
        created_at: user.created_at,
        token: `fake-token-${user.id}` // Add a token for auth headers
      };

      console.log("Setting session data in localStorage:", {
        userId: sessionData.id,
        email: sessionData.email,
        is_farm: sessionData.is_farm,
        is_admin: sessionData.is_admin
      });
      
      try {
        // First clear any existing data
        localStorage.removeItem('user');
        
        // Then set the new data
        localStorage.setItem('user', JSON.stringify(sessionData));
        
        // Refresh Supabase headers with the new user data
        refreshSupabaseHeaders();
        
        // Verify that data was stored correctly
        const storedData = localStorage.getItem('user');
        console.log("Verification - data stored in localStorage:", !!storedData);
        
        if (!storedData) {
          console.error("Failed to store user data in localStorage!");
          throw new Error('Failed to create session. Please ensure cookies/localStorage are enabled.');
        }
        
        // Verify the stored data can be parsed correctly
        try {
          const parsedData = JSON.parse(storedData);
          if (!parsedData || !parsedData.id) {
            console.error("Stored user data is invalid:", parsedData);
            throw new Error('Session data was corrupted. Please try again.');
          }
          console.log("User data successfully verified in localStorage");
        } catch (parseError) {
          console.error("Failed to parse stored user data:", parseError);
          throw new Error('Session data is invalid. Please clear your browser cache and try again.');
        }
      } catch (storageError) {
        console.error("Error storing user in localStorage:", storageError);
        throw new Error(storageError instanceof Error ? 
          `Failed to create session: ${storageError.message}` : 
          'Failed to create session. Please try again.');
      }

      // Redirect based on user type
      console.log("Redirecting user based on type:", user.is_farm);
      if (user.is_farm) {
        navigate('/farm/dashboard');
      } else {
        navigate('/consumer/dashboard');
      }
      
      console.log("=== LOGIN COMPLETED SUCCESSFULLY ===");

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleTestLogin = async () => {
    console.log("=== TEST LOGIN ATTEMPT ===");
    
    try {
      // Create a test user session directly
      const testUser = {
        id: "test-user-id",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        is_farm: false,
        is_admin: false,
        created_at: new Date().toISOString()
      };
      
      console.log("Setting test user data in localStorage");
      localStorage.setItem('user', JSON.stringify(testUser));
      
      // Verify storage worked
      const stored = localStorage.getItem('user');
      console.log("Verification - test user stored:", !!stored);
      
      if (!stored) {
        console.error("Failed to store test user in localStorage");
        alert("localStorage test failed - browser may be blocking storage");
        return;
      }
      
      // Clear data and redirect
      console.log("Test login successful, redirecting...");
      alert("Test login successful! Redirecting to dashboard...");
      navigate('/consumer/dashboard');
    } catch (error) {
      console.error("Test login error:", error);
      alert(`Test login failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const checkLocalStorage = () => {
    console.log("=== CHECKING LOCALSTORAGE ===");
    try {
      // Test writing to localStorage
      localStorage.setItem('test-key', 'test-value');
      const testValue = localStorage.getItem('test-key');
      localStorage.removeItem('test-key');
      
      // Check if localStorage is working
      if (testValue !== 'test-value') {
        console.error("localStorage test failed - value didn't match");
        alert("localStorage test failed - browser may be corrupting data");
        return false;
      }
      
      // Check if we're in private/incognito mode
      let inPrivateMode = false;
      try {
        // Try to use localStorage quota as a detection method
        const storage = window.localStorage;
        const testString = 'a'.repeat(10485760); // 10MB string
        storage.clear();
        storage.setItem('test', testString);
        storage.removeItem('test');
      } catch (e) {
        // If storage quota is exceeded, we might be in private mode
        inPrivateMode = true;
      }
      
      if (inPrivateMode) {
        console.warn("Browser may be in private/incognito mode");
        alert("Your browser appears to be in private/incognito mode. This can cause login issues.");
      }
      
      // Check existing user data
      const existingUser = localStorage.getItem('user');
      console.log("Existing user data in localStorage:", !!existingUser);
      if (existingUser) {
        try {
          const userData = JSON.parse(existingUser);
          console.log("User data parse successful:", {
            id: userData.id, 
            email: userData.email
          });
        } catch (e) {
          console.error("Failed to parse existing user data:", e);
          alert("Your stored login data is corrupted. Please clear your browser data and try again.");
          return false;
        }
      }
      
      console.log("localStorage appears to be working correctly");
      alert("localStorage is working correctly. No issues detected.");
      return true;
    } catch (error) {
      console.error("localStorage check error:", error);
      alert(`localStorage error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
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
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500">
              Create one
            </Link>
          </p>
        </div>

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

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white dark:bg-gray-800 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 pl-10 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white dark:bg-gray-800 sm:text-sm"
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
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Social login options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
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

        {/* Development Tools */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Development Tools</p>
            <button
              type="button"
              onClick={handleTestLogin}
              className="inline-flex items-center px-3 py-2 border border-yellow-300 dark:border-yellow-700 shadow-sm text-sm font-medium rounded text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200"
            >
              Test Login (Bypass Auth)
            </button>
            <button
              type="button"
              onClick={checkLocalStorage}
              className="ml-2 inline-flex items-center px-3 py-2 border border-blue-300 dark:border-blue-700 shadow-sm text-sm font-medium rounded text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200"
            >
              Check localStorage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;