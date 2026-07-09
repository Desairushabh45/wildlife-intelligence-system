import { Plus, Radar, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";

function Surveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(false);
  const canWrite = useMemo(() => ["administrator", "forest_department_officer"].includes(user?.role), [user]);

  async function loadData() {
    const [surveysResponse, sitesResponse] = await Promise.all([
      api.get("/api/surveys/"),
      api.get("/api/sites/"),
    ]);
    setSurveys(surveysResponse.data);
    setSites(sitesResponse.data);
  }

  useEffect(() => {
    loadData().catch(() => {});
  }, []);

  const siteNames = Object.fromEntries(sites.map((site) => [site.id, site.name]));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Surveys</h1>
          <p className="mt-1 text-sm text-slate-600">{surveys.length} survey records</p>
        </div>
        {canWrite && (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded bg-canopy px-4 text-sm font-semibold text-white hover:bg-[#185a44]" disabled={!sites.length}>
            <Plus size={17} aria-hidden="true" />
            Add Survey
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ink">{siteNames[survey.site_id] || survey.site_id}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(survey.start_date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{survey.end_date ? new Date(survey.end_date).toLocaleString() : "Open"}</td>
                  <td className="px-4 py-3 text-slate-600">{survey.notes || "No notes"}</td>
                </tr>
              ))}
              {!surveys.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="4">
                    No surveys recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {open && <SurveyModal sites={sites} onClose={() => setOpen(false)} onCreated={loadData} />}
    </main>
  );
}

function SurveyModal({ sites, onClose, onCreated }) {
  const [form, setForm] = useState({
    site_id: sites[0]?.id || "",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/surveys/", {
        site_id: form.site_id,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        notes: form.notes || null,
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Survey creation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
      <section className="w-full max-w-xl rounded bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Radar size={19} className="text-canopy" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Add survey</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form className="grid gap-4 px-5 py-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Site</span>
            <select className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-canopy" value={form.site_id} onChange={(event) => setForm({ ...form, site_id: event.target.value })} required>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Start date</span>
            <input className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-canopy" type="datetime-local" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} required />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">End date</span>
            <input className="mt-2 h-10 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-canopy" type="datetime-local" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea className="mt-2 min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-canopy" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="h-10 rounded bg-canopy px-4 text-sm font-semibold text-white hover:bg-[#185a44] disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? "Saving..." : "Save survey"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Surveys;
