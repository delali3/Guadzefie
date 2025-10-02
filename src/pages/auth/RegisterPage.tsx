import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  User
} from 'lucide-react';
import bcrypt from 'bcryptjs'; // You'll need to install this package

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFarm, setIsFarm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form validation
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  const validateFirstName = (name: string) => {
    if (!name.trim()) {
      setFirstNameError('First name is required');
      return false;
    } else {
      setFirstNameError(null);
      return true;
    }
  };

  const validateLastName = (name: string) => {
    if (!name.trim()) {
      setLastNameError('Last name is required');
      return false;
    } else {
      setLastNameError(null);
      return true;
    }
  };

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

  const validateTerms = (agreed: boolean) => {
    if (!agreed) {
      setTermsError('You must agree to the terms and conditions');
      return false;
    } else {
      setTermsError(null);
      return true;
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
    if (firstNameError) validateFirstName(e.target.value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
    if (lastNameError) validateLastName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all form fields
    const isFirstNameValid = validateFirstName(firstName);
    const isLastNameValid = validateLastName(lastName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    const isTermsAgreed = validateTerms(agreeToTerms);

    if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isTermsAgreed) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First check if user with this email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email);

      if (checkError) {
        throw new Error('Error checking existing user');
      }

      if (existingUsers && existingUsers.length > 0) {
        setError('A user with this email already exists');
        setLoading(false);
        return;
      }

      // Hash the password
      // Note: In a production environment, you should hash passwords on the server side
      // This client-side hashing is a simplification
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Generate a verification token
      const verificationToken = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      // Insert the new user
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            is_farm: isFarm,
            is_admin: false,
            is_verified: false,
            verification_token: verificationToken,
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) throw insertError;

      // In a real app, you would send a verification email here
      // For this example, we'll simulate that process

      setSuccess('Registration successful! Please check your email to verify your account.');

      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Error registering:', err);
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-green-600 dark:text-green-400 hover:text-green-500">
              Sign in
            </Link>
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

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    {/* <User className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                  </div>
                  <input
                    id="first-name"
                    name="first-name"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={handleFirstNameChange}
                    required
                    className={`appearance-none relative block w-full px-3 py-3 pl-11 rounded-lg border ${firstNameError
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                      } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="John"
                  />
                </div>
                {firstNameError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{firstNameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    {/* <User className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                  </div>
                  <input
                    id="last-name"
                    name="last-name"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={handleLastNameChange}
                    required
                    className={`appearance-none relative block w-full px-3 py-3 pl-11 rounded-lg border ${lastNameError
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                      } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="Doe"
                  />
                </div>
                {lastNameError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{lastNameError}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  {/* <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`appearance-none relative block w-full px-3 py-3 pl-11 rounded-lg border ${emailError
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

            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setIsFarm(false)}
                  className={`flex items-center justify-center p-4 border ${!isFarm
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200`}
                >
                  <div className="text-center">
                    {/* <User className={`h-6 w-6 mx-auto ${!isFarm ? 'text-green-500' : 'text-gray-400'}`} /> */}
                    <span className={`block mt-2 text-sm font-medium ${!isFarm ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                      Consumer
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setIsFarm(true)}
                  className={`flex items-center justify-center p-4 border ${isFarm
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200`}
                >
                  <div className="text-center">
                    <svg
                      className={`h-6 w-6 mx-auto ${isFarm ? 'text-green-500' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fillRule="evenodd" d="M5.5 17a2.5 2.5 0 01-2.5-2.5V5a2.5 2.5 0 012.5-2.5h2A2.5 2.5 0 0110 5v9.5a2.5 2.5 0 01-2.5 2.5h-2zM15 14.5a2.5 2.5 0 01-2.5 2.5h-.5a2.5 2.5 0 01-2.5-2.5V5A2.5 2.5 0 0112 2.5h.5A2.5 2.5 0 0115 5v9.5z" clipRule="evenodd" />
                    </svg>
                    <span className={`block mt-2 text-sm font-medium ${isFarm ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                      Farm
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Select "Farm" if you're registering as a farm or agricultural producer.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  {/* <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className={`appearance-none relative block w-full px-3 py-3 pl-11 pr-12 rounded-lg border ${passwordError
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                    } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
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
                Confirm password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  {/* <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  className={`appearance-none relative block w-full px-3 py-3 pl-11 pr-12 rounded-lg border ${confirmPasswordError
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                    } shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
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

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms-and-privacy"
                name="terms-and-privacy"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (termsError) validateTerms(e.target.checked);
                }}
                className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded ${termsError ? 'border-red-300 dark:border-red-600' : ''
                  }`}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms-and-privacy" className="font-medium text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-green-600 dark:text-green-400 hover:text-green-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-green-600 dark:text-green-400 hover:text-green-500">
                  Privacy Policy
                </Link>
              </label>
              {termsError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{termsError}</p>
              )}
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
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <ArrowRight className="h-5 w-5 text-green-400 group-hover:text-green-300" aria-hidden="true" />
                </span>
              )}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        {/* Social signup options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or sign up with
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
  );
};

export default RegisterPage;