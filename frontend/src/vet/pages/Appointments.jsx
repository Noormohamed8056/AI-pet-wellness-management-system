// VetAppointments.jsx
import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Dog, 
  X, 
  CheckCircle, 
  AlertCircle,
  CalendarDays,
  Search,
  Filter,
  Loader2,
  TrendingUp,
  Pill,
  Syringe,
  FileText,
  Stethoscope,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Plus,
  ChevronRight,
  ClipboardCheck,
  Shield,
  Activity,
  AlertTriangle,
  ClipboardList,
  Pill as MedicineIcon,
  Star,
  MessageSquare,
  Building,
  Users,
  DollarSign,
  Send,
  Clock as ClockIcon,
  Award
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from "../../api/api";
import { 
  getVetUpcomingAppointments,
  getVetCompletedAppointments,
  approveAppointment,
  rejectAppointment,
  completeAppointment,
  createMedicalRecord,
  getMedicalRecordByAppointment,
  addPrescription,
  getPrescriptionsByMedicalRecord,
  addVaccination,
  getVaccinationsByAppointment
} from '../../api/api';

const Appointments = () => {
  const vetId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Appointments data
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  
  // Consultation Modal
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Medical Record States
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loadingMedicalRecord, setLoadingMedicalRecord] = useState(false);
  
  // Consultation Form States
  const [consultationStep, setConsultationStep] = useState(1); // 1: Overview, 2: Diagnosis, 3: Prescriptions, 4: Vaccinations, 5: Review
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: '',
    notes: ''
  });
  const [prescriptionForms, setPrescriptionForms] = useState([
    { medicineName: '', dosage: '', duration: '', instructions: '' }
  ]);
  const [vaccinationForms, setVaccinationForms] = useState([
    { name: '', date: new Date().toISOString().split('T')[0], nextDueDate: '', type: 'CORE' }
  ]);
  
  // Loading states
  const [processingAction, setProcessingAction] = useState(false);
  const [creatingMedicalRecord, setCreatingMedicalRecord] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState(false);

  // Load appointments
  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      try {
        const [upcomingRes, completedRes] = await Promise.all([
          getVetUpcomingAppointments(vetId),
          getVetCompletedAppointments(vetId)
        ]);
        
        setUpcomingAppointments(upcomingRes.data || []);
        setCompletedAppointments(completedRes.data || []);
        
      } catch (error) {
        toast.error('Failed to load appointments');
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAppointments();
  }, [vetId]);

  // Format date and time
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

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : 'N/A';
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusConfig = {
      BOOKED: { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-3 h-3" /> },
      PAID: { color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="w-3 h-3" /> },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: <ThumbsUp className="w-3 h-3" /> },
      COMPLETED: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: <X className="w-3 h-3" /> },
      REJECTED: { color: 'bg-gray-100 text-gray-800', icon: <ThumbsDown className="w-3 h-3" /> }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3" /> };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  // Handle approve appointment
  const handleApproveAppointment = async (appointment) => {
    setProcessingAction(true);
    try {
      await approveAppointment(appointment.id, vetId);
      toast.success('Appointment approved');
      // Refresh appointments
      const res = await getVetUpcomingAppointments(vetId);
      setUpcomingAppointments(res.data || []);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to approve appointment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle reject appointment
  const handleRejectAppointment = async (appointment) => {
    if (!window.confirm('Are you sure you want to reject this appointment?')) return;
    
    setProcessingAction(true);
    try {
      await rejectAppointment(appointment.id, vetId);
      toast.success('Appointment rejected');
      // Refresh appointments
      const res = await getVetUpcomingAppointments(vetId);
      setUpcomingAppointments(res.data || []);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to reject appointment');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle start consultation
   // Handle start consultation
  const handleStartConsultation = async (appointment) => {
    setSelectedAppointment(appointment);
    setConsultationStep(1);
    setMedicalRecordForm({ diagnosis: '', notes: '' });
    setPrescriptionForms([{ medicineName: '', dosage: '', duration: '', instructions: '' }]);
    setVaccinationForms([{ name: '', date: new Date().toISOString().split('T')[0], nextDueDate: '', type: 'CORE' }]);
    setMedicalRecord(null);
    setPrescriptions([]);
    setVaccinations([]);
    
    // Check if medical record already exists
    setLoadingMedicalRecord(true);
    try {
      // First, refresh the appointment to get latest status
      const appointmentsRes = await getVetUpcomingAppointments(vetId);
      const refreshedAppointment = (appointmentsRes.data || []).find(a => a.id === appointment.id);
      if (refreshedAppointment) {
        setSelectedAppointment(refreshedAppointment);
      }
      
      const medicalRecordRes = await getMedicalRecordByAppointment(appointment.id);
      if (medicalRecordRes.data) {
        const record = medicalRecordRes.data;
        setMedicalRecord(record);
        setMedicalRecordForm({
          diagnosis: record.diagnosis || '',
          notes: record.notes || ''
        });
        
        // Load prescriptions
        const prescriptionsRes = await getPrescriptionsByMedicalRecord(record.id);
        if (prescriptionsRes.data && prescriptionsRes.data.length > 0) {
          setPrescriptionForms(prescriptionsRes.data.map(p => ({
            medicineName: p.medicineName,
            dosage: p.dosage,
            duration: p.duration,
            instructions: p.instructions
          })));
          setPrescriptions(prescriptionsRes.data);
        }
        
        // Load vaccinations
        const vaccinationsRes = await getVaccinationsByAppointment(appointment.id);
        if (vaccinationsRes.data && vaccinationsRes.data.length > 0) {
          setVaccinationForms(vaccinationsRes.data.map(v => ({
            name: v.name,
            date: v.date ? v.date.split('T')[0] : new Date().toISOString().split('T')[0],
            nextDueDate: v.nextDueDate ? v.nextDueDate.split('T')[0] : '',
            type: v.type
          })));
          setVaccinations(vaccinationsRes.data);
        }
        
        // If medical record exists and appointment is APPROVED, go to review step
        if (refreshedAppointment?.status === 'APPROVED') {
          setConsultationStep(5);
        }
      }
    } catch (error) {
      console.error('Error loading medical record:', error);
    } finally {
      setLoadingMedicalRecord(false);
    }
    
    setShowConsultationModal(true);
  };

  // Handle next consultation step
  const handleNextStep = () => {
    if (consultationStep === 2 && !medicalRecordForm.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }
    
    if (consultationStep < 5) {
      setConsultationStep(consultationStep + 1);
    }
  };

  // Handle previous consultation step
  const handlePreviousStep = () => {
    if (consultationStep > 1) {
      setConsultationStep(consultationStep - 1);
    }
  };

  // Add prescription form
  const handleAddPrescription = () => {
    setPrescriptionForms([
      ...prescriptionForms,
      { medicineName: '', dosage: '', duration: '', instructions: '' }
    ]);
  };

  // Remove prescription form
  const handleRemovePrescription = (index) => {
    if (prescriptionForms.length > 1) {
      const newForms = [...prescriptionForms];
      newForms.splice(index, 1);
      setPrescriptionForms(newForms);
    }
  };

  // Add vaccination form
  const handleAddVaccination = () => {
    setVaccinationForms([
      ...vaccinationForms,
      { name: '', date: new Date().toISOString().split('T')[0], nextDueDate: '', type: 'CORE' }
    ]);
  };

  // Remove vaccination form
  const handleRemoveVaccination = (index) => {
    if (vaccinationForms.length > 1) {
      const newForms = [...vaccinationForms];
      newForms.splice(index, 1);
      setVaccinationForms(newForms);
    }
  };

  // Handle create medical record
   // Handle create medical record
  const handleCreateMedicalRecord = async () => {
    if (!medicalRecordForm.diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return;
    }

    setCreatingMedicalRecord(true);
    try {
      // Create medical record
      const medicalRecordRes = await createMedicalRecord(selectedAppointment.id, medicalRecordForm);
      const createdRecord = medicalRecordRes.data;
      setMedicalRecord(createdRecord);

      // Create prescriptions
      const prescriptionPromises = prescriptionForms
        .filter(p => p.medicineName.trim())
        .map(prescription => addPrescription(createdRecord.id, prescription));
      
      if (prescriptionPromises.length > 0) {
        await Promise.all(prescriptionPromises);
      }

      // Create vaccinations
      const vaccinationPromises = vaccinationForms
        .filter(v => v.name.trim())
        .map(vaccination => addVaccination(selectedAppointment.id, vetId, {
          ...vaccination,
          status: 'DONE',
          petId: selectedAppointment.pet.id,
          vetId: vetId
        }));
      
      if (vaccinationPromises.length > 0) {
        await Promise.all(vaccinationPromises);
      }

      toast.success('Medical record created successfully');
      setConsultationStep(5); // Move to review step
      
      // 🔥 CRITICAL: Refresh appointments after creating medical record
      const upcomingRes = await getVetUpcomingAppointments(vetId);
      setUpcomingAppointments(upcomingRes.data || []);
      
      // Also update the selected appointment in state
      const updatedAppointments = upcomingRes.data || [];
      const updatedAppointment = updatedAppointments.find(a => a.id === selectedAppointment.id);
      if (updatedAppointment) {
        setSelectedAppointment(updatedAppointment);
      }
      
    } catch (error) {
      toast.error(error.response?.data || 'Failed to create medical record');
      console.error('Error creating medical record:', error);
    } finally {
      setCreatingMedicalRecord(false);
    }
  };

  // Handle complete appointment
  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    setCompletingAppointment(true);
    try {
      await completeAppointment(selectedAppointment.id, vetId);
      toast.success('Appointment completed successfully');
      
      // Refresh appointments
      const [upcomingRes, completedRes] = await Promise.all([
        getVetUpcomingAppointments(vetId),
        getVetCompletedAppointments(vetId)
      ]);
      
      setUpcomingAppointments(upcomingRes.data || []);
      setCompletedAppointments(completedRes.data || []);
      
      // Close modal
      setShowConsultationModal(false);
      setSelectedAppointment(null);
      
    } catch (error) {
      toast.error(error.response?.data || 'Failed to complete appointment');
    } finally {
      setCompletingAppointment(false);
    }
  };

  // Handle view completed appointment details
// Handle view completed appointment details
const handleViewAppointmentDetails = async (appointment) => {
  setSelectedAppointment(appointment);
  setShowConsultationModal(true);
  setConsultationStep(1);
  
  // Load medical record data
  setLoadingMedicalRecord(true);
  try {
    const medicalRecordRes = await getMedicalRecordByAppointment(appointment.id);
    if (medicalRecordRes.data) {
      const record = medicalRecordRes.data;
      setMedicalRecord(record);
      setMedicalRecordForm({
        diagnosis: record.diagnosis || '',
        notes: record.notes || ''
      });
      
      // Load prescriptions
      const prescriptionsRes = await getPrescriptionsByMedicalRecord(record.id);
      if (prescriptionsRes.data) {
        setPrescriptionForms(prescriptionsRes.data.map(p => ({
          medicineName: p.medicineName,
          dosage: p.dosage,
          duration: p.duration,
          instructions: p.instructions
        })));
        setPrescriptions(prescriptionsRes.data);
      }
      
      // Load vaccinations
      const vaccinationsRes = await getVaccinationsByAppointment(appointment.id);
      if (vaccinationsRes.data) {
        setVaccinationForms(vaccinationsRes.data.map(v => ({
          name: v.name,
          date: v.date ? v.date.split('T')[0] : '',
          nextDueDate: v.nextDueDate ? v.nextDueDate.split('T')[0] : '',
          type: v.type
        })));
        setVaccinations(vaccinationsRes.data);
      }
    }
    
    // 🔥 NEW: Load feedback for this appointment
    try {
      const feedbackRes = await api.get(`/feedbacks/appointment/${appointment.id}`);
      if (feedbackRes.data) {
        // Store feedback in selectedAppointment or separate state
        setSelectedAppointment(prev => ({
          ...prev,
          feedback: feedbackRes.data
        }));
      }
    } catch (feedbackError) {
      // No feedback exists, that's okay
      console.log('No feedback for this appointment');
    }
    
  } catch (error) {
    console.error('Error loading appointment details:', error);
  } finally {
    setLoadingMedicalRecord(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
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
            <CalendarDays className="text-purple-600" />
            Veterinary Appointments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your veterinary consultations and appointments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-1 flex">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Upcoming ({upcomingAppointments.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed ({completedAppointments.length})
          </div>
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-6">
        {activeTab === 'upcoming' ? (
          upcomingAppointments.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar size={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Upcoming Appointments
              </h3>
              <p className="text-gray-500">
                You have no upcoming appointments scheduled
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(appointment.status)}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {appointment.pet?.name} Consultation
                      </h3>
                    </div>
                    {appointment.slot && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600">
                          {formatDate(appointment.slot.slotDate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(appointment.slot.startTime)} - {formatTime(appointment.slot.endTime)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pet Owner</p>
                        <p className="font-medium text-gray-800">
                          {appointment.user?.name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Dog className="text-amber-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pet</p>
                        <p className="font-medium text-gray-800">
                          {appointment.pet?.name} ({appointment.pet?.species})
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.pet?.breed}
                        </p>
                      </div>
                    </div>
                  </div>

                                    <div className="flex gap-3">
                    {appointment.status === 'PAID' ? (
                      <>
                        <button
                          onClick={() => handleApproveAppointment(appointment)}
                          disabled={processingAction}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ThumbsUp size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectAppointment(appointment)}
                          disabled={processingAction}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <ThumbsDown size={16} />
                          Reject
                        </button>
                      </>
                    ) : appointment.status === 'APPROVED' ? (
                      <>
                        {appointment.medicalRecord ? (
                          <button
                            onClick={() => handleStartConsultation(appointment)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Complete Appointment
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartConsultation(appointment)}
                            className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Stethoscope size={16} />
                            Start Consultation
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Completed Appointments
          completedAppointments.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <CheckCircle size={64} className="mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Completed Consultations
              </h3>
              <p className="text-gray-500">
                Your completed consultations will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(appointment.status)}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {appointment.pet?.name} Consultation
                      </h3>
                    </div>
                    {appointment.slot && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">
                          {formatDate(appointment.slot.slotDate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(appointment.slot.startTime)} - {formatTime(appointment.slot.endTime)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pet Owner</p>
                        <p className="font-medium text-gray-800">
                          {appointment.user?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Dog className="text-amber-600" size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pet</p>
                        <p className="font-medium text-gray-800">
                          {appointment.pet?.name} ({appointment.pet?.species})
                        </p>
                      </div>
                    </div>

                    {appointment.medicalRecord && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="text-green-600" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Medical Record</p>
                          <p className="font-medium text-gray-800">
                            {appointment.medicalRecord.diagnosis ? 'Record Available' : 'No diagnosis'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewAppointmentDetails(appointment)}
                      className="flex-1 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Consultation Modal */}
      {showConsultationModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    {medicalRecord ? 'Medical Record' : 'New Consultation'}
                    {medicalRecord && (
                      <span className="text-sm font-normal text-gray-500">
                        • Appointment #{selectedAppointment.id}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAppointment.pet?.name} with {selectedAppointment.user?.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowConsultationModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Progress Steps */}
              {!medicalRecord && (
                <div className="flex items-center justify-between mt-6">
                  {[1, 2, 3, 4, 5].map(step => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        consultationStep >= step
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      {step < 5 && (
                        <div className={`w-12 h-1 mx-2 ${
                          consultationStep > step ? 'bg-purple-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6">
              {loadingMedicalRecord ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Step 1: Appointment Overview */}
                  {(consultationStep === 1 || medicalRecord) && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Appointment Date</p>
                          <p className="font-medium text-gray-800 text-lg">
                            {selectedAppointment.slot && formatDate(selectedAppointment.slot.slotDate)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedAppointment.slot && 
                              `${formatTime(selectedAppointment.slot.startTime)} - ${formatTime(selectedAppointment.slot.endTime)}`
                            }
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1 pl-10">Pet</p>
                          <div className="flex items-start gap-3">
                            <Dog className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-800 text-lg">
                                {selectedAppointment.pet?.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {selectedAppointment.pet?.breed && `${selectedAppointment.pet.breed} • `}
                                {selectedAppointment.pet?.species}
                              </p>
                              {selectedAppointment.pet?.age && (
                                <p className="text-sm text-gray-500">
                                  Age: {selectedAppointment.pet.age} years
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-1 pl-7">Owner</p>
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-blue-600 mt-0.5 pr-5" />
                            <div>
                              <p className="font-medium text-gray-800 text-lg">
                                {selectedAppointment.user?.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {selectedAppointment.user?.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Diagnosis & Notes */}
                  {(consultationStep === 2 || (medicalRecord && consultationStep === 1)) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Stethoscope className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Diagnosis & Clinical Notes</h3>
                          <p className="text-sm text-gray-500">Enter your diagnosis and clinical observations</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Diagnosis *
                          </label>
                          {medicalRecord ? (
                            <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[90px]">
                              <p className="text-gray-800 whitespace-pre-line">{medicalRecordForm.diagnosis || 'No diagnosis recorded'}</p>
                            </div>
                          ) : (
                            <textarea
                              value={medicalRecordForm.diagnosis}
                              onChange={(e) => setMedicalRecordForm({...medicalRecordForm, diagnosis: e.target.value})}
                              placeholder="Enter primary diagnosis..."
                              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[100px]"
                              rows={3}
                            />
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clinical Notes
                          </label>
                          {medicalRecord ? (
                              <div className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[120px]">
                                <p className="text-gray-800 whitespace-pre-line">
                                  {medicalRecordForm.notes || 'No clinical notes provided'}
                                </p>
                              </div>
                            ) : (
                              <textarea
                                value={medicalRecordForm.notes}
                                onChange={(e) => setMedicalRecordForm({...medicalRecordForm, notes: e.target.value})}
                                placeholder="Enter additional clinical notes, observations, treatment recommendations..."
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none min-h-[120px]"
                                rows={4}
                              />
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Prescriptions */}
                  {(consultationStep === 3 || (medicalRecord && prescriptions.length > 0)) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Pill className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Prescriptions</h3>
                            <p className="text-sm text-gray-500">Prescribe medications for the pet</p>
                          </div>
                        </div>
                        {!medicalRecord && (
                          <button
                            onClick={handleAddPrescription}
                            className="px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add Medication
                          </button>
                        )}
                      </div>
                      
                      {prescriptionForms.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <Pill className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No prescriptions added</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {prescriptionForms.map((prescription, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-50 rounded-lg">
                                    <MedicineIcon className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-500">
                                    Medication #{index + 1}
                                  </span>
                                </div>
                                {!medicalRecord && prescriptionForms.length > 1 && (
                                  <button
                                    onClick={() => handleRemovePrescription(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Medicine Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={prescription.medicineName}
                                    onChange={(e) => {
                                      const newForms = [...prescriptionForms];
                                      newForms[index].medicineName = e.target.value;
                                      setPrescriptionForms(newForms);
                                    }}
                                    placeholder="e.g., Amoxicillin"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dosage *
                                  </label>
                                  <input
                                    type="text"
                                    value={prescription.dosage}
                                    onChange={(e) => {
                                      const newForms = [...prescriptionForms];
                                      newForms[index].dosage = e.target.value;
                                      setPrescriptionForms(newForms);
                                    }}
                                    placeholder="e.g., 250mg twice daily"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration *
                                  </label>
                                  <input
                                    type="text"
                                    value={prescription.duration}
                                    onChange={(e) => {
                                      const newForms = [...prescriptionForms];
                                      newForms[index].duration = e.target.value;
                                      setPrescriptionForms(newForms);
                                    }}
                                    placeholder="e.g., 7 days"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instructions
                                  </label>
                                  <input
                                    type="text"
                                    value={prescription.instructions}
                                    onChange={(e) => {
                                      const newForms = [...prescriptionForms];
                                      newForms[index].instructions = e.target.value;
                                      setPrescriptionForms(newForms);
                                    }}
                                    placeholder="e.g., Take with food"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Vaccinations */}
                  {(consultationStep === 4 || (medicalRecord && vaccinations.length > 0)) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Syringe className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Vaccinations Administered</h3>
                            <p className="text-sm text-gray-500">Record vaccinations given during this appointment</p>
                          </div>
                        </div>
                        {!medicalRecord && (
                          <button
                            onClick={handleAddVaccination}
                            className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add Vaccination
                          </button>
                        )}
                      </div>
                      
                      {vaccinationForms.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                          <Syringe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No vaccinations added</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {vaccinationForms.map((vaccination, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-50 rounded-lg">
                                    <Syringe className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-500">
                                    Vaccination #{index + 1}
                                  </span>
                                </div>
                                {!medicalRecord && vaccinationForms.length > 1 && (
                                  <button
                                    onClick={() => handleRemoveVaccination(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vaccine Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={vaccination.name}
                                    onChange={(e) => {
                                      const newForms = [...vaccinationForms];
                                      newForms[index].name = e.target.value;
                                      setVaccinationForms(newForms);
                                    }}
                                    placeholder="e.g., Rabies Vaccine"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                                  <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type
                                  </label>
                                  {medicalRecord ? (
                                    // View mode - show as text
                                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-10">
                                      <p className="text-gray-800">
                                        {vaccination.type === 'CORE' ? 'Core Vaccine' : 'Non-Core Vaccine'}
                                      </p>
                                    </div>
                                  ) : (
                                    // Edit mode - show select dropdown
                                    <select
                                      value={vaccination.type}
                                      onChange={(e) => {
                                        const newForms = [...vaccinationForms];
                                        newForms[index].type = e.target.value;
                                        setVaccinationForms(newForms);
                                      }}
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    >
                                      <option value="CORE">Core Vaccine</option>
                                      <option value="NON_CORE">Non-Core Vaccine</option>
                                    </select>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Administered *
                                  </label>
                                  <input
                                    type="date"
                                    value={vaccination.date}
                                    onChange={(e) => {
                                      const newForms = [...vaccinationForms];
                                      newForms[index].date = e.target.value;
                                      setVaccinationForms(newForms);
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Next Due Date
                                  </label>
                                  <input
                                    type="date"
                                    value={vaccination.nextDueDate}
                                    onChange={(e) => {
                                      const newForms = [...vaccinationForms];
                                      newForms[index].nextDueDate = e.target.value;
                                      setVaccinationForms(newForms);
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    disabled={medicalRecord}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Review & Complete */}
                  {consultationStep === 5 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Review & Complete Consultation</h3>
                          <p className="text-sm text-gray-500">Review all details before completing the appointment</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="text-emerald-600" size={20} />
                            <div>
                              <p className="font-medium text-emerald-800">Medical Record Created Successfully</p>
                              <p className="text-sm text-emerald-700 mt-1">
                                All information has been saved. You can now complete the appointment.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Diagnosis</p>
                            <p className="font-medium text-gray-800 truncate">{medicalRecordForm.diagnosis || 'N/A'}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Prescriptions</p>
                            <p className="font-medium text-gray-800">
                              {prescriptionForms.filter(p => p.medicineName.trim()).length} medication(s)
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Vaccinations</p>
                            <p className="font-medium text-gray-800">
                              {vaccinationForms.filter(v => v.name.trim()).length} vaccine(s)
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                            <div>
                              <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                              <p className="text-sm text-amber-700">
                                Once completed, this appointment cannot be edited. All records will be finalized and sent to the pet owner.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 🔥 NEW: Step 6 - Feedback from Owner (Only for COMPLETED appointments) */}
{selectedAppointment?.status === 'COMPLETED' && consultationStep === 1 && (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-amber-100 rounded-lg">
        <Star className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Owner Feedback</h3>
        <p className="text-sm text-gray-500">
          Feedback provided by {selectedAppointment.user?.name}
        </p>
      </div>
    </div>
    
    {selectedAppointment.feedback ? (
      <div className="space-y-6">
        {/* Overall Rating */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-800">Overall Rating</p>
              <p className="text-sm text-gray-500">Owner's overall experience</p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={`${
                    i < selectedAppointment.feedback.rating
                      ? 'text-amber-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-lg font-bold text-amber-600">
                {selectedAppointment.feedback.rating}/5
              </span>
            </div>
          </div>
          
          {/* Comment */}
          {selectedAppointment.feedback.comment && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-sm text-gray-600 mb-2">Owner's Comment</p>
              <div className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-gray-700 italic">
                  "{selectedAppointment.feedback.comment}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedAppointment.feedback.waitingTimeRating && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Waiting Time</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-blue-600">
                  {selectedAppointment.feedback.waitingTimeRating}/5
                </span>
              </div>
            </div>
          )}

          {selectedAppointment.feedback.facilitiesRating && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Facilities</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-green-600">
                  {selectedAppointment.feedback.facilitiesRating}/5
                </span>
              </div>
            </div>
          )}

          {selectedAppointment.feedback.staffFriendlinessRating && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">Staff Friendliness</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-purple-600">
                  {selectedAppointment.feedback.staffFriendlinessRating}/5
                </span>
              </div>
            </div>
          )}

          {selectedAppointment.feedback.valueForMoneyRating && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-600">Value for Money</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-emerald-600">
                  {selectedAppointment.feedback.valueForMoneyRating}/5
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="text-blue-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-blue-800 mb-1">Thank you for your service!</p>
              <p className="text-sm text-blue-700">
                This feedback helps you understand the owner's experience and improve your services.
              </p>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No feedback provided by owner yet</p>
        <p className="text-sm text-gray-400 mt-1">
          The owner hasn't submitted feedback for this appointment
        </p>
      </div>
    )}
  </div>
)}
                </div>
              )}
            </div>

                        <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                {medicalRecord && selectedAppointment?.status === 'COMPLETED' ? (
                  // COMPLETED appointment - just show Close button
                  <button
                    onClick={() => {
                      setShowConsultationModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Close
                  </button>
                ) : medicalRecord && selectedAppointment?.status === 'APPROVED' ? (
                  // APPROVED appointment with medical record - show Complete Consultation button
                  <button
                    onClick={handleCompleteAppointment}
                    disabled={completingAppointment}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {completingAppointment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Complete Consultation
                      </>
                    )}
                  </button>
                ) : !medicalRecord ? (
                  // No medical record yet - show consultation workflow
                  <>
                    {consultationStep > 1 && (
                      <button
                        onClick={handlePreviousStep}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    
                    {consultationStep < 5 ? (
                      <button
                        onClick={handleNextStep}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                      >
                        {consultationStep === 4 ? 'Review & Create Record' : 'Continue'}
                      </button>
                    ) : consultationStep === 5 && !medicalRecord ? (
                      <button
                        onClick={handleCreateMedicalRecord}
                        disabled={creatingMedicalRecord}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {creatingMedicalRecord ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating Record...
                          </>
                        ) : (
                          'Create Medical Record'
                        )}
                      </button>
                    ) : null}
                  </>
                ) : (
                  // Fallback - should not reach here
                  <button
                    onClick={() => {
                      setShowConsultationModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;