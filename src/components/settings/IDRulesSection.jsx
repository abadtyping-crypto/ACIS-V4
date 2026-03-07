import { useEffect, useState, useCallback } from 'react';
import { useTenant } from '../../context/TenantContext';
import { getTenantSettingDoc, upsertTenantSettingDoc, db } from '../../lib/backendStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import SettingCard from './SettingCard';

const IDRulesSection = () => {
    const { tenantId } = useTenant();
    const [rules, setRules] = useState({
        CLID: { prefix: 'CLID', padding: 4 },
        DPID: { prefix: 'DPID', padding: 4 },
        POR: { prefix: 'POR', padding: 4, skipDate: false, sequenceStart: 1 },
        EXP: { prefix: 'EXP', padding: 4, skipDate: false, sequenceStart: 1 },
        LON: { prefix: 'LON', padding: 4, skipDate: false, sequenceStart: 1 },
        LOAN: { prefix: 'LOAN', padding: 4, skipDate: true, sequenceStart: 1 },
        TRK: { prefix: 'TRK', padding: 4, skipDate: false, sequenceStart: 1 },
        DTID: { prefix: 'APP', padding: 4, skipDate: false, sequenceStart: 1 },
    });
    const [docRefs, setDocRefs] = useState({
        proformaInvoice: { prefix: 'PRO', dateFormat: 'YYYYMMDD', padding: 4 },
        quotation: { prefix: 'QUOT', dateFormat: 'YYYYMMDD', padding: 4 },
        clientPayment: { prefix: 'PAY', dateFormat: 'DDMMYYYY', padding: 4 },
        invoice: { prefix: 'PAY', dateFormat: 'DDMMYYYY', padding: 4 },
        taskAssignment: { prefix: 'PAY', dateFormat: 'DDMMYYYY', padding: 4 },
    });
    const [counters, setCounters] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const res = await getTenantSettingDoc(tenantId, 'transactionIdRules');
            if (res.ok && res.data) {
                setRules(prev => ({ ...prev, ...res.data }));
                if (res.data.docRefCodes) {
                    setDocRefs(prev => ({ ...prev, ...res.data.docRefCodes }));
                }
            }

            // Fetch counters
            const clientCounterSnap = await getDoc(doc(db, 'tenants', tenantId, 'counters', 'clients'));
            const txCounterSnap = await getDoc(doc(db, 'tenants', tenantId, 'counters', 'transactions'));

            setCounters({
                clients: clientCounterSnap.exists() ? clientCounterSnap.data() : {},
                transactions: txCounterSnap.exists() ? txCounterSnap.data() : {},
            });

            setIsLoading(false);
        };
        fetchData();
    }, [tenantId]);

    const handleRuleChange = (key, field, value) => {
        setRules(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleDocRefChange = (key, field, value) => {
        setDocRefs(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setStatus({ type: 'info', message: 'Updating ID rules...' });
        const res = await upsertTenantSettingDoc(tenantId, 'transactionIdRules', {
            ...rules,
            docRefCodes: docRefs,
        });

        if (res.ok) {
            // Write Sync Event
            const ts = Date.now();
            const eventId = `se_rules_${ts}`;
            await setDoc(doc(db, 'tenants', tenantId, 'syncEvents', eventId), {
                tenantId,
                entityId: 'transactionIdRules',
                entityType: 'settings',
                eventType: 'update',
                changedFields: ['transactionIdRules', 'docRefCodes'],
                createdAt: serverTimestamp(),
                createdBy: 'system', // Target uid if available
                syncStatus: 'pending'
            });
            setStatus({ type: 'success', message: 'ID rules updated successfully!' });
        } else {
            setStatus({ type: 'error', message: res.error || 'Failed to update rules.' });
        }
        setIsSaving(false);
    }, [tenantId, rules, docRefs]);

    const handleUpdateCounter = useCallback(async (collectionName, field, newVal) => {
        const val = parseInt(newVal);
        if (isNaN(val)) return;

        if (!window.confirm(`Are you sure you want to manually set ${field} to ${val}? This may cause ID collisions.`)) return;

        setIsSaving(true);
        setStatus({ type: 'info', message: `Updating ${field}...` });

        try {
            const ref = doc(db, 'tenants', tenantId, 'counters', collectionName);
            await setDoc(ref, { [field]: val }, { merge: true });

            // Write Sync Event
            const ts = Date.now();
            const eventId = `se_counter_${field}_${ts}`;
            await setDoc(doc(db, 'tenants', tenantId, 'syncEvents', eventId), {
                tenantId,
                entityId: field,
                entityType: 'counter',
                eventType: 'update',
                changedFields: [field],
                createdAt: serverTimestamp(),
                createdBy: 'system',
                syncStatus: 'pending'
            });

            setCounters(prev => ({
                ...prev,
                [collectionName]: { ...prev[collectionName], [field]: val }
            }));
            setStatus({ type: 'success', message: `${field} updated to ${val}` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to update counter.' });
        }
        setIsSaving(false);
    }, [tenantId]);

    if (isLoading) return <p className="text-xs text-[var(--c-muted)]">Loading system rules...</p>;

    const getCounterVal = (key) => {
        if (key === 'CLID') return counters.clients?.lastClientSeq || 0;
        if (key === 'DPID') return counters.clients?.lastDependentSeq || 0;
        if (key === 'POR') return counters.transactions?.lastPORSeq || 0;
        if (key === 'EXP') return counters.transactions?.lastEXPSeq || 0;
        if (key === 'LON') return counters.transactions?.lastLONSeq || 0;
        if (key === 'LOAN') return counters.transactions?.lastLOANSeq || 0;
        if (key === 'TRF') return counters.transactions?.lastTRFSeq || 0;
        if (key === 'DTID') return counters.transactions?.lastDTIDSeq || 0;
        return 0;
    };

    const getCounterMeta = (key) => {
        if (key === 'CLID') return { col: 'clients', field: 'lastClientSeq' };
        if (key === 'DPID') return { col: 'clients', field: 'lastDependentSeq' };
        if (key === 'POR') return { col: 'transactions', field: 'lastPORSeq' };
        if (key === 'EXP') return { col: 'transactions', field: 'lastEXPSeq' };
        if (key === 'LON') return { col: 'transactions', field: 'lastLONSeq' };
        if (key === 'LOAN') return { col: 'transactions', field: 'lastLOANSeq' };
        if (key === 'TRF') return { col: 'transactions', field: 'lastTRFSeq' };
        if (key === 'TRK') return { col: 'counters', field: 'lastTRKSeq' };
        if (key === 'DTID') return { col: 'transactions', field: 'lastDTIDSeq' };
        return null;
    };

    return (
        <div className="space-y-6">
            <SettingCard
                title="ID Prefixing & Sequence Control"
                description="Consolidated view of how IDs are generated and their current counters."
            >
                <div className="grid gap-4">
                    <div className="rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_42%,transparent)] p-2">
                        <div className="overflow-x-auto rounded-xl">
                            <table className="min-w-[1040px] w-full text-left text-sm">
                                <thead className="bg-[var(--c-surface)]">
                                    <tr className="border-b border-[var(--c-border)] text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                                        <th className="pb-3 pl-2">Entity Type</th>
                                        <th className="pb-3">Prefix</th>
                                        <th className="pb-3">Skip Date</th>
                                        <th className="pb-3">Seq Start</th>
                                        <th className="pb-3">Padding</th>
                                        <th className="pb-3">Current Seq</th>
                                        <th className="pb-3 text-right pr-2">Next ID Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--c-border)] bg-[var(--c-surface)]">
                                    {[
                                        { key: 'CLID', label: 'Clients (Co/Ind)' },
                                        { key: 'DPID', label: 'Dependents' },
                                        { key: 'POR', label: 'Portal Trans.' },
                                        { key: 'EXP', label: 'Expenses' },
                                        { key: 'LON', label: 'Loans (Transactions)' },
                                        { key: 'LOAN', label: 'Loan Persons' },
                                        { key: 'TRF', label: 'Transfers' },
                                        { key: 'TRK', label: 'Tracking IDs' },
                                        { key: 'DTID', label: 'Daily Trans (APP)' },
                                    ].map(item => {
                                        const currentSeq = getCounterVal(item.key);
                                        const meta = getCounterMeta(item.key);
                                        const prefix = rules[item.key]?.prefix || item.key;
                                        const skipDate = rules[item.key]?.skipDate === true;
                                        const sequenceStart = Number(rules[item.key]?.sequenceStart) || 1;
                                        const padding = Number(rules[item.key]?.padding) || 4;

                                        return (
                                            <tr key={item.key} className="group hover:bg-[var(--c-panel)]/50 transition">
                                                <td className="py-4 pl-2 whitespace-nowrap">
                                                    <p className="font-bold text-[var(--c-text)]">{item.label}</p>
                                                    <p className="text-[10px] font-medium text-[var(--c-muted)]">{item.key}</p>
                                                </td>
                                                <td className="py-4">
                                                    <input
                                                        type="text"
                                                        maxLength={5}
                                                        value={prefix}
                                                        onChange={(e) => handleRuleChange(item.key, 'prefix', e.target.value.toUpperCase())}
                                                        className="w-20 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5 text-xs font-black text-[var(--c-accent)] outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                                    />
                                                </td>
                                                <td className="py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRuleChange(item.key, 'skipDate', !skipDate)}
                                                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${skipDate ? 'bg-slate-700 text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}
                                                    >
                                                        {skipDate ? 'Yes' : 'No'}
                                                    </button>
                                                </td>
                                                <td className="py-4">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={999999}
                                                        value={sequenceStart}
                                                        onChange={(e) => handleRuleChange(item.key, 'sequenceStart', e.target.value)}
                                                        className="w-20 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5 text-xs font-bold text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                                    />
                                                </td>
                                                <td className="py-4">
                                                    <input
                                                        type="number"
                                                        min={2}
                                                        max={8}
                                                        value={padding}
                                                        onChange={(e) => handleRuleChange(item.key, 'padding', e.target.value)}
                                                        className="w-16 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5 text-xs font-bold text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                                    />
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-bold text-[var(--c-text)]">{currentSeq}</span>
                                                        <button
                                                            onClick={() => {
                                                                const next = prompt(`Update ${item.label} counter:`, currentSeq);
                                                                if (next !== null && meta) handleUpdateCounter(meta.col, meta.field, next);
                                                            }}
                                                            className="text-[10px] font-bold text-[var(--c-accent)] opacity-0 group-hover:opacity-100 transition hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right pr-2 whitespace-nowrap">
                                                    <span className="rounded-md bg-[var(--c-accent)]/5 px-2 py-1 text-[11px] font-black tracking-wider text-[var(--c-accent)]">
                                                        {skipDate || item.key === 'LOAN'
                                                            ? `${prefix}${String(Math.max(currentSeq + 1, sequenceStart)).padStart(padding, '0')}`
                                                            : `${prefix}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.max(currentSeq + 1, sequenceStart)).padStart(padding, '0')}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-2 flex justify-end px-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-xl bg-[var(--c-accent)] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Commit All ID Rules'}
                        </button>
                    </div>
                </div>
            </SettingCard>

            <SettingCard
                title="Document Reference Codes"
                description="Configure reference codes for documents like proforma invoices, quotations, and payments."
            >
                <div className="grid gap-3">
                    <div className="rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_42%,transparent)] p-2">
                        <div className="overflow-x-auto rounded-xl">
                            <table className="min-w-[880px] w-full text-left text-sm">
                                <thead className="bg-[var(--c-surface)]">
                                    <tr className="border-b border-[var(--c-border)] text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                                        <th className="pb-3 pl-2">Document Type</th>
                                        <th className="pb-3">Prefix</th>
                                        <th className="pb-3">Date Format</th>
                                        <th className="pb-3">Padding</th>
                                        <th className="pb-3 text-right pr-2">Example</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--c-border)] bg-[var(--c-surface)]">
                                    {[
                                        { key: 'proformaInvoice', label: 'Proforma Invoice' },
                                        { key: 'quotation', label: 'Quotation' },
                                        { key: 'clientPayment', label: 'Client Payment' },
                                        { key: 'invoice', label: 'Invoice' },
                                        { key: 'taskAssignment', label: 'Task Assignment' },
                                    ].map(item => {
                                        const prefix = docRefs[item.key]?.prefix || '';
                                        const dateFormat = docRefs[item.key]?.dateFormat || 'YYYYMMDD';
                                        const padding = Number(docRefs[item.key]?.padding) || 4;
                                        const dateExample = dateFormat === 'DDMMYYYY' ? '24022026' : '20260224';
                                        return (
                                            <tr key={item.key} className="group hover:bg-[var(--c-panel)]/50 transition">
                                                <td className="py-4 pl-2 whitespace-nowrap">
                                                    <p className="font-bold text-[var(--c-text)]">{item.label}</p>
                                                    <p className="text-[10px] font-medium text-[var(--c-muted)]">{item.key}</p>
                                                </td>
                                                <td className="py-4">
                                                    <input
                                                        type="text"
                                                        maxLength={8}
                                                        value={prefix}
                                                        onChange={(e) => handleDocRefChange(item.key, 'prefix', e.target.value.toUpperCase())}
                                                        className="w-24 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5 text-xs font-black text-[var(--c-accent)] outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                                    />
                                                </td>
                                                <td className="py-4">
                                                    <select
                                                        value={dateFormat}
                                                        onChange={(e) => handleDocRefChange(item.key, 'dateFormat', e.target.value)}
                                                        className="w-28 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5 text-xs font-bold text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                                    >
                                                        <option value="YYYYMMDD">YYYYMMDD</option>
                                                        <option value="DDMMYYYY">DDMMYYYY</option>
                                                    </select>
                                                </td>
                                                <td className="py-4">
                                                    <input
                                                        type="number"
                                                        min={2}
                                                        max={8}
                                                        value={padding}
                                                        onChange={(e) => handleDocRefChange(item.key, 'padding', e.target.value)}
                                                        className="w-16 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5 text-xs font-bold text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                                    />
                                                </td>
                                                <td className="py-4 text-right pr-2 whitespace-nowrap">
                                                    <span className="rounded-md bg-[var(--c-accent)]/5 px-2 py-1 text-[11px] font-black tracking-wider text-[var(--c-accent)]">
                                                        {prefix}-{dateExample}-{String(1).padStart(padding, '0')}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </SettingCard>

            {status.message && (
                <div className={`rounded-xl border p-4 text-center text-sm font-bold animate-in fade-in slide-in-from-top-2 ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default IDRulesSection;
