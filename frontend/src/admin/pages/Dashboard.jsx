import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  PawPrint,
  Calendar,
  Package,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Activity,
  ShoppingBag,
  CalendarCheck,
  FileText,
  Shield,
  ChevronRight,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Award,
  Star,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Syringe,
  CreditCard
} from 'lucide-react';
import {
  getAllVets,
  getAllOwners,
  getAllPets,
  getAllAppointments,
  getAllProducts,
  getAllHelpQueries,
  getAdminStats,
  getAppointmentStats,
  getAllOrdersAdmin
} from '../../api/api';
import { toast } from 'react-toastify';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  
  // Data states
  const [stats, setStats] = useState({
    totalVets: 0,
    totalOwners: 0,
    totalPets: 0,
    totalAppointments: 0,
    totalProducts: 0,
    totalQueries: 0,
    openQueries: 0,
    appointmentRevenue: 0, // Revenue from completed appointments
    ordersRevenue: 0, // Revenue from delivered orders
    totalRevenue: 0 // Combined revenue
  });

  const [recentData, setRecentData] = useState({
    recentAppointments: [],
    recentQueries: [],
    recentOrders: []
  });

  const [topVets, setTopVets] = useState([]);

  const [chartData, setChartData] = useState({
    appointmentsByDay: [],
    appointmentsByStatus: [],
    usersByRole: []
  });

  // Load all dashboard data
  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      // Fetch all data in parallel
      const [
        vetsRes,
        ownersRes,
        petsRes,
        appointmentsRes,
        productsRes,
        queriesRes,
        ordersRes,
        adminStatsRes,
        appointmentStatsRes
      ] = await Promise.allSettled([
        getAllVets(),
        getAllOwners(),
        getAllPets(),
        getAllAppointments(),
        getAllProducts(),
        getAllHelpQueries(),
        getAllOrdersAdmin(),
        getAdminStats(),
        getAppointmentStats()
      ]);

      // Process vets
      const vets = vetsRes.status === 'fulfilled' ? vetsRes.value.data : [];
      
      // Process owners
      const owners = ownersRes.status === 'fulfilled' ? ownersRes.value.data : [];
      
      // Process pets
      const pets = petsRes.status === 'fulfilled' ? petsRes.value.data : [];
      
      // Process appointments
      const appointments = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      
      // Process products
      const products = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
      
      // Process queries
      const queries = queriesRes.status === 'fulfilled' ? queriesRes.value.data : [];
      
      // Process orders
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];

      // Calculate open queries
      const openQueries = queries.filter(q => q.status === 'OPEN').length;
      
      // Calculate revenue from completed appointments
        const appointmentRevenue = appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce(
        (sum, a) => sum + (a.vet?.vetProfile?.consultationFee || 0),
        0
      );

      
      // Calculate revenue from delivered orders
      const ordersRevenue = orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Calculate top vets by revenue
      const vetRevenueMap = new Map();
      
      appointments
        .filter(a => a.status === 'COMPLETED' && a.vet)
        .forEach(app => {
          const vetId = app.vet.id;
          const vetName = app.vet.name;
        const revenue = app.vet?.vetProfile?.consultationFee || 0;
          
          if (vetRevenueMap.has(vetId)) {
            const existing = vetRevenueMap.get(vetId);
            existing.revenue += revenue;
            existing.appointments += 1;
          } else {
            vetRevenueMap.set(vetId, {
              id: vetId,
              name: vetName,
              revenue: revenue,
              appointments: 1,
              specialization: app.vet?.vetProfile?.specialization || 'General'
            });
          }
        });

      // Add orders revenue to vets if they have products? (optional)
      // For now, just sort and take top 5
      const topVetsList = Array.from(vetRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopVets(topVetsList);

      setStats({
        totalVets: vets.length,
        totalOwners: owners.length,
        totalPets: pets.length,
        totalAppointments: appointments.length,
        totalProducts: products.length,
        totalQueries: queries.length,
        openQueries,
        appointmentRevenue,
        ordersRevenue,
        totalRevenue: appointmentRevenue + ordersRevenue
      });

      // Set recent data
      setRecentData({
        recentAppointments: appointments.slice(0, 5),
        recentQueries: queries.slice(0, 5),
        recentOrders: orders.slice(0, 5)
      });

      // Generate chart data
      generateChartData(appointments, owners, vets);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const generateChartData = (appointments, owners, vets) => {
    // Appointments by day for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayAppointments = appointments.filter(a => {
        const appDate = new Date(a.createdAt);
        return appDate.toDateString() === date.toDateString();
      });

      last7Days.push({
        name: dateStr,
        appointments: dayAppointments.length,
        completed: dayAppointments.filter(a => a.status === 'COMPLETED').length,
        booked: dayAppointments.filter(a => a.status === 'BOOKED').length
      });
    }

    // Appointments by status
    const statusCounts = {
      BOOKED: appointments.filter(a => a.status === 'BOOKED').length,
      PAID: appointments.filter(a => a.status === 'PAID').length,
      APPROVED: appointments.filter(a => a.status === 'APPROVED').length,
      COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
      CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
      REJECTED: appointments.filter(a => a.status === 'REJECTED').length
    };

    const statusColors = {
      BOOKED: '#3B82F6',
      PAID: '#10B981',
      APPROVED: '#8B5CF6',
      COMPLETED: '#059669',
      CANCELLED: '#EF4444',
      REJECTED: '#F97316'
    };

    const appointmentsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: statusColors[name]
    })).filter(item => item.value > 0);

    // Users by role
    const usersByRole = [
      { name: 'Veterinarians', value: stats.totalVets, color: '#8B5CF6' },
      { name: 'Pet Owners', value: stats.totalOwners, color: '#3B82F6' }
    ];

    setChartData({
      appointmentsByDay: last7Days,
      appointmentsByStatus,
      usersByRole
    });
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExportReport = () => {
    // Generate CSV report
    const headers = ['Metric', 'Value'];
    const data = [
      ['Total Veterinarians', stats.totalVets],
      ['Total Pet Owners', stats.totalOwners],
      ['Total Pets', stats.totalPets],
      ['Total Appointments', stats.totalAppointments],
      ['Total Products', stats.totalProducts],
      ['Total Support Queries', stats.totalQueries],
      ['Open Queries', stats.openQueries],
      ['Appointment Revenue', `₹${stats.appointmentRevenue}`],
      ['Orders Revenue', `₹${stats.ordersRevenue}`],
      ['Total Revenue', `₹${stats.totalRevenue}`],
      ['Generated On', new Date().toLocaleString()]
    ];

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully!');
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'BOOKED': 'bg-blue-100 text-blue-700',
      'PAID': 'bg-green-100 text-green-700',
      'APPROVED': 'bg-purple-100 text-purple-700',
      'COMPLETED': 'bg-emerald-100 text-emerald-700',
      'CANCELLED': 'bg-red-100 text-red-700',
      'REJECTED': 'bg-orange-100 text-orange-700',
      'OPEN': 'bg-amber-100 text-amber-700',
      'RESOLVED': 'bg-green-100 text-green-700',
      'DELIVERED': 'bg-emerald-100 text-emerald-700'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <LayoutDashboard className="text-violet-600" size={32} />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Vets */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Stethoscope className="text-purple-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +12%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Total Veterinarians</h3>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(stats.totalVets)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <Activity size={12} />
            <span>8 active now</span>
          </div>
        </div>

        {/* Total Owners */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="text-blue-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +8%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Pet Owners</h3>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(stats.totalOwners)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <UserPlus size={12} />
            <span>24 new this month</span>
          </div>
        </div>

        {/* Total Pets */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <PawPrint className="text-green-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +15%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Registered Pets</h3>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(stats.totalPets)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <Activity size={12} />
            <span>Dogs: 65%, Cats: 25%</span>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Calendar className="text-amber-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +23%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Total Appointments</h3>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(stats.totalAppointments)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <Clock size={12} />
            <span>12 today</span>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-100 rounded-xl">
              <Package className="text-pink-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +5%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Products</h3>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(stats.totalProducts)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <ShoppingBag size={12} />
            <span>32 low in stock</span>
          </div>
        </div>

        {/* Support Queries */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <MessageSquare className="text-red-600" size={24} />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              {stats.openQueries} open
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Support Queries</h3>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(stats.totalQueries)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle size={12} />
            <span>{stats.totalQueries - stats.openQueries} resolved</span>
          </div>
        </div>

        {/* Appointment Revenue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CreditCard className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +18%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Appointment Revenue</h3>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.appointmentRevenue)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <CalendarCheck size={12} />
            <span>From completed appointments</span>
          </div>
        </div>

        {/* Orders Revenue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <ShoppingBag className="text-indigo-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUp size={12} />
              +18%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm mb-1">Orders Revenue</h3>
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.ordersRevenue)}</p>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <Package size={12} />
            <span>From delivered orders</span>
          </div>
        </div>
      </div>

      {/* Total Revenue Card - Prominent */}
      <div className="mb-8 bg-purple-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm mb-1">Total Platform Revenue</p>
            <p className="text-4xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-white/60 text-xs mt-2">
              Appointments: {formatCurrency(stats.appointmentRevenue)} • Orders: {formatCurrency(stats.ordersRevenue)}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-xl">
            <DollarSign size={48} className="text-white" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointments Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Appointments Trend</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  timeRange === 'week' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  timeRange === 'month' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.appointmentsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="booked" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments by Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Appointments by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={chartData.appointmentsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.appointmentsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4">
            {chartData.appointmentsByStatus.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Vets by Revenue */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Award className="text-amber-600" size={20} />
                Top 5 Veterinarians by Revenue
              </h2>
              <span className="text-sm text-gray-500">From completed appointments</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {topVets.length > 0 ? (
              topVets.map((vet, index) => (
                <div key={vet.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' :
                      'bg-gradient-to-r from-purple-500 to-indigo-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Stethoscope size={20} className="text-purple-600" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{vet.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Activity size={12} />
                          {vet.appointments} appointments
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Star size={12} className="text-amber-400" />
                          4.9 ★
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">{formatCurrency(vet.revenue)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    
                    {index === 0 && (
                      <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        Top Performer
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Award size={48} className="mx-auto text-gray-300 mb-2" />
                <p>No completed appointments data yet</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={() => navigate('/admin/vets')}
              className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              View All Veterinarians →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CalendarCheck className="text-violet-600" size={20} />
              Recent Appointments
            </h2>
            <button
              onClick={() => navigate('/admin/appointments')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentData.recentAppointments.length > 0 ? (
              recentData.recentAppointments.map((app) => (
                <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">#{app.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <PawPrint size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {app.pet?.name} with Dr. {app.vet?.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No recent appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Support Queries */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="text-violet-600" size={20} />
              Support Queries
            </h2>
            <button
              onClick={() => navigate('/admin/support')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentData.recentQueries.length > 0 ? (
              recentData.recentQueries.map((query) => (
                <div key={query.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">#{query.id}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(query.status)}`}>
                      {query.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users size={14} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">
                        {query.message?.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {query.user?.name} • {query.raisedBy}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No recent queries</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="text-violet-600" size={20} />
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/vets')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                  <Stethoscope size={18} className="text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">Manage Veterinarians</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/admin/owners')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                  <Users size={18} className="text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">Manage Pet Owners</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/admin/pets')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                  <PawPrint size={18} className="text-green-600" />
                </div>
                <span className="font-medium text-gray-700">Manage Pets</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/admin/appointments')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200">
                  <Calendar size={18} className="text-amber-600" />
                </div>
                <span className="font-medium text-gray-700">View Appointments</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/admin/products')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200">
                  <Package size={18} className="text-pink-600" />
                </div>
                <span className="font-medium text-gray-700">Product Management</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/admin/orders')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200">
                  <ShoppingBag size={18} className="text-emerald-600" />
                </div>
                <span className="font-medium text-gray-700">Manage Orders</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/admin/support')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <span className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200">
                  <MessageSquare size={18} className="text-red-600" />
                </div>
                <span className="font-medium text-gray-700">Support Center</span>
              </span>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>  
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;