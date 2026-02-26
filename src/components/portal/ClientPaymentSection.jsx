import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SectionCard from './SectionCard';
import IconSelect from '../common/IconSelect';
import CurrencyValue from '../common/CurrencyValue';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
    fetchTenantClients,
    fetchTenantClientsLite,
    fetchTenantPortals,
    fetchTenantPortalsLite,
    fetchTenantSmsConfig,
    fetchTenantTransactions,
    recordClientPayment,
    sendPaymentAcknowledgementEmail,
    sendTenantPaymentSms,
} from '../../lib/backendStore';
import { generateDisplayTxId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';

const txMethodLabels = {
    cashByHand: 'Cash by Hand',
    bankTransfer: 'Bank Transfer',
    cdmDeposit: 'CDM Deposit',
    checqueDeposit: 'Cheque Deposit',
    onlinePayment: 'Online Payment',
    cashWithdrawals: 'Cash Withdrawals',
    tabby: 'Tabby',
    Tamara: 'Tamara',
};

const txMethodIcons = {
    cashByHand: '/portals/methods/cashByHand.png',
    bankTransfer: '/portals/methods/banktransfer.png',
    cdmDeposit: '/portals/methods/cdmDeposit.png',
    checqueDeposit: '/portals/methods/checqueDeposit.png',
    onlinePayment: '/portals/methods/onlinePayment.png',
    cashWithdrawals: '/portals/methods/cashWithdrawal.png',
    tabby: '/portals/methods/tabby.png',
    Tamara: '/portals/methods/tamara.png',
};

const fallbackPortalIcon = (type) => {
    if (type === 'Bank') return '/portals/bank.png';
    if (type === 'Card Payment') return '/portals/cardpayment.png';
    if (type === 'Petty Cash') return '/portals/pettycash.png';
    if (type === 'Terminal') return '/portals/terminal.png';
    return '/portals/portals.png';
};

const toClientName = (client) => client?.tradeName || client?.fullName || client?.displayClientId || 'Client';

const toDateLabel = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString();
};

