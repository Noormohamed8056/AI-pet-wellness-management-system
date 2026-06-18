import React, { useState, useEffect } from 'react';
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getUserById
} from '../../api/api';
import {
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
  Search,
  Calendar,
  User,
  DollarSign,
  CreditCard,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Loader,
  Eye,
  Printer,
  PhoneCall,
  HelpCircle,
  Star,
  TrendingUp,
  Boxes,
  Filter,
  Download,
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [userCache, setUserCache] = useState({});
  
  // Helper function to resolve image URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-pet-wellness-management-system.onrender.com";
    return `${BASE_URL}${imageUrl}`;
  };
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Fetch all orders
  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrdersAdmin();
      const ordersData = response.data || [];
      
      ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      
      ordersData.forEach(order => {
        if (order.user?.id && !userCache[order.user.id]) {
          fetchUserDetails(order.user.id);
        }
      });
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      const response = await getUserById(userId);
      setUserCache(prev => ({
        ...prev,
        [userId]: response.data
      }));
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatusAdmin(orderId, newStatus);
      
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      );
      
      setOrders(updatedOrders);
      setFilteredOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      toast.success(`Order #${orderId} marked as ${newStatus.toLowerCase()}`);
      
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter handlers
  const handleFilterChange = (status) => {
    setStatusFilter(status);
    if (status === 'ALL') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === status));
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      handleFilterChange(statusFilter);
      return;
    }
    
    const filtered = orders.filter(order => {
      const user = userCache[order.user?.id];
      return (
        order.id?.toString().includes(term) ||
        user?.name?.toLowerCase().includes(term) ||
        user?.email?.toLowerCase().includes(term) ||
        order.items?.some(item => 
          item.product?.name?.toLowerCase().includes(term)
        )
      );
    });
    
    setFilteredOrders(filtered);
  };

  // Open order details modal
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Check if order can be updated
  const canBeShipped = (order) => order?.status === 'PAID';
  const canBeDelivered = (order) => order?.status === 'SHIPPED';
  const canBeCancelled = (order) => ['CREATED', 'PAID'].includes(order?.status);

  // Format helpers
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusConfig = (status) => {
    const config = {
      'CREATED': { 
        icon: Clock, 
        color: 'bg-gray-100 text-gray-700', 
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
        bg: 'bg-gray-50', 
        border: 'border-gray-200', 
        label: 'Created',
        progress: 1
      },
      'PAID': { 
        icon: CreditCard, 
        color: 'bg-blue-100 text-blue-700', 
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        label: 'Paid',
        progress: 2
      },
      'SHIPPED': { 
        icon: Truck, 
        color: 'bg-purple-100 text-purple-700', 
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        bg: 'bg-purple-50', 
        border: 'border-purple-200', 
        label: 'Shipped',
        progress: 3
      },
      'DELIVERED': { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-700', 
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        label: 'Delivered',
        progress: 4
      },
      'CANCELLED': { 
        icon: X, 
        color: 'bg-red-100 text-red-700', 
        badgeColor: 'bg-red-100 text-red-800 border-red-200',
        bg: 'bg-red-50', 
        border: 'border-red-200', 
        label: 'Cancelled',
        progress: 0
      }
    };
    return config[status] || config['CREATED'];
  };

  // Stats calculation
  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'PAID').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    revenue: orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-purple-600" size={28} />
              Orders Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and update order statuses • {filteredOrders.length} orders found
            </p>
          </div>
          <button
            onClick={fetchAllOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Paid</p>
              <p className="text-2xl font-bold text-blue-600">{stats.paid}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to ship</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Shipped</p>
              <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              <p className="text-xs text-gray-500 mt-1">In transit</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">From delivered</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, email, or product..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            {['PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
              const config = getStatusConfig(status);
              return (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? config.color.replace('text', 'bg').replace('100', '600').replace('700', 'white') + ' text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Active filters display */}
        {statusFilter !== 'ALL' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Active filter:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusConfig(statusFilter).badgeColor}`}>
              {React.createElement(getStatusConfig(statusFilter).icon, { size: 12 })}
              {statusFilter}
            </span>
            <button
              onClick={() => handleFilterChange('ALL')}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Orders Grid - CARD VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No orders found' : `No ${statusFilter === 'ALL' ? '' : statusFilter} orders`}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : statusFilter === 'ALL' 
                  ? 'No orders have been placed yet' 
                  : `No orders with status "${statusFilter}"`}
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleFilterChange('ALL');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const user = userCache[order.user?.id] || order.user;
            const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const firstProduct = order.items?.[0]?.product;

            return (
              <div 
                key={order.id}
                onClick={() => openOrderDetails(order)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-purple-300 cursor-pointer transition-all duration-200 group"
              >
                {/* Order Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${statusConfig.bg}`}>
                        <StatusIcon size={20} className={statusConfig.color.split(' ')[1]} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            Order #{order.id}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.badgeColor}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatShortDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {user?.name?.split(' ')[0] || `User #${order.user?.id}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-purple-600" size={20} />
                  </div>

                  {/* Product Image */}
                  {firstProduct && (
                    <div className="w-full h-36 rounded-lg overflow-hidden mb-4">
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

                  {/* Order Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ShoppingBag size={14} />
                        <span>{itemsCount} item{itemsCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>Order Progress</span>
                        <span>{statusConfig.label}</span>
                      </div>
                      <div className="relative">
                        <div className="absolute top-2.5 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                        <div 
                          className={`absolute top-2.5 left-0 h-1 rounded-full transition-all duration-500 ${
                            order.status === 'CANCELLED' 
                              ? 'bg-red-500' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-600'
                          }`}
                          style={{ width: `${(statusConfig.progress / 4) * 100}%` }}
                        ></div>
                        <div className="flex justify-between relative">
                          {[1, 2, 3, 4].map((step) => {
                            const isCompleted = step <= statusConfig.progress;
                            return (
                              <div key={step} className="relative">
                                <div className={`
                                  w-5 h-5 rounded-full flex items-center justify-center
                                  ${isCompleted 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                                    : 'bg-white border-2 border-gray-300'
                                  }
                                `}>
                                  {isCompleted && step === statusConfig.progress && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderDetails(order);
                        }}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                      
                      {canBeShipped(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order.id, 'SHIPPED');
                          }}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {updatingOrderId === order.id ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <Truck size={14} />
                          )}
                          Ship
                        </button>
                      )}
                      
                      {canBeDelivered(order) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order.id, 'DELIVERED');
                          }}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {updatingOrderId === order.id ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Deliver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${getStatusConfig(selectedOrder.status).bg}`}>
                    {React.createElement(getStatusConfig(selectedOrder.status).icon, { 
                      size: 24, 
                      className: getStatusConfig(selectedOrder.status).color.split(' ')[1] 
                    })}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedOrder.status).badgeColor}`}>
                        {getStatusConfig(selectedOrder.status).label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items & Progress */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Progress Timeline */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                      <Clock size={18} className="text-purple-600" />
                      Order Progress
                    </h3>
                    
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
                      <div 
                        className={`absolute top-6 left-0 h-1 -translate-y-1/2 transition-all duration-500 ${
                          selectedOrder.status === 'CANCELLED' 
                            ? 'bg-red-500' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600'
                        }`}
                        style={{ 
                          width: `${(getStatusConfig(selectedOrder.status).progress / 4) * 100}%` 
                        }}
                      ></div>
                      
                      {/* Steps */}
                      <div className="flex justify-between relative z-10">
                        {[
                          { step: 1, label: 'Order Created', status: 'CREATED', icon: Clock },
                          { step: 2, label: 'Payment', status: 'PAID', icon: CreditCard },
                          { step: 3, label: 'Shipped', status: 'SHIPPED', icon: Truck },
                          { step: 4, label: 'Delivered', status: 'DELIVERED', icon: CheckCircle }
                        ].map(({ step, label, status, icon: StepIcon }) => {
                          const isCompleted = step <= getStatusConfig(selectedOrder.status).progress;
                          const isCurrent = selectedOrder.status === status;
                          
                          return (
                            <div key={step} className="flex flex-col items-center text-center w-24">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center mb-3
                                ${isCompleted 
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                  : 'bg-white border-2 border-gray-300 text-gray-400'
                                }
                                ${isCurrent ? 'ring-4 ring-purple-200 ring-offset-2' : ''}
                                transition-all duration-300
                              `}>
                                {isCompleted ? (
                                  <CheckCircle size={20} className="text-white" />
                                ) : (
                                  <StepIcon size={20} />
                                )}
                              </div>
                              <p className={`text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                                {label}
                              </p>
                              {isCurrent && (
                                <p className="text-xs text-purple-600 font-medium mt-1">
                                  Current
                                </p>
                              )}
                              {isCompleted && !isCurrent && (
                                <p className="text-xs text-green-600 font-medium mt-1">
                                  ✓ Completed
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cancelled State */}
                    {selectedOrder.status === 'CANCELLED' && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <XCircle className="text-red-600" size={20} />
                          <div>
                            <p className="font-medium text-red-800">Order Cancelled</p>
                            <p className="text-sm text-red-700">
                              This order has been cancelled. Refund has been processed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-purple-600" />
                        Order Items ({selectedOrder.items?.length || 0})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="p-6 flex flex-col sm:flex-row gap-4 hover:bg-gray-50">
                          <div className="sm:w-20 sm:h-20 w-full h-40 rounded-lg overflow-hidden flex-shrink-0">
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
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 text-lg">
                                  {item.product?.name}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.product?.description || 'No description'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-medium text-gray-900 ml-2">
                                    {item.quantity}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Price:</span>
                                  <span className="font-medium text-gray-900 ml-2">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900 text-lg">
                                  {formatCurrency(item.price * item.quantity)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(item.price)} each
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Order Summary & Actions */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User size={18} className="text-purple-600" />
                      Customer Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <User size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium text-gray-900">
                            {userCache[selectedOrder.user?.id]?.name || selectedOrder.user?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mail size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">
                            {userCache[selectedOrder.user?.id]?.email || selectedOrder.user?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">
                            {userCache[selectedOrder.user?.id]?.phone || selectedOrder.user?.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">User ID: #{selectedOrder.user?.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Package size={18} className="text-purple-600" />
                      Order Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-gray-900">
                          {selectedOrder.totalAmount > 1000 ? 'Free' : formatCurrency(50)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (18% GST)</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(selectedOrder.totalAmount * 0.18)}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="font-bold text-purple-600 text-xl">
                            {formatCurrency(
                              selectedOrder.totalAmount + 
                              (selectedOrder.totalAmount > 1000 ? 0 : 50) + 
                              (selectedOrder.totalAmount * 0.18)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Truck size={18} className="text-purple-600" />
                      Order Actions
                    </h3>
                    <div className="space-y-3">
                      {canBeShipped(selectedOrder) && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'SHIPPED')}
                          disabled={updatingOrderId === selectedOrder.id}
                          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingOrderId === selectedOrder.id ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <Truck size={16} />
                          )}
                          Mark as Shipped
                        </button>
                      )}
                      
                      {canBeDelivered(selectedOrder) && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                          disabled={updatingOrderId === selectedOrder.id}
                          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingOrderId === selectedOrder.id ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Mark as Delivered
                        </button>
                      )}
                      
                      {canBeCancelled(selectedOrder) && (
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                          disabled={updatingOrderId === selectedOrder.id}
                          className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingOrderId === selectedOrder.id ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                          Cancel Order
                        </button>
                      )}
                      
                      <button
                        onClick={() => window.print()}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Printer size={16} />
                        Print Invoice
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock size={18} className="text-purple-600" />
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Order Created</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(selectedOrder.createdAt)}
                        </span>
                      </div>
                      {selectedOrder.status === 'PAID' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Payment Completed</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatDate(selectedOrder.updatedAt)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.status === 'SHIPPED' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Shipped On</span>
                          <span className="text-sm font-medium text-purple-600">
                            {formatDate(selectedOrder.updatedAt)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.status === 'DELIVERED' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Delivered On</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatDate(selectedOrder.updatedAt)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.status === 'CANCELLED' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Cancelled On</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatDate(selectedOrder.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Last updated: {formatDate(selectedOrder.updatedAt || selectedOrder.createdAt)}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={fetchAllOrders}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={fetchAllOrders}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 hover:scale-110"
        title="Refresh orders"
      >
        <RefreshCw size={20} />
      </button>
    </div>
  );
};

export default OrdersManagement;