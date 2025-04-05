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