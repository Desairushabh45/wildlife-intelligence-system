import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Layers, Filter, ShieldAlert, Activity } from "lucide-react";

import api from "../api/axiosInstance.js";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom HTML Pin Markers for Habitat Grades
const createSiteIcon = (grade) => {
  let colorClass = "bg-emerald-600 border-white";
  if (grade === "C") colorClass = "bg-amber-500 border-white";
  if (grade === "D" || grade === "F") colorClass = "bg-red-600 border-white";

  return L.divIcon({
    className: "custom-site-marker",
    html: `<div class="flex items-center justify-center h-8 w-8 rounded-full ${colorClass} text-white font-extrabold text-xs shadow-lg border-2 ring-2 ring-emerald-500/20">${grade}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createDetectionIcon = (isEndangered) => {
  const colorClass = isEndangered ? "bg-red-600 border-white animate-pulse" : "bg-blue-500 border-white";
  return L.divIcon({
    className: "custom-det-marker",
    html: `<div class="h-4 w-4 rounded-full ${colorClass} shadow-md border-2"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

function MapView() {
  const [sites, setSites] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetections, setShowDetections] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState("ALL");

  useEffect(() => {
    async function fetchGisData() {
      try {
        const [sitesRes, detsRes] = await Promise.all([
          api.get("/api/gis/sites"),
          api.get("/api/gis/detections"),
        ]);
        setSites(sitesRes.data || []);
        setDetections(detsRes.data || []);
      } catch (err) {
        console.error("Failed to load GIS map data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGisData();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-4">
        <LoadingSkeleton type="card" />
      </main>
    );
  }

  // Filter sites by selected habitat grade
  const filteredSites = sites.filter((site) => {
    if (selectedGrade === "ALL") return true;
    return site.habitat_grade === selectedGrade;
  });

  // Calculate India center
  const defaultCenter = sites.length > 0 ? [sites[0].latitude, sites[0].longitude] : [20.5937, 78.9629];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink dark:text-white flex items-center gap-2">
            <MapPin className="text-emerald-500" size={28} />
            Interactive Wildlife GIS Map
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time GIS spatial tracking of monitoring sites and species detection locations.
          </p>
        </div>

        {/* Filters & Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-ink dark:text-white">
            <Filter size={14} className="text-slate-400" />
            <span>Grade Filter:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-transparent font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
            </select>
          </div>

          <button
            onClick={() => setShowDetections(!showDetections)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
              showDetections
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Layers size={14} />
            {showDetections ? "Detections Layer ON" : "Detections Layer OFF"}
          </button>
        </div>
      </div>

      {/* Map Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5">
          <span className="h-4 w-4 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center">A</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade A/B (Excellent)</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-2.5">
          <span className="h-4 w-4 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center">C</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade C (Moderate)</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 p-2.5">
          <span className="h-4 w-4 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center">D</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade D/F (Critical)</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2.5">
          <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Endangered Event</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <Card noPadding className="h-[550px] w-full rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-500/10">
        <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Monitoring Site Markers */}
          {filteredSites.map((site) => (
            <Marker
              key={site.id}
              position={[site.latitude, site.longitude]}
              icon={createSiteIcon(site.habitat_grade)}
            >
              <Popup>
                <div className="p-1 space-y-2 min-w-[200px]">
                  <div className="flex items-start justify-between border-b pb-1">
                    <h3 className="font-bold text-sm text-slate-900">{site.name}</h3>
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2 py-0.5 rounded-full">
                      Grade {site.habitat_grade}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><b>Protected Area:</b> {site.protected_area || "N/A"}</p>
                    <p><b>Habitat Type:</b> {site.habitat_type}</p>
                    <p><b>Habitat Score:</b> <span className="font-bold text-emerald-700">{site.habitat_score} / 100</span></p>
                    <p><b>Distinct Species:</b> {site.species_count}</p>
                    <p><b>Endangered Species:</b> <span className="font-bold text-red-600">{site.endangered_species_count}</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Detections Event Overlay Layer */}
          {showDetections &&
            detections.map((det) => (
              <Marker
                key={det.id}
                position={[det.latitude, det.longitude]}
                icon={createDetectionIcon(det.is_endangered)}
              >
                <Popup>
                  <div className="p-1 space-y-1">
                    <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                      {det.is_endangered && <ShieldAlert size={14} className="text-red-600" />}
                      {det.species_name}
                    </p>
                    <p className="text-[11px] text-slate-600">Site: {det.site_name}</p>
                    <p className="text-[11px] text-slate-600">Confidence: {(det.confidence * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400">Date: {new Date(det.detected_at).toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </Card>
    </main>
  );
}

export default MapView;
