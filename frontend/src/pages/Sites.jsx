import { MapPinned, Pencil, Plus, Trash2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

function Sites() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [editingSite, setEditingSite] = useState(null);
  const [deletingSite, setDeletingSite] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const canWrite = useMemo(() => ["administrator", "forest_department_officer"].includes(user?.role), [user]);
  const canDelete = useMemo(() => ["administrator"].includes(user?.role), [user]);

  async function loadSites() {
    try {
      const { data } = await api.get("/api/sites/");
      setSites(data);
    } catch {
      addToast("Unable to load monitoring sites", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSites();
  }, []);

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(search.toLowerCase()) ||
    (site.protected_area || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">Monitoring Sites</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sites.length} registered locations</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Filter sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 text-sm outline-none transition-all focus:border-canopy dark:focus:border-canopy focus:ring-2 focus:ring-canopy/20"
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
        <LoadingSkeleton type="table" rows={6} />
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
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Habitat</th>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">Coordinates</th>
                  <th className="px-6 py-4">Protected area</th>
                  {(canWrite || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredSites.map((site) => (
                  <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ink dark:text-white">{site.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{site.habitat_type || "Not set"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 capitalize">{site.device_type.replaceAll("_", " ")}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-md inline-block mt-2">
                      {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{site.protected_area || "Not set"}</td>
                    {(canWrite || canDelete) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => { setEditingSite(site); setIsModalOpen(true); }}
                              className="rounded p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white transition-colors"
                              aria-label="Edit site"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeletingSite(site)}
                              className="rounded p-2 text-slate-400 dark:text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                              aria-label="Delete site"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredSites.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={(canWrite || canDelete) ? 6 : 5}>
                      No sites matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
      
      // Basic client-side validation
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
