import { memo, useCallback, useEffect, useState } from 'react';
import { fetchRecentDailyTransactions, fetchTenantClients, softDeleteTransaction } from '../../lib/backendStore';
import { fetchServiceTemplates } from '../../lib/serviceTemplateStore';
import { useAuth } from '../../context/AuthContext';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import CurrencyValue from '../common/CurrencyValue';
import { Trash2, Lock, Clock } from 'lucide-react';

const TransactionLiveList = ({ tenantId, refreshKey }) => {
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [clientsById, setClientsById] = useState({});
    const [applicationsById, setApplicationsById] = useState({});
    const canSoftDelete = canUserPerformAction(tenantId, user, 'softDeleteTransaction');

    const loadData = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const [txRes, clientsRes, appRes] = await Promise.all([
                fetchRecentDailyTransactions(tenantId, 20),
                fetchTenantClients(tenantId),
                fetchServiceTemplates(tenantId),
            ]);

            if (txRes.ok) setRows(txRes.rows);
            if (clientsRes.ok) {
                const next = {};
                (clientsRes.rows || []).forEach((item) => {
                    next[item.id] = item;
                });
                setClientsById(next);
            }
            if (appRes.ok) {
                const next = {};
                (appRes.rows || []).forEach((item) => {
                    next[item.id] = item;
                });
                setApplicationsById(next);
            }
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
                                const client = clientsById[row.clientId];
                                const app = applicationsById[row.applicationId];
                                const clientName = client?.fullName || client?.tradeName || 'Unknown Client';
                                const applicationName = app?.name || 'Unknown Application';
                                return (
                                    <tr key={row.id} className="transition hover:bg-[var(--c-panel)]/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[var(--c-text)]">{row.transactionId || row.id}</span>
                                            </div>
                                            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--c-muted)]">
                                                <Clock className="h-2.5 w-2.5" />
                                                {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-[var(--c-text)]">{clientName}</p>
                                            <p className="text-[10px] text-[var(--c-muted)] uppercase">{String(client?.type || 'client')}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-[var(--c-text)]">{applicationName}</p>
                                            <p className="text-[10px] text-[var(--c-muted)] truncate max-w-[120px]">{row.applicationId || '-'}</p>
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
                                                        {canSoftDelete ? (
                                                            <button
                                                                disabled={deletingId === row.id}
                                                                onClick={() => handleDelete(row.id)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-rose-500 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                                                                title="Soft Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        ) : null}
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
        </section>
    );
};

export default memo(TransactionLiveList);
