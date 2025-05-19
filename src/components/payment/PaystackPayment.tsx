// // src/components/payment/PaystackPayment.tsx
// import React, { useState } from 'react';
// import { usePaystackPayment } from 'react-paystack';

// interface PaystackPaymentProps {
//   amount: number;
//   email: string;
//   firstName: string;
//   lastName: string;
//   onSuccess: (reference: string) => void;
//   onClose: () => void;
// }

// const PaystackPayment: React.FC<PaystackPaymentProps> = ({
//   amount,
//   email,
//   firstName,
//   lastName,
//   onSuccess,
//   onClose
// }) => {
//   // Convert amount to kobo (smallest currency unit)
//   const amountInKobo = amount * 100;
  
//   const config = {
//     reference: (new Date()).getTime().toString(),
//     email,
//     amount: amountInKobo, 
//     publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || '',
//     firstname: firstName,
//     lastname: lastName,
//   };
  
//   const initializePayment = usePaystackPayment(config);
  
//   const handlePaymentInit = () => {
//     initializePayment({
//       onSuccess: (reference) => {
//         // Implementation for whatever you want to do after successful payment
//         onSuccess(reference);
//       },
//       onClose
//     });
//   };

//   return (
//     <div className="mt-4">
//       <button
//         onClick={handlePaymentInit}
//         className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//       >
//         Pay with Paystack
//       </button>
//     </div>
//   );
// };

// export default PaystackPayment;

import React, { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useProducts } from '../../contexts/ProductContext';
import { AlertCircle } from 'lucide-react';

interface PaystackPaymentProps {
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  onError?: (error: any) => void;
  currency?: string;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  amount,
  email,
  firstName,
  lastName,
  onSuccess,
  onClose,
  onError,
  currency = 'NGN'
}) => {
  const { state } = useProducts();
  const [isProcessing, setIsProcessing] = useState(false);
  const [publicKey, setPublicKey] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Convert amount to kobo (smallest currency unit)
  const amountInKobo = Math.round(amount * 100);
  
  useEffect(() => {
    // Get Paystack public key
    const getKey = async () => {
      try {
        const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!key) {
          const error = 'Paystack public key is missing. Please check your .env file.';
          setLocalError(error);
          console.error(error);
          onError?.({ message: 'Payment configuration error. Please contact support.' });
          return;
        }
        setPublicKey(key);
      } catch (err) {
        const errorMsg = 'Failed to initialize payment system.';
        setLocalError(errorMsg);
        console.error(errorMsg, err);
        onError?.({ message: errorMsg });
      }
    };
    
    getKey();
  }, [onError]);
  
  const validatePayment = () => {
    if (!publicKey) {
      const error = 'Payment gateway not properly configured.';
      setLocalError(error);
      onError?.({ message: error });
      return false;
    }
    
    if (state.cart.length === 0) {
      const error = 'Your cart is empty. Please add items before checkout.';
      setLocalError(error);
      onError?.({ message: error });
      return false;
    }
    
    if (!email || !email.includes('@')) {
      const error = 'A valid email address is required for payment.';
      setLocalError(error);
      onError?.({ message: error });
      return false;
    }
    
    if (amount <= 0) {
      const error = 'Invalid payment amount.';
      setLocalError(error);
      onError?.({ message: error });
      return false;
    }
    
    setLocalError(null);
    return true;
  };
  
  const config = {
    reference: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email,
    amount: amountInKobo, 
    publicKey,
    firstname: firstName,
    lastname: lastName,
    currency: currency,
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
    metadata: {
      cart_items: state.cart.length,
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: `${firstName} ${lastName}`
        }
      ]
    }
  };
  
  const initializePayment = usePaystackPayment(config);
  
  const handlePaymentInit = () => {
    setLocalError(null);
    
    if (!validatePayment()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // The react-paystack library only supports onSuccess and onClose callbacks
      initializePayment({
        onSuccess: (reference) => {
          setIsProcessing(false);
          setLocalError(null);
          console.log("Payment successful! Reference:", reference);
          onSuccess(reference);
        },
        onClose: () => {
          setIsProcessing(false);
          const errorMsg = "Payment was cancelled. Please try again.";
          setLocalError(errorMsg);
          console.log("Payment closed:", errorMsg);
          onClose();
          // Optionally report cancellation as an error to the parent component
          onError?.({ message: errorMsg, type: 'cancel' });
        }
      });
    } catch (err) {
      setIsProcessing(false);
      const errorMsg = err instanceof Error ? err.message : 'Payment initialization failed';
      setLocalError(errorMsg);
      console.error('Error initializing payment:', err);
      onError?.({ message: errorMsg });
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {localError && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{localError}</p>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handlePaymentInit}
        disabled={isProcessing || !publicKey}
        className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
          isProcessing || !publicKey ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
      >
        {isProcessing ? (
          <>
            <span className="mr-3 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            Processing Payment...
          </>
        ) : !publicKey ? (
          'Payment Gateway Unavailable'
        ) : (
          'Pay with Paystack'
        )}
      </button>
      
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        By clicking the button above, you'll be redirected to Paystack's secure payment page to complete your transaction.
      </p>
    </div>
  );
};

export default PaystackPayment;