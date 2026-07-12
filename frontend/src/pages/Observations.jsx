import { Bug, Image, Music, Plus, Search, Trash2, X, FileAudio, FileImage, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { useToast } from "../components/ui/Toast.jsx";

const BACKEND_URL = "http://localhost:8000";

function Observations() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [observations, setObservations] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingObservation, setDeletingObservation] = useState(null);

  const initialSurveyFilter = searchParams.get("survey_id") || "all";
  const [surveyFilter, setSurveyFilter] = useState(initialSurveyFilter);

  const isAdmin = user?.role === "administrator";

  async function loadData() {
    try {
      const [obsRes, surveysRes] = await Promise.all([
        api.get("/api/observations/"),
        api.get("/api/surveys/"),
      ]);
      setObservations(obsRes.data);
      setSurveys(surveysRes.data);
    } catch {
      addToast("Failed to load observations.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (val) => {
    setSurveyFilter(val);
    if (val === "all") {
      searchParams.delete("survey_id");
    } else {
      searchParams.set("survey_id", val);
    }
    setSearchParams(searchParams);
  };

  const filteredObservations = useMemo(() => {
    let filtered = observations;
    if (surveyFilter !== "all") {
      filtered = filtered.filter(o => o.survey_id === surveyFilter);
    }
    return filtered;
  }, [observations, surveyFilter]);

  async function confirmDelete() {
    if (!deletingObservation) return;
    try {
      await api.delete(`/api/observations/${deletingObservation.id}`);
      addToast("Observation deleted completely.");
      setObservations(prev => prev.filter(o => o.id !== deletingObservation.id));
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to delete observation.", "error");
    } finally {
      setDeletingObservation(null);
    }
  }

  const canDelete = (obs) => isAdmin || obs.uploaded_by === user.id;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white">Field Observations</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage image and audio files collected during surveys.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={surveyFilter} 
            onChange={(e) => handleFilterChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm outline-none focus:border-canopy dark:focus:border-canopy text-ink dark:text-white"
          >
            <option value="all">All Surveys</option>
            {surveys.map(s => (
              <option key={s.id} value={s.id}>Survey on {new Date(s.start_date).toLocaleDateString()}</option>
            ))}
          </select>
          <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
            <Plus size={18} className="mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : filteredObservations.length === 0 ? (
        <Card noPadding>
          <EmptyState
            icon={Bug}
            title="No observations found"
            description="Upload camera trap images or audio sensor files."
            actionLabel="Upload File"
            onAction={() => setIsModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredObservations.map(obs => (
            <Card key={obs.id} noPadding className="overflow-hidden flex flex-col hover:shadow-md transition-shadow group relative">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                {obs.observation_type === "image" ? (
                  <img src={`${BACKEND_URL}${obs.file_path}`} alt="Observation" className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 dark:bg-slate-900 text-white gap-2 p-4">
                    <Music size={32} className="text-emerald-400" />
                    <audio controls src={`${BACKEND_URL}${obs.file_path}`} className="w-full h-8 mt-2 opacity-80 hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {canDelete(obs) && (
                  <button 
                    onClick={() => setDeletingObservation(obs)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                    title="Delete Observation"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {obs.observation_type === "image" ? <FileImage size={10} /> : <FileAudio size={10} />}
                    {obs.observation_type}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(obs.captured_at || obs.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink dark:text-slate-200 line-clamp-2 mb-1 flex-1">
                  {obs.notes || "No notes provided."}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate" title="Uploader">
                    By: {obs.uploaded_by_user?.full_name || obs.uploaded_by.substring(0,8)}
                  </span>
                  <a href={`${BACKEND_URL}${obs.file_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-canopy font-medium transition-colors">
                    Open <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <UploadModal 
          surveys={surveys}
          onClose={() => setIsModalOpen(false)} 
          onUploaded={() => { loadData(); addToast("File uploaded successfully."); }} 
          initialSurvey={surveyFilter !== "all" ? surveyFilter : ""}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingObservation}
        onClose={() => setDeletingObservation(null)}
        onConfirm={confirmDelete}
        title="Delete observation?"
        description="This will permanently delete the file, its metadata, and the database record."
        confirmText="Delete permanently"
      />
    </main>
  );
}

function UploadModal({ surveys, onClose, onUploaded, initialSurvey }) {
  const { addToast } = useToast();
  
  const [surveyId, setSurveyId] = useState(initialSurvey || (surveys[0]?.id || ""));
  const [obsType, setObsType] = useState("image");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      addToast("Please select a file to upload.", "error");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("survey_id", surveyId);
    formData.append("observation_type", obsType);
    if (notes) formData.append("notes", notes);
    formData.append("file", file);

    try {
      await api.post("/api/observations/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onUploaded();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.detail || "Upload failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Observation" icon={Plus}>
      <form className="grid gap-5 px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50" onSubmit={handleSubmit}>
        
        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Target Survey *</span>
          <select 
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm outline-none focus:border-canopy dark:focus:border-canopy text-ink dark:text-white" 
            value={surveyId} 
            onChange={(e) => setSurveyId(e.target.value)}
            required
          >
            {surveys.length === 0 && <option value="">No surveys available</option>}
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.start_date).toLocaleDateString()} - {s.notes?.substring(0, 30) || "Survey"}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${obsType === 'image' ? 'border-canopy dark:border-emerald-500 bg-moss/20 dark:bg-canopy/20 text-canopy dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}>
            <input type="radio" name="obsType" value="image" className="hidden" checked={obsType === 'image'} onChange={() => setObsType('image')} />
            <Image size={18} />
            <span className="font-semibold text-sm">Image</span>
          </label>
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-4 transition-colors ${obsType === 'audio' ? 'border-canopy dark:border-emerald-500 bg-moss/20 dark:bg-canopy/20 text-canopy dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}>
            <input type="radio" name="obsType" value="audio" className="hidden" checked={obsType === 'audio'} onChange={() => setObsType('audio')} />
            <Music size={18} />
            <span className="font-semibold text-sm">Audio</span>
          </label>
        </div>

        <div className="mt-2">
          <span className="text-sm font-semibold text-ink dark:text-white mb-1.5 block">File *</span>
          <div 
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept={obsType === 'image' ? "image/jpeg,image/png" : "audio/mpeg,audio/wav"} 
            />
            {file ? (
              <div className="text-canopy dark:text-emerald-400 font-medium">
                <p>{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300">
                  <Plus size={20} />
                </div>
                <div className="text-sm dark:text-slate-300">
                  <span className="font-semibold text-canopy dark:text-emerald-400">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {obsType === 'image' ? 'JPG, PNG up to 20MB' : 'MP3, WAV up to 20MB'}
                </p>
              </>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-ink dark:text-white">Notes</span>
          <textarea 
            className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm outline-none focus:border-canopy dark:focus:border-canopy text-ink dark:text-white placeholder:text-slate-400" 
            rows="3"
            placeholder="Additional context or observations..."
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </label>
        
        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting} disabled={!file || !surveyId}>Upload File</Button>
        </div>
      </form>
    </Modal>
  );
}

export default Observations;
