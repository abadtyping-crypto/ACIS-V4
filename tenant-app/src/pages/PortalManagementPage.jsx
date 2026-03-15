import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import {
  BellIcon,
  InvoiceIcon,
  PortalIcon,
  ReceiptIcon,
  SettingsIcon,
  TasksIcon,
} from '../components/icons/AppIcons';
import PortalSummarySection from '../components/portal/PortalSummarySection';
import LoanManagementSection from '../components/portal/LoanManagementSection';
import InternalTransferSection from '../components/portal/InternalTransferSection';
import PortalSetupSection from '../components/portal/PortalSetupSection';
import PortalFormPage from './PortalFormPage';
import RecentTransactionsSection from '../components/portal/RecentTransactionsSection';
import ReportsSection from '../components/portal/ReportsSection';
import { useRecycleBin } from '../context/useRecycleBin';
import { useAuth } from '../context/useAuth';
import { useTenant } from '../context/useTenant';
import { fetchTenantPortals } from '../lib/backendStore';
import CurrencyValue from '../components/common/CurrencyValue';
import '../styles/mobile/portal.css';

const FUNCTION_ITEMS = [
  {
    key: 'summary',
    label: 'Portal Summary',
    short: 'Summary',
    description: 'Quick balance and liquidity overview for all portals.',
    Icon: PortalIcon,
  },
  {
    key: 'setup',
    label: 'Create & Manage Portals',
    short: 'Setup',
    description: 'Create new portals and maintain existing portal configuration.',
    Icon: SettingsIcon,
  },
  {
    key: 'loan',
    label: 'Loan Management',
    short: 'Loan',
    description: 'Track loan disbursement and repayment against portals.',
    Icon: ReceiptIcon,
  },
  {
    key: 'transfer',
    label: 'Internal Transfer',
    short: 'Transfer',
    description: 'Move balances securely between portals with full traceability.',
    Icon: TasksIcon,
  },
  {
    key: 'balance',
    label: 'Portal Balance Adjustment',
    short: 'Balance',
    description: 'Open portal details to review and adjust operational balances safely.',
    Icon: PortalIcon,
  },
  {
    key: 'recent',
    label: 'Recent Activity',
    short: 'Recent',
    description: 'Review recent transactions and trigger document actions quickly.',
    Icon: BellIcon,
  },
  {
    key: 'reports',
    label: 'Configuration & Reports',
    short: 'Reports',
    description: 'Generate statements and exports for selected portals.',
    Icon: InvoiceIcon,
  },
];

