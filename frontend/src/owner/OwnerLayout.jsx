import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  PawPrint,
  HeartPulse,
  Calendar,
  ShoppingBag,
  ShoppingCart,
  Package,
  User,
  LogOut,
  Menu,
  Bell,
  Hospital, Pill,
  HelpCircle,
  HandshakeIcon,
} from "lucide-react";

const mainMenu = [
  { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "" },
  { name: "Pet Profiles", icon: <PawPrint size={18} />, path: "pets" },
  { name: "Health Monitoring", icon: <HeartPulse size={18} />, path: "health" },
  { name: "Appointments", icon: <Calendar size={18} />, path: "appointments" },
  { name: "Shop", icon: <ShoppingBag size={18} />, path: "shop" },
  { name: "Cart", icon: <ShoppingCart size={18} />, path: "cart" },
  { name: "Orders", icon: <Package size={18} />, path: "orders" },
  { name: "Vaccinations", icon: <Hospital size={18} />, path: "vaccinations" },
  { name: "Prescriptions", icon: <Pill size={18} />, path: "prescriptions" },
];

const accountMenu = [
  { name: "Get Help", icon: <HandshakeIcon size={18} />, path: "help" },
  { name: "Profile", icon: <User size={18} />, path: "profile" },
];

export default function OwnerLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - EXACTLY like AdminLayout */}
      <div
        className={`${
          open ? "w-64" : "w-20"
        } bg-white flex flex-col transition-all duration-300 fixed top-0 left-0 h-full z-10`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
          {open && <h1 className="text-xl font-bold text-violet-600">PetCare</h1>}
          <button onClick={() => setOpen(!open)} className="flex-shrink-0">
            <Menu size={20} />
          </button>
        </div>

        {/* Menu - with scrollbar */}
        <div className="flex- overflow-y-auto p-3">
          <p className={`text-xs text-gray-400 px-3 mb-2 ${!open && "hidden"}`}>MAIN MENU</p>
          
          <div className="space-y-1 mb-6">
            {mainMenu.map((item, i) => (
              <NavLink
                key={i}
                to={`/dashboard/owner/${item.path}`}
                end
                className={({ isActive }) =>
                  `flex items-center ${open ? "justify-start" : "justify-center"} gap-3 ${open ? "px-4" : "px-3"} py-3 rounded-lg text-sm font-medium transition w-full
                  ${
                    isActive
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {item.icon}
                {open && <span className="whitespace-nowrap">{item.name}</span>}
              </NavLink>
            ))}
          </div>

          <p className={`text-xs text-gray-400 px-3 mb-2 ${!open && "hidden"}`}>ACCOUNT</p>
          
          <div className="space-y-1">
            {accountMenu.map((item, i) => (
              <NavLink
                key={i}
                to={`/dashboard/owner/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center ${open ? "justify-start" : "justify-center"} gap-3 ${open ? "px-4" : "px-3"} py-3 rounded-lg text-sm font-medium transition w-full
                  ${
                    isActive
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {item.icon}
                {open && <span className="whitespace-nowrap">{item.name}</span>}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={logout}
            className={`flex items-center ${open ? "justify-start" : "justify-center"} gap-3 ${open ? "px-4" : "px-3"} py-3 text-sm w-full rounded-lg text-red-500 hover:bg-red-50`}
          >
            <LogOut size={18} />
            {open && "Logout"}
          </button>
        </div>
      </div>

      {/* Right side - EXACTLY like AdminLayout */}
      <div className={`flex flex-col flex-1 h-full transition-all duration-300 ${open ? "ml-64" : "ml-20"}`}>
        {/* Top bar */}
        <div className="h-16 bg-white flex items-center justify-between px-6 sticky top-0 z-0 shrink-0">
          <h2 className="font-semibold text-gray-700">Owner Portal</h2>

          <div className="flex items-center gap-4">
            <Bell className="text-gray-500" />
            <ShoppingCart className="text-gray-500" />
            <div className="w-9 h-9 bg-violet-200 rounded-full flex items-center justify-center font-bold text-violet-700">
              O
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}