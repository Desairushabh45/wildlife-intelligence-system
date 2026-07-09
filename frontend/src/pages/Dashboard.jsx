import { Leaf, MapPinned, Radar } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ sites: 0, surveys: 0 });

  useEffect(() => {
    async function loadStats() {
      const [sitesResponse, surveysResponse] = await Promise.all([
        api.get("/api/sites/"),
        api.get("/api/surveys/"),
      ]);
      setStats({
        sites: sitesResponse.data.length,
        surveys: surveysResponse.data.length,
      });
    }
    loadStats().catch(() => setStats({ sites: 0, surveys: 0 }));
  }, []);

  const cards = [
    { label: "Total Sites", value: stats.sites, icon: MapPinned, tone: "bg-moss text-canopy" },
    { label: "Total Surveys", value: stats.surveys, icon: Radar, tone: "bg-[#f5e8cd] text-[#8c5b10]" },
    { label: "Species Count", value: "Pending", icon: Leaf, tone: "bg-slate-100 text-slate-700" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Welcome, {user?.full_name}</h1>
          <p className="mt-1 text-sm capitalize text-slate-600">{user?.role?.replaceAll("_", " ")}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded bg-canopy px-4 py-2 text-sm font-semibold text-white hover:bg-[#185a44]" to="/sites">
            Sites
          </Link>
          <Link className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white" to="/surveys">
            Surveys
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded ${tone}`}>
              <Icon size={20} aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Dashboard;
