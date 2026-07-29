import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  Bug,
  Leaf,
  Layers,
  ShieldAlert,
  Users,
} from "lucide-react";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { useToast } from "../components/ui/Toast.jsx";

// Colour palette for the bar chart
const CHART_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

// ─── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Custom tooltip for the bar chart ───────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-ink dark:text-white">{d.species_name}</p>
      {d.scientific_name && (
        <p className="text-slate-400 italic text-xs">{d.scientific_name}</p>
      )}
      <p className="mt-1 text-emerald-600 dark:text-emerald-400 font-semibold">
        {d.count} detection{d.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Shannon gauge visual ────────────────────────────────────────────────────
function ShannonGauge({ value }) {
  // Theoretical max for common wildlife surveys ≈ 3.0; cap at 4.0 for display
  const max = 4.0;
  const pct = Math.min((value / max) * 100, 100);
  const color =
    value >= 2.0 ? "#10b981" : value >= 1.0 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {/* track */}
          <circle
            cx="60" cy="60" r="48"
            fill="none"
            strokeWidth="12"
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          {/* progress */}
          <circle
            cx="60" cy="60" r="48"
            fill="none"
            strokeWidth="12"
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 48}`}
            strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink dark:text-white">{value.toFixed(3)}</span>
          <span className="text-xs text-slate-400">H′</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Shannon Diversity Index</p>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
function Biodiversity() {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get("survey_id");
  const siteId   = searchParams.get("site_id");

  const [reportData, setReportData]   = useState(null);
  const [biodivData, setBiodivData]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!surveyId && !siteId) {
      setError("No survey_id or site_id provided.");
      setLoading(false);
      return;
    }
    loadData();
  }, [surveyId, siteId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      if (surveyId) {
        const [reportRes, biodivRes] = await Promise.all([
          api.get(`/api/surveys/${surveyId}/report`),
          api.get(`/api/surveys/${surveyId}/biodiversity`),
        ]);
        setReportData(reportRes.data);
        setBiodivData(biodivRes.data);
      } else {
        // Site-level view — no full report, just biodiversity
        const biodivRes = await api.get(`/api/sites/${siteId}/biodiversity`);
        setBiodivData(biodivRes.data);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to load biodiversity data.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const title = reportData
    ? `Survey — ${reportData.survey.site_name || "Unknown site"}`
    : siteId
      ? "Site Biodiversity"
      : "Biodiversity Report";

  const backLink = surveyId ? "/surveys" : "/sites";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-canopy dark:text-slate-400 dark:hover:text-emerald-400 transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
            <Leaf size={24} className="text-emerald-500" />
            {title}
          </h1>
          {reportData && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {new Date(reportData.survey.start_date).toLocaleDateString(undefined, { dateStyle: "long" })}
              {reportData.survey.end_date
                ? ` — ${new Date(reportData.survey.end_date).toLocaleDateString(undefined, { dateStyle: "long" })}`
                : " (Ongoing)"}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <Card className="flex items-center gap-4 text-red-600 dark:text-red-400 p-6">
          <AlertTriangle size={24} />
          <p className="font-medium">{error}</p>
        </Card>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Shannon Gauge occupies a full card */}
            <Card className="sm:col-span-2 lg:col-span-1 flex items-center justify-center py-6">
              <ShannonGauge value={biodivData?.shannon_index ?? 0} />
            </Card>

            <MetricCard
              icon={Users}
              label="Species Richness"
              value={biodivData?.species_richness ?? 0}
              sub="distinct species detected"
              accent="bg-blue-500"
            />
            <MetricCard
              icon={Bug}
              label="Total Detections"
              value={biodivData?.total_detections ?? 0}
              sub="across all observations"
              accent="bg-amber-500"
            />
            {reportData && (
              <MetricCard
                icon={Layers}
                label="Observations"
                value={reportData.observations.total}
                sub={`${reportData.observations.image_count} images · ${reportData.observations.audio_count} audio`}
                accent="bg-purple-500"
              />
            )}
          </div>

          {/* Survey notes */}
          {reportData?.survey.notes && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Survey Notes
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{reportData.survey.notes}</p>
            </Card>
          )}

          {/* Bar chart */}
          {(biodivData?.species_breakdown?.length ?? 0) > 0 ? (
            <Card>
              <h2 className="text-base font-bold text-ink dark:text-white mb-6 flex items-center gap-2">
                <BarChart2 size={18} className="text-emerald-500" />
                Species Detection Count
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={biodivData.species_breakdown}
                  margin={{ top: 0, right: 16, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="species_name"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {biodivData.species_breakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                No detections yet — run AI detection on observations to populate this chart.
              </p>
            </Card>
          )}

          {/* Detections by species table */}
          {(reportData?.detections_by_species?.length ?? 0) > 0 && (
            <Card noPadding className="overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-bold text-ink dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-emerald-500" />
                  Detections by Species
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3 text-left">Species</th>
                      <th className="px-6 py-3 text-left">Scientific Name</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Detections</th>
                      <th className="px-6 py-3 text-right">Avg Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {reportData.detections_by_species.map((sp) => (
                      <tr key={sp.species_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-3 font-semibold text-ink dark:text-white flex items-center gap-2">
                          {sp.is_endangered && (
                            <ShieldAlert size={14} className="text-red-500 shrink-0" title="Endangered" />
                          )}
                          {sp.species_name}
                        </td>
                        <td className="px-6 py-3 italic text-slate-500 dark:text-slate-400">{sp.scientific_name || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                            sp.conservation_status === "critically_endangered"
                              ? "bg-red-100 text-red-700 ring-red-500/30 dark:bg-red-900/30 dark:text-red-400"
                              : sp.conservation_status === "endangered" || sp.conservation_status === "vulnerable"
                                ? "bg-amber-100 text-amber-700 ring-amber-500/30 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {sp.conservation_status?.replace(/_/g, " ") || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-ink dark:text-white">{sp.detection_count}</td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-300">
                          {(sp.avg_confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </main>
  );
}

export default Biodiversity;
