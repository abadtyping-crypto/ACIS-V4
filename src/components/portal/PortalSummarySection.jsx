import { useState, useEffect } from 'react';
import SectionCard from './SectionCard';
import { fetchTenantPortals } from '../../lib/backendStore';
import { useTenant } from '../../context/TenantContext';
import CurrencyValue from '../common/CurrencyValue';

const fallbackPortalIcon = (type) => {
    if (type === 'Bank') return '/portals/bank.png';
    if (type === 'Card Payment') return '/portals/cardpayment.png';
    if (type === 'Petty Cash') return '/portals/pettycash.png';
    if (type === 'Terminal') return '/portals/terminal.png';
    return '/portals/portals.png';
};

const PortalSummarySection = ({ onQuickAction, refreshKey }) => {
    const { tenantId } = useTenant();
    const [portals, setPortals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        fetchTenantPortals(tenantId).then(res => {
            if (res.ok) setPortals(res.rows);
            setIsLoading(false);
        });
    }, [tenantId, refreshKey]);

    return (
        <SectionCard
            title="Portal Summary"
            subtitle="View your active balances and liquidity"
        >
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--c-accent)] border-t-transparent" />
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {portals.map(p => (
                            <div key={p.id} className="group relative flex items-center gap-4 rounded-2xl border border-[var(--c-border)] bg-gradient-to-br from-[var(--c-surface)] to-[var(--c-panel)] p-4 shadow-sm transition hover:border-[var(--c-accent)]">
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-white p-1 ring-1 ring-slate-200/90">
                                    <img
                                        src={p.iconUrl || fallbackPortalIcon(p.type)}
                                        alt={p.name}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = fallbackPortalIcon(p.type);
                                        }}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-[var(--c-text)] truncate">{p.name}</p>
                                    <div className={`text-sm font-bold ${p.balanceType === 'negative' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        <CurrencyValue value={p.balance || 0} iconSize="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Action Navigation */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => onQuickAction('loan')} className="flex items-center gap-2 rounded-xl bg-[var(--c-accent)]/10 px-4 py-2 text-xs font-bold text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-white transition">
                        + New Loan
                    </button>
                    <button onClick={() => onQuickAction('transfer')} className="flex items-center gap-2 rounded-xl bg-[var(--c-accent)]/10 px-4 py-2 text-xs font-bold text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-white transition">
                        ⇄ Internal Transfer
                    </button>
                    <button onClick={() => onQuickAction('setup')} className="flex items-center gap-2 rounded-xl bg-[var(--c-accent)]/10 px-4 py-2 text-xs font-bold text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-white transition">
                        ⚙️ Portal Setup
                    </button>
                </div>
            </div>
        </SectionCard>
    );
};

export default PortalSummarySection;
