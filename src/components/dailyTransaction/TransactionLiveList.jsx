import { memo, useCallback, useEffect, useState } from 'react';
import { fetchRecentDailyTransactions, softDeleteTransaction, upsertTenantTransaction } from '../../lib/backendStore';
import { useAuth } from '../../context/AuthContext';
import CurrencyValue from '../common/CurrencyValue';
import { Trash2, Edit3, Lock, X, Check, Clock } from 'lucide-react';

const TransactionLiveList = ({ tenantId, refreshKey }) => {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Editing Tracking context
    const [editingTx, setEditingTx] = useState(null);
    const [editTrkId, setEditTrkId] = useState('');
    const [editNote, setEditNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const loadData = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const res = await fetchRecentDailyTransactions(tenantId, 20);
            if (res.ok) setRows(res.rows);
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshKey]);

    const handleDelete = async (txId) => {
        if (!window.confirm('Are you sure you want to soft-delete this transaction for audit reversal?')) return;
        setDeletingId(txId);
        const res = await softDeleteTransaction(tenantId, txId, user.uid);
        if (res.ok) {
            loadData();
        } else {
            alert(res.error || 'Failed to delete transaction.');
        }
        setDeletingId(null);
    };

    const startEditing = (tx) => {
        setEditingTx(tx);
        setEditTrkId(tx.trackingId || '');
        setEditNote(tx.note || '');
    };

    const handleUpdateInfo = async () => {
        if (!editingTx) return;
        setIsUpdating(true);
        const payload = {
            ...editingTx,
            trackingId: editTrkId,
            note: editNote,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid
        };
        const res = await upsertTenantTransaction(tenantId, editingTx.id, payload);
        if (res.ok) {
            setEditingTx(null);
            loadData();
        } else {
            alert(res.error || 'Failed to update info.');
        }
        setIsUpdating(false);
    };

    if (isLoading && rows.length === 0) {
        return (
            <div className="flex items-center justify-center rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-12 italic text-[var(--c-muted)]">
                Loading live list...
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--c-border)] bg-[var(--c-panel)]/30 p-12 text-center text-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">No Transactions Recorded Today</p>
                <p className="mt-2 text-[10px] text-[var(--c-muted)]">Post your first transaction above to see it here.</p>
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-[var(--c-text)]">Recent Applications</h3>
                <span className="text-[10px] font-bold uppercase text-[var(--c-muted)] tracking-widest">Live Updates</span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b border-[var(--c-border)] bg-[var(--c-panel)] text-[10px] font-black uppercase tracking-widest text-[var(--c-muted)]">
                            <tr>
                                <th className="p-4">Transaction ID</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Service</th>
                                <th className="p-4 text-right">Charge</th>
                                <th className="p-4 text-center">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--c-border)]">
                            {rows.map((row) => {
                                const isLocked = !!row.invoiceId;
                                return (
                                    <tr key={row.id} className="transition hover:bg-[var(--c-panel)]/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[var(--c-text)]">{row.displayTransactionId || row.id}</span>
                                                {row.trackingId && (
                                                    <span className="rounded-lg bg-[var(--c-accent)]/5 px-2 py-0.5 text-[9px] font-black text-[var(--c-accent)]">
                                                        {row.trackingId}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--c-muted)]">
                                                <Clock className="h-2.5 w-2.5" />
                                                {new Date(row.createdAt || row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-[var(--c-text)]">{row.clientName || 'Unknown Client'}</p>
                                            <p className="text-[10px] text-[var(--c-muted)] uppercase">{row.clientType || 'client'}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-[var(--c-text)]">{row.serviceName || '-'}</p>
                                            <p className="text-[10px] text-[var(--c-muted)] truncate max-w-[120px]">{row.note || 'No note'}</p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-black text-[var(--c-text)]">
                                                <CurrencyValue value={row.clientCharge || 0} iconSize="h-3 w-3" />
                                            </div>
                                            <p className="text-[9px] font-bold text-emerald-500">
                                                + <CurrencyValue value={row.profit || 0} iconSize="h-2 w-2" />
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {isLocked ? (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500" title="Invoiced & Locked">
                                                        <Lock className="h-4 w-4" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            disabled={deletingId === row.id}
                                                            onClick={() => handleDelete(row.id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-rose-500 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                                                            title="Soft Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => startEditing(row)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
                                                            title="Update Tracking/Note"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Info Overlay */}
            {editingTx && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-[var(--c-text)]">Update Info</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">{editingTx.displayTransactionId}</p>
                            </div>
                            <button onClick={() => setEditingTx(null)} className="rounded-xl p-2 text-[var(--c-muted)] hover:bg-[var(--c-panel)]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Tracking ID (TRK)</label>
                                <input
                                    className="w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]"
                                    value={editTrkId}
                                    onChange={(e) => setEditTrkId(e.target.value)}
                                    placeholder="Enter tracking number..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Update Note</label>
                                <textarea
                                    className="min-h-[100px] w-full rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]"
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="Add internal details..."
                                />
                            </div>
                        </div>

                        <button
                            disabled={isUpdating}
                            onClick={handleUpdateInfo}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--c-accent)] py-4 text-sm font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
                        >
                            <Check className="h-5 w-5" />
                            {isUpdating ? 'Saving Changes...' : 'Save Updates'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default memo(TransactionLiveList);
