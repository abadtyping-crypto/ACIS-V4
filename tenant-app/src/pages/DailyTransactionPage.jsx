import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useTenant } from '../context/useTenant';
import { useAuth } from '../context/useAuth';
import {
    generateNextTransactionId,
    createDailyTransactionWithFinancials,
    fetchTenantPortals,
    fetchTenantClients,
    fetchTenantProformaInvoices,
} from '../lib/backendStore';
import { createSyncEvent } from '../lib/syncEvents';
import ClientSearchField from '../components/dailyTransaction/ClientSearchField';
import ServiceSearchField from '../components/dailyTransaction/ServiceSearchField';
import TransactionLiveList from '../components/dailyTransaction/TransactionLiveList';
import QuickAddServiceTemplateModal from '../components/dailyTransaction/QuickAddServiceTemplateModal';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';
import DirhamIcon from '../components/common/DirhamIcon';
import CurrencyValue from '../components/common/CurrencyValue';
import { Plus, FileText, Calendar, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { buildMethodIconMap, resolveMethodIconUrl, resolvePortalMethodDefinitions } from '../lib/transactionMethodConfig';

const inputClass = "compact-field mt-1 w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 text-[13px] text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/5 font-semibold";
const selectClass = "compact-field mt-1 w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 text-[13px] font-semibold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/20";
const activeTabClass = 'bg-[var(--c-accent)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--c-accent)_28%,transparent)]';
const activeCardClass = 'border-[var(--c-accent)] bg-[color:color-mix(in_srgb,var(--c-accent)_10%,var(--c-surface))]';
const accentHeroClass = 'bg-[color:color-mix(in_srgb,var(--c-accent)_10%,var(--c-surface))] border-[var(--c-accent)]/20';
const accentHeroIconClass = 'bg-[var(--c-accent)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--c-accent)_24%,transparent)]';
const accentSoftButtonClass = 'bg-[color:color-mix(in_srgb,var(--c-accent)_10%,var(--c-surface))] text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-white';
const primaryActionClass = 'bg-[var(--c-accent)] text-white shadow-xl shadow-[color-mix(in_srgb,var(--c-accent)_24%,transparent)] hover:opacity-95';

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
    const [externalTransactionId, setExternalTransactionId] = useState('');
    const [govCharge, setGovCharge] = useState('');
    const [clientCharge, setClientCharge] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingVisibility, setTrackingVisibility] = useState('all');
    const [proformaSuggestions, setProformaSuggestions] = useState([]);
    const [suggestionDismissed, setSuggestionDismissed] = useState(false);
    const [selectedSuggestedApplicationId, setSelectedSuggestedApplicationId] = useState('');

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
    const [showPortalBalance, setShowPortalBalance] = useState(false);

    // Context from URL
    const urlClientId = searchParams.get('clientId');
    const urlDependentId = searchParams.get('dependentId');

    const loadEssentials = useCallback(async () => {
        if (!tenantId) return;
        try {
            const [id, portalRes, clientRes] = await Promise.all([
                generateNextTransactionId(tenantId, 'DTID'),
                fetchTenantPortals(tenantId),
                (urlClientId || urlDependentId) ? fetchTenantClients(tenantId) : Promise.resolve({ ok: false, rows: [] })
            ]);

            setDtid(id);
            if (portalRes.ok) {
                setPortals(portalRes.rows);
                setSelectedPortalId('');
                setSelectedPortalMethod('');
            }

            if (clientRes.ok) {
                const rows = clientRes.rows || [];

                if (urlDependentId) {
                    const foundDependent = rows.find((item) => item.id === urlDependentId);
                    const foundParent = rows.find((item) => item.id === foundDependent?.parentId);
                    if (foundDependent) setSelectedDependent(foundDependent);
                    if (foundParent) setSelectedParent(foundParent);
                } else if (urlClientId) {
                    const found = rows.find(c => c.id === urlClientId);
                    if (found) setSelectedParent(found);
                }
            }
        } catch (err) {
            console.error('[DailyTransactionPage] Load failed:', err);
            setError('Failed to load initial data.');
        }
    }, [tenantId, urlClientId, urlDependentId]);

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
        let active = true;
        const loadProformaSuggestions = async () => {
            if (!tenantId || !selectedParent?.id) {
                setProformaSuggestions([]);
                setSuggestionDismissed(false);
                setSelectedSuggestedApplicationId('');
                return;
            }

            const res = await fetchTenantProformaInvoices(tenantId);
            if (!active || !res.ok) {
                setProformaSuggestions([]);
                return;
            }

            const related = (res.rows || [])
                .filter((row) => {
                    if (String(row.clientId || '') !== String(selectedParent.id)) return false;
                    const status = String(row.status || '').toLowerCase();
                    return status !== 'canceled';
                })
                .sort((a, b) => {
                    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return bTime - aTime;
                });

            const latest = related[0] || null;
            const suggestions = (latest?.items || []).map((item, index) => ({
                id: `${item.applicationId || item.name || 'item'}-${index}`,
                applicationId: String(item.applicationId || ''),
                name: String(item.name || 'Application'),
                description: String(item.description || ''),
                govCharge: Number(item.govCharge || 0) || 0,
                clientCharge: Number(item.amount || 0) || 0,
                sourceProformaId: latest?.id || '',
                sourceProformaRef: latest?.displayRef || latest?.id || '',
            }));
            setProformaSuggestions(suggestions);
            setSuggestionDismissed(false);
            setSelectedSuggestedApplicationId('');
        };
        void loadProformaSuggestions();
        return () => {
            active = false;
        };
    }, [tenantId, selectedParent?.id]);

    useEffect(() => {
        if (!tenantId) return;
        let isMounted = true;
        fetchApplicationIconLibrary(tenantId).then((res) => {
            if (!isMounted || !res.ok) return;
            setMethodIconMap(buildMethodIconMap(res.rows || []));
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
    const selectedClientBalance = useMemo(() => {
        const balanceRaw = selectedParent?.balance ?? selectedParent?.openingBalance ?? 0;
        const numeric = Number(balanceRaw);
        return Number.isFinite(numeric) ? numeric : 0;
    }, [selectedParent]);
    const projectedClientBalance = useMemo(() => selectedClientBalance - (Number(clientCharge) || 0), [selectedClientBalance, clientCharge]);
    const isNegativeBalance = projectedClientBalance < 0;
    const portalMethods = useMemo(
        () => {
            const methodPool = resolvePortalMethodDefinitions(selectedPortal?.customMethods || []);
            return methodPool.filter((method) => (selectedPortal?.methods || []).includes(method.id));
        },
        [selectedPortal],
    );
    const isClientContext = Boolean(urlClientId) && !urlDependentId;
    const isDependentContext = Boolean(urlDependentId);

    const handleServiceSelect = (tpl) => {
        setSelectedService(tpl);
        setGovCharge(String(tpl.govCharge || '0'));
        setClientCharge(String(tpl.clientCharge || '0'));
        setSelectedSuggestedApplicationId('');
        setSuggestionDismissed(true);
    };

    const handleSelectProformaSuggestion = (suggestion) => {
        if (!suggestion) return;
        setSelectedService({
            id: suggestion.applicationId || suggestion.id,
            name: suggestion.name,
            description: suggestion.description,
            govCharge: suggestion.govCharge,
            clientCharge: suggestion.clientCharge,
        });
        setGovCharge(String(suggestion.govCharge || 0));
        setClientCharge(String(suggestion.clientCharge || 0));
        setSelectedSuggestedApplicationId(suggestion.id);
        setSuggestionDismissed(true);
        setSuccess(`Prefilled from proforma ${suggestion.sourceProformaRef || suggestion.sourceProformaId}.`);
        setError('');
    };

    const handleReset = async () => {
        if (!isClientContext && !isDependentContext) {
            setSelectedParent(null);
            setSelectedDependent(null);
        }
        setSelectedService(null);
        setGovCharge('');
        setClientCharge('');
        setExternalTransactionId('');
        setTrackingEnabled(false);
        setTrackingNumber('');
        setTrackingVisibility('all');
        setSelectedSuggestedApplicationId('');
        setSuggestionDismissed(false);
        setSuccess('');
        setError('');
        setShowPortalBalance(false);
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
        if (trackingEnabled && !trackingVisibility) return setError('Please select tracking visibility.');

        setIsSaving(true);
        setError('');

        const txId = dtid;
        const selectedClient = selectedParent;
        const generatedTrackingId = trackingEnabled ? await generateNextTransactionId(tenantId, 'TRK') : '';
        const payload = {
            transactionId: dtid,
            applicationId: selectedService?.id || null,
            clientId: selectedClient?.id || clientToSave.id,
            dependentId: selectedDependent?.id || null,
            externalTransactionId: externalTransactionId.trim() || null,
            paidPortalId: selectedPortalId,
            portalTransactionMethod: selectedPortalMethod,
            govCharge: Number(govCharge || 0),
            clientCharge: Number(clientCharge || 0),
            profit: profit,
            trackingEnabled,
            trackingId: generatedTrackingId || null,
            trackingNumber: trackingNumber.trim() || null,
            trackingVisibility: trackingEnabled ? trackingVisibility : null,
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
            setSuccess(`Transaction ${dtid} saved successfully${generatedTrackingId ? ` • Tracking ${generatedTrackingId}` : ''}!`);
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
            eyebrow="Transactions"
            widthPreset="data"
        >
            <div className="space-y-6">
                    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-2.5 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveView('add')}
                                className={`compact-action rounded-xl px-3 text-base font-semibold transition ${activeView === 'add' ? activeTabClass : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}
                            >
                                Add New
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveView('existing')}
                                className={`compact-action rounded-xl px-3 text-base font-semibold transition ${activeView === 'existing' ? activeTabClass : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}
                            >
                                Existing
                            </button>
                        </div>
                    </div>
                    {activeView === 'add' ? (
                    <>
                    {/* Hero Header matching screenshot */}
                    <div className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ${accentHeroClass}`}>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentHeroIconClass}`}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--c-text)]">Transaction Entry Details</h2>
                            <p className="text-[13px] font-medium text-[var(--c-muted)]">Complete application, client, and payment information</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Date & Template */}
                        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm space-y-3">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-text)]">Date *</label>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setTransactionDate(new Date().toISOString().split('T')[0])}
                                                className={`rounded-lg px-2 py-1 text-[9px] font-semibold uppercase transition ${accentSoftButtonClass}`}
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
                                                className="rounded-lg bg-amber-500/10 px-2 py-1 text-[9px] font-semibold uppercase text-amber-600 hover:bg-amber-500 hover:text-white transition"
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
                                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--c-text)]">Application Name *</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAddOpen(true)}
                                            className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--c-accent)] hover:underline"
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
                                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">
                                    {isDependentContext ? 'Client (Auto-linked)' : 'Client *'}
                                </label>
                                {isClientContext || isDependentContext ? (
                                    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3">
                                        <p className="text-sm font-black text-[var(--c-text)]">
                                            {selectedParent?.fullName || selectedParent?.tradeName || 'Client'}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                            {selectedParent?.displayClientId || selectedParent?.id || '-'}
                                        </p>
                                    </div>
                                ) : (
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
                                )}
                            </div>

                            {selectedParent ? (
                                <div className={`rounded-2xl border px-4 py-3 transition ${isNegativeBalance ? 'border-amber-300 bg-amber-50' : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--c-muted)]">Current Client Balance</p>
                                            <div className={`mt-1 text-sm font-black ${selectedClientBalance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                <CurrencyValue value={selectedClientBalance} iconSize="h-3 w-3" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--c-muted)]">After This Transaction</p>
                                            <div className={`mt-1 text-sm font-black ${isNegativeBalance ? 'text-rose-500' : 'text-[var(--c-text)]'}`}>
                                                <CurrencyValue value={projectedClientBalance} iconSize="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                    {isNegativeBalance ? (
                                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-white/70 px-3 py-2 text-xs font-bold text-amber-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            Insufficient Client Balance. Transaction will still save and create a notification record.
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {selectedParent && !isDependentContext && hasDependentsForSelectedClient && (
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

                            {isDependentContext && selectedDependent ? (
                                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--c-muted)]">Dependent (Auto-linked)</p>
                                    <p className="text-sm font-black text-[var(--c-text)]">
                                        {selectedDependent.fullName || selectedDependent.tradeName || 'Dependent'}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                        {selectedDependent.displayClientId || selectedDependent.id}
                                    </p>
                                </div>
                            ) : null}

                            {selectedParent && proformaSuggestions.length > 0 ? (
                                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">
                                            Suggested From Latest Proforma (Optional)
                                        </p>
                                        {!suggestionDismissed && !selectedSuggestedApplicationId ? (
                                            <button
                                                type="button"
                                                onClick={() => setSuggestionDismissed(true)}
                                                className="text-[10px] font-black uppercase text-amber-600 hover:underline"
                                            >
                                                Skip Suggestions
                                            </button>
                                        ) : null}
                                    </div>

                                    {!suggestionDismissed && !selectedSuggestedApplicationId ? (
                                        <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
                                            Related proforma applications found. You can use them or continue manually.
                                        </p>
                                    ) : null}

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {proformaSuggestions.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleSelectProformaSuggestion(item)}
                                                className={`rounded-xl border px-3 py-2 text-left transition ${
                                                    selectedSuggestedApplicationId === item.id
                                                        ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/10'
                                                        : 'border-[var(--c-border)] bg-[var(--c-surface)] hover:border-[var(--c-accent)]/45'
                                                }`}
                                            >
                                                <p className="text-xs font-black text-[var(--c-text)]">{item.name}</p>
                                                <p className="mt-1 text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                                    {item.applicationId || 'Application'}
                                                </p>
                                                <p className="mt-1 text-[11px] font-bold text-[var(--c-text)]">
                                                    Client: {Number(item.clientCharge || 0).toFixed(2)} | Gov: {Number(item.govCharge || 0).toFixed(2)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Transaction Id</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={externalTransactionId}
                                        onChange={(e) => {
                                            const nextValue = e.target.value.toUpperCase();
                                            setExternalTransactionId(nextValue);
                                            if (!nextValue.trim()) {
                                                setTrackingEnabled(false);
                                                setTrackingNumber('');
                                                setTrackingVisibility('all');
                                            }
                                        }}
                                        placeholder="Government-issued reference"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Internal TX ID</label>
                                    <input className={`${inputClass} !bg-transparent border-dashed opacity-60`} value={dtid} readOnly />
                                </div>
                            </div>

                            {externalTransactionId.trim() ? (
                                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Add to Tracking?</label>
                                            <select
                                                className={selectClass}
                                                value={trackingEnabled ? 'yes' : 'no'}
                                                onChange={(e) => setTrackingEnabled(e.target.value === 'yes')}
                                            >
                                                <option value="no">No</option>
                                                <option value="yes">Yes</option>
                                            </select>
                                        </div>
                                        {trackingEnabled ? (
                                            <>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Tracking Number</label>
                                                    <input
                                                        type="text"
                                                        className={inputClass}
                                                        value={trackingNumber}
                                                        onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                                                        placeholder="Optional additional tracking ref"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-[var(--c-text)]">Tracking Visibility *</label>
                                                    <select
                                                        className={selectClass}
                                                        value={trackingVisibility}
                                                        onChange={(e) => setTrackingVisibility(e.target.value)}
                                                        required={trackingEnabled}
                                                    >
                                                        <option value="all">Visible to All Users</option>
                                                        <option value="private">Only Me</option>
                                                    </select>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                    {trackingEnabled ? (
                                        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                                            Tracking ID will be generated on save.
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
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
                                    <div className="space-y-3">
                                        <select
                                            className={selectClass}
                                            value={selectedPortalId}
                                            onChange={(e) => {
                                                const portalId = e.target.value;
                                                setSelectedPortalId(portalId);
                                                setSelectedPortalMethod('');
                                                setShowPortalBalance(false);
                                            }}
                                            required
                                        >
                                            <option value="">Select payment portal first...</option>
                                            {portals.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        {selectedPortal ? (
                                            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-black text-[var(--c-text)]">{selectedPortal.name}</p>
                                                        <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{selectedPortal.type || 'Portal'}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPortalBalance((prev) => !prev)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--c-text)]"
                                                    >
                                                        {showPortalBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                        {showPortalBalance ? 'Hide Balance' : 'Show Balance'}
                                                    </button>
                                                </div>
                                                {showPortalBalance ? (
                                                    <div className={`mt-3 text-sm font-black ${Number(selectedPortal.balance || 0) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                        <CurrencyValue value={selectedPortal.balance || 0} iconSize="h-3 w-3" />
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
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
                                            const iconUrl = resolveMethodIconUrl(methodIconMap, method.id);
                                            const MethodIcon = method.Icon;
                                            const active = selectedPortalMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => setSelectedPortalMethod(method.id)}
                                                    className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition ${active ? `${activeCardClass} shadow-sm` : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:border-[var(--c-accent)]/45'}`}
                                                >
                                                    {iconUrl ? (
                                                        <img
                                                            src={iconUrl}
                                                            alt={method.label}
                                                            className="h-6 w-6 object-contain"
                                                        />
                                                    ) : (
                                                        <MethodIcon className="h-6 w-6 text-[var(--c-text)]" />
                                                    )}
                                                    <span className="text-xs font-black text-[var(--c-text)]">{method.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`min-w-[200px] rounded-2xl py-4 px-8 text-sm font-black transition active:scale-95 disabled:opacity-50 ${primaryActionClass}`}
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

