import { AlertTriangle, Binoculars, MapPinned, Radar, Shield, Leaf, Activity, ShieldAlert, ChevronRight, BarChart3, Bell, Server, Cpu, FileText, Map, UserCheck, Clock } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";

const CHART_COLORS = ['#1f6f54', '#d99722', '#64748b', '#0f172a', '#10b981', '#3b82f6'];

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ sites: [], surveys: [], species: [] });
  const [healthScores, setHealthScores] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [topSpecies, setTopSpecies] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [gisDetections, setGisDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sitesRes, surveysRes, speciesRes, recsRes, sysRes, gisRes] = await Promise.all([
          api.get("/api/sites/").catch(() => ({ data: [] })),
          api.get("/api/surveys/").catch(() => ({ data: [] })),
          api.get("/api/species/").catch(() => ({ data: [] })),
          api.get("/api/conservation/recommendations/all").catch(() => ({ data: [] })),
          api.get("/api/system/health").catch(() => ({ data: null })),
          api.get("/api/gis/detections").catch(() => ({ data: [] })),
        ]);

        const sites = sitesRes.data || [];
        setData({
          sites,
          surveys: surveysRes.data || [],
          species: speciesRes.data || [],
        });
        setRecommendations(recsRes.data || []);
        setSystemHealth(sysRes.data);
        setGisDetections(gisRes.data || []);

        // Fetch health score & population summary for each site
        const speciesCountMap = {};
        const healthList = await Promise.all(
          sites.map(async (site) => {
            try {
              const [hRes, pRes] = await Promise.all([
                api.get(`/api/habitat/site/${site.id}/score`),
                api.get(`/api/population/site/${site.id}/summary`),
              ]);

              const popList = pRes.data?.species_population || [];
              popList.forEach((sp) => {
                const name = sp.species_name;
                const count = sp.detection_count || 0;
                if (!speciesCountMap[name]) {
                  speciesCountMap[name] = {
                    name,
                    scientific: sp.scientific_name,
                    is_endangered: sp.is_endangered,
                    count: 0,
                  };
                }
                speciesCountMap[name].count += count;
              });

              return {
                site_id: site.id,
                site_name: site.name,
                health_score: hRes.data.habitat_score,
                conservation_status: hRes.data.classification,
                badge_class: hRes.data.bg_class,
              };
            } catch {
              return { site_id: site.id, site_name: site.name, health_score: 0.0, conservation_status: "Critical", badge_class: "bg-red-100 text-red-800" };
            }
          })
        );
        setHealthScores(healthList);

        const sortedTop = Object.values(speciesCountMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setTopSpecies(sortedTop);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <LoadingSkeleton type="card" />
      </main>
    );
  }

  const criticalCount = recommendations.filter((r) => r.priority === "critical" || r.priority === "urgent").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink dark:text-white">Welcome, {user?.full_name}</h1>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold px-3 py-1 uppercase tracking-wider">
              {user?.role?.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time ecosystem health, active alerts, and GIS population intelligence.
          </p>
        </div>

        <Link
          to="/conservation"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors shrink-0"
        >
          <Bell size={18} className="text-amber-500 animate-bounce" />
          <span>Active Alerts ({recommendations.length})</span>
          <ChevronRight size={16} />
        </Link>
      </section>

      {/* Ecosystem Health Overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" />
            Ecosystem Habitat Index Overview
          </h2>
          <Link to="/sites" className="text-xs font-bold text-canopy dark:text-emerald-400 hover:underline">
            View All Sites →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {healthScores.map((h) => (
            <Card key={h.site_id} className="flex flex-col justify-between p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-ink dark:text-white text-sm line-clamp-1">{h.site_name}</h3>
                  <p className="text-xs text-slate-400">Site Ecosystem Index</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${h.badge_class}`}>
                  {h.conservation_status}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-ink dark:text-white">{h.health_score}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, h.health_score)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Active Alerts Banner Card */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400 shrink-0">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {criticalCount} Critical / Urgent
                </span>
                <span className="text-xs text-slate-400">{recommendations.length} total active conservation rules</span>
              </div>
              <p className="text-lg font-bold mt-1 text-white">
                {recommendations[0]?.message}
              </p>
            </div>
          </div>

          <Link
            to="/conservation"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors shrink-0 shadow-lg"
          >
            Review All Alerts
            <ChevronRight size={16} />
          </Link>
        </Card>
      )}

      {/* Role-Specific Dashboards */}
      {user?.role === "administrator" && (
        <AdminDashboard data={data} systemHealth={systemHealth} />
      )}
      {user?.role === "wildlife_researcher" && (
        <ResearcherDashboard data={data} topSpecies={topSpecies} />
      )}
      {user?.role === "conservation_officer" && (
        <ConservationDashboard data={data} recommendations={recommendations} />
      )}
      {user?.role === "forest_department_officer" && (
        <ForestDeptDashboard data={data} detections={gisDetections} />
      )}
    </main>
  );
}

