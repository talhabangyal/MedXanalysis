"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  toggleTheme: () => {},
  getTokens: () => ({}),
  mounted: false,
});

const lightTokens = {
  bg: 'rgba(255,255,255,0.9)',
  text: '#0f172a',
  border: '#e6eefb',
  hoverBorder: '#3b82f6',
};

const darkTokens = {
  bg: 'rgba(8,11,21,0.85)',
  text: '#e6eefb',
  border: '#0f172a',
  hoverBorder: '#06b6d4',
};

export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialDark = stored ? stored === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', initialDark);
    } catch {
      // ignore
    }

    // avoid synchronous setState-in-effect by deferring
    setTimeout(() => setMounted(true), 0);
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // ignore
    }
    // trigger re-render for consumers
    setMounted((m) => !m);
  };

  const getTokens = () => {
    const isDarkNow = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    return isDarkNow ? darkTokens : lightTokens;
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, getTokens, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;
