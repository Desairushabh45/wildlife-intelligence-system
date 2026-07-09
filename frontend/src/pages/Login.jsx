import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "../assets/field-monitoring.png";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.95fr]">
      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-canopy">Wildlife Population Intelligence System</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Sign in</h1>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="mt-2 flex h-11 items-center gap-2 rounded border border-slate-300 px-3 focus-within:border-canopy">
                <Mail size={17} className="text-slate-400" aria-hidden="true" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="mt-2 flex h-11 items-center gap-2 rounded border border-slate-300 px-3 focus-within:border-canopy">
                <Lock size={17} className="text-slate-400" aria-hidden="true" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </div>
            </label>
            {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded bg-canopy px-4 text-sm font-semibold text-white hover:bg-[#185a44] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-5 text-sm text-slate-600">
            Need an account?{" "}
            <Link className="font-semibold text-canopy hover:underline" to="/register">
              Register
            </Link>
          </p>
        </div>
      </section>
      <section className="hidden min-h-screen bg-slate-900 lg:block">
        <img className="h-full w-full object-cover" src={heroImage} alt="Forest monitoring camera trap" />
      </section>
    </main>
  );
}

export default Login;
