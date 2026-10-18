"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("essaytrace_theme");
    const initial: Theme = saved === "light" ? "light" : "dark";
    applyTheme(initial);
    queueMicrotask(() => setTheme(initial));
  }, []);

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("essaytrace_theme", next);
      applyTheme(next);
      return next;
    }),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

