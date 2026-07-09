import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api from "../api/axiosInstance.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("wildlife_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("wildlife_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/api/auth/me");
        if (!cancelled) {
          setUser(data);
          localStorage.setItem("wildlife_user", JSON.stringify(data));
        }
      } catch {
        logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function persistAuth(nextToken, nextUser) {
    localStorage.setItem("wildlife_token", nextToken);
    localStorage.setItem("wildlife_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    persistAuth(data.access_token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("wildlife_token");
    localStorage.removeItem("wildlife_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, login, logout }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
