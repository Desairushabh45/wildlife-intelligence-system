import { Lock, Mail, Leaf, Eye, EyeOff, Sparkles, Shield, Compass, Trees, UserCog } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "../assets/field-monitoring.png";
import { useAuth } from "../context/AuthContext.jsx";

const FALLBACK_FOREST_BG = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200";

const DEMO_ACCOUNTS = [
  {
    role: "Researcher",
    email: "priya@wildlife.com",
    name: "Dr. Priya Sharma",
    icon: Compass,
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300",
  },
  {
    role: "Officer",
    email: "rajan@wildlife.com",
    name: "Rajan Mehta",
    icon: Shield,
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300",
  },
  {
    role: "Forest Dept",
    email: "suresh@wildlife.com",
    name: "Suresh Kumar",
    icon: Trees,
    color: "from-amber-500/20 to-emerald-500/20 border-amber-500/30 text-amber-300",
  },
  {
    role: "Admin",
    email: "admin@wildlife.com",
    name: "Admin User",
    icon: UserCog,
    color: "from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-300",
  },
];

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "priya@wildlife.com", password: "wildlife123" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bgImage = heroImage || FALLBACK_FOREST_BG;

  async function handleLoginWithCredentials(email, password) {
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError("Backend server is unreachable. Please verify the backend service is running on port 8000.");
      } else {
        setError(err.response?.data?.detail || "Invalid email or password");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await handleLoginWithCredentials(form.email, form.password);
  }

  function handleFillDemo(account) {
    setForm({ email: account.email, password: "wildlife123" });
    setError("");
  }

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      {/* LEFT HALF: Glassmorphic Card over Dark Blurred Forest Background */}
      <section className="relative flex min-h-screen items-center justify-center p-6 lg:p-12 overflow-hidden">
        {/* Dark Blurred Forest Background */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{
            backgroundImage: `url(${bgImage})`,
            filter: "blur(10px) brightness(0.25) saturate(0.8)",
          }}
        />

        {/* Glassmorphic Login Card */}
        <div
          className="relative z-10 w-full max-w-[420px] rounded-[24px] p-8 text-white transition-all shadow-2xl"
          style={{
            background: "rgba(15, 25, 18, 0.7)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(45, 138, 78, 0.2), 0 0 40px rgba(45, 138, 78, 0.12)",
          }}
        >
          {/* Logo / Icon */}
          <div className="mb-5 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-emerald-300 shadow-lg shadow-emerald-950/50"
              style={{
                background: "linear-gradient(135deg, rgba(45, 138, 78, 0.35) 0%, rgba(16, 185, 129, 0.2) 100%)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
              }}
            >
              <Leaf size={28} className="text-emerald-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Sign In</h1>

            {/* Subtitle */}
            <p className="mt-1 text-xs text-white/70 font-medium">
              Wildlife Intelligence & Conservation Platform
            </p>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                <Sparkles size={13} /> Quick Demo Accounts
              </span>
              <span className="text-[10px] text-white/50">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = form.email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleFillDemo(acc)}
                    className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-all border ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-400/50 text-white shadow-sm ring-1 ring-emerald-400/40"
                        : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10 text-emerald-300">
                      <Icon size={14} />
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] font-semibold leading-tight">{acc.role}</p>
                      <p className="text-[9px] text-white/60 truncate">{acc.email.split("@")[0]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block uppercase"
                style={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                EMAIL ADDRESS / USERNAME
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  <Mail size={18} aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="text"
                  placeholder="name@organization.org"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[rgba(255,255,255,0.4)] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block uppercase"
                style={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                PASSWORD
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  <Lock size={18} aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-[rgba(255,255,255,0.4)] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-950/60 p-3 text-xs font-medium text-red-200 backdrop-blur-sm shadow-inner">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
              }}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Bottom Register Link */}
          <p className="mt-5 text-center text-xs text-white/70">
            Don't have an account?{" "}
            <Link className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors ml-1" to="/register">
              Register
            </Link>
          </p>
        </div>
      </section>

      {/* RIGHT HALF: Full Height Natural Forest Scene */}
      <section className="relative hidden min-h-screen bg-slate-900 lg:block">
        <img
          className="h-full w-full object-cover"
          src={bgImage}
          alt="Natural forest scene"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      </section>
    </main>
  );
}

export default Login;
