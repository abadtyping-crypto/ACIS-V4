import { useEffect, useMemo, useState } from 'react';
import { getRuntimePlatform, PLATFORM_ELECTRON } from '../lib/runtimePlatform';
import { ThemeContext } from './ThemeContextValue';

const THEME_STORAGE_KEY_LEGACY = 'premium_invoice_theme';
const THEME_STORAGE_KEY_DESKTOP = 'premium_invoice_theme_desktop';
const THEME_STORAGE_KEY_MOBILE = 'premium_invoice_theme_mobile';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

const getThemeScope = () => {
  if (typeof window === 'undefined') return 'desktop';
  if (getRuntimePlatform() === PLATFORM_ELECTRON) return 'desktop';
  return window.innerWidth >= 1024 ? 'desktop' : 'mobile';
};

const getStorageKeyForScope = (scope) =>
  scope === 'mobile' ? THEME_STORAGE_KEY_MOBILE : THEME_STORAGE_KEY_DESKTOP;

const getInitialTheme = (scope) => {
  const scopedKey = getStorageKeyForScope(scope);
  const savedTheme =
    localStorage.getItem(scopedKey) ||
    localStorage.getItem(THEME_STORAGE_KEY_LEGACY);
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') return savedTheme;
  return 'system';
};

export const ThemeProvider = ({ children }) => {
  const [scope, setScope] = useState(getThemeScope);
  const [theme, setTheme] = useState(() => getInitialTheme(getThemeScope()));
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(SYSTEM_THEME_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const onChange = (event) => setSystemDark(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setScope((current) => {
        const next = getThemeScope();
        return current === next ? current : next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setTheme(getInitialTheme(scope));
  }, [scope]);

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    localStorage.setItem(getStorageKeyForScope(scope), theme);
    localStorage.setItem(THEME_STORAGE_KEY_LEGACY, theme);
  }, [scope, theme, resolvedTheme]);

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
