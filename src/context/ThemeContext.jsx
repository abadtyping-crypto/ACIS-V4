import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'premium_invoice_theme';
const ThemeContext = createContext(null);
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') return savedTheme;
  return 'system';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(SYSTEM_THEME_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const onChange = (event) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, resolvedTheme]);

  const value = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return {
      theme,
      resolvedTheme,
      isDark,
      setTheme,
      toggleTheme: () =>
        setTheme((current) => {
          const currentResolved = current === 'system' ? (systemDark ? 'dark' : 'light') : current;
          return currentResolved === 'dark' ? 'light' : 'dark';
        }),
    };
  }, [theme, resolvedTheme, systemDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};
