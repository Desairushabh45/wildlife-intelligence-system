import { BadgeCheck, Lock, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/axiosInstance.js";
import heroImage from "../assets/field-monitoring.png";

const roles = [
  ["wildlife_researcher", "Wildlife researcher"],
  ["conservation_officer", "Conservation officer"],
  ["forest_department_officer", "Forest department officer"],
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
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.95fr_1fr]">
      <section className="hidden min-h-screen bg-slate-900 lg:block">
        <img className="h-full w-full object-cover" src={heroImage} alt="Forest monitoring camera trap" />
      </section>
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-canopy">Wildlife Population Intelligence System</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Register</h1>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <FormField icon={UserRound} label="Full name">
              <input className="field-input" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required />
            </FormField>
            <FormField icon={Mail} label="Email">
              <input className="field-input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </FormField>
            <FormField icon={Lock} label="Password">
              <input className="field-input" type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            </FormField>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <div className="mt-2 flex h-11 items-center gap-2 rounded border border-slate-300 px-3 focus-within:border-canopy">
                <BadgeCheck size={17} className="text-slate-400" aria-hidden="true" />
                <select className="w-full bg-transparent text-sm outline-none" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  {roles.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="h-11 w-full rounded bg-canopy px-4 text-sm font-semibold text-white hover:bg-[#185a44] disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? "Creating..." : "Create account"}
            </button>
          </form>
          <p className="mt-5 text-sm text-slate-600">
            Already registered?{" "}
            <Link className="font-semibold text-canopy hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function FormField({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex h-11 items-center gap-2 rounded border border-slate-300 px-3 focus-within:border-canopy">
        <Icon size={17} className="text-slate-400" aria-hidden="true" />
        {children}
      </div>
    </label>
  );
}

export default Register;
