import { MapPinned, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";

const deviceTypes = [
  ["camera_trap", "Camera trap"],
  ["audio_sensor", "Audio sensor"],
  ["drone", "Drone"],
];

function Sites() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const canWrite = useMemo(() => ["administrator", "forest_department_officer"].includes(user?.role), [user]);

  async function loadSites() {
    const { data } = await api.get("/api/sites/");
    setSites(data);
  }

  useEffect(() => {
    loadSites().catch(() => setError("Unable to load monitoring sites"));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Monitoring Sites</h1>
          <p className="mt-1 text-sm text-slate-600">{sites.length} registered locations</p>
        </div>
        {canWrite && (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded bg-canopy px-4 text-sm font-semibold text-white hover:bg-[#185a44]">
            <Plus size={17} aria-hidden="true" />
            Add Site
          </button>
        )}
      </div>
      {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Habitat</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Coordinates</th>
                <th className="px-4 py-3">Protected area</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ink">{site.name}</td>
                  <td className="px-4 py-3 text-slate-600">{site.habitat_type || "Not set"}</td>
                  <td className="px-4 py-3 text-slate-600">{site.device_type.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}</td>
                  <td className="px-4 py-3 text-slate-600">{site.protected_area || "Not set"}</td>
                </tr>
              ))}
              {!sites.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                    No sites recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {open && <SiteModal onClose={() => setOpen(false)} onCreated={loadSites} />}
    </main>
  );
}

function SiteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    habitat_type: "",
    protected_area: "",
    device_type: "camera_trap",
    latitude: "",
    longitude: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/sites/", {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Site creation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
      <section className="w-full max-w-2xl rounded bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPinned size={19} className="text-canopy" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Add monitoring site</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form className="grid gap-4 px-5 py-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <Input label="Habitat type" value={form.habitat_type} onChange={(value) => setForm({ ...form, habitat_type: value })} />
          <Input label="Protected area" value={form.protected_area} onChange={(value) => setForm({ ...form, protected_area: value })} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Device type</span>
            <select className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-canopy" value={form.device_type} onChange={(event) => setForm({ ...form, device_type: event.target.value })}>
              {deviceTypes.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <Input label="Latitude" type="number" step="any" value={form.latitude} onChange={(value) => setForm({ ...form, latitude: value })} required />
          <Input label="Longitude" type="number" step="any" value={form.longitude} onChange={(value) => setForm({ ...form, longitude: value })} required />
          {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="h-10 rounded border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="h-10 rounded bg-canopy px-4 text-sm font-semibold text-white hover:bg-[#185a44] disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? "Saving..." : "Save site"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", step, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-canopy" type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

export default Sites;
