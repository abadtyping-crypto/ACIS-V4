import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BellIcon } from '../icons/AppIcons';
import { useTheme } from '../../context/ThemeContext';
import { Monitor, MoonStar, SunMedium } from 'lucide-react';

const DesktopHeader = ({ tenant, user, notificationCount, onLogout }) => {
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);
  const { tenantId } = useParams();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const appliedTheme = theme === 'system' ? resolvedTheme : theme;
  const ThemeIcon = theme === 'system' ? Monitor : appliedTheme === 'dark' ? MoonStar : SunMedium;
  const themeLabel = theme === 'system' ? `System (${resolvedTheme})` : appliedTheme === 'dark' ? 'Dark Mode' : 'Light Mode';

  const goTo = (path) => navigate(`/t/${tenantId}/${path}`);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="glass no-drag flex min-h-[4.25rem] items-center justify-between gap-2 rounded-2xl border border-[var(--c-border)] px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo('dashboard')}
            className="brand-button no-drag inline-flex min-w-0 flex-1 appearance-none items-center gap-3 border-0 bg-transparent p-0 text-left text-[var(--c-text)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ring)]"
            style={{ textDecoration: 'none' }}
          >
            {!hasNativeTitleBar ? (
              <img
                src="/logo.png"
                alt="ACIS Ajman"
                className="h-11 w-11 rounded-xl border border-white/70 bg-white object-cover shadow-sm"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-base font-black text-[var(--c-text)]">{tenant.name}</p>
              <p className="truncate text-xs text-[var(--c-muted)]">{hasNativeTitleBar ? 'Team Workspace' : 'Brand Workspace'}</p>
            </div>
          </button>
        </div>

        <div className="shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-11 min-w-[150px] items-center justify-between gap-2 rounded-xl border border-[var(--c-ring)] bg-[color:color-mix(in_srgb,var(--c-surface)_90%,transparent)] px-3 text-sm font-semibold text-[var(--c-text)] shadow-sm transition hover:bg-[var(--c-panel)]"
            aria-label="Quick dark light toggle"
          >
            <span className="inline-flex items-center gap-2">
              <ThemeIcon className="h-4 w-4 text-[var(--c-accent)]" />
              <span className="text-xs font-bold">{themeLabel}</span>
            </span>
            <span className="rounded-md bg-[color:color-mix(in_srgb,var(--c-accent)_16%,transparent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--c-accent)]">
              {theme === 'system' ? 'Auto' : 'Manual'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => goTo('notifications')}
            className="relative inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] px-4 text-sm font-semibold text-[var(--c-text)] transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            {notificationCount > 0 ? (
              <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            ) : null}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] px-3 transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <img
                src={user.photoURL || '/avatar.png'}
                alt={user.displayName}
                className="h-8 w-8 rounded-full border border-[var(--c-border)] object-cover"
              />
              <span className="hidden text-left 2xl:block">
                <span className="block text-sm font-semibold text-[var(--c-text)]">{user.displayName}</span>
                <span className="block text-xs text-[var(--c-muted)]">{user.role}</span>
              </span>
            </button>
            {menuOpen ? (
              <div className="glass absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-[var(--c-border)] p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    goTo('profile');
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-panel)]"
                >
                  Profile Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
