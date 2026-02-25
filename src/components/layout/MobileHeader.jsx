import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { RecycleBinIcon } from '../icons/AppIcons';
import { useRecycleBin } from '../../context/RecycleBinContext';
import { useRecycleBinSummary } from '../../hooks/useRecycleBinSummary';

const MobileHeader = ({ tenant, user, onLogout }) => {
  const { tenantId } = useParams();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { openRecycleBin } = useRecycleBin();
  const recycleDomains = ['clients', 'portals', 'transactions', 'loanPersons', 'statements', 'paymentReceipts', 'invoices'];
  const { total: recycleTotal } = useRecycleBinSummary(tenantId, recycleDomains);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const goTo = (path) => navigate(`/t/${tenantId}/${path}`);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="mobile-glass-panel flex min-h-20 items-center justify-between gap-2 rounded-2xl border border-[var(--c-border)] px-3.5">
        <button
          type="button"
          onClick={() => goTo('dashboard')}
          className="inline-flex min-w-0 max-w-[74%] items-center gap-2.5 border-0 bg-transparent p-0 text-left no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ring)]"
          style={{ textDecoration: 'none' }}
        >
          <img
            src="/logo.png"
            alt="ACIS Ajman"
            className="h-10 w-10 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold text-[var(--c-text)]">{tenant.name}</p>
            <p className="truncate text-xs font-medium text-[var(--c-muted)]">Workspace</p>
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openRecycleBin}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)]/70 text-[var(--c-muted)]"
            aria-label="Open recycle bin"
            title="Open recycle bin"
          >
            <RecycleBinIcon className="h-5 w-5" />
            {recycleTotal > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--c-accent)] px-1 text-[9px] font-bold text-white">
                {recycleTotal}
              </span>
            ) : null}
          </button>
          <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)]"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <img
              src={user.photoURL || '/avatar.png'}
              alt={user.displayName}
            className="h-8 w-8 rounded-full object-cover"
            />
          </button>
          {menuOpen ? (
            <div className="mobile-glass-panel absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-2xl border border-[var(--c-border)] p-2 shadow-lg">
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
                  goTo('portal-management');
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-panel)]"
              >
                Portal Management
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-panel)]"
              >
                {resolvedTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
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

export default MobileHeader;
