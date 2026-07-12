import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, MapPinned, Radar, Bug } from "lucide-react";

import api from "../api/axiosInstance.js";
import { Card } from "../components/ui/Card.jsx";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [results, setResults] = useState({ sites: [], surveys: [], species: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setResults({ sites: [], surveys: [], species: [] });
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const [sitesRes, surveysRes, speciesRes] = await Promise.all([
          api.get("/api/sites/").catch(() => ({ data: [] })),
          api.get("/api/surveys/").catch(() => ({ data: [] })),
          api.get("/api/species/").catch(() => ({ data: [] })),
        ]);

        const q = query.toLowerCase();
        
        setResults({
          sites: sitesRes.data.filter(s => s.name.toLowerCase().includes(q) || (s.protected_area || "").toLowerCase().includes(q)),
          surveys: surveysRes.data.filter(s => (s.notes || "").toLowerCase().includes(q)),
          species: speciesRes.data.filter(s => (s.common_name || "").toLowerCase().includes(q) || (s.scientific_name || "").toLowerCase().includes(q)),
        });
      } finally {
        setLoading(false);
      }
    }
    
    performSearch();
  }, [query]);

  if (!query) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <EmptyState icon={SearchIcon} title="Search" description="Enter a search term in the navigation bar to find sites, surveys, and species." />
      </main>
    );
  }

  const hasResults = results.sites.length > 0 || results.surveys.length > 0 || results.species.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-white">Search Results</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Showing results for "{query}"</p>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" />
      ) : !hasResults ? (
        <Card noPadding>
          <EmptyState icon={SearchIcon} title="No results found" description={`We couldn't find anything matching "${query}".`} />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <ResultColumn title="Sites" icon={MapPinned} items={results.sites} linkTo="/sites" renderItem={site => (
            <div>
              <p className="font-semibold text-ink dark:text-white">{site.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{site.protected_area || "Unprotected"}</p>
            </div>
          )} />
          
          <ResultColumn title="Surveys" icon={Radar} items={results.surveys} linkTo="/surveys" renderItem={survey => (
            <div>
              <p className="font-semibold text-ink dark:text-white">{new Date(survey.start_date).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{survey.notes || "No notes"}</p>
            </div>
          )} />
          
          <ResultColumn title="Species" icon={Bug} items={results.species} linkTo="/species" renderItem={species => (
            <div>
              <p className="font-semibold text-ink dark:text-white">{species.common_name || "Unknown"}</p>
              <p className="text-xs italic text-slate-500 dark:text-slate-400">{species.scientific_name}</p>
            </div>
          )} />
        </div>
      )}
    </main>
  );
}

function ResultColumn({ title, icon: Icon, items, linkTo, renderItem }) {
  if (items.length === 0) return null;
  
  return (
    <Card noPadding className="h-fit">
      <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 font-semibold text-ink dark:text-white">
          <Icon size={18} className="text-canopy dark:text-emerald-400" />
          <h2>{title}</h2>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item, i) => (
          <Link key={item.id || i} to={linkTo} className="block px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            {renderItem(item)}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default Search;
