import { useState, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/desktop/layout.css';
import AppFooter from './AppFooter';
import AppSidebar from './AppSidebar';
import DesktopHeader from './DesktopHeader';
import { useTenantNotifications } from '../../hooks/useTenantNotifications';
import { useTenant } from '../../context/useTenant';
import { DESKTOP_APPEARANCE_EVENT, readDesktopAppearance } from '../../lib/mobileAppearance';
import { useTheme } from '../../context/useTheme';
import useElectronLayoutMode, { LAYOUT_MINI, LAYOUT_COMPACT, LAYOUT_STANDARD, LAYOUT_WIDE, modeToDensityTier } from '../../hooks/useElectronLayoutMode';

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
  const layoutMode = useElectronLayoutMode();
  const densityTier = modeToDensityTier(layoutMode);

  // --- Sidebar state driven by layout mode ---
  const savedCollapsed = localStorage.getItem('acis_sidebar_collapsed') === 'true';
  const [userToggled, setUserToggled] = useState(savedCollapsed);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Effective sidebar visibility per mode
  const sidebarState = useMemo(() => {
    if (layoutMode === LAYOUT_MINI) return { hidden: true, collapsed: true };
    if (layoutMode === LAYOUT_COMPACT) return { hidden: false, collapsed: true };
    if (layoutMode === LAYOUT_STANDARD) return { hidden: false, collapsed: true };
    // wide — honour user preference
    return { hidden: false, collapsed: userToggled };
  }, [layoutMode, userToggled]);

  // Only persist preference in wide mode
  useEffect(() => {
    if (layoutMode === LAYOUT_WIDE) {
      localStorage.setItem('acis_sidebar_collapsed', userToggled);
    }
  }, [userToggled, layoutMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-layout-mode', layoutMode);
    root.setAttribute('data-density', densityTier);
    return () => {
      root.removeAttribute('data-layout-mode');
      root.removeAttribute('data-density');
    };
  }, [layoutMode, densityTier]);

  // Overlay is only meaningful in mini mode; auto-close on mode change
  const effectiveOverlayOpen = layoutMode === LAYOUT_MINI && overlayOpen;

  const toggleSidebar = () => {
    if (layoutMode === LAYOUT_MINI) {
      setOverlayOpen(prev => !prev);
    } else if (layoutMode === LAYOUT_COMPACT) {
      // No toggle in compact — always collapsed
      return;
    } else {
      setUserToggled(prev => !prev);
    }
  };

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
      data-layout-mode={layoutMode}
      data-density={densityTier}
      style={{
        height: hasNativeTitleBar ? 'calc(100dvh - var(--d-shell-titlebar-h))' : '100dvh',
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
        layoutMode={layoutMode}
        onToggleSidebar={toggleSidebar}
      />
      <div className="desktop-frame flex flex-1 min-h-0">
        {/* Overlay backdrop for mini mode */}
        {effectiveOverlayOpen && (
          <div
            className="desktop-sidebar-backdrop"
            onClick={() => setOverlayOpen(false)}
          />
        )}
        <AppSidebar
          isCollapsed={sidebarState.collapsed}
          isHidden={sidebarState.hidden}
          isOverlay={effectiveOverlayOpen}
          layoutMode={layoutMode}
          onToggle={toggleSidebar}
        />
        <div className="desktop-content flex flex-1 flex-col min-w-0">
          <main className="desktop-main compact-shell-main flex-1">
            <Outlet context={{ layoutMode }} />
          </main>
          <AppFooter tenantName={tenant.name} tenantLogoUrl={tenant.logoUrl} />
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;
