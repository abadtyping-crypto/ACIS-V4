import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import {
    generateNextTransactionId,
    createDailyTransactionWithFinancials,
    fetchTenantPortals,
    fetchTenantClients
} from '../lib/backendStore';
import { createSyncEvent } from '../lib/syncEvents';
import ClientSearchField from '../components/dailyTransaction/ClientSearchField';
import ServiceSearchField from '../components/dailyTransaction/ServiceSearchField';
import TransactionLiveList from '../components/dailyTransaction/TransactionLiveList';
import QuickAddServiceTemplateModal from '../components/dailyTransaction/QuickAddServiceTemplateModal';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';
import DirhamIcon from '../components/common/DirhamIcon';
import { Plus, FileText, Calendar } from 'lucide-react';

const inputClass = "mt-1 w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/5 font-bold";
const selectClass = "mt-1 w-full rounded-2xl border-2 border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-sm font-black text-[var(--c-text)] outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20";

const transactionMethods = [
    { id: 'cashByHand', label: 'Cash by Hand', icon: '/portals/methods/cashByHand.png' },
    { id: 'bankTransfer', label: 'Bank Transfer', icon: '/portals/methods/banktransfer.png' },
    { id: 'cdmDeposit', label: 'CDM Deposit', icon: '/portals/methods/cdmDeposit.png' },
    { id: 'checqueDeposit', label: 'Cheque Deposit', icon: '/portals/methods/checqueDeposit.png' },
    { id: 'onlinePayment', label: 'Online Payment', icon: '/portals/methods/onlinePayment.png' },
    { id: 'cashWithdrawals', label: 'Cash Withdrawals', icon: '/portals/methods/cashWithdrawal.png' },
    { id: 'tabby', label: 'Tabby', icon: '/portals/methods/tabby.png' },
    { id: 'Tamara', label: 'Tamara', icon: '/portals/methods/tamara.png' },
];

