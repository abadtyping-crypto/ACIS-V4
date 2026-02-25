import { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useAuth } from '../context/AuthContext';

import { Wallet } from 'lucide-react';
import PortalSummarySection from '../components/portal/PortalSummarySection';
import LoanManagementSection from '../components/portal/LoanManagementSection';
import InternalTransferSection from '../components/portal/InternalTransferSection';
import PortalSetupSection from '../components/portal/PortalSetupSection';
import RecentTransactionsSection from '../components/portal/RecentTransactionsSection';
import ReportsSection from '../components/portal/ReportsSection';
import { useRecycleBin } from '../context/RecycleBinContext';

const PortalManagementPage = () => {
  const { user } = useAuth();

  // State to handle which sections are expanded (for coordination if needed)
  const [activeSections, setActiveSections] = useState({
    summary: true,
    loan: false,
    transfer: false,
    setup: false,
    recent: false,
    reports: false
  });

  const [refreshCounter, setRefreshCounter] = useState(0);
  const { registerRestoreListener } = useRecycleBin();

  useEffect(() => {
    const unsubscribe = registerRestoreListener(() => {
      setRefreshCounter((prev) => prev + 1);
    });
    return unsubscribe;
  }, [registerRestoreListener]);

  const toggleSection = (key) => {
    setActiveSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQuickAction = (key) => {
    setActiveSections(prev => ({
      ...prev,
      [key]: true,
      // Optionally collapse others for focus on mobile
      summary: false
    }));

    // Scroll to the section after a tiny delay to allow expansion
    setTimeout(() => {
      const el = document.getElementById(`section-${key}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (!user) return null;

  return (
    <PageShell
      title="Portal Management Hub"
      subtitle="Centralized control for portals, loans, and transfers."
      icon={Wallet}
    >
      <div className="mx-auto max-w-4xl space-y-6 pb-20">
        {/* 1. Portal Summary Section */}
        <div id="section-summary">
          <PortalSummarySection
            onQuickAction={handleQuickAction}
            refreshKey={refreshCounter}
          />
        </div>

        {/* 2. Loan Management Section */}
        <div id="section-loan">
          <LoanManagementSection
            isOpen={activeSections.loan}
            onToggle={() => toggleSection('loan')}
            refreshKey={refreshCounter}
          />
        </div>

        {/* 3. Internal Transfer Section */}
        <div id="section-transfer">
          <InternalTransferSection
            isOpen={activeSections.transfer}
            onToggle={() => toggleSection('transfer')}
            refreshKey={refreshCounter}
          />
        </div>

        {/* 4. Portal Setup Section */}
        <div id="section-setup">
          <PortalSetupSection
            isOpen={activeSections.setup}
            onToggle={() => toggleSection('setup')}
            refreshKey={refreshCounter}
          />
        </div>

        {/* 5. Recent Activity Section */}
        <div id="section-recent">
          <RecentTransactionsSection
            isOpen={activeSections.recent}
            onToggle={() => toggleSection('recent')}
            refreshKey={refreshCounter}
          />
        </div>

        {/* 6. Reports Section */}
        <div id="section-reports">
          <ReportsSection
            isOpen={activeSections.reports}
            onToggle={() => toggleSection('reports')}
            refreshKey={refreshCounter}
          />
        </div>
      </div>

    </PageShell>
  );
};

export default PortalManagementPage;
