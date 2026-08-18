import { BadgeCheck, Lock, Mail, User, Leaf } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axiosInstance.js";
import heroImage from "../assets/field-monitoring.png";

const FALLBACK_FOREST_BG = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200";

const roles = [
  ["wildlife_researcher", "Wildlife Researcher"],
  ["conservation_officer", "Conservation Officer"],
  ["forest_department_officer", "Forest Department Officer"],
  ["administrator", "Administrator"],
];

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "wildlife_researcher",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bgImage = heroImage || FALLBACK_FOREST_BG;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setSubmitting(false);
    }
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

        {/* Glassmorphic Register Card */}
        <div
          className="relative z-10 w-full max-w-[420px] rounded-[20px] p-8 text-white transition-all"
          style={{
            background: "rgba(15, 25, 15, 0.55)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(45, 138, 78, 0.15), 0 0 40px rgba(45, 138, 78, 0.08)",
          }}
        >
          {/* Logo/Icon Header */}
          <div className="mb-5 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-emerald-300 shadow-lg"
              style={{
                background: "rgba(45, 138, 78, 0.25)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
              }}
            >
              <Leaf size={28} />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">Create Account</h1>

            <p className="mt-1.5 text-xs text-white/70 font-medium">
              Join the Wildlife Monitoring and Conservation Platform
            </p>
          </div>

          {/* Registration Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {/* 1. Full Name */}
            <div className="space-y-1">
              <label
                htmlFor="full_name"
                className="block uppercase"
                style={{
                  color: "rgba(255, 255, 255, 0.55)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                FULL NAME
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  <User size={18} aria-hidden="true" />
                </div>
                <input
                  id="full_name"
                  type="text"
                  placeholder="Your full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[rgba(255,255,255,0.45)] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                />
              </div>
            </div>

            {/* 2. Email Address */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block uppercase"
                style={{
                  color: "rgba(255, 255, 255, 0.55)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  <Mail size={18} aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@organization.org"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[rgba(255,255,255,0.45)] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                />
              </div>
            </div>

            {/* 3. Password */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block uppercase"
                style={{
                  color: "rgba(255, 255, 255, 0.55)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
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
                  type="password"
                  placeholder="••••••••"
                  minLength="6"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[rgba(255,255,255,0.45)] outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                />
              </div>
            </div>

            {/* 4. Role Selector Dropdown */}
            <div className="space-y-1">
              <label
                htmlFor="role"
                className="block uppercase"
                style={{
                  color: "rgba(255, 255, 255, 0.55)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                ROLE
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                  <BadgeCheck size={18} aria-hidden="true" />
                </div>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 cursor-pointer"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "white",
                  }}
                >
                  {roles.map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#142819] text-white py-1">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-900/40 p-2.5 text-xs font-semibold text-red-200 backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)",
              }}
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Bottom Link */}
          <p className="mt-5 text-center text-xs text-white/70">
            Already have an account?{" "}
            <Link className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors ml-1" to="/login">
              Sign In
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </section>
    </main>
  );
}

export default Register;
