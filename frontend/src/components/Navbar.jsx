import { LogOut, Leaf, Menu, Search, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const navLinks = [
  { path: "/", label: "Dashboard" },
  { path: "/sites", label: "Sites" },
  { path: "/surveys", label: "Surveys" },
  { path: "/observations", label: "Observations" },
  { path: "/species", label: "Species" },
];

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new FormData(e.target).get("q");
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-canopy text-white transition-transform group-hover:scale-105">
                <Leaf size={20} aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight text-ink dark:text-white">WildLife OS</span>
            </Link>

            <div className="hidden md:flex md:gap-1">
              {navLinks.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-moss text-canopy dark:bg-canopy/20 dark:text-emerald-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 md:flex-none">
            <form onSubmit={handleSearch} className="relative hidden w-full max-w-xs md:block">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                name="q"
                type="text"
                placeholder="Global search..."
                defaultValue={new URLSearchParams(location.search).get("q") || ""}
                className="h-9 w-full rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 text-sm text-ink dark:text-white outline-none transition-all focus:border-canopy dark:focus:border-canopy focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-canopy/20"
              />
            </form>

            <div className="hidden items-center gap-3 md:flex">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full p-2 text-slate-400 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode"
                title="Toggle dark mode"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-canopy dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Profile">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            <form onSubmit={handleSearch} className="relative mb-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                name="q"
                type="text"
                placeholder="Search..."
                defaultValue={new URLSearchParams(location.search).get("q") || ""}
                className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 text-sm text-ink dark:text-white outline-none focus:border-canopy"
              />
            </form>
            {navLinks.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-base font-medium ${
                    isActive ? "bg-moss text-canopy dark:bg-canopy/20 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              My Profile
            </Link>
            <button
              type="button"
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
