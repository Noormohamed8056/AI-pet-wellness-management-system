import { useEffect, useState } from "react";
import {
  getAllOwners,
  deleteUser,
  getOwnerProfile,
  getUserUpcomingAppointments,
  getUserCompletedAppointments,
  getAllPets,
  getAdminStats
} from "../../api/api";
import {
  X,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  PawPrint,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarCheck,
  Home,
  FileText,
  Camera,
  Heart,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Activity
} from "lucide-react";
import { toast } from 'react-toastify';

const OwnerManagement = () => {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [ownerStats, setOwnerStats] = useState({
    petsCount: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalAppointments: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllOwners();
      setOwners(res.data);
      
      // Load admin stats
      const statsRes = await getAdminStats();
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load pet owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openOwner = async (owner) => {
    setSelectedOwner(owner);
    setProfile(null);
    setOwnerStats({
      petsCount: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
      totalAppointments: 0
    });

    try {
      // Load owner profile if exists
      try {
        const profileRes = await getOwnerProfile(owner.id);
        setProfile(profileRes.data);
      } catch (error) {
        // Profile doesn't exist - that's okay
        console.log("No profile found for owner");
      }

      // Load owner's pets
      const petsRes = await getAllPets();
      const ownerPets = petsRes.data.filter(pet => pet.owner?.id === owner.id);
      
      // Load appointments stats
      const [upcomingRes, completedRes] = await Promise.allSettled([
        getUserUpcomingAppointments(owner.id),
        getUserCompletedAppointments(owner.id)
      ]);

      setOwnerStats({
        petsCount: ownerPets.length,
        upcomingAppointments: upcomingRes.status === 'fulfilled' ? upcomingRes.value.data.length : 0,
        completedAppointments: completedRes.status === 'fulfilled' ? completedRes.value.data.length : 0,
        totalAppointments: (upcomingRes.status === 'fulfilled' ? upcomingRes.value.data.length : 0) + 
                          (completedRes.status === 'fulfilled' ? completedRes.value.data.length : 0)
      });

    } catch (error) {
      console.error("Error loading owner details:", error);
      toast.error("Failed to load complete owner details");
    }
  };

  const close = () => {
    setSelectedOwner(null);
    setProfile(null);
  };

  const remove = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this pet owner and all their associated pets? This action cannot be undone.")) return;
    
    try {
      await deleteUser(id);
      toast.success("Pet owner deleted successfully");
      close();
      load();
    } catch (error) {
      toast.error("Failed to delete pet owner");
    }
  };

  // Get pet icon based on species
  const getPetIcon = (species) => {
    if (!species) return <PawPrint size={14} />;
    const s = species.toLowerCase();
    if (s.includes('dog')) return <Dog size={14} />;
    if (s.includes('cat')) return <Cat size={14} />;
    if (s.includes('bird')) return <Bird size={14} />;
    if (s.includes('rabbit')) return <Rabbit size={14} />;
    return <PawPrint size={14} />;
  };

  // Filter and sort owners
  const filteredOwners = owners
    .filter(owner => 
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner.phone && owner.phone.includes(searchTerm))
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "email") return a.email.localeCompare(b.email);
      if (sortBy === "joined") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="space-y-6 p-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Users className="text-violet-600" size={32} />
          Pet Owners Management
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
              <option value="joined">Sort by Join Date</option>
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
          Showing {filteredOwners.length} of {owners.length} pet owners
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Owners Grid/List View */}
      {!loading && (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          : "space-y-3"
        }>
          {filteredOwners.map((owner) => (
            <div
              key={owner.id}
              onClick={() => openOwner(owner)}
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
                      <User className="text-violet-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                        {owner.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Mail size={14} />
                        {owner.email}
                      </p>
                      {owner.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone size={14} />
                          {owner.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Joined: {new Date(owner.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </>
              ) : (
                // List View
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <User className="text-violet-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{owner.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {owner.email}
                        </span>
                        {owner.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {owner.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-400">
                    {new Date(owner.createdAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          ))}

          {filteredOwners.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No pet owners found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Detail Modal */}
      {selectedOwner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scale">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center overflow-hidden">
                    {profile?.profileImageUrl ? (
                      <img 
                        src={profile.profileImageUrl} 
                        alt={selectedOwner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedOwner.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-white/80">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {selectedOwner.email}
                      </span>
                      {selectedOwner.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {selectedOwner.phone}
                        </span>
                      )}
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
                    <PawPrint className="text-blue-600" size={20} />
                    <span className="text-xs text-blue-600 font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{ownerStats.petsCount}</p>
                  <p className="text-xs text-gray-600 mt-1">Pets</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CalendarCheck className="text-green-600" size={20} />
                    <span className="text-xs text-green-600 font-medium">Upcoming</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{ownerStats.upcomingAppointments}</p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="text-purple-600" size={20} />
                    <span className="text-xs text-purple-600 font-medium">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{ownerStats.completedAppointments}</p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="text-amber-600" size={20} />
                    <span className="text-xs text-amber-600 font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{ownerStats.totalAppointments}</p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User size={20} className="text-violet-600" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile?.fullName && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-800">{profile.fullName}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Mail size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-800">{selectedOwner.email}</p>
                      </div>
                    </div>

                    {selectedOwner.phone && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Phone size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium text-gray-800">{selectedOwner.phone}</p>
                        </div>
                      </div>
                    )}

                    {profile?.address && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Home size={16} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="font-medium text-gray-800">{profile.address}</p>
                        </div>
                      </div>
                    )}

                    {(profile?.city || profile?.state || profile?.pincode) && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <MapPin size={16} className="text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-medium text-gray-800">
                            {[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Bio</p>
                      <p className="text-gray-700 bg-white p-3 rounded-lg">{profile.bio}</p>
                    </div>
                  )}
                </div>

                {/* Pets Section */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart size={20} className="text-violet-600" />
                    Pets ({ownerStats.petsCount})
                  </h3>
                  
                  {ownerStats.petsCount > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* We'll load pets dynamically if needed */}
                      <div className="text-center py-4 text-gray-500 col-span-full">
                        <PawPrint size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">Pet details available in separate management</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <PawPrint size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No pets registered</p>
                    </div>
                  )}
                </div>

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
                        {selectedOwner.createdAt ? new Date(selectedOwner.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-800">
                        {selectedOwner.updatedAt ? new Date(selectedOwner.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email Verified</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedOwner.emailVerified ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle size={12} />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1 w-fit">
                            <AlertCircle size={12} />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Button Only */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => remove(selectedOwner.id)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Pet Owner
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

export default OwnerManagement;