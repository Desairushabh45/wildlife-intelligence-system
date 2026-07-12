export function Card({ children, className = "", noPadding = false }) {
  return (
    <div className={`rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none ${noPadding ? "" : "p-5"} ${className}`}>
      {children}
    </div>
  );
}
