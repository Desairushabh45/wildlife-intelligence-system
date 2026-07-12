import { AlertTriangle, Binoculars, MapPinned, Radar, Shield, Leaf, Activity } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sitesRes, surveysRes, speciesRes] = await Promise.all([
          api.get("/api/sites/").catch(() => ({ data: [] })),
          api.get("/api/surveys/").catch(() => ({ data: [] })),
          api.get("/api/species/").catch(() => ({ data: [] })),
        ]);
        setData({
          sites: sitesRes.data,
          surveys: surveysRes.data,
          species: speciesRes.data,
        });
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <section className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">Welcome, {user?.full_name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here is your wildlife intelligence overview.</p>
        </div>
      </section>

      {user?.role === "administrator" && <AdminDashboard data={data} />}
      {user?.role === "wildlife_researcher" && <ResearcherDashboard data={data} />}
      {user?.role === "conservation_officer" && <ConservationDashboard data={data} />}
      {user?.role === "forest_department_officer" && <ForestDeptDashboard data={data} />}
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

function AdminDashboard({ data }) {
  const cards = [
    { label: "Total Sites", value: data.sites.length, icon: MapPinned, tone: "bg-moss dark:bg-canopy/20 text-canopy dark:text-emerald-400", trend: "+12%" },
    { label: "Total Surveys", value: data.surveys.length, icon: Radar, tone: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", trend: "+5%" },
    { label: "Total Species", value: data.species.length, icon: Leaf, tone: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
  ];

  const habitatData = useMemo(() => {
    const counts = data.sites.reduce((acc, site) => {
      const type = site.habitat_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data.sites]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </section>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card noPadding>
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-ink dark:text-white">Sites by Habitat Type</h2>
          </div>
          <div className="h-72 p-4">
            {habitatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={habitatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {habitatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No data available</div>
            )}
          </div>
        </Card>

        <Card noPadding>
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-ink dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-6 grid gap-4">
            <Link to="/sites" className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-canopy dark:hover:border-canopy hover:bg-moss/20 dark:hover:bg-canopy/10 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-moss dark:group-hover:bg-canopy/20 group-hover:text-canopy dark:group-hover:text-emerald-400"><MapPinned size={20} /></div>
              <div><p className="font-semibold text-ink dark:text-white">Manage Sites</p><p className="text-xs text-slate-500 dark:text-slate-400">Add or edit monitoring locations</p></div>
            </Link>
            <Link to="/surveys" className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-700 dark:group-hover:text-amber-400"><Radar size={20} /></div>
              <div><p className="font-semibold text-ink dark:text-white">Manage Surveys</p><p className="text-xs text-slate-500 dark:text-slate-400">Track field expeditions</p></div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ResearcherDashboard({ data }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Species Cataloged" value={data.species.length} icon={Leaf} tone="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" />
        <StatCard label="Total Surveys" value={data.surveys.length} icon={Binoculars} tone="bg-moss dark:bg-canopy/20 text-canopy dark:text-emerald-400" />
      </section>
      <Card noPadding className="overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Recent Surveys</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.surveys.slice(0, 5).map(survey => (
            <div key={survey.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">Started {new Date(survey.start_date).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{survey.notes || "No notes"}</p>
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{survey.site_id.substring(0,8)}</span>
            </div>
          ))}
          {!data.surveys.length && <div className="p-6 text-center text-sm text-slate-500">No recent surveys.</div>}
        </div>
      </Card>
    </div>
  );
}

function ConservationDashboard({ data }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Endangered Species" value={data.species.filter(s => s.is_endangered).length} icon={AlertTriangle} tone="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" />
        <StatCard label="Active Sites" value={data.sites.length} icon={MapPinned} tone="bg-moss dark:bg-canopy/20 text-canopy dark:text-emerald-400" />
      </section>
      <Card noPadding className="overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Monitoring Sites</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.sites.map(site => (
            <div key={site.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-ink dark:text-white">{site.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{site.protected_area || "Unprotected"}</p>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                {site.device_type.replace("_", " ")}
              </span>
            </div>
          ))}
          {!data.sites.length && <div className="p-6 text-center text-sm text-slate-500">No monitoring sites.</div>}
        </div>
      </Card>
    </div>
  );
}

function ForestDeptDashboard({ data }) {
  const surveyCountBySite = data.surveys.reduce((acc, survey) => {
    acc[survey.site_id] = (acc[survey.site_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Protected Areas" value={new Set(data.sites.map(s => s.protected_area).filter(Boolean)).size} icon={Shield} tone="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" />
        <StatCard label="Total Surveys" value={data.surveys.length} icon={Radar} tone="bg-[#f5e8cd] dark:bg-amber-900/20 text-[#8c5b10] dark:text-amber-500" />
      </section>
      <Card noPadding className="overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink dark:text-white">Site Survey Activity</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Site Name</th>
              <th className="px-6 py-4">Protected Area</th>
              <th className="px-6 py-4 text-right">Surveys</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.sites.map(site => (
              <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-ink dark:text-white">{site.name}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{site.protected_area || "Not set"}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-300">{surveyCountBySite[site.id] || 0}</td>
              </tr>
            ))}
            {!data.sites.length && (
              <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No sites recorded.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default Dashboard;
