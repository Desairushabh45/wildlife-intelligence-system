import { Pencil, Plus, Radar, Trash2, Search, X } from "lucide-react";
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

function Surveys() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [deletingSurvey, setDeletingSurvey] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canWrite = useMemo(() => ["administrator", "forest_department_officer"].includes(user?.role), [user]);
  const canDelete = useMemo(() => ["administrator"].includes(user?.role), [user]);

  async function loadData() {
    try {
      const [surveysResponse, sitesResponse] = await Promise.all([
        api.get("/api/surveys/"),
        api.get("/api/sites/"),
      ]);
      setSurveys(surveysResponse.data);
      setSites(sitesResponse.data);
    } catch {
      addToast("Unable to load surveys", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const siteNames = Object.fromEntries(sites.map((site) => [site.id, site.name]));

  const filteredSurveys = surveys.filter(survey => {
    const sName = siteNames[survey.site_id] || "";
    const notes = survey.notes || "";
    return sName.toLowerCase().includes(search.toLowerCase()) || 
           notes.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">Surveys</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{surveys.length} survey records</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search surveys by site or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 text-sm outline-none transition-all focus:border-canopy dark:focus:border-canopy focus:ring-2 focus:ring-canopy/20"
            />
          </div>
          {canWrite && (
            <Button 
              onClick={() => { setEditingSurvey(null); setIsModalOpen(true); }} 
              disabled={!sites.length}
              className="shrink-0"
              title={!sites.length ? "Please create a site first." : ""}
            >
              <Plus size={18} className="mr-2" />
              Add Survey
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : surveys.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={Radar}
            title="No surveys found"
            description={sites.length === 0 ? "You must add a site before you can record surveys." : "There are no survey records yet."}
            actionLabel={canWrite && sites.length > 0 ? "Log first survey" : null}
            onAction={() => { setEditingSurvey(null); setIsModalOpen(true); }}
          />
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Site</th>
                  <th className="px-6 py-4">Start</th>
                  <th className="px-6 py-4">End</th>
                  <th className="px-6 py-4">Notes</th>
                  {(canWrite || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ink dark:text-white">{siteNames[survey.site_id] || survey.site_id}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(survey.start_date).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{survey.end_date ? new Date(survey.end_date).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'}) : <span className="inline-flex rounded bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/20">Ongoing</span>}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={survey.notes}>{survey.notes || "No notes"}</td>
                    {(canWrite || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2">
                          <Link to={`/observations?survey_id=${survey.id}`} className="rounded p-2 text-slate-400 dark:text-slate-500 hover:bg-moss dark:hover:bg-canopy/20 hover:text-canopy dark:hover:text-emerald-400 transition-colors" title="View Observations">
                            <Radar size={16} />
                          </Link>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => { setEditingSurvey(survey); setIsModalOpen(true); }}
                              className="rounded p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white transition-colors"
                              aria-label="Edit survey"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeletingSurvey(survey)}
                              className="rounded p-2 text-slate-400 dark:text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                              aria-label="Delete survey"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredSurveys.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan={(canWrite || canDelete) ? 5 : 4}>
                      No surveys matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      {isModalOpen && (
        <SurveyModal 
          survey={editingSurvey} 
          sites={sites} 
          onClose={() => { setIsModalOpen(false); setEditingSurvey(null); }} 
          onSaved={() => { loadData(); addToast(`Survey successfully ${editingSurvey ? "updated" : "logged"}.`); }} 
        />
      )}
      
      {deletingSurvey && (
        <DeleteConfirmModal 
          survey={deletingSurvey} 
          onClose={() => setDeletingSurvey(null)} 
          onDeleted={() => { loadData(); addToast("Survey deleted.", "success"); }} 
        />
      )}
    </main>
  );
}

function DeleteConfirmModal({ survey, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(`/api/surveys/${survey.id}`);
      await onDeleted();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to delete survey", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ConfirmModal
      isOpen={true}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Survey"
      message={<span>Are you sure you want to delete this survey starting on <strong>{new Date(survey.start_date).toLocaleDateString()}</strong>? This action cannot be undone.</span>}
      isDeleting={submitting}
    />
  );
}

function SurveyModal({ survey, sites, onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(() => {
    if (survey) {
      return {
        site_id: survey.site_id,
        start_date: survey.start_date ? new Date(survey.start_date).toISOString().slice(0, 16) : "",
        end_date: survey.end_date ? new Date(survey.end_date).toISOString().slice(0, 16) : "",
        notes: survey.notes || "",
      };
    }
    return {
      site_id: sites[0]?.id || "",
      start_date: "",
      end_date: "",
      notes: "",
    };
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        site_id: form.site_id,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        notes: form.notes || null,
      };

      if (form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
        throw new Error("End date cannot be earlier than start date.");
      }

      if (survey) {
        await api.put(`/api/surveys/${survey.id}`, payload);
      } else {
        await api.post("/api/surveys/", payload);
      }

      await onSaved();
      onClose();
    } catch (err) {
      addToast(err.message || err.response?.data?.detail || "Survey save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={survey ? "Edit survey" : "Log survey"} icon={Radar}>
      <form className="grid gap-5 px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Site <span className="text-red-500">*</span></span>
          <select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20" value={form.site_id} onChange={(event) => setForm({ ...form, site_id: event.target.value })} required>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="text-sm font-semibold text-ink dark:text-white">Start date <span className="text-red-500">*</span></span>
            <input className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20" type="datetime-local" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink dark:text-white">End date</span>
            <input className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20" type="datetime-local" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
          </label>
        </div>
        
        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Notes</span>
          <textarea className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20 placeholder:text-slate-400" placeholder="Add observations or weather conditions..." value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
        
        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {survey ? "Save Changes" : "Log Survey"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default Surveys;
