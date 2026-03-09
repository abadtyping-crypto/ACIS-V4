import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/desktop/layout.css';
import AppFooter from './AppFooter';
import AppSidebar from './AppSidebar';
import DesktopHeader from './DesktopHeader';
import { useTenantNotifications } from '../../hooks/useTenantNotifications';
import { useTenant } from '../../context/TenantContext';

const DesktopLayout = ({ tenant, user, onLogout }) => {
  const { tenantId } = useTenant();
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('acis_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('acis_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const { unreadCount, recentNotifications, markAsRead } = useTenantNotifications(tenantId, user);

  return (
    <div
      className="desktop-shell bg-transparent"
      style={{ height: hasNativeTitleBar ? 'calc(100dvh - 2.25rem)' : '100dvh' }}
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
