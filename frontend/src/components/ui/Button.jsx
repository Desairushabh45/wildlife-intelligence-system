import { Loader2 } from "lucide-react";

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  loading = false, 
  disabled = false, 
  className = "", 
  type = "button", 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70";
  
  const variants = {
    primary: "bg-canopy text-white shadow-sm hover:bg-[#185a44] focus:ring-canopy dark:bg-emerald-600 dark:hover:bg-emerald-700",
    secondary: "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-slate-300",
    danger: "bg-red-600 dark:bg-red-700 text-white shadow-sm hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-600",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-ink dark:hover:text-white focus:ring-slate-300",
    dark: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus:ring-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700",
    white: "bg-white text-slate-900 shadow-sm border border-slate-200 hover:bg-slate-50 focus:ring-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
  };
  
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
