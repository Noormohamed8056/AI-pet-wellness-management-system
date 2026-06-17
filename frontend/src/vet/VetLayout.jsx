import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  PawPrint,
  FileText,
  Clock,
  User,
  LogOut,
  Menu,
  Bell,
  ScanHeart,
  Library,
  HeartHandshakeIcon,
} from "lucide-react";

const mainMenu = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "" },
  { name: "Appointments", icon: <Calendar size={18} />, path: "appointments" },
  { name: "Patients", icon: <PawPrint size={18} />, path: "patients" },
  { name: "Prescriptions", icon: <FileText size={18} />, path: "prescriptions" },
  { name: "Availability", icon: <Clock size={18} />, path: "availability" },
  { name: "Health Analytics", icon: <ScanHeart size={18} />, path: "health" },
  { name: "Medical Records", icon: <Library size={18} />, path: "medicalRecords" },
];

const accountMenu = [
  { name: "Get Help", icon: <HeartHandshakeIcon size={18} />, path: "help" },
  { name: "Profile", icon: <User size={18} />, path: "profile" },
 
];

export default function VetLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen">

      {/* Sidebar */}
      <div className={`${open ? "w-64" : "w-20"} bg-white fixed left-0 top-0 h-full z-10 transition-all flex flex-col`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {open && <h1 className="font-bold text-violet-600">PetCare</h1>}
          <button onClick={() => setOpen(!open)}>
            <Menu size={20} />
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className={`text-xs text-gray-400 px- mb-2 ${!open && "hidden"}`}>MAIN MENU</p>

          <div className="space-y-2 mb-6">
            {mainMenu.map((item, i) => (
              <NavLink
                key={i}
                to={`/dashboard/vet/${item.path}`}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 ${open ? "px-4" : "justify-center px-3"} py-3 rounded-lg text-sm font-medium transition
                  ${isActive ? "bg-violet-100 text-violet-700" : "text-gray-600 hover:bg-gray-100"}`
                }
              >
                {item.icon}
                {open && item.name}
              </NavLink>
            ))}
          </div>

          <p className={`text-xs text-gray-400 px-3 mb-2 ${!open && "hidden"}`}>ACCOUNT</p>

          <div className="space-y-1">
            {accountMenu.map((item, i) => (
              <NavLink
                key={i}
                to={`/dashboard/vet/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 ${open ? "px-4" : "justify-center px-3"} py-3 rounded-lg text-sm font-medium transition
                  ${isActive ? "bg-violet-100 text-violet-700" : "text-gray-600 hover:bg-gray-100"}`
                }
              >
                {item.icon}
                {open && item.name}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={logout}
            className={`flex items-center gap-3 ${open ? "px-4" : "justify-center px-3"} py-3 w-full rounded-lg text-red-500 hover:bg-red-50`}
          >
            <LogOut size={18} />
            {open && "Logout"}
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className={`flex flex-col flex-1 transition-all ${open ? "ml-64" : "ml-20"}`}>
        {/* Topbar */}
        <div className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h2 className="font-semibold text-gray-700">Vet Portal</h2>
          <div className="flex items-center gap-4">
            <Bell className="text-gray-500" />
            <div className="w-9 h-9 bg-violet-200 rounded-full flex items-center justify-center font-bold text-violet-700">
              V
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
