// src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../contexts/ProductContext';
import { useShippingAddresses, ShippingAddress } from '../contexts/ShippingAddressContext';
import ShippingAddressManager from '../components/shipping/ShippingAddressManager';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Lock,
  AlertCircle
} from 'lucide-react';
import PaystackPayment from '../components/payment/PaystackPayment';

interface CartProduct {
  id: number;
  name: string;
  price: number;
  image_url: string;
  discount_percentage?: number;
  sku?: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, clearCart } = useProducts();
  const { state: addressState } = useShippingAddresses();
  const [cartProducts, setCartProducts] = useState<{ [key: number]: CartProduct }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Form states
  const [activeStep, setActiveStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    saveAddress: false,
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    nameOnCard: '',
    expiryDate: '',
    cvv: '',
    saveCard: false,
  });
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('standard');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('credit-card');
  
  // Validation states
  const [shippingErrors, setShippingErrors] = useState<{[key: string]: string}>({});
  const [paymentErrors, setPaymentErrors] = useState<{[key: string]: string}>({});
  
  // Shipping methods
  const shippingMethods: ShippingMethod[] = [
    {
      id: 'economy',
      name: 'Economy Shipping',
      description: 'Slower but budget-friendly option',
      price: 3.99,
      estimatedDays: '5-7 business days'
    },
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: 'The most popular option',
      price: 5.99,
      estimatedDays: '3-5 business days'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: 'Fastest delivery option available',
      price: 12.99,
      estimatedDays: '1-2 business days'
    }
  ];
  
  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit-card',
      name: 'Credit / Debit Card',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'paystack',
      name: 'Paystack',
      icon: <Lock className="w-5 h-5" />
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <div className="text-blue-600 font-bold text-sm">PayPal</div>
    },
    {
      id: 'apple-pay',
      name: 'Apple Pay',
      icon: <div className="text-black dark:text-white font-bold text-sm">Apple Pay</div>
    }
  ];

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch product details for cart items
  useEffect(() => {
    const fetchCartProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Redirect to cart if empty
        if (state.cart.length === 0 && !orderComplete) {
          navigate('/cart');
          return;
        }
        
        // Get all product IDs from cart
        const productIds = state.cart.map(item => item.product_id);
        
        // Fetch products data from Supabase
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, discount_percentage, sku')
          .in('id', productIds);
          
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setError('Could not find products in your cart');
          return;
        }
        
        // Transform array to object for easier lookup
        const productsMap = data.reduce((acc, product) => {
          acc[product.id] = product as CartProduct;
          return acc;
        }, {} as { [key: number]: CartProduct });
        
        setCartProducts(productsMap);
      } catch (err) {
        console.error('Error fetching cart products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cart products');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCartProducts();
  }, [state.cart, navigate, orderComplete]);

  // Calculate cart totals
  const calculateCartTotals = () => {
    let subtotal = 0;
    
    state.cart.forEach(item => {
      const product = cartProducts[item.product_id];
      if (product) {
        const itemPrice = product.discount_percentage
          ? product.price * (1 - (product.discount_percentage / 100))
          : product.price;
        subtotal += itemPrice * item.quantity;
      }
    });
    
    const selectedMethod = shippingMethods.find(method => method.id === selectedShippingMethod);
    const shipping = selectedMethod ? selectedMethod.price : shippingMethods[1].price;
    
    const tax = subtotal * 0.08; // Assuming 8% tax
    const total = subtotal + tax + shipping;
    
    return {
      subtotal,
      tax,
      shipping,
      total
    };
  };

  // Handle shipping form changes
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setShippingInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field if it exists
    if (shippingErrors[name]) {
      setShippingErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle address selection
  const handleAddressSelect = (address: ShippingAddress) => {
    // Only update if the address data actually changed
    if (
      shippingInfo.firstName !== address.first_name ||
      shippingInfo.lastName !== address.last_name ||
      shippingInfo.phone !== address.phone ||
      shippingInfo.address !== address.address_line1 ||
      shippingInfo.city !== address.city ||
      shippingInfo.state !== address.state ||
      shippingInfo.postalCode !== address.postal_code ||
      shippingInfo.country !== address.country
    ) {
      setShippingInfo({
        firstName: address.first_name,
        lastName: address.last_name,
        email: shippingInfo.email, // Preserve existing email
        phone: address.phone,
        address: address.address_line1,
        city: address.city,
        state: address.state,
        postalCode: address.postal_code,
        country: address.country,
        saveAddress: false, // Already saved
      });
    }
  };

  // Handle payment form changes
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? e.target.checked : undefined;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentInfo(prev => ({
        ...prev,
        [name]: formatted.slice(0, 19) // limit to 16 digits + 3 spaces
      }));
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      let formatted = value.replace(/\D/g, '');
      if (formatted.length > 2) {
        formatted = `${formatted.slice(0, 2)}/${formatted.slice(2, 4)}`;
      }
      setPaymentInfo(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else if (name === 'cvv') {
      // Limit CVV to 3-4 digits
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setPaymentInfo(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setPaymentInfo(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error for this field if it exists
    if (paymentErrors[name]) {
      setPaymentErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate shipping form
  const validateShippingForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!shippingInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!shippingInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!shippingInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      errors.email = 'Email is invalid';
    }
    if (!shippingInfo.phone.trim()) errors.phone = 'Phone number is required';
    if (!shippingInfo.address.trim()) errors.address = 'Address is required';
    if (!shippingInfo.city.trim()) errors.city = 'City is required';
    if (!shippingInfo.state.trim()) errors.state = 'State is required';
    if (!shippingInfo.postalCode.trim()) errors.postalCode = 'Postal code is required';
    
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate payment form
  const validatePaymentForm = () => {
    // Skip validation if not using credit card
    if (selectedPaymentMethod !== 'credit-card') return true;
    
    const errors: {[key: string]: string} = {};
    
    const cardNumber = paymentInfo.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 15) {
      errors.cardNumber = 'Card number is invalid';
    }
    
    if (!paymentInfo.nameOnCard.trim()) errors.nameOnCard = 'Name on card is required';
    
    if (!paymentInfo.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = paymentInfo.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of year
      const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
      
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        errors.expiryDate = 'Enter expiry as MM/YY';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      } else if (parseInt(month) > 12 || parseInt(month) < 1) {
        errors.expiryDate = 'Month is invalid';
      }
    }
    
    if (!paymentInfo.cvv) {
      errors.cvv = 'CVV is required';
    } else if (paymentInfo.cvv.length < 3) {
      errors.cvv = 'CVV is invalid';
    }
    
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for each step
  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate shipping form
    if (!validateShippingForm()) return;
    
    // Save address if requested and user is authenticated
    if (shippingInfo.saveAddress && isAuthenticated) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if the shipping_addresses table exists
          const { error: tableError } = await supabase
            .from('shipping_addresses')
            .select('count')
            .limit(1);
            
          if (tableError && tableError.code === '42P01') {
            // Table doesn't exist yet, we need to create it first
            console.warn('Shipping addresses table does not exist yet. Cannot save address.');
            // You would typically handle this with a notification to the user
          } else {
            // Table exists, proceed with insert
            await supabase.from('shipping_addresses').insert([{
              user_id: user.id,
              first_name: shippingInfo.firstName,
              last_name: shippingInfo.lastName,
              address: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.postalCode,
              country: shippingInfo.country,
              phone: shippingInfo.phone,
              is_default: addressState.addresses.length === 0, // Make default if first address
            }]);
          }
        }
      } catch (error) {
        console.error('Error saving address:', error);
      }
    }
    
    setActiveStep('payment');
    window.scrollTo(0, 0);
  };

  const handleContinueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePaymentForm()) {
      setActiveStep('review');
      window.scrollTo(0, 0);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setProcessingOrder(true);
      console.log('Placing order...');
      
      // Create a unique order number - use numeric ID for database
      const randomOrderNum = Math.floor(Math.random() * 1000000) + 1000;
      const orderIdString = `ORD-${randomOrderNum}`;
      
      // Get the user ID from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error("You must be logged in to place an order");
      }
      
      const user = JSON.parse(storedUser);
      if (!user || !user.id) {
        throw new Error("Invalid user session. Please log in again.");
      }
      
      // Calculate cart totals
      const { total } = calculateCartTotals();
      
      // Create order in database
      const { data: _orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderIdString,
          status: 'Processing',
          total_amount: total,
          shipping_address: {
            address: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            postal_code: shippingInfo.postalCode,
            country: shippingInfo.country
          },
          payment_method: selectedPaymentMethod,
          created_at: new Date().toISOString()
        });
        
      if (orderError) {
        console.error("Error creating order:", orderError);
        setProcessingOrder(true);
        setError(null);
        setPaymentError(null);
        
        try {
          if (selectedPaymentMethod === 'paystack') {
            // For Paystack, we don't clear the cart here
            // The cart will be cleared only after successful payment
            setActiveStep('payment');
            return;
          }

          // For other payment methods, proceed with normal order placement
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create a unique order number - use numeric ID for database
          const randomOrderNum = Math.floor(Math.random() * 1000000) + 1000;
          const orderIdString = `ORD-${randomOrderNum}`;
          setOrderNumber(orderIdString);
          
          // Get the user ID from localStorage
          const storedUser = localStorage.getItem('user');
          if (!storedUser) {
            throw new Error("You must be logged in to place an order");
          }
          
          const user = JSON.parse(storedUser);
          if (!user || !user.id) {
            throw new Error("Invalid user session. Please log in again.");
          }
          
          // Format the shipping address
          const shippingAddressData = {
            address: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            postal_code: shippingInfo.postalCode,
            country: shippingInfo.country
          };
          
          // Insert order into the database
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([
              {
                id: randomOrderNum, // Use the numeric ID for database
                user_id: user.id,
                order_number: orderIdString, // Store string version as order_number
                status: 'Processing',
                total_amount: total,
                shipping_address: shippingAddressData,
                payment_method: selectedPaymentMethod,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();
            
          if (orderError) {
            console.error("Error creating order:", orderError);
            throw new Error("Failed to create order. Please try again.");
          }
          
          console.log("Order created:", orderData);
          
          // Save each order item
          const orderItems = state.cart.map(item => {
            const product = cartProducts[item.product_id];
            const price = product.discount_percentage
              ? product.price * (1 - (product.discount_percentage / 100))
              : product.price;
            return {
              order_id: randomOrderNum, // Use numeric ID here
              product_id: item.product_id,
              quantity: item.quantity,
              price_per_unit: price,
              subtotal: price * item.quantity
            };
          });
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
            
          if (itemsError) {
            console.error("Error creating order items:", itemsError);
            // Don't throw here, as the order is already created
          }
          
          // Save shipping address if requested and user is authenticated
          if (shippingInfo.saveAddress && isAuthenticated) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              
              if (user) {
                // Check if the address already exists
                const { data: existingAddresses, error: checkError } = await supabase
                  .from('shipping_addresses')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('address', shippingInfo.address);
                  
                if (checkError) {
                  console.error('Error checking existing addresses:', checkError);
                } else if (!existingAddresses || existingAddresses.length === 0) {
                  // Address doesn't exist, save it
                  await supabase.from('shipping_addresses').insert([{
                    user_id: user.id,
                    first_name: shippingInfo.firstName,
                    last_name: shippingInfo.lastName,
                    address: shippingInfo.address,
                    city: shippingInfo.city,
                    state: shippingInfo.state,
                    postal_code: shippingInfo.postalCode,
                    country: shippingInfo.country,
                    phone: shippingInfo.phone,
                    is_default: addressState.addresses.length === 0, // Make default if first address
                  }]);
                }
              }
            } catch (error) {
              console.error('Error saving address:', error);
            }
          }
          
          // Clear the cart only after successful order placement
          clearCart();
          
          setOrderComplete(true);
          window.scrollTo(0, 0);
        } catch (err) {
          console.error('Error placing order:', err);
          setError(err instanceof Error ? err.message : 'Failed to process your order. Please try again.');
        } finally {
          setProcessingOrder(false);
        }
      } else {
        try {
          if (selectedPaymentMethod === 'paystack') {
            // For Paystack, we don't clear the cart here
            // The cart will be cleared only after successful payment
            setActiveStep('payment');
            return;
          }
          
          // For other payment methods, we would handle payment processing here
          // But for now, we simply consider the order as complete
          
          setOrderComplete(true);
          clearCart();
          window.scrollTo(0, 0);
        } catch (err) {
          console.error('Error verifying payment:', err);
          setPaymentError(err instanceof Error ? err.message : 'Failed to verify payment. Please contact support.');
        } finally {
          setProcessingOrder(false);
        }
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  const handlePaystackSuccess = async (reference: string) => {
    setProcessingOrder(true);
    try {
      // Here you would typically verify the payment with your backend
      // For now, we'll simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a unique order number - use numeric ID for database
      const randomOrderNum = Math.floor(Math.random() * 1000000) + 1000;
      const orderIdString = `ORD-${randomOrderNum}`;
      setOrderNumber(orderIdString);
      
      // Get the user ID from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error("You must be logged in to place an order");
      }
      
      const user = JSON.parse(storedUser);
      if (!user || !user.id) {
        throw new Error("Invalid user session. Please log in again.");
      }
      
      // Format the shipping address
      const shippingAddressData = {
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.postalCode,
        country: shippingInfo.country
      };
      
      // Check if payment_reference column exists in orders table
      try {
        // First, check if we can safely include payment_reference
        const { error: checkError } = await supabase
          .from('orders')
          .select('id')
          .limit(1);
  
        // Create the order data object
        const orderDataObj = {
          id: randomOrderNum, // Use numeric ID for database
          user_id: user.id,
          order_number: orderIdString, // Store string version as order_number
          status: 'Processing',
          total_amount: total,
          shipping_address: shippingAddressData,
          payment_method: 'Paystack',
          created_at: new Date().toISOString()
        };
  
        // If no error during select, try to add payment_reference
        if (!checkError) {
          try {
            // Try to include payment_reference in a safe way
            // Insert order into the database with payment_reference
            const { data: orderWithRef, error: orderWithRefError } = await supabase
              .from('orders')
              .insert([{
                ...orderDataObj,
                payment_reference: reference
              }])
              .select()
              .single();
              
            if (!orderWithRefError) {
              console.log("Order created with payment reference:", orderWithRef);
            } else if (orderWithRefError.code === 'PGRST204') {
              // Column doesn't exist, insert without it
              const { data: orderNoRef, error: orderNoRefError } = await supabase
                .from('orders')
                .insert([orderDataObj])
                .select()
                .single();
                
              if (orderNoRefError) {
                throw orderNoRefError;
              }
              console.log("Order created without payment reference:", orderNoRef);
            } else {
              throw orderWithRefError;
            }
          } catch (err) {
            // Fall back to inserting without payment_reference
            console.error("Error inserting order with reference, trying without:", err);
            const { data: _orderResult, error: orderError } = await supabase
              .from('orders')
              .insert([orderDataObj])
              .select()
              .single();
              
            if (orderError) throw orderError;
          }
        } else {
          // Insert order into the database without payment_reference
          const { data: _orderResult, error: orderError } = await supabase
            .from('orders')
            .insert([orderDataObj])
            .select()
            .single();
            
          if (orderError) throw orderError;
          console.log("Order created:", _orderResult);
        }
      } catch (err) {
        console.error("Error creating order:", err);
        throw new Error("Failed to create order. Please try again.");
      }
      
      // Save payment reference separately (for debugging/tracking)
      console.log("Paystack payment reference:", reference);
      
      // Try to save payment reference to user_metadata 
      try {
        await supabase.auth.updateUser({
          data: { 
            last_payment_reference: reference,
            last_order_id: randomOrderNum,
            last_order_number: orderIdString
          }
        });
      } catch (err) {
        // Non-critical error, just log it
        console.error("Could not save payment reference to user metadata:", err);
      }
      
      // Save each order item
      try {
        const orderItems = state.cart.map(item => {
          const product = cartProducts[item.product_id];
          const price = product.discount_percentage
            ? product.price * (1 - (product.discount_percentage / 100))
            : product.price;
          return {
            order_id: randomOrderNum, // Use numeric ID here
            product_id: item.product_id,
            quantity: item.quantity,
            price_per_unit: price,
            subtotal: price * item.quantity
          };
        });
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) {
          console.error("Error creating order items:", itemsError);
          // Don't throw here, as the order is already created
        }
      } catch (err) {
        console.error("Error saving order items:", err);
        // Not throwing here since the order was created successfully
      }
      
      // Save shipping address if requested and user is authenticated
      if (shippingInfo.saveAddress && isAuthenticated) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Check if the address already exists
            const { data: existingAddresses, error: checkError } = await supabase
              .from('shipping_addresses')
              .select('*')
              .eq('user_id', user.id)
              .eq('address', shippingInfo.address);
              
            if (checkError) {
              console.error('Error checking existing addresses:', checkError);
            } else if (!existingAddresses || existingAddresses.length === 0) {
              // Address doesn't exist, save it
              await supabase.from('shipping_addresses').insert([{
                user_id: user.id,
                first_name: shippingInfo.firstName,
                last_name: shippingInfo.lastName,
                address: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                postal_code: shippingInfo.postalCode,
                country: shippingInfo.country,
                phone: shippingInfo.phone,
                is_default: addressState.addresses.length === 0, // Make default if first address
              }]);
            }
          }
        } catch (error) {
          console.error('Error saving address:', error);
          // Not throwing error here, as this is non-critical
        }
      }
      
      // Clear the cart only after successful payment verification
      clearCart();
      
      setOrderComplete(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error verifying payment:', err);
      setPaymentError(err instanceof Error ? err.message : 'Failed to verify payment. Please contact support.');
    } finally {
      setProcessingOrder(false);
    }
  };

  // const _handlePaystackError = (error: any) => {
  //   console.error('Paystack payment error:', error);
  //   setPaymentError(error.message || 'Payment failed. Please try again.');
  // };

  // Go back to previous step
  const handleGoBack = () => {
    if (activeStep === 'payment') {
      setActiveStep('shipping');
    } else if (activeStep === 'review') {
      setActiveStep('payment');
    }
    window.scrollTo(0, 0);
  };

  // Loading state
  if (isLoading && !orderComplete) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    onClick={() => navigate('/cart')}
                    className="bg-red-50 dark:bg-red-900 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800"
                  >
                    Return to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get cart totals
  const { subtotal, tax, shipping, total } = calculateCartTotals();
  
  // Order success state
  if (orderComplete) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Order Placed Successfully!</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Order Number:</span> {orderNumber}
            </p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Order Total:</span>₵{total.toFixed(2)}
            </p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Shipping Address:</span> {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}
            </p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Estimated Delivery:</span> {shippingMethods.find(m => m.id === selectedShippingMethod)?.estimatedDays}
            </p>
          </div>
          
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            You will receive an email confirmation shortly at <span className="font-medium">{shippingInfo.email}</span>
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Continue Shopping
            </Link>
            <Link
              to="/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              View Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete your purchase by providing the necessary information below.
        </p>
      </div>
      
      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-between">
            <div className={`px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium ${
              activeStep === 'shipping' || activeStep === 'payment' || activeStep === 'review'
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeStep === 'shipping' || activeStep === 'payment' || activeStep === 'review'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                {activeStep === 'shipping' ? '1' : <Check className="h-5 w-5" />}
              </div>
              <span className="mt-2 inline-block">Shipping</span>
            </div>
            
            <div className={`px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium ${
              activeStep === 'payment' || activeStep === 'review'
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeStep === 'payment' || activeStep === 'review'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                {activeStep === 'payment' ? '2' : activeStep === 'review' ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <span className="mt-2 inline-block">Payment</span>
            </div>
            
            <div className={`px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium ${
              activeStep === 'review'
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeStep === 'review'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                3
              </div>
              <span className="mt-2 inline-block">Review</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Main Checkout Form */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {/* Shipping Information */}
            {activeStep === 'shipping' && (
              <form onSubmit={handleContinueToPayment}>
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Shipping Information</h3>
                </div>
                
                <div className="px-6 py-5 space-y-6">
                  {/* Shipping Address Manager for authenticated users */}
                  {isAuthenticated && (
                    <div className="mb-6">
                      <ShippingAddressManager 
                        onAddressSelect={handleAddressSelect}
                        initialAddress={{
                          first_name: shippingInfo.firstName,
                          last_name: shippingInfo.lastName,
                          address_line1: shippingInfo.address,
                          city: shippingInfo.city,
                          state: shippingInfo.state,
                          postal_code: shippingInfo.postalCode,
                          country: shippingInfo.country,
                          phone: shippingInfo.phone
                        }}
                      />
                      
                      {/* Always show email field for authenticated users */}
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                          Contact Information
                        </h4>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address*
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={shippingInfo.email}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.email 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.email && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Manual address form if no addresses are selected */}
                      {!addressState.selectedAddressId && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                            Shipping Address
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                            <div>
                              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                First Name*
                              </label>
                              <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={shippingInfo.firstName}
                                onChange={handleShippingChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                  shippingErrors.firstName 
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                              />
                              {shippingErrors.firstName && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.firstName}</p>
                              )}
                            </div>
                            
                            <div>
                              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Last Name*
                              </label>
                              <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={shippingInfo.lastName}
                                onChange={handleShippingChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                  shippingErrors.lastName 
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                              />
                              {shippingErrors.lastName && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.lastName}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Phone Number*
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={shippingInfo.phone}
                                onChange={handleShippingChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                  shippingErrors.phone 
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                              />
                              {shippingErrors.phone && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.phone}</p>
                              )}
                            </div>
                            
                            <div>
                              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Street Address*
                              </label>
                              <input
                                type="text"
                                name="address"
                                id="address"
                                value={shippingInfo.address}
                                onChange={handleShippingChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                  shippingErrors.address 
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                              />
                              {shippingErrors.address && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.address}</p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  City*
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  id="city"
                                  value={shippingInfo.city}
                                  onChange={handleShippingChange}
                                  className={`mt-1 block w-full rounded-md shadow-sm ${
                                    shippingErrors.city 
                                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                  } sm:text-sm dark:bg-gray-700 dark:text-white`}
                                />
                                {shippingErrors.city && (
                                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.city}</p>
                                )}
                              </div>
                              
                              <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  State/Province*
                                </label>
                                <input
                                  type="text"
                                  name="state"
                                  id="state"
                                  value={shippingInfo.state}
                                  onChange={handleShippingChange}
                                  className={`mt-1 block w-full rounded-md shadow-sm ${
                                    shippingErrors.state 
                                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                  } sm:text-sm dark:bg-gray-700 dark:text-white`}
                                />
                                {shippingErrors.state && (
                                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.state}</p>
                                )}
                              </div>
                              
                              <div>
                                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Postal Code*
                                </label>
                                <input
                                  type="text"
                                  name="postalCode"
                                  id="postalCode"
                                  value={shippingInfo.postalCode}
                                  onChange={handleShippingChange}
                                  className={`mt-1 block w-full rounded-md shadow-sm ${
                                    shippingErrors.postalCode 
                                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                  } sm:text-sm dark:bg-gray-700 dark:text-white`}
                                />
                                {shippingErrors.postalCode && (
                                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.postalCode}</p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Country*
                              </label>
                              <select
                                id="country"
                                name="country"
                                value={shippingInfo.country}
                                onChange={handleShippingChange}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                              >
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="MX">Mexico</option>
                                <option value="GB">United Kingdom</option>
                                <option value="AU">Australia</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-4">
                            <input
                              id="saveAddress"
                              name="saveAddress"
                              type="checkbox"
                              checked={shippingInfo.saveAddress}
                              onChange={handleShippingChange}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                            />
                            <label htmlFor="saveAddress" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              Save this address for future orders
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Manual form for guest users */}
                  {!isAuthenticated && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            First Name*
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            value={shippingInfo.firstName}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.firstName 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.firstName && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.firstName}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Last Name*
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            value={shippingInfo.lastName}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.lastName 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.lastName && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.lastName}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address*
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={shippingInfo.email}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.email 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.email && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.email}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone Number*
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={shippingInfo.phone}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.phone 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.phone && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.phone}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Street Address*
                        </label>
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={shippingInfo.address}
                          onChange={handleShippingChange}
                          className={`mt-1 block w-full rounded-md shadow-sm ${
                            shippingErrors.address 
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                          } sm:text-sm dark:bg-gray-700 dark:text-white`}
                        />
                        {shippingErrors.address && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.address}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            City*
                          </label>
                          <input
                            type="text"
                            name="city"
                            id="city"
                            value={shippingInfo.city}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.city 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.city && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.city}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            State/Province*
                          </label>
                          <input
                            type="text"
                            name="state"
                            id="state"
                            value={shippingInfo.state}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.state 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.state && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.state}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Postal Code*
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            id="postalCode"
                            value={shippingInfo.postalCode}
                            onChange={handleShippingChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              shippingErrors.postalCode 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {shippingErrors.postalCode && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{shippingErrors.postalCode}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Country*
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={shippingInfo.country}
                          onChange={handleShippingChange}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="MX">Mexico</option>
                          <option value="GB">United Kingdom</option>
                          <option value="AU">Australia</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="saveAddress"
                          name="saveAddress"
                          type="checkbox"
                          checked={shippingInfo.saveAddress}
                          onChange={handleShippingChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="saveAddress" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          {isAuthenticated ? 'Save this address for future orders' : 'Create an account to save this address'}
                        </label>
                      </div>
                    </>
                  )}
                  
                  {/* Shipping Method Selection */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Shipping Method</h4>
                    
                    <div className="space-y-4">
                      {shippingMethods.map((method) => (
                        <div 
                          key={method.id}
                          className={`relative border rounded-lg p-4 flex cursor-pointer ${
                            selectedShippingMethod === method.id 
                              ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={() => setSelectedShippingMethod(method.id)}
                        >
                          <div className="flex items-center h-5">
                            <input
                              id={`shipping-${method.id}`}
                              name="shippingMethod"
                              type="radio"
                              checked={selectedShippingMethod === method.id}
                              onChange={() => setSelectedShippingMethod(method.id)}
                              className="h-4 w-4 text-green-600 border-gray-300 dark:border-gray-600 focus:ring-green-500"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <label 
                              htmlFor={`shipping-${method.id}`} 
                              className="text-sm font-medium text-gray-900 dark:text-white"
                            >
                              {method.name} ₵{method.price.toFixed(2)}
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{method.description}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Estimated delivery: {method.estimatedDays}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <Link
                    to="/cart"
                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Return to Cart
                  </Link>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}
            
            {/* Payment Information */}
            {activeStep === 'payment' && (
              <form onSubmit={handleContinueToReview}>
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Method</h3>
                </div>
                
                <div className="px-6 py-5 space-y-6">
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id}
                        className={`relative border rounded-lg p-4 flex cursor-pointer ${
                          selectedPaymentMethod === method.id 
                            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center h-5">
                          <input
                            id={`payment-${method.id}`}
                            name="paymentMethod"
                            type="radio"
                            checked={selectedPaymentMethod === method.id}
                            onChange={() => setSelectedPaymentMethod(method.id)}
                            className="h-4 w-4 text-green-600 border-gray-300 dark:border-gray-600 focus:ring-green-500"
                          />
                        </div>
                        
                        <div className="ml-3 flex-1 flex items-center">
                          <label 
                            htmlFor={`payment-${method.id}`} 
                            className="text-sm font-medium text-gray-900 dark:text-white"
                          >
                            {method.name}
                          </label>
                          <span className="ml-2">{method.icon}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Credit Card Details */}
                  {selectedPaymentMethod === 'credit-card' && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Card Number*
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          id="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          value={paymentInfo.cardNumber}
                          onChange={handlePaymentChange}
                          className={`mt-1 block w-full rounded-md shadow-sm ${
                            paymentErrors.cardNumber 
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                          } sm:text-sm dark:bg-gray-700 dark:text-white`}
                        />
                        {paymentErrors.cardNumber && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{paymentErrors.cardNumber}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name on Card*
                        </label>
                        <input
                          type="text"
                          name="nameOnCard"
                          id="nameOnCard"
                          value={paymentInfo.nameOnCard}
                          onChange={handlePaymentChange}
                          className={`mt-1 block w-full rounded-md shadow-sm ${
                            paymentErrors.nameOnCard 
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                          } sm:text-sm dark:bg-gray-700 dark:text-white`}
                        />
                        {paymentErrors.nameOnCard && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{paymentErrors.nameOnCard}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Expiry Date*
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={paymentInfo.expiryDate}
                            onChange={handlePaymentChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              paymentErrors.expiryDate 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {paymentErrors.expiryDate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{paymentErrors.expiryDate}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            CVV*
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            id="cvv"
                            placeholder="123"
                            value={paymentInfo.cvv}
                            onChange={handlePaymentChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                              paymentErrors.cvv 
                                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                          />
                          {paymentErrors.cvv && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{paymentErrors.cvv}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="saveCard"
                          name="saveCard"
                          type="checkbox"
                          checked={paymentInfo.saveCard}
                          onChange={handlePaymentChange}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Save this card for future purchases
                        </label>
                      </div>
                      
                      <div className="flex items-center mt-4 text-xs text-gray-600 dark:text-gray-400">
                        <Lock className="h-4 w-4 mr-1 text-green-500" />
                        <span>Your payment information is secure and encrypted</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Paystack Payment */}
                  {selectedPaymentMethod === 'paystack' && (
                    <div className="mt-4">
                      <PaystackPayment
                        amount={total}
                        email={shippingInfo.email || ''} 
                        firstName={shippingInfo.firstName || ''} 
                        lastName={shippingInfo.lastName || ''}
                        onSuccess={handlePaystackSuccess}
                        onClose={() => {
                          setActiveStep('payment');
                          setError('Payment was cancelled. Please try again or choose a different payment method.');
                        }}
                        onError={(error) => {
                          setActiveStep('payment');
                          setPaymentError(error?.message || 'Payment failed. Please try again.');
                        }}
                        currency="GHS"
                      />
                      {paymentError && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
                          <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                            <div className="ml-3">
                          <p className="text-sm text-red-700 dark:text-red-300">{paymentError}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* PayPal & Apple Pay Instructions */}
                  {selectedPaymentMethod === 'paypal' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-gray-700 dark:text-gray-300 mt-4">
                      You will be redirected to PayPal to complete your payment after reviewing your order.
                    </div>
                  )}
                  
                  {selectedPaymentMethod === 'apple-pay' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300 mt-4">
                      You will be prompted to complete your payment with Apple Pay after reviewing your order.
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Shipping
                  </button>
                </div>
              </form>
            )}
            
            {/* Order Review */}
            {activeStep === 'review' && (
              <div>
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Your Order</h3>
                </div>
                
                <div className="px-6 py-5 space-y-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Order Items</h4>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {state.cart.map(cartItem => {
                        const product = cartProducts[cartItem.product_id];
                        
                        if (!product) return null;
                        
                        const discountedPrice = product.discount_percentage 
                          ? product.price * (1 - (product.discount_percentage / 100)) 
                          : null;
                          
                        return (
                          <li key={cartItem.product_id} className="py-4 flex">
                            <div className="flex-shrink-0 w-16 h-16">
                              <img 
                                src={product.image_url || `https://source.unsplash.com/random/100x100/?product=${product.id}`} 
                                alt={product.name} 
                                className="w-full h-full object-center object-cover rounded-md"
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex justify-between">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</h5>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  ₵{((discountedPrice || product.price) * cartItem.quantity).toFixed(2)}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Qty: {cartItem.quantity} × ₵{(discountedPrice || product.price).toFixed(2)}
                              </p>
                              {product.discount_percentage && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                  {product.discount_percentage}% off
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  
                  {/* Shipping Details */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Shipping</h4>
                      <button 
                        type="button"
                        onClick={() => setActiveStep('shipping')}
                        className="text-xs font-medium text-green-600 dark:text-green-400"
                      >
                        Edit
                      </button>
                    </div>
                    
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-sm">
                      <p className="text-gray-800 dark:text-gray-200">
                        <span className="font-medium">{shippingInfo.firstName} {shippingInfo.lastName}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{shippingInfo.address}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{shippingInfo.email}</p>
                      <p className="text-gray-600 dark:text-gray-400">{shippingInfo.phone}</p>
                      
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-gray-800 dark:text-gray-200">
                          <span className="font-medium">Shipping Method:</span> {shippingMethods.find(m => m.id === selectedShippingMethod)?.name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                          Estimated delivery: {shippingMethods.find(m => m.id === selectedShippingMethod)?.estimatedDays}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">Payment</h4>
                      <button 
                        type="button"
                        onClick={() => setActiveStep('payment')}
                        className="text-xs font-medium text-green-600 dark:text-green-400"
                      >
                        Edit
                      </button>
                    </div>
                    
                    <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-sm">
                      <p className="text-gray-800 dark:text-gray-200">
                        <span className="font-medium">Payment Method:</span> {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                      </p>
                      
                      {selectedPaymentMethod === 'credit-card' && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          Card ending in {paymentInfo.cardNumber.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-5 mt-8 lg:mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Order Summary</h3>
            </div>
            
            <div className="p-6">
              <div className="flow-root">
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-base text-gray-600 dark:text-gray-400">Subtotal</dt>
                    <dd className="text-base font-medium text-gray-900 dark:text-white">₵{subtotal.toFixed(2)}</dd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <dt className="text-base text-gray-600 dark:text-gray-400">Shipping</dt>
                    <dd className="text-base font-medium text-gray-900 dark:text-white">₵{shipping.toFixed(2)}</dd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <dt className="text-base text-gray-600 dark:text-gray-400">Tax (8%)</dt>
                    <dd className="text-base font-medium text-gray-900 dark:text-white">₵{tax.toFixed(2)}</dd>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <dt className="text-lg font-medium text-gray-900 dark:text-white">Order Total</dt>
                    <dd className="text-lg font-bold text-gray-900 dark:text-white">₵{total.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
              
              {activeStep === 'review' && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={processingOrder}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      processingOrder ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    {processingOrder ? (
                      <>
                        <span className="mr-3 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        Processing...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                  
                  <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                    By placing your order, you agree to our <a href="#" className="text-green-600 dark:text-green-400 hover:underline">Terms of Service</a> and <a href="#" className="text-green-600 dark:text-green-400 hover:underline">Privacy Policy</a>.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Security Notice */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Secure Checkout</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your payment information is processed securely. We do not store credit card details nor have access to your credit card information.
                </p>
              </div>
            </div>
          </div>
          
          {/* Need Help */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Need Help?</h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              If you have questions about your order, please contact our customer service team at <a href="mailto:support@example.com" className="text-green-600 dark:text-green-400">support@example.com</a> or call us at <a href="tel:+18001234567" className="text-green-600 dark:text-green-400">(800) 123-4567</a>.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-xs text-green-600 dark:text-green-400 hover:underline">Shipping Policy</a>
              <a href="#" className="text-xs text-green-600 dark:text-green-400 hover:underline">Return Policy</a>
              <a href="#" className="text-xs text-green-600 dark:text-green-400 hover:underline">FAQs</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;