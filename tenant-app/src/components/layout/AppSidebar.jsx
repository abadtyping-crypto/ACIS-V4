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
  RecycleBinIcon,
  SettingsIcon,
  StarIcon,
  TasksIcon,
  UserIcon,
  UserPlusIcon
} from '../icons/AppIcons';
import { isVisibleOnPlatform, NAV_ITEMS } from '../../config/appNavigation';
import { getRuntimePlatform } from '../../lib/runtimePlatform';
import { useRecycleBin } from '../../context/useRecycleBin';
import { useRecycleBinSummary } from '../../hooks/useRecycleBinSummary';

const getNavIconComponent = (iconKey) => {
  if (iconKey === 'home') return HomeIcon;
  if (iconKey === 'bell') return BellIcon;
  if (iconKey === 'star') return StarIcon;
  if (iconKey === 'user') return UserIcon;
  if (iconKey === 'portal') return PortalIcon;
  if (iconKey === 'user-plus') return UserPlusIcon;
  if (iconKey === 'receipt') return ReceiptIcon;
  if (iconKey === 'tasks') return TasksIcon;
  if (iconKey === 'invoice') return InvoiceIcon;
  if (iconKey === 'quotation') return QuotationIcon;
  if (iconKey === 'expense') return ExpenseIcon;
  if (iconKey === 'calendar') return CalendarIcon;
  return null;
};

const SidebarIconTile = ({ children, accent = false }) => (
  <span
    aria-hidden="true"
    className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${
      accent
        ? 'border-[color:color-mix(in_srgb,var(--c-accent)_26%,var(--c-border))] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--c-surface)_92%,transparent),color-mix(in_srgb,var(--c-panel)_92%,transparent))] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_14px_30px_-22px_color-mix(in_srgb,var(--c-accent)_48%,transparent)]'
        : 'border-[color:color-mix(in_srgb,var(--c-border)_82%,transparent)] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--c-surface)_88%,transparent),color-mix(in_srgb,var(--c-panel)_84%,transparent))] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_12px_26px_-22px_rgba(15,23,42,0.32)]'
    }`}
  >
    <span className="pointer-events-none absolute inset-x-[18%] top-[12%] h-[34%] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,255,255,0))] opacity-90" />
    <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.22),transparent_44%)]" />
    {children}
  </span>
);

const renderNavIcon = (iconKey) => {
  const IconComponent = getNavIconComponent(iconKey);
  if (!IconComponent) return null;

  return (
    <SidebarIconTile>
      <IconComponent className="relative z-[1] h-[1.15rem] w-[1.15rem] translate-y-[0.5px] text-current drop-shadow-[0_6px_10px_rgba(15,23,42,0.18)]" />
    </SidebarIconTile>
  );
};

const renderUtilityIcon = (IconComponent, accent = false) => (
  <SidebarIconTile accent={accent}>
    <IconComponent className="relative z-[1] h-[1.1rem] w-[1.1rem] text-current drop-shadow-[0_6px_10px_rgba(15,23,42,0.18)]" />
  </SidebarIconTile>
);

const AppSidebar = ({ isCollapsed, onToggle }) => {
  const { tenantId } = useParams();
  const runtimePlatform = getRuntimePlatform();
  const visibleNavItems = NAV_ITEMS.filter((item) => isVisibleOnPlatform(item, runtimePlatform));
  const { openRecycleBin } = useRecycleBin();
  const recycleDomains = ['clients', 'portals', 'transactions', 'loanPersons', 'statements', 'paymentReceipts', 'invoices'];
  const { total: recycleTotal } = useRecycleBinSummary(tenantId, recycleDomains);

  return (
    <aside className={`desktop-sidebar block h-full shrink-0 overflow-hidden border-r border-[var(--c-border)] glass transition-all duration-300 ${isCollapsed ? 'w-[5.5rem]' : 'w-[17.8rem]'}`}>
      <div className="flex h-full flex-col">
        <div className={`flex-1 overflow-y-auto scrollbar-hide ${isCollapsed ? 'px-2.5 py-4' : 'px-3 py-4'}`}>
          <nav className="space-y-1.5">
            {visibleNavItems.map((item) => (
              <div key={item.key} className="group relative flex items-center gap-1">
                <NavLink
                  to={`/t/${tenantId}/${item.path}`}
                  title={item.description || item.label}
                  className={({ isActive }) =>
                    `flex min-h-12 flex-1 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition ${isActive
                      ? 'bg-[color:color-mix(in_srgb,var(--c-panel)_88%,transparent)] text-[var(--c-accent)] ring-1 ring-[var(--c-ring)]'
                      : 'text-[var(--c-muted)] hover:bg-[color:color-mix(in_srgb,var(--c-panel)_75%,transparent)] hover:text-[var(--c-accent)]'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`
                  }
                >
                  {renderNavIcon(item.icon)}
                  <span className={`transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'inline'}`}>{item.label}</span>
                </NavLink>
              </div>
            ))}
          </nav>
        </div>
        <div className={`desktop-sidebar-footer border-t border-[var(--c-border)] pb-3 pt-2 ${isCollapsed ? 'px-2.5' : 'px-3'}`}>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onToggle}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_72%,transparent)] px-2.5 text-[13px] font-semibold text-[var(--c-muted)] transition hover:border-[var(--c-ring)] hover:text-[var(--c-accent)] ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <SidebarIconTile>
                <svg className={`relative z-[1] h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </SidebarIconTile>
              <span className={isCollapsed ? 'hidden' : 'inline'}>{isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
            </button>

            <button
              type="button"
              onClick={openRecycleBin}
              title="Universal Recycle Bin"
              className={`relative flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_58%,transparent)] px-2.5 text-[13px] font-semibold text-[var(--c-text)] transition hover:border-[var(--c-ring)] hover:bg-[color:color-mix(in_srgb,var(--c-panel)_72%,transparent)] hover:text-[var(--c-accent)] ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              {renderUtilityIcon(RecycleBinIcon, true)}
              <span className={isCollapsed ? 'hidden' : 'inline'}>Recycle Bin</span>
              {recycleTotal > 0 ? (
                <span className={`rounded-full bg-[var(--c-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white ${isCollapsed ? 'absolute right-1.5 top-1.5' : 'ml-auto'}`}>
                  {recycleTotal}
                </span>
              ) : null}
            </button>

            <NavLink
              to={`/t/${tenantId}/settings`}
              title="Settings"
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-semibold transition ${isActive
                  ? 'bg-[color:color-mix(in_srgb,var(--c-panel)_74%,transparent)] text-[var(--c-accent)] ring-1 ring-[var(--c-ring)]'
                  : 'text-[var(--c-muted)] hover:bg-[color:color-mix(in_srgb,var(--c-panel)_72%,transparent)] hover:text-[var(--c-accent)]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`
              }
            >
              {renderUtilityIcon(SettingsIcon)}
              <span className={isCollapsed ? 'hidden' : 'inline'}>Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
