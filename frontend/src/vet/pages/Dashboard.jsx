import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  PawPrint, 
  Clock, 
  CheckCircle, 
  Users,
  Dog,
  Pill,
  Stethoscope,
  Activity,
  TrendingUp,
  CalendarDays,
  AlertCircle,
  Eye,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Heart,
  Thermometer,
  FileText,
  Syringe,
  User,
  Building,
  Award,
  ChevronRight,
  Star,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from "../../api/api";
import { 
  getVetUpcomingAppointments,
  getVetCompletedAppointments,
  getPatientsByVet,
  getVetPetsMetrics,
  getActivePetAlerts,
  getVetSlots,
  
} from '../../api/api';

const VetDashboard = () => {
  const vetId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  
  // Stats Data
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    pendingRequests: 0,
    activeAlerts: 0,
    availableSlots: 0,
    totalSlots: 0,
    totalHealthMetrics: 0
  });
  
  // Detailed Data
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [recentMetrics, setRecentMetrics] = useState([]);
  
  // Vet Info
  const [vetInfo, setVetInfo] = useState({
    name: '',
    specialization: '',
    hospitalName: '',
    consultationFee: 0
  });

  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load vet profile info
        const vetProfileRes = await api.get(`/vets/profile/${vetId}`);
        const vetProfile = vetProfileRes.data;
        
        if (vetProfile) {
          const userRes = await api.get(`/users/${vetId}`);
          setVetInfo({
            name: userRes.data?.name || 'Dr. Unknown',
            specialization: vetProfile.specialization || 'General Veterinary',
            hospitalName: vetProfile.hospitalName || 'Veterinary Clinic',
            consultationFee: vetProfile.consultationFee || 500
          });
        }

        // Load all data in parallel
        const [
          upcomingRes,
          completedRes,
          patientsRes,
          slotsRes,
          metricsRes,
          alertsRes
        ] = await Promise.all([
          getVetUpcomingAppointments(vetId),
          getVetCompletedAppointments(vetId),
          getPatientsByVet(vetId),
          getVetSlots(vetId),
          getVetPetsMetrics(vetId),
          // Load alerts for all pets
          (async () => {
            const patients = await getPatientsByVet(vetId);
            const allAlerts = [];
            if (patients.data && patients.data.length > 0) {
              for (const pet of patients.data.slice(0, 3)) {
                try {
                  const alerts = await getActivePetAlerts(pet.id);
                  if (alerts.data && alerts.data.length > 0) {
                    alerts.data.forEach(alert => {
                      allAlerts.push({
                        ...alert,
                        petName: pet.name
                      });
                    });
                  }
                } catch (error) {
                  console.error(`Error loading alerts for pet ${pet.id}:`, error);
                }
              }
            }
            return allAlerts;
          })()
        ]);

        // Process upcoming appointments
        const upcomingApps = upcomingRes.data || [];
        const completedApps = completedRes.data || [];
        const patients = patientsRes.data || [];
        const slots = slotsRes.data || [];
        const metrics = metricsRes.data || [];
        
        // Calculate stats
        const availableSlots = slots.filter(slot => slot.available).length;
        const pendingRequests = upcomingApps.filter(app => app.status === 'PAID').length;
        
        // Get recent metrics (last 3)
        const sortedMetrics = [...metrics]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3)
          .map(metric => ({
            ...metric,
            date: new Date(metric.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })
          }));

        // Get recent patients (last 3)
        const sortedPatients = [...patients]
          .sort((a, b) => {
            // Sort by last visit or created date
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          })
          .slice(0, 3);

        // Set stats
        setStats({
          upcomingAppointments: upcomingApps.length,
          completedAppointments: completedApps.length,
          totalPatients: patients.length,
          pendingRequests,
          activeAlerts: alertsRes.length,
          availableSlots,
          totalSlots: slots.length,
          totalHealthMetrics: metrics.length
        });

        // Set detailed data
        setUpcomingAppointments(upcomingApps.slice(0, 5));
        setRecentPatients(sortedPatients);
        setActiveAlerts(alertsRes.slice(0, 3));
        setRecentMetrics(sortedMetrics);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [vetId]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : 'N/A';
  };

  // Get pet icon based on species
  const getPetIcon = (species) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return <Dog className="w-4 h-4 text-amber-600" />;
      case 'cat':
        return <PawPrint className="w-4 h-4 text-gray-600" />;
      default:
        return <PawPrint className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {vetInfo.name}! 👋
            </h1>
            <p className="text-gray-600 mb-4">
              {vetInfo.specialization} at {vetInfo.hospitalName}
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-full text-sm font-medium text-purple-700">
                <Award className="w-4 h-4" />
                Consultation Fee: ₹{vetInfo.consultationFee}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-sm font-medium text-blue-700">
                <Users className="w-4 h-4" />
                {stats.totalPatients} Patients
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
              <User className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Appointments */}
        <Link to="/dashboard/vet/appointments">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300 cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming Appointments</p>
                <h2 className="text-2xl font-bold text-gray-800">{stats.upcomingAppointments}</h2>
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Scheduled</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CalendarDays className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
                View Schedule <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Active Patients */}
        <Link to="/dashboard/vet/patients">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300 cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Patients</p>
                <h2 className="text-2xl font-bold text-gray-800">{stats.totalPatients}</h2>
                <div className="flex items-center gap-1 mt-2">
                  <Dog className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Under Care</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                View Patients <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Pending Approvals */}
        <Link to="/dashboard/vet/appointments">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300 cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Approvals</p>
                <h2 className="text-2xl font-bold text-gray-800">{stats.pendingRequests}</h2>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Awaiting action</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                Review Now <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Health Alerts */}
        <Link to="/dashboard/vet/health">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-red-300 cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Health Alerts</p>
                <h2 className="text-2xl font-bold text-gray-800">{stats.activeAlerts}</h2>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Require attention</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Activity className="text-red-600" size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                Check Alerts <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upcoming Appointments & Recent Health Metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointments */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Today's Appointments</h2>
                  <p className="text-sm text-gray-500">Upcoming consultations for today</p>
                </div>
              </div>
              <Link 
                to="/dashboard/vet/appointments"
                className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1"
              >
                View All <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No appointments scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">Check your availability or upcoming dates</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map(appointment => (
                  <div 
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{appointment.user?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            {getPetIcon(appointment.pet?.species)}
                            {appointment.pet?.name}
                          </span>
                          <span>•</span>
                          <span>{appointment.pet?.species}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {appointment.slot && formatTime(appointment.slot.startTime)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'PAID' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status}
                        </span>
                        <Link to={`/dashboard/vet/appointments`}>
                          <Eye className="w-4 h-4 text-gray-400 hover:text-purple-600" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Health Metrics - FIXED ALIGNMENT */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Recent Health Metrics</h2>
                  <p className="text-sm text-gray-500">Latest clinical readings from patients</p>
                </div>
              </div>
              <Link 
                to="/dashboard/vet/health"
                className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
              >
                View All <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {recentMetrics.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No health metrics recorded yet</p>
                <p className="text-sm text-gray-400 mt-1">Start monitoring your patients' health</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentMetrics.map((metric, index) => (
                  <div 
                    key={index}
                    className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 min-h-[120px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                          {getPetIcon(metric.petSpecies)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{metric.petName}</p>
                          <p className="text-xs text-gray-500">{metric.date}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Weight</span>
                        <span className="font-medium text-gray-800">{metric.weight}kg</span>
                      </div>
                      {metric.temperature && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Temp</span>
                          <span className="font-medium text-gray-800">{metric.temperature}°C</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Activity</span>
                        <span className="font-medium text-gray-800">{metric.activityLevel}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="space-y-8">
          {/* Recent Patients */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Recent Patients</h2>
                  <p className="text-sm text-gray-500">Recently added to your care</p>
                </div>
              </div>
              <Link 
                to="/dashboard/vet/patients"
                className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
              >
                View All <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {recentPatients.length === 0 ? (
              <div className="text-center py-8">
                <Dog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No patients yet</p>
                <p className="text-sm text-gray-400 mt-1">Patients will appear after consultations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPatients.map(patient => (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {patient.imageUrl ? (
                        <img 
                          src={patient.imageUrl} 
                          alt={patient.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border border-amber-200">
                          {getPetIcon(patient.species)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{patient.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{patient.species}</span>
                          {patient.age && (
                            <>
                              <span>•</span>
                              <span>{patient.age} yrs</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Alerts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Health Alerts</h2>
                  <p className="text-sm text-gray-500">Require immediate attention</p>
                </div>
              </div>
              <Link 
                to="/dashboard/vet/health"
                className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
              >
                View All <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active alerts</p>
                <p className="text-sm text-gray-400 mt-1">All patients are healthy</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAlerts.map((alert, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border ${
                      alert.severity === 'HIGH' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                      'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {alert.petName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{alert.alertType}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {/* <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/dashboard/vet/availability">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <CalendarDays className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-700">Manage Availability</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                </div>
              </Link>

              <Link to="/dashboard/vet/prescriptions">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Pill className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">Manage Prescriptions</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                </div>
              </Link>

              <Link to="/dashboard/vet/appointments">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">Start Consultation</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </Link>

              <Link to="/dashboard/vet/health">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <Activity className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-medium text-gray-700">Add Health Metric</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                </div>
              </Link>
            </div>
          </div> */}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed This Week</p>
              <p className="text-xl font-bold text-gray-800">{stats.completedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Health Metrics</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalHealthMetrics}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Syringe className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Prescriptions</p>
              <p className="text-xl font-bold text-gray-800">24</p>
              <p className="text-xs text-gray-500">Active prescriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Slots</p>
              <p className="text-xl font-bold text-gray-800">{stats.availableSlots}/{stats.totalSlots}</p>
              <p className="text-xs text-gray-500">Free slots this week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetDashboard;