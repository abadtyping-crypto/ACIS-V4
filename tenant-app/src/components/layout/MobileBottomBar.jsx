import { NavLink, useParams } from 'react-router-dom';
import {
  BellIcon,
  CalendarIcon,
  ExpenseIcon,
  HomeIcon,
  InvoiceIcon,
  PortalIcon,
  QuotationIcon,
  ReceiptIcon,
  StarIcon,
  TasksIcon,
  UserIcon,
  UserPlusIcon,
} from '../icons/AppIcons';
import { isVisibleOnPlatform, NAV_ITEMS } from '../../config/appNavigation';
import { useAuth } from '../../context/AuthContext';
import { getRuntimePlatform } from '../../lib/runtimePlatform';

const MOBILE_ITEMS_KEY = 'acis_mobile_items_v1';
const allMobileItemKeys = ['dashboard', 'clientOnboarding', 'dailyTransactions', 'portalManagement', 'documentCalendar'];
const defaultItems = ['dashboard', 'clientOnboarding', 'dailyTransactions', 'portalManagement'];
const compactLabelMap = {
  dashboard: 'Home',
  clientOnboarding: 'Clients',
  dailyTransactions: 'Tx',
  portalManagement: 'Portals',
  documentCalendar: 'Calendar',
};

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
  if (iconKey === 'receipt') return <ReceiptIcon className="h-5 w-5" />;
  if (iconKey === 'tasks') return <TasksIcon className="h-5 w-5" />;
  if (iconKey === 'invoice') return <InvoiceIcon className="h-5 w-5" />;
  if (iconKey === 'quotation') return <QuotationIcon className="h-5 w-5" />;
  if (iconKey === 'expense') return <ExpenseIcon className="h-5 w-5" />;
  if (iconKey === 'calendar') return <CalendarIcon className="h-5 w-5" />;
  if (iconKey === 'user-plus') return <UserPlusIcon className="h-5 w-5" />;
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
  const mobileItems = readMobileItems();
  const runtimePlatform = getRuntimePlatform();
  const visibleNavItems = NAV_ITEMS.filter((item) => isVisibleOnPlatform(item, runtimePlatform));
  const itemMap = Object.fromEntries(visibleNavItems.map((item) => [item.key, item]));
  const dockKeys = mobileItems.slice(0, 4);

  return (
    <nav className="mobile-dock-wrap fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.95rem+env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
      <div className="mx-auto flex max-w-md items-end justify-center gap-2">
        <div className="mobile-dock mobile-glass-panel flex flex-1 items-center gap-1 rounded-[1.45rem] border border-[var(--c-border)] px-2 py-2.5">
          {dockKeys.map((key) => {
            const item = itemMap[key];
            if (!item) return null;
            const compactLabel = compactLabelMap[key] || item.label;
            return (
              <NavLink
                key={key}
                to={`/t/${tenantId}/${item.path}`}
                className={({ isActive }) =>
                  `mobile-dock-item mobile-icon-control flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 transition ${
                    isActive ? 'mobile-dock-item-active text-[var(--c-text)]' : 'text-[var(--c-muted)]'
                  }`
                }
                aria-label={item.label}
                title={item.label}
              >
                <span className="mobile-dock-glyph">{renderNavIcon(item.icon, user)}</span>
                <span className="mt-0.5 truncate text-[11px] font-semibold leading-tight">{compactLabel}</span>
              </NavLink>
            );
          })}
        </div>

        <NavLink
          to={`/t/${tenantId}/profile`}
          className={({ isActive }) =>
            `mobile-dock-orb mobile-glass-panel mobile-icon-control inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--c-border)] transition ${
              isActive ? 'mobile-dock-orb-active' : ''
            }`
          }
          aria-label="Profile"
          title="Profile"
        >
          <span className="mobile-dock-glyph">
            <UserIcon className="h-6 w-6" />
          </span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomBar;
