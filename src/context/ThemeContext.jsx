import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {}
});

const THEME_KEY = 'app-theme';
const THEME_RESET_KEY = 'app-theme-reset';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (!localStorage.getItem(THEME_RESET_KEY)) {
      localStorage.removeItem(THEME_KEY);
      localStorage.setItem(THEME_RESET_KEY, '1');
    }
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const triggerTransition = () => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    // Remove after the animation completes to avoid permanent perf cost
    setTimeout(() => root.classList.remove('theme-transition'), 500);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => {
        triggerTransition();
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
