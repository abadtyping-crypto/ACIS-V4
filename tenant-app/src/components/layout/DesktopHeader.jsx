import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BellIcon, SearchIcon } from '../icons/AppIcons';
import { useTheme } from '../../context/useTheme';
import { ArrowUpRight, Eye, Menu as MenuIcon, Monitor, MoonStar, SunMedium } from 'lucide-react';
import { DEFAULT_PORTAL_ICON } from '../../lib/transactionMethodConfig';
import { useTenantBrandingLogos } from '../../hooks/useTenantBrandingLogos';
import { resolveNotificationPrimaryVisual } from '../../lib/notificationVisuals';
import QuickViewModal from '../common/QuickViewModal';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const toDisplayName = (user) => {
  const raw = String(user?.displayName || '').trim();
  if (raw && !emailRegex.test(raw)) return raw;
  const email = String(user?.email || '').trim().toLowerCase();
  if (emailRegex.test(email)) return email.split('@')[0];
  return 'User';
};

const toDateLabel = (value) => {
  if (!value) return '';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis()).toLocaleString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString();
};

const toBalanceLabel = (value) => {
  const amount = Number(value || 0);
  const sign = amount < 0 ? '-' : '';
  return `${sign}AED ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DesktopHeader = ({ tenant, user, notificationCount, recentNotifications = [], onNotificationRead, onLogout, layoutMode = 'wide', onToggleSidebar }) => {
  const hasNativeTitleBar = typeof window !== 'undefined' && Boolean(window.electron?.windowControls);
  const { tenantId } = useParams();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeQuickView, setActiveQuickView] = useState(null);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const appliedTheme = theme === 'system' ? resolvedTheme : theme;
  const ThemeIcon = theme === 'system' ? Monitor : appliedTheme === 'dark' ? MoonStar : SunMedium;
  const themeLabel = theme === 'system' ? `System (${resolvedTheme})` : appliedTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
  const displayName = toDisplayName(user);
  const tenantLogoUrl = tenant?.logoUrl || '/logo.png';
  const { headerLogoUrl } = useTenantBrandingLogos(tenantId, tenantLogoUrl);
  const tenantLabel = tenant?.name || 'Tenant';

  const goTo = (path) => navigate(`/t/${tenantId}/${path}`);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleNotificationOpen = async (item) => {
    if (!item?.id) return;
    if (!item.isRead) await onNotificationRead?.(item.id);
    if (item.routePath) {
      navigate(item.routePath);
    } else {
      goTo('notifications');
    }
    setNotificationsOpen(false);
  };

  const handleNotificationQuickView = async (event, item) => {
    event.stopPropagation();
    if (!item?.quickView) return;
    if (!item.isRead) await onNotificationRead?.(item.id);
    setActiveQuickView(item.quickView);
  };

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-3 lg:px-4">
      <div className="glass no-drag flex items-center justify-between gap-2 rounded-2xl border border-[var(--c-border)] px-2.5 sm:px-3" style={{ minHeight: 'var(--d-shell-header-h)' }}>
        <div className="flex items-center gap-3">
          {/* Hamburger button for mini mode */}
          {layoutMode === 'mini' && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="compact-icon-action inline-flex items-center justify-center rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] text-[var(--c-text)] shadow-sm transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
              aria-label="Toggle sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => goTo('dashboard')}
            className="brand-button no-drag inline-flex min-w-0 flex-1 appearance-none items-center gap-3 border-0 bg-transparent p-0 text-left text-[var(--c-text)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ring)]"
            style={{ textDecoration: 'none' }}
          >
            <img
              src={headerLogoUrl}
              alt={tenantLabel}
              className="h-9 w-9 rounded-xl border border-[var(--glass-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_88%,transparent)] object-cover shadow-sm"
            />
            {(layoutMode === 'standard' || layoutMode === 'wide') && (
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-semibold text-[var(--c-text)]">{tenant.name}</p>
              <p className="truncate text-xs text-[var(--c-muted)]">{hasNativeTitleBar ? 'Tenant Workspace' : 'Brand Workspace'}</p>
            </div>
            )}
          </button>
        </div>

        <div className="shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="compact-icon-action inline-flex items-center justify-center rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] text-sm font-semibold text-[var(--c-text)] shadow-sm transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
            aria-label={`Toggle theme (currently ${themeLabel})`}
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => goTo('search')}
            className="compact-icon-action inline-flex items-center justify-center rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] text-sm font-semibold text-[var(--c-text)] shadow-sm transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
            aria-label="Search clients and dependants"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="compact-action relative inline-flex items-center justify-center rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] px-3 text-sm font-semibold text-[var(--c-text)] transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              aria-haspopup="menu"
            >
              <BellIcon className="h-5 w-5" />
              {notificationCount > 0 ? (
                <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--c-danger)] px-1 text-[10px] font-bold text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="compact-popover glass absolute right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-[var(--c-border)] p-2 shadow-lg">
                <div className="mb-2 flex items-center justify-between px-2 py-1">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--c-muted)]">Recent Notifications</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      goTo('notifications');
                    }}
                    className="rounded-lg px-2 py-1 text-[11px] font-bold text-[var(--c-accent)] hover:bg-[var(--c-panel)]"
                  >
                    View All
                  </button>
                </div>
                {recentNotifications.length === 0 ? (
                  <p className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-4 text-xs text-[var(--c-muted)]">
                    No recent notifications.
                  </p>
                ) : (
                  <div className="space-y-1 overflow-auto pr-1" style={{ maxHeight: 'var(--d-popover-max-h)' }}>
                    {recentNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`w-full rounded-xl border px-2 py-2 transition ${item.isRead
                            ? 'border-[var(--c-border)] bg-[var(--c-surface)]'
                            : 'border-[var(--c-ring)] bg-[var(--c-panel)]'
                          }`}
                      >
                        {(() => {
                          const primaryVisual = resolveNotificationPrimaryVisual(item);
                          return (
                        <div className="flex items-start gap-2 text-left">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_70%,white_30%)]">
                            {primaryVisual.kind === 'image' ? (
                              <img
                                src={primaryVisual.src}
                                alt={primaryVisual.alt || 'Notification'}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src = primaryVisual.fallbackSrc || DEFAULT_PORTAL_ICON;
                                }}
                              />
                            ) : (
                              <primaryVisual.Icon className="h-4 w-4 text-[var(--c-accent)]" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleNotificationOpen(item)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-bold text-[var(--c-text)]">{item.title || item.eventType || 'Notification'}</p>
                              {!item.isRead ? <span className="h-2 w-2 rounded-full bg-[var(--c-accent)]" /> : null}
                            </div>
                            <p className="truncate text-[11px] text-[var(--c-muted)]">{item.detail || item.message || 'No detail available.'}</p>
                            {item.entityType === 'portal' && item.entityMeta ? (
                              <div className="mt-1 flex items-center gap-2">
                                <img
                                  src={item.entityMeta.iconUrl || DEFAULT_PORTAL_ICON}
                                  alt={item.entityMeta.name || 'Portal'}
                                  className="h-4 w-4 rounded object-cover"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = DEFAULT_PORTAL_ICON;
                                  }}
                                />
                                <p className="truncate text-[10px] font-semibold text-[var(--c-text)]">
                                  {item.entityMeta.name} • {toBalanceLabel(item.entityMeta.balance)}
                                </p>
                              </div>
                            ) : null}
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--c-muted)]">
                              <button
                                type="button"
                                className="inline-flex min-w-0 items-center gap-1.5 hover:text-[var(--c-text)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotificationsOpen(false);
                                  if (item.createdBy) goTo(`profile/edit?uid=${encodeURIComponent(item.createdBy)}`);
                                }}
                              >
                                <img
                                  src={item.createdByUser?.photoURL || '/avatar.png'}
                                  alt={item.createdByUser?.displayName || 'User'}
                                  className="h-4 w-4 rounded-full border border-[var(--c-border)] object-cover"
                                />
                                <span className="truncate">{item.createdByUser?.displayName || 'System'}</span>
                              </button>
                              <span>{toDateLabel(item.createdAt)}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {item.quickView ? (
                                <button
                                  type="button"
                                  onClick={(event) => handleNotificationQuickView(event, item)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--c-accent)]/20 bg-[color:color-mix(in_srgb,var(--c-accent)_12%,var(--c-surface))] px-2.5 py-1 text-[10px] font-bold text-[var(--c-accent)] transition hover:border-[var(--c-accent)]/35 hover:bg-[color:color-mix(in_srgb,var(--c-accent)_18%,var(--c-surface))]"
                                  aria-label="Quick View"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Quick View</span>
                                </button>
                              ) : null}
                              {item.routePath ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--c-muted)]">
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  <span>Open in workspace</span>
                                </span>
                              ) : null}
                            </div>
                          </button>
                        </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="compact-action flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] px-3 transition hover:border-[var(--c-ring)] hover:bg-[var(--c-panel)]"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <img
                src={user.photoURL || '/avatar.png'}
                alt={displayName}
                className="h-7 w-7 rounded-full border border-[var(--c-border)] object-cover"
              />
              <span className="hidden text-left xl:block">
                <span className="block text-sm font-semibold text-[var(--c-text)]">{displayName}</span>
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
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--c-danger)] transition hover:bg-[var(--c-danger-soft)]"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <QuickViewModal
        isOpen={Boolean(activeQuickView)}
        quickView={activeQuickView}
        onClose={() => setActiveQuickView(null)}
      />
    </header >
  );
};

export default DesktopHeader;
