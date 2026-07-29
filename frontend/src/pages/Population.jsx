import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Users,
  Layers,
  MapPin,
  AlertCircle,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

import api from "../api/axiosInstance.js";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const LINE_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function TrendBadge({ trend }) {
  if (trend === "increasing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        <TrendingUp size={14} />
        Increasing
      </span>
    );
  }
  if (trend === "declining") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
        <TrendingDown size={14} />
        Declining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
      <Minus size={14} />
      Stable
    </span>
  );
}

function Population() {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSiteId = searchParams.get("site_id") || "";

  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
  const [summaryData, setSummaryData] = useState(null);
  const [densityData, setDensityData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);

  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sites list
  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await api.get("/api/sites/");
        setSites(res.data);
        if (res.data.length > 0 && !selectedSiteId) {
          setSelectedSiteId(res.data[0].id);
        }
      } catch (err) {
        addToast("Failed to load monitoring sites.", "error");
      } finally {
        setLoadingSites(false);
      }
    }
    fetchSites();
  }, []);

  // Fetch site population data when selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) return;
    loadSiteData(selectedSiteId);
  }, [selectedSiteId]);

  async function loadSiteData(siteId) {
    setLoadingData(true);
    setError(null);
    try {
      const [sumRes, denRes, treRes] = await Promise.all([
        api.get(`/api/population/site/${siteId}/summary`),
        api.get(`/api/population/site/${siteId}/density`),
        api.get(`/api/population/site/${siteId}/trends`),
      ]);
      setSummaryData(sumRes.data);
      setDensityData(denRes.data);
      setTrendsData(treRes.data);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to load population data.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoadingData(false);
    }
  }

  const handleSiteChange = (e) => {
    const sId = e.target.value;
    setSelectedSiteId(sId);
    setSearchParams({ site_id: sId });
  };

  const speciesList = summaryData?.species_population || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
            <Activity className="text-emerald-500" size={26} />
            Population Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Species population estimates, 30-day trends, and 6-month time-series analytics
          </p>
        </div>

        {/* Site Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <MapPin size={18} className="text-emerald-500 ml-2 shrink-0" />
          <select
            value={selectedSiteId}
            onChange={handleSiteChange}
            disabled={loadingSites || sites.length === 0}
            className="bg-transparent text-sm font-semibold text-ink dark:text-white pr-4 outline-none cursor-pointer"
          >
            {sites.length === 0 && <option value="">No sites available</option>}
            {sites.map((site) => (
              <option key={site.id} value={site.id} className="dark:bg-slate-800">
                {site.name} ({site.protected_area || "Site"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingSites || loadingData ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <Card className="flex items-center gap-3 p-6 text-red-600 dark:text-red-400">
          <AlertCircle size={24} />
          <p className="font-semibold">{error}</p>
        </Card>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink dark:text-white">
                  {summaryData?.total_detections ?? 0}
                </p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Detections
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Users size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink dark:text-white">
                  {speciesList.length}
                </p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Monitored Species
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Layers size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink dark:text-white">
                  {densityData?.total_surveys ?? 0}
                </p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Surveys Conducted
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-lg font-bold text-ink dark:text-white capitalize">
                  {speciesList.filter((s) => s.trend === "increasing").length} Increasing
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {speciesList.filter((s) => s.trend === "declining").length} Declining · {speciesList.filter((s) => s.trend === "stable").length} Stable
                </p>
              </div>
            </Card>
          </div>

          {/* 6-Month Population Trends Line Chart */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-emerald-500" />
                  6-Month Population Trends (Monthly Detections)
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Time series of detection counts per species over the last 6 months
                </p>
              </div>
            </div>

            {trendsData?.series && trendsData.series.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendsData.series} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-500 dark:text-slate-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  {(trendsData.species_list || []).map((spName, i) => (
                    <Line
                      key={spName}
                      type="monotone"
                      dataKey={spName}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                No monthly trend data available for this site yet.
              </div>
            )}
          </Card>

          {/* Species Population Table */}
          <Card noPadding className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                Species Population & Trend Analysis
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3 text-left">Species Name</th>
                    <th className="px-6 py-3 text-left">Scientific Name</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-center">30-Day Trend</th>
                    <th className="px-6 py-3 text-right">Total Detections</th>
                    <th className="px-6 py-3 text-right">Last Detected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {speciesList.length > 0 ? (
                    speciesList.map((sp, idx) => (
                      <tr key={sp.species_id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-ink dark:text-white flex items-center gap-2">
                          {sp.is_endangered && (
                            <ShieldAlert size={16} className="text-red-500 shrink-0" title="Endangered Species" />
                          )}
                          {sp.species_name}
                        </td>
                        <td className="px-6 py-4 italic text-slate-500 dark:text-slate-400">
                          {sp.scientific_name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                            sp.conservation_status === "critically_endangered"
                              ? "bg-red-100 text-red-700 ring-red-500/30 dark:bg-red-900/30 dark:text-red-400"
                              : sp.conservation_status === "endangered" || sp.conservation_status === "vulnerable"
                                ? "bg-amber-100 text-amber-700 ring-amber-500/30 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {sp.conservation_status?.replace(/_/g, " ") || "Least Concern"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <TrendBadge trend={sp.trend} />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-ink dark:text-white">
                          {sp.detection_count}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400">
                          {sp.last_detected
                            ? new Date(sp.last_detected).toLocaleDateString(undefined, { dateStyle: "medium" })
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                        No species detections recorded at this site yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Population Density Cards */}
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-500" />
              Population Density Estimates (Detections / Survey)
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(densityData?.species_density || []).map((sp, idx) => (
                <Card key={sp.species_id || idx} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-ink dark:text-white text-base flex items-center gap-1.5">
                        {sp.is_endangered && <ShieldAlert size={15} className="text-red-500 shrink-0" />}
                        {sp.species_name}
                      </h3>
                      {sp.scientific_name && (
                        <p className="text-xs italic text-slate-400">{sp.scientific_name}</p>
                      )}
                    </div>
                    <span className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {sp.density_per_survey} / survey
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Total Detections: {sp.detection_count}</span>
                      <span>Surveys: {densityData.total_surveys}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, sp.density_per_survey * 20)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default Population;
