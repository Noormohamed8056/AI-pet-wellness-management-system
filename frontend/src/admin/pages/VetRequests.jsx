import { useEffect, useState } from "react";
import { getPendingVets, approveVet, getVetProfile, deleteUser } from "../../api/api";
import { 
  CheckCircle, 
  Trash2, 
  FileText, 
  GraduationCap, 
  FileCheck,
  User,
  BriefcaseMedical,
  Calendar,
  Award,
  Building,
  Eye,
  Download,
  X,
  Mail,
  Phone,
  ExternalLink,
  File
} from "lucide-react";

const VetRequests = () => {
  const [vets, setVets] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedVet, setSelectedVet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    try {
      const res = await getPendingVets();
      setVets(res.data);

      const profs = {};
      for (let v of res.data) {
        try {
          const p = await getVetProfile(v.id);
          profs[v.id] = p.data;
        } catch {
          profs[v.id] = null;
        }
      }
      setProfiles(profs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this veterinarian?")) return;
    await approveVet(id);
    load();
    setModalOpen(false);
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject and delete this vet?")) return;
    await deleteUser(id);
    load();
    setModalOpen(false);
  };

  const openModal = (vet) => {
    setSelectedVet(vet);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedVet(null);
  };

  const openCertificate = (url, filename = "document.pdf") => {
    if (url) {
      const link = document.createElement('a');
      link.href = `http://https://ai-pet-wellness-management-system.onrender.com${url}`;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const viewCertificate = (url) => {
    if (url) {
      window.open(`http://https://ai-pet-wellness-management-system.onrender.com${url}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
       {/* Header */}
      <div className="bg-gradient-to-r from-cyan-950 to-emerald-950 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <BriefcaseMedical size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Veterinarian Approvals</h1>
            <p className="text-violet-100">
              Review pending veterinarian applications and verify their credentials
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 px-4 py-2 rounded-lg">
            <span className="font-semibold">{vets.length}</span> pending requests
          </div>
          <div className="text-sm opacity-90">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Qualifications Verified</p>
              <p className="text-xl font-bold">
                {vets.filter(v => profiles[v.id]?.qualification).length}/{vets.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Award size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Experience</p>
              <p className="text-xl font-bold">
                {vets.length > 0 
                  ? Math.round(vets.reduce((acc, v) => acc + (profiles[v.id]?.experienceYears || 0), 0) / vets.length)
                  : 0} years
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Building size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Hospitals</p>
              <p className="text-xl font-bold">
                {new Set(vets.map(v => profiles[v.id]?.hospitalName).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {vets.length === 0 && (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-violet-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Pending Requests</h3>
          <p className="text-gray-500">All veterinarian applications have been reviewed.</p>
        </div>
      )}


      {/* Vet Cards - Minimal View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vets.map((vet) => {
          const p = profiles[vet.id];
          
          return (
            <div
              key={vet.id}
              onClick={() => openModal(vet)}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:border-violet-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-bold text-lg">
                  {getInitials(vet.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {vet.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{vet.email}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    {p?.specialization && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded">
                        {p.specialization.split(',')[0].trim()}
                      </span>
                    )}
                    {p?.experienceYears && (
                      <span className="text-xs text-gray-500">
                        {p.experienceYears}y exp
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Pending
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <FileText size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {[p?.degreeCertificateUrl, p?.medicalRegistrationCertificateUrl, p?.identityProofUrl]
                        .filter(Boolean).length} docs
                    </span>
                  </div>
                </div>
                <Eye size={16} className="text-gray-400 group-hover:text-violet-600" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Modal */}
      {modalOpen && selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl">
                    {getInitials(selectedVet.name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedVet.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Mail size={16} />
                        {selectedVet.email}
                      </span>
                      {selectedVet.phone && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Phone size={16} />
                          {selectedVet.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
              
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                  ⏳ Pending Review
                </span>
                {selectedVet.createdAt && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    Applied {new Date(selectedVet.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {profiles[selectedVet.id] ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column - Professional Info */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <BriefcaseMedical size={20} />
                          Professional Information
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <GraduationCap className="text-violet-600 mt-1" size={18} />
                            <div>
                              <p className="text-sm text-gray-500">Qualification</p>
                              <p className="font-medium">{profiles[selectedVet.id].qualification || "Not provided"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Award className="text-violet-600 mt-1" size={18} />
                            <div>
                              <p className="text-sm text-gray-500">Experience</p>
                              <p className="font-medium">
                                {profiles[selectedVet.id].experienceYears || 0} years
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Building className="text-violet-600 mt-1" size={18} />
                            <div>
                              <p className="text-sm text-gray-500">Hospital/Clinic</p>
                              <p className="font-medium">{profiles[selectedVet.id].hospitalName || "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Specialization */}
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Specialization</h3>
                        <div className="flex flex-wrap gap-2">
                          {profiles[selectedVet.id].specialization?.split(',').map((spec, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1.5 bg-violet-100 text-violet-700 text-sm rounded-lg font-medium"
                            >
                              {spec.trim()}
                            </span>
                          )) || (
                            <span className="text-gray-500 italic">Not specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - License & Bio */}
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <FileCheck size={20} />
                          License Information
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-500">License Number</p>
                            <p className="font-medium text-lg">
                              {profiles[selectedVet.id].licenseNumber || "Not provided"}
                            </p>
                          </div>
                          {profiles[selectedVet.id].consultationFee && (
                            <div>
                              <p className="text-sm text-gray-500">Consultation Fee</p>
                              <p className="font-medium text-lg">
                                ₹{profiles[selectedVet.id].consultationFee}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      {profiles[selectedVet.id].bio && (
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-3">Professional Bio</h3>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-600 leading-relaxed">
                              {profiles[selectedVet.id].bio}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                      <FileText size={24} />
                      Verification Documents
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Degree Certificate */}
                      <div className="border rounded-xl p-4 hover:border-violet-300 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold">Degree Certificate</h4>
                            <p className="text-xs text-gray-500">Veterinary qualification</p>
                          </div>
                        </div>
                        {profiles[selectedVet.id].degreeCertificateUrl ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewCertificate(profiles[selectedVet.id].degreeCertificateUrl)}
                              className="flex-1 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink size={16} />
                              View
                            </button>
                            <button
                              onClick={() => openCertificate(profiles[selectedVet.id].degreeCertificateUrl, `degree_${selectedVet.name}.pdf`)}
                              className="flex-1 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Download size={16} />
                              Download
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm italic">Not uploaded</p>
                        )}
                      </div>

                      {/* Medical Registration */}
                      <div className="border rounded-xl p-4 hover:border-green-300 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <FileCheck size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold">Medical Registration</h4>
                            <p className="text-xs text-gray-500">Professional license</p>
                          </div>
                        </div>
                        {profiles[selectedVet.id].medicalRegistrationCertificateUrl ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewCertificate(profiles[selectedVet.id].medicalRegistrationCertificateUrl)}
                              className="flex-1 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink size={16} />
                              View
                            </button>
                            <button
                              onClick={() => openCertificate(profiles[selectedVet.id].medicalRegistrationCertificateUrl, `medical_reg_${selectedVet.name}.pdf`)}
                              className="flex-1 py-2 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Download size={16} />
                              Download
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm italic">Not uploaded</p>
                        )}
                      </div>

                      {/* Identity Proof */}
                      <div className="border rounded-xl p-4 hover:border-amber-300 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <User size={20} />
                          </div>
                          <div>
                            <h4 className="font-semibold">Identity Proof</h4>
                            <p className="text-xs text-gray-500">Government ID</p>
                          </div>
                        </div>
                        {profiles[selectedVet.id].identityProofUrl ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewCertificate(profiles[selectedVet.id].identityProofUrl)}
                              className="flex-1 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink size={16} />
                              View
                            </button>
                            <button
                              onClick={() => openCertificate(profiles[selectedVet.id].identityProofUrl, `id_${selectedVet.name}.pdf`)}
                              className="flex-1 py-2 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Download size={16} />
                              Download
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm italic">Not uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <File size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Profile information not available</p>
                  <p className="text-sm mt-2">The veterinarian hasn't completed their profile.</p>
                </div>
              )}
            </div>

            {/* Modal Footer - Actions */}
            <div className="sticky bottom-0 bg-white border-t p-6 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Review all documents before approval
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(selectedVet.id)}
                    className="px-6 py-3 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVet.id)}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 rounded-xl font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <CheckCircle size={18} />
                    Approve Veterinarian
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetRequests;