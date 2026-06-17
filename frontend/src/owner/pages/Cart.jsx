import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  Loader2,
  CreditCard,
  ShieldCheck,
  Receipt,
  Wallet,
  Package,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Home,
  ShoppingBag,
  ArrowLeft,
  AlertTriangle,
  Truck,
  Calendar,
  User as UserIcon,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  getCart,
  updateCartItem,
  removeCartItem,
  placeOrder,
  createOrderPayment,
  markPaymentSuccess
} from '../../api/api';
import { loadRazorpay } from '../../utils/razorpayConfig';
import { Link } from 'react-router-dom';

const Cart = () => {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Customer";
  const userEmail = localStorage.getItem("userEmail") || "customer@example.com";
  const userPhone = localStorage.getItem("userPhone") || "";
  
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState({});
  const [removingItems, setRemovingItems] = useState({});
  
  // Helper function to resolve image URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://https://ai-pet-wellness-management-system.onrender.com${imageUrl}`;
  };
  
  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart, 2: Review, 3: Payment
  const [processingOrder, setProcessingOrder] = useState(false);
  
  // Order & Payment
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Address
  const [address, setAddress] = useState({
    fullName: userName,
    phone: userPhone,
    street: "",
    city: "",
    state: "",
    pincode: ""
  });

  // Load cart data
  useEffect(() => {
    const loadCartData = async () => {
      if (!userId) {
        toast.error('Please login to view cart');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getCart(userId);
        setCart(response.data);
        
        // Load Razorpay script
        await loadRazorpay();
        setRazorpayLoaded(true);
        
        console.log('Razorpay loaded successfully');
      } catch (error) {
        toast.error('Failed to load cart');
        console.error('Error loading cart:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCartData();
  }, [userId]);

  // Handle quantity update
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (!userId || newQuantity < 1) return;
    
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const response = await updateCartItem(itemId, userId, newQuantity);
      setCart(response.data);
      toast.success('Cart updated');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId) => {
    if (!userId) return;
    
    setRemovingItems(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const response = await removeCartItem(itemId, userId);
      setCart(response.data);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to remove item');
    } finally {
      setRemovingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Check stock availability
    const outOfStockItems = cart.items.filter(item => 
      item.product && item.quantity > item.product.stock
    );
    
    if (outOfStockItems.length > 0) {
      toast.error('Some items in your cart are out of stock');
      return;
    }
    
    setCheckoutStep(2);
  };

  // Handle place order
const handlePlaceOrder = async () => {
  if (!userId || !cart || cart.items.length === 0) return;
  
  // Validate address
  if (!address.fullName || !address.phone || !address.street || !address.city || !address.state || !address.pincode) {
    toast.error('Please fill in all address details');
    return;
  }
  
  if (address.phone.length < 10) {
    toast.error('Please enter a valid phone number');
    return;
  }
  
  if (address.pincode.length < 6) {
    toast.error('Please enter a valid pincode');
    return;
  }

  setProcessingOrder(true);
  
  try {
    console.log('Placing order for user:', userId);
    
    // 1. Create order
    const orderResponse = await placeOrder(userId);
    const order = orderResponse.data;
    console.log('✅ Order created:', order);
    
    // 2. Create payment
    const paymentRes = await createOrderPayment(order.id);
    const payment = paymentRes.data;
    console.log('✅ Payment created:', payment);
    
    // ✅ CRITICAL FIX: Use ReactDOM.unstable_batchedUpdates
    // This forces all state updates to happen together
    import('react-dom').then(ReactDOM => {
      ReactDOM.unstable_batchedUpdates(() => {
        setCurrentOrder(order);
        setCurrentPayment(payment);
        setCheckoutStep(3);
        
        console.log('🎯 ALL STATE UPDATED TOGETHER');
        console.log('Order:', order.id);
        console.log('Payment:', payment.id);
        console.log('Step: 3');
      });
    });
    
    toast.success('Order created! Complete payment.');
    
  } catch (error) {
    console.error('Error placing order:', error);
    toast.error(error.response?.data || 'Failed to place order');
  } finally {
    setProcessingOrder(false);
  }
};

  // Open Razorpay checkout (MockRazorpay in dev — accepts any payment details)
const handleInitiatePayment = async () => {
  if (!currentPayment || !currentOrder) {
    toast.error('Payment information not available');
    return;
  }

  try {
    const options = {
      key: "rzp_test_SBhh5VRQMzU46B",
      amount: currentPayment.amount * 100, // paise
      currency: currentPayment.currency || "INR",
      name: "PetCare Shop",
      description: `Order #${currentOrder.id} - Pet Products`,
      order_id: currentPayment.razorpayOrderId,

      handler: async function (response) {
        console.log('Payment response:', response);
        try {
          await markPaymentSuccess(currentPayment.id, response.razorpay_payment_id);
          toast.success("✅ Payment successful! Your order has been confirmed.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setShowPaymentModal(false);
          setTimeout(() => { window.location.href = '/dashboard/owner/orders'; }, 2000);
        } catch (err) {
          console.error('Error marking payment success:', err);
          toast.error("Payment verification failed. Please contact support.");
        }
      },

      prefill: {
        name:    address.fullName || userName,
        email:   userEmail,
        contact: address.phone || userPhone || "9999999999"
      },

      notes: {
        order_id:    currentOrder.id.toString(),
        customer_id: userId
      },

      theme: { color: "#7c3aed" },

      modal: {
        ondismiss: function () {
          toast.info('Payment cancelled');
        },
        escape: true,
        backdropclose: false
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error('Payment error:', err);
    toast.error(`Payment failed: ${err.response?.data || err.message}`);
  }
};


  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!cart || !cart.items) return { subtotal: 0, total: 0, itemsCount: 0 };
    
    const subtotal = cart.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    // Add shipping and tax
    const shipping = subtotal > 0 ? 50 : 0; // Flat ₹50 shipping
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;
    
    const itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return { subtotal, shipping, tax, total, itemsCount };
  };

  const totals = calculateTotals();

  if (!userId) {
    return (
      
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Please Login
          </h3>
          <p className="text-gray-500 mb-6">
            You need to login to view your shopping cart
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto">
            <Loader2 className="w-6 h-6 mx-auto mt-3 text-purple-600" />
          </div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="text-purple-600" />
              Your Shopping Cart
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your cart items
            </p>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <ShoppingCart size={80} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Add some products to your cart and come back here to checkout
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard/owner/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>
            <Link
              to="/dashboard/owner/orders"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Receipt size={16} />
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-purple-600" />
            {checkoutStep === 1 ? 'Your Shopping Cart' : 
             checkoutStep === 2 ? 'Review Order' : 'Complete Payment'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {checkoutStep === 1 ? `You have ${totals.itemsCount} items in your cart` :
             checkoutStep === 2 ? 'Review your order details' :
             'Secure payment checkout'}
          </p>
        </div>
        
        {checkoutStep > 1 && (
          <button
            onClick={() => setCheckoutStep(checkoutStep - 1)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}
      </div>

      {/* Checkout Steps Indicator */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${checkoutStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              checkoutStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="font-medium">Cart</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${checkoutStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center gap-3 ${checkoutStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              checkoutStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="font-medium">Review</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${checkoutStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center gap-3 ${checkoutStep >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              checkoutStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="font-medium">Payment</span>
          </div>
        </div>
      </div>

      {/* Cart Items (Step 1) */}
      {checkoutStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Product Image */}
                  <div className="sm:w-32 sm:h-32 w-full h-48 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={getImageUrl(item.product?.imageUrl)}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.product?.description}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removingItems[item.id]}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        {removingItems[item.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={updatingItems[item.id] || item.quantity <= 1}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 py-2 border-x border-gray-300 min-w-[40px] text-center bg-white">
                          {updatingItems[item.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItems[item.id] || (item.product && item.quantity >= item.product.stock)}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {/* Price & Stock */}
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-lg">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.product?.stock > 10 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : item.product?.stock > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.product?.stock || 0} in stock
                          </span>
                          <span className="text-gray-500">
                            {formatPrice(item.price)} each
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatPrice(totals.shipping)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="font-medium">{formatPrice(totals.tax)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-purple-600 text-xl">
                      {formatPrice(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleProceedToCheckout}
                className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Proceed to Checkout
                <ChevronRight size={16} />
              </button>
              
              <Link
                to="/dashboard/owner/shop"
                className="w-full mt-3 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                Continue Shopping
              </Link>
            </div>
            
            {/* Security Badge */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-green-600" size={20} />
                <div>
                  <p className="font-medium text-green-800">Secure Checkout</p>
                  <p className="text-sm text-green-700">
                    Your payment is processed securely via Razorpay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Order (Step 2) */}
      {checkoutStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <Home className="text-purple-600" />
                  Shipping Address
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} />
                  <span>Delivery in 3-5 days</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({...address, fullName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <Phone size={16} />
                      </div>
                      <input
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({...address, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="House no., Building, Street, Area"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({...address, state: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={address.pincode}
                      onChange={(e) => setAddress({...address, pincode: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="6-digit pincode"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Items Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Package className="text-purple-600" />
                Order Items ({totals.itemsCount})
              </h3>
              
              <div className="space-y-4">
                {cart.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(item.product?.imageUrl)}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.product?.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-400">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-800">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                  <p className="text-sm text-amber-700">
                    • All prices include 18% GST<br/>
                    • Delivery takes 3-5 business days<br/>
                    • Free shipping on orders above ₹1000<br/>
                    • Returns accepted within 7 days
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary & Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatPrice(totals.shipping)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="font-medium">{formatPrice(totals.tax)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total Amount</span>
                    <span className="font-bold text-purple-600 text-xl">
                      {formatPrice(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlaceOrder}
                disabled={processingOrder || 
                  !address.fullName || 
                  !address.phone || 
                  !address.street || 
                  !address.city || 
                  !address.state || 
                  !address.pincode}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {processingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Place Order & Pay
                  </>
                )}
              </button>
              
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-blue-600 mt-0.5" size={16} />
                  <p className="text-sm text-blue-800">
                    You'll be redirected to a secure Razorpay payment page after placing your order.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Delivery Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="text-purple-600" size={20} />
                <div>
                  <p className="font-medium text-gray-800">Delivery Info</p>
                  <p className="text-sm text-gray-500">Estimated delivery: 3-5 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment — opens checkout UI (MockRazorpay in dev) */}
      {checkoutStep === 3 && currentOrder && currentPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Payment Required
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Order #{currentOrder.id} • ₹{currentPayment.amount}
              </p>
            </div>

            <div className="p-6">
              <p className="mb-4 text-gray-600">
                Please complete payment to confirm your order.
              </p>

              <button
                onClick={() => {
                  const options = {
                    key: "rzp_test_SBhh5VRQMzU46B",
                    amount: currentPayment.amount * 100,
                    currency: "INR",
                    name: "PetCare Shop",
                    description: `Order #${currentOrder.id}`,
                    order_id: currentPayment.razorpayOrderId,
                    handler: async function (response) {
                      try {
                        await markPaymentSuccess(currentPayment.id, response.razorpay_payment_id);
                        toast.success('Payment successful!');
                        setCheckoutStep(1);
                        setTimeout(() => { window.location.href = '/dashboard/owner/orders'; }, 1000);
                      } catch (err) {
                        toast.error('Payment verification failed');
                      }
                    },
                    prefill: {
                      name:    address.fullName || "Customer",
                      email:   userEmail,
                      contact: address.phone || "9999999999"
                    },
                    theme: { color: "#7c3aed" },
                    modal: {
                      ondismiss: function () { toast.info('Payment cancelled'); }
                    }
                  };
                  const rzp = new window.Razorpay(options);
                  rzp.open();
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pay ₹{currentPayment.amount} via Razorpay
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default Cart;