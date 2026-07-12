import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="mb-4 flex items-center text-sm font-medium text-slate-500" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center hover:text-ink transition-colors">
        <Home size={16} />
      </Link>
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const to = `/${paths.slice(0, index + 1).join("/")}`;
        const name = path.charAt(0).toUpperCase() + path.slice(1);

        return (
          <div key={path} className="flex items-center">
            <ChevronRight size={16} className="mx-1 text-slate-400" />
            {isLast ? (
              <span className="text-ink" aria-current="page">
                {name}
              </span>
            ) : (
              <Link to={to} className="hover:text-ink transition-colors">
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
