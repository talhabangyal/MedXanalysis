"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "./theme-provider";

// ThemeToggle avoids server/client attribute mismatches by
// reading and mutating the DOM theme only after mount.
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize document theme on mount.
    try {
      const storedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialDark = storedTheme ? storedTheme === "dark" : prefersDark;
      document.documentElement.classList.toggle("dark", initialDark);
    } catch {
      // ignore
    }

    // mark mounted asynchronously so we avoid synchronous setState-in-effect
    setTimeout(() => setMounted(true), 0);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore storage errors
    }

    // force a re-render so icon updates
    setMounted((m) => !m);
  };

  const ctx = useTheme();
  const { getTokens, mounted: ctxMounted, toggleTheme: providerToggle } = ctx || {};
  const tokens = (ctxMounted || mounted) ? (getTokens ? getTokens() : {}) : {};

  const style = {
    backgroundColor: tokens.bg || 'rgba(255,255,255,0.9)',
    color: tokens.text || '#0f172a',
    borderColor: tokens.border || '#e6eefb',
  };

  const isDarkNow = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <button
      type="button"
      onClick={() => {
        // prefer provider toggle when available
        if (providerToggle) providerToggle();
        else toggleTheme();
      }}
      aria-label="Toggle theme"
      title="Toggle theme"
      style={style}
      className="fixed bottom-4 left-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-slate-900/10 backdrop-blur-xl transition hover:-translate-y-0.5"
    >
      {mounted ? (isDarkNow ? <Icon icon="solar:sun-2-linear" width={22} /> : <Icon icon="solar:moon-linear" width={22} />) : <Icon icon="solar:moon-linear" width={22} />}
    </button>
  );
}
