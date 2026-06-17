import React, { useEffect, useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Eye,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Loader2,
  ExternalLink,
  Home,
  CreditCard,
  Receipt,
  ShieldCheck,
  HelpCircle,
  X,
  ShoppingCart,
  FileText,
  Printer,
  PhoneCall,
  MessageSquare,
  Star
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../../api/api';

const Orders = () => {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "Customer";
  const userEmail = localStorage.getItem("userEmail") || "";
  const userPhone = localStorage.getItem("userPhone") || "";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Helper function to resolve image URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:8080${imageUrl}`;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Status configuration
  const statusConfig = {
    CREATED: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Clock className="w-4 h-4" />,
      label: 'Order Placed',
      description: 'Waiting for payment',
      progress: 1,
      badgeColor: 'border-blue-200 bg-blue-50'
    },
    PAID: {
      color: 'bg-purple-100 text-purple-800',
      icon: <CreditCard className="w-4 h-4" />,
      label: 'Paid',
      description: 'Payment confirmed',
      progress: 2,
      badgeColor: 'border-purple-200 bg-purple-50'
    },
    SHIPPED: {
      color: 'bg-amber-100 text-amber-800',
      icon: <Truck className="w-4 h-4" />,
      label: 'Shipped',
      description: 'On the way',
      progress: 3,
      badgeColor: 'border-amber-200 bg-amber-50'
    },
    DELIVERED: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Delivered',
      description: 'Order delivered',
      progress: 4,
      badgeColor: 'border-green-200 bg-green-50'
    },
    CANCELLED: {
      color: 'bg-red-100 text-red-800',
      icon: <XCircle className="w-4 h-4" />,
      label: 'Cancelled',
      description: 'Order cancelled',
      progress: 0,
      badgeColor: 'border-red-200 bg-red-50'
    }
  };

  // Load orders
  useEffect(() => {
    if (!userId) return;

    const loadOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/orders/user/${userId}`);
        setOrders(response.data || []);
      } catch (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  // Load order details
  const loadOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrderDetails(response.data);
      setSelectedOrder(orderId);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancellingOrder(orderId);
    try {
      const response = await api.put(`/orders/${orderId}/cancel?userId=${userId}`);
      const updatedOrder = response.data;

      // Update order in state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));

      // Update order details if open
      if (selectedOrder === orderId) {
        setOrderDetails(updatedOrder);
      }

      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Filter orders
  const filteredOrders = orders
    .filter(order => filter === 'all' || order.status === filter)
    .filter(order => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        order.id.toString().includes(query) ||
        order.items?.some(item => 
          item.product?.name?.toLowerCase().includes(query)
        )
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Order counts
  const orderCounts = {
    all: orders.length,
    CREATED: orders.filter(o => o.status === 'CREATED').length,
    PAID: orders.filter(o => o.status === 'PAID').length,
    SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Please Login
          </h3>
          <p className="text-gray-500 mb-6">
            You need to login to view your orders
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
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-purple-600" />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your purchases
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/owner/shop"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag size={16} />
            Shop Now
          </Link>
          <button
            onClick={() => {
              setLoading(true);
              api.get(`/orders/user/${userId}`)
                .then(res => {
                  setOrders(res.data || []);
                  toast.success('Orders refreshed');
                })
                .catch(err => {
                  console.error('Error refreshing orders:', err);
                  toast.error('Failed to refresh orders');
                })
                .finally(() => setLoading(false));
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div 
          onClick={() => setFilter('all')}
          className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${filter === 'all' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-800">{orderCounts.all}</div>
              <div className="text-sm text-gray-500 mt-1">All Orders</div>
            </div>
            <Package className="text-gray-400" size={20} />
          </div>
        </div>
        
        {Object.entries(statusConfig).map(([status, config]) => (
          <div
            key={status}
            onClick={() => setFilter(status)}
            className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${filter === status ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">{orderCounts[status]}</div>
                <div className="text-sm text-gray-500 mt-1">{config.label}</div>
              </div>
              <div className={`p-2 rounded-lg ${config.badgeColor}`}>
                {React.cloneElement(config.icon, { className: "w-4 h-4" })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders by ID or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'CREATED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${filter === status 
                  ? status === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : statusConfig[status]?.color.replace('bg-', 'bg-').replace(' text-', ' text-white')
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : statusConfig[status]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid - CARD VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package size={80} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filter === 'all' ? 'No Orders Yet' : `No ${statusConfig[filter]?.label || filter} Orders`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Start shopping to see your orders here'
                : `You don't have any ${statusConfig[filter]?.label?.toLowerCase() || filter.toLowerCase()} orders`
              }
            </p>
            <Link
              to="/dashboard/owner/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
            >
              <ShoppingBag size={16} />
              Start Shopping
            </Link>
          </div>
        ) : (
          filteredOrders.map(order => {
            const status = statusConfig[order.status] || statusConfig.CREATED;
            const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const firstProduct = order.items?.[0]?.product;

            return (
              <div 
                key={order.id}
                onClick={() => loadOrderDetails(order.id)}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-300 cursor-pointer transition-all duration-200 group"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg group-hover:text-purple-600">
                      Order #{order.id}
                    </h3>
                  </div>
                  <ChevronRight className="text-gray-400 group-hover:text-purple-600" size={20} />
                </div>

                {/* Order Preview */}
                <div className="space-y-4">
                  {/* Product Image */}
                  {firstProduct && (
                    <div className="w-full h-40 rounded-xl overflow-hidden">
                      <img
                        src={getImageUrl(firstProduct.imageUrl)}
                        alt={firstProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Items</div>
                      <div className="font-medium text-gray-800">{itemsCount} item{itemsCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="font-bold text-gray-800 text-lg">{formatPrice(order.totalAmount)}</div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Progress</span>
                      <span>{status.description}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                        style={{ width: `${(status.progress / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadOrderDetails(order.id);
                      }}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    {['CREATED', 'PAID'].includes(order.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.id);
                        }}
                        disabled={cancellingOrder === order.id}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {cancellingOrder === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && orderDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
                    <p className="text-sm text-gray-500">Order #{orderDetails.id} • {formatDateTime(orderDetails.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                    setOrderDetails(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Order Items */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Status Card with Connected Progress Steps */}
<div className={`border rounded-xl p-6 ${statusConfig[orderDetails.status]?.badgeColor}`}>
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-lg ${statusConfig[orderDetails.status]?.color.replace('text', 'text').replace('bg', 'bg')}`}>
        {statusConfig[orderDetails.status]?.icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-lg">{statusConfig[orderDetails.status]?.label}</h3>
        <p className="text-gray-600">{statusConfig[orderDetails.status]?.description}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-600">Order Total</p>
      <p className="text-2xl font-bold text-gray-800">{formatPrice(orderDetails.totalAmount)}</p>
    </div>
  </div>
  
  {/* Connected Progress Steps */}
  <div className="relative">
    {/* Progress Line */}
    <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2">
      <div 
        className={`h-full ${orderDetails.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
        style={{ 
          width: `${(statusConfig[orderDetails.status]?.progress / 4) * 100}%` 
        }}
      ></div>
    </div>
    
    {/* Steps */}
    <div className="flex justify-between relative z-10">
      {[
        { step: 1, label: 'Order Placed', icon: <Package size={16} />, status: 'CREATED' },
        { step: 2, label: 'Payment', icon: <CreditCard size={16} />, status: 'PAID' },
        { step: 3, label: 'Shipped', icon: <Truck size={16} />, status: 'SHIPPED' },
        { step: 4, label: 'Delivered', icon: <CheckCircle size={16} />, status: 'DELIVERED' }
      ].map(({ step, label, icon, status }) => {
        const isCompleted = step <= statusConfig[orderDetails.status]?.progress;
        const isCurrent = orderDetails.status === status;
        
        return (
          <div key={step} className="flex flex-col items-center text-center w-20">
            {/* Step Circle */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center mb-3
              ${isCompleted 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                : 'bg-white border-2 border-gray-300 text-gray-400'
              }
              ${isCurrent ? 'ring-4 ring-purple-200 ring-offset-2' : ''}
              transition-all duration-300
            `}>
              {isCompleted ? (
                <CheckCircle size={20} className="text-white" />
              ) : (
                React.cloneElement(icon, { className: `w-5 h-5 ${isCurrent ? 'text-purple-600' : 'text-gray-400'}` })
              )}
            </div>
            
            {/* Step Label */}
            <div className="text-center">
              <p className={`text-xs font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                {label}
              </p>
              {isCurrent && (
                <p className="text-xs text-purple-600 font-medium mt-1">Current</p>
              )}
              {isCompleted && !isCurrent && (
                <p className="text-xs text-green-600 font-medium mt-1">✓ Completed</p>
              )}
            </div>
            
            {/* Status Date (You can add actual dates if available) */}
            <div className="mt-2">
              {isCompleted && (
                <span className="text-xs text-gray-500">
                  {step === 1 && formatDate(orderDetails.createdAt)}
                  {step === 2 && 'Payment Date'} {/* Add actual payment date if available */}
                  {step === 3 && 'Shipped Date'} {/* Add actual shipped date if available */}
                  {step === 4 && 'Delivered Date'} {/* Add actual delivered date if available */}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
  
  {/* Cancelled State */}
  {orderDetails.status === 'CANCELLED' && (
    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-3">
        <XCircle className="text-red-600" size={20} />
        <div>
          <p className="font-medium text-red-800">Order Cancelled</p>
          <p className="text-sm text-red-700 mt-1">
            This order has been cancelled. Refund will be processed within 5-7 business days.
          </p>
        </div>
      </div>
    </div>
  )}
</div>
                  {/* Order Items */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                      <ShoppingCart className="text-purple-600" size={20} />
                      Order Items ({orderDetails.items?.length || 0})
                    </h3>
                    <div className="space-y-4">
                      {orderDetails.items?.map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getImageUrl(item.product?.imageUrl)}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.product?.name}</h4>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-gray-600">{formatPrice(item.price)} each</span>
                              <span className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Order Summary & Actions */}
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatPrice(orderDetails.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatPrice(50)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (18% GST)</span>
                        <span className="font-medium">
                          {formatPrice(orderDetails.totalAmount * 0.18)}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-800">Total Amount</span>
                          <span className="font-bold text-purple-600 text-xl">
                            {formatPrice(orderDetails.totalAmount + 50 + (orderDetails.totalAmount * 0.18))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">Order Actions</h3>
                    <div className="space-y-3">
                      {['CREATED', 'PAID'].includes(orderDetails.status) && (
                        <button
                          onClick={() => handleCancelOrder(orderDetails.id)}
                          disabled={cancellingOrder === orderDetails.id}
                          className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                          {cancellingOrder === orderDetails.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle size={16} />
                              Cancel Order
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => window.print()}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Printer size={16} />
                        Print Invoice
                      </button>
                      
                      <button
                        onClick={() => toast.info('Tracking will be available once shipped')}
                        className="w-full py-3 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Truck size={16} />
                        Track Order
                      </button>
                      
                      <Link
                        to="/support"
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium text-center"
                      >
                        <PhoneCall size={16} />
                        Contact Support
                      </Link>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="text-amber-600 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Need Help?</p>
                        <p className="text-sm text-amber-700">
                          Contact our support team for any order-related queries
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <Link
                  to="/dashboard/owner/shop"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium text-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;