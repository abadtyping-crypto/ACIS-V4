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
import { useRecycleBin } from '../../context/RecycleBinContext';
import { useRecycleBinSummary } from '../../hooks/useRecycleBinSummary';

const renderNavIcon = (iconKey) => {
  if (iconKey === 'home') return <HomeIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'bell') return <BellIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'star') return <StarIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'user') return <UserIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'portal') return <PortalIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'user-plus') return <UserPlusIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'receipt') return <ReceiptIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'tasks') return <TasksIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'invoice') return <InvoiceIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'quotation') return <QuotationIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'expense') return <ExpenseIcon className="h-[1.15rem] w-[1.15rem]" />;
  if (iconKey === 'calendar') return <CalendarIcon className="h-[1.15rem] w-[1.15rem]" />;
  return null;
};

const AppSidebar = ({ isCollapsed, onToggle }) => {
  const { tenantId } = useParams();
  const runtimePlatform = getRuntimePlatform();
  const visibleNavItems = NAV_ITEMS.filter((item) => isVisibleOnPlatform(item, runtimePlatform));
  const { openRecycleBin } = useRecycleBin();
  const recycleDomains = ['clients', 'portals', 'transactions', 'loanPersons', 'statements', 'paymentReceipts', 'invoices'];
  const { total: recycleTotal } = useRecycleBinSummary(tenantId, recycleDomains);

  return (
    <aside className={`desktop-sidebar hidden h-full shrink-0 overflow-hidden border-r border-[var(--c-border)] glass transition-all duration-300 lg:block ${isCollapsed ? 'w-[5.5rem]' : 'w-[17.8rem]'}`}>
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
                      ? 'bg-[color:color-mix(in_srgb,var(--c-panel)_88%,transparent)] text-[var(--c-text)] ring-1 ring-[var(--c-ring)]'
                      : 'text-[var(--c-muted)] hover:bg-[color:color-mix(in_srgb,var(--c-panel)_75%,transparent)] hover:text-[var(--c-text)]'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`
                  }
                >
                  <span aria-hidden="true" className="shrink-0">{renderNavIcon(item.icon)}</span>
                  <span className={`transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'inline'}`}>{item.label}</span>
                </NavLink>
              </div>
            ))}
          </nav>
        </div>
        <div className={`desktop-sidebar-footer border-t border-[var(--c-border)] py-3 ${isCollapsed ? 'px-2.5' : 'px-3'}`}>
          <div className="rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_82%,transparent)] p-2.5">
            <button
              type="button"
              onClick={onToggle}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className={`mb-1.5 flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-2.5 text-[13px] font-semibold text-[var(--c-muted)] transition hover:text-[var(--c-accent)] ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <svg className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              <span className={isCollapsed ? 'hidden' : 'inline'}>{isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
            </button>
            
            <button
              type="button"
              onClick={openRecycleBin}
              title="Universal Recycle Bin"
              className={`relative mb-1.5 flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-semibold text-[var(--c-muted)] transition hover:bg-[var(--c-surface)] hover:text-[var(--c-text)] ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <RecycleBinIcon className="h-4.5 w-4.5 shrink-0" />
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
                `mb-1.5 flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-semibold transition ${isActive
                  ? 'bg-[var(--c-surface)] text-[var(--c-text)] ring-1 ring-[var(--c-ring)]'
                  : 'text-[var(--c-muted)] hover:bg-[var(--c-surface)] hover:text-[var(--c-text)]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`
              }
            >
              <SettingsIcon className="h-4.5 w-4.5 shrink-0" />
              <span className={isCollapsed ? 'hidden' : 'inline'}>Settings</span>
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