const PortalBalanceAdjustmentPanel = ({ refreshKey }) => {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    fetchTenantPortals(tenantId).then((res) => {
      if (!active) return;
      if (res.ok) setRows(res.rows || []);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [tenantId, refreshKey]);

  return (
    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.75)] sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-black text-[var(--c-text)] sm:text-base">Portal Balance Adjustment</h3>
        <p className="text-xs text-[var(--c-muted)]">
          Open a portal and perform controlled edits from the detail workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--c-accent)] border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-4 text-sm text-[var(--c-muted)]">
          No portals found. Create a portal first.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--c-text)]">{item.name || item.id}</p>
                <p className="truncate text-xs text-[var(--c-muted)]">{item.id}</p>
                <p className={`mt-1 text-xs font-bold ${Number(item.balance || 0) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  <CurrencyValue value={item.balance || 0} iconSize="h-3 w-3" />
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/t/${tenantId}/portal-management/${item.id}`)}
                className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-xs font-bold text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
              >
                Open & Adjust
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PortalManagementPage = () => {
  const { tenantId, portalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { registerRestoreListener } = useRecycleBin();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [activeFunction, setActiveFunction] = useState('summary');
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const pathname = window.location.pathname;
  const isCreateRoute = pathname.endsWith('/portal-management/new');
  const isEditRoute = pathname.includes('/portal-management/edit/');
  const isPortalFormRoute = isCreateRoute || isEditRoute;
  const currentFunction = isPortalFormRoute ? 'setup' : activeFunction;

  useEffect(() => {
    const unsubscribe = registerRestoreListener(() => {
      setRefreshCounter((prev) => prev + 1);
    });
    return unsubscribe;
  }, [registerRestoreListener]);

  const handleQuickAction = (key) => {
    if (FUNCTION_ITEMS.some((item) => item.key === key)) {
      setActiveFunction(key);
      if (isPortalFormRoute && tenantId) {
        navigate(`/t/${tenantId}/portal-management`);
      }
    }
  };

  const activeMeta = useMemo(
    () => {
      if (isCreateRoute) {
        return {
          key: 'setup-create',
          label: 'Create Portal',
          description: 'Create a new portal without leaving the portal management workspace.',
          Icon: SettingsIcon,
        };
      }
      if (isEditRoute) {
        return {
          key: 'setup-edit',
          label: 'Edit Portal',
          description: `Update portal ${portalId || ''} inside the same portal management workspace.`,
          Icon: SettingsIcon,
        };
      }
      return FUNCTION_ITEMS.find((item) => item.key === currentFunction) || FUNCTION_ITEMS[0];
    },
    [currentFunction, isCreateRoute, isEditRoute, portalId],
  );

  const renderActiveContent = () => {
    if (isPortalFormRoute) {
      return <PortalFormPage embedded />;
    }
    if (currentFunction === 'setup') {
      return <PortalSetupSection isOpen={true} onToggle={() => null} refreshKey={refreshCounter} />;
    }
    if (currentFunction === 'loan') {
      return <LoanManagementSection isOpen={true} onToggle={() => null} refreshKey={refreshCounter} />;
    }
    if (currentFunction === 'transfer') {
      return <InternalTransferSection isOpen={true} onToggle={() => null} refreshKey={refreshCounter} />;
    }
    if (currentFunction === 'balance') {
      return <PortalBalanceAdjustmentPanel refreshKey={refreshCounter} />;
    }
    if (currentFunction === 'recent') {
      return <RecentTransactionsSection isOpen={true} onToggle={() => null} refreshKey={refreshCounter} />;
    }
    if (currentFunction === 'reports') {
      return <ReportsSection isOpen={true} onToggle={() => null} refreshKey={refreshCounter} />;
    }
    return <PortalSummarySection onQuickAction={handleQuickAction} refreshKey={refreshCounter} />;
  };

  if (!user) return null;

  return (
    <PageShell
      title="Portal Management"
      subtitle="Unified workspace for portal setup, transactions, adjustments, and reporting."
      icon={PortalIcon}
    >
      <div className="grid h-full gap-4 overflow-hidden lg:grid-cols-[auto_1fr]">
        <aside
          onMouseEnter={() => setIsNavExpanded(true)}
          onMouseLeave={() => setIsNavExpanded(false)}
          className={`sticky top-4 hidden h-fit rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm transition-all duration-300 ease-in-out lg:block ${isNavExpanded ? 'w-[260px]' : 'w-[72px]'}`}
        >
          <div>
            <div className={`mb-3 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] transition-all ${isNavExpanded ? 'gap-3 px-3 py-3' : 'justify-center px-0 py-2.5'}`}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--c-accent)]/25 bg-[color:color-mix(in_srgb,var(--c-accent)_14%,transparent)] text-[var(--c-accent)]">
                <PortalIcon className="h-4.5 w-4.5" />
              </span>
              {isNavExpanded ? (
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--c-muted)]">
                    Workspace
                  </p>
                  <p className="truncate text-sm font-black text-[var(--c-text)]">
                    Portal Functions
                  </p>
                </div>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              {FUNCTION_ITEMS.map((item) => {
                const isActive = currentFunction === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveFunction(item.key)}
                    className={`group relative flex items-center rounded-xl border py-2 text-left transition ${
                      isNavExpanded ? 'justify-start gap-2.5 px-3' : 'justify-center gap-0 px-0'
                    } ${isActive
                      ? 'border-[var(--c-accent)] bg-[color:color-mix(in_srgb,var(--c-accent)_12%,transparent)] text-[var(--c-text)]'
                      : 'border-transparent text-[var(--c-muted)] hover:border-[var(--c-border)] hover:bg-[var(--c-panel)]'
                      }`}
                  >
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${isActive ? 'border-[var(--c-accent)]/30 bg-[color:color-mix(in_srgb,var(--c-accent)_16%,transparent)] text-[var(--c-accent)]' : 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]'}`}>
                      <item.Icon className="h-4 w-4" />
                    </span>
                    <span className={`${isNavExpanded ? 'inline' : 'hidden'} text-xs font-bold whitespace-nowrap`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 lg:hidden">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--c-muted)]">
              Portal Function
              <select
                value={currentFunction}
                onChange={(event) => setActiveFunction(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
              >
                {FUNCTION_ITEMS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--c-accent)]/30 bg-[color:color-mix(in_srgb,var(--c-accent)_14%,transparent)] text-[var(--c-accent)]">
                <activeMeta.Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-black text-[var(--c-text)]">{activeMeta.label}</p>
            </div>
            <p className="text-xs text-[var(--c-muted)]">{activeMeta.description}</p>
          </div>

          <div key={`${currentFunction}-${portalId || 'base'}-${isCreateRoute ? 'create' : isEditRoute ? 'edit' : 'view'}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
            {renderActiveContent()}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default PortalManagementPage;


