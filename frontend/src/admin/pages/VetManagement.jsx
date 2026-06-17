import { useEffect, useState } from "react";
import {
  getAllVets,
  getVetProfile,
  deleteUser,
  getVetUpcomingAppointments,
  getVetCompletedAppointments,
  getPatientsByVet,
  getVetPrescriptionCount,
  getAdminStats
} from "../../api/api";
import {
  X,
  Trash2,
  Calendar,
  Users,
  FileText,
  Award,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Stethoscope,
  Building,
  DollarSign,
  UserCheck,
  AlertCircle,
  Download,
  Eye,
  Shield,
  TrendingUp,
  CalendarCheck,
  Pill,
  Syringe,
  Star
} from "lucide-react";
import { toast } from 'react-toastify';

const VetManagement = () => {
  const [vets, setVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [vetStats, setVetStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    patientsCount: 0,
    prescriptionsCount: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllVets();
      setVets(res.data);
      
      // Load admin stats
      const statsRes = await getAdminStats();
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load veterinarians");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openVet = async (vet) => {
    setSelectedVet(vet);
    setProfile(null);
    setVetStats({
      upcomingAppointments: 0,
      completedAppointments: 0,
      patientsCount: 0,
      prescriptionsCount: 0
    });

    try {
      // Load vet profile
      const profileRes = await getVetProfile(vet.id);
      setProfile(profileRes.data);

      // Load additional stats in parallel
      const [
        upcomingRes,
        completedRes,
        patientsRes,
        prescriptionsRes
      ] = await Promise.allSettled([
        getVetUpcomingAppointments(vet.id),
        getVetCompletedAppointments(vet.id),
        getPatientsByVet(vet.id),
        getVetPrescriptionCount(vet.id)
      ]);

      setVetStats({
        upcomingAppointments: upcomingRes.status === 'fulfilled' ? upcomingRes.value.data.length : 0,
        completedAppointments: completedRes.status === 'fulfilled' ? completedRes.value.data.length : 0,
        patientsCount: patientsRes.status === 'fulfilled' ? patientsRes.value.data.length : 0,
        prescriptionsCount: prescriptionsRes.status === 'fulfilled' ? prescriptionsRes.value.data : 0
      });

    } catch (error) {
      console.error("Error loading vet details:", error);
      toast.error("Failed to load complete vet details");
    }
  };

  const close = () => {
    setSelectedVet(null);
    setProfile(null);
  };

  const remove = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this veterinarian permanently? This action cannot be undone.")) return;
    
    try {
      await deleteUser(id);
      toast.success("Veterinarian deleted successfully");
      close();
      load();
    } catch (error) {
      toast.error("Failed to delete veterinarian");
    }
  };

  // Filter and sort vets
  const filteredVets = vets
    .filter(vet => 
      vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "email") return a.email.localeCompare(b.email);
      return 0;
    });

  return (
    <div className="space-y-6 p-6">
      {/* Simple Header - Just the title */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Stethoscope className="text-violet-600" size={32} />
          Veterinarian Management
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
            </select>
            
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${viewMode === "grid" ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 ${viewMode === "list" ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredVets.length} of {vets.length} veterinarians
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Vet Grid/List View */}
      {!loading && (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          : "space-y-3"
        }>
          {filteredVets.map((vet) => (
            <div
              key={vet.id}
              onClick={() => openVet(vet)}
              className={`group cursor-pointer transition-all hover:shadow-lg ${
                viewMode === "grid"
                  ? "bg-white border border-gray-200 rounded-xl p-5 hover:border-violet-300 hover:scale-[1.02]"
                  : "bg-white border border-gray-200 rounded-lg p-4 hover:border-violet-300 flex items-center justify-between"
              }`}
            >
              {viewMode === "grid" ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Stethoscope className="text-violet-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                        {vet.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Mail size={14} />
                        {vet.email}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={14} />
                        {vet.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <CheckCircle size={12} />
                      Approved
                    </span>
                    <span className="text-xs text-gray-400">
                      ID: {vet.id}
                    </span>
                  </div>
                </>
              ) : (
                // List View
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Stethoscope className="text-violet-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{vet.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {vet.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {vet.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <CheckCircle size={12} />
                    Approved
                  </span>
                </>
              )}
            </div>
          ))}

          {filteredVets.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No veterinarians found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Detail Modal */}
      {selectedVet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scale">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Stethoscope size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedVet.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-white/80">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {selectedVet.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {selectedVet.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="text-blue-600" size={20} />
                    <span className="text-xs text-blue-600 font-medium">Upcoming</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vetStats.upcomingAppointments}</p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-xs text-green-600 font-medium">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vetStats.completedAppointments}</p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="text-purple-600" size={20} />
                    <span className="text-xs text-purple-600 font-medium">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vetStats.patientsCount}</p>
                  <p className="text-xs text-gray-600 mt-1">Patients</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Pill className="text-amber-600" size={20} />
                    <span className="text-xs text-amber-600 font-medium">Written</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vetStats.prescriptionsCount}</p>
                  <p className="text-xs text-gray-600 mt-1">Prescriptions</p>
                </div>
              </div>

              {/* Profile Details */}
              {profile ? (
                <div className="space-y-6">
                  {/* Professional Info */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Award size={20} className="text-violet-600" />
                      Professional Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Award size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Qualification</p>
                          <p className="font-medium text-gray-800">{profile.qualification || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Stethoscope size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Specialization</p>
                          <p className="font-medium text-gray-800">{profile.specialization || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Building size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hospital/Clinic</p>
                          <p className="font-medium text-gray-800">{profile.hospitalName || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Clock size={16} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="font-medium text-gray-800">{profile.experienceYears || 0} years</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <FileText size={16} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">License Number</p>
                          <p className="font-medium text-gray-800">{profile.licenseNumber || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <DollarSign size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Consultation Fee</p>
                          <p className="font-medium text-gray-800">₹{profile.consultationFee || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Professional Bio</p>
                        <p className="text-gray-700 bg-white p-3 rounded-lg">{profile.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Certificates */}
                  {(profile.degreeCertificateUrl || profile.medicalRegistrationCertificateUrl || profile.identityProofUrl) && (
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-violet-600" />
                        Verification Documents
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {profile.degreeCertificateUrl && (
                          <a
                            href={`http://localhost:8080${profile.degreeCertificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all group"
                          >
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                              <Award size={16} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Degree Certificate</p>
                              <p className="text-xs text-gray-500">Click to view</p>
                            </div>
                            <Eye size={16} className="text-gray-400 group-hover:text-blue-600" />
                          </a>
                        )}

                        {profile.medicalRegistrationCertificateUrl && (
                          <a
                            href={`http://localhost:8080${profile.medicalRegistrationCertificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all group"
                          >
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                              <FileText size={16} className="text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Medical Registration</p>
                              <p className="text-xs text-gray-500">Click to view</p>
                            </div>
                            <Eye size={16} className="text-gray-400 group-hover:text-green-600" />
                          </a>
                        )}

                        {profile.identityProofUrl && (
                          <a
                            href={`http://localhost:8080${profile.identityProofUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all group"
                          >
                            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200">
                              <UserCheck size={16} className="text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Identity Proof</p>
                              <p className="text-xs text-gray-500">Click to view</p>
                            </div>
                            <Eye size={16} className="text-gray-400 group-hover:text-amber-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar size={20} className="text-violet-600" />
                      Account Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Member Since</p>
                        <p className="font-medium text-gray-800">
                          {selectedVet.createdAt ? new Date(selectedVet.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-800">
                          {selectedVet.updatedAt ? new Date(selectedVet.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Verification Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle size={12} />
                            Approved
                          </span>
                          {selectedVet.emailVerified && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1 w-fit">
                              <Mail size={12} />
                              Email Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No profile details available</p>
                </div>
              )}

              {/* Delete Button Only - Contact button removed */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => remove(selectedVet.id)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Veterinarian
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

export default VetManagement;