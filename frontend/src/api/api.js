// Api.js -> C:\Users\user\Documents\info_pet\frontend\src\api\api.js
import axios from "axios";

// backend base url (use VITE_API_URL in production)
const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-pet-wellness-management-system.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// POST /users/register → register a new user
export const registerUser = (data) => {
  return api.post("/users/register", data);
};

// POST /users/login → login a user
export const loginUser = (data) => {
  return api.post("/users/login", data);
};

// GET /users/{id} → get user by id
export const getUserById = (id) => {
  return api.get(`/users/${id}`);
};

// PUT /users/{id} → update user profile
export const updateUser = (id, data) => {
  return api.put(`/users/${id}`, data);
};

// POST /vets/profile/{userId}
export const saveVetProfile = (userId, data) => {
  return api.post(`/vets/profile/${userId}`, data);
};

// api.js - Add these endpoints
export const uploadVetDocuments = (userId, formData) => {
  return api.put(`/vets/profile/${userId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
// =======================
// USER PROFILE (OWNER)
// =======================

// GET owner profile by user ID
export const getOwnerProfile = (userId) => {
  return api.get(`/users/profile/${userId}`);
};

// CREATE or UPDATE owner profile
export const saveOwnerProfile = (userId, data) => {
  return api.post(`/users/profile/${userId}`, data);
};

// UPDATE owner profile (PUT)
export const updateOwnerProfile = (userId, data) => {
  return api.put(`/users/profile/${userId}`, data);
};

// =======================
// USER ACCOUNT MANAGEMENT
// =======================

// Reset password
export const resetPassword = (userId, password) => {
  return api.put(`/users/${userId}/reset-password?password=${encodeURIComponent(password)}`);
};

// Get user details
export const getUserDetails = (userId) => {
  return api.get(`/users/${userId}`);
};

// Update user details (name, email, phone)
export const updateUserDetails = (userId, data) => {
  return api.put(`/users/${userId}`, data);
};



// ADMIN – stats
export const getAdminStats = () => {
  return api.get("/users/admin/stats");
};

// ADMIN – pending vets
export const getPendingVets = () => {
  return api.get("/users/admin/vets/pending");
};

// ADMIN – approve vet
export const approveVet = (id) => {
  return api.put(`/users/admin/vets/${id}/approve`);
};

// ADMIN – all vets
export const getAllVets = () => {
  return api.get("/users/admin/vets");
};

// ADMIN – all pet owners
export const getAllOwners = () => {
  return api.get("/users/admin/owners");
};

// ADMIN – delete any user
export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};

// ADMIN – all pets
export const getAllPets = () => {
  return api.get("/pets");
};

// ADMIN – get vet profile
export const getVetProfile = (userId) => {
  return api.get(`/vets/profile/${userId}`);
};

// ADMIN – all owner profiles
export const getAllOwnerProfiles = () => {
  return api.get("/users/profile");
};



// ADMIN – delete owner profile
export const deleteOwnerProfile = (userId) => {
  return api.delete(`/users/profile/${userId}`);
};

// =======================
// HEALTH METRICS – OWNER
// =======================

// OWNER – add daily health metric (restricted fields)
export const addHealthMetricByOwner = (petId, data) => {
  return api.post(`/health-metrics/pet/${petId}/owner`, data);
};

// GET all health metrics of a pet
export const getPetHealthMetrics = (petId) => {
  return api.get(`/health-metrics/pet/${petId}`);
};

// DELETE a health metric
export const deleteHealthMetric = (id) => {
  return api.delete(`/health-metrics/${id}`);
};


// =======================
// HEALTH ALERTS
// =======================

// GET all alerts of a pet
export const getPetAlerts = (petId) => {
  return api.get(`/alerts/pet/${petId}`);
};

// GET only active alerts of a pet
export const getActivePetAlerts = (petId) => {
  return api.get(`/alerts/pet/${petId}/active`);
};

// RESOLVE an alert
export const resolveHealthAlert = (id) => {
  return api.put(`/alerts/${id}/resolve`);
};

// DELETE an alert
export const deleteHealthAlert = (id) => {
  return api.delete(`/alerts/${id}`);
};

// =======================
// HEALTH METRICS - VET
// =======================

// VET - add health metric with clinical vitals
export const addHealthMetricByVet = (petId, data) => {
  return api.post(`/health-metrics/pet/${petId}/vet`, data);
};

// VET - get all metrics for pets under their care
export const getVetPetsMetrics = (vetId) => {
  return api.get(`/health-metrics/vet/${vetId}`);
};

// VET - update any health metric
export const updateHealthMetric = (id, data) => {
  return api.put(`/health-metrics/${id}`, data);
};

// =======================
// VET SLOTS
// =======================

// VET - Create a new slot
export const createVetSlot = (vetId, data) => {
  return api.post(`/slots/vet/${vetId}`, data);
};

// VET - Get all slots of a vet
export const getVetSlots = (vetId) => {
  return api.get(`/slots/vet/${vetId}`);
};

// VET - Get available slots of a vet
export const getAvailableVetSlots = (vetId) => {
  return api.get(`/slots/vet/${vetId}/available`);
};

// VET - Update a slot
export const updateVetSlot = (slotId, vetId, data) => {
  return api.put(`/slots/${slotId}/vet/${vetId}`, data);
};

// VET - Delete a slot
export const deleteVetSlot = (slotId, vetId) => {
  return api.delete(`/slots/${slotId}/vet/${vetId}`);
};

// OWNER - Get available slots of a vet (for booking)
export const getAvailableSlotsForBooking = (vetId) => {
  return api.get(`/slots/vet/${vetId}/available`);
};

// =======================
// APPOINTMENTS
// =======================

// BOOK appointment
export const bookAppointment = (userId, petId, slotId) => {
  return api.post(`/appointments/book?userId=${userId}&petId=${petId}&slotId=${slotId}`);
};

// CANCEL appointment
export const cancelAppointment = (appointmentId, userId) => {
  return api.put(`/appointments/${appointmentId}/cancel?userId=${userId}`);
};

// RESCHEDULE appointment
export const rescheduleAppointment = (appointmentId, userId, newSlotId) => {
  return api.put(`/appointments/${appointmentId}/reschedule?userId=${userId}&newSlotId=${newSlotId}`);
};

// GET user upcoming appointments
export const getUserUpcomingAppointments = (userId) => {
  return api.get(`/appointments/user/${userId}/upcoming`);
};

// GET user completed appointments
export const getUserCompletedAppointments = (userId) => {
  return api.get(`/appointments/user/${userId}/completed`);
};


// =======================
// APPOINTMENTS - ADMIN
// =======================

// GET all appointments (you need to create this endpoint in backend)
export const getAllAppointments = () => {
  return api.get("/appointments/admin/all");
};

// GET single appointment details
export const getAppointmentById = (id) => {
  return api.get(`/appointments/${id}`);
};

// GET appointments by status
export const getAppointmentsByStatus = (status) => {
  return api.get(`/appointments/status/${status}`);
};

// GET appointments by date range
export const getAppointmentsByDateRange = (startDate, endDate) => {
  return api.get(`/appointments/range?start=${startDate}&end=${endDate}`);
};

// GET appointment statistics
export const getAppointmentStats = () => {
  return api.get("/appointments/stats");
};

// =======================
// VETS & SLOTS (for booking)
// =======================

// GET all vets
// redecalred

// GET vet's available slots
export const getVetAvailableSlots = (vetId) => {
  return api.get(`/slots/vet/${vetId}/available`);
};

// =======================
// PAYMENT
// =======================

// CREATE payment (Razorpay order)
export const createPayment = (appointmentId) => {
  return api.post(`/payments/create?appointmentId=${appointmentId}`);
};

// MARK payment success
export const markPaymentSuccess = (paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature) => {
  const params = new URLSearchParams({
    paymentId: String(paymentId),
    razorpayPaymentId: String(razorpayPaymentId)
  });
  if (razorpayOrderId) params.append('razorpayOrderId', razorpayOrderId);
  if (razorpaySignature) params.append('razorpaySignature', razorpaySignature);
  return api.post(`/payments/success?${params.toString()}`);
};

// api.js - Add these endpoints for vet appointments

// ===== VET APPOINTMENTS =====
export const getVetUpcomingAppointments = (vetId) => {
  return api.get(`/appointments/vet/${vetId}/upcoming`);
};

export const getVetCompletedAppointments = (vetId) => {
  return api.get(`/appointments/vet/${vetId}/completed`);
};

export const approveAppointment = (appointmentId, vetId) => {
  return api.put(`/appointments/${appointmentId}/approve?vetId=${vetId}`);
};

export const rejectAppointment = (appointmentId, vetId) => {
  return api.put(`/appointments/${appointmentId}/reject?vetId=${vetId}`);
};

export const completeAppointment = (appointmentId, vetId) => {
  return api.put(`/appointments/${appointmentId}/complete?vetId=${vetId}`);
};

// ===== MEDICAL RECORDS =====
export const createMedicalRecord = (appointmentId, recordData) => {
  return api.post(`/medical-records/appointment/${appointmentId}`, recordData);
};

export const getMedicalRecordByAppointment = (appointmentId) => {
  return api.get(`/medical-records/appointment/${appointmentId}`);
};

export const updateMedicalRecord = (recordId, recordData) => {
  return api.patch(`/medical-records/${recordId}`, recordData);
};

// ===== PRESCRIPTIONS =====
export const addPrescription = (medicalRecordId, prescriptionData) => {
  return api.post(`/prescriptions/medical-record/${medicalRecordId}`, prescriptionData);
};

export const getPrescriptionsByMedicalRecord = (medicalRecordId) => {
  return api.get(`/prescriptions/medical-record/${medicalRecordId}`);
};

export const updatePrescription = (prescriptionId, prescriptionData) => {
  return api.patch(`/prescriptions/${prescriptionId}`, prescriptionData);
};

export const deletePrescription = (prescriptionId) => {
  return api.delete(`/prescriptions/${prescriptionId}`);
};

// ===== VACCINATIONS =====
export const addVaccination = (appointmentId, vetId, vaccinationData) => {
  return api.post(`/vaccinations/appointment/${appointmentId}?vetId=${vetId}`, vaccinationData);
};

export const getVaccinationsByPet = (petId) => {
  return api.get(`/vaccinations/pet/${petId}`);
};

export const deleteVaccination = (vaccinationId) => {
  return api.delete(`/vaccinations/${vaccinationId}`);
};

// ===== PET INFO =====
export const getPetDetails = (petId) => {
  return api.get(`/pets/${petId}`);
};

export const getPetMedicalHistory = (petId) => {
  return api.get(`/medical-records/pet/${petId}`);
};

// api.js - Add these endpoints

// ===== VACCINATIONS =====
export const getPetVaccinations = (petId) => {
  return api.get(`/vaccinations/pet/${petId}`);
};


export const updateVaccination = (vaccinationId, vaccinationData) => {
  return api.put(`/vaccinations/${vaccinationId}`, vaccinationData);
};


export const getVaccinationById = (vaccinationId) => {
  return api.get(`/vaccinations/${vaccinationId}`);
};

export const getVaccinationsByAppointment = (appointmentId) => {
  return api.get(`/vaccinations/appointment/${appointmentId}`);
};
// api.js - Add these endpoints

// ===== FEEDBACK =====
export const checkFeedbackExists = (appointmentId) => {
  return api.get(`/feedbacks/appointment/${appointmentId}/exists`);
};

export const getFeedbackByAppointment = (appointmentId) => {
  return api.get(`/feedbacks/appointment/${appointmentId}`);
};

export const submitFeedback = (appointmentId, userId, feedbackData) => {
  return api.post(`/feedbacks/appointment/${appointmentId}?userId=${userId}`, feedbackData);
};

export const getUserFeedbacks = (userId) => {
  return api.get(`/feedbacks/user/${userId}`);
};

// api.js - Add these endpoints

// ===== VET PATIENTS =====
export const getPatientsByVet = (vetId) => {
  return api.get(`/pets/vet/${vetId}`);
};

export const getPatientVisits = (vetId, petId) => {
  return api.get(`/appointments/vet/${vetId}/pet/${petId}/visits`);
};

export const getPatientSummary = (vetId, petId) => {
  return api.get(`/pets/vet/${vetId}/pet/${petId}/summary`);
};
export const getVetPrescriptionCount = (vetId) => {
  return api.get(`/prescriptions/${vetId}/prescriptions/count`);
};

// =======================
// PET MANAGEMENT (ADMIN)
// =======================


// Delete pet (requires petId and ownerId)
export const deletePet = (petId, ownerId) => {
  return api.delete(`/pets/${petId}/${ownerId}`);
};


// ===== PET DETAILS ===== (already exists: getPetDetails)

// =======================
// HELP SUPPORT - VET/USER
// =======================

// CREATE help query
export const createHelpQuery = (userId, message) => {
  return api.post(`/help-support/${userId}`, message, {
    headers: { 'Content-Type': 'application/json' }
  });
};

// UPDATE help query (only OPEN)
export const updateHelpQuery = (queryId, userId, message) => {
  return api.put(`/help-support/${queryId}/user/${userId}`, message, {
    headers: { 'Content-Type': 'application/json' }
  });
};

// DELETE help query (only OPEN)
export const deleteHelpQuery = (queryId, userId) => {
  return api.delete(`/help-support/${queryId}/user/${userId}`);
};

// GET user/vet's own queries
export const getUserHelpQueries = (userId) => {
  return api.get(`/help-support/user/${userId}`);
};
export const getPetAppointmentCount = (petId) => {
  return api.get(`/appointments/pet/${petId}/count`);
};





// =======================
// HELP SUPPORT - ADMIN
// =======================

// GET all queries (admin)
export const getAllHelpQueries = () => {
  return api.get('/help-support/admin');
};

// GET queries by type (OWNER/VET)
export const getHelpQueriesByType = (type) => {
  return api.get(`/help-support/admin/raised-by/${type}`);
};

// GET queries by status (OPEN/RESOLVED)
export const getHelpQueriesByStatus = (status) => {
  return api.get(`/help-support/admin/status/${status}`);
};

// RESOLVE query (admin)
export const resolveHelpQuery = (queryId, reply) => {
  return api.put(`/help-support/admin/${queryId}/resolve`, reply, {
    headers: { 'Content-Type': 'application/json' }
  });
};

// =======================
// PRODUCT MANAGEMENT (ADMIN)
// =======================

// GET all products
export const getAllProducts = () => {
  return api.get("/admin/products");
};

// GET single product
export const getProductById = (id) => {
  return api.get(`/admin/products/${id}`);
};

// CREATE product (with image upload)
export const createProduct = (productData) => {
  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('price', productData.price);
  formData.append('stock', productData.stock);
  formData.append('image', productData.image);
  
  return api.post("/admin/products", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// UPDATE product stock
export const updateProductStock = (id, stock) => {
  return api.put(`/admin/products/${id}/stock`, null, {
    params: { stock }
  });
};

// TOGGLE product active status
export const toggleProductActive = (id) => {
  return api.put(`/admin/products/${id}/toggle`);
};

// SOFT DELETE product
export const deleteProduct = (id) => {
  return api.delete(`/admin/products/${id}`);
};

// =======================
// PRODUCT SHOP (USER)
// =======================

// GET all ACTIVE products for shop
export const getActiveProducts = () => {
  return api.get("/admin/products/shop");
};

// =======================
// CART MANAGEMENT
// =======================

// GET user's cart
export const getCart = (userId) => {
  return api.get(`/cart?userId=${userId}`);
};

// ADD item to cart
export const addToCart = (userId, productId, quantity) => {
  return api.post(`/cart/add?userId=${userId}&productId=${productId}&quantity=${quantity}`);
};

// UPDATE cart item quantity
export const updateCartItem = (itemId, userId, quantity) => {
  return api.put(`/cart/item/${itemId}?userId=${userId}&quantity=${quantity}`);
};

// REMOVE item from cart
export const removeCartItem = (itemId, userId) => {
  return api.delete(`/cart/item/${itemId}?userId=${userId}`);
};

// =======================
// ORDERS
// =======================

// PLACE order
export const placeOrder = (userId) => {
  return api.post(`/orders?userId=${userId}`);
};

// GET user orders
export const getUserOrders = (userId) => {
  return api.get(`/orders/user/${userId}`);
};

// GET order details
export const getOrder = (orderId) => {
  return api.get(`/orders/${orderId}`);
};

// CANCEL order
export const cancelOrder = (orderId, userId) => {
  return api.put(`/orders/${orderId}/cancel?userId=${userId}`);
};

// =======================
// PAYMENT
// =======================

// CREATE order payment
export const createOrderPayment = (orderId) => {
  return api.post(`/payments/order/create?orderId=${orderId}`);
};

// Orders API functions

export const getOrderDetails = (orderId) => {
  return api.get(`/orders/${orderId}`);
};

// =======================
// ORDERS - ADMIN
// =======================

// ADMIN - Get all orders
export const getAllOrdersAdmin = () => {
  return api.get("/orders/admin/all");
};

// ADMIN - Update order status
export const updateOrderStatusAdmin = (orderId, status) => {
  return api.put(`/orders/admin/${orderId}/status?status=${status}`);
};

// =======================
// CHATBOT - AI ASSISTANT
// =======================

/**
 * Send a message to the chatbot
 * @param {string} message - User's message
 * @param {number} userId - Optional user ID for personalized responses
 * @param {number} petId - Optional pet ID for pet-specific queries
 */
export const sendChatMessage = (message, userId = null, petId = null) => {
  const payload = {
    message: message,
    userId: userId,
    petId: petId
  };
  
  return api.post('/api/chatbot/ask', payload);
};

/**
 * Get user context for chatbot personalization
 * @param {number} userId - User ID
 */
export const getChatbotContext = (userId) => {
  return api.get(`/api/chatbot/context/${userId}`);
};

/**
 * Get chatbot suggestions for a specific user
 * @param {number} userId - User ID
 */
export const getChatbotSuggestions = (userId) => {
  return api.get(`/api/chatbot/suggestions/${userId}`);
};

/**
 * Get public platform statistics (no login required)
 */
export const getPublicPlatformStats = () => {
  return api.get('/api/chatbot/stats/public');
};


export default api;
