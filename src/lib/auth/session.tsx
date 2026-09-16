"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ApiError, apiRequest, authApi, meApi } from "./api";
import type { Profile, SessionResponse } from "./api";

type SessionStatus = "loading" | "anonymous" | "authenticated";

interface SessionContextValue {
  status: SessionStatus;
  profile: Profile | null;
  login(session: SessionResponse): Promise<void>;
  logout(): Promise<void>;
  reloadProfile(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
let accessToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;

async function refreshWithCrossTabLock(): Promise<string> {
  const perform = async () => {
    const session = await authApi.refresh();
    accessToken = session.accessToken;
    return session.accessToken;
  };

  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("buscaconcurso:auth-refresh", perform);
  }
  return perform();
}

export async function refreshSession(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = refreshWithCrossTabLock().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function withSession<T>(
  request: (token: string) => Promise<T>,
): Promise<T> {
  let token = accessToken;
  if (!token) token = await refreshSession();
  try {
    return await request(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    accessToken = null;
    token = await refreshSession();
    return request(token);
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async () => {
    const value = await withSession((token) => meApi.get(token));
    setProfile(value);
  }, []);

  useEffect(() => {
    let active = true;
    void refreshSession()
      .then(async () => {
        const value = await withSession((token) => meApi.get(token));
        if (!active) return;
        setProfile(value);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        accessToken = null;
        setProfile(null);
        setStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (session: SessionResponse) => {
    accessToken = session.accessToken;
    const value = await meApi.get(session.accessToken);
    setProfile(value);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    accessToken = null;
    setProfile(null);
    setStatus("anonymous");
    try {
      await authApi.logout();
    } catch {
      // A intenção local de sair prevalece quando a API está indisponível.
    }
  }, []);

  const reloadProfile = useCallback(async () => {
    try {
      await loadProfile();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        accessToken = null;
        setProfile(null);
        setStatus("anonymous");
        return;
      }
      throw error;
    }
  }, [loadProfile]);

  const value = useMemo(
    () => ({ status, profile, login, logout, reloadProfile }),
    [status, profile, login, logout, reloadProfile],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession deve ser usado dentro de SessionProvider.");
  return value;
}

export async function authenticatedRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  return withSession((token) =>
    apiRequest<T>(path, { ...options, accessToken: token }),
  );
}
