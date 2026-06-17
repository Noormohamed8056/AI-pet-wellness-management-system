import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  Save,
  CalendarDays
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  createVetSlot, 
  getVetSlots, 
  updateVetSlot, 
  deleteVetSlot 
} from '../../api/api';

const Availability = () => {
  const userId = localStorage.getItem("userId");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '',
    endTime: ''
  });

  // Load vet slots
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await getVetSlots(userId);
      if (response.data) {
        // Sort slots by date and time
        const sortedSlots = response.data.sort((a, b) => {
          const dateA = new Date(a.slotDate + 'T' + a.startTime);
          const dateB = new Date(b.slotDate + 'T' + b.startTime);
          return dateA - dateB;
        });
        setSlots(sortedSlots);
      }
    } catch (error) {
  const errorMessage =
    error?.response?.data ||
    error?.message ||
    "Something went wrong";

  toast.error(errorMessage);
}
 finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { slotDate, startTime, endTime } = formData;
    
    if (!slotDate || !startTime || !endTime) {
      toast.error('All fields are required');
      return false;
    }

    if (new Date(slotDate) < new Date().setHours(0, 0, 0, 0)) {
      toast.error('Cannot create slots for past dates');
      return false;
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let response;
      if (editingSlot) {
        // Update existing slot
        response = await updateVetSlot(editingSlot.id, userId, formData);
      } else {
        // Create new slot
        response = await createVetSlot(userId, formData);
      }

      // Check if response has error status
      if (response.status >= 400) {
        // If backend returns error message in response.data
        throw new Error(response.data || 'Operation failed');
      }

      // Success case - Show success toast
      if (editingSlot) {
        toast.success('✅ Slot updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.success('✅ Slot created successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      
      // Reset form and refresh data
      handleCloseModal();
      fetchSlots();
      
    } catch (error) {
      // Extract the error message properly
      let errorMessage = 'Operation failed';
      
      if (error.response) {
        // Axios error with response
        errorMessage = error.response.data || error.response.statusText || 'Request failed';
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'No response from server';
      } else if (error.message) {
        // Error message from throw
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        // Error is already a string
        errorMessage = error;
      }
      
      // Display the backend error message
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Slot operation error:', error);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    setFormData({
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
    setShowModal(true);
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      const response = await deleteVetSlot(slotId, userId);
      
      if (response.status >= 400) {
        throw new Error(response.data || 'Deletion failed');
      }
      
      toast.success('✅ Slot deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      fetchSlots();
    } catch (error) {
      let errorMessage = 'Failed to delete slot';
      
      if (error.response) {
        errorMessage = error.response.data || error.response.statusText;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(`Error: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Delete slot error:', error);
    }
  };

  const handleAddNew = () => {
    setEditingSlot(null);
    setFormData({
      slotDate: '',
      startTime: '',
      endTime: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSlot(null);
    setFormData({
      slotDate: '',
      startTime: '',
      endTime: ''
    });
  };

  // Group slots by date
  const groupedSlots = slots.reduce((groups, slot) => {
    const date = slot.slotDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(slot);
    return groups;
  }, {});

  // Format time for display
  const formatTime = (time) => {
    return time ? time.substring(0, 5) : '';
  };

  // Get status badge style
  const getStatusBadge = (available) => {
    if (available) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="w-3 h-3 mr-1" />
          Booked
        </span>
      );
    }
  };

  // Check if slot is in the past
  const isPastSlot = (slot) => {
    const slotDateTime = new Date(slot.slotDate + 'T' + slot.endTime);
    return slotDateTime < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your availability...</p>
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
            Availability Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your consultation time slots for pet owners
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus size={18} /> Add New Slot
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Slots</p>
              <p className="text-2xl font-bold text-gray-800">{slots.length}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Slots</p>
              <p className="text-2xl font-bold text-gray-800">
                {slots.filter(s => s.available).length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Booked Slots</p>
              <p className="text-2xl font-bold text-gray-800">
                {slots.filter(s => !s.available).length}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Your Time Slots</h2>
          <p className="text-sm text-gray-500 mt-1">
            All your created time slots for consultations
          </p>
        </div>

        {Object.keys(groupedSlots).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No time slots created yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start by adding your first availability slot
            </p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} /> Add Your First Slot
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {Object.entries(groupedSlots).map(([date, dateSlots]) => {
              const isPastDate = new Date(date) < new Date().setHours(0, 0, 0, 0);
              
              return (
                <div key={date} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-purple-600" size={20} />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      {isPastDate && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          Past Date
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateSlots.map(slot => {
                      const isPast = isPastSlot(slot);
                      
                      return (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-xl border ${
                            isPast 
                              ? 'border-gray-200 bg-gray-50' 
                              : slot.available 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="text-gray-500" size={16} />
                                <span className="font-semibold text-gray-800">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </span>
                              </div>
                              {getStatusBadge(slot.available)}
                            </div>
                            {!isPast && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(slot)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit slot"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(slot.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete slot"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {isPast && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <AlertCircle size={12} />
                              This slot has passed and cannot be modified
                            </p>
                          )}
                          
                          {!slot.available && !isPast && (
                            <p className="text-xs text-amber-600 mt-2">
                              ⚠️ This slot is already booked
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">Important Notes</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Slots cannot overlap with existing slots on the same date</li>
              <li>• End time must be after start time</li>
              <li>• Past slots cannot be modified or deleted</li>
              <li>• Booked slots cannot be modified or deleted</li>
              <li>• Ensure to leave enough time between slots for consultations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit Slot */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="slotDate"
                    value={formData.slotDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingSlot ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingSlot ? 'Update Slot' : 'Create Slot'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;