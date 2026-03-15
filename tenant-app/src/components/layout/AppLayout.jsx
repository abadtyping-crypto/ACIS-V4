import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTenant } from '../../context/useTenant';
import useIsDesktopLayout from '../../hooks/useIsDesktopLayout';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import RecycleBinSidebar from '../portal/RecycleBinSidebar';
import { RecycleBinProvider } from '../../context/RecycleBinContext';
import { getRuntimePlatform, PLATFORM_ELECTRON } from '../../lib/runtimePlatform';
import { DESKTOP_APPEARANCE_EVENT, readDesktopAppearance } from '../../lib/mobileAppearance';
import { useTheme } from '../../context/useTheme';

const isHexColor = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || '').trim());

const toHex6 = (value, fallback) => {
  const next = String(value || '').trim();
  if (!isHexColor(next)) return fallback;
  if (next.length === 7) return next.toUpperCase();
  const chars = next.slice(1).split('');
  return `#${chars.map((char) => `${char}${char}`).join('')}`.toUpperCase();
};

const hexToRgba = (hex, alpha = 1) => {
  const safe = toHex6(hex, '#E67E22').slice(1);
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyBrandTheme = (themeConfig) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (themeConfig.bg) root.style.setProperty('--c-bg', themeConfig.bg);
  if (themeConfig.surface) root.style.setProperty('--c-surface', themeConfig.surface);
  if (themeConfig.panel) root.style.setProperty('--c-panel', themeConfig.panel);
  if (themeConfig.border) root.style.setProperty('--c-border', themeConfig.border);
  if (themeConfig.text) root.style.setProperty('--c-text', themeConfig.text);
  if (themeConfig.muted) root.style.setProperty('--c-muted', themeConfig.muted);
  root.style.setProperty('--c-accent', themeConfig.primary);
  root.style.setProperty('--c-accent-2', themeConfig.secondary);
  root.style.setProperty('--c-accent-3', themeConfig.tertiary);
  root.style.setProperty('--c-on-accent', themeConfig.textOnAccent);
  root.style.setProperty('--c-ring', hexToRgba(themeConfig.primary, 0.24));
  root.style.setProperty(
    '--brand-gradient',
    themeConfig.gradientEnabled
      ? `linear-gradient(125deg, ${themeConfig.primary} 0%, ${themeConfig.secondary} 54%, ${themeConfig.tertiary} 100%)`
      : themeConfig.primary,
  );
  if (themeConfig.glassBg) root.style.setProperty('--glass-bg', themeConfig.glassBg);
  if (themeConfig.glassBorder) root.style.setProperty('--glass-border', themeConfig.glassBorder);
  if (themeConfig.glassShadow) root.style.setProperty('--glass-shadow', themeConfig.glassShadow);
};

const resetDesktopThemeOverrides = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  [
    '--c-bg',
    '--c-surface',
    '--c-panel',
    '--c-border',
    '--c-text',
    '--c-muted',
    '--glass-bg',
    '--glass-border',
    '--glass-shadow',
  ].forEach((key) => root.style.removeProperty(key));
};

