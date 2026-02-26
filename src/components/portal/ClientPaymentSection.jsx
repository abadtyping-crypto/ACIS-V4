import { useCallback, useEffect, useMemo, useState } from 'react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
    fetchTenantClients,
    fetchTenantClientsLite,
    fetchTenantPortals,
    fetchTenantPortalsLite,
    fetchTenantTransactions,
    recordClientPayment,
    sendPaymentAcknowledgementEmail,
} from '../../lib/backendStore';
import { generateDisplayTxId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';

const toClientName = (client) => client?.tradeName || client?.fullName || client?.displayClientId || 'Client';

const toCurrency = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const hashColor = (seed = '') => {
    const palette = ['bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash << 5) - hash + seed.charCodeAt(i);
    return palette[Math.abs(hash) % palette.length];
};

const ClientPaymentSection = ({ isOpen, onToggle, refreshKey }) => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [clients, setClients] = useState([]);
    const [portals, setPortals] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        clientSearch: '',
        clientId: '',
        dependentIds: [],
        description: '',
        portalId: '',
        method: '',
        amount: '',
    });

    const loadData = useCallback(async () => {
        const [clientRes, clientLiteRes, portalRes, portalLiteRes, txRes] = await Promise.all([
            fetchTenantClients(tenantId),
            fetchTenantClientsLite(tenantId),
            fetchTenantPortals(tenantId),
            fetchTenantPortalsLite(tenantId),
            fetchTenantTransactions(tenantId),
        ]);

        const effectiveClients = clientRes.ok ? (clientRes.rows || []) : (clientLiteRes.rows || []);
        const effectivePortals = portalRes.ok ? (portalRes.rows || []) : (portalLiteRes.rows || []);

        setClients(effectiveClients.filter((item) => !item.deletedAt));
        setPortals(effectivePortals.filter((item) => !item.deletedAt));

        if (txRes.ok) setTransactions(txRes.rows || []);
        else setTransactions([]);

        if (!effectiveClients.length && !effectivePortals.length) {
            setStatus({ message: 'Unable to load clients/portals for this tenant. Please check access rights.', type: 'error' });
        }
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        loadData();
    }, [tenantId, isOpen, loadData, refreshKey]);

    useEffect(() => {
        if (!tenantId) return;
        loadData();
    }, [tenantId, loadData]);

    const selectedClient = useMemo(() => clients.find((item) => item.id === form.clientId) || null, [clients, form.clientId]);

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

    const selectedPortal = useMemo(() => portals.find((item) => item.id === form.portalId) || null, [portals, form.portalId]);

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

            let mailMsg = 'Acknowledgement not sent.';
            if (selectedClient?.primaryEmail) {
                const shouldSendMail = window.confirm('Payment saved. Send acknowledgement email to client now?');
                if (shouldSendMail) {
                    const mailRes = await sendPaymentAcknowledgementEmail(tenantId, {
                        email: selectedClient.primaryEmail,
                        clientName: toClientName(selectedClient),
                        amount,
                        date: form.date,
                        portalName: selectedPortal?.name || 'Portal',
                        method: form.method,
                        transactionId: displayTxId,
                    });
                    if (mailRes.ok) mailMsg = 'Acknowledgement email queued.';
                    else mailMsg = `Payment saved but email failed: ${mailRes.error}`;
                }
            }

            setStatus({ message: `Payment saved (${displayTxId}). ${mailMsg}`, type: 'success' });
            setForm({
                date: new Date().toISOString().slice(0, 10),
                clientSearch: '',
                clientId: '',
                dependentIds: [],
                description: '',
                portalId: '',
                method: '',
                amount: '',
            });
            loadData();
        } catch (error) {
            setStatus({ message: error.message || 'Unexpected error while saving payment.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SectionCard
            title="Client Payment Intake"
            subtitle="Capture inbound client payments and post to portal balances"
            defaultOpen={isOpen}
            onToggle={onToggle}
        >
            <form onSubmit={onSave} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Date</label>
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                    />
                </div>

                <div className="relative">
                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Client</label>
                    <input
                        value={form.clientSearch}
                        onFocus={() => setShowClientDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 120)}
                        onChange={(e) => {
                            const value = e.target.value;
                            setForm((prev) => ({ ...prev, clientSearch: value, clientId: '' }));
                            setShowClientDropdown(true);
                        }}
                        placeholder="Type to search clients"
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                    />
                    {showClientDropdown && (
                        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-lg">
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
                                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${hashColor(item.id)}`}>
                                            {toClientName(item).slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="text-xs font-bold text-[var(--c-text)]">{toClientName(item)}</span>
                                        <span className="ml-auto text-[10px] text-[var(--c-muted)]">{item.displayClientId || item.id}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {selectedClient && (
                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3 text-xs">
                        <p className="font-bold text-[var(--c-muted)]">Current Balance</p>
                        <p className={`mt-1 text-sm font-black ${clientBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {clientBalance < 0 ? '-' : '+'} {toCurrency(Math.abs(clientBalance))}
                        </p>
                    </div>
                )}

                {selectedClientDependents.length > 0 && (
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
                )}

                <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Manual Description (Optional)</label>
                    <input
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Visa renewal, specific work item..."
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Bank / Portal</label>
                        <select
                            value={form.portalId}
                            onChange={(e) => setForm((prev) => ({ ...prev, portalId: e.target.value, method: '' }))}
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold"
                        >
                            <option value="">Select account</option>
                            {portals.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Payment Method</label>
                        <select
                            value={form.method}
                            onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
                            disabled={!selectedPortal}
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold disabled:opacity-50"
                        >
                            <option value="">Select method</option>
                            {(selectedPortal?.methods || []).map((method) => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>
                </div>

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

                {status.message && (
                    <div className={`rounded-xl border p-3 text-xs font-bold text-center ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSaving || !canUserPerformAction(tenantId, user, 'createTransaction')}
                    className="w-full rounded-xl bg-[var(--c-accent)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 disabled:opacity-50"
                >
                    {isSaving ? 'Saving Payment...' : 'Save Payment'}
                </button>
            </form>
        </SectionCard>
    );
};

export default ClientPaymentSection;
