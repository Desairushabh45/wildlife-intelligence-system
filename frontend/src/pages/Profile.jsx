import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Calendar,
  Shield,
  MapPin,
  Leaf,
  ClipboardList,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Compass,
} from "lucide-react";

import api from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/ui/Card.jsx";

// Role-specific badges and descriptions
const ROLE_CONFIG = {
  administrator: {
    label: "Administrator",
    badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60",
    dotClass: "bg-red-500",
    description: "Full system access and user management",
  },
  wildlife_researcher: {
    label: "Wildlife Researcher",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60",
    dotClass: "bg-emerald-500",
    description: "Conducts field surveys and species identification",
  },
  conservation_officer: {
    label: "Conservation Officer",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60",
    dotClass: "bg-blue-500",
    description: "Monitors threats and recommends conservation actions",
  },
  forest_department_officer: {
    label: "Forest Department Officer",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60",
    dotClass: "bg-amber-500",
    description: "Manages protected areas and patrol planning",
  },
};

function Profile() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    surveysCount: 0,
    speciesCount: 0,
    sitesCount: 0,
  });
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [siteNames, setSiteNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const [surveysRes, speciesRes, sitesRes] = await Promise.all([
          api.get("/api/surveys/").catch(() => ({ data: [] })),
          api.get("/api/species/").catch(() => ({ data: [] })),
          api.get("/api/sites/").catch(() => ({ data: [] })),
        ]);

        const surveysData = Array.isArray(surveysRes.data) ? surveysRes.data : [];
        const speciesData = Array.isArray(speciesRes.data) ? speciesRes.data : [];
        const sitesData = Array.isArray(sitesRes.data) ? sitesRes.data : [];

        setStats({
          surveysCount: surveysData.length,
          speciesCount: speciesData.length,
          sitesCount: sitesData.length,
        });

        const mapping = {};
        sitesData.forEach((site) => {
          mapping[site.id] = site.name;
        });
        setSiteNames(mapping);

        // Sort surveys by start_date descending and take the last 3
        const sortedSurveys = [...surveysData].sort((a, b) => {
          const dateA = new Date(a.start_date || a.created_at || 0);
          const dateB = new Date(b.start_date || b.created_at || 0);
          return dateB - dateA;
        });
        setRecentSurveys(sortedSurveys.slice(0, 3));
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  if (!user) return null;

  const roleKey = user.role || "wildlife_researcher";
  const roleInfo = ROLE_CONFIG[roleKey] || {
    label: roleKey.replaceAll("_", " "),
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60",
    dotClass: "bg-emerald-500",
    description: "Platform member with field intelligence access",
  };

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const formattedJoinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  const memberSinceMonthYear = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 space-y-8">
      {/* ── 1. PROFILE HEADER (Hero Section) ────────────────────────── */}
      <Card noPadding className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/40">
        {/* Forest nature cover banner */}
        <div
          className="h-44 sm:h-52 w-full relative overflow-hidden flex items-end p-6"
          style={{
            background: "linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #40916c 100%)",
          }}
        >
          {/* Subtle nature mesh texture overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-semibold border border-white/20 shadow-sm">
            <Sparkles size={14} className="text-emerald-300" />
            <span>Wildlife Intelligence System</span>
          </div>
        </div>

        {/* Profile identity strip */}
        <div className="px-6 pb-6 pt-0 relative bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Large avatar circle with user initials */}
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl bg-gradient-to-br from-[#2d6a4f] to-[#1a472a] text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold shrink-0 ring-2 ring-emerald-500/20">
                {initials}
              </div>

              {/* Name & Role badge */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
                    {user.full_name || "Unknown User"}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${roleInfo.badgeClass}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${roleInfo.dotClass}`} />
                    {roleInfo.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {roleInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Quick contact / metadata bar */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <Mail size={16} className="text-[#2d6a4f] dark:text-emerald-400" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{user.email}</span>
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-[#2d6a4f] dark:text-emerald-400" />
              <span>Joined {formattedJoinDate}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Active Account
            </span>
          </div>
        </div>
      </Card>

      {/* ── 2. STATS ROW (4 Cards in a Row) ────────────────────────── */}
      <section aria-label="User platform stats">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Surveys */}
          <Card className="relative overflow-hidden group hover:border-[#2d6a4f]/40 dark:hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Total Surveys Conducted
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d6a4f] dark:text-emerald-400">
                <ClipboardList size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-ink dark:text-white tracking-tight">
                {loading ? <span className="animate-pulse">--</span> : stats.surveysCount}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Field surveillance sessions
              </p>
            </div>
          </Card>

          {/* Card 2: Species */}
          <Card className="relative overflow-hidden group hover:border-[#2d6a4f]/40 dark:hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Species Monitored
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d6a4f] dark:text-emerald-400">
                <Leaf size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-ink dark:text-white tracking-tight">
                {loading ? <span className="animate-pulse">--</span> : stats.speciesCount}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Cataloged wildlife species
              </p>
            </div>
          </Card>

          {/* Card 3: Sites */}
          <Card className="relative overflow-hidden group hover:border-[#2d6a4f]/40 dark:hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Sites Managed
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d6a4f] dark:text-emerald-400">
                <MapPin size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-ink dark:text-white tracking-tight">
                {loading ? <span className="animate-pulse">--</span> : stats.sitesCount}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Active monitoring reserves
              </p>
            </div>
          </Card>

          {/* Card 4: Member Since */}
          <Card className="relative overflow-hidden group hover:border-[#2d6a4f]/40 dark:hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Member Since
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d6a4f] dark:text-emerald-400">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-ink dark:text-white tracking-tight truncate">
                {memberSinceMonthYear}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Verified platform tenure
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ── 3. RECENT ACTIVITY & 4. ACCOUNT DETAILS ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── 3. RECENT ACTIVITY SECTION (7 cols on lg) ─────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink dark:text-white tracking-tight">
                Recent Field Activity
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Latest field surveys and surveillance sessions across monitoring stations
              </p>
            </div>
            <Link
              to="/surveys"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#2d6a4f] hover:text-[#1a472a] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              <span>View all</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <Card className="p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-4">
                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentSurveys.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Compass size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-medium text-sm">No recent field activity found.</p>
                <p className="text-xs text-slate-400 mt-1">Surveys conducted will appear here.</p>
              </div>
            ) : (
              recentSurveys.map((survey) => {
                const siteName = siteNames[survey.site_id] || "Field Monitoring Site";
                const surveyDate = survey.start_date
                  ? new Date(survey.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Date not recorded";

                return (
                  <div
                    key={survey.id}
                    className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d6a4f] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
                      <Compass size={20} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-ink dark:text-white truncate">
                          {siteName}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {surveyDate}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                        {survey.notes || "Standard periodic biodiversity surveillance and habitat assessment."}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>

        {/* ── 4. ACCOUNT DETAILS SECTION (5 cols on lg) ─────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-ink dark:text-white tracking-tight">
              Account Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Verified security credentials & operational permissions
            </p>
          </div>

          <Card className="space-y-5 p-6 divide-y divide-slate-100 dark:divide-slate-800">
            {/* Email */}
            <div className="flex items-start justify-between gap-4 pt-0">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Email Address
                </span>
                <p className="text-sm font-semibold text-ink dark:text-white break-all">
                  {user.email}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                <Mail size={16} />
              </div>
            </div>

            {/* Role with description */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assigned Role
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${roleInfo.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${roleInfo.dotClass}`} />
                    {roleInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {roleInfo.description}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                <Shield size={16} />
              </div>
            </div>

            {/* Account status: Active (green dot) */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Account Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={16} />
              </div>
            </div>

            {/* Member since date */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Member Since Date
                </span>
                <p className="text-sm font-semibold text-ink dark:text-white">
                  {formattedJoinDate}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                <Calendar size={16} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default Profile;
