import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Filter,
  Search,
  MapPin,
  Clock,
  RefreshCw,
} from "lucide-react";

import api from "../api/axiosInstance.js";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const PRIORITY_BADGES = {
  critical: {
    label: "CRITICAL",
    bgClass: "bg-red-600 text-white dark:bg-red-700",
    icon: ShieldAlert,
  },
  urgent: {
    label: "URGENT",
    bgClass: "bg-amber-500 text-white dark:bg-amber-600",
    icon: AlertTriangle,
  },
  high: {
    label: "PRIORITY / HIGH",
    bgClass: "bg-yellow-500 text-slate-900 font-bold",
    icon: AlertCircle,
  },
  medium: {
    label: "MEDIUM",
    bgClass: "bg-blue-600 text-white dark:bg-blue-700",
    icon: Info,
  },
  low: {
    label: "MAINTAIN / LOW",
    bgClass: "bg-slate-600 text-white dark:bg-slate-700",
    icon: CheckCircle,
  },
};

function Conservation() {
  const { addToast } = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/conservation/recommendations/all");
      setRecommendations(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to load conservation recommendations.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  // Unique site names for dropdown filter
  const siteOptions = Array.from(new Set(recommendations.map((r) => r.site_name))).filter(Boolean);

  // Filter recommendations
  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesPriority =
      priorityFilter === "all" || rec.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesSite =
      siteFilter === "all" || rec.site_name === siteFilter;
    const matchesSearch =
      searchTerm === "" ||
      rec.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.site_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSite && matchesSearch;
  });

  const countByPriority = {
    critical: recommendations.filter((r) => r.priority === "critical").length,
    urgent: recommendations.filter((r) => r.priority === "urgent").length,
    high: recommendations.filter((r) => r.priority === "high").length,
    medium: recommendations.filter((r) => r.priority === "medium").length,
    low: recommendations.filter((r) => r.priority === "low").length,
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={26} />
            Conservation Alerts & Action Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time rule-based intervention recommendations across all monitoring sites
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-ink dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-emerald-500" : "text-slate-500"} />
          Refresh Alerts
        </button>
      </div>

      {/* Counter Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{countByPriority.critical}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Critical Intervention
            </p>
          </div>
          <ShieldAlert size={24} className="text-red-500 opacity-80" />
        </Card>

        <Card className="flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{countByPriority.urgent}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Urgent Declining
            </p>
          </div>
          <AlertTriangle size={24} className="text-amber-500 opacity-80" />
        </Card>

        <Card className="flex items-center justify-between border-l-4 border-l-yellow-500">
          <div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{countByPriority.high}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Priority Zone
            </p>
          </div>
          <AlertCircle size={24} className="text-yellow-500 opacity-80" />
        </Card>

        <Card className="flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{countByPriority.medium}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Medium Biodiversity
            </p>
          </div>
          <Info size={24} className="text-blue-500 opacity-80" />
        </Card>

        <Card className="flex items-center justify-between border-l-4 border-l-slate-400">
          <div>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{countByPriority.low}</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Maintain Healthy
            </p>
          </div>
          <CheckCircle size={24} className="text-slate-400 opacity-80" />
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Priority Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
            <Filter size={14} /> Priority:
          </span>
          {["all", "critical", "urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                priorityFilter === p
                  ? "bg-canopy text-white shadow-sm dark:bg-emerald-600"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Site Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-auto">
            <MapPin size={14} className="text-emerald-500 shrink-0" />
            <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink dark:text-white outline-none cursor-pointer pr-2 text-xs w-full"
            >
              <option value="all">All Sites ({siteOptions.length})</option>
              {siteOptions.map((sName) => (
                <option key={sName} value={sName} className="dark:bg-slate-800">
                  {sName}
                </option>
              ))}
            </select>
          </div>

          {/* Search input */}
          <div className="relative min-w-[200px] w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alert text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-4 py-1.5 text-xs text-ink dark:text-white outline-none focus:border-canopy focus:bg-white dark:focus:bg-slate-900"
            />
          </div>
        </div>
      </Card>

      {/* Recommendations Feed List */}
      {loading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <Card className="p-6 text-red-600 dark:text-red-400 flex items-center gap-3">
          <AlertCircle size={24} />
          <p className="font-semibold">{error}</p>
        </Card>
      ) : filteredRecommendations.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
          <p className="text-base font-bold text-ink dark:text-white">No active alerts matching your filter</p>
          <p className="text-xs text-slate-400 mt-1">All sites monitored are operating smoothly within target thresholds.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => {
            const badge = PRIORITY_BADGES[rec.priority] || PRIORITY_BADGES.low;
            const IconComponent = badge.icon;

            return (
              <Card
                key={rec.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 shrink-0 rounded-xl p-2.5 ${badge.bgClass}`}>
                    <IconComponent size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${badge.bgClass}`}>
                        {badge.label}
                      </span>
                      <Link
                        to={`/population?site_id=${rec.site_id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-canopy dark:hover:text-emerald-400 transition-colors"
                      >
                        <MapPin size={13} className="text-emerald-500" />
                        {rec.site_name}
                      </Link>
                    </div>
                    <p className="text-base font-bold text-ink dark:text-white leading-snug">
                      {rec.message}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-400 dark:text-slate-500 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {new Date(rec.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Link
                    to={`/population?site_id=${rec.site_id}`}
                    className="text-xs font-semibold text-canopy dark:text-emerald-400 hover:underline mt-1"
                  >
                    View Intelligence →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Conservation;
