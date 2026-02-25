import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { BellIcon, HomeIcon, PortalIcon, SearchIcon, StarIcon } from '../icons/AppIcons';
import { isVisibleOnPlatform, NAV_ITEMS } from '../../config/appNavigation';
import { useAuth } from '../../context/AuthContext';
import { getRuntimePlatform } from '../../lib/runtimePlatform';

const MOBILE_ITEMS_KEY = 'acis_mobile_items_v1';
const allMobileItemKeys = ['dashboard', 'notifications', 'favorites', 'profile', 'portalManagement'];
const defaultItems = ['dashboard', 'notifications', 'portalManagement', 'profile'];

const readMobileItems = () => {
  if (typeof window === 'undefined') return defaultItems;
  try {
    const raw = window.localStorage.getItem(MOBILE_ITEMS_KEY);
    if (!raw) return defaultItems;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultItems;
    const valid = parsed.filter((value) => allMobileItemKeys.includes(value));
    return valid.length ? valid : defaultItems;
  } catch {
    return defaultItems;
  }
};

const renderNavIcon = (iconKey, user) => {
  if (iconKey === 'home') return <HomeIcon className="h-5 w-5" />;
  if (iconKey === 'bell') return <BellIcon className="h-5 w-5" />;
  if (iconKey === 'star') return <StarIcon className="h-5 w-5" />;
  if (iconKey === 'user') {
    return (
      <img
        src={user?.photoURL || '/avatar.png'}
        alt="Profile"
        className="h-6 w-6 rounded-full border border-[var(--c-border)] object-cover"
      />
    );
  }
  if (iconKey === 'portal') return <PortalIcon className="h-5 w-5" />;
  return null;
};

const MobileBottomBar = () => {
  const { tenantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mobileItems = readMobileItems();
  const runtimePlatform = getRuntimePlatform();
  const visibleNavItems = NAV_ITEMS.filter((item) => isVisibleOnPlatform(item, runtimePlatform));
  const itemMap = Object.fromEntries(visibleNavItems.map((item) => [item.key, item]));

  const leftKeys = mobileItems.slice(0, 2);
  const rightKeys = mobileItems.slice(2, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
      <div className="mobile-glass-panel mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-[var(--c-border)] px-2.5 py-2">
        {leftKeys.map((key) => {
          const item = itemMap[key];
          if (!item) return null;
          return (
            <NavLink
              key={key}
              to={`/t/${tenantId}/${item.path}`}
              className={({ isActive }) =>
                `flex min-h-12 min-w-14 flex-1 items-center justify-center rounded-xl text-lg transition ${
                  isActive ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)]'
                }`
              }
              aria-label={item.label}
              title={item.label}
            >
              <span>{renderNavIcon(item.icon, user)}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => navigate(`/t/${tenantId}/search`)}
          className="relative inline-flex h-13 w-13 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] text-xl shadow-sm"
          aria-label="Universal search"
        >
          <SearchIcon className="h-5.5 w-5.5" />
        </button>

        {rightKeys.map((key) => {
          const item = itemMap[key];
          if (!item) return null;
          return (
            <NavLink
              key={key}
              to={`/t/${tenantId}/${item.path}`}
              className={({ isActive }) =>
                `flex min-h-12 min-w-14 flex-1 items-center justify-center rounded-xl text-lg transition ${
                  isActive ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)]'
                }`
              }
              aria-label={item.label}
              title={item.label}
            >
              <span>{renderNavIcon(item.icon, user)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
