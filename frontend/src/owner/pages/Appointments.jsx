// Appointments.jsx
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Calendar, 
  User, 
  Dog, 
  CreditCard, 
  X, 
  CheckCircle, 
  AlertCircle,
  Edit2,
  Trash2,
  CalendarDays,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  ExternalLink,
  Wallet,
  ShieldCheck,
  Receipt,
  TrendingUp,
  Pill,
  Syringe,
  FileText,
  Stethoscope,
  Activity,
  Shield,
  AlertTriangle,
  Clipboard,
  Heart,
  Thermometer,
  Eye,
   Star,
  MessageSquare,
  ThumbsUp,
  Clock,
  Award,
  Building,
  Users,
  DollarSign,
  Send
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  bookAppointment, 
  cancelAppointment, 
  rescheduleAppointment,
  getUserUpcomingAppointments,
  getUserCompletedAppointments,
  getAllVets,
  getVetAvailableSlots,
  createPayment,
  markPaymentSuccess,
  checkFeedbackExists,
  getFeedbackByAppointment,
  submitFeedback
} from '../../api/api';
import { RAZORPAY_CONFIG } from '../../utils/razorpayConfig';
import api from "../../api/api";

// IMPORTANT: Appointment payments must use the official Razorpay Checkout modal.
// We intentionally do NOT use utils/loadRazorpay() here because in DEV it swaps in MockRazorpay,
// which is the custom Card/UPI/NetBanking/Wallet UI the user wants removed for appointments only.
const loadRealRazorpayCheckout = () =>
  new Promise((resolve) => {
    // If MockRazorpay was injected earlier, remove it so checkout.js can attach the real SDK.
    if (window.Razorpay && window.Razorpay.name === "MockRazorpay") {
      try {
        delete window.Razorpay;
      } catch {
        window.Razorpay = undefined;
      }
    }

    if (window.Razorpay && window.Razorpay.name !== "MockRazorpay") {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(!!window.Razorpay), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Appointments = () => {
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Appointments data
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  
  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  // NEW: Medical Record Modal
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loadingMedicalRecord, setLoadingMedicalRecord] = useState(false);
  
  // Booking form
  const [bookingStep, setBookingStep] = useState(1); // 1: Select pet, 2: Select vet, 3: Select slot, 4: Confirm
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  
  // Data lists
  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Payment
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  // Loading states
  const [loadingVets, setLoadingVets] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(false);


  // Feedback
   // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState({});
  const [appointmentFeedbacks, setAppointmentFeedbacks] = useState({});
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    waitingTimeRating: 5,
    facilitiesRating: 5,
    staffFriendlinessRating: 5,
    valueForMoneyRating: 5,
    comment: ''
  });

  // Load user data and appointments
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load user pets
       const petsRes = await api.get(`/pets/user/${userId}`);
        setPets(petsRes.data || []);
        
        // Load appointments
        await loadAppointments();
        
        // Load *real* Razorpay checkout (appointments only)
        const ok = await loadRealRazorpayCheckout();
        setRazorpayLoaded(ok);
        if (!ok) {
          toast.error("Failed to load Razorpay checkout");
        }
        
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

    // NEW: Check if feedback exists for an appointment
  const checkFeedbackForAppointment = async (appointmentId) => {
    try {
      const response = await checkFeedbackExists(appointmentId);
      setFeedbackExists(prev => ({
        ...prev,
        [appointmentId]: response.data
      }));
      
      // If feedback exists, load it
      if (response.data) {
        loadFeedbackForAppointment(appointmentId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking feedback:', error);
      return false;
    }
  };

  // NEW: Load feedback for an appointment
  const loadFeedbackForAppointment = async (appointmentId) => {
    try {
      const response = await getFeedbackByAppointment(appointmentId);
      setAppointmentFeedbacks(prev => ({
        ...prev,
        [appointmentId]: response.data
      }));
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  // NEW: Handle submit feedback
  const handleSubmitFeedback = async () => {
    if (!selectedAppointment) return;
    
    if (!feedbackForm.comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    setFeedbackLoading(true);
    try {
      const response = await submitFeedback(
        selectedAppointment.id,
        userId,
        feedbackForm
      );
      
      toast.success('Thank you for your feedback!');
      setShowFeedbackModal(false);
      
      // Update feedback state
      setFeedbackExists(prev => ({
        ...prev,
        [selectedAppointment.id]: true
      }));
      
      setAppointmentFeedbacks(prev => ({
        ...prev,
        [selectedAppointment.id]: response.data
      }));
      
      // Reset form
      setFeedbackForm({
        rating: 5,
        waitingTimeRating: 5,
        facilitiesRating: 5,
        staffFriendlinessRating: 5,
        valueForMoneyRating: 5,
        comment: ''
      });
      
    } catch (error) {
      toast.error(error.response?.data || 'Failed to submit feedback');
      console.error('Error submitting feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // NEW: Handle open feedback modal
  const handleOpenFeedback = (appointment) => {
    setSelectedAppointment(appointment);
    setShowFeedbackModal(true);
  };

  // Update the loadAppointments function to check feedback
  const loadAppointments = async () => {
    try {
      const [upcomingRes, completedRes] = await Promise.all([
        getUserUpcomingAppointments(userId),
        getUserCompletedAppointments(userId)
      ]);
      
      setUpcomingAppointments(upcomingRes.data || []);
      setCompletedAppointments(completedRes.data || []);
      
      // Check feedback for completed appointments
      completedRes.data?.forEach(appointment => {
        checkFeedbackForAppointment(appointment.id);
      });
      
    } catch (error) {
      toast.error('Failed to load appointments');
      console.error('Error loading appointments:', error);
    }
  };

  // NEW: Function to load medical record data
  const loadMedicalRecordData = async (appointmentId) => {
    setLoadingMedicalRecord(true);
    try {
      // Load medical record
      const medicalRecordRes = await api.get(`/medical-records/appointment/${appointmentId}`);
      const record = medicalRecordRes.data;
      setMedicalRecord(record);

      if (record) {
        // Load prescriptions
        try {
          const prescriptionsRes = await api.get(`/prescriptions/medical-record/${record.id}`);
          setPrescriptions(prescriptionsRes.data || []);
        } catch (error) {
          console.error('Error loading prescriptions:', error);
          setPrescriptions([]);
        }

        // Load vaccinations
        try {
          const vaccinationsRes = await api.get(`/vaccinations/appointment/${appointmentId}`);
          setVaccinations(vaccinationsRes.data || []);
        } catch (error) {
          console.error('Error loading vaccinations:', error);
          setVaccinations([]);
        }
      } else {
        setPrescriptions([]);
        setVaccinations([]);
      }

    } catch (error) {
      console.error('Error loading medical record:', error);
      setMedicalRecord(null);
      setPrescriptions([]);
      setVaccinations([]);
    } finally {
      setLoadingMedicalRecord(false);
    }
  };

   // Update handleViewMedicalRecord to also load feedback
  const handleViewMedicalRecord = (appointment) => {
    setSelectedAppointment(appointment);
    setShowMedicalRecordModal(true);
    loadMedicalRecordData(appointment.id);
    
    // Check if feedback exists
    if (!feedbackExists[appointment.id]) {
      checkFeedbackForAppointment(appointment.id);
    }
  };

  // Load vets when step 2 is active
  useEffect(() => {
    if (bookingStep === 2 && showBookingModal) {
      loadVets();
    }
  }, [bookingStep, showBookingModal]);

  // Load available slots when vet is selected
  useEffect(() => {
    if (selectedVet && bookingStep === 3) {
      loadAvailableSlots(selectedVet.id);
    }
  }, [selectedVet, bookingStep]);

  const loadVets = async () => {
    setLoadingVets(true);
    try {
      const response = await getAllVets();
      setVets(response.data || []);
    } catch (error) {
      toast.error('Failed to load vets');
      console.error('Error loading vets:', error);
    } finally {
      setLoadingVets(false);
    }
  };

  const loadAvailableSlots = async (vetId) => {
    setLoadingSlots(true);
    try {
      const response = await getVetAvailableSlots(vetId);
      setAvailableSlots(response.data || []);
    } catch (error) {
      toast.error('Failed to load available slots');
      console.error('Error loading slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleStartBooking = () => {
    setShowBookingModal(true);
    setBookingStep(1);
    setSelectedPet(null);
    setSelectedVet(null);
    setSelectedSlot(null);
  };

  const handleNextStep = () => {
    if (bookingStep === 1 && !selectedPet) {
      toast.error('Please select a pet');
      return;
    }
    if (bookingStep === 2 && !selectedVet) {
      toast.error('Please select a vet');
      return;
    }
    if (bookingStep === 3 && !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    
    if (bookingStep < 4) {
      setBookingStep(bookingStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedPet || !selectedVet || !selectedSlot) {
      toast.error('Please complete all booking steps');
      return;
    }

    setProcessingBooking(true);
    try {
      // Book appointment
      const response = await bookAppointment(userId, selectedPet.id, selectedSlot.id);
      const appointment = response.data;
      
      toast.success('Appointment booked successfully!');
      
      // Set current appointment for payment
      setCurrentAppointment(appointment);
      setShowBookingModal(false);
      setShowPaymentModal(true);
      
      // Refresh appointments
      await loadAppointments();
      
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Booking failed';
      toast.error(errorMessage);
    } finally {
      setProcessingBooking(false);
    }
  };

const handleInitiatePayment = async () => {
  if (!currentAppointment) return;

  try {
    if (!razorpayLoaded || !window.Razorpay || window.Razorpay.name === "MockRazorpay") {
      const ok = await loadRealRazorpayCheckout();
      setRazorpayLoaded(ok);
      if (!ok || !window.Razorpay || window.Razorpay.name === "MockRazorpay") {
        toast.error("Razorpay checkout is not available. Please refresh and try again.");
        return;
      }
    }

    setPaymentLoading(true);

    const res = await createPayment(currentAppointment.id);
    const payment = res.data;

    if (!payment?.razorpayOrderId || payment.razorpayOrderId.startsWith("mock_order_")) {
      toast.error("Invalid payment order. Please try again.");
      return;
    }

    console.log('Payment created:', payment);

    const options = {
      key: RAZORPAY_CONFIG.key_id,
      amount: payment.amount * 100, // paise
      currency: payment.currency || "INR",
      name: "PetCare Veterinary Services",
      description: `Vet Consultation for ${currentAppointment.pet?.name}`,
      order_id: payment.razorpayOrderId,

      handler: async function (response) {
        console.log('Payment response:', response);
        try {
          await markPaymentSuccess(payment.id, response.razorpay_payment_id);
          toast.success("✅ Payment successful! Appointment confirmed.");
          setShowPaymentModal(false);
          setCurrentAppointment(null);
          await loadAppointments();
        } catch (err) {
          console.error('Error marking payment success:', err);
          toast.error("Payment verification failed. Please contact support.");
        }
      },

      prefill: {
        name:    localStorage.getItem("userName")  || "Test User",
        email:   localStorage.getItem("userEmail") || "test@example.com",
        contact: localStorage.getItem("userPhone") || "9999999999"
      },

      theme: { color: "#7c3aed" },

      modal: {
        ondismiss: function () {
          toast.info('Payment cancelled');
          setPaymentLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("Razorpay payment failed:", response.error);
      toast.error(response.error?.description || "Payment failed. Please try again.");
      setPaymentLoading(false);
    });
    rzp.open();

  } catch (err) {
    console.error('Payment initiation error:', err);
    toast.error(`Payment failed: ${err.response?.data || err.message}`);
  } finally {
    setPaymentLoading(false);
  }
};



const handlePaymentSuccess = async (paymentId, razorpayPaymentId) => {
  try {
    // Mark payment as successful on backend
    await markPaymentSuccess(paymentId, razorpayPaymentId);
    
    // Show success toast
    toast.success('✅ Payment successful! Appointment confirmed.', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Close payment modal
    setShowPaymentModal(false);
    setCurrentAppointment(null);
    
    // Refresh appointments
    await loadAppointments();
    
  } catch (error) {
    toast.error('Payment verification failed');
  } finally {
    setPaymentLoading(false);
  }
};


  const handleCancelAppointment = async (appointment) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await cancelAppointment(appointment.id, userId);
      toast.success('Appointment cancelled successfully');
      await loadAppointments();
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Cancellation failed';
      toast.error(errorMessage);
    }
  };

const handleStartReschedule = async (appointment) => {
  setAppointmentToReschedule(appointment);
  setSelectedPet(appointment.pet);
  setSelectedVet(appointment.vet);
  setSelectedSlot(null);

  setShowRescheduleModal(true);

  // ✅ CRITICAL: load slots for THIS vet
  try {
    setLoadingSlots(true);
    const res = await getVetAvailableSlots(appointment.vet.id);
    setAvailableSlots(res.data || []);
  } catch (err) {
    toast.error("Failed to load slots for reschedule");
  } finally {
    setLoadingSlots(false);
  }
};


  const handleRescheduleAppointment = async () => {
    if (!appointmentToReschedule || !selectedSlot) {
      toast.error('Please select a new time slot');
      return;
    }
    
    try {
      await rescheduleAppointment(
        appointmentToReschedule.id,
        userId,
        selectedSlot.id
      );
      
      toast.success('Appointment rescheduled successfully');
      setShowRescheduleModal(false);
      setAppointmentToReschedule(null);
      setSelectedSlot(null);
      await loadAppointments();
      
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Reschedule failed';
      toast.error(errorMessage);
    }
  };

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : '';
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusConfig = {
      BOOKED: { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-3 h-3" /> },
      PAID: { color: 'bg-purple-100 text-purple-800', icon: <CreditCard className="w-3 h-3" /> },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      COMPLETED: { color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: <X className="w-3 h-3" /> },
      REJECTED: { color: 'bg-gray-100 text-gray-800', icon: <X className="w-3 h-3" /> }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3" /> };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  // Calculate consultation fee
  const getConsultationFee = (vet) => {
    return vet?.vetProfile?.consultationFee || 449; // Default ₹500
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
            Appointments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule and manage your pet's veterinary appointments
          </p>
        </div>

        <button
          onClick={handleStartBooking}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus size={18} /> Book New Appointment
        </button>
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
            <Calendar className="w-4 h-4" />
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
              <p className="text-gray-500 mb-6">
                Schedule your first veterinary appointment for your pet
              </p>
              <button
                onClick={handleStartBooking}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={18} /> Book Appointment
              </button>
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
                        {appointment.status === 'BOOKED' && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Payment Pending
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {appointment.pet?.name || 'Pet'} Consultation
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
                        <p className="text-xs text-gray-500">Veterinarian</p>
                        <p className="font-medium text-gray-800">
                          Dr. {appointment.vet?.name} 
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
                  </div>

                  <div className="flex gap-3">
                    {appointment.status === 'BOOKED' && !appointment.payment && (
                      <button
                        onClick={() => {
                          setCurrentAppointment(appointment);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <CreditCard size={16} />
                        Pay Now
                      </button>
                    )}
                    
                    {appointment.status === 'PAID' && (
                      <button
                        onClick={() => handleStartReschedule(appointment)}
                        className="flex-1 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Reschedule
                      </button>
                    )}
                    
                    {['BOOKED', 'PAID'].includes(appointment.status) && (
                      <button
                        onClick={() => handleCancelAppointment(appointment)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
                ) : (
          // Completed Appointments - UPDATED TO SHOW AS CARDS
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
                        {appointment.pet?.name || 'Pet'} Consultation
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
                        <p className="text-xs text-gray-500">Veterinarian</p>
                        <p className="font-medium text-gray-800">
                          Dr. {appointment.vet?.name}
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

                    {appointment.payment && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Receipt className="text-green-600" size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Amount Paid</p>
                          <p className="font-medium text-green-600">
                            ₹{appointment.payment.amount}
                          </p>
                        </div>
                      </div>
                    )}

                    {appointment.medicalRecord && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="text-purple-600" size={16} />
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
                      onClick={() => handleViewMedicalRecord(appointment)}
                      className="flex-1 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      View Medical Record
                    </button>
                    
                    {/* Feedback Button - only show if no feedback submitted */}
                    {!feedbackExists[appointment.id] && (
                      <button
                        onClick={() => handleOpenFeedback(appointment)}
                        className="px-4 py-2 border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Star size={16} />
                        Give Feedback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* NEW: Medical Record Modal */}
      {showMedicalRecordModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="text-purple-600" />
                  Medical Record
                  {medicalRecord && (
                    <span className="text-sm font-normal text-gray-500">
                      • Appointment #{selectedAppointment.id}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowMedicalRecordModal(false);
                    setSelectedAppointment(null);
                    setMedicalRecord(null);
                    setPrescriptions([]);
                    setVaccinations([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingMedicalRecord ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading medical record...</p>
                </div>
              ) : !medicalRecord ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No medical record available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Medical record has not been created for this appointment yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  
        {/* Header Section - Fixed Alignment */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-500 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6">
                      {/* Appointment Date */}
                      <div className="p-4 md:p-0 border-b md:border-b-0 md:border-r border-purple-200 pb-4 md:pb-0 md:pr-6">
                        <p className="text-sm text-gray-600 mb-1">Appointment Date</p>
                        <p className="font-medium text-gray-800 text-lg mb-1">
                          {selectedAppointment.slot && formatDate(selectedAppointment.slot.slotDate)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedAppointment.slot && 
                            `${formatTime(selectedAppointment.slot.startTime)} - ${formatTime(selectedAppointment.slot.endTime)}`
                          }
                        </p>
                      </div>
                      
                      {/* Pet */}
                      <div className="p-4 md:p-0 border-b md:border-b-0 md:border-r border-purple-200 py-4 md:py-0 md:px-6 ">
                        <p className="text-sm text-gray-600 mb-1 pl-8">Pet</p>
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
                          </div>
                        </div>
                      </div>
                      
                      {/* Veterinarian */}
                      <div className="p-4 md:p-0 pt-4 md:pt-0 md:pl-6">
                        <p className="text-sm text-gray-600 mb-1 pl-8">Veterinarian</p>
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-800 text-lg">
                              Dr. {selectedAppointment.vet?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedAppointment.vet?.vetProfile?.specialization || 'General Veterinarian'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis Section */}
                  <div className="bg-white border border-gray-450 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Stethoscope className="w-5 h-5 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Diagnosis</h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-line">
                        {medicalRecord.diagnosis || 'No diagnosis recorded.'}
                      </p>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  {medicalRecord.notes && (
                    <div className="bg-white border border-gray-450 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Clinical Notes</h3>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-line">
                          {medicalRecord.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Prescriptions Section */}
                  <div className="bg-white border border-gray-450 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Pill className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Prescriptions</h3>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {prescriptions.length} medication(s)
                      </span>
                    </div>
                    
                    {prescriptions.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Pill className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No prescriptions prescribed</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {prescriptions.map((prescription, index) => (
                          <div key={prescription.id} className="border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-green-50 rounded-lg">
                                    <Pill className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-500">
                                    Medication #{index + 1}
                                  </span>
                                </div>
                                
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 text-lg">
                                    {prescription.medicineName}
                                  </h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600 mb-1">Dosage</p>
                                      <p className="font-medium text-gray-800">{prescription.dosage || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600 mb-1">Duration</p>
                                      <p className="font-medium text-gray-800">{prescription.duration || 'Not specified'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600 mb-1">Instructions</p>
                                      <p className="font-medium text-gray-800">{prescription.instructions || 'Take as directed'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vaccinations Section */}
                  <div className="bg-white border border-gray-450 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Syringe className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Vaccinations Administered</h3>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                        {vaccinations.length} vaccine(s)
                      </span>
                    </div>
                    
                    {vaccinations.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Syringe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No vaccinations administered during this appointment</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {vaccinations.map((vaccination) => (
                          <div key={vaccination.id} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                    vaccination.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                    vaccination.status === 'DUE' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {vaccination.status}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                    vaccination.type === 'CORE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {vaccination.type === 'CORE' ? 'Core Vaccine' : 'Non-Core Vaccine'}
                                  </span>
                                </div>
                                
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 text-lg">
                                    {vaccination.name}
                                  </h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600 mb-1">Date Administered</p>
                                      <p className="font-medium text-gray-800">
                                        {vaccination.date ? formatDate(vaccination.date) : 'Not specified'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600 mb-1">Next Due Date</p>
                                      <p className="font-medium text-gray-800">
                                        {vaccination.nextDueDate ? formatDate(vaccination.nextDueDate) : 'Not specified'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                                      {/* Feedback Section - only show if feedback exists */}
                  {appointmentFeedbacks[selectedAppointment.id] && (
                    <div className="bg-white border border-gray-450 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Star className="w-5 h-5 text-amber-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800">Your Feedback</h3>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                          Submitted
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Overall Rating */}
                        <div className="bg-amber-50 border border-amber-400 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-gray-800">Overall Rating</p>
                              <p className="text-sm text-gray-500">Your overall experience</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={20}
                                  className={`${
                                    i < appointmentFeedbacks[selectedAppointment.id].rating
                                      ? 'text-amber-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-lg font-bold text-amber-600">
                                {appointmentFeedbacks[selectedAppointment.id].rating}/5
                              </span>
                            </div>
                          </div>
                          
                          {/* Comment */}
                          {appointmentFeedbacks[selectedAppointment.id].comment && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <p className="text-sm text-gray-600 mb-2">Your Comment</p>
                              <p className="text-gray-700 bg-white rounded-lg p-3">
                                {appointmentFeedbacks[selectedAppointment.id].comment}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Detailed Ratings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">Waiting Time</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-blue-600">
                                {appointmentFeedbacks[selectedAppointment.id].waitingTimeRating}/5
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-600">Facilities</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-green-600">
                                {appointmentFeedbacks[selectedAppointment.id].facilitiesRating}/5
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span className="text-sm text-gray-600">Staff Friendliness</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-purple-600">
                                {appointmentFeedbacks[selectedAppointment.id].staffFriendlinessRating}/5
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm text-gray-600">Value for Money</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-emerald-600">
                                {appointmentFeedbacks[selectedAppointment.id].valueForMoneyRating}/5
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Important Notice
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                        <p className="text-sm text-amber-700">
                          This medical record is for informational purposes only. Please follow your veterinarian's instructions carefully. 
                          Contact your vet if you have any questions about the diagnosis, prescriptions, or vaccinations.
                        </p>
                      </div>
                    </div>
                  </div> */}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMedicalRecordModal(false);
                  setSelectedAppointment(null);
                  setMedicalRecord(null);
                  setPrescriptions([]);
                  setVaccinations([]);
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                Close Medical Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Book New Appointment
                </h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Progress Steps */}
              <div className="flex items-center justify-between mt-6">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      bookingStep >= step
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-16 h-1 mx-2 ${
                        bookingStep > step ? 'bg-purple-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 mt-2 text-xs text-center">
                <span className={bookingStep >= 1 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                  Select Pet
                </span>
                <span className={bookingStep >= 2 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                  Choose Vet
                </span>
                <span className={bookingStep >= 3 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                  Pick Time
                </span>
                <span className={bookingStep >= 4 ? 'text-purple-600 font-medium' : 'text-gray-500'}>
                  Confirm
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Select Pet */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Select Your Pet</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pets.map(pet => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(pet)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selectedPet?.id === pet.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Dog className="text-amber-600" size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{pet.name}</p>
                            <p className="text-sm text-gray-500"> {pet.breed} [ {pet.species} ]</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Vet */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Choose Veterinarian</h3>
                  {loadingVets ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                      <p className="mt-2 text-gray-600">Loading veterinarians...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {vets.map(vet => (
                        <button
                          key={vet.id}
                          onClick={() => setSelectedVet(vet)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            selectedVet?.id === vet.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="text-blue-600" size={20} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  Dr. {vet.name}
                                </p> 
                                <p className="text-sm text-gray-500">
                                  {vet.vetProfile?.qualification || 'BVSc'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {vet.vetProfile?.specialization || 'General Veterinary'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {vet.vetProfile?.hospitalName || 'General Veterinary Clinic'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-purple-600">
                                ₹{getConsultationFee(vet)}
                              </p>
                              <p className="text-xs text-gray-500">Consultation Fee</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Select Time Slot */}
              {bookingStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Select Time Slot</h3>
                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                      <p className="mt-2 text-gray-600">Loading available slots...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No available slots for this vet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Please select another veterinarian
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            selectedSlot?.id === slot.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {formatDate(slot.slotDate)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </p>
                            </div>
                            <Clock className="text-gray-400" size={20} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Confirm Booking */}
              {bookingStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-800">Confirm Appointment</h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Pet</p>
                      <p className="font-semibold text-gray-800">{selectedPet?.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Veterinarian</p>
                      <p className="font-semibold text-gray-800">
                        Dr. {selectedVet?.name} 
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Date & Time</p>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          {formatDate(selectedSlot?.slotDate)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}
                        </p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600">Consultation Fee</p>
                        <p className="font-bold text-purple-600 text-lg">
                          ₹{getConsultationFee(selectedVet)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-sm text-amber-800">
                          You'll be redirected to a secure payment page after confirming this appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                {bookingStep > 1 && (
                  <button
                    onClick={handlePreviousStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {bookingStep < 4 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={
                      (bookingStep === 1 && !selectedPet) ||
                      (bookingStep === 2 && !selectedVet) ||
                      (bookingStep === 3 && !selectedSlot)
                    }
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingStep === 3 ? 'Review Booking' : 'Continue'}
                  </button>
                ) : (
                  <button
                    onClick={handleBookAppointment}
                    disabled={processingBooking}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingBooking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm & Book Appointment'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && currentAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Complete Payment
                </h2>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setCurrentAppointment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Appointment ID</p>
                  <p className="font-semibold text-gray-800">APT-{currentAppointment.id}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Pet</p>
                  <p className="font-semibold text-gray-800">{currentAppointment.pet?.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">Veterinarian</p>
                  <p className="font-semibold text-gray-800">
                    Dr. {currentAppointment.vet?.name}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">Total Amount</p>
                    <p className="font-bold text-purple-600 text-xl">
                      ₹{currentAppointment.vet?.vetProfile?.consultationFee || 449}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Security Info */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-green-600 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-green-800 mb-1">Secure Payment</p>
                    <p className="text-sm text-green-700">
                      Your payment is processed securely via Razorpay. We do not store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CreditCard className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Credit/Debit Card</p>
                      <p className="text-sm text-gray-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wallet className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">UPI</p>
                      <p className="text-sm text-gray-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Receipt className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Net Banking</p>
                      <p className="text-sm text-gray-500">All major banks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleInitiatePayment}
                disabled={paymentLoading || !razorpayLoaded}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay Now
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                By proceeding, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && appointmentToReschedule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  Reschedule Appointment
                </h2>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setAppointmentToReschedule(null);
                    setSelectedSlot(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-2">Current Appointment</p>
                <p className="font-semibold text-gray-800">
                  {formatDate(appointmentToReschedule.slot?.slotDate)} at {formatTime(appointmentToReschedule.slot?.startTime)}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Select New Time Slot</h3>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading available slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No available slots for rescheduling</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedSlot?.id === slot.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {formatDate(slot.slotDate)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                          </div>
                          <Clock className="text-gray-400" size={20} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setAppointmentToReschedule(null);
                    setSelectedSlot(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleAppointment}
                  disabled={!selectedSlot}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
            {/* Feedback Modal */}
      {showFeedbackModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Star className="text-amber-500" />
                  Share Your Experience
                </h2>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedAppointment(null);
                    setFeedbackForm({
                      rating: 5,
                      waitingTimeRating: 5,
                      facilitiesRating: 5,
                      staffFriendlinessRating: 5,
                      valueForMoneyRating: 5,
                      comment: ''
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Appointment #{selectedAppointment.id} • {selectedAppointment.pet?.name} with Dr. {selectedAppointment.vet?.name}
              </p>
            </div>

            <div className="p-6 space-y-8">
              {/* Overall Rating */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Overall Experience</h3>
                    <p className="text-sm text-gray-500">How was your consultation?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        feedbackForm.rating >= star 
                          ? 'bg-amber-100 text-amber-600' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <Star size={24} className={feedbackForm.rating >= star ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">Waiting Time</p>
                      <p className="text-sm text-gray-500">How was the wait time?</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm({...feedbackForm, waitingTimeRating: rating})}
                        className={`px-2 py-1 rounded ${
                          feedbackForm.waitingTimeRating >= rating 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-800">Facilities</p>
                      <p className="text-sm text-gray-500">Clinic facilities & cleanliness</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm({...feedbackForm, facilitiesRating: rating})}
                        className={`px-2 py-1 rounded ${
                          feedbackForm.facilitiesRating >= rating 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-800">Staff Friendliness</p>
                      <p className="text-sm text-gray-500">Staff behavior & support</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm({...feedbackForm, staffFriendlinessRating: rating})}
                        className={`px-2 py-1 rounded ${
                          feedbackForm.staffFriendlinessRating >= rating 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-800">Value for Money</p>
                      <p className="text-sm text-gray-500">Service vs cost</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm({...feedbackForm, valueForMoneyRating: rating})}
                        className={`px-2 py-1 rounded ${
                          feedbackForm.valueForMoneyRating >= rating 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment Box */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Additional Comments</h3>
                    <p className="text-sm text-gray-500">Share your detailed experience</p>
                  </div>
                </div>
                <textarea
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({...feedbackForm, comment: e.target.value})}
                  placeholder="Tell us about your experience with the vet, service quality, suggestions for improvement..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[120px]"
                  rows={4}
                />
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-blue-600 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Your Feedback is Anonymous</p>
                    <p className="text-sm text-blue-700">
                      Your feedback helps improve our services. Personal details are kept confidential.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedAppointment(null);
                    setFeedbackForm({
                      rating: 5,
                      waitingTimeRating: 5,
                      facilitiesRating: 5,
                      staffFriendlinessRating: 5,
                      valueForMoneyRating: 5,
                      comment: ''
                    });
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackLoading || !feedbackForm.comment.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {feedbackLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;  