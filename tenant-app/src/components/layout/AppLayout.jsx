import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import useIsDesktopLayout from '../../hooks/useIsDesktopLayout';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import RecycleBinSidebar from '../portal/RecycleBinSidebar';
import { RecycleBinProvider } from '../../context/RecycleBinContext';
import { getRuntimePlatform, PLATFORM_ELECTRON } from '../../lib/runtimePlatform';

const isHexColor = (value) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || '').trim());

const toHex6 = (value, fallback) => {
  const next = String(value || '').trim();
  if (!isHexColor(next)) return fallback;
  if (next.length === 7) return next.toUpperCase();
  const chars = next.slice(1).split('');
  return `#${chars.map((char) => `${char}${char}`).join('')}`.toUpperCase();
};

const hexToRgba = (hex, alpha = 1) => {
  const safe = toHex6(hex, '#1778F2').slice(1);
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyBrandTheme = (themeConfig) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
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
};

const AppLayout = () => {
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktopLayout();
  const runtimePlatform = getRuntimePlatform();
  const useDesktopLayout = runtimePlatform === PLATFORM_ELECTRON ? true : isDesktop;

  useEffect(() => {
    const defaults = {
      primary: toHex6(tenant?.brandColor, '#1778F2'),
      secondary: '#45B6FF',
      tertiary: '#6DE3D7',
      textOnAccent: '#FFFFFF',
      gradientEnabled: true,
    };

    applyBrandTheme(defaults);
  }, [tenant?.brandColor]);

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
