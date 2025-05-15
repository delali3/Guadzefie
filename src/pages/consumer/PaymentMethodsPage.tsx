import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  ChevronRight, 
  CreditCard, 
  Plus, 
  Trash2, 
  Check,
  AlertCircle
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  user_id: string;
  card_type: string;
  last_four: string;
  expiry_date: string;
  cardholder_name: string;
  is_default: boolean;
  created_at: string;
}

const PaymentMethodsPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('You must be logged in to view payment methods');
        }

        // Check if the payment_methods table exists
        const { error: tableCheckError } = await supabase
          .from('payment_methods')
          .select('count')
          .limit(1);
          
        if (tableCheckError && tableCheckError.code === '42P01') {
          // Table doesn't exist yet, show sample data
          setPaymentMethods(getSamplePaymentMethods());
          return;
        }

        // Fetch payment methods
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setPaymentMethods(data);
        } else {
          // No payment methods found, show sample data
          setPaymentMethods(getSamplePaymentMethods());
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError(err instanceof Error ? err.message : 'Failed to load payment methods');
        // Show sample data even on error
        setPaymentMethods(getSamplePaymentMethods());
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Generate sample payment methods for development/demo
  const getSamplePaymentMethods = (): PaymentMethod[] => {
    return [
      {
        id: '1',
        user_id: 'sample-user',
        card_type: 'Visa',
        last_four: '4242',
        expiry_date: '12/25',
        cardholder_name: 'John Doe',
        is_default: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: 'sample-user',
        card_type: 'Mastercard',
        last_four: '5678',
        expiry_date: '10/24',
        cardholder_name: 'John Doe',
        is_default: false,
        created_at: new Date().toISOString()
      }
    ];
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces every 4 digits
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData(prev => ({
        ...prev,
        [name]: formatted.substring(0, 19) // Limit to 16 digits + 3 spaces
      }));
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      let formatted = value.replace(/\D/g, '');
      if (formatted.length > 2) {
        formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}`;
      }
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else if (name === 'cvv') {
      // Limit CVV to 3-4 digits
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate card number
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 15 || cardNumber.length > 16) {
      errors.cardNumber = 'Card number must be 15-16 digits';
    }
    
    // Validate cardholder name
    if (!formData.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }
    
    // Validate expiry date
    if (!formData.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        errors.expiryDate = 'Enter expiry as MM/YY';
      } else if (
        parseInt(year) < currentYear || 
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        errors.expiryDate = 'Card has expired';
      } else if (parseInt(month) > 12 || parseInt(month) < 1) {
        errors.expiryDate = 'Month must be between 01-12';
      }
    }
    
    // Validate CVV
    if (!formData.cvv) {
      errors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3) {
      errors.cvv = 'CVV must be 3-4 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Determine card type based on first digit
      const firstDigit = formData.cardNumber.replace(/\s/g, '')[0];
      let cardType = 'Unknown';
      
      if (firstDigit === '4') cardType = 'Visa';
      else if (firstDigit === '5') cardType = 'Mastercard';
      else if (firstDigit === '3') cardType = 'American Express';
      else if (firstDigit === '6') cardType = 'Discover';
      
      // In a real app, you would:
      // 1. Send card details to a payment processor (Stripe, PayPal, etc.)
      // 2. Get a token/payment method ID back
      // 3. Store only that token with your backend, never the raw card details
      
      // For demo purposes, we'll just add a new payment method to the state
      const lastFour = formData.cardNumber.replace(/\s/g, '').slice(-4);
      
      const newPaymentMethod: PaymentMethod = {
        id: Date.now().toString(),
        user_id: 'current-user',
        card_type: cardType,
        last_four: lastFour,
        expiry_date: formData.expiryDate,
        cardholder_name: formData.cardholderName,
        is_default: formData.isDefault,
        created_at: new Date().toISOString()
      };
      
      // If this is the default card, update other cards
      let updatedMethods = [...paymentMethods];
      if (formData.isDefault) {
        updatedMethods = updatedMethods.map(method => ({
          ...method,
          is_default: false
        }));
      }
      
      // Add the new method
      setPaymentMethods([...updatedMethods, newPaymentMethod]);
      
      // Clear form and hide it
      setFormData({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        isDefault: false
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    }
  };

  // Handle setting a card as default
  const handleSetDefault = (id: string) => {
    const updatedMethods = paymentMethods.map(method => ({
      ...method,
      is_default: method.id === id
    }));
    
    setPaymentMethods(updatedMethods);
  };

  // Handle deleting a payment method
  const handleDelete = (id: string) => {
    // Find the method to delete
    const methodToDelete = paymentMethods.find(method => method.id === id);
    
    // Remove it from state
    const updatedMethods = paymentMethods.filter(method => method.id !== id);
    
    // If deleting the default card, make another one default
    if (methodToDelete?.is_default && updatedMethods.length > 0) {
      updatedMethods[0].is_default = true;
    }
    
    setPaymentMethods(updatedMethods);
  };

  // Get card icon based on type
  const getCardIcon = (type: string) => {
    return <CreditCard className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 dark:text-white">Payment Methods</span>
      </nav>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Add New Payment Method Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Add Payment Method</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Card Number*
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.cardNumber 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                      } sm:text-sm dark:bg-gray-700 dark:text-white`}
                    />
                    {formErrors.cardNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.cardNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cardholder Name*
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.cardholderName 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                      } sm:text-sm dark:bg-gray-700 dark:text-white`}
                    />
                    {formErrors.cardholderName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.cardholderName}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date*
                      </label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md shadow-sm ${
                          formErrors.expiryDate 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                        } sm:text-sm dark:bg-gray-700 dark:text-white`}
                      />
                      {formErrors.expiryDate && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.expiryDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        CVV*
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md shadow-sm ${
                          formErrors.cvv 
                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                        } sm:text-sm dark:bg-gray-700 dark:text-white`}
                      />
                      {formErrors.cvv && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Set as default payment method
                    </label>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Save Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Payment Methods List */}
          {paymentMethods.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
              <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <CreditCard className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No payment methods</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You haven't added any payment methods yet.
              </p>
              {!showAddForm && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {paymentMethods.map((method) => (
                  <li key={method.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getCardIcon(method.card_type)}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {method.card_type} •••• {method.last_four}
                            </p>
                            {method.is_default && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {method.cardholder_name} • Expires {method.expiry_date}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!method.is_default && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            className="text-sm text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
                          >
                            Set as default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 p-1"
                          aria-label="Delete payment method"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Security Notice */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Secure Payment Processing</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your payment information is processed securely. We do not store your full card details on our servers.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentMethodsPage; 