const DailyTransactionPage = () => {
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    // Form State
    const [selectedParent, setSelectedParent] = useState(null);
    const [selectedDependent, setSelectedDependent] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedPortalId, setSelectedPortalId] = useState('');
    const [selectedPortalMethod, setSelectedPortalMethod] = useState('');
    const [dtid, setDtid] = useState('');
    const [govCharge, setGovCharge] = useState('');
    const [clientCharge, setClientCharge] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

    const [portals, setPortals] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [refreshListKey, setRefreshListKey] = useState(0);
    const [serviceRefreshKey, setServiceRefreshKey] = useState(0);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [hasDependentsForSelectedClient, setHasDependentsForSelectedClient] = useState(false);
    const [methodIconMap, setMethodIconMap] = useState({});
    const [activeView, setActiveView] = useState('add');

    // Context from URL
    const urlClientId = searchParams.get('clientId');

    const loadEssentials = useCallback(async () => {
        if (!tenantId) return;
        try {
            const [id, portalRes, clientRes] = await Promise.all([
                generateNextTransactionId(tenantId, 'DTID'),
                fetchTenantPortals(tenantId),
                urlClientId ? fetchTenantClients(tenantId) : Promise.resolve({ ok: false })
            ]);

            setDtid(id);
            if (portalRes.ok) {
                setPortals(portalRes.rows);
                setSelectedPortalId('');
                setSelectedPortalMethod('');
            }

            if (clientRes.ok && urlClientId) {
                const found = clientRes.rows.find(c => c.id === urlClientId);
                if (found) {
                    setSelectedParent(found);
                }
            }
        } catch (err) {
            console.error('[DailyTransactionPage] Load failed:', err);
            setError('Failed to load initial data.');
        }
    }, [tenantId, urlClientId]);

    useEffect(() => {
        const handle = requestAnimationFrame(loadEssentials);
        return () => cancelAnimationFrame(handle);
    }, [loadEssentials]);

    useEffect(() => {
        let active = true;
        const checkDependents = async () => {
            if (!tenantId || !selectedParent?.id) {
                setHasDependentsForSelectedClient(false);
                return;
            }
            const res = await fetchTenantClients(tenantId);
            if (!active || !res.ok) {
                setHasDependentsForSelectedClient(false);
                return;
            }
            const hasDependents = (res.rows || []).some(
                (item) =>
                    String(item.type || '').toLowerCase() === 'dependent' &&
                    String(item.parentId) === String(selectedParent.id),
            );
            setHasDependentsForSelectedClient(hasDependents);
            if (!hasDependents) setSelectedDependent(null);
        };
        void checkDependents();
        return () => {
            active = false;
        };
    }, [tenantId, selectedParent?.id]);

    useEffect(() => {
        if (!tenantId) return;
        let isMounted = true;
        fetchApplicationIconLibrary(tenantId).then((res) => {
            if (!isMounted || !res.ok) return;
            const next = {};
            (res.rows || []).forEach((row) => {
                const key = String(row?.iconId || '').trim().toLowerCase();
                if (!key || !row?.iconUrl) return;
                next[key] = row.iconUrl;
            });
            setMethodIconMap(next);
        });
        return () => {
            isMounted = false;
        };
    }, [tenantId]);

    const profit = useMemo(() => {
        const c = Number(clientCharge) || 0;
        const g = Number(govCharge) || 0;
        return c - g;
    }, [clientCharge, govCharge]);

    const selectedPortal = useMemo(
        () => portals.find((item) => item.id === selectedPortalId) || null,
        [portals, selectedPortalId],
    );
    const portalMethods = useMemo(
        () => transactionMethods.filter((method) => (selectedPortal?.methods || []).includes(method.id)),
        [selectedPortal],
    );

    const handleServiceSelect = (tpl) => {
        setSelectedService(tpl);
        setGovCharge(String(tpl.govCharge || '0'));
        setClientCharge(String(tpl.clientCharge || '0'));
    };

    const handleReset = async () => {
        setSelectedParent(null);
        setSelectedDependent(null);
        setSelectedService(null);
        setGovCharge('');
        setClientCharge('');
        setSuccess('');
        setError('');
        const nextId = await generateNextTransactionId(tenantId, 'DTID');
        setDtid(nextId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const clientToSave = selectedDependent || selectedParent;
        if (!clientToSave) return setError('Please select a client.');
        if (!selectedService) return setError('Please select an application type.');
        if (!selectedPortalId) return setError('Please select a payment portal.');
        if (!selectedPortalMethod) return setError('Please select a portal transaction method.');
        if (!clientCharge || isNaN(clientCharge)) return setError('Invalid client charge.');

        setIsSaving(true);
        setError('');

        const txId = dtid;
        const selectedClient = selectedParent;
        const payload = {
            transactionId: dtid,
            applicationId: selectedService?.id || null,
            clientId: selectedClient?.id || clientToSave.id,
            dependentId: selectedDependent?.id || null,
            paidPortalId: selectedPortalId,
            portalTransactionMethod: selectedPortalMethod,
            govCharge: Number(govCharge || 0),
            clientCharge: Number(clientCharge || 0),
            profit: profit,
            status: 'active',
            invoiced: false,
            createdBy: user.uid,
            createdAt: new Date(transactionDate).toISOString(),
        };

        const res = await createDailyTransactionWithFinancials(tenantId, txId, payload);
        if (res.ok) {
            await createSyncEvent({
                tenantId,
                eventType: 'create',
                entityType: 'transaction',
                entityId: txId,
                changedFields: Object.keys(payload),
                createdBy: user.uid,
            });
            setSuccess(`Transaction ${dtid} saved successfully!`);
            setRefreshListKey(prev => prev + 1);
            setTimeout(() => handleReset(), 2000);
        } else {
            setError(res.error || 'Failed to save transaction.');
        }
        setIsSaving(false);
    };

    return (
        <PageShell
            title="Daily Transactions"
            subtitle="Record and manage daily applications and financial entries."
            icon={Plus}
        >
            <div className="space-y-6">
                    <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveView('add')}
                                className={`rounded-2xl px-4 py-3 text-lg font-black transition ${activeView === 'add' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}
                            >
                                Add New
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView('existing')}
                                className={`rounded-2xl px-4 py-3 text-lg font-black transition ${activeView === 'existing' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}
                            >
                                Existing
                            </button>
                        </div>
                    </div>
                    {activeView === 'add' ? (
                    <>
                    {/* Hero Header matching screenshot */}
                    <div className="flex items-center gap-4 rounded-3xl bg-sky-500/10 p-6 border border-sky-500/20 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--c-text)]">Transaction Entry Details</h2>
                            <p className="text-sm font-bold text-[var(--c-muted)]">Complete application, client, and payment information</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Date & Template */}
                        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm space-y-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Date *</label>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setTransactionDate(new Date().toISOString().split('T')[0])}
                                                className="rounded-lg bg-sky-500/10 px-2 py-1 text-[9px] font-black uppercase text-sky-600 hover:bg-sky-500 hover:text-white transition"
                                            >
                                                Today
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() - 1);
                                                    setTransactionDate(d.toISOString().split('T')[0]);
                                                }}
                                                className="rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase text-amber-600 hover:bg-amber-500 hover:text-white transition"
                                            >
                                                Yesterday
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={inputClass}
                                            value={transactionDate}
                                            onChange={(e) => setTransactionDate(e.target.value)}
                                            required
                                        />
                                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--c-muted)] pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Application Name *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAddOpen(true)}
                                            className="flex items-center gap-1 text-[10px] font-black uppercase text-[var(--c-accent)] hover:underline"
                                        >
                                            <Plus size={10} /> Add
                                        </button>
                                    </div>
                                    <ServiceSearchField
                                        onSelect={handleServiceSelect}
                                        selectedId={selectedService?.id}
                                        placeholder="Search applications..."
                                        onCreateNew={() => setIsQuickAddOpen(true)}
                                        refreshKey={serviceRefreshKey}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Client Selection - Separated Parents and Dependents */}
                        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Client *</label>
                                <ClientSearchField
                                    onSelect={(c) => {
                                        setSelectedParent(c);
                                        setSelectedDependent(null);
                                        setHasDependentsForSelectedClient(false);
                                    }}
                                    selectedId={selectedParent?.id}
                                    filterType="parent"
                                    placeholder="Search clients..."
                                />
                            </div>

                            {selectedParent && hasDependentsForSelectedClient && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Dependent Selection (Optional)</label>
                                        <ClientSearchField
                                            onSelect={setSelectedDependent}
                                            selectedId={selectedDependent?.id}
                                            filterType="dependent"
                                            parentId={selectedParent.id}
                                            placeholder={`Search dependents for ${selectedParent.fullName || selectedParent.tradeName}...`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 3: Financials */}
                        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2 font-bold">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Gov Charge <DirhamIcon className="inline h-3 w-3 align-text-bottom text-[var(--c-muted)]" /> *</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={govCharge}
                                        onChange={(e) => setGovCharge(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Client Charge <DirhamIcon className="inline h-3 w-3 align-text-bottom text-[var(--c-muted)]" /> *</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={clientCharge}
                                        onChange={(e) => setClientCharge(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Profit <DirhamIcon className="inline h-3 w-3 align-text-bottom text-[var(--c-muted)]" /></label>
                                    <div className="h-[50px] flex items-center rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 text-sm font-black text-emerald-500 shadow-inner">
                                        {profit.toFixed(2)}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Paid Portal *</label>
                                    <select
                                        className={selectClass}
                                        value={selectedPortalId}
                                        onChange={(e) => {
                                            const portalId = e.target.value;
                                            setSelectedPortalId(portalId);
                                            setSelectedPortalMethod('');
                                        }}
                                        required
                                    >
                                        <option value="">Select payment portal first...</option>
                                        {portals.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.balance})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Portal Transaction Method *</label>
                                {!selectedPortalId ? (
                                    <div className="rounded-2xl border-2 border-dashed border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                                        Select a payment portal first to view transaction methods.
                                    </div>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {portalMethods.map((method) => {
                                            const iconUrl = methodIconMap[String(method.id).toLowerCase()] || method.icon;
                                            const active = selectedPortalMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => setSelectedPortalMethod(method.id)}
                                                    className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition ${active ? 'border-sky-500 bg-sky-500/10 shadow-sm' : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:border-sky-400/60'}`}
                                                >
                                                    <img src={iconUrl} alt={method.label} className="h-6 w-6 object-contain" />
                                                    <span className="text-xs font-black text-[var(--c-text)]">{method.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-1 pt-2 border-t border-[var(--c-border)]/50">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Internal TX ID</label>
                                    <input className={`${inputClass} !bg-transparent border-dashed opacity-60`} value={dtid} readOnly />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="min-w-[200px] rounded-2xl bg-sky-500 py-4 px-8 text-sm font-black text-white shadow-xl shadow-sky-500/20 transition hover:bg-sky-600 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? 'Processing...' : 'Save Transaction'}
                            </button>
                        </div>

                        {error && <p className="text-center text-xs font-bold text-rose-500 uppercase tracking-widest">{error}</p>}
                        {success && <p className="text-center text-xs font-bold text-emerald-500 uppercase tracking-widest">{success}</p>}
                    </form>

                    </>
                    ) : (
                    <TransactionLiveList
                        tenantId={tenantId}
                        refreshKey={refreshListKey}
                    />
                    )}
            </div>
            <QuickAddServiceTemplateModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onCreated={(template) => {
                    handleServiceSelect(template);
                    setServiceRefreshKey((prev) => prev + 1);
                    setSuccess(`Application "${template.name}" created and selected.`);
                    setError('');
                }}
            />
        </PageShell>
    );
};

export default DailyTransactionPage;
