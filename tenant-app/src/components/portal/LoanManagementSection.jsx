import { useState, useEffect, useCallback } from 'react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/useAuth';
import {
    fetchTenantPortals,
    fetchLoanPersons,
    upsertLoanPerson,
    deleteLoanPerson,
    executeLoanTransaction,
    sendTenantDocumentEmail,
    upsertTenantNotification
} from '../../lib/backendStore';
import { generateDisplayTxId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import { createSyncEvent } from '../../lib/syncEvents';
import { buildNotificationPayload, generateNotificationId } from '../../lib/notificationTemplate';
import { generateTenantPdf } from '../../lib/pdfGenerator';
import IconSelect from '../common/IconSelect';

const txMethodLabels = {
    tabby: 'Tabby',
    Tamara: 'Tamara',
};

const fallbackPortalIcon = (type) => {
    if (type === 'Bank') return '/portals/bank.png';
    if (type === 'Card Payment') return '/portals/cardpayment.png';
    if (type === 'Petty Cash') return '/portals/pettycash.png';
    if (type === 'Terminal') return '/portals/terminal.png';
    return '/portals/portals.png';
};

const LoanManagementSection = ({ isOpen, onToggle, refreshKey }) => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [portals, setPortals] = useState([]);
    const [persons, setPersons] = useState([]);
    const [view, setView] = useState('form'); // 'form' or 'list'
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    const [form, setForm] = useState({
        personId: '',
        portalId: '',
        amount: '',
        type: 'disbursement', // 'disbursement' or 'repayment'
        description: '',
    });

    const [pendingBalance, setPendingBalance] = useState(0);

    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newPerson, setNewPerson] = useState({ name: '', phone: '', email: '' });

    const fetchData = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        const [pRes, psRes] = await Promise.all([
            fetchTenantPortals(tenantId),
            fetchLoanPersons(tenantId)
        ]);
        if (pRes.ok) setPortals(pRes.rows || []);
        if (psRes.ok) {
            const rows = (psRes.rows || []).filter((row) => !row.deletedAt);
            setPersons(rows);
        }
        setIsLoading(false);
    }, [tenantId]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    useEffect(() => {
        if (!tenantId || !form.personId) {
            setPendingBalance(0);
            return;
        }
        // Simplified balance fetch - in a real app, you might have a dedicated field 
        // or aggregate query. Here we'll sum from the person's transactions.
        const fetchBalance = async () => {
            // This is a placeholder for actual balance logic. 
            // For now, let's assume it's calculated from the state or a quick fetch.
        };
        fetchBalance();
    }, [tenantId, form.personId]);

    const handleQuickAdd = async () => {
        if (!newPerson.name.trim()) return;
        setIsSaving(true);
        const personId = await generateDisplayTxId(tenantId, 'LOAN');
        const res = await upsertLoanPerson(tenantId, personId, {
            ...newPerson,
            displayPersonId: personId,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: user.uid
        });

        if (res.ok) {
            setPersons(prev => [...prev, { id: personId, ...newPerson }]);
            setForm(f => ({ ...f, personId }));
            setNewPerson({ name: '', phone: '', email: '' });
            setShowQuickAdd(false);
            setStatus({ message: "Person added!", type: 'success' });
            await createSyncEvent({
                tenantId,
                eventType: 'create',
                entityType: 'loanPerson',
                entityId: personId,
                createdBy: user.uid,
                changedFields: ['name', 'phone', 'email', 'status']
            });
            await upsertTenantNotification(tenantId, generateNotificationId({ topic: 'finance', subTopic: 'loan' }), {
                ...buildNotificationPayload({
                    topic: 'finance',
                    subTopic: 'loan',
                    type: 'create',
                    title: 'Loan Person Added',
                    detail: `${newPerson.name} added to loan management.`,
                    createdBy: user.uid,
                    routePath: `/t/${tenantId}/portal-management`,
                    actionPresets: ['view'],
                }),
                eventType: 'create',
                entityType: 'loanPerson',
                entityId: personId,
            });
            setTimeout(() => setStatus({ message: '', type: '' }), 2000);
        } else {
            setStatus({ message: res.error, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleDeletePerson = async (p) => {
        if (!confirm(`Permanently delete ${p.name}? This can be recovered from the Recycle Bin.`)) return;
        setIsSaving(true);
        const res = await deleteLoanPerson(tenantId, p.id, user.uid);
        if (res.ok) {
            setStatus({ message: 'Person moved to Recycle Bin.', type: 'success' });
            fetchData();
            setTimeout(() => setStatus({ message: '', type: '' }), 2000);
        } else {
            setStatus({ message: res.error || 'Delete failed.', type: 'error' });
        }
        setIsSaving(false);
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!form.personId || !form.portalId || !form.amount) {
            setStatus({ message: "Please fill in all required fields.", type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const displayTxId = await generateDisplayTxId(tenantId, 'LON');
            const res = await executeLoanTransaction(tenantId, {
                ...form,
                amount: Number(form.amount),
                displayTxId,
                createdBy: user.uid,
            });

            if (res.ok) {
                const finalTxId = res.displayTxId || displayTxId;
                const docType = form.type === 'repayment' ? 'paymentReceipt' : 'performerInvoice';
                setStatus({
                    message: `Success! ID: ${finalTxId}`,
                    type: 'success',
                    download: {
                        docType,
                        data: {
                            txId: finalTxId,
                            amount: form.amount,
                            recipientName: selectedPerson?.name || 'Client',
                            description: form.description || `${docType === 'paymentReceipt' ? 'Repayment' : 'Disbursement'} against loan.`,
                            date: new Date().toLocaleDateString()
                        }
                    }
                });
                setForm(f => ({ ...f, amount: '', description: '' }));
                fetchData();

                await createSyncEvent({
                    tenantId,
                    eventType: 'transaction',
                    entityType: 'loan',
                    entityId: res.batchId,
                    createdBy: user.uid
                });

                // We don't auto-clear if there's a download button, or we clear after a longer delay
                if (!res.ok) setTimeout(() => setStatus({ message: '', type: '' }), 3000);
            } else {
                setStatus({ message: res.error || "Failed unexpectedly.", type: 'error' });
            }
        } catch (err) {
            setStatus({ message: err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const selectedPerson = persons.find(p => p.id === form.personId);
    const hasDownloadPayload = Boolean(status?.download?.docType && status?.download?.data);
    const portalOptions = portals.map((p) => ({
        value: p.id,
        label: `${p.displayPortalId || p.name || p.id} (AED ${(Number(p.balance || 0)).toLocaleString()})`,
        icon: p.iconUrl || fallbackPortalIcon(p.type),
        meta: (Array.isArray(p.methods) ? p.methods.map((id) => txMethodLabels[id] || id) : []).join(' | '),
    }));

    return (
        <SectionCard
            title="Loan Management"
            subtitle="Originate loans or record repayments"
            defaultOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-6">
                {/* Pending Balance Banner */}
                {selectedPerson && (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Pending Balance</p>
                            <p className="text-2xl font-black">
                                <span className="inline-flex items-center gap-2">
                                    <img src="/dirham.svg" alt="AED" className="h-5 w-5 object-contain" />
                                    {(pendingBalance || 0).toLocaleString()}
                                </span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Loan Person</p>
                            <p className="text-xs font-bold">{selectedPerson.name}</p>
                        </div>
                    </div>
                )}

                {/* Mode Selector */}
                <div className="flex rounded-xl bg-[var(--c-panel)] p-1">
                    <button
                        onClick={() => setForm(f => ({ ...f, type: 'disbursement' }))}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${form.type === 'disbursement' ? 'bg-[var(--c-accent)] text-white shadow-sm' : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}`}
                    >
                        Give Loan
                    </button>
                    <button
                        onClick={() => setForm(f => ({ ...f, type: 'repayment' }))}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${form.type === 'repayment' ? 'bg-[var(--c-accent)] text-white shadow-sm' : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}`}
                    >
                        Receive Payment
                    </button>
                </div>

                {view === 'list' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {isLoading ? (
                            <p className="col-span-full py-4 text-center text-xs text-[var(--c-muted)]">Loading loan persons...</p>
                        ) : persons.length === 0 ? (
                            <p className="col-span-full py-4 text-center text-xs text-[var(--c-muted)]">No persons found.</p>
                        ) : (
                            persons.map(p => (
                                <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm transition hover:border-[var(--c-accent)]">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-[var(--c-text)]">{p.name}</p>
                                        <p className="text-[10px] text-[var(--c-muted)]">{p.phone || 'No phone'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePerson(p)}
                                        className="rounded-lg bg-[var(--c-panel)] p-1.5 text-[var(--c-muted)] hover:text-rose-500 transition"
                                        title="Delete"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                        <button
                            onClick={() => setView('form')}
                            className="col-span-full mt-2 text-xs font-bold text-[var(--c-accent)] hover:underline"
                        >
                            ← Back to Transaction
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleTransaction} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Person Selection */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Loan Person</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setView('list')}
                                            className="text-[10px] font-bold text-[var(--c-muted)] hover:text-[var(--c-text)] hover:underline"
                                        >
                                            Manage
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickAdd(!showQuickAdd)}
                                            className="text-[10px] font-bold text-[var(--c-accent)] hover:underline"
                                        >
                                            {showQuickAdd ? 'Cancel' : '+ Quick Add'}
                                        </button>
                                    </div>
                                </div>

                                {showQuickAdd ? (
                                    <div className="mt-2 space-y-3 rounded-2xl border border-[var(--c-accent)]/20 bg-[color:color-mix(in_srgb,var(--c-accent)_7%,var(--c-surface))] p-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--c-accent)]">Quick Add</p>
                                            <p className="mt-1 text-xs font-semibold text-[var(--c-text)]">Create a loan person without leaving this page.</p>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={newPerson.name}
                                            onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))}
                                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 placeholder:text-[var(--c-muted)]"
                                        />
                                        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                            <input
                                                type="text"
                                                placeholder="Phone"
                                                value={newPerson.phone}
                                                onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))}
                                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 placeholder:text-[var(--c-muted)]"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={newPerson.email}
                                                onChange={e => setNewPerson(p => ({ ...p, email: e.target.value }))}
                                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 placeholder:text-[var(--c-muted)]"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickAdd}
                                                className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                                            >
                                                Add Person
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={form.personId}
                                        onChange={(e) => setForm({ ...form, personId: e.target.value })}
                                        className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                    >
                                        <option value="">Select Person</option>
                                        {persons.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {(p.displayPersonId || p.id)} • {p.name || 'Unnamed'}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Portal Selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Source/Target Portal</label>
                                <IconSelect
                                    value={form.portalId}
                                    onChange={(nextPortalId) => setForm((prev) => ({ ...prev, portalId: nextPortalId }))}
                                    options={portalOptions}
                                    placeholder="Select Portal"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Amount */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Amount</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-base font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                />
                            </div>

                            {/* Note */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Note</label>
                                <input
                                    type="text"
                                    placeholder="..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                />
                            </div>
                        </div>

                        {/* Status Message */}
                        {status.message && (
                            <div className={`rounded-xl border p-3 text-xs font-bold text-center animate-pulse ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                                <div>{status.message}</div>
                                {hasDownloadPayload ? (
                                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => generateTenantPdf({
                                                tenantId,
                                                documentType: status.download.docType,
                                                data: status.download.data
                                            })}
                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 transition"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            {status.download.docType === 'paymentReceipt' ? 'Download Receipt' : 'Download Note'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const destinationEmail = selectedPerson?.email || prompt("Enter client email:");
                                                if (!destinationEmail) return;
                                                setIsSaving(true);
                                                const pdfRes = await generateTenantPdf({
                                                    tenantId,
                                                    documentType: status.download.docType,
                                                    data: status.download.data,
                                                    save: false,
                                                    returnBase64: true
                                                });
                                                if (pdfRes.ok) {
                                                    const emailRes = await sendTenantDocumentEmail(
                                                        tenantId,
                                                        destinationEmail,
                                                        status.download.docType,
                                                        pdfRes.base64,
                                                        status.download.data
                                                    );
                                                    if (emailRes.ok) alert("Email sent successfully!");
                                                    else alert("Failed to send email: " + emailRes.error);
                                                }
                                                setIsSaving(false);
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-1.5 text-white hover:bg-slate-800 transition"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Email to Client
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSaving || !canUserPerformAction(tenantId, user, 'loanManagement')}
                            className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 ${form.type === 'disbursement' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                        >
                            {form.type === 'disbursement' ? 'Disburse Funds' : 'Record Repayment'}
                        </button>
                    </form>
                )}
            </div>
        </SectionCard >
    );
};

export default LoanManagementSection;

