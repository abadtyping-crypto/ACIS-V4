import { useState, useEffect, useCallback } from 'react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/useAuth';
import { fetchTenantPortals, executeInternalTransfer, sendTenantDocumentEmail } from '../../lib/backendStore';
import { generateDisplayTxId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import { generateTenantPdf } from '../../lib/pdfGenerator';
import IconSelect from '../common/IconSelect';

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

const fallbackPortalIcon = (type) => {
    if (type === 'Bank') return '/portals/bank.png';
    if (type === 'Card Payment') return '/portals/cardpayment.png';
    if (type === 'Petty Cash') return '/portals/pettycash.png';
    if (type === 'Terminal') return '/portals/terminal.png';
    return '/portals/portals.png';
};

const InternalTransferSection = ({ isOpen, onToggle, refreshKey }) => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [portals, setPortals] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    const [form, setForm] = useState({
        fromPortalId: '',
        toPortalId: '',
        amount: '',
        fee: '0',
        description: '',
    });

    const portalOptions = portals.map((p) => ({
        value: p.id,
        label: `${p.name} (AED ${(Number(p.balance || 0)).toLocaleString()})`,
        icon: p.iconUrl || fallbackPortalIcon(p.type),
        meta: (Array.isArray(p.methods) ? p.methods.map((id) => txMethodLabels[id] || id) : []).join(' | '),
    }));

    const fetchPortals = useCallback(async () => {
        const res = await fetchTenantPortals(tenantId);
        if (res.ok) setPortals(res.rows);
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        fetchPortals();
    }, [tenantId, isOpen, fetchPortals, refreshKey]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!form.fromPortalId || !form.toPortalId || !form.amount) {
            setStatus({ message: "Please fill in all required fields.", type: 'error' });
            return;
        }

        if (form.fromPortalId === form.toPortalId) {
            setStatus({ message: "Source and destination must be different.", type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const displayTxId = await generateDisplayTxId(tenantId, 'TRF');
            const res = await executeInternalTransfer(tenantId, {
                ...form,
                amount: Number(form.amount),
                fee: Number(form.fee || 0),
                displayTxId,
                createdBy: user.uid,
            });

            if (res.ok) {
                setStatus({
                    message: `Transfer successful! ID: ${displayTxId}`,
                    type: 'success',
                    download: {
                        docType: 'performerInvoice',
                        data: {
                            txId: displayTxId,
                            amount: form.amount,
                            recipientName: portals.find(p => p.id === form.toPortalId)?.name || 'Destination Portal',
                            description: form.description || `Internal transfer from ${portals.find(p => p.id === form.fromPortalId)?.name}`,
                            date: new Date().toLocaleDateString()
                        }
                    }
                });
                setForm({ fromPortalId: '', toPortalId: '', amount: '', fee: '0', description: '' });
                fetchPortals();
                // No auto-clear to allow download
            } else {
                setStatus({ message: res.error || "Transfer failed.", type: 'error' });
            }
        } catch (err) {
            setStatus({ message: err.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SectionCard
            title="Internal Transfer"
            subtitle="Move funds between operational portals"
            defaultOpen={isOpen}
            onToggle={onToggle}
        >
            <form onSubmit={handleTransfer} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Source */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Source Portal</label>
                        <div className="mt-1">
                            <IconSelect
                                value={form.fromPortalId}
                                onChange={(nextFromPortalId) => setForm((prev) => ({ ...prev, fromPortalId: nextFromPortalId }))}
                                options={portalOptions}
                                placeholder="Select Source"
                            />
                        </div>
                    </div>

                    {/* Destination */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Destination Portal</label>
                        <div className="mt-1">
                            <IconSelect
                                value={form.toPortalId}
                                onChange={(nextToPortalId) => setForm((prev) => ({ ...prev, toPortalId: nextToPortalId }))}
                                options={portalOptions}
                                placeholder="Select Destination"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Amount */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Transfer Amount</label>
                        <input
                            type="number"
                            required
                            placeholder="0.00"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-base font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                        />
                    </div>

                    {/* Fee */}
                    <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Transfer Fee (Optional)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={form.fee}
                            onChange={(e) => setForm({ ...form, fee: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-base font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Reference / Note</label>
                    <textarea
                        placeholder="Reason for transfer..."
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 resize-none"
                    />
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`rounded-xl border p-3 text-xs font-bold text-center animate-pulse ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                        <div>{status.message}</div>
                        {status.download && (
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
                                    Download Transfer Note
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const email = prompt("Enter email for transfer note delivery:");
                                        if (!email) return;

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
                                                email,
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
                                    Email Note
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSaving || !canUserPerformAction(tenantId, user, 'internalTransfer')}
                    className="w-full rounded-xl bg-[var(--c-accent)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 hover:opacity-90 disabled:opacity-50 transition"
                >
                    {isSaving ? 'Processing...' : 'Confirm Transfer'}
                </button>
            </form>
        </SectionCard>
    );
};

export default InternalTransferSection;

