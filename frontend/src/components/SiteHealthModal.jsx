import { useEffect, useState } from "react";
import { Activity, ShieldAlert, CheckCircle, AlertCircle, X, Info, ChevronRight, Layers } from "lucide-react";
import api from "../api/axiosInstance.js";
import { Modal } from "./ui/Modal.jsx";
import { Card } from "./ui/Card.jsx";

const STATUS_THEMES = {
  Excellent: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  Healthy: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300",
    bar: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  "Moderate Concern": {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300",
    bar: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  Vulnerable: {
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300",
    bar: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  Critical: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300",
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
};

export function SiteHealthModal({ site, onClose }) {
  const [healthData, setHealthData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!site?.id) return;
    loadData();
  }, [site?.id]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [hRes, rRes] = await Promise.all([
        api.get(`/api/health/site/${site.id}`),
        api.get(`/api/conservation/site/${site.id}/recommendations`),
      ]);
      setHealthData(hRes.data);
      setRecommendations(rRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load health report details.");
    } finally {
      setLoading(false);
    }
  }

  if (!site) return null;

  const theme = STATUS_THEMES[healthData?.conservation_status] || STATUS_THEMES.Healthy;
  const components = healthData?.components || {};

  const componentList = [
    {
      key: "species_diversity",
      label: "Species Diversity",
      weight: 30,
      score: components.species_diversity?.score ?? 0,
      note: `Shannon Index: ${components.species_diversity?.shannon_index ?? 0}`,
    },
    {
      key: "population_stability",
      label: "Population Stability",
      weight: 25,
      score: components.population_stability?.score ?? 0,
      note: `Primary Trend: ${components.population_stability?.primary_trend ?? "stable"}`,
    },
    {
      key: "habitat_quality",
      label: "Habitat Quality",
      weight: 20,
      score: components.habitat_quality?.score ?? 0,
      note: `Grade ${components.habitat_quality?.grade ?? "N/A"}`,
    },
    {
      key: "endangered_species",
      label: "Endangered Species Status",
      weight: 15,
      score: components.endangered_species?.score ?? 0,
      note: `Detected Count: ${components.endangered_species?.endangered_count ?? 0}`,
    },
    {
      key: "environmental_conditions",
      label: "Environmental Conditions",
      weight: 10,
      score: components.environmental_conditions?.score ?? 70,
      note: "70/100 — pending sensor data (M4)",
    },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Ecosystem Health Report — ${site.name}`}
      icon={Activity}
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {loading ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse">
            Computing weighted ecosystem health scores...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Top Overview: Overall Score & Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Composite Health Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-5xl font-extrabold ${theme.text}`}>
                    {healthData.health_score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Calculated using 5 weighted ecological factors
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Conservation Status
                </span>
                <span className={`rounded-xl px-3 py-1 text-sm font-bold border ${theme.badge}`}>
                  {healthData.conservation_status}
                </span>
              </div>
            </div>

            {/* 5-Component Weighted Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers size={16} className="text-emerald-500" />
                  Weighted Health Components Breakdown
                </h3>
                <span className="text-xs text-slate-400">Score × Weight = Contribution</span>
              </div>

              <div className="space-y-3.5">
                {componentList.map((comp) => {
                  const contribution = ((comp.score * comp.weight) / 100).toFixed(1);

                  return (
                    <div
                      key={comp.key}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
                          <span>{comp.label}</span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                            {comp.weight}% Weight
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">
                            {comp.score}/100 × {comp.weight}% =
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            +{contribution}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
                        <div
                          className={`h-full ${theme.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, Math.max(0, comp.score))}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                        {comp.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 3 Conservation Recommendations */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-amber-500" />
                Top Conservation Recommendations ({recommendations.length})
              </h3>

              {recommendations.length > 0 ? (
                <div className="space-y-2">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-start gap-2.5"
                    >
                      <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="uppercase text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white mr-2">
                          {rec.priority}
                        </span>
                        <span>{rec.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No critical conservation alerts active for this monitoring site.
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </Modal>
  );
}
