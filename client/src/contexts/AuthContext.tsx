import { createContext, useCallback, useEffect, useState } from "react";
import { getApiBaseUrl, SESSION_INVALIDATED_EVENT } from "../services/apiClient";

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  token: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  offline: boolean;
  apiBaseUrl: string;
  login: (session: AuthSession) => void;
  logout: () => void;
  enterOffline: () => boolean;
  setApiBaseUrl: (url: string) => void;
}

const SESSION_KEY = "chronos:session";
const API_URL_KEY = "chronos:apiUrl";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthSession;
        if (parsed.token && parsed.userId) setSession(parsed);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    const clearInvalidSession = () => {
      setSession(null);
      setOffline(false);
    };
    window.addEventListener(SESSION_INVALIDATED_EVENT, clearInvalidSession);
    return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, clearInvalidSession);
  }, []);

  const login = useCallback((s: AuthSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    setOffline(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setOffline(false);
  }, []);

  const enterOffline = useCallback((): boolean => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed.token && parsed.userId) {
        setSession(parsed);
        setOffline(true);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  const setApiBaseUrl = useCallback((url: string) => {
    localStorage.setItem(API_URL_KEY, url);
    setApiBaseUrlState(url);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, loading, offline, apiBaseUrl, login, logout, enterOffline, setApiBaseUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
}
