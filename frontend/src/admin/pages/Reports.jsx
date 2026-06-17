import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Stethoscope,
  PawPrint,
  Package,
  ShoppingBag,
  CreditCard,
  PieChart,
  BarChart3,
  LineChart,
  DownloadCloud,
  Award,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  FileBarChart,
  FileSpreadsheet,
  FilePieChart,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Scale,
  Activity,
  Globe,
  TrendingDown,
  Zap,
  Target,
  Shield,
  Layers
} from 'lucide-react';
import {
  getAllVets,
  getAllOwners,
  getAllPets,
  getAllAppointments,
  getAllProducts,
  getAllOrdersAdmin,
  getAdminStats,
  getAppointmentStats
} from '../../api/api';
import { toast } from 'react-toastify';
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('month'); // week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    revenue: true,
    appointments: true,
    performance: true,
    products: true
  });

  // Data states
  const [stats, setStats] = useState({
    totalVets: 0,
    totalOwners: 0,
    totalPets: 0,
    totalAppointments: 0,
    totalProducts: 0,
    totalOrders: 0,
    appointmentRevenue: 0,
    ordersRevenue: 0,
    totalRevenue: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0,
    avgRating: 4.8,
    activeVets: 0,
    newUsersThisMonth: 0
  });

  const [chartData, setChartData] = useState({
    revenueByMonth: [],
    appointmentsByDay: [],
    appointmentsByStatus: [],
    performanceMetrics: [],
    topVets: [],
    topProducts: []
  });

  const [periodComparison, setPeriodComparison] = useState({
    revenueGrowth: 12.5,
    appointmentsGrowth: 8.3,
    usersGrowth: 5.7,
    petsGrowth: 10.2,
    conversionRate: 78.5,
    avgAppointmentValue: 850,
    customerRetention: 92.3,
    peakHours: '10 AM - 2 PM'
  });

  // Filtered data based on date range
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Function to filter data by date range
  const filterDataByDateRange = (appointments, orders) => {
    let startDate = null;
    let endDate = new Date(); // Today as default end

    // Determine date range
    if (dateRange === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (dateRange === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // Include entire end day
    }

    // If no valid start date, return all data
    if (!startDate) {
      return { appointments, orders };
    }

    // Filter appointments
    const filteredApps = appointments.filter(app => {
      const appDate = new Date(app.createdAt);
      return appDate >= startDate && appDate <= endDate;
    });

    // Filter orders
    const filteredOrd = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    return { appointments: filteredApps, orders: filteredOrd };
  };

  // Load report data
  const loadReportData = async () => {
    setRefreshing(true);
    try {
      const [
        vetsRes,
        ownersRes,
        petsRes,
        appointmentsRes,
        productsRes,
        ordersRes,
        adminStatsRes,
        appointmentStatsRes
      ] = await Promise.allSettled([
        getAllVets(),
        getAllOwners(),
        getAllPets(),
        getAllAppointments(),
        getAllProducts(),
        getAllOrdersAdmin(),
        getAdminStats(),
        getAppointmentStats()
      ]);

      const vets = vetsRes.status === 'fulfilled' ? vetsRes.value.data : [];
      const owners = ownersRes.status === 'fulfilled' ? ownersRes.value.data : [];
      const pets = petsRes.status === 'fulfilled' ? petsRes.value.data : [];
      const appointments = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const products = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];

      // Apply date filtering
      const { appointments: filteredApps, orders: filteredOrd } = filterDataByDateRange(appointments, orders);
      
      setFilteredAppointments(filteredApps);
      setFilteredOrders(filteredOrd);

      // Calculate revenues from filtered data
      const appointmentRevenue = filteredApps
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => sum + (a.vet?.vetProfile?.consultationFee || 0), 0);

      const ordersRevenue = filteredOrd
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const completedAppointments = filteredApps.filter(a => a.status === 'COMPLETED').length;
      const cancelledAppointments = filteredApps.filter(a => a.status === 'CANCELLED' || a.status === 'REJECTED').length;
      const pendingAppointments = filteredApps.filter(a => a.status === 'BOOKED' || a.status === 'PAID' || a.status === 'APPROVED').length;
      
      const activeVets = vets.filter(v => v.approved).length;
      const newUsersThisMonth = owners.filter(o => {
        const created = new Date(o.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalVets: vets.length,
        totalOwners: owners.length,
        totalPets: pets.length,
        totalAppointments: filteredApps.length,
        totalProducts: products.length,
        totalOrders: filteredOrd.length,
        appointmentRevenue,
        ordersRevenue,
        totalRevenue: appointmentRevenue + ordersRevenue,
        completedAppointments,
        cancelledAppointments,
        pendingAppointments,
        avgRating: 4.8,
        activeVets,
        newUsersThisMonth
      });

      // Generate report charts with filtered data
      generateReportCharts(filteredApps, vets, products, filteredOrd);

    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange, customStartDate, customEndDate]);

  const generateReportCharts = (appointments, vets, products, orders) => {
    // Revenue by month (last 6 months)
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      
      // Filter appointments by month
      const monthAppointments = appointments.filter(a => {
        const aDate = new Date(a.createdAt);
        return aDate.getMonth() === d.getMonth() && aDate.getFullYear() === d.getFullYear() && a.status === 'COMPLETED';
      });
      
      const monthRevenue = monthAppointments.reduce((sum, a) => sum + (a.vet?.vetProfile?.consultationFee || 0), 0);
      
      months.push({
        name: monthStr,
        appointments: monthAppointments.length,
        revenue: monthRevenue,
        orders: 0 // Add orders revenue if available
      });
    }

    // Appointments by day (last 7 days)
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
        completed: dayAppointments.filter(a => a.status === 'COMPLETED').length
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

    // Performance metrics
    const performanceMetrics = [
      { name: 'Conversion Rate', value: 78.5, target: 85, unit: '%' },
      { name: 'Customer Retention', value: 92.3, target: 90, unit: '%' },
      { name: 'Avg Appointment Value', value: 850, target: 1000, unit: '₹' },
      { name: 'Vet Utilization', value: 68, target: 75, unit: '%' }
    ];

    // Top vets by revenue
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
            appointments: 1
          });
        }
      });

    const topVets = Array.from(vetRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top products
    const productSalesMap = new Map();
    orders
      .filter(o => o.status === 'DELIVERED')
      .forEach(order => {
        order.items?.forEach(item => {
          const productId = item.product?.id;
          const productName = item.product?.name;
          const revenue = item.price * item.quantity;
          
          if (productSalesMap.has(productId)) {
            const existing = productSalesMap.get(productId);
            existing.revenue += revenue;
            existing.quantity += item.quantity;
          } else {
            productSalesMap.set(productId, {
              id: productId,
              name: productName || 'Unknown Product',
              revenue: revenue,
              quantity: item.quantity
            });
          }
        });
      });

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setChartData({
      revenueByMonth: months,
      appointmentsByDay: last7Days,
      appointmentsByStatus,
      performanceMetrics,
      topVets,
      topProducts
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Dark blue-gray
    doc.text('PetCare Platform Report', 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Date Range: ${getDateRangeText()}`, 14, 37);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Executive Summary', 14, 52);
    
    doc.setFontSize(10);
    doc.text(`Total Revenue: ${formatCurrency(stats.totalRevenue)}`, 20, 62);
    doc.text(`Total Veterinarians: ${formatNumber(stats.totalVets)}`, 20, 69);
    doc.text(`Total Pet Owners: ${formatNumber(stats.totalOwners)}`, 20, 76);
    doc.text(`Total Pets: ${formatNumber(stats.totalPets)}`, 20, 83);
    doc.text(`Total Appointments: ${formatNumber(stats.totalAppointments)}`, 20, 90);
    doc.text(`Total Orders: ${formatNumber(stats.totalOrders)}`, 20, 97);
    
    // Revenue Breakdown
    doc.setFontSize(14);
    doc.text('Revenue Breakdown', 14, 112);
    
    doc.setFontSize(10);
    doc.text(`Appointment Revenue: ${formatCurrency(stats.appointmentRevenue)}`, 20, 122);
    doc.text(`Orders Revenue: ${formatCurrency(stats.ordersRevenue)}`, 20, 129);
    
    // Save PDF
    doc.save(`petcare-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report downloaded successfully!');
  };

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Date Range', getDateRangeText()],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['Total Revenue', formatCurrency(stats.totalRevenue)],
      ['Appointment Revenue', formatCurrency(stats.appointmentRevenue)],
      ['Orders Revenue', formatCurrency(stats.ordersRevenue)],
      ['Total Veterinarians', stats.totalVets],
      ['Total Pet Owners', stats.totalOwners],
      ['Total Pets', stats.totalPets],
      ['Total Appointments', stats.totalAppointments],
      ['Completed Appointments', stats.completedAppointments],
      ['Cancelled Appointments', stats.cancelledAppointments],
      ['Pending Appointments', stats.pendingAppointments],
      ['Total Orders', stats.totalOrders],
      ['Total Products', stats.totalProducts],
      ['Active Vets', stats.activeVets],
      ['New Users This Month', stats.newUsersThisMonth],
      ['Avg Rating', stats.avgRating]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Top Vets sheet
    const topVetsData = [
      ['Rank', 'Veterinarian', 'Appointments', 'Revenue'],
      ...chartData.topVets.map((vet, index) => [
        index + 1,
        vet.name,
        vet.appointments,
        formatCurrency(vet.revenue)
      ])
    ];
    
    const topVetsSheet = XLSX.utils.aoa_to_sheet(topVetsData);
    XLSX.utils.book_append_sheet(workbook, topVetsSheet, 'Top Vets');
    
    // Top Products sheet
    const topProductsData = [
      ['Rank', 'Product', 'Quantity Sold', 'Revenue'],
      ...chartData.topProducts.map((product, index) => [
        index + 1,
        product.name,
        product.quantity,
        formatCurrency(product.revenue)
      ])
    ];
    
    const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top Products');
    
    // Export
    XLSX.writeFile(workbook, `petcare-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel report downloaded successfully!');
  };

  const getDateRangeText = () => {
    if (dateRange === 'week') return 'Last 7 Days';
    if (dateRange === 'month') return 'This Month';
    if (dateRange === 'year') return 'This Year';
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} to ${customEndDate}`;
    }
    return 'All Time';
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      setDateRange('custom');
      setShowCustomPicker(false);
      loadReportData(); // This will be triggered by useEffect
    } else {
      toast.warning('Please select both start and end dates');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Reports & Analytics
          </h1>
          <p className="text-gray-500 mt-1">
            Generate and export comprehensive platform reports
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            <Download size={16} />
            PDF Report
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarRange size={18} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setDateRange('week');
                setShowCustomPicker(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'week' && !showCustomPicker
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                setDateRange('month');
                setShowCustomPicker(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'month' && !showCustomPicker
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => {
                setDateRange('year');
                setShowCustomPicker(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'year' && !showCustomPicker
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showCustomPicker
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Custom Range
            </button>
          </div>

          {showCustomPicker && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={handleApplyCustomRange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          )}
        </div>
        
        {/* Active Range Display */}
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">Current Range:</span> {getDateRangeText()}
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-800 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileBarChart size={24} />
            Executive Summary
          </h2>
          <button
            onClick={() => toggleSection('summary')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            {expandedSections.summary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expandedSections.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-300">
                <ArrowUpRight size={14} />
                <span className="text-xs">+{periodComparison.revenueGrowth}% vs last period</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Total Appointments</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalAppointments)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-300">
                <ArrowUpRight size={14} />
                <span className="text-xs">+{periodComparison.appointmentsGrowth}% vs last period</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Active Users</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalOwners + stats.totalVets)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-300">
                <ArrowUpRight size={14} />
                <span className="text-xs">+{periodComparison.usersGrowth}% vs last period</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Registered Pets</p>
              <p className="text-2xl font-bold">{formatNumber(stats.totalPets)}</p>
              <div className="flex items-center gap-1 mt-2 text-green-300">
                <ArrowUpRight size={14} />
                <span className="text-xs">+{periodComparison.petsGrowth}% vs last period</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Analysis Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-blue-600" size={20} />
              Revenue Analysis
            </h2>
            <button
              onClick={() => toggleSection('revenue')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expandedSections.revenue ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {expandedSections.revenue && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-xl p-5">
                <p className="text-sm text-blue-600 mb-1">Appointment Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.appointmentRevenue)}</p>
                <p className="text-xs text-gray-500 mt-2">From completed consultations</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5">
                <p className="text-sm text-slate-600 mb-1">Orders Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.ordersRevenue)}</p>
                <p className="text-xs text-gray-500 mt-2">From delivered orders</p>
              </div>
              
              <div className="bg-gradient-to-r from-slate-800 to-blue-800 rounded-xl p-5 text-white">
                <p className="text-white/80 text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-white/60 text-xs mt-2">Combined platform revenue</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.revenueByMonth}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revenueGradient)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Appointments Analysis */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Appointments Analysis
            </h2>
            <button
              onClick={() => toggleSection('appointments')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expandedSections.appointments ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {expandedSections.appointments && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trend */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Appointment Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={chartData.appointmentsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip />
                      <Bar dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Appointments by Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={chartData.appointmentsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {chartData.appointmentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Appointment Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 mb-1">Completed</p>
                <p className="text-xl font-bold text-gray-800">{formatNumber(stats.completedAppointments)}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-xs text-yellow-600 mb-1">Pending</p>
                <p className="text-xl font-bold text-gray-800">{formatNumber(stats.pendingAppointments)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-red-600 mb-1">Cancelled</p>
                <p className="text-xl font-bold text-gray-800">{formatNumber(stats.cancelledAppointments)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Target className="text-blue-600" size={20} />
              Key Performance Indicators
            </h2>
            <button
              onClick={() => toggleSection('performance')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expandedSections.performance ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {expandedSections.performance && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Conversion Rate */}
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp size={18} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    vs {periodComparison.conversionRate}% target
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-800">{periodComparison.conversionRate}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(periodComparison.conversionRate / 100) * 100}%` }}></div>
                </div>
              </div>

              {/* Avg Appointment Value */}
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign size={18} className="text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    Target: ₹{periodComparison.avgAppointmentValue}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Avg Appointment Value</p>
                <p className="text-2xl font-bold text-gray-800">₹{periodComparison.avgAppointmentValue}</p>
                <p className="text-xs text-gray-500 mt-2">Based on completed appointments</p>
              </div>

              {/* Customer Retention */}
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users size={18} className="text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    +{periodComparison.customerRetention}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Customer Retention</p>
                <p className="text-2xl font-bold text-gray-800">{periodComparison.customerRetention}%</p>
                <p className="text-xs text-gray-500 mt-2">Returning customers</p>
              </div>

              {/* Peak Hours */}
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Busiest time
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Peak Hours</p>
                <p className="text-2xl font-bold text-gray-800">{periodComparison.peakHours}</p>
                <p className="text-xs text-gray-500 mt-2">Most appointments scheduled</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">Avg Rating</p>
                <p className="text-lg font-bold text-gray-800">{stats.avgRating} ★</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Active Vets</p>
                <p className="text-lg font-bold text-gray-800">{stats.activeVets}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">New Users</p>
                <p className="text-lg font-bold text-gray-800">{stats.newUsersThisMonth}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-lg font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Vets */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Award className="text-blue-600" size={20} />
              Top 5 Veterinarians by Revenue
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {chartData.topVets.length > 0 ? (
              chartData.topVets.map((vet, index) => (
                <div key={vet.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' :
                      'bg-blue-200 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope size={18} className="text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{vet.name}</p>
                      <p className="text-xs text-gray-500">{vet.appointments} appointments</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatCurrency(vet.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Award size={48} className="mx-auto text-gray-300 mb-2" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-600" size={20} />
              Top 5 Products by Sales
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {chartData.topProducts.length > 0 ? (
              chartData.topProducts.map((product, index) => (
                <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                      {index + 1}
                    </div>
                    
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package size={18} className="text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package size={48} className="mx-auto text-gray-300 mb-2" />
                <p>No product sales data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Peak Performance</p>
              <p className="text-sm font-semibold text-gray-800">{periodComparison.peakHours}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-sm font-semibold text-gray-800">
                {((stats.completedAppointments / stats.totalAppointments) * 100 || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Platform Reach</p>
              <p className="text-sm font-semibold text-gray-800">{formatNumber(stats.totalOwners + stats.totalVets)} users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Growth</p>
              <p className="text-sm font-semibold text-green-600">+{periodComparison.usersGrowth}% MoM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;