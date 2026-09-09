'use client';

import { Moon, Sun } from 'lucide-react';
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem('f-commerce-theme');
  if (stored === 'dark' || stored === 'light') return stored;

  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener('f-commerce-theme-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('f-commerce-theme-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function ThemeBoundary({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => 'light' as Theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    window.localStorage.setItem('f-commerce-theme', nextTheme);
    window.dispatchEvent(new Event('f-commerce-theme-change'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('ThemeToggle must be used within ThemeBoundary');
  }

  const isDark = context.theme === 'dark';

  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface text-ink transition-colors hover:border-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
      aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
      onClick={context.toggleTheme}
    >
      {isDark ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
    </button>
  );
}
