import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { useAuth } from '../context/AuthContext';
import {
  fetchPortalTransactions,
  fetchTenantPortals,
  fetchTenantUsersMap,
  upsertTenantPortal,
} from '../lib/backendStore';
import { createSyncEvent } from '../lib/syncEvents';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';

const portalTypes = [
  { id: 'Bank', label: 'Bank', methods: ['bankTransfer', 'cdmDeposit', 'checqueDeposit', 'onlinePayment', 'cashWithdrawals'] },
  { id: 'Card Payment', label: 'Card Payment', methods: ['onlinePayment', 'bankTransfer'] },
  { id: 'Petty Cash', label: 'Petty Cash', methods: ['cashByHand', 'cdmDeposit', 'cashWithdrawals'] },
  { id: 'Portals', label: 'Portals', methods: ['cashByHand', 'bankTransfer', 'onlinePayment'] },
  { id: 'Terminal', label: 'Terminal', methods: ['bankTransfer', 'tabby', 'Tamara'] },
];

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

const toDateText = (value) => {
  if (!value) return '-';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis()).toLocaleString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
};

const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value?.toDate === 'function' || typeof value?.toMillis === 'function') return toDateText(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const toFieldLabel = (key) => {
  return String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
};

const PortalDetailPage = () => {
  const { tenantId, portalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Bank', status: 'active', methods: [] });
  const [txRows, setTxRows] = useState([]);
  const [usersByUid, setUsersByUid] = useState({});
  const [portalsById, setPortalsById] = useState({});
  const [methodIconMap, setMethodIconMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [selectedTx, setSelectedTx] = useState(null);

  const loadData = useCallback(async () => {
    if (!tenantId || !portalId) return;
    setIsLoading(true);
    const [portalRes, txRes, iconRes, usersRes] = await Promise.all([
      fetchTenantPortals(tenantId),
      fetchPortalTransactions(tenantId, portalId),
      fetchApplicationIconLibrary(tenantId),
      fetchTenantUsersMap(tenantId),
    ]);

    if (portalRes.ok) {
      const map = {};
      (portalRes.rows || []).forEach((row) => {
        if (!row?.id) return;
        map[row.id] = row;
      });
      setPortalsById(map);
      const selected = (portalRes.rows || []).find((row) => row.id === portalId) || null;
      setPortal(selected);
      if (selected) {
        setForm({
          name: selected.name || '',
          type: selected.type || 'Bank',
          status: selected.status || 'active',
          methods: Array.isArray(selected.methods) ? selected.methods : [],
        });
      }
    }
    if (txRes.ok) setTxRows(txRes.rows || []);
    if (iconRes.ok) {
      const nextMap = {};
      (iconRes.rows || []).forEach((row) => {
        const key = String(row?.iconId || '').trim().toLowerCase();
        if (!key || !row?.iconUrl) return;
        nextMap[key] = row.iconUrl;
      });
      setMethodIconMap(nextMap);
    }
    if (usersRes?.ok) {
      const nextUsers = {};
      (usersRes.rows || []).forEach((item) => {
        if (!item?.uid) return;
        nextUsers[item.uid] = item;
      });
      setUsersByUid(nextUsers);
    } else {
      setUsersByUid({});
    }
    setIsLoading(false);
  }, [tenantId, portalId]);

  const getCreator = useCallback((uid) => {
    const creator = usersByUid[String(uid || '')];
    if (!creator) return { name: uid || 'Unknown user', avatar: '/avatar.png' };
    return {
      name: creator.displayName || creator.email || uid || 'Unknown user',
      avatar: creator.photoURL || '/avatar.png',
    };
  }, [usersByUid]);

  const renderTxValue = useCallback((key, value) => {
    if (key === 'createdBy') {
      const creator = getCreator(value);
      return (
        <Link
          to={`/t/${tenantId}/profile`}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-panel)] px-2 py-1 pr-3 text-xs text-[var(--c-text)] hover:border-[var(--c-accent)]"
          title={`Open profile of ${creator.name}`}
        >
          <img src={creator.avatar} alt={creator.name} className="h-6 w-6 rounded-full object-cover" />
          <span>{creator.name}</span>
          <ExternalLink size={12} />
        </Link>
      );
    }

    if (key === 'portalId') {
      const p = portalsById[String(value || '')];
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-panel)] px-2 py-1 pr-3 text-xs text-[var(--c-text)]">
          <img src={p?.iconUrl || '/portals/portals.png'} alt={p?.name || 'Portal'} className="h-6 w-6 rounded object-cover" />
          <span>{p?.name || 'Portal'}</span>
        </div>
      );
    }

    if (key === 'displayTransactionId' || key === 'id') {
      return (
        <span className="inline-flex rounded-md border border-[var(--c-border)] bg-[var(--c-panel)] px-2 py-1 text-xs font-semibold text-[var(--c-accent)]">
          {formatValue(value)}
        </span>
      );
    }

    if (key === 'date' || key === 'createdAt' || key === 'updatedAt') {
      return <span>{toDateText(value)}</span>;
    }

    return <span>{formatValue(value)}</span>;
  }, [getCreator, portalsById, tenantId]);

  const handlePrintTx = useCallback(() => {
    if (!selectedTx) return;
    const creator = getCreator(selectedTx.createdBy);
    const portalRef = portalsById[String(selectedTx.portalId || '')] || null;
    const amount = Number(selectedTx.amount || 0);
    const amountLabel = Number.isFinite(amount)
      ? `${amount < 0 ? '-' : ''}AED ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '-';

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Transaction Slip</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc; }
            .slip { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; }
            .head { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; background: #f1f5f9; }
            .title { margin: 0; font-size: 18px; font-weight: 700; }
            .sub { margin: 4px 0 0; font-size: 12px; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top; }
            td:first-child { width: 180px; font-weight: 700; background: #f8fafc; color: #334155; text-transform: uppercase; }
            .amt { font-weight: 800; color: ${amount < 0 ? '#be123c' : '#047857'}; }
            .foot { padding: 12px 14px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="slip">
            <div class="head">
              <h1 class="title">Transaction Slip</h1>
              <p class="sub">${String(selectedTx.displayTransactionId || selectedTx.id || '-')}</p>
            </div>
            <table>
              <tr><td>Portal</td><td>${String(portalRef?.name || selectedTx.portalId || '-')}</td></tr>
              <tr><td>Type</td><td>${String(selectedTx.type || '-')}</td></tr>
              <tr><td>Amount</td><td class="amt">${amountLabel}</td></tr>
              <tr><td>Date</td><td>${toDateText(selectedTx.date || selectedTx.createdAt)}</td></tr>
              <tr><td>Created By</td><td>${String(creator.name || '-')}</td></tr>
              <tr><td>Description</td><td>${String(selectedTx.description || '-')}</td></tr>
            </table>
            <div class="foot">
              <span>Printed: ${new Date().toLocaleString()}</span>
              <span>ACIS Workspace</span>
            </div>
          </div>
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  }, [selectedTx, getCreator, portalsById]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const balanceText = useMemo(() => {
    const value = Number(portal?.balance || 0);
    return `${value < 0 ? '-' : ''}AED ${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [portal]);

  const methodMetaById = useMemo(() => {
    const map = {};
    transactionMethods.forEach((method) => {
      map[method.id] = {
        label: method.label,
        icon: methodIconMap[String(method.id).toLowerCase()] || method.icon,
      };
    });
    return map;
  }, [methodIconMap]);

  const onTypeChange = (nextType) => {
    const typeConfig = portalTypes.find((item) => item.id === nextType);
    setForm((prev) => ({
      ...prev,
      type: nextType,
      methods: typeConfig ? typeConfig.methods : prev.methods,
    }));
  };

  const onSave = async () => {
    if (!tenantId || !portalId || !user?.uid) return;
    if (!form.name.trim()) {
      setMessageType('error');
      setMessage('Portal name is required.');
      return;
    }
    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      methods: form.methods,
      updatedBy: user.uid,
    };
    const res = await upsertTenantPortal(tenantId, portalId, payload);
    if (!res.ok) {
      setMessageType('error');
      setMessage(res.error || 'Failed to save portal changes.');
      setIsSaving(false);
      return;
    }

    await createSyncEvent({
      tenantId,
      eventType: 'update',
      entityType: 'portal',
      entityId: portalId,
      changedFields: Object.keys(payload),
      createdBy: user.uid,
    });

    setMessageType('success');
    setMessage('Portal settings saved.');
    setIsSaving(false);
    setIsEditMode(false);
    loadData();
  };

  if (!user) return null;

  return (
    <PageShell title="Portal Detail" subtitle={portal?.name || portalId}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/t/${tenantId}/portal-management`)}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-semibold text-[var(--c-text)]"
          >
            Back to Portal Management
          </button>
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-semibold text-[var(--c-text)]"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm text-[var(--c-muted)]">
            Loading portal detail...
          </p>
        ) : !portal ? (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-600">
            Portal not found.
          </p>
        ) : (
          <>
            <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={portal.iconUrl || '/portals/portals.png'} alt={portal.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-[var(--c-text)]">{portal.name}</p>
                    <p className="text-xs text-[var(--c-muted)]">Current Balance: {balanceText}</p>
                  </div>
                </div>
                <div>
                  {!isEditMode ? (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-semibold text-[var(--c-text)] hover:border-[var(--c-accent)]"
                    >
                      Edit Portal
                    </button>
                  ) : null}
                </div>
              </div>

              {isEditMode ? (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-semibold text-[var(--c-muted)]">
                      Name
                      <input
                        type="text"
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[var(--c-muted)]">
                      Type
                      <select
                        value={form.type}
                        onChange={(event) => onTypeChange(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                      >
                        {portalTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-[var(--c-muted)]">
                      Status
                      <select
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-3">
                    <p className="mb-2 text-xs font-semibold text-[var(--c-muted)]">Allowed Methods</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {transactionMethods.map((method) => {
                        const selected = form.methods.includes(method.id);
                        const iconUrl = methodIconMap[String(method.id).toLowerCase()] || method.icon;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setForm((prev) => ({
                              ...prev,
                              methods: selected ? prev.methods.filter((id) => id !== method.id) : [...prev.methods, method.id],
                            }))}
                            className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left ${selected
                              ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/10'
                              : 'border-[var(--c-border)] bg-[var(--c-panel)]'
                              }`}
                          >
                            <img src={iconUrl} alt={method.label} className="h-5 w-5 object-contain" />
                            <span className="text-xs font-semibold text-[var(--c-text)]">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={isSaving}
                      className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSaving ? 'Saving...' : 'Save Portal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(false);
                        if (portal) {
                          setForm({
                            name: portal.name || '',
                            type: portal.type || 'Bank',
                            status: portal.status || 'active',
                            methods: Array.isArray(portal.methods) ? portal.methods : [],
                          });
                        }
                      }}
                      className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-sm font-semibold text-[var(--c-text)]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Name</p>
                    <p className="text-xs font-semibold text-[var(--c-text)]">{portal.name || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Type</p>
                    <p className="text-xs font-semibold text-[var(--c-text)]">{portal.type || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Status</p>
                    <p className="text-xs font-semibold text-[var(--c-text)]">{portal.status || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Methods</p>
                    {(portal.methods || []).length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(portal.methods || []).map((methodId) => {
                          const methodMeta = methodMetaById[methodId] || {
                            label: String(methodId || ''),
                            icon: '/portals/methods/onlinePayment.png',
                          };
                          return (
                            <span
                              key={methodId}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--c-text)]"
                            >
                              <img src={methodMeta.icon} alt={methodMeta.label} className="h-3.5 w-3.5 object-contain" />
                              {methodMeta.label}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-[var(--c-text)]">-</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {message ? (
              <p className={`rounded-xl border p-3 text-sm ${messageType === 'error'
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-600'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                }`}>
                {message}
              </p>
            ) : null}

            <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
              <p className="mb-3 text-sm font-bold text-[var(--c-text)]">Portal Transaction History</p>
              {txRows.length === 0 ? (
                <p className="text-sm text-[var(--c-muted)]">No transactions found for this portal.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[740px] text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-[var(--c-muted)]">
                        <th className="py-2">Tx ID</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Created By</th>
                        <th className="py-2">Description</th>
                        <th className="py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txRows.map((row) => {
                        const creator = getCreator(row.createdBy);
                        return (
                          <tr key={row.id} className="border-t border-[var(--c-border)]">
                            <td className="py-2 pr-2">
                              <button
                                type="button"
                                onClick={() => setSelectedTx(row)}
                                className="rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] px-2 py-1 text-xs font-bold text-[var(--c-accent)] hover:border-[var(--c-accent)]"
                                title="View full transaction details"
                              >
                                {row.displayTransactionId || row.id}
                              </button>
                            </td>
                            <td className="py-2 pr-2 text-[var(--c-muted)]">{row.type || '-'}</td>
                            <td className={`py-2 pr-2 font-semibold ${Number(row.amount || 0) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 pr-2">
                              <Link
                                to={`/t/${tenantId}/profile`}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[var(--c-panel)] px-2 py-1 pr-3 text-xs text-[var(--c-text)] hover:border-[var(--c-accent)]"
                                title={`Open profile of ${creator.name}`}
                              >
                                <img src={creator.avatar} alt={creator.name} className="h-6 w-6 rounded-full object-cover" />
                                <span>{creator.name}</span>
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                            <td className="py-2 pr-2 text-[var(--c-muted)]">{row.description || '-'}</td>
                            <td className="py-2 text-[var(--c-muted)]">{toDateText(row.date || row.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      {selectedTx ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--c-text)]">
                Transaction Detail: {selectedTx.displayTransactionId || selectedTx.id}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintTx}
                  className="rounded-lg border border-[var(--c-accent)] bg-[var(--c-accent)]/10 px-2 py-1 text-xs font-semibold text-[var(--c-accent)]"
                >
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="rounded-lg border border-[var(--c-border)] px-2 py-1 text-xs font-semibold text-[var(--c-text)]"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[var(--c-border)]">
              <table className="w-full text-left text-sm">
                <tbody>
                  {Object.entries(selectedTx)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <tr key={key} className="border-t border-[var(--c-border)] align-top">
                        <td className="w-48 bg-[var(--c-panel)] px-3 py-2 text-xs font-bold uppercase text-[var(--c-muted)]">{toFieldLabel(key)}</td>
                        <td className="px-3 py-2 text-xs text-[var(--c-text)] break-all">{renderTxValue(key, value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
};

export default PortalDetailPage;
