import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import IconSelect from '../components/common/IconSelect';
import CurrencyValue from '../components/common/CurrencyValue';
import { useAuth } from '../context/useAuth';
import {
  executeInternalTransfer,
  fetchPortalTransactions,
  fetchTenantPortals,
  fetchTenantUsersMap,
  sendTenantDocumentEmail,
  upsertTenantNotification,
  upsertTenantPortal,
} from '../lib/backendStore';
import { createSyncEvent } from '../lib/syncEvents';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';
import { generateDisplayTxId } from '../lib/txIdGenerator';
import { generateTenantPdf } from '../lib/pdfGenerator';
import { canUserPerformAction } from '../lib/userControlPreferences';
import { buildNotificationPayload, generateNotificationId } from '../lib/notificationTemplate';
import {
  ALLOWED_METHOD_IDS,
  TRANSACTION_METHODS,
  TX_METHOD_LABELS,
  buildMethodIconMap,
  resolveMethodIconUrl,
} from '../lib/transactionMethodConfig';

const portalTypes = [
  { id: 'Bank', label: 'Bank', methods: ALLOWED_METHOD_IDS },
  { id: 'Card Payment', label: 'Card Payment', methods: ALLOWED_METHOD_IDS },
  { id: 'Petty Cash', label: 'Petty Cash', methods: ALLOWED_METHOD_IDS },
  { id: 'Portals', label: 'Portals', methods: ALLOWED_METHOD_IDS },
  { id: 'Terminal', label: 'Terminal', methods: ALLOWED_METHOD_IDS },
];

const transactionMethods = TRANSACTION_METHODS;

const toDateText = (value) => {
  if (!value) return '-';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis()).toLocaleString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
};

const txMethodLabels = TX_METHOD_LABELS;

const fallbackPortalIcon = (type) => {
  if (type === 'Bank') return '/portals/bank.png';
  if (type === 'Card Payment') return '/portals/cardpayment.png';
  if (type === 'Petty Cash') return '/portals/pettycash.png';
  if (type === 'Terminal') return '/portals/terminal.png';
  return '/portals/portals.png';
};

const getStatusBadgeClass = (statusValue) => {
  const status = String(statusValue || 'active').toLowerCase();
  if (status === 'active') return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  if (status === 'pending') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (status === 'blocked' || status === 'frozen' || status === 'inactive') return 'border-rose-300 bg-rose-50 text-rose-700';
  return 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]';
};

