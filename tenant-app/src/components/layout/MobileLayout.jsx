import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/mobile/layout.css';
import MobileBottomBar from './MobileBottomBar';
import MobileHeader from './MobileHeader';

const MobileLayout = ({ tenant, user, onLogout }) => {
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="mobile-shell min-h-screen bg-transparent"
      style={{ height: hasNativeTitleBar ? 'calc(100dvh - 2.25rem)' : '100dvh' }}
    >
      <MobileHeader tenant={tenant} user={user} onLogout={onLogout} />
      <main className="mobile-main px-2 py-3">
        <Outlet />
      </main>
      <MobileBottomBar />
    </div>
  );
};

export default MobileLayout;