const ClientPaymentSection = ({
    isOpen = true,
    onToggle,
    refreshKey,
    standalone = false,
    presetClientId = '',
    onPresetConsumed,
}) => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [clients, setClients] = useState([]);
    const [portals, setPortals] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const clientFieldRef = useRef(null);

    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        clientSearch: '',
        clientId: '',
        dependentIds: [],
        description: '',
        portalId: '',
        method: '',
        amount: '',
        sendEmail: false,
        sendSms: false,
    });

    const applyPresetClient = useCallback((availableClients) => {
        const preset = String(presetClientId || '').trim();
        if (!preset) return;
        if (form.clientId) return;
        const matched = availableClients.find((item) => String(item.id) === preset);
        if (!matched) return;
        setForm((prev) => ({
            ...prev,
            clientId: matched.id,
            clientSearch: toClientName(matched),
            dependentIds: [],
        }));
        if (typeof onPresetConsumed === 'function') onPresetConsumed();
    }, [presetClientId, form.clientId, onPresetConsumed]);

    const loadData = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        const [clientRes, clientLiteRes, portalRes, portalLiteRes, txRes, smsCfgRes] = await Promise.all([
            fetchTenantClients(tenantId),
            fetchTenantClientsLite(tenantId),
            fetchTenantPortals(tenantId),
            fetchTenantPortalsLite(tenantId),
            fetchTenantTransactions(tenantId),
            fetchTenantSmsConfig(tenantId),
        ]);

        const effectiveClients = clientRes.ok ? (clientRes.rows || []) : (clientLiteRes.rows || []);
        const effectivePortals = portalRes.ok ? (portalRes.rows || []) : (portalLiteRes.rows || []);

        const safeClients = effectiveClients.filter((item) => !item.deletedAt);
        const safePortals = effectivePortals.filter((item) => !item.deletedAt);

        setClients(safeClients);
        setPortals(safePortals);
        setTransactions(txRes.ok ? (txRes.rows || []) : []);
        setSmsEnabled(!!(smsCfgRes.ok && smsCfgRes.data?.enablePaymentSms));
        applyPresetClient(safeClients);

        if (!safeClients.length || !safePortals.length) {
            setStatus({ message: 'Please configure clients and portals before posting payments.', type: 'error' });
        }
        setIsLoading(false);
    }, [tenantId, applyPresetClient]);

    useEffect(() => {
        if (!tenantId) return;
        loadData();
    }, [tenantId, loadData, refreshKey]);

    useEffect(() => {
        if (!showClientDropdown) return undefined;
        const onPointerDown = (event) => {
            const container = clientFieldRef.current;
            if (container && !container.contains(event.target)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [showClientDropdown]);

    useEffect(() => {
        setForm((prev) => {
            if (!prev.dependentIds.length) return prev;
            const validDependentIds = clients
                .filter((item) => String(item.parentId || '') === String(prev.clientId))
                .map((item) => item.id);
            const nextDependentIds = prev.dependentIds.filter((id) => validDependentIds.includes(id));
            if (nextDependentIds.length === prev.dependentIds.length) return prev;
            return { ...prev, dependentIds: nextDependentIds };
        });
    }, [clients]);

    const selectedClient = useMemo(() => clients.find((item) => item.id === form.clientId) || null, [clients, form.clientId]);
    const selectedPortal = useMemo(() => portals.find((item) => item.id === form.portalId) || null, [portals, form.portalId]);

    useEffect(() => {
        setForm((prev) => {
            if (!prev.sendSms) return prev;
            if (smsEnabled && selectedClient?.primaryMobile) return prev;
            return { ...prev, sendSms: false };
        });
    }, [smsEnabled, selectedClient]);

    const selectedClientDependents = useMemo(
        () => clients.filter((item) => String(item.parentId || '') === String(form.clientId)),
        [clients, form.clientId],
    );

    const filteredClients = useMemo(() => {
        const q = form.clientSearch.trim().toLowerCase();
        const roots = clients.filter((item) => !item.parentId);
        if (!q) return roots.slice(0, 12);
        return roots
            .filter((item) => [item.fullName, item.tradeName, item.displayClientId]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q)))
            .slice(0, 12);
    }, [clients, form.clientSearch]);

    const clientBalance = useMemo(() => {
        if (!selectedClient) return 0;
        const txNet = transactions
            .filter((tx) => !tx.deletedAt && String(tx.clientId || '') === String(selectedClient.id))
            .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        return Number(selectedClient.currentBalance ?? selectedClient.openingBalance ?? 0) + txNet;
    }, [selectedClient, transactions]);

    const portalOptions = useMemo(() => portals.map((p) => ({
        value: p.id,
        label: p.name,
        icon: p.iconUrl || fallbackPortalIcon(p.type),
        meta: p.type || '',
    })), [portals]);

    const methodOptions = useMemo(() => (selectedPortal?.methods || []).map((methodId) => ({
        value: methodId,
        label: txMethodLabels[methodId] || methodId,
        icon: txMethodIcons[methodId],
    })), [selectedPortal]);

    const paymentRows = useMemo(() => {
        const byClient = selectedClient ? String(selectedClient.id) : '';
        return transactions
            .filter((tx) => !tx.deletedAt && tx.type === 'Client Payment' && (!byClient || String(tx.clientId || '') === byClient))
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
            .slice(0, 40);
    }, [transactions, selectedClient]);

    const effectiveDescription = useMemo(() => {
        const dependentNames = selectedClientDependents
            .filter((dep) => form.dependentIds.includes(dep.id))
            .map((dep) => toClientName(dep));
        const parts = [];
        if (dependentNames.length) parts.push(`Dependents: ${dependentNames.join(', ')}`);
        if (form.description.trim()) parts.push(form.description.trim());
        return parts.join(' | ');
    }, [selectedClientDependents, form.dependentIds, form.description]);

    const onSave = async (e) => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        const amount = Number(form.amount || 0);
        if (!form.clientId || !form.portalId || !form.method || !Number.isFinite(amount) || amount <= 0) {
            setStatus({ message: 'Client, portal, payment method, and valid amount are required.', type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const displayTxId = await generateDisplayTxId(tenantId, 'PAY');
            const txRes = await recordClientPayment(tenantId, {
                clientId: form.clientId,
                portalId: form.portalId,
                method: form.method,
                amount,
                date: form.date ? new Date(`${form.date}T00:00:00`).toISOString() : new Date().toISOString(),
                description: effectiveDescription,
                dependentIds: form.dependentIds,
                displayTxId,
                createdBy: user.uid,
            });

            if (!txRes.ok) {
                setStatus({ message: txRes.error || 'Failed to save payment.', type: 'error' });
                return;
            }

            let successMessage = `Payment saved (${displayTxId}).`;
            if (form.sendEmail && selectedClient?.primaryEmail) {
                const mailRes = await sendPaymentAcknowledgementEmail(tenantId, {
                    email: selectedClient.primaryEmail,
                    clientName: toClientName(selectedClient),
                    amount,
                    date: form.date,
                    portalName: selectedPortal?.name || 'Portal',
                    method: txMethodLabels[form.method] || form.method,
                    transactionId: displayTxId,
                });
                successMessage = mailRes.ok
                    ? `Payment saved (${displayTxId}) and acknowledgement queued.`
                    : `Payment saved (${displayTxId}) but email failed: ${mailRes.error}`;
            }

            if (form.sendSms && selectedClient?.primaryMobile && smsEnabled) {
                const smsRes = await sendTenantPaymentSms(tenantId, {
                    toMobile: selectedClient.primaryMobile,
                    clientName: toClientName(selectedClient),
                    amount,
                    date: form.date,
                    portalName: selectedPortal?.name || 'Portal',
                    method: txMethodLabels[form.method] || form.method,
                    transactionId: displayTxId,
                });
                if (!smsRes.ok) {
                    successMessage = `${successMessage} SMS failed: ${smsRes.error}`;
                }
            }

            setStatus({ message: successMessage, type: 'success' });

            setForm((prev) => ({
                ...prev,
                date: new Date().toISOString().slice(0, 10),
                dependentIds: [],
                description: '',
                portalId: '',
                method: '',
                amount: '',
                sendEmail: false,
                sendSms: false,
            }));
            loadData();
        } catch (error) {
            setStatus({ message: error.message || 'Unexpected error while saving payment.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const content = (
        <div className="space-y-5">
            <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Date</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                        />
                    </div>
                    <div ref={clientFieldRef} className="md:col-span-2 relative">
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Client</label>
                        <input
                            value={form.clientSearch}
                            onFocus={() => setShowClientDropdown(true)}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm((prev) => ({ ...prev, clientSearch: value, clientId: '', dependentIds: [] }));
                                setShowClientDropdown(true);
                            }}
                            placeholder="Type client name or CLID"
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                        />
                        {showClientDropdown && (
                            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-lg">
                                {filteredClients.length === 0 ? (
                                    <p className="px-3 py-2 text-xs text-[var(--c-muted)]">No matching clients.</p>
                                ) : (
                                    filteredClients.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setForm((prev) => ({ ...prev, clientId: item.id, clientSearch: toClientName(item), dependentIds: [] }));
                                                setShowClientDropdown(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--c-panel)]"
                                        >
                                            <span className="text-xs font-bold text-[var(--c-text)]">{toClientName(item)}</span>
                                            <span className="ml-auto text-[10px] text-[var(--c-muted)]">{item.displayClientId || item.id}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {selectedClient ? (
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-muted)]">Client Balance</p>
                        <p className={`mt-1 text-sm font-black ${clientBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            <CurrencyValue value={clientBalance} iconSize="h-3 w-3" />
                        </p>
                    </div>
                ) : null}

                {selectedClientDependents.length > 0 ? (
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Dependents (Optional)</label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {selectedClientDependents.map((dep) => {
                                const active = form.dependentIds.includes(dep.id);
                                return (
                                    <button
                                        key={dep.id}
                                        type="button"
                                        onClick={() => setForm((prev) => ({
                                            ...prev,
                                            dependentIds: active
                                                ? prev.dependentIds.filter((id) => id !== dep.id)
                                                : [...prev.dependentIds, dep.id],
                                        }))}
                                        className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${active ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/10' : 'border-[var(--c-border)] bg-[var(--c-surface)]'}`}
                                    >
                                        {toClientName(dep)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Description (Optional)</label>
                    <input
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Reference note"
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Bank / Portal</label>
                        <IconSelect
                            value={form.portalId}
                            onChange={(nextPortalId) => setForm((prev) => ({ ...prev, portalId: nextPortalId, method: '' }))}
                            options={portalOptions}
                            placeholder="Select Portal"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Payment Method</label>
                        <IconSelect
                            value={form.method}
                            onChange={(nextMethod) => setForm((prev) => ({ ...prev, method: nextMethod }))}
                            options={methodOptions}
                            placeholder="Select Method"
                            disabled={!selectedPortal}
                        />
                    </div>
                </div>

                {selectedPortal ? (
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-muted)]">Selected Portal</p>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-lg bg-[var(--c-surface)]/70 p-0.5">
                                <img
                                    src={selectedPortal.iconUrl || fallbackPortalIcon(selectedPortal.type)}
                                    alt={selectedPortal.name}
                                    className="h-full w-full object-contain"
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = fallbackPortalIcon(selectedPortal.type);
                                    }}
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-[var(--c-text)]">{selectedPortal.name}</p>
                                <p className="text-xs font-semibold text-[var(--c-muted)]">{selectedPortal.type || 'Portal'}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-muted)]">Balance</p>
                                <p className="text-sm font-black text-emerald-500"><CurrencyValue value={selectedPortal.balance || 0} iconSize="h-3 w-3" /></p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Amount</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                            placeholder="0.00"
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm font-bold"
                        />
                    </div>
                    <label className="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--c-text)]">
                        <input
                            type="checkbox"
                            checked={!!form.sendEmail}
                            onChange={(e) => setForm((prev) => ({ ...prev, sendEmail: e.target.checked }))}
                            className="h-4 w-4 accent-[var(--c-accent)]"
                        />
                        Send acknowledgement email
                    </label>
                    <label className="mt-5 flex items-center gap-2 text-xs font-bold text-[var(--c-text)]">
                        <input
                            type="checkbox"
                            checked={!!form.sendSms}
                            disabled={!smsEnabled || !selectedClient?.primaryMobile}
                            onChange={(e) => setForm((prev) => ({ ...prev, sendSms: e.target.checked }))}
                            className="h-4 w-4 accent-[var(--c-accent)] disabled:opacity-50"
                        />
                        Send acknowledgement SMS
                    </label>
                </div>
                {!smsEnabled ? (
                    <p className="text-[11px] font-semibold text-[var(--c-muted)]">
                        SMS is disabled in Settings {'>'} Mail Configuration.
                    </p>
                ) : null}
                {smsEnabled && selectedClient && !selectedClient.primaryMobile ? (
                    <p className="text-[11px] font-semibold text-[var(--c-muted)]">
                        Selected client has no mobile number, so SMS cannot be sent.
                    </p>
                ) : null}

                {status.message ? (
                    <div className={`rounded-xl border p-3 text-center text-xs font-bold ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                        {status.message}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={isSaving || isLoading || !canUserPerformAction(tenantId, user, 'createTransaction')}
                    className="w-full rounded-xl bg-[var(--c-accent)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 disabled:opacity-50"
                >
                    {isSaving ? 'Saving Payment...' : 'Save Payment'}
                </button>
            </form>

            <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black text-[var(--c-text)]">Received Payments</h3>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--c-muted)]">
                        {selectedClient ? `Filtered: ${toClientName(selectedClient)}` : 'All clients'}
                    </p>
                </div>
                {paymentRows.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--c-muted)]">No payment records found.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-[var(--c-border)]">
                        <table className="min-w-full text-xs">
                            <thead className="bg-[var(--c-panel)] text-[var(--c-muted)] uppercase">
                                <tr>
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Client</th>
                                    <th className="px-3 py-2 text-left">Portal</th>
                                    <th className="px-3 py-2 text-left">Method</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentRows.map((tx) => {
                                    const client = clients.find((item) => item.id === tx.clientId);
                                    const portal = portals.find((item) => item.id === tx.portalId);
                                    const methodLabel = txMethodLabels[tx.method] || tx.method || '-';
                                    return (
                                        <tr key={tx.id} className="border-t border-[var(--c-border)]">
                                            <td className="px-3 py-2">{toDateLabel(tx.date)}</td>
                                            <td className="px-3 py-2">
                                                <p className="font-semibold text-[var(--c-text)]">{toClientName(client)}</p>
                                                <p className="text-[10px] text-[var(--c-muted)]">{client?.displayClientId || tx.clientId}</p>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center gap-2">
                                                    <img
                                                        src={portal?.iconUrl || fallbackPortalIcon(portal?.type)}
                                                        alt=""
                                                        className="h-4 w-4 rounded object-contain"
                                                        onError={(event) => {
                                                            event.currentTarget.onerror = null;
                                                            event.currentTarget.src = fallbackPortalIcon(portal?.type);
                                                        }}
                                                    />
                                                    <span>{portal?.name || tx.portalId}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center gap-2">
                                                    {txMethodIcons[tx.method] ? <img src={txMethodIcons[tx.method]} alt="" className="h-4 w-4 rounded object-contain" /> : null}
                                                    <span>{methodLabel}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-emerald-500">
                                                <CurrencyValue value={tx.amount || 0} iconSize="h-3 w-3" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );

    if (standalone) {
        return content;
    }

    return (
        <SectionCard
            title="Client Payment Intake"
            subtitle="Capture inbound client payments and post to portal balances"
            defaultOpen={isOpen}
            onToggle={onToggle}
        >
            {content}
        </SectionCard>
    );
};

export default ClientPaymentSection;
