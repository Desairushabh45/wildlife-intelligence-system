import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Breadcrumbs } from "./components/Breadcrumbs.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Sites from "./pages/Sites.jsx";
import Species from "./pages/Species.jsx";
import Surveys from "./pages/Surveys.jsx";
import Profile from "./pages/Profile.jsx";
import Search from "./pages/Search.jsx";
import Observations from "./pages/Observations.jsx";

function App() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-ink dark:bg-slate-900 dark:text-slate-200 transition-colors duration-200">
      {token && <Navbar />}
      
      {token && (
        <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-6">
          <Breadcrumbs />
        </div>
      )}

      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites"
          element={
            <ProtectedRoute>
              <Sites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/surveys"
          element={
            <ProtectedRoute>
              <Surveys />
            </ProtectedRoute>
          }
        />
        <Route
          path="/species"
          element={
            <ProtectedRoute>
              <Species />
            </ProtectedRoute>
          }
        />
        <Route
          path="/observations"
          element={
            <ProtectedRoute>
              <Observations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
