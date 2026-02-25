import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/desktop/layout.css';
import AppFooter from './AppFooter';
import AppSidebar from './AppSidebar';
import DesktopHeader from './DesktopHeader';

const DesktopLayout = ({ tenant, user, onLogout }) => {
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('acis_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('acis_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <div
      className="desktop-shell bg-transparent"
      style={{ height: hasNativeTitleBar ? 'calc(100dvh - 2.25rem)' : '100dvh' }}
    >
      <DesktopHeader 
        tenant={tenant} 
        user={user} 
        notificationCount={3} 
        onLogout={onLogout}
      />
      <div className="desktop-frame flex flex-1 min-h-0">
        <AppSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <div className="desktop-content flex flex-1 flex-col">
          <main className="desktop-main flex-1 px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
            <Outlet />
          </main>
          <AppFooter tenantName={tenant.name} />
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;
