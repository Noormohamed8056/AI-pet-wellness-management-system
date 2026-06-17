import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PawPrint,
  Activity,
  HeartPulse,
  SmilePlus,
  Plus,
  Calendar,
  Clock,
  Pill,
  ShoppingBag,
  ChevronRight,
  Star,
  Dog,
  Cat,
  Bird,
  Rabbit,
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileText,
  User,
  Stethoscope,
  TrendingUp,
  Award,
  MessageSquare,
  HelpCircle,
  Bell,
  Eye
} from "lucide-react";
import { getUserById } from "../../api/api";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const QuickActionCard = ({ title, icon, color, onClick, count }) => (
  <button
    onClick={onClick}
    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-purple-300 transition-all duration-200 flex items-center justify-between group"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      <span className="font-medium text-gray-700">{title}</span>
    </div>
    <div className="flex items-center gap-2">
      {count > 0 && (
        <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
          {count}
        </span>
      )}
      <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600" />
    </div>
  </button>
);

const PetCard = ({ pet, onClick }) => {
  const getPetIcon = (species) => {
    if (!species) return <PawPrint size={24} className="text-gray-600" />;
    const s = species.toLowerCase();
    if (s.includes('dog')) return <Dog size={24} className="text-amber-600" />;
    if (s.includes('cat')) return <Cat size={24} className="text-blue-600" />;
    if (s.includes('bird')) return <Bird size={24} className="text-green-600" />;
    if (s.includes('rabbit')) return <Rabbit size={24} className="text-pink-600" />;
    return <PawPrint size={24} className="text-purple-600" />;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all duration-200 flex items-center gap-4"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        {pet.imageUrl ? (
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          getPetIcon(pet.species)
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{pet.name}</h3>
        <p className="text-sm text-gray-500">{pet.breed || pet.species}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
            Healthy
          </span>
          {pet.age && (
            <span className="text-xs text-gray-400">{pet.age} years</span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </div>
  );
};

const AppointmentCard = ({ appointment, onView }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      BOOKED: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
      PAID: { color: 'bg-purple-100 text-purple-800', icon: <CreditCard className="w-3 h-3" /> },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      COMPLETED: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const config = statusConfig[status] || statusConfig.BOOKED;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        {getStatusBadge(appointment.status)}
        <span className="text-xs text-gray-400">
          {formatDate(appointment.slot?.slotDate)}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Stethoscope size={16} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">Dr. {appointment.vet?.name}</p>
          <p className="text-xs text-gray-500">{appointment.pet?.name}</p>
        </div>
      </div>
      <button
        onClick={() => onView(appointment)}
        className="mt-3 w-full py-2 text-sm border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-1"
      >
        <Eye size={14} />
        View Details
      </button>
    </div>
  );
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [cartItems, setCartItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [helpQueries, setHelpQueries] = useState([]);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user data
        const userRes = await getUserById(userId);
        setUser(userRes.data);

        // Load pets
        const petsRes = await api.get(`/pets/user/${userId}`);
        setPets(petsRes.data);

        // Load upcoming appointments
        try {
          const upcomingRes = await api.get(`/appointments/user/${userId}/upcoming`);
          setUpcomingAppointments(upcomingRes.data || []);
        } catch (error) {
          console.log('No upcoming appointments');
        }

        // Load completed appointments
        try {
          const completedRes = await api.get(`/appointments/user/${userId}/completed`);
          setCompletedAppointments(completedRes.data || []);
        } catch (error) {
          console.log('No completed appointments');
        }

        // Load prescriptions for each pet
        const allPrescriptions = [];
        for (const pet of petsRes.data) {
          try {
            const presRes = await api.get(`/prescriptions/pet/${pet.id}`);
            allPrescriptions.push(...(presRes.data || []));
          } catch (error) {
            // No prescriptions for this pet
          }
        }
        setPrescriptions(allPrescriptions);

        // Load cart items count
        try {
          const cartRes = await api.get(`/cart?userId=${userId}`);
          const items = cartRes.data?.items || [];
          setCartItems(items.reduce((sum, item) => sum + item.quantity, 0));
        } catch (error) {
          console.log('No cart data');
        }

        // Load help queries
        try {
          const helpRes = await api.get(`/help-support/user/${userId}`);
          setHelpQueries(helpRes.data || []);
        } catch (error) {
          console.log('No help queries');
        }

      } catch (error) {
        console.error("Failed to load owner data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      loadData();
    }
  }, [userId]);

  const openPetDetails = (pet) => {
    // Navigate to pet details or open modal
    navigate('/dashboard/owner/pets');
  };

  const openAppointmentDetails = (appointment) => {
    // You can open a modal or navigate to appointments page
    navigate('/dashboard/owner/appointments');
  };

  // Calculate wellness score based on pets and appointments
  const calculateWellnessScore = () => {
    if (pets.length === 0) return 0;
    const completedCount = completedAppointments.length;
    const baseScore = 70;
    const appointmentBonus = Math.min(completedCount * 5, 25);
    const petBonus = Math.min(pets.length * 2, 5);
    return Math.min(baseScore + appointmentBonus + petBonus, 100);
  };

  // Calculate activity level
  const calculateActivityLevel = () => {
    const upcomingCount = upcomingAppointments.length;
    if (upcomingCount >= 3) return "High";
    if (upcomingCount >= 1) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const wellnessScore = calculateWellnessScore();
  const activityLevel = calculateActivityLevel();
  const openQueries = helpQueries.filter(q => q.status === 'OPEN').length;

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Welcome back, {user?.name || 'Pet Parent'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your pets today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Activity Level"
          value={activityLevel}
          icon={<Activity className="text-purple-600" size={24} />}
          color="bg-purple-100"
          subtitle="Based on appointments"
        />
        <StatCard
          title="Total Pets"
          value={pets.length}
          icon={<PawPrint className="text-blue-600" size={24} />}
          color="bg-blue-100"
          subtitle={`${pets.filter(p => p.healthStatus === 'Healthy').length || 0} healthy`}
        />
        <StatCard
          title="Wellness Score"
          value={`${wellnessScore}%`}
          icon={<SmilePlus className="text-green-600" size={24} />}
          color="bg-green-100"
          subtitle="Pet health overview"
        />
        <StatCard
          title="Upcoming"
          value={upcomingAppointments.length}
          icon={<Calendar className="text-amber-600" size={24} />}
          color="bg-amber-100"
          subtitle="Appointments"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard
          title="My Pets"
          icon={<PawPrint size={18} />}
          color="bg-purple-100 text-purple-600"
          onClick={() => navigate('/dashboard/owner/pets')}
          count={pets.length}
        />
        <QuickActionCard
          title="Book Appointment"
          icon={<Calendar size={18} />}
          color="bg-blue-100 text-blue-600"
          onClick={() => navigate('/dashboard/owner/appointments')}
          count={upcomingAppointments.length}
        />
        <QuickActionCard
          title="Prescriptions"
          icon={<Pill size={18} />}
          color="bg-green-100 text-green-600"
          onClick={() => navigate('/dashboard/owner/prescriptions')}
          count={prescriptions.length}
        />
        <QuickActionCard
          title="Shop"
          icon={<ShoppingBag size={18} />}
          color="bg-pink-100 text-pink-600"
          onClick={() => navigate('/dashboard/owner/shop')}
          count={cartItems}
        />
        <QuickActionCard
          title="Orders"
          icon={<TrendingUp size={18} />}
          color="bg-amber-100 text-amber-600"
          onClick={() => navigate('/dashboard/owner/orders')}
        />
        <QuickActionCard
          title="Support"
          icon={<HelpCircle size={18} />}
          color="bg-red-100 text-red-600"
          onClick={() => navigate('/dashboard/owner/help')}
          count={openQueries}
        />
        <QuickActionCard
          title="Profile"
          icon={<User size={18} />}
          color="bg-indigo-100 text-indigo-600"
          onClick={() => navigate('/dashboard/owner/profile')}
        />
        <QuickActionCard
          title="Reviews"
          icon={<Star size={18} />}
          color="bg-emerald-100 text-emerald-600"
          onClick={() => navigate('/dashboard/owner/appointments?tab=completed')}
          count={completedAppointments.filter(a => a.feedback).length || 0}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - My Pets */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Pets Section */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <PawPrint className="text-purple-600" size={20} />
                My Pets
              </h2>
              <button
                onClick={() => navigate('/dashboard/owner/pets')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {pets.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <PawPrint size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 mb-3">No pets added yet</p>
                  <button
                    onClick={() => navigate('/dashboard/owner/pets')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Your First Pet
                  </button>
                </div>
              ) : (
                pets.slice(0, 3).map((pet) => (
                  <PetCard key={pet.id} pet={pet} onClick={() => openPetDetails(pet)} />
                ))
              )}
            </div>

            {pets.length > 3 && (
              <button
                onClick={() => navigate('/dashboard/owner/pets')}
                className="mt-3 w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1"
              >
                View {pets.length - 3} more pets
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="text-purple-600" size={20} />
                Upcoming Appointments
              </h2>
              <button
                onClick={() => navigate('/dashboard/owner/appointments')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight size={16} />
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No upcoming appointments</p>
                <button
                  onClick={() => navigate('/dashboard/owner/appointments')}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Book one now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingAppointments.slice(0, 2).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onView={openAppointmentDetails}
                  />
                ))}
              </div>
            )}

            {upcomingAppointments.length > 2 && (
              <button
                onClick={() => navigate('/dashboard/owner/appointments')}
                className="mt-3 w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-1"
              >
                View {upcomingAppointments.length - 2} more appointments
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Recent Prescriptions */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Pill className="text-purple-600" size={20} />
                Recent Prescriptions
              </h2>
              <button
                onClick={() => navigate('/dashboard/owner/prescriptions')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight size={16} />
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <Pill size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No prescriptions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.slice(0, 3).map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate('/dashboard/owner/prescriptions')}
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Pill size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{prescription.medicineName}</p>
                      <p className="text-xs text-gray-500">{prescription.dosage}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          

          {/* Quick Stats */}
          <div className="mt-10 bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded">
                    <CheckCircle size={14} className="text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Completed Consultations</span>
                </div>
                <span className="font-semibold text-gray-800">{completedAppointments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded">
                    <Pill size={14} className="text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Active Prescriptions</span>
                </div>
                <span className="font-semibold text-gray-800">{prescriptions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-100 rounded">
                    <MessageSquare size={14} className="text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">Support Tickets</span>
                </div>
                <span className="font-semibold text-gray-800">{openQueries}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-100 rounded">
                    <ShoppingBag size={14} className="text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-600">Cart Items</span>
                </div>
                <span className="font-semibold text-gray-800">{cartItems}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Pet Button (Floating for mobile) */}
      <button
        onClick={() => navigate('/dashboard/owner/pets')}
        className="fixed bottom-6 right-6 md:hidden bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default OwnerDashboard;