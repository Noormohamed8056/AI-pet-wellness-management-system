import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";

import CheckEmail from "./components/CheckEmail";
import VetProfileCreate from "./components/VetProfileCreate";
import VetPending from "./components/VetPending";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// ADMIN
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import VetRequests from "./admin/pages/VetRequests";
import VetManagement from "./admin/pages/VetManagement";
import OwnerManagement from "./admin/pages/OwnerManagement";
import AdminPets from "./admin/pages/Pets";
import Appointments from "./admin/pages/Appointments";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";

// OWNER
import OwnerLayout from "./owner/OwnerLayout";

import OwnerDashboard from "./owner/pages/Dashboard";
import OwnerPets from "./owner/pages/Pets";
import OwnerHealth from "./owner/pages/Health";
import OwnerAppointments from "./owner/pages/Appointments";
import OwnerShop from "./owner/pages/Shop";
import OwnerCart from "./owner/pages/Cart";
import OwnerOrders from "./owner/pages/Orders";
import OwnerMessages from "./owner/pages/Messages";
import OwnerProfile from "./owner/pages/Profile";
import OwnerSettings from "./owner/pages/Settings";

// VET
import VetLayout from "./vet/VetLayout";
import VetDash from "./vet/pages/Dashboard";
import VetAppointments from "./vet/pages/Appointments";
import VetPatients from "./vet/pages/Patients";
import VetPrescriptions from "./vet/pages/Prescriptions";
import VetAvailability from "./vet/pages/Availability";
import VetProfile from "./vet/pages/Profile";
import VetSettings from "./vet/pages/Settings";
import Messages from "./owner/pages/Messages";
import Health from "./vet/pages/Health";
import MedicalRecords from "./vet/pages/MedicalRecords";
import Vaccination from "./owner/pages/Vaccination";
import Payment from "./owner/pages/Payment";
import Prescription from "./owner/pages/Prescription";
import OwnerHelp from "./owner/pages/OwnerHelp";
import VetHelp from "./vet/pages/VetHelp";
import AdminSupport from "./admin/pages/AdminSupport";
import OrdersManagement from "./admin/pages/OrdersManagement";
import Marketplace from "./admin/pages/Marketplace";
import ChatbotWidget from "./components/ChatbotWidget";
import Pets from "./admin/pages/Pets";

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable 
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/vet/profile/create" element={<VetProfileCreate />} />
        <Route path="/vet/pending" element={<VetPending />} />

      {/*  ADMIN */}
        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="requests" element={<VetRequests />} />
          <Route path="vets" element={<VetManagement />} />
          <Route path="owners" element={<OwnerManagement />} />
          <Route path="pets" element={<Pets />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<AdminSupport />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="marketplace" element={<Marketplace />} />
        </Route>

        {/* OWNER */}
        <Route path="/dashboard/owner" element={<OwnerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="pets" element={<OwnerPets />} />
          <Route path="health" element={<OwnerHealth />} />
          <Route path="appointments" element={<OwnerAppointments />} />
          <Route path="shop" element={<OwnerShop />} />
          <Route path="cart" element={<OwnerCart />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="messages" element={<OwnerMessages />} />
          <Route path="profile" element={<OwnerProfile />} />
          <Route path="vaccinations" element={<Vaccination />} />
          <Route path="payments" element={<Payment />} />
          <Route path="prescriptions" element={<Prescription />} />
          <Route path="settings" element={<OwnerSettings />} />
          <Route path="help" element={<OwnerHelp />} />
        </Route>

        <Route path="/shop" element={<Navigate to="/dashboard/owner/shop" replace />} />
        <Route path="/orders" element={<Navigate to="/dashboard/owner/orders" replace />} />

        {/* VET */}
        <Route path="/dashboard/vet" element={<VetLayout />}>
          <Route index element={<VetDash />} />
          <Route path="appointments" element={<VetAppointments />} />
          <Route path="patients" element={<VetPatients />} />
          <Route path="prescriptions" element={<VetPrescriptions />} />
          <Route path="availability" element={<VetAvailability />} />
          <Route path="profile" element={<VetProfile />} />
          <Route path="settings" element={<VetSettings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="health" element={<Health />} />
          <Route path="medicalRecords" element={<MedicalRecords />} />
          <Route path="help" element={<VetHelp />} />
        </Route>


        <Route path="*" element={<h2>404</h2>} />

      </Routes>
      <ChatbotWidget />
    </Router>
  );
}

export default App;