const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value?.toDate === 'function' || typeof value?.toMillis === 'function') return toDateText(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
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
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTransferSaving, setIsTransferSaving] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementEmail, setStatementEmail] = useState(user?.email || '');
  const [isStatementSending, setIsStatementSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [selectedTx, setSelectedTx] = useState(null);
  const [transferForm, setTransferForm] = useState({
    fromPortalId: '',
    toPortalId: '',
    amount: '',
    fee: '0',
    description: '',
  });
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [statementRange, setStatementRange] = useState({
    start: (() => {
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      return start.toISOString().slice(0, 10);
    })(),
    end: todayIso,
  });
  const [minTxDate, setMinTxDate] = useState(todayIso);
  const [maxTxDate] = useState(todayIso);

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
      setMethodIconMap(buildMethodIconMap(iconRes.rows || []));
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
    const minDateMillis = (txRes.ok ? (txRes.rows || []) : []).reduce((min, row) => {
      const ts = toMillis(row.date || row.createdAt || row.updatedAt);
      if (!ts) return min;
      return min === 0 ? ts : Math.min(min, ts);
    }, 0);
    if (minDateMillis > 0) {
      const iso = new Date(minDateMillis).toISOString().slice(0, 10);
      setMinTxDate(iso);
      setStatementRange((prev) => ({
        ...prev,
        start: prev.start < iso ? iso : prev.start,
      }));
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



  const methodMetaById = useMemo(() => {
    const map = {};
    transactionMethods.forEach((method) => {
      map[method.id] = {
        label: method.label,
        icon: resolveMethodIconUrl(methodIconMap, method.id),
        Icon: method.Icon,
      };
    });
    return map;
  }, [methodIconMap]);

  const portalOptions = useMemo(() => {
    const rows = Object.entries(portalsById).map(([id, p]) => ({ id, ...(p || {}) }));
    return rows.map((p) => ({
      value: p.id,
      label: `${p.name || p.id} (AED ${(Number(p.balance || 0)).toLocaleString()})`,
      icon: p.iconUrl || fallbackPortalIcon(p.type),
      meta: (Array.isArray(p.methods) ? p.methods.map((id) => txMethodLabels[id] || id) : []).join(' | '),
    }));
  }, [portalsById]);

  const monthOptions = useMemo(() => {
    const result = [];
    const minDate = new Date(minTxDate);
    const maxDate = new Date(maxTxDate);
    minDate.setUTCDate(1);
    maxDate.setUTCDate(1);
    const cursor = new Date(maxDate);
    while (cursor >= minDate) {
      const value = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = cursor.toLocaleString('default', { month: 'long', year: 'numeric' });
      result.push({ value, label });
      cursor.setUTCMonth(cursor.getUTCMonth() - 1);
    }
    return result;
  }, [minTxDate, maxTxDate]);

  const openTransfer = () => {
    setTransferForm({
      fromPortalId: portalId || '',
      toPortalId: '',
      amount: '',
      fee: '0',
      description: '',
    });
    setIsTransferOpen(true);
  };

  const computeStatement = useCallback(() => {
    const startMillis = toMillis(statementRange.start);
    const endMillis = toMillis(statementRange.end) + 24 * 60 * 60 * 1000 - 1;
    const sorted = [...txRows].sort((a, b) => toMillis(a.date || a.createdAt || a.updatedAt) - toMillis(b.date || b.createdAt || b.updatedAt));

    const openingBalance = sorted.reduce((sum, row) => {
      const ts = toMillis(row.date || row.createdAt || row.updatedAt);
      if (!ts || ts >= startMillis) return sum;
      const amount = Number(row.amount || 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);

    const inRange = sorted.filter((row) => {
      const ts = toMillis(row.date || row.createdAt || row.updatedAt);
      return ts && ts >= startMillis && ts <= endMillis;
    });

    const creditTotal = inRange.reduce((sum, r) => {
      const amt = Number(r.amount || 0);
      return amt > 0 ? sum + amt : sum;
    }, 0);
    const debitTotal = inRange.reduce((sum, r) => {
      const amt = Number(r.amount || 0);
      return amt < 0 ? sum + Math.abs(amt) : sum;
    }, 0);
    const closingBalance = openingBalance + inRange.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return { inRange, openingBalance, closingBalance, creditTotal, debitTotal, startMillis, endMillis };
  }, [statementRange, txRows]);

  const handleMonthSelect = (value) => {
    if (!value) return;
    const [year, month] = value.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const max = new Date(`${maxTxDate}T23:59:59Z`);
    const clampedEnd = end > max ? max : end;
    setStatementRange({
      start: start.toISOString().slice(0, 10),
      end: clampedEnd.toISOString().slice(0, 10),
    });
  };

  const formatAmountDisplay = (amt) =>
    `${amt < 0 ? '-' : ''}AED ${Math.abs(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrintStatement = () => {
    const { inRange, openingBalance, closingBalance, creditTotal, debitTotal } = computeStatement();
    const rowsHtml = inRange.map((row) => {
      const ts = toDateText(row.date || row.createdAt || row.updatedAt);
      const amt = Number(row.amount || 0);
      const isDebit = amt < 0;
      const isFee = String(row.type || '').toLowerCase().includes('fee') || String(row.category || '').toLowerCase().includes('fee');
      return `
        <tr class="${isFee ? 'fee-row' : ''}">
          <td>${ts}</td>
          <td>${row.displayTransactionId || row.id}</td>
          <td>${row.type || '-'}</td>
          <td>${row.description || '-'}</td>
          <td class="${isDebit ? 'debit' : 'credit'}">${isDebit ? formatAmountDisplay(Math.abs(amt) * -1) : ''}</td>
          <td class="${!isDebit ? 'credit' : 'debit'}">${!isDebit ? formatAmountDisplay(amt) : ''}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Portal Statement</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #f8fafc; }
          .card { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; }
          .head { padding: 18px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(135deg, #f8fafc, #eef2ff); }
          .title { margin: 0; font-size: 20px; font-weight: 800; }
          .meta { margin: 4px 0 0; font-size: 12px; color: #475569; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 10px; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
          .pill { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
          .pill h4 { margin: 0; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
          .pill p { margin: 4px 0 0; font-size: 14px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: left; }
          th { background: #f1f5f9; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; color: #475569; }
          .credit { color: #047857; font-weight: 700; }
          .debit { color: #be123c; font-weight: 700; }
          .fee-row { background: #fff7ed; }
          .foot { padding: 12px 18px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="head">
            <h1 class="title">Portal Statement</h1>
            <p class="meta">${portal?.name || portalId} • ${statementRange.start} to ${statementRange.end}</p>
          </div>
          <div class="summary">
            <div class="pill"><h4>Opening Balance</h4><p>${formatAmountDisplay(openingBalance)}</p></div>
            <div class="pill"><h4>Total Credits</h4><p class="credit">+${formatAmountDisplay(creditTotal)}</p></div>
            <div class="pill"><h4>Total Debits</h4><p class="debit">-${formatAmountDisplay(debitTotal)}</p></div>
            <div class="pill"><h4>Closing Balance</h4><p>${formatAmountDisplay(closingBalance)}</p></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tx ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="foot">
            <span>Printed: ${new Date().toLocaleString()}</span>
            <span>ACIS Workspace</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=1000,height=900');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const buildStatementPdfData = () => {
    const { inRange, openingBalance, closingBalance, creditTotal, debitTotal } = computeStatement();
    const txId = `${portalId}_${statementRange.start}_${statementRange.end}`;
    const items = [
      { name: 'Opening Balance', qty: 1, price: openingBalance, total: openingBalance },
      ...inRange.map((row) => ({
        name: `${toDateText(row.date || row.createdAt || row.updatedAt)} • ${row.displayTransactionId || row.id} • ${row.type || ''}`,
        qty: 1,
        price: Number(row.amount || 0),
        total: Number(row.amount || 0),
      })),
      { name: 'Total Credits', qty: 1, price: creditTotal, total: creditTotal },
      { name: 'Total Debits', qty: 1, price: -debitTotal, total: -debitTotal },
      { name: 'Closing Balance', qty: 1, price: closingBalance, total: closingBalance },
    ];
    return { txId, items, closingBalance };
  };

  const handleDownloadStatementPdf = async () => {
    const data = buildStatementPdfData();
    await generateTenantPdf({
      tenantId,
      documentType: 'portalStatement',
      data: {
        txId: data.txId,
        date: statementRange.end,
        amount: data.closingBalance,
        recipientName: portal?.name || portalId,
        description: `Portal statement ${statementRange.start} to ${statementRange.end}`,
        items: data.items,
      },
      save: true,
      returnBase64: false,
      filename: `portalStatement_${portalId}_${statementRange.start}_${statementRange.end}.pdf`,
    });
  };

  const handleEmailStatementPdf = async () => {
    const data = buildStatementPdfData();
    setIsStatementSending(true);
    const pdfRes = await generateTenantPdf({
      tenantId,
      documentType: 'portalStatement',
      data: {
        txId: data.txId,
        date: statementRange.end,
        amount: data.closingBalance,
        recipientName: portal?.name || portalId,
        description: `Portal statement ${statementRange.start} to ${statementRange.end}`,
        items: data.items,
      },
      save: false,
      returnBase64: true,
      filename: `portalStatement_${portalId}_${statementRange.start}_${statementRange.end}.pdf`,
    });
    if (!pdfRes.ok) {
      setIsStatementSending(false);
      setMessageType('error');
      setMessage(pdfRes.error || 'Failed to generate statement PDF.');
      return;
    }
    const email = statementEmail || user?.email;
    if (!email) {
      setIsStatementSending(false);
      setMessageType('error');
      setMessage('Please provide an email to send the statement.');
      return;
    }
    const emailRes = await sendTenantDocumentEmail(
      tenantId,
      email,
      'portalStatement',
      pdfRes.base64,
      {
        txId: data.txId,
        recipientName: portal?.name || portalId
      }
    );
    setIsStatementSending(false);
    if (!emailRes.ok) {
      setMessageType('error');
      setMessage(emailRes.error || 'Failed to send email.');
      return;
    }
    setMessageType('success');
    setMessage(`Statement emailed to ${email}.`);
  };

  const handleTransfer = async (event) => {
    event.preventDefault();
    if (!tenantId || !user?.uid) return;
    if (!transferForm.fromPortalId || !transferForm.toPortalId || !transferForm.amount) {
      setMessageType('error');
      setMessage('Please fill source, destination and amount for transfer.');
      return;
    }
    if (transferForm.fromPortalId === transferForm.toPortalId) {
      setMessageType('error');
      setMessage('Source and destination portals must be different.');
      return;
    }

    setIsTransferSaving(true);
    const displayTxId = await generateDisplayTxId(tenantId, 'TRF');
    const res = await executeInternalTransfer(tenantId, {
      ...transferForm,
      amount: Number(transferForm.amount),
      fee: Number(transferForm.fee || 0),
      displayTxId,
      createdBy: user.uid,
    });
    if (!res.ok) {
      setMessageType('error');
      setMessage(res.error || 'Transfer failed.');
      setIsTransferSaving(false);
      return;
    }

    const finalTxId = res.displayTxId || displayTxId;
    setMessageType('success');
    setMessage(`Transfer successful. ID: ${finalTxId}`);
    setIsTransferSaving(false);
    setIsTransferOpen(false);
    loadData();
  };

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

    await upsertTenantNotification(
      tenantId,
      generateNotificationId({ topic: 'finance', subTopic: 'portal' }),
      {
        ...buildNotificationPayload({
          topic: 'finance',
          subTopic: 'portal',
          type: 'update',
          title: 'Portal Updated',
          detail: `${form.name.trim()} settings were updated.`,
          createdBy: user.uid,
          routePath: `/t/${tenantId}/portal-management/${portalId}`,
          actionPresets: ['view'],
        }),
        eventType: 'update',
        entityType: 'portal',
        entityId: portalId,
      },
    ).catch(() => null);

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
                    <div className="mt-0.5 text-xs text-[var(--c-muted)]">
                      <span className="mr-1 font-semibold text-[var(--c-text)]">Balance:</span>
                      <CurrencyValue value={portal?.balance || 0} iconSize="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
                <div>
                  {!isEditMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openTransfer}
                        disabled={!canUserPerformAction(tenantId, user, 'internalTransfer')}
                        className="rounded-xl border border-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--c-accent)] disabled:opacity-50"
                      >
                        Internal Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsStatementOpen(true)}
                        className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-semibold text-[var(--c-text)] hover:border-[var(--c-accent)]"
                      >
                        Print Statement
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-semibold text-[var(--c-text)] hover:border-[var(--c-accent)]"
                      >
                        Edit Portal
                      </button>
                    </div>
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
                        const iconUrl = resolveMethodIconUrl(methodIconMap, method.id);
                        const MethodIcon = method.Icon;
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
                            {iconUrl ? (
                              <img
                                src={iconUrl}
                                alt={method.label}
                                className="h-5 w-5 object-contain"
                              />
                            ) : (
                              <MethodIcon className="h-5 w-5 text-[var(--c-text)]" />
                            )}
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
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_55%,white)] px-2 py-1 shadow-sm">
                      <img
                        src={fallbackPortalIcon(portal.type)}
                        alt={portal.type || 'Portal'}
                        className="h-5 w-5 rounded object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/portals/portals.png';
                        }}
                      />
                      <p className="text-xs font-semibold text-[var(--c-text)]">{portal.type || '-'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Status</p>
                    <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusBadgeClass(portal.status)}`}>
                      {String(portal.status || 'active').charAt(0).toUpperCase() + String(portal.status || 'active').slice(1)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Methods</p>
                    {(portal.methods || []).length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(portal.methods || []).map((methodId) => {
                          const methodMeta = methodMetaById[methodId] || {
                            label: String(methodId || ''),
                            icon: '',
                            Icon: null,
                          };
                          const MethodIcon = methodMeta.Icon;
                          return (
                            <span
                              key={methodId}
                              className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_60%,white)] px-2.5 py-1 text-[11px] font-semibold text-[var(--c-text)] shadow-sm"
                            >
                              {methodMeta.icon ? (
                                <img
                                  src={methodMeta.icon}
                                  alt={methodMeta.label}
                                  className="h-3.5 w-3.5 object-contain"
                                />
                              ) : MethodIcon ? (
                                <MethodIcon className="h-3.5 w-3.5 text-[var(--c-text)]" />
                              ) : null}
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
                        const amt = Number(row.amount || 0);
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
                            <td className={`py-2 pr-2 font-semibold ${amt < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {formatAmountDisplay(amt)}
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
      {isTransferOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--c-text)]">Internal Transfer</h3>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="rounded-lg border border-[var(--c-border)] px-2 py-1 text-xs font-semibold text-[var(--c-text)]"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Source Portal</label>
                  <div className="mt-1">
                    <IconSelect
                      value={transferForm.fromPortalId}
                      onChange={(nextFromPortalId) => setTransferForm((prev) => ({ ...prev, fromPortalId: nextFromPortalId }))}
                      options={portalOptions}
                      placeholder="Select Source"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Destination Portal</label>
                  <div className="mt-1">
                    <IconSelect
                      value={transferForm.toPortalId}
                      onChange={(nextToPortalId) => setTransferForm((prev) => ({ ...prev, toPortalId: nextToPortalId }))}
                      options={portalOptions}
                      placeholder="Select Destination"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Transfer Amount</label>
                  <input
                    type="number"
                    required
                    value={transferForm.amount}
                    onChange={(event) => setTransferForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm font-semibold text-[var(--c-text)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Transfer Fee (Optional)</label>
                  <input
                    type="number"
                    value={transferForm.fee}
                    onChange={(event) => setTransferForm((prev) => ({ ...prev, fee: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm font-semibold text-[var(--c-text)] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Reference / Note</label>
                <textarea
                  rows={2}
                  value={transferForm.description}
                  onChange={(event) => setTransferForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-semibold text-[var(--c-text)] outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isTransferSaving}
                className="w-full rounded-xl bg-[var(--c-accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isTransferSaving ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {isStatementOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[var(--c-text)]">Print Portal Statement</h3>
              <button
                type="button"
                onClick={() => {
                  setIsStatementOpen(false);
                  setMessage('');
                }}
                className="rounded-lg border border-[var(--c-border)] px-2 py-1 text-xs font-semibold text-[var(--c-text)]"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase text-[var(--c-muted)]">
                Quick Select Month
                <select
                  className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                  value=""
                  onChange={(e) => {
                    handleMonthSelect(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">Choose month…</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                  From
                  <input
                    type="date"
                    min={minTxDate}
                    max={maxTxDate}
                    value={statementRange.start}
                    onChange={(e) => setStatementRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none dark:[color-scheme:dark] [color-scheme:dark]"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                  To
                  <input
                    type="date"
                    min={minTxDate}
                    max={maxTxDate}
                    value={statementRange.end}
                    onChange={(e) => setStatementRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none dark:[color-scheme:dark] [color-scheme:dark]"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="flex-1 rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Print Statement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setStatementRange({
                      start: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10),
                      end: todayIso,
                    });
                  }}
                  className="rounded-xl border border-[var(--c-border)] px-3 py-2 text-sm font-semibold text-[var(--c-text)]"
                >
                  Reset
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDownloadStatementPdf}
                  className="rounded-xl border border-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 text-sm font-semibold text-[var(--c-accent)] hover:border-[var(--c-accent)]"
                >
                  Download PDF
                </button>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Send by Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={statementEmail}
                      onChange={(e) => setStatementEmail(e.target.value)}
                      placeholder={user?.email || 'recipient@example.com'}
                      className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleEmailStatementPdf}
                      disabled={isStatementSending}
                      className="rounded-xl bg-[var(--c-accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isStatementSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`rounded-xl border p-2 text-center text-xs font-bold animate-in fade-in slide-in-from-top-1 ${messageType === 'error'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-500'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                  }`}>
                  {message}
                </div>
              )}
              <p className="text-[11px] text-[var(--c-muted)]">
                Dates are limited to portal transaction history (min {minTxDate}) through today ({maxTxDate}). Service fees are highlighted automatically.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
};

export default PortalDetailPage;

