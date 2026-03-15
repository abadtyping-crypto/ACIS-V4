import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/desktop/layout.css';
import AppFooter from './AppFooter';
import AppSidebar from './AppSidebar';
import DesktopHeader from './DesktopHeader';
import { useTenantNotifications } from '../../hooks/useTenantNotifications';
import { useTenant } from '../../context/useTenant';
import { DESKTOP_APPEARANCE_EVENT, readDesktopAppearance } from '../../lib/mobileAppearance';
import { useTheme } from '../../context/useTheme';

const DESKTOP_PRESET_BACKGROUNDS = {
  aurora:
    'radial-gradient(120% 100% at -10% -20%, color-mix(in srgb, #F59E0B 34%, transparent) 0%, transparent 58%), radial-gradient(100% 88% at 108% 4%, color-mix(in srgb, #F97316 28%, transparent) 0%, transparent 56%), radial-gradient(130% 110% at 48% 120%, color-mix(in srgb, #E6B054 22%, transparent) 0%, transparent 64%), var(--c-bg)',
  midnight:
    'radial-gradient(120% 120% at 12% 12%, color-mix(in srgb, #7C3AED 42%, transparent) 0%, transparent 56%), radial-gradient(120% 120% at 88% 12%, color-mix(in srgb, #C026D3 34%, transparent) 0%, transparent 60%), radial-gradient(140% 120% at 50% 120%, color-mix(in srgb, #3B0A45 64%, transparent) 0%, transparent 68%), #1E1021',
  ocean:
    'radial-gradient(130% 120% at -6% 0%, color-mix(in srgb, #D97706 42%, transparent) 0%, transparent 58%), radial-gradient(120% 120% at 108% 0%, color-mix(in srgb, #EA580C 38%, transparent) 0%, transparent 58%), radial-gradient(140% 120% at 48% 115%, color-mix(in srgb, #7C2D12 46%, transparent) 0%, transparent 66%), #17110A',
  sunrise:
    'radial-gradient(130% 110% at 0% 0%, color-mix(in srgb, #FF8A3D 40%, transparent) 0%, transparent 54%), radial-gradient(120% 110% at 100% 0%, color-mix(in srgb, #FFCF6C 34%, transparent) 0%, transparent 56%), radial-gradient(140% 120% at 50% 115%, color-mix(in srgb, #FF5B47 30%, transparent) 0%, transparent 62%), #2A1018',
  ember:
    'radial-gradient(120% 100% at -8% -12%, color-mix(in srgb, #F97316 46%, transparent) 0%, transparent 56%), radial-gradient(116% 106% at 108% 4%, color-mix(in srgb, #EF4444 34%, transparent) 0%, transparent 58%), radial-gradient(140% 118% at 50% 118%, color-mix(in srgb, #7F1D1D 56%, transparent) 0%, transparent 66%), #1A0D0A',
};

const DesktopLayout = ({ tenant, user, onLogout }) => {
  const { tenantId } = useTenant();
  const { resolvedTheme } = useTheme();
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('acis_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('acis_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const [desktopAppearance, setDesktopAppearance] = useState(() => readDesktopAppearance());

  useEffect(() => {
    const sync = () => setDesktopAppearance(readDesktopAppearance());
    window.addEventListener('storage', sync);
    window.addEventListener(DESKTOP_APPEARANCE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(DESKTOP_APPEARANCE_EVENT, sync);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const { unreadCount, recentNotifications, markAsRead } = useTenantNotifications(tenantId, user);

  const wallpaperPreset = DESKTOP_PRESET_BACKGROUNDS[desktopAppearance.wallpaper] || DESKTOP_PRESET_BACKGROUNDS.aurora;
  const wallpaperOverlay = resolvedTheme === 'dark'
    ? 'linear-gradient(rgba(8,16,28,0.26), rgba(8,16,28,0.54))'
    : 'linear-gradient(rgba(255,255,255,0.34), rgba(241,245,249,0.54))';
  const wallpaperImage =
    desktopAppearance.mode === 'custom' && desktopAppearance.customWallpaperUrl
      ? `${wallpaperOverlay}, url("${desktopAppearance.customWallpaperUrl}")`
      : '';
  const shellBackground = wallpaperImage || wallpaperPreset;

  return (
    <div
      className="desktop-shell bg-transparent"
      style={{
        height: hasNativeTitleBar ? 'calc(100dvh - 2.25rem)' : '100dvh',
        background: shellBackground,
        backgroundAttachment: desktopAppearance.mode === 'custom' ? 'scroll' : 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <DesktopHeader 
        tenant={tenant} 
        user={user} 
        notificationCount={unreadCount}
        recentNotifications={recentNotifications}
        onNotificationRead={markAsRead}
        onLogout={onLogout}
      />
      <div className="desktop-frame flex flex-1 min-h-0">
        <AppSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <div className="desktop-content flex flex-1 flex-col">
          <main className="desktop-main flex-1 px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
            <Outlet />
          </main>
          <AppFooter tenantName={tenant.name} tenantLogoUrl={tenant.logoUrl} />
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;
