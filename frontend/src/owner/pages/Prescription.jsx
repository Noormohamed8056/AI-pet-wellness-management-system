import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Calendar, 
  Search,
  Dog,
  Eye,
  Pill as Medicine,
  AlertCircle,
  User,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/api';

const Prescriptions = () => {
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
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

  // Load prescriptions when pet is selected
  useEffect(() => {
    if (selectedPet) {
      loadPrescriptions();
    }
  }, [selectedPet]);

  const loadPrescriptions = async () => {
    if (!selectedPet) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/prescriptions/pet/${selectedPet.id}`);
      setPrescriptions(response.data || []);
    } catch (error) {
      // Handle 400 error when no prescriptions found
      if (error.response?.status === 400) {
        setPrescriptions([]); // Set empty array instead of showing error
      } else {
        toast.error('Failed to load prescriptions');
        console.error('Error loading prescriptions:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter prescriptions based on search
  const filteredPrescriptions = prescriptions.filter(prescription => {
    return searchTerm === '' || 
      prescription.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.instructions && prescription.instructions.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Format date from medical record (if available)
  const formatRecordDate = (medicalRecord) => {
    if (!medicalRecord || !medicalRecord.createdAt) return 'Not specified';
    const date = new Date(medicalRecord.createdAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  // Group prescriptions by medical record
  const groupByMedicalRecord = () => {
    const groups = {};
    filteredPrescriptions.forEach(prescription => {
      const recordId = prescription.medicalRecord?.id || 'unknown';
      if (!groups[recordId]) {
        groups[recordId] = {
          record: prescription.medicalRecord,
          prescriptions: []
        };
      }
      groups[recordId].prescriptions.push(prescription);
    });
    return Object.values(groups);
  };

  if (loading && !selectedPet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  const groupedPrescriptions = groupByMedicalRecord();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Pill className="text-purple-600" />
            Prescriptions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View your pet's prescription history
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none w-full md:w-64"
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
  <span className="font-bold text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-lg shadow-md shadow-purple-200/50 border border-purple-200 animate-pulse">
    {selectedPet.name}
  </span>
  <span className="mx-3">•</span>
  <span className="text-gray-700">{selectedPet.breed}</span>
  <span className="mx-3">•</span>
  <span className="text-gray-700">{selectedPet.species}</span>
</div>

          )}
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-6">
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Pill size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {selectedPet ? `No Prescriptions for ${selectedPet.name}` : 'No Pet Selected'}
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedPet 
                ? 'Prescriptions will appear here after they are prescribed during veterinary appointments'
                : 'Please select a pet to view prescriptions'}
            </p>
            <div className="text-sm text-gray-500">
              <p>Prescriptions can only be added by veterinarians during appointments.</p>
              <p className="mt-1">Please contact your vet for prescription records.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedPrescriptions.map((group, index) => (
              <div key={group.record?.id || index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Medical Record Header */}
                {group.record && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          Medical Record #{group.record.id}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Date: {formatRecordDate(group.record)}</span>
                          </div>
                          {group.record.vet && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>Veterinarian: Dr. {group.record.vet.name || 'Not specified'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">{group.prescriptions.length} prescription(s)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prescriptions List */}
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {group.prescriptions.map(prescription => (
                      <div
                        key={prescription.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-3">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <Medicine className="w-3 h-3" />
                                Medication
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-800 text-lg">
                                {prescription.medicineName}
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500 mb-1">Dosage</p>
                                  <p className="font-medium text-gray-800">{prescription.dosage || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">Duration</p>
                                  <p className="font-medium text-gray-800">{prescription.duration || 'Not specified'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <button
                              onClick={() => handleViewDetails(prescription)}
                              className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Pill className="text-purple-600" />
                  Prescription Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Medication Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="font-medium text-purple-700 mb-4 flex items-center gap-2">
                  <Medicine className="w-5 h-5" />
                  Medication Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Medicine Name</p>
                    <p className="font-bold text-xl text-gray-800">{selectedPrescription.medicineName}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Dosage</p>
                      <p className="font-medium text-gray-800 text-lg">{selectedPrescription.dosage || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Duration</p>
                      <p className="font-medium text-gray-800 text-lg">{selectedPrescription.duration || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-medium text-blue-700 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Instructions
                </h3>
                <div className="bg-white border border-blue-100 rounded-lg p-4">
                  <p className="text-gray-700">
                    {selectedPrescription.instructions || 'No specific instructions provided.'}
                  </p>
                </div>
              </div>

              {/* Related Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-medium text-gray-700 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Prescribed For</p>
                    <p className="font-medium text-gray-800">{selectedPet?.name || 'Unknown Pet'}</p>
                  </div>
                </div>
                
                {/* Medical Record Info */}
                {selectedPrescription.medicalRecord && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">From Medical Record</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FileText className="w-4 h-4" />
                        <span>Record #{selectedPrescription.medicalRecord.id}</span>
                        <span className="mx-2">•</span>
                        <Calendar className="w-4 h-4" />
                        <span>{formatRecordDate(selectedPrescription.medicalRecord)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Close Details
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