import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Sites from "./pages/Sites.jsx";
import Surveys from "./pages/Surveys.jsx";

function App() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-ink">
      {token && <Navbar />}
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
      </Routes>
    </div>
  );
}

export default App;