function StatCard({ label, value, icon: Icon, tone, trend }) {
  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={24} aria-hidden="true" />
        </div>
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Activity size={12} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-4xl font-bold text-ink dark:text-white tracking-tight">{value}</p>
      </div>
    </Card>
  );
}

function AdminDashboard({ data, systemHealth }) {
  const cards = [
    { label: "Total Sites", value: data.sites.length, icon: MapPinned, tone: "bg-moss dark:bg-canopy/20 text-canopy dark:text-emerald-400", trend: "+12%" },
    { label: "Total Surveys", value: data.surveys.length, icon: Radar, tone: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", trend: "+5%" },
    { label: "Total Species", value: data.species.length, icon: Leaf, tone: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </section>

      {/* System Health Overview Card */}
      <Card noPadding className="border-2 border-emerald-500/20">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="text-emerald-500" size={20} />
            <h2 className="text-lg font-semibold text-ink dark:text-white">System Infrastructure Health (/api/system/health)</h2>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {systemHealth?.status || "OK"}
          </span>
        </div>
        <div className="p-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
            <p className="text-xs font-semibold text-slate-400 uppercase">PostgreSQL Database</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 capitalize">
              {systemHealth?.database || "Connected"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
            <p className="text-xs font-semibold text-slate-400 uppercase">MongoDB Metadata Store</p>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-300 mt-1 capitalize">
              {systemHealth?.mongo || "Postgres Mode"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
            <p className="text-xs font-semibold text-slate-400 uppercase">System Uptime</p>
            <p className="text-lg font-bold text-ink dark:text-white mt-1 flex items-center gap-1.5">
              <Clock size={16} className="text-slate-400" />
              {systemHealth?.uptime_seconds ? `${Math.floor(systemHealth.uptime_seconds / 60)} min ${systemHealth.uptime_seconds % 60}s` : "Active"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ResearcherDashboard({ data, topSpecies }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Species Cataloged" value={data.species.length} icon={Leaf} tone="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" />
        <StatCard label="Total Expeditions" value={data.surveys.length} icon={Binoculars} tone="bg-moss dark:bg-canopy/20 text-canopy dark:text-emerald-400" />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card noPadding>
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-ink dark:text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-500" />
              Most Active Species
            </h2>
            <Link to="/population" className="text-xs font-bold text-emerald-600 hover:underline">Population Trends →</Link>
          </div>
          <div className="p-6 space-y-4">
            {topSpecies.map((sp, idx) => (
              <div key={sp.name} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                <div>
                  <p className="font-bold text-sm text-ink dark:text-white">{sp.name}</p>
                  <p className="text-xs italic text-slate-400">{sp.scientific}</p>
                </div>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full text-xs">
                  {sp.count} detections
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card noPadding>
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-ink dark:text-white flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              Research & Export System
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Export field survey PDF reports and raw detection datasets in Excel format.</p>
            <Link to="/reports" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 transition-colors">
              Access Reports & Export Center
              <ChevronRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ConservationDashboard({ data, recommendations }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Endangered Species" value={data.species.filter(s => s.is_endangered).length} icon={AlertTriangle} tone="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" />
        <StatCard label="Priority Action Rules" value={recommendations.length} icon={ShieldAlert} tone="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" />
      </section>

      <Card noPadding className="overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-ink dark:text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-500" />
            Top Priority Conservation Recommendations
          </h2>
          <Link to="/conservation" className="text-xs font-bold text-emerald-600 hover:underline">View All Recommendations →</Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recommendations.slice(0, 4).map(rec => (
            <div key={rec.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                rec.priority === "critical" ? "bg-red-600 text-white" :
                rec.priority === "urgent" ? "bg-red-100 text-red-700" :
                rec.priority === "high" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              }`}>
                {rec.priority}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">{rec.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">Site: {rec.site_name}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ForestDeptDashboard({ data, detections }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Protected Areas Monitored" value={new Set(data.sites.map(s => s.protected_area).filter(Boolean)).size} icon={Shield} tone="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" />
        <StatCard label="Recent Detection Events" value={detections.length} icon={Map} tone="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" />
      </section>

      <Card noPadding className="overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-ink dark:text-white flex items-center gap-2">
            <Map size={20} className="text-emerald-500" />
            GIS Wildlife Movement & Detection Log
          </h2>
          <Link to="/map" className="text-xs font-bold text-emerald-600 hover:underline">Interactive GIS Map →</Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {detections.slice(0, 5).map(det => (
            <div key={det.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink dark:text-white">{det.species_name}</span>
                  {det.is_endangered && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Endangered</span>}
                </div>
                <p className="text-xs text-slate-500">{det.site_name} • Lat {det.latitude.toFixed(4)}, Lon {det.longitude.toFixed(4)}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(det.detected_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
