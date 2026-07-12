import { Lock, Mail, Leaf } from "lucide-react";
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
    <main className="grid min-h-screen bg-[#f7f8f4] dark:bg-slate-950 lg:grid-cols-2">
      <section className="flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px] rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-moss dark:bg-canopy/20 text-canopy dark:text-emerald-400">
              <Leaf size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">Sign In</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              AI-powered wildlife monitoring and conservation
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-ink dark:text-white" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail size={18} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-10 pr-4 text-sm text-ink dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-canopy dark:focus:border-canopy focus:ring-2 focus:ring-canopy/20"
                  type="email"
                  placeholder="name@organization.org"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-ink dark:text-white" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock size={18} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 pl-10 pr-4 text-sm text-ink dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-canopy dark:focus:border-canopy focus:ring-2 focus:ring-canopy/20"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-canopy py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#185a44] focus:outline-none focus:ring-2 focus:ring-canopy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{" "}
            <Link className="font-semibold text-canopy dark:text-emerald-400 hover:underline" to="/register">
              Register
            </Link>
          </p>
        </div>
      </section>
      
      <section className="relative hidden min-h-screen bg-slate-900 lg:block">
        <div className="absolute inset-0 bg-ink/10 mix-blend-multiply"></div>
        <img className="h-full w-full object-cover" src={heroImage} alt="Forest monitoring camera trap" />
      </section>
    </main>
  );
}

export default Login;
