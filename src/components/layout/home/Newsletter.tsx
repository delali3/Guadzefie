import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Mail, CheckCircle, CloudRain, Sun } from 'lucide-react';

interface NewsletterProps {
  onSubscribe?: (email: string) => Promise<void>;
  title?: string;
  description?: string;
  successMessage?: string;
  className?: string;
}

const Newsletter: React.FC<NewsletterProps> = ({
  onSubscribe,
  title = 'Join Our Farming Community',
  description = 'Subscribe to receive weekly farming tips, market prices, weather forecasts, and agricultural insights to improve your crops and business.',
  successMessage = 'You\'ve been added to our farming community. We\'ll keep you updated with farming tips, market prices, and weather forecasts.',
  className = '',
}) => {
  const [email, setEmail] = useState<string>('');
  const [region, setRegion] = useState<string>('Eastern Region');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handleRegionChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setRegion(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (onSubscribe) {
        await onSubscribe(email);
      } else {
        // Simulate API call if no handler provided
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-lg border border-green-100 dark:border-gray-700 max-w-lg mx-auto ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
          {isSubmitted ? (
            <CloudRain size={24} className="text-green-600 dark:text-green-400" />
          ) : (
            <Mail size={24} className="text-green-600 dark:text-green-400" />
          )}
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {isSubmitted ? 'Thanks for joining our community!' : title}
      </h2>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
        {isSubmitted ? successMessage : description}
      </p>
      
      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col gap-3">
            <div className="relative flex-grow">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Your email address"
                className={`w-full px-4 py-3 text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 
                  bg-gray-100 dark:bg-gray-700 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                  transition-all duration-200`}
                required
                aria-label="Email address"
                aria-invalid={error ? 'true' : 'false'}
              />
            </div>
            
            <div className="relative flex-grow">
              <select
                value={region}
                onChange={handleRegionChange}
                className={`w-full px-4 py-3 text-base text-gray-900 dark:text-gray-100 
                  bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                  transition-all duration-200`}
                aria-label="Your farming region"
              >
                <option value="Eastern Region">Eastern Region</option>
                <option value="Central Region">Central Region</option>
                <option value="Western Region">Western Region</option>
                <option value="Ashanti Region">Ashanti Region</option>
                <option value="Northern Region">Northern Region</option>
                <option value="Upper East Region">Upper East Region</option>
                <option value="Upper West Region">Upper West Region</option>
                <option value="Volta Region">Volta Region</option>
                <option value="Greater Accra">Greater Accra</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${isLoading 
                  ? 'bg-green-400 cursor-wait' 
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'} 
                text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
              aria-busy={isLoading}
            >
              {isLoading ? 'Subscribing...' : 'Subscribe for Updates'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            You'll receive region-specific farming updates and weather forecasts. Unsubscribe anytime.
          </p>
        </form>
      ) : (
        <div>
          <div className="flex items-center justify-center text-green-500 dark:text-green-400 mt-2 mb-4">
            <CheckCircle size={20} className="mr-2" />
            <span>Successfully subscribed</span>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sun size={20} className="text-yellow-500" />
              <CloudRain size={20} className="text-blue-500" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You'll now receive {region}-specific farming advice, weather alerts, and market updates to help improve your agricultural business.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Newsletter;