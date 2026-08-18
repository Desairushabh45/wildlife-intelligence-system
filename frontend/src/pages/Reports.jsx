import { useEffect, useState } from "react";
import { FileText, Download, FileSpreadsheet, Calendar, MapPinned, Filter, CheckCircle } from "lucide-react";

import api from "../api/axiosInstance.js";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";

function Reports() {
  const [sites, setSites] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [excelSiteId, setExcelSiteId] = useState("all");
  const [excelDateFrom, setExcelDateFrom] = useState("");
  const [excelDateTo, setExcelDateTo] = useState("");

  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [sitesRes, surveysRes] = await Promise.all([
          api.get("/api/sites/"),
          api.get("/api/surveys/"),
        ]);
        const siteList = sitesRes.data || [];
        const surveyList = surveysRes.data || [];
        setSites(siteList);
        setSurveys(surveyList);

        if (surveyList.length > 0) setSelectedSurveyId(surveyList[0].id);
        if (siteList.length > 0) setSelectedSiteId(siteList[0].id);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  const triggerFileDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSurveyPdf = async () => {
    if (!selectedSurveyId) return;
    setDownloading("survey_pdf");
    setMessage(null);
    try {
      const response = await api.get(`/api/reports/survey/${selectedSurveyId}/pdf`, {
        responseType: "blob",
      });
      triggerFileDownload(new Blob([response.data], { type: "application/pdf" }), `survey_report_${selectedSurveyId.substring(0, 8)}.pdf`);
      setMessage("Survey PDF downloaded successfully!");
    } catch (err) {
      console.error("Survey PDF download failed:", err);
      alert("Failed to download Survey PDF report.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadBiodiversityPdf = async () => {
    if (!selectedSiteId) return;
    setDownloading("bio_pdf");
    setMessage(null);
    try {
      const response = await api.get(`/api/reports/site/${selectedSiteId}/biodiversity/pdf`, {
        responseType: "blob",
      });
      triggerFileDownload(new Blob([response.data], { type: "application/pdf" }), `biodiversity_report_${selectedSiteId.substring(0, 8)}.pdf`);
      setMessage("Biodiversity Assessment PDF downloaded successfully!");
    } catch (err) {
      console.error("Biodiversity PDF download failed:", err);
      alert("Failed to download Biodiversity PDF report.");
    } finally {
      setDownloading(null);
    }
  };

  const handleExportExcel = async () => {
    setDownloading("excel");
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (excelSiteId && excelSiteId !== "all") params.append("site_id", excelSiteId);
      if (excelDateFrom) params.append("date_from", excelDateFrom);
      if (excelDateTo) params.append("date_to", excelDateTo);

      const response = await api.get(`/api/reports/detections/excel?${params.toString()}`, {
        responseType: "blob",
      });
      triggerFileDownload(
        new Blob([response.data], { mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "wildlife_detections_export.xlsx"
      );
      setMessage("Excel detections dataset exported successfully!");
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Failed to export Excel dataset.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-4">
        <LoadingSkeleton type="card" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
          <FileText className="text-emerald-500" size={28} />
          Reports & Export Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate official PDF reports for field surveys, habitat assessment, and export raw detection records to Excel.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold animate-fade-in">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Survey Expedition PDF */}
        <Card className="flex flex-col justify-between p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink dark:text-white">Field Survey PDF Report</h2>
                <p className="text-xs text-slate-400">PDF with survey metadata, observations, and species detections.</p>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Select Survey Expedition</label>
              <select
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm font-semibold text-ink dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    Survey {s.id.substring(0, 8)} — {new Date(s.start_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleDownloadSurveyPdf}
            disabled={downloading === "survey_pdf" || !selectedSurveyId}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 text-sm transition-all shadow-md"
          >
            <Download size={18} />
            {downloading === "survey_pdf" ? "Generating Survey PDF..." : "Download Survey Report (PDF)"}
          </button>
        </Card>

        {/* Card 2: Biodiversity & Habitat Score PDF */}
        <Card className="flex flex-col justify-between p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                <MapPinned size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink dark:text-white">Site Biodiversity Assessment PDF</h2>
                <p className="text-xs text-slate-400">PDF with Shannon index, habitat score grade, breakdown & recommendations.</p>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Select Monitoring Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm font-semibold text-ink dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.protected_area || "Unprotected"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleDownloadBiodiversityPdf}
            disabled={downloading === "bio_pdf" || !selectedSiteId}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 text-sm transition-all shadow-md"
          >
            <Download size={18} />
            {downloading === "bio_pdf" ? "Generating Assessment PDF..." : "Download Biodiversity Report (PDF)"}
          </button>
        </Card>
      </div>

      {/* Card 3: Excel Detections Dataset Export */}
      <Card className="p-6 space-y-6 border-2 border-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <FileSpreadsheet size={26} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink dark:text-white">Raw Detection Records Export (Excel .xlsx)</h2>
            <p className="text-xs text-slate-400">Filter and export complete raw detection datasets with confidence and taxonomic details.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Monitoring Site Filter</label>
            <select
              value={excelSiteId}
              onChange={(e) => setExcelSiteId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-sm font-semibold text-ink dark:text-white"
            >
              <option value="all">All Monitoring Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">From Date</label>
            <input
              type="date"
              value={excelDateFrom}
              onChange={(e) => setExcelDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm font-semibold text-ink dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase">To Date</label>
            <input
              type="date"
              value={excelDateTo}
              onChange={(e) => setExcelDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-sm font-semibold text-ink dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={downloading === "excel"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-3 text-sm transition-all shadow-md"
        >
          <FileSpreadsheet size={18} />
          {downloading === "excel" ? "Building Excel File..." : "Export Detections (Excel)"}
        </button>
      </Card>
    </main>
  );
}

export default Reports;
