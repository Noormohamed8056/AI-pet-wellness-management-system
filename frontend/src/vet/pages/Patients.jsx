// Patients.jsx
import React, { useEffect, useState } from 'react';
import { 
  Users,
  Dog,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Pill,
  Syringe,
  Activity,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  User,
  Heart,
  Thermometer,
  Weight,
  Stethoscope,
  Award,
  Clock as ClockIcon,
  CalendarDays,
  Eye,
  ExternalLink,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  Shield,
  Home,
  Cake,
  VenusAndMars,
  Tag
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from "../../api/api";
import { 
  getPatientsByVet,
  getPatientVisits,
  getPatientSummary,
  getPetDetails
} from '../../api/api';

const Patients = () => {
  const vetId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [patientSummary, setPatientSummary] = useState(null);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'recent', 'frequent'

  // Load patients on component mount
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        const response = await getPatientsByVet(vetId);
        const patientsData = response.data || [];
        setPatients(patientsData);
        setFilteredPatients(patientsData);
      } catch (error) {
        toast.error('Failed to load patients');
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, [vetId]);

  // Filter patients based on search
  useEffect(() => {
    let filtered = patients;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply active filter
    if (activeFilter === 'recent') {
      // Sort by most recent appointment (you'll need to adjust based on your data structure)
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.lastVisit ? new Date(a.lastVisit) : new Date(0);
        const dateB = b.lastVisit ? new Date(b.lastVisit) : new Date(0);
        return dateB - dateA;
      });
    } else if (activeFilter === 'frequent') {
      // Sort by number of visits (you'll need to adjust based on your data structure)
      filtered = [...filtered].sort((a, b) => {
        const visitsA = a.visitCount || 0;
        const visitsB = b.visitCount || 0;
        return visitsB - visitsA;
      });
    }
    
    setFilteredPatients(filtered);
  }, [searchTerm, activeFilter, patients]);

  // Handle patient selection
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingVisits(true);
    
    try {
      // Load patient visits
      const visitsResponse = await getPatientVisits(vetId, patient.id);
      setPatientVisits(visitsResponse.data || []);
      
      // Load patient summary
      const summaryResponse = await getPatientSummary(vetId, patient.id);
      setPatientSummary(summaryResponse.data);
      
      // Load additional pet details if needed
      const petDetailsResponse = await getPetDetails(patient.id);
      // You can merge this data if needed
      
    } catch (error) {
      toast.error('Failed to load patient details');
      console.error('Error loading patient details:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : 'N/A';
  };

  // Toggle visit expansion
  const toggleVisitExpansion = (visitId) => {
    setExpandedVisit(expandedVisit === visitId ? null : visitId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patients...</p>
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
            <Users className="text-purple-600" />
            My Patients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view all your veterinary patients
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients by name, species, breed, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Patients
            </button>
            <button
              onClick={() => setActiveFilter('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'recent'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setActiveFilter('frequent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'frequent'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Most Frequent
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Patients List */}
        <div className={`lg:w-1/3 ${selectedPatient ? 'lg:block' : ''}`}>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-800">
                Patients ({filteredPatients.length})
              </h3>
            </div>
            
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No patients found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm ? 'Try a different search term' : 'You have no patients yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedPatient?.id === patient.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {patient.imageUrl ? (
                            <img
                              src={patient.imageUrl}
                              alt={patient.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center border-2 border-gray-200">
                              <Dog className="w-6 h-6 text-purple-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800 truncate">
                              {patient.name}
                            </h4>
                            {selectedPatient?.id === patient.id && (
                              <ChevronRight className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              <Dog className="w-3 h-3" />
                              {patient.species}
                            </span>
                            {patient.breed && (
                              <span className="text-xs text-gray-500">
                                {patient.breed}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Owner: {patient.owner?.name || 'Unknown'}
                            </p>
                            {patient.age && (
                              <p className="text-xs text-gray-600 mt-1">
                                Age: {patient.age} years • {patient.gender || 'Unknown gender'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Patient Details */}
        <div className="flex-1">
          {!selectedPatient ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-4">
                <Dog size={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a Patient
              </h3>
              <p className="text-gray-500 max-w-md">
                Click on a patient from the list to view their medical history, appointments, and health summary.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Patient Overview Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div>
                      {selectedPatient.imageUrl ? (
                        <img
                          src={selectedPatient.imageUrl}
                          alt={selectedPatient.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center border-4 border-white shadow-md">
                          <Dog className="w-10 h-10 text-purple-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h2 className="text-2xl font-bold text-gray-800">
                          {selectedPatient.name}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            <Dog className="w-3 h-3" />
                            {selectedPatient.species}
                          </span>
                          {selectedPatient.breed && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                              <Tag className="w-3 h-3" />
                              {selectedPatient.breed}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Age & Gender</p>
                          <div className="flex items-center gap-2">
                            {selectedPatient.age && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                                <Cake className="w-3 h-3" />
                                {selectedPatient.age} years
                              </span>
                            )}
                            {selectedPatient.gender && (
                              <span className="flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                                <VenusAndMars className="w-3 h-3" />
                                {selectedPatient.gender}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Owner</p>
                          <p className="font-medium text-gray-800">
                            {selectedPatient.owner?.name || 'Unknown'}
                          </p>
                          {selectedPatient.owner?.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {selectedPatient.owner.phone}
                            </p>
                          )}
                          {selectedPatient.owner?.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {selectedPatient.owner.email}
                            </p>
                          )}
                        </div>
                        
                        {patientSummary && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Last Visit</p>
                            <p className="font-medium text-gray-800 flex items-center gap-1">
                              <CalendarDays className="w-4 h-4" />
                              {patientSummary.lastVisit ? formatDate(patientSummary.lastVisit) : 'No visits yet'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Summary */}
              {patientSummary && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Health Summary</h3>
                      <p className="text-sm text-gray-500">Overview of patient's medical history</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Visits</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {patientSummary.totalVisits || 0}
                          </p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Completed appointments</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Vaccinations</p>
                          <p className="text-2xl font-bold text-green-600">
                            {patientSummary.totalVaccinations || 0}
                          </p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Syringe className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Administered vaccines</p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Last Diagnosis</p>
                          <p className="text-lg font-semibold text-gray-800 truncate">
                            {patientSummary.lastDiagnosis || 'No diagnosis yet'}
                          </p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Stethoscope className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Most recent condition</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Visit Timeline */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Visit Timeline</h3>
                      <p className="text-sm text-gray-500">History of veterinary consultations</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {patientVisits.length} appointment(s)
                  </span>
                </div>
                
                {loadingVisits ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading visits...</p>
                  </div>
                ) : patientVisits.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No completed visits yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This patient has not had any completed consultations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientVisits.map((visit, index) => (
                      <div key={visit.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleVisitExpansion(visit.id)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <span className="font-semibold text-blue-600">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {formatDate(visit.slot?.slotDate || visit.createdAt)}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {visit.slot && `${formatTime(visit.slot.startTime)} - ${formatTime(visit.slot.endTime)}`}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  {visit.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {visit.medicalRecord?.diagnosis && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Diagnosis
                              </span>
                            )}
                            {visit.medicalRecord?.prescriptions?.length > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {visit.medicalRecord.prescriptions.length} prescription(s)
                              </span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedVisit === visit.id ? 'transform rotate-180' : ''
                            }`} />
                          </div>
                        </button>
                        
                        {/* Expanded View */}
                        {expandedVisit === visit.id && visit.medicalRecord && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            {/* Diagnosis */}
                            {visit.medicalRecord.diagnosis && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Stethoscope className="w-4 h-4" />
                                  Diagnosis
                                </p>
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <p className="text-gray-700 whitespace-pre-line">
                                    {visit.medicalRecord.diagnosis}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Prescriptions */}
                            {visit.medicalRecord.prescriptions && visit.medicalRecord.prescriptions.length > 0 && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Pill className="w-4 h-4" />
                                    Prescriptions
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {visit.medicalRecord.prescriptions.length} medication(s)
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {visit.medicalRecord.prescriptions.map((prescription, idx) => (
                                    <div key={prescription.id || idx} className="bg-white border border-gray-200 rounded-lg p-3">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-medium text-gray-800">{prescription.medicineName}</p>
                                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                                            <span>Dosage: {prescription.dosage}</span>
                                            <span>Duration: {prescription.duration}</span>
                                            {prescription.instructions && (
                                              <span>Instructions: {prescription.instructions}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Vaccinations */}
                            {visit.vaccinations && visit.vaccinations.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Syringe className="w-4 h-4" />
                                    Vaccinations Administered
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {visit.vaccinations.length} vaccine(s)
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {visit.vaccinations.map((vaccination, idx) => (
                                    <div key={vaccination.id || idx} className="bg-white border border-gray-200 rounded-lg p-3">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-medium text-gray-800">{vaccination.name}</p>
                                          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                                            <span>Type: {vaccination.type === 'CORE' ? 'Core Vaccine' : 'Non-Core Vaccine'}</span>
                                            <span>Date: {formatDate(vaccination.date)}</span>
                                            {vaccination.nextDueDate && (
                                              <span>Next Due: {formatDate(vaccination.nextDueDate)}</span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                              vaccination.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                              vaccination.status === 'DUE' ? 'bg-amber-100 text-amber-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {vaccination.status}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Notes */}
                            {visit.medicalRecord.notes && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Clinical Notes
                                </p>
                                <div className="bg-white border border-gray-200 rounded-lg p-3">
                                  <p className="text-gray-700 whitespace-pre-line">
                                    {visit.medicalRecord.notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;