const DESKTOP_APPEARANCE_THEME_MAP = {
  aurora: {
    light: {
      bg: '#FFF7EE',
      surface: '#FFFFFF',
      panel: '#FFF1E0',
      border: '#E7CFB1',
      text: '#4B2B16',
      muted: '#87634A',
      primary: '#E67E22',
      secondary: '#F59E0B',
      tertiary: '#E6B054',
      textOnAccent: '#FFFFFF',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,240,220,0.32))',
      glassBorder: 'rgba(255,255,255,0.78)',
      glassShadow: '0 18px 48px -30px rgba(230,126,34,0.28)',
    },
    dark: {
      bg: '#1E0F08',
      surface: '#2B1710',
      panel: '#3B2218',
      border: '#6B4531',
      text: '#FFF4EA',
      muted: '#E2BE9F',
      primary: '#F39C12',
      secondary: '#F97316',
      tertiary: '#FBBF24',
      textOnAccent: '#251108',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(59,34,24,0.72), rgba(30,15,8,0.52))',
      glassBorder: 'rgba(255,214,176,0.2)',
      glassShadow: '0 18px 48px -30px rgba(249,115,22,0.3)',
    },
  },
  midnight: {
    light: {
      bg: '#F8F0F7',
      surface: '#FFFFFF',
      panel: '#F3E8F0',
      border: '#DCC7D5',
      text: '#341E34',
      muted: '#785D78',
      primary: '#A855F7',
      secondary: '#C084FC',
      tertiary: '#E879F9',
      textOnAccent: '#FFFFFF',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(255,255,255,0.64), rgba(245,232,240,0.34))',
      glassBorder: 'rgba(255,255,255,0.74)',
      glassShadow: '0 18px 48px -30px rgba(168,85,247,0.26)',
    },
    dark: {
      bg: '#1E1021',
      surface: '#2A1630',
      panel: '#392044',
      border: '#5F3C69',
      text: '#FBF3FF',
      muted: '#D8B7E0',
      primary: '#C084FC',
      secondary: '#E879F9',
      tertiary: '#F0ABFC',
      textOnAccent: '#1A0B1D',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(57,32,68,0.72), rgba(30,16,33,0.54))',
      glassBorder: 'rgba(241,199,255,0.2)',
      glassShadow: '0 18px 48px -30px rgba(232,121,249,0.28)',
    },
  },
  ocean: {
    light: {
      bg: '#F9F3E8',
      surface: '#FFFFFF',
      panel: '#F6ECDD',
      border: '#DFCFB7',
      text: '#433222',
      muted: '#7D6754',
      primary: '#B45309',
      secondary: '#D97706',
      tertiary: '#F59E0B',
      textOnAccent: '#FFFFFF',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(255,255,255,0.62), rgba(246,234,216,0.34))',
      glassBorder: 'rgba(255,255,255,0.76)',
      glassShadow: '0 18px 48px -30px rgba(180,83,9,0.24)',
    },
    dark: {
      bg: '#17110A',
      surface: '#261B12',
      panel: '#352519',
      border: '#5E4631',
      text: '#FFF6EE',
      muted: '#DCC8B2',
      primary: '#D97706',
      secondary: '#EA580C',
      tertiary: '#F59E0B',
      textOnAccent: '#1B1209',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(53,37,25,0.74), rgba(23,17,10,0.56))',
      glassBorder: 'rgba(244,200,153,0.18)',
      glassShadow: '0 18px 48px -30px rgba(217,119,6,0.26)',
    },
  },
  sunrise: {
    light: {
      bg: '#FFF4EA',
      surface: '#FFFFFF',
      panel: '#FFF0E1',
      border: '#EBCDB5',
      text: '#4E2A18',
      muted: '#8C6449',
      primary: '#F97316',
      secondary: '#FB7185',
      tertiary: '#FBBF24',
      textOnAccent: '#FFFFFF',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,236,219,0.3))',
      glassBorder: 'rgba(255,255,255,0.76)',
      glassShadow: '0 18px 48px -30px rgba(249,115,22,0.3)',
    },
    dark: {
      bg: '#2A1018',
      surface: '#3A1722',
      panel: '#4B2230',
      border: '#74435A',
      text: '#FFF2E8',
      muted: '#E1B9A4',
      primary: '#FB923C',
      secondary: '#FB7185',
      tertiary: '#FBBF24',
      textOnAccent: '#2A1018',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(78,32,43,0.72), rgba(42,16,24,0.56))',
      glassBorder: 'rgba(255,214,188,0.2)',
      glassShadow: '0 18px 48px -30px rgba(251,146,60,0.34)',
    },
  },
  ember: {
    light: {
      bg: '#FFF1ED',
      surface: '#FFFFFF',
      panel: '#FFE8E1',
      border: '#E7C3B7',
      text: '#4C211A',
      muted: '#8A5C52',
      primary: '#EF4444',
      secondary: '#F97316',
      tertiary: '#F59E0B',
      textOnAccent: '#FFFFFF',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(255,255,255,0.62), rgba(255,236,230,0.3))',
      glassBorder: 'rgba(255,255,255,0.76)',
      glassShadow: '0 18px 48px -30px rgba(239,68,68,0.3)',
    },
    dark: {
      bg: '#1A0D0A',
      surface: '#2A1410',
      panel: '#3A1D16',
      border: '#5E362E',
      text: '#FFF3EF',
      muted: '#E0B8AF',
      primary: '#FB7185',
      secondary: '#F97316',
      tertiary: '#FBBF24',
      textOnAccent: '#220C08',
      gradientEnabled: true,
      glassBg: 'linear-gradient(150deg, rgba(58,29,22,0.72), rgba(26,13,10,0.56))',
      glassBorder: 'rgba(255,215,201,0.18)',
      glassShadow: '0 18px 48px -30px rgba(251,113,133,0.32)',
    },
  },
};

const AppLayout = () => {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktopLayout();
  const runtimePlatform = getRuntimePlatform();
  const useDesktopLayout = runtimePlatform === PLATFORM_ELECTRON ? true : isDesktop;
  const [desktopAppearance, setDesktopAppearance] = useState(() => readDesktopAppearance());
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const sync = () => setDesktopAppearance(readDesktopAppearance());
    window.addEventListener('storage', sync);
    window.addEventListener(DESKTOP_APPEARANCE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(DESKTOP_APPEARANCE_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!useDesktopLayout) {
      resetDesktopThemeOverrides();
    }

    const defaults = useDesktopLayout
      ? (DESKTOP_APPEARANCE_THEME_MAP[desktopAppearance.wallpaper]?.[resolvedTheme === 'dark' ? 'dark' : 'light']
        || DESKTOP_APPEARANCE_THEME_MAP.aurora[resolvedTheme === 'dark' ? 'dark' : 'light'])
      : {
        primary: toHex6(tenant?.brandColor, '#E67E22'),
        secondary: '#F39C12',
        tertiary: '#E6B054',
        textOnAccent: '#FFFFFF',
        gradientEnabled: true,
      };

    applyBrandTheme(defaults);
  }, [desktopAppearance.wallpaper, resolvedTheme, tenant?.brandColor, useDesktopLayout]);

  const onLogout = () => {
    logout();
    navigate(`/t/${tenant.id}/login`, { replace: true });
  };

  if (!user) return null;

  return (
    <RecycleBinProvider>
      {useDesktopLayout ? (
        <DesktopLayout tenant={tenant} user={user} onLogout={onLogout} />
      ) : (
        <MobileLayout tenant={tenant} user={user} onLogout={onLogout} />
      )}
      <RecycleBinSidebar />
    </RecycleBinProvider>
  );
};

export default AppLayout;

