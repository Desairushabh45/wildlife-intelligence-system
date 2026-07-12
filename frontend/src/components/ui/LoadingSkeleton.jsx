export function LoadingSkeleton({ type = "table", rows = 5 }) {
  if (type === "card") {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm dark:shadow-none">
        <div className="mb-4 h-10 w-10 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="mb-2 h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/50"></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex h-14 items-center gap-4 px-4">
              <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800"></div>
  );
}
