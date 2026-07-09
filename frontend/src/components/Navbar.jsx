import { BarChart3, LogOut, MapPinned, Radar } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/sites", label: "Sites", icon: MapPinned },
  { to: "/surveys", label: "Surveys", icon: Radar },
];

function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-canopy text-white">
            <Radar size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">Wildlife Intelligence</p>
            <p className="text-xs text-slate-500">{user?.role?.replaceAll("_", " ")}</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-moss text-ink"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                }`
              }
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink"
          >
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
