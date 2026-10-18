"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const protectedPrefixes = ["/dashboard", "/practice", "/feedback", "/history"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    localStorage.removeItem("essaytrace_token");
    localStorage.removeItem("essaytrace_user");
    setUser(null);
    router.push("/");
  }, [router]);

  const setSession = useCallback((token: string, nextUser: User) => {
    localStorage.setItem("essaytrace_token", token);
    localStorage.setItem("essaytrace_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("essaytrace_token");
    const cached = localStorage.getItem("essaytrace_user");
    if (!token) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as User;
        queueMicrotask(() => setUser(parsed));
      } catch { localStorage.removeItem("essaytrace_user"); }
    }
    api<User>("/auth/me")
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem("essaytrace_user", JSON.stringify(fresh));
      })
      .catch(() => {
        localStorage.removeItem("essaytrace_token");
        localStorage.removeItem("essaytrace_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !user && protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, user]);

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      setLoading(false);
      router.replace("/login");
    };
    window.addEventListener("essaytrace-auth-expired", handleExpiredSession);
    return () => window.removeEventListener("essaytrace-auth-expired", handleExpiredSession);
  }, [router]);

  const value = useMemo(() => ({ user, loading, setSession, logout }), [user, loading, setSession, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
