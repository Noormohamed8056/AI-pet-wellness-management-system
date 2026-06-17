import { useEffect, useState } from "react";
import {
  getAllPets,
  getPetDetails,
  deletePet,
  getUserDetails,
  getPetVaccinations,
  getPetHealthMetrics,
  getPetMedicalHistory,
  getPetAppointmentCount
} from "../../api/api";
import {
  X,
  Trash2,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Rabbit,
  User,
  Calendar,
  Heart,
  Activity,
  Syringe,
  FileText,
  Mail,
  Phone,
  Scale,
  Scissors,
  VenusAndMars,
  Image as ImageIcon,
  ClipboardList
} from "lucide-react";
import { toast } from 'react-toastify';

const Pets = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petDetails, setPetDetails] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [petStats, setPetStats] = useState({
    vaccinations: 0,
    healthMetrics: 0,
    medicalRecords: 0,
    appointments: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllPets();
      setPets(res.data);
    } catch (error) {
      toast.error("Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Delete pet function
  const handleDeletePet = async (petId, ownerId) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this pet? This action cannot be undone.")) return;
    
    try {
            if (!ownerId) {
        toast.error("Owner ID missing");
        return;
      }

      await deletePet(petId, ownerId);
      toast.success("Pet deleted successfully");
      if (selectedPet?.id === petId) {
        setSelectedPet(null);
        setPetDetails(null);
        setOwner(null);
      }
      load();
    } 
    catch (error) {
  console.log(error.response?.data);
  toast.error(error.response?.data || "Failed to delete pet");
}

  };

  const openPet = async (pet) => {
    setSelectedPet(pet);
    setPetDetails(null);
    setOwner(null);
    setPetStats({
      vaccinations: 0,
      healthMetrics: 0,
      medicalRecords: 0,
      appointments: 0
    });

    try {
      // Load detailed pet info
      const detailsRes = await getPetDetails(pet.id);
      setPetDetails(detailsRes.data);

      // Load owner details if exists
      if (pet.owner?.id) {
        const ownerRes = await getUserDetails(pet.owner.id);
        setOwner(ownerRes.data);
      }

      // Load additional stats
      const [vaccinationsRes, metricsRes, medicalRes, appointmentRes] =
  await Promise.allSettled([
    getPetVaccinations(pet.id),
    getPetHealthMetrics(pet.id),
    getPetMedicalHistory(pet.id),
    getPetAppointmentCount(pet.id)
  ]);

      setPetStats({
        vaccinations: vaccinationsRes.status === 'fulfilled' ? vaccinationsRes.value.data.length : 0,
        healthMetrics: metricsRes.status === 'fulfilled' ? metricsRes.value.data.length : 0,
        medicalRecords: medicalRes.status === 'fulfilled' ? medicalRes.value.data.length : 0,
        appointments: appointmentRes.status === 'fulfilled' ? appointmentRes.value.data : 0
      });

    } catch (error) {
      console.error("Error loading pet details:", error);
      toast.error("Failed to load complete pet details");
    }
  };

  const close = () => {
    setSelectedPet(null);
    setPetDetails(null);
    setOwner(null);
  };

  // Get pet icon based on species
  const getPetIcon = (species) => {
    if (!species) return <PawPrint size={24} />;
    const s = species.toLowerCase();
    if (s.includes('dog')) return <Dog size={24} className="text-amber-600" />;
    if (s.includes('cat')) return <Cat size={24} className="text-blue-600" />;
    if (s.includes('bird')) return <Bird size={24} className="text-green-600" />;
    if (s.includes('rabbit')) return <Rabbit size={24} className="text-pink-600" />;
    return <PawPrint size={24} className="text-purple-600" />;
  };

  // Get species badge color
  const getSpeciesColor = (species) => {
    if (!species) return "bg-gray-100 text-gray-700";
    const s = species.toLowerCase();
    if (s.includes('dog')) return "bg-amber-100 text-amber-700";
    if (s.includes('cat')) return "bg-blue-100 text-blue-700";
    if (s.includes('bird')) return "bg-green-100 text-green-700";
    if (s.includes('rabbit')) return "bg-pink-100 text-pink-700";
    return "bg-purple-100 text-purple-700";
  };

  // Filter and sort pets
  const filteredPets = pets
    .filter(pet => {
      const matchesSearch = 
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pet.species && pet.species.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pet.owner?.name && pet.owner.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSpecies = filterSpecies === "all" || 
        (pet.species && pet.species.toLowerCase() === filterSpecies.toLowerCase());
      
      return matchesSearch && matchesSpecies;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get unique species for filter
  const speciesList = ["all", ...new Set(pets.map(p => p.species).filter(Boolean))];

  return (
    <div className="space-y-6 p-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <PawPrint className="text-violet-600" size={32} />
          Pet Management
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by pet name, species, breed or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <PawPrint className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {speciesList.map(species => (
                <option key={species} value={species}>
                  {species === "all" ? "All Species" : species}
                </option>
              ))}
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
          Showing {filteredPets.length} of {pets.length} pets
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Pets Grid/List View */}
      {!loading && (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          : "space-y-3"
        }>
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              onClick={() => openPet(pet)}
              className={`group cursor-pointer transition-all hover:shadow-lg ${
                viewMode === "grid"
                  ? "bg-white border border-gray-200 rounded-xl p-5 hover:border-violet-300 hover:scale-[1.02]"
                  : "bg-white border border-gray-200 rounded-lg p-4 hover:border-violet-300 flex items-center justify-between"
              }`}
            >
              {viewMode === "grid" ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSpeciesColor(pet.species)}`}>
                      {pet.imageUrl ? (
                        <img 
                          src={pet.imageUrl} 
                          alt={pet.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        getPetIcon(pet.species)
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                        {pet.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getSpeciesColor(pet.species)}`}>
                          {pet.species || "Unknown"}
                        </span>
                        {pet.breed && (
                          <span className="text-xs text-gray-400">
                            • {pet.breed}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} />
                      <span>{pet.owner?.name || "No owner"}</span>
                    </div>
                    {pet.age && (
                      <span className="text-xs text-gray-400">
                        {pet.age} {pet.age === 1 ? 'year' : 'years'}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                // List View
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getSpeciesColor(pet.species)}`}>
                      {pet.imageUrl ? (
                        <img 
                          src={pet.imageUrl} 
                          alt={pet.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getPetIcon(pet.species)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{pet.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getSpeciesColor(pet.species)}`}>
                          {pet.species || "Unknown"}
                        </span>
                        {pet.breed && (
                          <span>{pet.breed}</span>
                        )}
                        <span>•</span>
                        <span>{pet.owner?.name || "No owner"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {pet.age && (
                    <span className="text-sm text-gray-400">
                      {pet.age}y
                    </span>
                  )}
                </>
              )}
            </div>
          ))}

          {filteredPets.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
              <PawPrint size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No pets found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Detail Modal */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scale">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm`}>
                    {selectedPet.imageUrl ? (
                      <img 
                        src={selectedPet.imageUrl} 
                        alt={selectedPet.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-white">
                        {getPetIcon(selectedPet.species)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPet.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white`}>
                        {selectedPet.species || "Unknown Species"}
                      </span>
                      {selectedPet.breed && (
                        <span className="text-white/80 text-sm">{selectedPet.breed}</span>
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
                    <Syringe className="text-blue-600" size={20} />
                    <span className="text-xs text-blue-600 font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{petStats.vaccinations}</p>
                  <p className="text-xs text-gray-600 mt-1">Vaccinations</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="text-green-600" size={20} />
                    <span className="text-xs text-green-600 font-medium">Records</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{petStats.healthMetrics}</p>
                  <p className="text-xs text-gray-600 mt-1">Health Metrics</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ClipboardList className="text-purple-600" size={20} />
                    <span className="text-xs text-purple-600 font-medium">Medical</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{petStats.medicalRecords}</p>
                  <p className="text-xs text-gray-600 mt-1">Records</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="text-amber-600" size={20} />
                    <span className="text-xs text-amber-600 font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{petStats.appointments}</p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>
              </div>

              {/* Pet Details */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PawPrint size={20} className="text-violet-600" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <PawPrint size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Species</p>
                        <p className="font-medium text-gray-800">{selectedPet.species || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Scissors size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Breed</p>
                        <p className="font-medium text-gray-800">{selectedPet.breed || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-medium text-gray-800">
                          {selectedPet.age ? `${selectedPet.age} ${selectedPet.age === 1 ? 'year' : 'years'}` : "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <VenusAndMars size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="font-medium text-gray-800">{selectedPet.gender || "Not specified"}</p>
                      </div>
                    </div>

                    {selectedPet.imageUrl && (
                      <div className="flex items-start gap-3 col-span-2">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <ImageIcon size={16} className="text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Image URL</p>
                          <a 
                            href={selectedPet.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-violet-600 hover:underline break-all"
                          >
                            {selectedPet.imageUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner Information */}
                {owner && (
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User size={20} className="text-violet-600" />
                      Owner Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium text-gray-800">{owner.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Mail size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-gray-800">{owner.email}</p>
                        </div>
                      </div>

                      {owner.phone && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Phone size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-medium text-gray-800">{owner.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Summary (Placeholder for now) */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart size={20} className="text-violet-600" />
                    Medical Summary
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Vaccinations</p>
                      <p className="text-lg font-semibold text-gray-800">{petStats.vaccinations}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Health Metrics</p>
                      <p className="text-lg font-semibold text-gray-800">{petStats.healthMetrics}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500">Medical Records</p>
                      <p className="text-lg font-semibold text-gray-800">{petStats.medicalRecords}</p>
                    </div>
                  </div>
                  
                  {petStats.vaccinations === 0 && petStats.healthMetrics === 0 && petStats.medicalRecords === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <FileText size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">No medical records available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Button Only */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeletePet(selectedPet.id, selectedPet.owner?.id)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Pet
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

export default Pets;