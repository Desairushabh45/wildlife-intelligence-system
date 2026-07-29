import { MapPinned, Pencil, Plus, Trash2, Search, Activity, ShieldAlert, ChevronRight, BarChart2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const deviceTypes = [
  ["camera_trap", "Camera trap"],
  ["audio_sensor", "Audio sensor"],
  ["drone", "Drone"],
];

function HabitatGauge({ score, grade, classification }) {
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#22c55e" : score >= 40 ? "#eab308" : score >= 20 ? "#f97316" : "#ef4444";

  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
      <div className="relative h-14 w-14 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-700" />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="10" stroke={color} strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-extrabold text-ink dark:text-white text-sm">
          {grade}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Habitat Score</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-ink dark:text-white">{score}</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ 100</span>
        </div>
        <p className="text-xs font-medium" style={{ color }}>{classification}</p>
      </div>
    </div>
  );
}

function Sites() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [sites, setSites] = useState([]);
  const [siteIntelligence, setSiteIntelligence] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editingSite, setEditingSite] = useState(null);
  const [deletingSite, setDeletingSite] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canWrite = useMemo(() => ["administrator", "forest_department_officer"].includes(user?.role), [user]);
  const canDelete = useMemo(() => ["administrator"].includes(user?.role), [user]);

  async function loadSites() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/sites/");
      setSites(data);

      // Fetch M3 intelligence for each site in parallel
      const intelMap = {};
      await Promise.all(
        data.map(async (site) => {
          try {
            const [habRes, heaRes, recRes] = await Promise.all([
              api.get(`/api/habitat/site/${site.id}/score`),
              api.get(`/api/health/site/${site.id}`),
              api.get(`/api/conservation/site/${site.id}/recommendations`),
            ]);
            intelMap[site.id] = {
              habitat: habRes.data,
              health: heaRes.data,
              recommendations: recRes.data,
            };
          } catch {
            intelMap[site.id] = null;
          }
        })
      );
      setSiteIntelligence(intelMap);
    } catch {
      addToast("Unable to load monitoring sites", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSites();
  }, []);

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      (site.protected_area || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
            <MapPinned className="text-emerald-500" size={26} />
            Monitoring Sites & Habitat Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {sites.length} registered monitoring locations with live M3 ecosystem health scores
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20"
            />
          </div>
          {canWrite && (
            <Button onClick={() => { setEditingSite(null); setIsModalOpen(true); }} className="shrink-0">
              <Plus size={18} className="mr-2" />
              Add Site
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : sites.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={MapPinned}
            title="No sites found"
            description="You haven't registered any monitoring sites yet. Add your first location to start tracking wildlife."
            actionLabel={canWrite ? "Add first site" : null}
            onAction={() => { setEditingSite(null); setIsModalOpen(true); }}
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredSites.map((site) => {
            const intel = siteIntelligence[site.id];
            const habitat = intel?.habitat;
            const health = intel?.health;
            const recs = intel?.recommendations || [];

            return (
              <Card key={site.id} className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Site Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
                        {site.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {site.protected_area || "General Protection Zone"} · {site.habitat_type || "Habitat Not Specified"}
                      </p>
                    </div>

                    {(canWrite || canDelete) && (
                      <div className="flex items-center gap-1">
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => { setEditingSite(site); setIsModalOpen(true); }}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink transition-colors"
                            title="Edit Site"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingSite(site)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                            title="Delete Site"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Habitat & Health Gauges Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {habitat ? (
                      <HabitatGauge
                        score={habitat.habitat_score}
                        grade={habitat.grade}
                        classification={habitat.classification}
                      />
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                        Habitat data loading...
                      </div>
                    )}

                    {health ? (
                      <div className="flex flex-col justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Ecosystem Health
                        </span>
                        <div className="flex items-baseline gap-1.5 my-1">
                          <span className="text-2xl font-extrabold text-ink dark:text-white">{health.health_score}</span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                        <span className={`inline-self-start rounded-full px-2.5 py-0.5 text-xs font-bold ${health.badge_class}`}>
                          {health.conservation_status}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                        Health data loading...
                      </div>
                    )}
                  </div>

                  {/* Top Conservation Recommendations */}
                  {recs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <ShieldAlert size={13} className="text-amber-500" />
                        Top Conservation Priority
                      </p>
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs font-medium text-amber-900 dark:text-amber-300">
                        {recs[0].message}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                  <span className="font-mono text-slate-400">
                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/biodiversity?site_id=${site.id}`}
                      className="text-slate-500 hover:text-canopy dark:text-slate-400 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                      <BarChart2 size={14} />
                      Biodiversity
                    </Link>
                    <Link
                      to={`/population?site_id=${site.id}`}
                      className="text-canopy dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      Intelligence
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <SiteModal
          site={editingSite}
          onClose={() => { setIsModalOpen(false); setEditingSite(null); }}
          onSaved={() => { loadSites(); addToast(`Site successfully ${editingSite ? "updated" : "created"}!`); }}
        />
      )}

      {deletingSite && (
        <DeleteConfirmModal
          site={deletingSite}
          onClose={() => setDeletingSite(null)}
          onDeleted={() => { loadSites(); addToast("Site successfully deleted.", "success"); }}
        />
      )}
    </main>
  );
}

function DeleteConfirmModal({ site, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(`/api/sites/${site.id}`);
      await onDeleted();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to delete site", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Site"
      message={<span>Are you sure you want to delete <strong>{site.name}</strong>? This action cannot be undone and may orphan related surveys.</span>}
      isDeleting={submitting}
    />
  );
}

function SiteModal({ site, onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(
    site ? { ...site } : {
      name: "",
      habitat_type: "",
      protected_area: "",
      device_type: "camera_trap",
      latitude: "",
      longitude: "",
    }
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      if (isNaN(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
        throw new Error("Latitude must be a valid number between -90 and 90.");
      }
      if (isNaN(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
        throw new Error("Longitude must be a valid number between -180 and 180.");
      }

      if (site) {
        await api.put(`/api/sites/${site.id}`, payload);
      } else {
        await api.post("/api/sites/", payload);
      }

      await onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || err.response?.data?.detail || "Site save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={site ? "Edit monitoring site" : "Add monitoring site"} icon={MapPinned}>
      <form className="grid gap-5 px-6 py-6 sm:grid-cols-2 bg-slate-50/50 dark:bg-slate-900/50" onSubmit={handleSubmit}>
        <Input label="Site Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
        <Input label="Habitat type" placeholder="e.g. Tropical Rainforest" value={form.habitat_type || ""} onChange={(value) => setForm({ ...form, habitat_type: value })} />
        <Input label="Protected area" placeholder="e.g. Yellowstone National Park" value={form.protected_area || ""} onChange={(value) => setForm({ ...form, protected_area: value })} />

        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Device type</span>
          <select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20" value={form.device_type} onChange={(event) => setForm({ ...form, device_type: event.target.value })}>
            {deviceTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <Input label="Latitude (-90 to 90)" type="number" step="any" placeholder="45.12345" value={form.latitude} onChange={(value) => setForm({ ...form, latitude: value })} required />
        <Input label="Longitude (-180 to 180)" type="number" step="any" placeholder="-110.56789" value={form.longitude} onChange={(value) => setForm({ ...form, longitude: value })} required />

        <div className="flex justify-end gap-3 sm:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {site ? "Save Changes" : "Create Site"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Input({ label, value, onChange, type = "text", step, placeholder, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink dark:text-white">{label} {required && <span className="text-red-500">*</span>}</span>
      <input
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-canopy focus:ring-2 focus:ring-canopy/20"
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

export default Sites;
