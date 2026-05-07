import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest } from "../services/authService";
import { DEFAULT_API_BASE_URL } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "maltepe-auth";
const API_STORAGE_KEY = "maltepe-api-base-url";
const LEGACY_API_BASE_URLS = new Set(["http://localhost:5000", "https://localhost:7269", "http://localhost:59455"]);

function getInitialApiBaseUrl() {
  const storedUrl = localStorage.getItem(API_STORAGE_KEY);

  if (!storedUrl || LEGACY_API_BASE_URLS.has(storedUrl)) {
    return DEFAULT_API_BASE_URL;
  }

  return storedUrl;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [apiBaseUrl, setApiBaseUrlState] = useState(getInitialApiBaseUrl);

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(API_STORAGE_KEY, apiBaseUrl);
  }, [apiBaseUrl]);

  const login = async (credentials) => {
    const response = await loginRequest(credentials, apiBaseUrl);
    setAuth(response);
    return response;
  };

  const logout = () => setAuth(null);

  const value = useMemo(
    () => ({
      auth,
      user: auth
        ? {
            id: auth.userId,
            fullName: auth.fullName || auth.name,
            name: auth.name || auth.fullName,
            role: auth.role,
            clubId: auth.clubId ?? null,
            managedClubs: Array.isArray(auth.managedClubs) ? auth.managedClubs : [],
            token: auth.token
          }
        : null,
      isAuthenticated: Boolean(auth?.token),
      apiBaseUrl,
      setApiBaseUrl: setApiBaseUrlState,
      login,
      logout
    }),
    [auth, apiBaseUrl]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
