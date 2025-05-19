// src/pages/CartPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../contexts/ProductContext';
import { supabase } from '../lib/supabase';
import { 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Lock,
  CreditCard,
  Truck,
  ShieldCheck
} from 'lucide-react';

interface CartProduct {
  id: number;
  name: string;
  price: number;
  image_url: string;
  inventory_count: number;
  discount_percentage?: number;
  sku?: string;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateCartItem, removeFromCart } = useProducts();
  const [cartProducts, setCartProducts] = useState<{ [key: number]: CartProduct }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Fetch product details for cart items
  useEffect(() => {
    const fetchCartProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // No need to fetch if cart is empty
        if (state.cart.length === 0) {
          setCartProducts({});
          setIsLoading(false);
          return;
        }
        
        // Get all product IDs from cart
        const productIds = state.cart.map(item => item.product_id);
        
        // Fetch products data from Supabase
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, inventory_count, discount_percentage, sku')
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
  }, [state.cart]);

  // Handle quantity change
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const product = cartProducts[productId];
    
    // Validate against inventory
    if (product && newQuantity > product.inventory_count) {
      alert(`Sorry, only ${product.inventory_count} items available in stock.`);
      newQuantity = product.inventory_count;
    }
    
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    
    updateCartItem(productId, newQuantity);
  };

  // Handle remove item
  const handleRemoveItem = (productId: number) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      removeFromCart(productId);
    }
  };

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    setValidatingPromo(true);
    setPromoError(null);
    
    try {
      // Simulate API call to validate promo code
      // In a real app, you would check against a database
      setTimeout(() => {
        const code = promoCode.toUpperCase();
        if (code === 'SAVE10') {
          setPromoDiscount(10);
          setPromoError(null);
        } else if (code === 'SAVE20') {
          setPromoDiscount(20);
          setPromoError(null);
        } else {
          setPromoDiscount(0);
          setPromoError('Invalid promo code');
        }
        setValidatingPromo(false);
      }, 1000);
    } catch (err) {
      setPromoError('Error applying promo code');
      setValidatingPromo(false);
    }
  };

  // Calculate subtotal, tax, shipping, and total
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
    
    const tax = subtotal * 0.08; // Assuming 8% tax
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const promoAmount = subtotal * (promoDiscount / 100);
    const total = subtotal + tax + shipping - promoAmount;
    
    return {
      subtotal,
      tax,
      shipping,
      promoAmount,
      total
    };
  };

  // Proceed to checkout
  const handleCheckout = () => {
    // In a real app, you'd redirect to a checkout page or process
    navigate('/checkout');
  };

  // Empty cart message
  if (state.cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
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
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Error Loading Cart</h2>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { subtotal, tax, shipping, promoAmount, total } = calculateCartTotals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and modify items in your cart before checkout.
        </p>
      </div>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8">
          {/* Cart items container */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Items in Your Cart ({state.cart.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>
            </div>

            {/* Item list */}
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {state.cart.map(cartItem => {
                const product = cartProducts[cartItem.product_id];
                
                if (!product) return null;
                
                const discountedPrice = product.discount_percentage 
                  ? product.price * (1 - (product.discount_percentage / 100)) 
                  : null;
                  
                return (
                  <li key={cartItem.product_id} className="p-6 flex flex-col sm:flex-row">
                    {/* Product image */}
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 mb-4 sm:mb-0">
                      <img 
                        src={product.image_url || `https://source.unsplash.com/random/200x200/?product=${product.id}`} 
                        alt={product.name} 
                        className="w-full h-full object-center object-cover rounded-md"
                      />
                    </div>
                    
                    {/* Product details */}
                    <div className="flex-1 ml-0 sm:ml-6">
                      <div className="flex flex-wrap justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            <Link to={`/products/${product.id}`} className="hover:text-green-600 dark:hover:text-green-400">
                              {product.name}
                            </Link>
                          </h3>
                          {product.sku && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </p>
                          )}
                          
                          {/* Price display */}
                          <div className="mt-2">
                            {discountedPrice ? (
                              <div className="flex items-center">
                                <span className="text-lg font-medium text-gray-900 dark:text-white">
                                  ${discountedPrice.toFixed(2)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  ${product.price.toFixed(2)}
                                </span>
                                <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-200">
                                  {product.discount_percentage}% OFF
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-medium text-gray-900 dark:text-white">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Quantity control */}
                        <div className="mt-4 w-full sm:w-auto sm:mt-0">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleQuantityChange(product.id, cartItem.quantity - 1)}
                              className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              disabled={cartItem.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            <span className="mx-2 text-gray-700 dark:text-gray-300 w-8 text-center">
                              {cartItem.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleQuantityChange(product.id, cartItem.quantity + 1)}
                              className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              disabled={cartItem.quantity >= product.inventory_count}
                              aria-label="Increase quantity"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {/* Stock status */}
                          <div className="mt-2 text-right">
                            {product.inventory_count <= 5 ? (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                Only {product.inventory_count} left
                              </span>
                            ) : (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Item subtotal and remove button */}
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Subtotal: <span className="font-medium">${((discountedPrice || product.price) * cartItem.quantity).toFixed(2)}</span>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(product.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            
            {/* Continue shopping link */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/products"
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Order Summary</h2>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              {/* Promo code section */}
              <div>
                <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Promo Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="promo-code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter code"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={validatingPromo}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white ${
                      validatingPromo ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    {validatingPromo ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{promoError}</p>
                )}
                {promoDiscount > 0 && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    {promoDiscount}% discount applied!
                  </p>
                )}
              </div>
              
              {/* Cost breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <dl className="space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</dd>
                  </div>
                  
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-400">Discount ({promoDiscount}%)</dt>
                      <dd className="text-sm font-medium text-green-600 dark:text-green-400">-${promoAmount.toFixed(2)}</dd>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Shipping</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {shipping === 0 ? (
                        <span className="text-green-600 dark:text-green-400">Free</span>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </dd>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600 dark:text-gray-400">Tax (8%)</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">₵{tax.toFixed(2)}</dd>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                    <dt className="text-base font-medium text-gray-900 dark:text-white">Order Total</dt>
                    <dd className="text-base font-bold text-gray-900 dark:text-white">₵{total.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Checkout button */}
              <div>
                <button
                  onClick={handleCheckout}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
              
              {/* Info section */}
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-green-400 dark:text-green-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Free shipping on orders over ₵50. Need help? Contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Cards */}
          <div className="mt-6 space-y-6">
            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex items-center mb-3">
                <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Accepted Payment Methods</h3>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            
            {/* Security Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex items-center mb-3">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Secure Checkout</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Your payment information is processed securely. We do not store credit card details.
              </p>
            </div>
            
            {/* Shipping Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex items-center mb-3">
                <Truck className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Shipping Information</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Orders typically ship within 1-2 business days. Free shipping on orders over ₵50.
              </p>
            </div>
            
            {/* Guarantees */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex items-center mb-3">
                <ShieldCheck className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Our Guarantees</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                30-day money-back guarantee. 100% secure checkout. Customer satisfaction guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;