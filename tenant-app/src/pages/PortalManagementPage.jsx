import { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { BellIcon, InvoiceIcon, PortalIcon, ReceiptIcon, SettingsIcon, TasksIcon } from '../components/icons/AppIcons';
import PortalSummarySection from '../components/portal/PortalSummarySection';
import LoanManagementSection from '../components/portal/LoanManagementSection';
import InternalTransferSection from '../components/portal/InternalTransferSection';
import PortalSetupSection from '../components/portal/PortalSetupSection';
import RecentTransactionsSection from '../components/portal/RecentTransactionsSection';
import ReportsSection from '../components/portal/ReportsSection';
import { useRecycleBin } from '../context/RecycleBinContext';
import { useAuth } from '../context/AuthContext';
import useIsDesktopLayout from '../hooks/useIsDesktopLayout';
import '../styles/mobile/portal.css';

const PortalManagementPage = () => {
  const { user } = useAuth();
  const isDesktop = useIsDesktopLayout();
  const { registerRestoreListener } = useRecycleBin();
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [activeSections, setActiveSections] = useState({
    summary: true,
    loan: false,
    transfer: false,
    setup: false,
    recent: false,
    reports: false,
  });
  const [mobileSection, setMobileSection] = useState('summary');

  useEffect(() => {
    const unsubscribe = registerRestoreListener(() => {
      setRefreshCounter((prev) => prev + 1);
    });
    return unsubscribe;
  }, [registerRestoreListener]);

  const toggleSection = (key) => {
    setActiveSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const focusSection = (key) => {
    setMobileSection(key);
    setActiveSections({
      summary: key === 'summary',
      loan: key === 'loan',
      transfer: key === 'transfer',
      setup: key === 'setup',
      recent: key === 'recent',
      reports: key === 'reports',
    });
  };

  const handleQuickAction = (key) => {
    if (isDesktop) {
      setActiveSections((prev) => ({
        ...prev,
        [key]: true,
        summary: false,
      }));
    } else {
      focusSection(key);
    }
    setTimeout(() => {
      const el = document.getElementById(`section-${key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const mobileSections = [
    { key: 'summary', label: 'Overview', Icon: PortalIcon },
    { key: 'loan', label: 'Loan', Icon: ReceiptIcon },
    { key: 'transfer', label: 'Transfer', Icon: TasksIcon },
    { key: 'setup', label: 'Setup', Icon: SettingsIcon },
    { key: 'recent', label: 'Recent', Icon: BellIcon },
    { key: 'reports', label: 'Reports', Icon: InvoiceIcon },
  ];

  if (!user) return null;

  if (isDesktop) {
    return (
      <PageShell
        title="Portal Management Hub"
        subtitle="Centralized control for portals, loans, and transfers."
        icon={PortalIcon}
      >
        <div className="w-full space-y-6 pb-20">
          <div id="section-summary">
            <PortalSummarySection onQuickAction={handleQuickAction} refreshKey={refreshCounter} />
          </div>
          <div id="section-loan">
            <LoanManagementSection isOpen={activeSections.loan} onToggle={() => toggleSection('loan')} refreshKey={refreshCounter} />
          </div>
          <div id="section-transfer">
            <InternalTransferSection isOpen={activeSections.transfer} onToggle={() => toggleSection('transfer')} refreshKey={refreshCounter} />
          </div>
          <div id="section-setup">
            <PortalSetupSection isOpen={activeSections.setup} onToggle={() => toggleSection('setup')} refreshKey={refreshCounter} />
          </div>
          <div id="section-recent">
            <RecentTransactionsSection isOpen={activeSections.recent} onToggle={() => toggleSection('recent')} refreshKey={refreshCounter} />
          </div>
          <div id="section-reports">
            <ReportsSection isOpen={activeSections.reports} onToggle={() => toggleSection('reports')} refreshKey={refreshCounter} />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <section className="portal-mobile-page px-2 py-3">
      <div className="mx-auto w-full max-w-7xl portal-mobile-focus">
        <header className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] px-3 py-2.5">
          <h1 className="text-base font-black tracking-wide text-[var(--c-text)]">Portals</h1>
          <button
            type="button"
            onClick={() => focusSection('summary')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]"
            aria-label="Overview"
            title="Overview"
          >
            <PortalIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="mb-3 rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] p-2">
          <div className="grid grid-cols-6 gap-1.5">
            {mobileSections.map((item) => {
              const isActive = mobileSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => focusSection(item.key)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border transition ${
                    isActive
                      ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/16 text-[var(--c-text)]'
                      : 'border-[var(--c-border)] bg-[var(--c-panel)]/65 text-[var(--c-muted)]'
                  }`}
                  aria-label={item.label}
                  title={item.label}
                >
                  <item.Icon className="h-4.5 w-4.5" />
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">{item.label.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div id="section-summary" className={mobileSection === 'summary' ? 'block' : 'hidden'}>
          <PortalSummarySection onQuickAction={handleQuickAction} refreshKey={refreshCounter} />
        </div>
        <div id="section-loan" className={mobileSection === 'loan' ? 'block' : 'hidden'}>
          <LoanManagementSection isOpen={true} onToggle={() => focusSection('summary')} refreshKey={refreshCounter} />
        </div>
        <div id="section-transfer" className={mobileSection === 'transfer' ? 'block' : 'hidden'}>
          <InternalTransferSection isOpen={true} onToggle={() => focusSection('summary')} refreshKey={refreshCounter} />
        </div>
        <div id="section-setup" className={mobileSection === 'setup' ? 'block' : 'hidden'}>
          <PortalSetupSection isOpen={true} onToggle={() => focusSection('summary')} refreshKey={refreshCounter} />
        </div>
        <div id="section-recent" className={mobileSection === 'recent' ? 'block' : 'hidden'}>
          <RecentTransactionsSection isOpen={true} onToggle={() => focusSection('summary')} refreshKey={refreshCounter} />
        </div>
        <div id="section-reports" className={mobileSection === 'reports' ? 'block' : 'hidden'}>
          <ReportsSection isOpen={true} onToggle={() => focusSection('summary')} refreshKey={refreshCounter} />
        </div>
      </div>
    </section>
  );
};

export default PortalManagementPage;
