import { useState, useEffect, useCallback } from 'react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
    fetchTenantPortals,
    fetchLoanPersons,
    upsertLoanPerson,
    deleteLoanPerson,
    executeLoanTransaction,
    sendTenantDocumentEmail
} from '../../lib/backendStore';
import { generateDisplayTxId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import { createSyncEvent } from '../../lib/syncEvents';
import { generateTenantPdf } from '../../lib/pdfGenerator';

const LoanManagementSection = ({ isOpen, onToggle, refreshKey }) => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [portals, setPortals] = useState([]);
    const [persons, setPersons] = useState([]);
    const [view, setView] = useState('form'); // 'form' or 'list'
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
        const [pRes, psRes] = await Promise.all([
            fetchTenantPortals(tenantId),
            fetchLoanPersons(tenantId)
        ]);
        if (pRes.ok) setPortals(pRes.rows);
        if (psRes.ok) setPersons(psRes.rows);
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        fetchData();
    }, [tenantId, isOpen, fetchData, refreshKey]);

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
        const personId = `lp_${Date.now()}`;
        const res = await upsertLoanPerson(tenantId, personId, {
            ...newPerson,
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
            const displayTxId = await generateDisplayTxId(tenantId, 'LOAN');
            const res = await executeLoanTransaction(tenantId, {
                ...form,
                amount: Number(form.amount),
                displayTxId,
                createdBy: user.uid,
            });

            if (res.ok) {
                const docType = form.type === 'repayment' ? 'paymentReceipt' : 'performerInvoice';
                setStatus({
                    message: `Success! ID: ${displayTxId}`,
                    type: 'success',
                    download: {
                        docType,
                        data: {
                            txId: displayTxId,
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
                            <p className="text-2xl font-black">${(pendingBalance || 0).toLocaleString()}</p>
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
                        {persons.length === 0 ? (
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
                                    <div className="mt-2 space-y-2 rounded-xl border border-[var(--c-accent)]/20 bg-[var(--c-accent)]/5 p-3 animate-in fade-in slide-in-from-top-2">
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={newPerson.name}
                                            onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))}
                                            className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-1.5 text-xs font-bold outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Phone"
                                                value={newPerson.phone}
                                                onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))}
                                                className="w-1/2 rounded-lg border border-[var(--c-border)] bg-white px-3 py-1.5 text-xs font-bold outline-none"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={newPerson.email}
                                                onChange={e => setNewPerson(p => ({ ...p, email: e.target.value }))}
                                                className="w-1/2 rounded-lg border border-[var(--c-border)] bg-white px-3 py-1.5 text-xs font-bold outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleQuickAdd}
                                                className="rounded-lg bg-[var(--c-accent)] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                                            >
                                                Add
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
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Portal Selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Source/Target Portal</label>
                                <select
                                    required
                                    value={form.portalId}
                                    onChange={(e) => setForm({ ...form, portalId: e.target.value })}
                                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                >
                                    <option value="">Select Portal</option>
                                    {portals.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} (${(p.balance || 0).toLocaleString()})</option>
                                    ))}
                                </select>
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
                                            if (!selectedPerson?.email) {
                                                const email = prompt("Enter client email:");
                                                if (!email) return;
                                                selectedPerson.email = email;
                                            }
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
                                                    selectedPerson.email,
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
