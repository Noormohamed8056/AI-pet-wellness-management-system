import { useEffect, useState } from "react";
import {
  getAllAppointments,
  getUserDetails,
  getPetDetails,
  getVetProfile,
  getAppointmentStats
} from "../../api/api";
import {
  X,
  Calendar,
  Clock,
  User,
  PawPrint,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock as ClockIcon,
  DollarSign,
  FileText,
  Mail,
  Phone,
  CalendarCheck,
  CalendarX,
  Filter,
  Search,
  ChevronDown,
  Eye,
  RefreshCw,
  Download
} from "lucide-react";
import { toast } from 'react-toastify';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState({
    user: null,
    pet: null,
    vet: null,
    vetProfile: null
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });
  const [stats, setStats] = useState({
    total: 0,
    booked: 0,
    paid: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    revenue: 0
  });
  const [viewMode, setViewMode] = useState("table"); // table or grid

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await getAllAppointments();
      setAppointments(res.data);
      setFilteredAppointments(res.data);
      calculateStats(res.data);
    } catch (error) {
      toast.error("Failed to load appointments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getAppointmentStats();
      setStats(res.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadStats();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [appointments, filterStatus, searchTerm, dateRange]);

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      booked: data.filter(a => a.status === 'BOOKED').length,
      paid: data.filter(a => a.status === 'PAID').length,
      approved: data.filter(a => a.status === 'APPROVED').length,
      completed: data.filter(a => a.status === 'COMPLETED').length,
      cancelled: data.filter(a => a.status === 'CANCELLED').length,
      rejected: data.filter(a => a.status === 'REJECTED').length,
      revenue: data
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => {
          // Try to get fee from vet profile if available
          const fee = a.vet?.consultationFee || 0;
          return sum + fee;
        }, 0)
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.user?.name?.toLowerCase().includes(term) ||
        app.pet?.name?.toLowerCase().includes(term) ||
        app.vet?.name?.toLowerCase().includes(term) ||
        app.id?.toString().includes(term)
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day

      filtered = filtered.filter(app => {
        const appDate = new Date(app.createdAt);
        return appDate >= startDate && appDate <= endDate;
      });
    } else if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(app => new Date(app.createdAt) >= startDate);
    } else if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(app => new Date(app.createdAt) <= endDate);
    }

    setFilteredAppointments(filtered);
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
  };

  const openAppointment = async (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDetails({
      user: null,
      pet: null,
      vet: null,
      vetProfile: null
    });

    try {
      // Load user details
      if (appointment.user?.id) {
        const userRes = await getUserDetails(appointment.user.id);
        setSelectedDetails(prev => ({ ...prev, user: userRes.data }));
      }

      // Load pet details
      if (appointment.pet?.id) {
        const petRes = await getPetDetails(appointment.pet.id);
        setSelectedDetails(prev => ({ ...prev, pet: petRes.data }));
      }

      // Load vet details
      if (appointment.vet?.id) {
        const vetRes = await getUserDetails(appointment.vet.id);
        const vetProfileRes = await getVetProfile(appointment.vet.id);
        setSelectedDetails(prev => ({ 
          ...prev, 
          vet: vetRes.data,
          vetProfile: vetProfileRes.data 
        }));
      }
    } catch (error) {
      console.error("Error loading appointment details:", error);
      toast.error("Failed to load complete details");
    }
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setSelectedDetails({
      user: null,
      pet: null,
      vet: null,
      vetProfile: null
    });
  };

  // Get status badge color and icon
  const getStatusBadge = (status) => {
    const statusMap = {
      'BOOKED': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CalendarCheck },
      'PAID': { color: 'bg-green-100 text-green-700 border-green-200', icon: DollarSign },
      'APPROVED': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
      'COMPLETED': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      'REJECTED': { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: XCircle }
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date only
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Owner', 'Owner Email', 'Pet', 'Species', 'Vet', 'Status', 'Fee'];
    const csvData = filteredAppointments.map(app => [
      app.id,
      formatDateOnly(app.createdAt),
      app.user?.name || 'N/A',
      app.user?.email || 'N/A',
      app.pet?.name || 'N/A',
      app.pet?.species || 'N/A',
      app.vet?.name || 'N/A',
      app.status,
      app.vet?.consultationFee || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Calendar className="text-violet-600" size={32} />
          Appointments Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={loadAppointments}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw size={18} className="text-gray-600" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all flex items-center gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-3">
          <p className="text-xs text-blue-600">Booked</p>
          <p className="text-xl font-bold text-blue-700">{stats.booked}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-3">
          <p className="text-xs text-green-600">Paid</p>
          <p className="text-xl font-bold text-green-700">{stats.paid}</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-3">
          <p className="text-xs text-purple-600">Approved</p>
          <p className="text-xl font-bold text-purple-700">{stats.approved}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3">
          <p className="text-xs text-emerald-600">Completed</p>
          <p className="text-xl font-bold text-emerald-700">{stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3">
          <p className="text-xs text-red-600">Cancelled</p>
          <p className="text-xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3">
          <p className="text-xs text-orange-600">Rejected</p>
          <p className="text-xl font-bold text-orange-700">{stats.rejected}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
          <p className="text-xs text-amber-600">Revenue</p>
          <p className="text-xl font-bold text-amber-700">₹{stats.revenue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by owner, pet, vet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-48">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="BOOKED">Booked</option>
              <option value="PAID">Paid</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters */}
          {(filterStatus !== 'all' || searchTerm || dateRange.start || dateRange.end) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all flex items-center gap-2"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
          <span>
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </span>
          {filteredAppointments.length !== appointments.length && (
            <span className="text-violet-600">
              Filtered: {filteredAppointments.length} results
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Appointments Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vet</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((app) => {
                  const status = getStatusBadge(app.status);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openAppointment(app)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{app.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(app.createdAt)}
                        </div>
                        {app.slot && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock size={12} />
                            {app.slot.startTime} - {app.slot.endTime}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={14} className="text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{app.user?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{app.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <PawPrint size={14} className="text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{app.pet?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{app.pet?.species || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Stethoscope size={14} className="text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{app.vet?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{app.vet?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          <StatusIcon size={12} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₹{app.vet?.consultationFee || 0}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAppointment(app);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-700">No appointments found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                      <button
                        onClick={clearFilters}
                        className="mt-4 px-4 py-2 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scale">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar size={24} />
                    Appointment #{selectedAppointment.id}
                  </h2>
                  <p className="text-white/80 mt-1">
                    {formatDate(selectedAppointment.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Status and Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {(() => {
                    const status = getStatusBadge(selectedAppointment.status);
                    const StatusIcon = status.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                        <StatusIcon size={14} />
                        {selectedAppointment.status}
                      </span>
                    );
                  })()}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Payment</p>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className={selectedAppointment.payment ? 'text-green-600' : 'text-yellow-600'} />
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedAppointment.payment ? (
                        <span className="text-green-600">Paid</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </p>
                  </div>
                  {selectedAppointment.payment && (
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {selectedAppointment.payment.razorpayPaymentId || 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              {/* Time Slot */}
              {selectedAppointment.slot && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Appointment Slot</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-violet-600" />
                      <span className="text-gray-800 font-medium">{selectedAppointment.slot.slotDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon size={16} className="text-violet-600" />
                      <span className="text-gray-800">
                        {selectedAppointment.slot.startTime} - {selectedAppointment.slot.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Details */}
              {selectedDetails.user && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User size={18} className="text-violet-600" />
                    Owner Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{selectedDetails.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{selectedDetails.user.email}</p>
                    </div>
                    {selectedDetails.user.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium text-gray-800">{selectedDetails.user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pet Details */}
              {selectedDetails.pet && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <PawPrint size={18} className="text-violet-600" />
                    Pet Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{selectedDetails.pet.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Species</p>
                      <p className="font-medium text-gray-800">{selectedDetails.pet.species || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Breed</p>
                      <p className="font-medium text-gray-800">{selectedDetails.pet.breed || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age</p>
                      <p className="font-medium text-gray-800">{selectedDetails.pet.age || 'N/A'} years</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vet Details */}
              {selectedDetails.vet && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Stethoscope size={18} className="text-violet-600" />
                    Veterinarian Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{selectedDetails.vet.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{selectedDetails.vet.email}</p>
                    </div>
                    {selectedDetails.vetProfile && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Specialization</p>
                          <p className="font-medium text-gray-800">{selectedDetails.vetProfile.specialization || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="font-medium text-gray-800">{selectedDetails.vetProfile.experienceYears || 0} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Fee</p>
                          <p className="font-medium text-gray-800">₹{selectedDetails.vetProfile.consultationFee || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">License</p>
                          <p className="font-medium text-gray-800">{selectedDetails.vetProfile.licenseNumber || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Record (if exists) */}
              {selectedAppointment.medicalRecord && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-violet-600" />
                    Medical Record
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Diagnosis</p>
                      <p className="text-sm text-gray-700 mt-1">{selectedAppointment.medicalRecord.diagnosis || 'No diagnosis'}</p>
                    </div>
                    {selectedAppointment.medicalRecord.notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm text-gray-500 italic mt-1">{selectedAppointment.medicalRecord.notes}</p>
                      </div>
                    )}
                    {selectedAppointment.medicalRecord.createdAt && (
                      <div>
                        <p className="text-xs text-gray-500">Recorded On</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedAppointment.medicalRecord.createdAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Close button only - no actions for admin view */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animation */}
      <style>{`
        @keyframes scale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale {
          animation: scale 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Appointments;