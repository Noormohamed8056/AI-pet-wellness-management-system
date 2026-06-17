import React, { useEffect, useState } from 'react';
import { 
  Pill, 
  Clock, 
  Calendar, 
  User, 
  Dog, 
  FileText, 
  Edit2, 
  Trash2, 
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Eye,
  FileSearch,
  Stethoscope,
  Printer,
  Download,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  getVetUpcomingAppointments,
  getVetCompletedAppointments,
  getMedicalRecordByAppointment,
  getPrescriptionsByMedicalRecord,
  addPrescription,
  updatePrescription,
  deletePrescription,
  getPetDetails
} from '../../api/api';

const Prescriptions = () => {
  const vetId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  
  // Data states
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  
  // Modal states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  
  // Form states
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicineName: '',
    dosage: '',
    duration: '',
    instructions: ''
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'with', 'without'

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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : 'N/A';
  };

  // Load prescriptions for appointment
  // Load prescriptions for appointment
const loadPrescriptionsForAppointment = async (appointment, pet) => {
  setSelectedAppointment(appointment);
  setSelectedPet(pet || appointment.pet);
  setLoadingPrescriptions(true);
  
  try {
    // Load medical record
    const medicalRecordRes = await getMedicalRecordByAppointment(appointment.id);
    if (medicalRecordRes.data) {
      const record = medicalRecordRes.data;
      setMedicalRecord(record);
      
      // Load prescriptions
      const prescriptionsRes = await getPrescriptionsByMedicalRecord(record.id);
      const prescriptionsData = prescriptionsRes.data || [];
      setPrescriptions(prescriptionsData);
      
      // Show toast if no medical record but prescriptions exist
      if (prescriptionsData.length >= 2 && (!record.diagnosis || record.diagnosis.trim() === '')) {
        toast.warning(
          <div>
            <p>This appointment has {prescriptionsData.length} prescriptions but no medical record!</p>
            <p>Please create a medical record with diagnosis in the consultation page.</p>
          </div>,
          { autoClose: 6000 }
        );
      }
    } else {
      setMedicalRecord(null);
      setPrescriptions([]);
      
      // Check if we should load prescriptions through other means
      // First, try to get any existing prescriptions through pet
      try {
        const petPrescriptions = await getPrescriptionsByMedicalRecord(null); // You might need a different endpoint
        if (petPrescriptions.data && petPrescriptions.data.length >= 2) {
          toast.warning(
            <div>
              <p>This appointment has {petPrescriptions.data.length} prescriptions but no medical record!</p>
              <p>Please go to the consultation page and create a medical record first.</p>
            </div>,
            { autoClose: 6000 }
          );
        }
      } catch (err) {
        // Ignore this error
      }
      
      toast.info('No medical record found for this appointment');
    }
  } catch (error) {
    console.error('Error loading prescriptions:', error);
    
    // Special check for appointments in APPROVED status
    if (appointment.status === 'APPROVED') {
      toast.warning(
        <div>
          <p>No medical record found for this approved appointment!</p>
          <p>Please create a medical record and atleast 1 prescription first in the appointments page.</p>
        </div>,
        { autoClose: 5000 }
      );
    } else {
      toast.error('Failed to load prescriptions');
    }
    
    setMedicalRecord(null);
    setPrescriptions([]);
  } finally {
    setLoadingPrescriptions(false);
    setShowPrescriptionModal(true);
  }
};

  // Handle add prescription
  const handleAddPrescription = async () => {
    if (!prescriptionForm.medicineName.trim() || !prescriptionForm.dosage.trim() || !prescriptionForm.duration.trim()) {
      toast.error('Please fill in all required fields (Medicine, Dosage, Duration)');
      return;
    }

    try {
      if (editingPrescription) {
        // Update existing prescription
        const res = await updatePrescription(editingPrescription.id, prescriptionForm);
        toast.success('Prescription updated successfully');
        
        // Update local state
        setPrescriptions(prescriptions.map(p => 
          p.id === editingPrescription.id ? res.data : p
        ));
      } else {
        // Add new prescription
        const res = await addPrescription(medicalRecord.id, prescriptionForm);
        toast.success('Prescription added successfully');
        
        // Update local state
        setPrescriptions([...prescriptions, res.data]);
      }
      
      // Reset form and close modal
      resetForm();
      setShowAddModal(false);
      
    } catch (error) {
      toast.error(error.response?.data || 'Failed to save prescription');
    }
  };

  // Handle delete prescription
  const handleDeletePrescription = async (prescription) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    
    try {
      await deletePrescription(prescription.id);
      toast.success('Prescription deleted successfully');
      
      // Update local state
      setPrescriptions(prescriptions.filter(p => p.id !== prescription.id));
      
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete prescription');
    }
  };

  // Handle edit prescription
  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setPrescriptionForm({
      medicineName: prescription.medicineName,
      dosage: prescription.dosage,
      duration: prescription.duration,
      instructions: prescription.instructions || ''
    });
    setShowAddModal(true);
  };

  // Reset form
  const resetForm = () => {
    setPrescriptionForm({
      medicineName: '',
      dosage: '',
      duration: '',
      instructions: ''
    });
    setEditingPrescription(null);
  };

  // Filter appointments based on search and filter
  const filterAppointments = (appointments) => {
    return appointments.filter(appointment => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        appointment.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'with') {
        matchesStatus = appointment.medicalRecord !== null;
      } else if (filterStatus === 'without') {
        matchesStatus = appointment.medicalRecord === null;
      }
      
      return matchesSearch && matchesStatus;
    });
  };

  // Get filtered appointments
  const getFilteredAppointments = () => {
    const appointments = activeTab === 'active' ? upcomingAppointments : completedAppointments;
    return filterAppointments(appointments);
  };

  // Check if appointment is editable
  const isAppointmentEditable = (appointment) => {
    return activeTab === 'active' && 
           appointment.status === 'APPROVED' && 
           medicalRecord?.id;
  };

  // Print/Download prescriptions
  const handlePrintPrescriptions = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Prescriptions - ${selectedPet?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .pet-info { margin-bottom: 20px; }
            .prescription { border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
            .medicine { font-weight: bold; font-size: 16px; }
            .details { margin-top: 10px; }
            .timestamp { text-align: right; font-size: 12px; color: #666; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Veterinary Prescriptions</h1>
            <h2>${selectedPet?.name}</h2>
          </div>
          <div class="pet-info">
            <p><strong>Owner:</strong> ${selectedAppointment?.user?.name}</p>
            <p><strong>Date:</strong> ${formatDate(selectedAppointment?.slot?.slotDate)}</p>
            ${medicalRecord?.diagnosis ? `<p><strong>Diagnosis:</strong> ${medicalRecord.diagnosis}</p>` : ''}
          </div>
          <h3>Prescriptions:</h3>
          ${prescriptions.map((p, index) => `
            <div class="prescription">
              <div class="medicine">${index + 1}. ${p.medicineName}</div>
              <div class="details">
                <p><strong>Dosage:</strong> ${p.dosage}</p>
                <p><strong>Duration:</strong> ${p.duration}</p>
                ${p.instructions ? `<p><strong>Instructions:</strong> ${p.instructions}</p>` : ''}
              </div>
            </div>
          `).join('')}
          <div class="timestamp">
            Printed on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescriptions...</p>
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
            <Pill className="text-purple-600" />
            Prescriptions Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view prescriptions for your patients
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-1 flex">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-purple-50 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Active Appointments ({upcomingAppointments.length})
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by pet or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="all">All Appointments</option>
              <option value="with">With Medical Record</option>
              <option value="without">Without Medical Record</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-6">
        {getFilteredAppointments().length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No {activeTab === 'active' ? 'Active' : 'Completed'} Appointments
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No appointments match your filters' 
                : `You have no ${activeTab === 'active' ? 'active' : 'completed'} appointments`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAppointments().map(appointment => (
              <div
                key={appointment.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {appointment.pet?.name} Consultation
                    </h3>
                  </div>
                  {appointment.slot && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
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
                        {appointment.pet?.breed} • Age: {appointment.pet?.age || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="text-green-600" size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Medical Record</p>
                      <p className={`font-medium ${
                        appointment.medicalRecord ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {appointment.medicalRecord ? 'Available' : 'Not Created'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => loadPrescriptionsForAppointment(appointment)}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Prescriptions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescriptions Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Pill className="text-purple-600" />
                    Prescriptions for {selectedPet?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Appointment with {selectedAppointment.user?.name} • {formatDate(selectedAppointment.slot?.slotDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isAppointmentEditable(selectedAppointment) && (
                    <button
                      onClick={handlePrintPrescriptions}
                      className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                    >
                      <Printer size={16} />
                      Print
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setSelectedAppointment(null);
                      setMedicalRecord(null);
                      setPrescriptions([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Diagnosis Info */}
              {medicalRecord?.diagnosis && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Stethoscope className="text-blue-600 mt-0.5" size={18} />
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Diagnosis</p>
                      <p className="text-gray-700">{medicalRecord.diagnosis}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              {loadingPrescriptions ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading prescriptions...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Prescriptions</h3>
                      <p className="text-sm text-gray-500">
                        {prescriptions.length} medication(s) prescribed
                      </p>
                    </div>
                    
                    {isAppointmentEditable(selectedAppointment) && (
                      <button
                        onClick={() => {
                          resetForm();
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Prescription
                      </button>
                    )}
                  </div>

                  {/* Prescriptions List */}
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">
                        No Prescriptions Found
                      </h4>
                      <p className="text-gray-500 mb-4">
                        No prescriptions have been added for this consultation
                      </p>
                      {isAppointmentEditable(selectedAppointment) && (
                        <button
                          onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 mx-auto"
                        >
                          <Plus size={16} />
                          Add First Prescription
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((prescription, index) => (
                        <div key={prescription.id} className="border border-gray-200 rounded-xl p-5 hover:border-purple-300 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Pill className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 text-lg">
                                  {index + 1}. {prescription.medicineName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Prescribed on {formatDate(prescription.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            {isAppointmentEditable(selectedAppointment) ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditPrescription(prescription)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit prescription"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeletePrescription(prescription)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete prescription"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                View Only
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Dosage</p>
                              <p className="font-medium text-gray-800">{prescription.dosage}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Duration</p>
                              <p className="font-medium text-gray-800">{prescription.duration}</p>
                            </div>
                            {prescription.instructions && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600 mb-1">Special Instructions</p>
                                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                                  {prescription.instructions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setSelectedAppointment(null);
                    setMedicalRecord(null);
                    setPrescriptions([]);
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {isAppointmentEditable(selectedAppointment) && prescriptions.length > 0 && (
                  <button
                    onClick={handlePrintPrescriptions}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    Print All Prescriptions
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Prescription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingPrescription ? 'Edit Prescription' : 'Add New Prescription'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPet?.name} • {formatDate(selectedAppointment?.slot?.slotDate)}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.medicineName}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, medicineName: e.target.value})}
                    placeholder="Enter medicine name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.dosage}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, dosage: e.target.value})}
                    placeholder="e.g., 250mg twice daily"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={prescriptionForm.duration}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, duration: e.target.value})}
                    placeholder="e.g., 7 days"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={prescriptionForm.instructions}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})}
                    placeholder="Enter any special instructions for the pet owner..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPrescription}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingPrescription ? 'Update' : 'Save'} Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;