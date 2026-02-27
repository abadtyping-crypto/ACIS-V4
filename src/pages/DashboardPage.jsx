import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { useTenant } from '../context/TenantContext';
import CurrencyValue from '../components/common/CurrencyValue';
import {
  fetchLoanPersons,
  fetchTenantPortals,
  fetchTenantTransactions,
} from '../lib/backendStore';

const fallbackPortalIcon = (type) => {
  if (type === 'Bank') return '/portals/bank.png';
  if (type === 'Card Payment') return '/portals/cardpayment.png';
  if (type === 'Petty Cash') return '/portals/pettycash.png';
  if (type === 'Terminal') return '/portals/terminal.png';
  return '/portals/portals.png';
};

const DashboardPage = () => {
  const { tenant, tenantId } = useTenant();
  const [isLoading, setIsLoading] = useState(true);
  const [portals, setPortals] = useState([]);
  const [loanSummary, setLoanSummary] = useState([]);
  const [showAllPortals, setShowAllPortals] = useState(false);
  const [showAllLoans, setShowAllLoans] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);
    Promise.all([
      fetchTenantPortals(tenantId),
      fetchLoanPersons(tenantId),
      fetchTenantTransactions(tenantId),
    ]).then(([portalRes, personRes, txRes]) => {
      if (portalRes.ok) {
        setPortals(portalRes.rows || []);
      }
      if (personRes.ok) {
        const people = (personRes.rows || []).filter((p) => !p.deletedAt);
        const txRows = txRes.ok ? (txRes.rows || []) : [];
        const pendingByPerson = {};

        txRows.forEach((tx) => {
          const personId = String(tx?.personId || '');
          if (!personId || tx?.deletedAt) return;
          const txType = String(tx?.type || '').toLowerCase();
          const amount = Number(tx?.amount || 0);
          if (!Number.isFinite(amount) || amount === 0) return;
          if (txType !== 'disbursement' && txType !== 'repayment') return;

          // Person-side loan entries are positive amounts; sign inferred from type.
          pendingByPerson[personId] = (pendingByPerson[personId] || 0) + (txType === 'disbursement' ? amount : -amount);
        });

        const summary = people.map((person) => ({
          ...person,
          pendingBalance: pendingByPerson[person.id] || 0,
        }));
        setLoanSummary(summary);
      }
      setIsLoading(false);
    });
  }, [tenantId]);

  const totalPortalBalance = useMemo(
    () => portals.reduce((sum, item) => sum + Number(item.balance || 0), 0),
    [portals],
  );

  const totalLoanOutstanding = useMemo(
    () => loanSummary.reduce((sum, item) => sum + Number(item.pendingBalance || 0), 0),
    [loanSummary],
  );

  const visiblePortals = showAllPortals ? portals : portals.slice(0, 3);
  const visibleLoans = showAllLoans ? loanSummary : loanSummary.slice(0, 3);

  return (
    <PageShell
      title={`${tenant.name} Dashboard`}
      subtitle="Quick business overview, status indicators, and shortcuts."
      icon={LayoutDashboard}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--c-muted)]">Portals</p>
          <p className="mt-2 text-2xl font-black text-[var(--c-text)]">{portals.length}</p>
          <p className="text-sm text-[var(--c-muted)]">Configured operational portals</p>
        </article>
        <article className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--c-muted)]">Loan Persons</p>
          <p className="mt-2 text-2xl font-black text-[var(--c-text)]">{loanSummary.length}</p>
          <p className="text-sm text-[var(--c-muted)]">Tracked in loan management</p>
        </article>
        <article className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--c-muted)]">Net Liquidity</p>
          <div className="mt-2 text-2xl font-black text-[var(--c-text)]">
            <CurrencyValue value={totalPortalBalance - totalLoanOutstanding} iconSize="h-6 w-6" />
          </div>
          <p className="text-sm text-[var(--c-muted)]">Portals less loan exposure</p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[var(--c-text)]">Portal Summary</p>
              <p className="text-xs text-[var(--c-muted)]">All added portals are reflected here</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllPortals((prev) => !prev)}
              className="rounded-lg border border-[var(--c-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--c-muted)] hover:text-[var(--c-text)]"
            >
              {showAllPortals ? 'Summarize' : 'Expand'}
            </button>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <p className="py-4 text-center text-xs text-[var(--c-muted)]">Loading portals...</p>
            ) : visiblePortals.length === 0 ? (
              <p className="py-4 text-center text-xs text-[var(--c-muted)]">No portals found.</p>
            ) : (
              visiblePortals.map((portal) => (
                <div
                  key={portal.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-surface)] to-[var(--c-panel)] p-3"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-lg">
                    <img
                      src={portal.iconUrl || fallbackPortalIcon(portal.type)}
                      alt={portal.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackPortalIcon(portal.type);
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--c-text)]">{portal.name}</p>
                    <p className={`text-xs font-bold ${portal.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      <CurrencyValue value={portal.balance || 0} iconSize="h-3 w-3" />
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[var(--c-text)]">Loan Summary</p>
              <p className="text-xs text-[var(--c-muted)]">Summarized in compact mode, full in expand mode</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllLoans((prev) => !prev)}
              className="rounded-lg border border-[var(--c-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--c-muted)] hover:text-[var(--c-text)]"
            >
              {showAllLoans ? 'Summarize' : 'Expand'}
            </button>
          </div>

          <div className="mb-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-muted)]">Total Pending</p>
            <p className={`text-sm font-black ${totalLoanOutstanding > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              <CurrencyValue value={totalLoanOutstanding} iconSize="h-3.5 w-3.5" />
            </p>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <p className="py-4 text-center text-xs text-[var(--c-muted)]">Loading loans...</p>
            ) : visibleLoans.length === 0 ? (
              <p className="py-4 text-center text-xs text-[var(--c-muted)]">No loan persons found.</p>
            ) : (
              visibleLoans.map((person) => (
                <div key={person.id} className="flex items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                  <p className="truncate text-sm font-bold text-[var(--c-text)]">{person.name}</p>
                  <p className={`text-xs font-bold ${person.pendingBalance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    <CurrencyValue value={person.pendingBalance || 0} iconSize="h-3 w-3" />
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </PageShell>
  );
};

export default DashboardPage;
