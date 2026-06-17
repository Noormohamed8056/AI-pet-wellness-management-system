import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  PawPrint,
  Calendar,
  BarChart2,
  LogOut,
  Menu,
  HelpingHand,
  ShoppingBasket,
  ListOrderedIcon,
  ShoppingBag
} from "lucide-react";

const AdminLayout = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} />, path: "" },
    { name: "Vet Requests", icon: <UserCheck size={18} />, path: "requests" },
    { name: "Vet Management", icon: <Users size={18} />, path: "vets" },
    { name: "Pet Owners", icon: <Users size={18} />, path: "owners" },
    { name: "Marketplace", icon: <ShoppingBag size={18} />, path: "marketplace" },
    { name: "Orders Management", icon: <ListOrderedIcon size={18} />, path: "orders" },
    { name: "HelpSupport", icon: <HelpingHand size={18} />, path: "help" },
    { name: "Pets", icon: <PawPrint size={18} />, path: "pets" },
    { name: "Appointments", icon: <Calendar size={18} />, path: "appointments" },
    { name: "Reports", icon: <BarChart2 size={18} />, path: "reports" }
  ];

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          open ? "w-64" : "w-20"
        } bg-white flex flex-col transition-all duration-300 fixed top-0 left-0 h-full z-10 shadow-lg`}
      >
        {/* Logo - no border */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 bg-violet-50">
          {open && (
            <h1 className="text-xl font-bold text-violet-600">PetCare</h1>
          )}
          <button 
            onClick={() => setOpen(!open)} 
            className="flex-shrink-0 p-1 rounded hover:bg-violet-100"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Menu - ALWAYS left aligned, even when collapsed */}
        <nav className="flex-1 flex flex-col p-3 space-y overflow-y-auto">
          {menu.map((item, i) => (
            <NavLink
              key={i}
              to={`/dashboard/admin/${item.path}`}
              end
              className={({ isActive }) =>
                `flex items-center ${open ? "pl-4 pr-4" : "pl-3 pr-3"} py-3 rounded-lg text-sm font-medium transition w-full
                ${
                  isActive
                    ? "bg-violet-100 text-violet-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              {open && <span className="whitespace-nowrap ml-3">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout - ALWAYS left aligned */}
        <div className="p-3">
          <button
            onClick={logout}
            className={`flex items-center ${open ? "pl-4 pr-4" : "pl-3 pr-3"} py-3 text-sm w-full rounded-lg text-red-500 hover:bg-red-50`}
          >
            <LogOut size={18} />
            {open && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Right side (Topbar + Pages) */}
      <div className={`flex flex-col flex-1 h-full transition-all duration-300 ${open ? "ml-64" : "ml-20"}`}>
        {/* Top bar */}
        <div className="h-16 bg-violet-50 flex items-center justify-between px-6 sticky top-0 z-0 shrink-0">
          <h2 className="font-semibold text-gray-700">Admin Panel</h2>
          <div className="w-9 h-9 bg-violet-200 rounded-full flex items-center justify-center font-bold text-violet-700">
            A
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
export default AdminLayout;
