import React, { useState, useEffect } from 'react';
import {
  getVetCompletedAppointments,
  getMedicalRecordByAppointment,
  getPetDetails,
  getPrescriptionsByMedicalRecord,
  getVaccinationsByAppointment
} from '../../api/api';
import {
  RefreshCw,
  FileText,
  Calendar,
  Clock,
  User,
  Mail,
  Dog,
  Cat,
  Pill,
  Syringe,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  FileHeart
} from 'lucide-react';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPet, setFilterPet] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [pets, setPets] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalPets: 0,
    totalPrescriptions: 0,
    totalVaccinations: 0
  });

  const vetId = localStorage.getItem('userId');
  const vetName = records[0]?.vet?.name || "Veterinarian";


  // Fetch all completed appointments and their medical records
  const fetchMedicalRecords = async () => {
    if (!vetId) {
      toast.error('Vet ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get all completed appointments for this vet
      const appointmentsResponse = await getVetCompletedAppointments(vetId);
      const completedAppointments = appointmentsResponse.data || [];
      
      if (completedAppointments.length === 0) {
        setRecords([]);
        setStats({
          totalRecords: 0,
          totalPets: 0,
          totalPrescriptions: 0,
          totalVaccinations: 0
        });
        setLoading(false);
        return;
      }
      
      // Get medical records for each appointment
      const recordsPromises = completedAppointments.map(async (appointment) => {
        console.log("Appointment from API:", appointment);

        try {
          // Get medical record
          let medicalRecord = null;
          try {
            const recordResponse = await getMedicalRecordByAppointment(appointment.id);
            medicalRecord = recordResponse.data;
          } catch (err) {
            // No medical record exists
          }
          
          // Get pet details
          let petDetails = appointment.pet;
          if (appointment.pet?.id) {
            try {
              const petResponse = await getPetDetails(appointment.pet.id);
              petDetails = petResponse.data;
            } catch (err) {
              console.error('Error fetching pet details:', err);
            }
          }
          
          // Get prescriptions if medical record exists
          let prescriptions = [];
          if (medicalRecord?.id) {
            try {
              const prescriptionsResponse = await getPrescriptionsByMedicalRecord(medicalRecord.id);
              prescriptions = prescriptionsResponse.data || [];
            } catch (err) {
              console.error('Error fetching prescriptions:', err);
            }
          }
          
          // Get vaccinations for this appointment
          let vaccinations = [];
          try {
            const vaccinationsResponse = await getVaccinationsByAppointment(appointment.id);
            vaccinations = vaccinationsResponse.data || [];
          } catch (err) {
            console.error('Error fetching vaccinations:', err);
          }
          
          return {
            id: medicalRecord?.id || `temp-${appointment.id}`,
            appointmentId: appointment.id,
           appointmentDate: appointment.slot ? `${appointment.slot.slotDate}T${appointment.slot.startTime}`: appointment.createdAt ?? null,
             vet: appointment.vet,
            pet: petDetails,
            owner: appointment.user || appointment.owner,
            diagnosis: medicalRecord?.diagnosis || 'No diagnosis recorded',
            notes: medicalRecord?.notes || '',
            createdAt: medicalRecord?.createdAt || appointment.updatedAt || appointment.createdAt,
            prescriptions,
            vaccinations,
            hasRecord: !!medicalRecord
          };
        } catch (err) {
          console.error('Error processing appointment:', err);
          return null;
        }
      });
      
      const allRecords = (await Promise.all(recordsPromises)).filter(record => record !== null);
      
      // Sort by date (newest first)
      allRecords.sort((a, b) => new Date(b.appointmentDate || 0) - new Date(a.appointmentDate || 0));
      
      setRecords(allRecords);
      
      // Extract unique pets for filter
      const uniquePets = [];
      const petIds = new Set();
      allRecords.forEach(record => {
        if (record.pet?.id && !petIds.has(record.pet.id)) {
          petIds.add(record.pet.id);
          uniquePets.push({
            id: record.pet.id,
            name: record.pet.name || 'Unknown',
            species: record.pet.species || 'Pet'
          });
        }
      });
      setPets(uniquePets);
      
      // Calculate stats
      const totalPrescriptions = allRecords.reduce((sum, record) => sum + (record.prescriptions?.length || 0), 0);
      const totalVaccinations = allRecords.reduce((sum, record) => sum + (record.vaccinations?.length || 0), 0);
      
      setStats({
        totalRecords: allRecords.length,
        totalPets: uniquePets.length,
        totalPrescriptions,
        totalVaccinations
      });
      
    } catch (err) {
      console.error('Error fetching medical records:', err);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  // Filter records
  const filteredRecords = records.filter(record => {
    // Filter by pet
    if (filterPet !== 'ALL' && record.pet?.id !== parseInt(filterPet)) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.pet?.name?.toLowerCase().includes(searchLower) ||
        record.owner?.name?.toLowerCase().includes(searchLower) ||
        record.owner?.email?.toLowerCase().includes(searchLower) ||
        record.diagnosis?.toLowerCase().includes(searchLower) ||
        record.prescriptions?.some(p => p.medicineName?.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Format date only
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Get pet icon
  const getPetIcon = (species) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return <Dog className="text-amber-600" size={20} />;
      case 'cat':
        return <Cat className="text-gray-600" size={20} />;
      default:
        return <Dog className="text-gray-400" size={20} />;
    }
  };

  // Get pet avatar color
  const getPetAvatarColor = (species) => {
    switch (species?.toLowerCase()) {
      case 'dog':
        return 'bg-amber-100';
      case 'cat':
        return 'bg-gray-100';
      default:
        return 'bg-purple-100';
    }
  };

  // Toggle expanded row for mobile
  const toggleRowExpand = (recordId) => {
    setExpandedRows(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  // View record details
  const viewRecordDetails = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  // Export single record as PDF
// Export single record as PDF
const exportRecordAsPDF = async (record) => {
  try {
    toast.info('Generating PDF...');
    
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">PetCare Veterinary Clinic</h1>
          <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">Medical Record - ${record.pet?.name || 'Unknown Pet'}</p>
          <p style="color: #6b7280; margin: 0; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Appointment Info -->
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px;">
            Appointment Details
          </h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div>
              <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px;">Appointment ID</p>
              <p style="color: #374151; margin: 0; font-size: 14px; font-weight: bold;">#${record.appointmentId}</p>
            </div>
            <div>
              <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px;">Date</p>
              <p style="color: #374151; margin: 0; font-size: 14px; font-weight: bold;">${formatDateOnly(record.appointmentDate)}</p>
            </div>
          </div>
        </div>
        
        <!-- Pet & Owner Info -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Pet Information</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${record.pet?.name || 'N/A'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Species:</strong> ${record.pet?.species || 'N/A'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Breed:</strong> ${record.pet?.breed || 'N/A'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Age:</strong> ${record.pet?.age || 'N/A'} years</p>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Owner Information</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${record.owner?.name || record.owner?.firstName + ' ' + record.owner?.lastName || 'N/A'}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${record.owner?.email || 'N/A'}</p>
          </div>
        </div>
        
        <!-- Medical Record -->
        <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #6d28d9; margin: 0 0 15px 0; font-size: 18px;">Medical Record</h3>
          
          <div style="margin-bottom: 20px;">
            <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 15px;">Diagnosis</h4>
            <p style="color: #374151; margin: 0; padding: 12px; background: white; border-radius: 6px; font-size: 14px;">
              ${record.diagnosis || 'No diagnosis recorded'}
            </p>
          </div>
          
          <div>
            <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 15px;">Clinical Notes</h4>
            <p style="color: #374151; margin: 0; padding: 12px; background: white; border-radius: 6px; font-size: 14px;">
              ${record.notes || 'No notes recorded'}
            </p>
          </div>
        </div>
        
        <!-- Prescriptions -->
        ${record.prescriptions?.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">
              Prescriptions (${record.prescriptions.length})
            </h3>
            <div style="display: grid; gap: 15px;">
              ${record.prescriptions.map(p => `
                <div style="padding: 15px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
                  <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #065f46;">${p.medicineName || 'N/A'}</p>
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div>
                      <p style="color: #6b7280; margin: 0 0 3px 0; font-size: 11px;">Dosage</p>
                      <p style="color: #374151; margin: 0; font-size: 13px;">${p.dosage || 'N/A'}</p>
                    </div>
                    <div>
                      <p style="color: #6b7280; margin: 0 0 3px 0; font-size: 11px;">Duration</p>
                      <p style="color: #374151; margin: 0; font-size: 13px;">${p.duration || 'N/A'}</p>
                    </div>
                    <div>
                      <p style="color: #6b7280; margin: 0 0 3px 0; font-size: 11px;">Instructions</p>
                      <p style="color: #374151; margin: 0; font-size: 13px;">${p.instructions || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Vaccinations -->
        ${record.vaccinations?.length > 0 ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px;">
              Vaccinations (${record.vaccinations.length})
            </h3>
            <div style="display: grid; gap: 10px;">
              ${record.vaccinations.map(v => `
                <div style="padding: 12px; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px;">
                  <p style="margin: 0; font-size: 15px; font-weight: bold; color: #1e40af;">${v.name || v.vaccineName || 'N/A'}</p>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #3b82f6;">
                    Administered: ${formatDateOnly(v.date || v.administeredDate)}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; margin: 0; font-size: 11px;">
            Generated by Dr.${record.vet?.name || "Unknown"} • PetCare Veterinary Platform
          </p>
        </div>
      </div>
    `;

    const opt = {
      margin: [15, 15, 15, 15],
      filename: `medical-record-${record.pet?.name || 'pet'}-${formatDateOnly(record.appointmentDate).replace(/[,\s]/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    toast.success('Medical record PDF generated successfully!');
    
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Failed to generate PDF');
  }
};

// Export all records as PDF
const exportAllRecordsPDF = async () => {
  try {
    toast.info('Generating complete medical records report...');
    
    const element = document.createElement('div');
    
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">PetCare Veterinary Clinic</h1>
          <p style="color: #6b7280; margin: 5px 0; font-size: 16px;">Complete Medical Records Report</p>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 13px;">Veterinarian: Dr. ${record.vet?.name || "Unknown"}</p>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <!-- Summary -->
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Summary Report</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${stats.totalRecords}</div>
              <div style="font-size: 12px; color: #6b7280;">Total Records</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.totalPets}</div>
              <div style="font-size: 12px; color: #6b7280;">Unique Pets</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.totalPrescriptions}</div>
              <div style="font-size: 12px; color: #6b7280;">Prescriptions</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.totalVaccinations}</div>
              <div style="font-size: 12px; color: #6b7280;">Vaccinations</div>
            </div>
          </div>
        </div>
        
        <!-- All Records -->
        <h2 style="color: #374151; margin: 30px 0 20px 0; font-size: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
          All Medical Records (${filteredRecords.length})
        </h2>
        
        ${filteredRecords.map((record, index) => `
          <div style="margin-bottom: 30px; padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
              <div>
                <h3 style="color: #7c3aed; margin: 0; font-size: 16px;">${record.pet?.name || 'Unknown Pet'}</h3>
                <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
                  Appointment #${record.appointmentId} • ${formatDateOnly(record.appointmentDate)}
                </p>
              </div>
              <span style="background: ${record.hasRecord ? '#d1fae5' : '#fee2e2'}; color: ${record.hasRecord ? '#065f46' : '#991b1b'}; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold;">
                ${record.hasRecord ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
              <div>
                <p style="color: #6b7280; margin: 0 0 3px 0; font-size: 11px;">Owner</p>
                <p style="color: #374151; margin: 0; font-size: 13px;">${record.owner?.name || record.owner?.firstName + ' ' + record.owner?.lastName || 'N/A'}</p>
                <p style="color: #6b7280; margin: 3px 0 0 0; font-size: 11px;">${record.owner?.email || ''}</p>
              </div>
              <div>
                <p style="color: #6b7280; margin: 0 0 3px 0; font-size: 11px;">Pet Details</p>
                <p style="color: #374151; margin: 0; font-size: 13px;">${record.pet?.species || 'N/A'} • ${record.pet?.breed || 'N/A'} • ${record.pet?.age || '?'} years</p>
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <p style="color: #6b7280; margin: 0 0 3px 0; font-size: 11px;">Diagnosis</p>
              <p style="color: #374151; margin: 0; font-size: 13px;">${record.diagnosis || 'No diagnosis'}</p>
            </div>
            
            ${record.prescriptions?.length > 0 ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="color: #059669; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">Prescriptions (${record.prescriptions.length})</p>
                <div style="display: grid; gap: 8px;">
                  ${record.prescriptions.map(p => `
                    <div style="padding: 8px; background: #ecfdf5; border-radius: 4px;">
                      <span style="font-weight: bold; color: #065f46;">${p.medicineName || 'N/A'}</span>
                      <span style="color: #6b7280; margin-left: 10px; font-size: 12px;">${p.dosage || ''} • ${p.duration || ''}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${record.vaccinations?.length > 0 ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="color: #2563eb; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">Vaccinations (${record.vaccinations.length})</p>
                <div style="display: grid; gap: 8px;">
                  ${record.vaccinations.map(v => `
                    <div style="padding: 8px; background: #dbeafe; border-radius: 4px;">
                      <span style="font-weight: bold; color: #1e40af;">${v.name || v.vaccineName || 'N/A'}</span>
                      <span style="color: #6b7280; margin-left: 10px; font-size: 12px;">Administered: ${formatDateOnly(v.date || v.administeredDate)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; margin: 0; font-size: 11px;">
            PetCare Veterinary Platform • Confidential Medical Records Report
          </p>
          <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 10px;">
            Generated for Dr. ${record.vet?.name || "Unknown"} • ${new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    `;

    const opt = {
      margin: [15, 15, 15, 15],
      filename: `all-medical-records-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    };

    await html2pdf().set(opt).from(element).save();
    toast.success('Complete medical records PDF generated!');
    
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Failed to generate PDF');
  }
};

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
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
            <FileHeart className="text-purple-600" />
            Medical Records
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View all medical records, prescriptions, and vaccinations from your completed appointments
          </p>
        </div>

        <button
          onClick={exportAllRecordsPDF}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Download size={18} /> Export All Records
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalRecords}</p>
              <p className="text-sm text-gray-600">Total Records</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Dog className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalPets}</p>
              <p className="text-sm text-gray-600">Unique Pets</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Pill className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalPrescriptions}</p>
              <p className="text-sm text-gray-600">Prescriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Syringe className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalVaccinations}</p>
              <p className="text-sm text-gray-600">Vaccinations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by pet name, owner, diagnosis, or medicine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Pet Filter */}
            <div className="relative">
              <select
                value={filterPet}
                onChange={(e) => setFilterPet(e.target.value)}
                className="px-4 py-2.5 pl-4 pr-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Pets</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <Filter size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchMedicalRecords}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Medical Records List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <FileHeart size={64} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No medical records found
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterPet !== 'ALL' 
                ? 'Try adjusting your search or filters' 
                : 'No completed appointments with medical records yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pet / Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescriptions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vaccinations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${getPetAvatarColor(record.pet?.species)} rounded-lg`}>
                            {getPetIcon(record.pet?.species)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {record.pet?.name || 'Unknown Pet'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <User size={12} />
                              {record.owner?.name || record.owner?.firstName + ' ' + record.owner?.lastName || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDateOnly(record.appointmentDate)}
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock size={12} />
                            #{record.appointmentId}
                          </p>
                          {!record.hasRecord && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle size={10} className="mr-1" />
                              No Record
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-800 line-clamp-2 font-medium">
                            {record.diagnosis || 'No diagnosis'}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {record.prescriptions?.length > 0 ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Pill size={12} className="mr-1" />
                              {record.prescriptions.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {record.vaccinations?.length > 0 ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Syringe size={12} className="mr-1" />
                              {record.vaccinations.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewRecordDetails(record)}
                            className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={18} className="text-purple-600" />
                          </button>
                          <button
                            onClick={() => exportRecordAsPDF(record)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={18} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleRowExpand(record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${getPetAvatarColor(record.pet?.species)} rounded-lg`}>
                          {getPetIcon(record.pet?.species)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {record.pet?.name || 'Unknown Pet'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {!record.hasRecord && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle size={10} className="mr-1" />
                                No Record
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        {expandedRows.includes(record.id) ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDateOnly(record.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        #{record.appointmentId}
                      </span>
                    </div>
                  </div>
                  
                  {expandedRows.includes(record.id) && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {/* Owner Info */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Owner</p>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <User size={14} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {record.owner?.name || record.owner?.firstName + ' ' + record.owner?.lastName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Mail size={10} />
                              {record.owner?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Diagnosis */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Diagnosis</p>
                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                          {record.diagnosis || 'No diagnosis recorded'}
                        </p>
                      </div>
                      
                      {/* Prescriptions */}
                      {record.prescriptions?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                            <Pill size={14} />
                            Prescriptions ({record.prescriptions.length})
                          </p>
                          <div className="space-y-2">
                            {record.prescriptions.map((p, idx) => (
                              <div key={idx} className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                <p className="font-medium text-green-800 text-sm">{p.medicineName}</p>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                                  <span>Dosage: {p.dosage || 'N/A'}</span>
                                  <span>Duration: {p.duration || 'N/A'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Vaccinations */}
                      {record.vaccinations?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                            <Syringe size={14} />
                            Vaccinations ({record.vaccinations.length})
                          </p>
                          <div className="space-y-2">
                            {record.vaccinations.map((v, idx) => (
                              <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="font-medium text-blue-800 text-sm">{v.name}</p>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                                  <span>Administered: {formatDateOnly(v.administeredDate)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <button
                          onClick={() => viewRecordDetails(record)}
                          className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                        <button
                          onClick={() => exportRecordAsPDF(record)}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Download size={16} />
                          PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Record Dialog */}
      {viewDialogOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FileHeart className="text-purple-600" />
                  Medical Record Details
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-gray-500">
                    Appointment #{selectedRecord.appointmentId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewDialogOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Pet & Owner Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pet Info */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Dog className="text-amber-600" size={20} />
                    Pet Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRecord.pet?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Species</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRecord.pet?.species || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Breed</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRecord.pet?.breed || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Age</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRecord.pet?.age || 'N/A'} years</span>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="text-blue-600" size={20} />
                    Owner Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedRecord.owner?.name || 
                         selectedRecord.owner?.firstName + ' ' + selectedRecord.owner?.lastName || 
                         'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRecord.owner?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Record */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="text-purple-600" size={20} />
                  Medical Record
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Diagnosis</label>
                    <div className="p-4 bg-white rounded-lg border border-purple-200">
                      <p className="text-gray-800">{selectedRecord.diagnosis || 'No diagnosis recorded'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Clinical Notes</label>
                    <div className="p-4 bg-white rounded-lg border border-purple-200">
                      <p className="text-gray-800">{selectedRecord.notes || 'No notes recorded'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescriptions */}
              {selectedRecord.prescriptions?.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Pill className="text-green-600" size={20} />
                    Prescriptions ({selectedRecord.prescriptions.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedRecord.prescriptions.map((p, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 text-base">{p.medicineName}</h4>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Dosage: {p.dosage || 'N/A'}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Duration: {p.duration || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vaccinations */}
              {selectedRecord.vaccinations?.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Syringe className="text-blue-600" size={20} />
                    Vaccinations ({selectedRecord.vaccinations.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedRecord.vaccinations.map((v, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 text-base">{v.name}</h4>
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Administered: </span>
                          <span className="text-sm font-medium text-gray-800">{formatDateOnly(v.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewDialogOpen(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewDialogOpen(false);
                    exportRecordAsPDF(selectedRecord);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Download size={18} />
                    Download PDF
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;