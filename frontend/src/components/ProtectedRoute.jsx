import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="px-6 py-10 text-sm text-slate-600">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
