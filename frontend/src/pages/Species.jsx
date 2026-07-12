import { AlertTriangle, Bug, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const taxonomicClasses = [
  "Mammalia",
  "Aves",
  "Reptilia",
  "Amphibia",
  "Actinopterygii",
  "Insecta",
  "Other",
];

const conservationStatuses = [
  ["least_concern", "Least Concern"],
  ["near_threatened", "Near Threatened"],
  ["vulnerable", "Vulnerable"],
  ["endangered", "Endangered"],
  ["critically_endangered", "Critically Endangered"],
  ["data_deficient", "Data Deficient"],
];

function Species() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canWrite = useMemo(() => ["administrator"].includes(user?.role), [user]);

  async function loadData() {
    try {
      const { data } = await api.get("/api/species/");
      setSpeciesList(data);
    } catch {
      addToast("Unable to load species catalog", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredSpecies = speciesList.filter(species => {
    const commonName = species.common_name || "";
    const scientificName = species.scientific_name || "";
    return commonName.toLowerCase().includes(search.toLowerCase()) || 
           scientificName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">Species Catalog</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{speciesList.length} species recorded in the database</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 text-sm outline-none transition-all focus:border-canopy dark:focus:border-canopy focus:ring-2 focus:ring-canopy/20"
            />
          </div>
          {canWrite && (
            <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
              <Plus size={18} className="mr-2" />
              Add Species
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : speciesList.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={Bug}
            title="No species found"
            description="The species catalog is currently empty."
            actionLabel={canWrite ? "Register species" : null}
            onAction={() => setIsModalOpen(true)}
          />
        </Card>
      ) : (
        <Card noPadding className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Common Name</th>
                  <th className="px-6 py-4">Scientific Name</th>
                  <th className="px-6 py-4">Taxonomic Class</th>
                  <th className="px-6 py-4">Conservation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredSpecies.map((species) => (
                  <tr key={species.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ink dark:text-white">
                      <div className="flex items-center gap-2">
                        {species.common_name || "Unknown"}
                        {species.is_endangered && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <AlertTriangle size={12} />
                            Endangered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 italic text-slate-600 dark:text-slate-300">{species.scientific_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{species.taxonomic_class || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{(conservationStatuses.find(([v]) => v === species.conservation_status) || [])[1] || species.conservation_status || "N/A"}</td>
                  </tr>
                ))}
                {filteredSpecies.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-slate-500" colSpan="4">
                      No species matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isModalOpen && (
        <SpeciesModal 
          onClose={() => setIsModalOpen(false)} 
          onSaved={() => { loadData(); addToast("Species cataloged successfully."); }} 
        />
      )}
    </main>
  );
}

function SpeciesModal({ onClose, onSaved }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    scientific_name: "",
    common_name: "",
    taxonomic_class: "Mammalia",
    conservation_status: "least_concern",
    is_endangered: false,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/species/", form);
      await onSaved();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.detail || "Species creation failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add species" icon={Bug}>
      <form className="grid gap-5 px-6 py-6 sm:grid-cols-2 bg-slate-50/50 dark:bg-slate-900/50" onSubmit={handleSubmit}>
        <Input label="Scientific Name" value={form.scientific_name} onChange={(value) => setForm({ ...form, scientific_name: value })} required />
        <Input label="Common Name" value={form.common_name} onChange={(value) => setForm({ ...form, common_name: value })} />
        
        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Taxonomic Class</span>
          <select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20" value={form.taxonomic_class} onChange={(event) => setForm({ ...form, taxonomic_class: event.target.value })}>
            {taxonomicClasses.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </label>
        
        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Conservation Status</span>
          <select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy focus:ring-2 focus:ring-canopy/20" value={form.conservation_status} onChange={(event) => setForm({ ...form, conservation_status: event.target.value })}>
            {conservationStatuses.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        
        <label className="flex items-center gap-3 sm:col-span-2 cursor-pointer p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
          <input type="checkbox" className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-canopy focus:ring-canopy" checked={form.is_endangered} onChange={(event) => setForm({ ...form, is_endangered: event.target.checked })} />
          <div>
            <span className="text-sm font-semibold text-ink dark:text-white block">Mark as endangered</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Flags this species for special conservation tracking</span>
          </div>
        </label>
        
        <div className="flex justify-end gap-3 sm:col-span-2 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>Save species</Button>
        </div>
      </form>
    </Modal>
  );
}

function Input({ label, value, onChange, type = "text", step, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink dark:text-white">{label} {required && <span className="text-red-500">*</span>}</span>
      <input 
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none transition-all focus:border-canopy dark:focus:border-canopy focus:ring-2 focus:ring-canopy/20" 
        type={type} 
        step={step} 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
        required={required} 
      />
    </label>
  );
}

export default Species;
