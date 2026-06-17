import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { 
  X, 
  Trash2, 
  Plus, 
  PawPrint, 
  Dog, 
  Cat, 
  Bird, 
  Rabbit,
  Heart,
  Calendar,
  Syringe,
  Activity,
  Edit,
  Save,
  Camera,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  FileText,
  Clock,
  Pill,
  Award,
  Scissors,
  VenusAndMars,
  Image as ImageIcon,
  Eye
} from "lucide-react";
import { toast } from "react-toastify";

const Pets = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [petStats, setPetStats] = useState({});
  
  // Form states
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    gender: "",
    imageUrl: ""
  });

  const [editForm, setEditForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    gender: "",
    imageUrl: ""
  });

  const userId = localStorage.getItem("userId");

  const loadPets = async () => {
    try {
      const res = await api.get(`/pets/user/${userId}`);
      setPets(res.data || []);
      
      // Load stats for each pet
      res.data?.forEach(pet => loadPetStats(pet.id));
    } catch (error) {
      toast.error("Failed to load pets");
    }
  };

  const loadPetStats = async (petId) => {
    try {
      // Load vaccinations
      const vaxRes = await api.get(`/vaccinations/pet/${petId}`);
      // Load prescriptions
      const presRes = await api.get(`/prescriptions/pet/${petId}`);
      // Load appointments
      const appRes = await api.get(`/appointments/pet/${petId}/count`);
      
      setPetStats(prev => ({
        ...prev,
        [petId]: {
          vaccinations: vaxRes.data?.length || 0,
          prescriptions: presRes.data?.length || 0,
          appointments: appRes.data || 0
        }
      }));
    } catch (error) {
      console.log(`No stats for pet ${petId}`);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const remove = async (petId) => {
    if (!window.confirm("Are you sure you want to delete this pet? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/pets/${petId}/${userId}`);
      toast.success("Pet deleted successfully");
      setSelectedPet(null);
      setShowDetailsModal(false);
      loadPets();
    } catch (error) {
      toast.error(error.response?.data || "Failed to delete pet");
    }
  };

  const addPet = async () => {
    // Validation
    if (!form.name || !form.species || !form.age) {
      toast.error("Name, species, and age are required");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/pets/${userId}`, {
        ...form,
        age: Number(form.age)
      });
      toast.success("Pet added successfully! 🎉");
      setShowAddModal(false);
      setForm({
        name: "",
        species: "",
        breed: "",
        age: "",
        gender: "",
        imageUrl: ""
      });
      loadPets();
    } catch (error) {
      toast.error(error.response?.data || "Failed to add pet");
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async () => {
    if (!selectedPet) return;

    try {
      setLoading(true);
      await api.put(`/pets/${selectedPet.id}/${userId}`, {
        ...editForm,
        age: Number(editForm.age)
      });
      toast.success("Pet updated successfully! ✨");
      setShowEditModal(false);
      loadPets();
    } catch (error) {
      toast.error(error.response?.data || "Failed to update pet");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (pet) => {
    setSelectedPet(pet);
    setEditForm({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age || "",
      gender: pet.gender || "",
      imageUrl: pet.imageUrl || ""
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (pet) => {
    setSelectedPet(pet);
    setShowDetailsModal(true);
  };

  // Get pet icon based on species
  const getPetIcon = (species, size = 24) => {
    if (!species) return <PawPrint size={size} className="text-gray-600" />;
    const s = species.toLowerCase();
    if (s.includes('dog')) return <Dog size={size} className="text-amber-600" />;
    if (s.includes('cat')) return <Cat size={size} className="text-blue-600" />;
    if (s.includes('bird')) return <Bird size={size} className="text-green-600" />;
    if (s.includes('rabbit')) return <Rabbit size={size} className="text-pink-600" />;
    return <PawPrint size={size} className="text-purple-600" />;
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <PawPrint className="text-purple-600" size={32} />
            My Pets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your furry family members
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          Add New Pet
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PawPrint size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pets</p>
              <p className="text-xl font-bold text-gray-800">{pets.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Dog size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dogs</p>
              <p className="text-xl font-bold text-gray-800">
                {pets.filter(p => p.species?.toLowerCase().includes('dog')).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Cat size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cats</p>
              <p className="text-xl font-bold text-gray-800">
                {pets.filter(p => p.species?.toLowerCase().includes('cat')).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Heart size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Healthy Pets</p>
              <p className="text-xl font-bold text-gray-800">{pets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pets Grid */}
      {pets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-gray-400 mb-4">
            <PawPrint size={80} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Pets Added Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Add your first pet to start tracking their health and appointments
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
          >
            <Plus size={18} />
            Add Your First Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pets.map((pet) => {
            const stats = petStats[pet.id] || { vaccinations: 0, prescriptions: 0, appointments: 0 };
            
            return (
              <div
                key={pet.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all duration-200 group cursor-pointer"
                onClick={() => openDetailsModal(pet)}
              >
                {/* Pet Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  {pet.imageUrl ? (
                    <img
                      src={pet.imageUrl}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      {getPetIcon(pet.species, 64)}
                    </div>
                  )}
                  
                  {/* Species Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSpeciesColor(pet.species)}`}>
                      {pet.species || "Unknown"}
                    </span>
                  </div>
                  
                  {/* Age Badge */}
                  {pet.age && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 border border-gray-200">
                        {pet.age} {pet.age === 1 ? 'year' : 'years'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pet Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 text-lg">{pet.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(pet);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">
                    {pet.breed || "No breed specified"} • {pet.gender || "Gender not specified"}
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <Syringe size={16} className="mx-auto text-blue-600 mb-1" />
                      <p className="text-xs font-medium text-gray-700">{stats.vaccinations}</p>
                      <p className="text-xs text-gray-500">Vax</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <Pill size={16} className="mx-auto text-green-600 mb-1" />
                      <p className="text-xs font-medium text-gray-700">{stats.prescriptions}</p>
                      <p className="text-xs text-gray-500">Meds</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <Calendar size={16} className="mx-auto text-purple-600 mb-1" />
                      <p className="text-xs font-medium text-gray-700">{stats.appointments}</p>
                      <p className="text-xs text-gray-500">Appts</p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button className="w-full py-2 text-sm border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-1">
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="text-purple-600" size={20} />
                  Add New Pet
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/pet-image.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Add a URL for your pet's photo
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter pet name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Species */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.species}
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Fish">Fish</option>
                  <option value="Reptile">Reptile</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed
                </label>
                <input
                  type="text"
                  placeholder="Enter breed"
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Age and Gender Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Years"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              {(form.name || form.species || form.age) && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm font-medium text-purple-800 mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                      {getPetIcon(form.species, 20)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{form.name || "Pet Name"}</p>
                      <p className="text-xs text-gray-600">
                        {form.species || "Species"} • {form.age ? `${form.age} years` : "Age not set"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPet}
                  disabled={loading || !form.name || !form.species || !form.age}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Adding..." : "Add Pet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pet Modal */}
      {showEditModal && selectedPet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Edit className="text-amber-600" size={20} />
                  Edit {selectedPet.name}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/pet-image.jpg"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Species */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.species}
                  onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Fish">Fish</option>
                  <option value="Reptile">Reptile</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Breed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed
                </label>
                <input
                  type="text"
                  value={editForm.breed}
                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Age and Gender Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePet}
                  disabled={loading || !editForm.name || !editForm.species || !editForm.age}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update Pet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pet Details Modal */}
      {showDetailsModal && selectedPet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {selectedPet.imageUrl ? (
                      <img
                        src={selectedPet.imageUrl}
                        alt={selectedPet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getPetIcon(selectedPet.species, 32)
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPet.name}</h2>
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
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Syringe className="text-blue-600" size={20} />
                    <span className="text-xs text-blue-600 font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {petStats[selectedPet.id]?.vaccinations || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Vaccinations</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Pill className="text-green-600" size={20} />
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {petStats[selectedPet.id]?.prescriptions || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Prescriptions</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="text-purple-600" size={20} />
                    <span className="text-xs text-purple-600 font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {petStats[selectedPet.id]?.appointments || 0}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Appointments</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="text-amber-600" size={20} />
                    <span className="text-xs text-amber-600 font-medium">Status</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">Healthy</p>
                  <p className="text-xs text-gray-600 mt-1">Good Health</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PawPrint size={20} className="text-purple-600" />
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
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate('/dashboard/owner/appointments');
                  }}
                  className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Book Appointment</p>
                </button>
                
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate('/dashboard/owner/prescriptions');
                  }}
                  className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <Pill className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">View Prescriptions</p>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    openEditModal(selectedPet);
                  }}
                  className="flex-1 py-3 border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit Pet
                </button>
                <button
                  onClick={() => remove(selectedPet.id)}
                  className="flex-1 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Pet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pets;