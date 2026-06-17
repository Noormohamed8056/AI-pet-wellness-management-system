import React, { useState, useEffect } from 'react';
import { 
  Syringe, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Filter,
  Search,
  Download,
  Printer,
  Shield,
  Activity,
  Bell,
  CalendarDays,
  Dog,
  Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/api';

const Vaccinations = () => {
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, DONE, DUE, OVERDUE
  const [filterType, setFilterType] = useState('ALL'); // ALL, CORE, NON_CORE
  const [selectedVaccination, setSelectedVaccination] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load user pets on component mount
  useEffect(() => {
    const loadPets = async () => {
      try {
        const response = await api.get(`/pets/user/${userId}`);
        setPets(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedPet(response.data[0]);
        }
      } catch (error) {
        toast.error('Failed to load pets');
        console.error('Error loading pets:', error);
      }
    };
    loadPets();
  }, [userId]);

  // Load vaccinations when pet is selected
  useEffect(() => {
    if (selectedPet) {
      loadVaccinations();
    }
  }, [selectedPet]);

  const loadVaccinations = async () => {
    if (!selectedPet) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/vaccinations/pet/${selectedPet.id}`);
      setVaccinations(response.data || []);
    } catch (error) {
      toast.error('Failed to load vaccinations');
      console.error('Error loading vaccinations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter vaccinations based on status and type
  const filteredVaccinations = vaccinations.filter(vaccination => {
    const statusMatch = filterStatus === 'ALL' || vaccination.status === filterStatus;
    const typeMatch = filterType === 'ALL' || vaccination.type === filterType;
    return statusMatch && typeMatch;
  });

  // Categorize vaccinations by status
  const doneVaccinations = vaccinations.filter(v => v.status === 'DONE');
  const dueVaccinations = vaccinations.filter(v => v.status === 'DUE');
  const overdueVaccinations = vaccinations.filter(v => v.status === 'OVERDUE');

  // Get status badge configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'DONE':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Completed'
        };
      case 'DUE':
        return {
          color: 'bg-amber-100 text-amber-800',
          icon: <Bell className="w-3 h-3" />,
          label: 'Due Soon'
        };
      case 'OVERDUE':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Overdue'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <Activity className="w-3 h-3" />,
          label: 'Unknown'
        };
    }
  };

  // Get type badge configuration
  const getTypeConfig = (type) => {
    switch (type) {
      case 'CORE':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <Shield className="w-3 h-3" />,
          label: 'Core Vaccine'
        };
      case 'NON_CORE':
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: <Syringe className="w-3 h-3" />,
          label: 'Non-Core Vaccine'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <Syringe className="w-3 h-3" />,
          label: 'Unknown'
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days until due
  const getDaysUntilDue = (nextDueDate) => {
    if (!nextDueDate) return null;
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewDetails = (vaccination) => {
    setSelectedVaccination(vaccination);
    setShowDetailsModal(true);
  };

  if (loading && !selectedPet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vaccinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Syringe className="text-purple-600" />
            Vaccinations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your pet's vaccination records
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vaccinations..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Pet Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Select Pet</h3>
            <div className="flex flex-wrap gap-2">
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                    selectedPet?.id === pet.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <Dog className="w-4 h-4" />
                  <span>{pet.name}</span>
                  <span className="text-xs text-gray-500">({pet.species})</span>
                </button>
              ))}
            </div>
          </div>
          
          {selectedPet && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedPet.name}</span>
              <span className="mx-2">•</span>
              <span>{selectedPet.breed}</span>
              <span className="mx-2">•</span>
              <span>{selectedPet.species}</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-800">{doneVaccinations.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Vaccinations administered</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Soon</p>
              <p className="text-2xl font-bold text-gray-800">{dueVaccinations.length}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">Upcoming vaccinations</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-800">{overdueVaccinations.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2">Requires immediate attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <div className="flex gap-2">
                {['ALL', 'DONE', 'DUE', 'OVERDUE'].map(status => {
                  const config = getStatusConfig(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        filterStatus === status
                          ? `${config.color} border`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.icon}
                      {status === 'ALL' ? 'All Status' : config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <div className="flex gap-2">
                {['ALL', 'CORE', 'NON_CORE'].map(type => {
                  const config = getTypeConfig(type);
                  return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        filterType === type
                          ? `${config.color} border`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.icon}
                      {type === 'ALL' ? 'All Types' : config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Filter"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vaccinations List */}
      <div className="space-y-4">
        {filteredVaccinations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Syringe size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {selectedPet ? `No Vaccinations for ${selectedPet.name}` : 'No Pet Selected'}
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedPet 
                ? 'Vaccinations will appear here after they are added during veterinary appointments'
                : 'Please select a pet to view vaccinations'}
            </p>
            <div className="text-sm text-gray-500">
              <p>Vaccinations can only be added by veterinarians during appointments.</p>
              <p className="mt-1">Please contact your vet for vaccination records.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredVaccinations.map(vaccination => {
              const statusConfig = getStatusConfig(vaccination.status);
              const typeConfig = getTypeConfig(vaccination.type);
              const daysUntilDue = getDaysUntilDue(vaccination.nextDueDate);
              
              return (
                <div
                  key={vaccination.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg mb-2">
                        {vaccination.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Given: {formatDate(vaccination.date)}</span>
                        </div>
                        {vaccination.nextDueDate && (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            <span>Next Due: {formatDate(vaccination.nextDueDate)}</span>
                            {daysUntilDue !== null && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                daysUntilDue <= 0 
                                  ? 'bg-red-100 text-red-800'
                                  : daysUntilDue <= 30
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {daysUntilDue <= 0 
                                  ? `Overdue by ${Math.abs(daysUntilDue)} days`
                                  : `${daysUntilDue} days left`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(vaccination)}
                        className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Veterinarian</p>
                        <p className="font-medium text-gray-800">
                          Dr. {vaccination.vet?.name || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pet</p>
                        <p className="font-medium text-gray-800">
                          {selectedPet?.name || vaccination.pet?.name || 'Unknown Pet'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className={`font-medium ${statusConfig.color.replace('bg-', 'text-')}`}>
                          {vaccination.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vaccination Details Modal */}
      {showDetailsModal && selectedVaccination && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Vaccination Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedVaccination(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-medium text-gray-700 mb-4">Vaccine Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vaccine Name</p>
                    <p className="font-medium text-gray-800">{selectedVaccination.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTypeConfig(selectedVaccination.type).color}`}>
                      {getTypeConfig(selectedVaccination.type).icon}
                      {getTypeConfig(selectedVaccination.type).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-medium text-gray-700 mb-4">Date Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date Administered</p>
                    <p className="font-medium text-gray-800">{formatDate(selectedVaccination.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Next Due Date</p>
                    <p className="font-medium text-gray-800">
                      {selectedVaccination.nextDueDate ? formatDate(selectedVaccination.nextDueDate) : 'Not specified'}
                    </p>
                  </div>
                </div>
                {selectedVaccination.nextDueDate && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Days Until Due</p>
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-gray-400" />
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        getDaysUntilDue(selectedVaccination.nextDueDate) <= 0
                          ? 'bg-red-100 text-red-800'
                          : getDaysUntilDue(selectedVaccination.nextDueDate) <= 30
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {getDaysUntilDue(selectedVaccination.nextDueDate) <= 0
                          ? `Overdue by ${Math.abs(getDaysUntilDue(selectedVaccination.nextDueDate))} days`
                          : `${getDaysUntilDue(selectedVaccination.nextDueDate)} days left`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Parties */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-medium text-gray-700 mb-4">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedVaccination.status).color}`}>
                      {getStatusConfig(selectedVaccination.status).icon}
                      {getStatusConfig(selectedVaccination.status).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Veterinarian</p>
                    <p className="font-medium text-gray-800">
                      Dr. {selectedVaccination.vet?.name || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Pet</p>
                    <p className="font-medium text-gray-800">
                      {selectedPet?.name || selectedVaccination.pet?.name || 'Unknown Pet'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Info (if available) */}
              {selectedVaccination.appointment && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="text-blue-600 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Appointment Information</p>
                      <p className="text-sm text-blue-700">
                        This vaccination was administered during appointment #{selectedVaccination.appointment.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedVaccination(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vaccinations;