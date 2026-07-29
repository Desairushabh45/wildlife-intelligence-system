import {
  Bug, Image, Music, Plus, Search, Trash2, X,
  FileAudio, FileImage, ExternalLink, Zap, CheckCircle,
  Loader2, AlertTriangle, Box, Eye, EyeOff,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

// ── Confidence badge colour ───────────────────────────────────────────────
function confidenceColor(conf) {
  if (conf >= 0.8) return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30";
  if (conf >= 0.6) return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/30";
  return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-red-500/30";
}

// ── Source badge ──────────────────────────────────────────────────────────
const SOURCE_META = {
  yolo:    { label: "YOLOv8",  cls: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" },
  birdnet: { label: "BirdNET", cls: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300" },
  yamnet:  { label: "YAMNet",  cls: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" },
};

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] ?? { label: source, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

// ── Canvas bounding-box overlay ───────────────────────────────────────────
function getBBoxColor(conf) {
  if (conf >= 0.8) return "#22c55e"; // green
  if (conf >= 0.6) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function BBoxCanvas({ dets, imgW, imgH, displayW, displayH }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgW || !imgH) return;
    const ctx = canvas.getContext("2d");
    canvas.width = displayW;
    canvas.height = displayH;
    ctx.clearRect(0, 0, displayW, displayH);

    const scaleX = displayW / imgW;
    const scaleY = displayH / imgH;

    dets.forEach((det) => {
      if (!det.bbox) return;
      const { x1, y1, x2, y2 } = det.bbox;
      const color = getBBoxColor(det.confidence);

      const rx1 = x1 * scaleX;
      const ry1 = y1 * scaleY;
      const rw  = (x2 - x1) * scaleX;
      const rh  = (y2 - y1) * scaleY;

      // Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx1, ry1, rw, rh);

      // Label background
      const label = `${det.species_name || det.raw_label || "?"} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 11px sans-serif";
      const textW = ctx.measureText(label).width;
      const labelY = ry1 > 20 ? ry1 - 4 : ry1 + rh + 16;
      ctx.fillStyle = color;
      ctx.fillRect(rx1, labelY - 13, textW + 8, 17);

      // Label text
      ctx.fillStyle = "#fff";
      ctx.fillText(label, rx1 + 4, labelY);
    });
  }, [dets, imgW, imgH, displayW, displayH]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

// ── Image cell with optional bbox overlay ─────────────────────────────────
function ImageCell({ src, dets }) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [imgNaturalW, setImgNaturalW] = useState(0);
  const [imgNaturalH, setImgNaturalH] = useState(0);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);

  const hasBbox = dets.some(d => d.bbox);

  const measureDisplay = useCallback(() => {
    if (wrapperRef.current) {
      setDisplaySize({
        w: wrapperRef.current.offsetWidth,
        h: wrapperRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    measureDisplay();
    const ro = new ResizeObserver(measureDisplay);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [measureDisplay]);

  const handleImageLoad = (e) => {
    setImgNaturalW(e.target.naturalWidth);
    setImgNaturalH(e.target.naturalHeight);
    measureDisplay();
  };

  return (
    <div ref={wrapperRef} className="w-full h-full relative">
      <img
        ref={imgRef}
        src={src}
        alt="Observation"
        className="object-cover w-full h-full"
        onLoad={handleImageLoad}
      />
      {hasBbox && showBoxes && (
        <BBoxCanvas
          dets={dets}
          imgW={imgNaturalW}
          imgH={imgNaturalH}
          displayW={displaySize.w}
          displayH={displaySize.h}
        />
      )}
      {hasBbox && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowBoxes(v => !v); }}
          className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm hover:bg-black/80 transition"
          title={showBoxes ? "Hide bounding boxes" : "Show bounding boxes"}
        >
          {showBoxes ? <EyeOff size={11} /> : <Eye size={11} />}
          {showBoxes ? "Hide Boxes" : "Show Boxes"}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
function Observations() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [observations, setObservations] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingObservation, setDeletingObservation] = useState(null);

  // detection state: { [obsId]: DetectionOut[] }
  const [detectionMap, setDetectionMap] = useState({});
  // which obs is currently running detection
  const [detectingId, setDetectingId] = useState(null);

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
      // Pre-fetch existing detections for all observations in parallel
      await prefetchDetections(obsRes.data);
    } catch {
      addToast("Failed to load observations.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function prefetchDetections(obs) {
    const results = await Promise.allSettled(
      obs.map(o => api.get(`/api/observations/${o.id}/detections`))
    );
    const map = {};
    obs.forEach((o, i) => {
      const r = results[i];
      if (r.status === "fulfilled") {
        map[o.id] = r.value.data;
      }
    });
    setDetectionMap(map);
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

  async function runDetection(obs) {
    if (detectingId) return;
    setDetectingId(obs.id);
    try {
      const res = await api.post(`/api/observations/${obs.id}/detect`);
      const dets = res.data;
      setDetectionMap(prev => ({ ...prev, [obs.id]: [...(prev[obs.id] || []), ...dets] }));
      if (dets.length === 0) {
        addToast(
          obs.observation_type === "image"
            ? "No species detected (weights file may not be loaded yet — check backend logs)."
            : "No species detected in audio (BirdNET + YAMNet both found nothing).",
          "error"
        );
      } else {
        const src = dets[0]?.detection_source;
        const srcLabel = src ? ` via ${SOURCE_META[src]?.label ?? src}` : "";
        addToast(`Detected ${dets.length} result${dets.length !== 1 ? "s" : ""}${srcLabel}.`);
      }
    } catch (err) {
      addToast(err.response?.data?.detail || "Detection failed.", "error");
    } finally {
      setDetectingId(null);
    }
  }

  const canDelete = (obs) => isAdmin || obs.uploaded_by === user.id;
  const hasDetections = (obs) => (detectionMap[obs.id] || []).length > 0;

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
          {filteredObservations.map(obs => {
            const dets = detectionMap[obs.id] || [];
            const isDetecting = detectingId === obs.id;
            const isImage = obs.observation_type === "image";
            return (
              <Card key={obs.id} noPadding className="overflow-hidden flex flex-col hover:shadow-md transition-shadow group relative">
                {/* Media area */}
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                  {isImage ? (
                    <ImageCell
                      src={`${BACKEND_URL}${obs.file_path}`}
                      dets={hasDetections(obs) ? dets : []}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 dark:bg-slate-900 text-white gap-2 p-4">
                      <Music size={32} className="text-emerald-400" />
                      <audio controls src={`${BACKEND_URL}${obs.file_path}`} className="w-full h-8 mt-2 opacity-80 hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {canDelete(obs) && (
                    <button
                      onClick={() => setDeletingObservation(obs)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"
                      title="Delete Observation"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {isImage ? <FileImage size={10} /> : <FileAudio size={10} />}
                      {obs.observation_type}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(obs.captured_at || obs.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink dark:text-slate-200 line-clamp-2 mb-2 flex-1">
                    {obs.notes || "No notes provided."}
                  </p>

                  {/* Detection results panel */}
                  {dets.length > 0 && (
                    <div className="mb-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckCircle size={10} className="text-emerald-500" />
                          Species Detection Results
                        </p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dets.map(det => {
                          const pct = Math.round(det.confidence * 100);
                          const barColor = pct >= 80
                            ? "bg-emerald-400 dark:bg-emerald-500"
                            : pct >= 60
                              ? "bg-amber-400 dark:bg-amber-500"
                              : "bg-red-400 dark:bg-red-500";
                          const barTrack = pct >= 80
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : pct >= 60
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : "bg-red-100 dark:bg-red-900/30";
                          return (
                            <div key={det.id} className="px-3 py-2.5 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-ink dark:text-white truncate leading-tight">
                                  {det.species_name || det.raw_label || "Unknown"}
                                </p>
                                {det.species_scientific_name && (
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate leading-tight mt-0.5">
                                    {det.species_scientific_name}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className={`w-20 h-2.5 rounded-full ${barTrack} overflow-hidden`}>
                                  <div
                                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right tabular-nums">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Source badge footer */}
                      {dets[0]?.detection_source && (
                        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                          <SourceBadge source={dets[0].detection_source} />
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">AI Model</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Run Detection button — always visible */}
                  <button
                    onClick={() => runDetection(obs)}
                    disabled={isDetecting || (!!detectingId && detectingId !== obs.id)}
                    className={`
                      w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all border-2
                      ${isDetecting
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-wait"
                        : (!!detectingId && detectingId !== obs.id)
                          ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:shadow-sm"
                      }
                    `}
                    title={isDetecting ? "Detection in progress..." : "Run AI species detection"}
                  >
                    {isDetecting ? (
                      <><Loader2 size={14} className="animate-spin" />Analysing…</>
                    ) : (
                      <><Zap size={14} />Run Detection</>
                    )}
                  </button>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate" title="Uploader">
                      By: {obs.uploaded_by_user?.full_name || obs.uploaded_by.substring(0, 8)}
                    </span>
                    <a href={`${BACKEND_URL}${obs.file_path}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-canopy font-medium transition-colors">
                      Open <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
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
