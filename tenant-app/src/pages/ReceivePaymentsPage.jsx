import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, RefreshCcw, Wallet } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import ClientSearchField from '../components/dailyTransaction/ClientSearchField';
import CurrencyValue from '../components/common/CurrencyValue';
import { useTenant } from '../context/useTenant';
import { useAuth } from '../context/useAuth';
import {
  fetchTenantClients,
  fetchTenantPortals,
  fetchTenantProformaInvoices,
  generateDisplayDocumentRef,
  recordClientPaymentWithFinancials,
  recordClientRefundWithFinancials,
} from '../lib/backendStore';
import { toSafeDocId } from '../lib/idUtils';
import { resolvePortalMethodDefinitions } from '../lib/transactionMethodConfig';
import { sendUniversalNotification } from '../lib/notificationDrafting';

const inputClass = 'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm font-bold text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]';

const ReceivePaymentsPage = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const prefillClientId = String(searchParams.get('clientId') || '').trim();
  const prefillProformaId = String(searchParams.get('proformaId') || '').trim();

  const [displayRef, setDisplayRef] = useState('');
  const [type, setType] = useState('payment');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedPortalId, setSelectedPortalId] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [selectedProformaId, setSelectedProformaId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showPortalBalance, setShowPortalBalance] = useState(false);

  const [portals, setPortals] = useState([]);
  const [proformas, setProformas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');

  const pushStatus = (message, nextType = 'info') => {
    setStatus(message);
    setStatusType(nextType);
  };

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const [nextRef, clientsRes, portalsRes, proformaRes] = await Promise.all([
      generateDisplayDocumentRef(tenantId, 'clientPayment'),
      fetchTenantClients(tenantId),
      fetchTenantPortals(tenantId),
      fetchTenantProformaInvoices(tenantId),
    ]);

    setDisplayRef(nextRef);
    if (clientsRes.ok) {
      const rows = clientsRes.rows || [];
      if (prefillClientId) {
        const found = rows.find((item) => String(item.id) === prefillClientId || String(item.displayClientId) === prefillClientId);
        if (found) setSelectedClient(found);
      }
    }
    if (portalsRes.ok) setPortals(portalsRes.rows || []);
    if (proformaRes.ok) {
      setProformas(proformaRes.rows || []);
      if (prefillProformaId) setSelectedProformaId(prefillProformaId);
    }
    setIsLoading(false);
  }, [tenantId, prefillClientId, prefillProformaId]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      void loadData();
    });
    return () => cancelAnimationFrame(handle);
  }, [loadData]);

  const selectedPortal = useMemo(
    () => portals.find((item) => item.id === selectedPortalId) || null,
    [portals, selectedPortalId],
  );

  const availableMethods = useMemo(() => {
    if (!selectedPortal) return [];
    const defs = resolvePortalMethodDefinitions(selectedPortal.customMethods || []);
    return defs.filter((method) => (selectedPortal.methods || []).includes(method.id));
  }, [selectedPortal]);

  const availableProformas = useMemo(() => {
    if (!selectedClient?.id) return [];
    return proformas.filter((item) => {
      if (String(item.clientId || '') !== String(selectedClient.id)) return false;
      const statusValue = String(item.status || '').toLowerCase();
      return statusValue !== 'canceled';
    });
  }, [proformas, selectedClient]);

  const effectiveSelectedProformaId = useMemo(
    () => (availableProformas.some((item) => item.id === selectedProformaId) ? selectedProformaId : ''),
    [availableProformas, selectedProformaId],
  );

  const effectiveSelectedMethodId = useMemo(
    () => (availableMethods.some((item) => item.id === selectedMethodId) ? selectedMethodId : ''),
    [availableMethods, selectedMethodId],
  );

  const currentClientBalance = useMemo(() => Number(selectedClient?.balance ?? selectedClient?.openingBalance ?? 0) || 0, [selectedClient]);
  const currentPortalBalance = useMemo(() => Number(selectedPortal?.balance ?? 0) || 0, [selectedPortal]);
  const numericAmount = useMemo(() => Math.max(0, Number(amount || 0)), [amount]);

  const projectedClientBalance = type === 'refund'
    ? currentClientBalance - numericAmount
    : currentClientBalance + numericAmount;
  const projectedPortalBalance = type === 'refund'
    ? currentPortalBalance - numericAmount
    : currentPortalBalance + numericAmount;

  const today = new Date().toISOString().slice(0, 10);

  const resetForm = async () => {
    const nextRef = await generateDisplayDocumentRef(tenantId, 'clientPayment');
    setDisplayRef(nextRef);
    setAmount('');
    setNote('');
    setType('payment');
    setDate(today);
    setSelectedMethodId('');
    setSelectedProformaId('');
    setStatus('');
    setShowPortalBalance(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedClient?.id) return pushStatus('Please select a client.', 'error');
    if (!selectedPortalId) return pushStatus('Please select a receiving portal.', 'error');
    if (!effectiveSelectedMethodId) return pushStatus('Please select a receiving method.', 'error');
    if (!(numericAmount > 0)) return pushStatus('Amount must be greater than zero.', 'error');
    if (!date) return pushStatus('Receipt date is required.', 'error');
    if (date > today) return pushStatus('Future date is not allowed.', 'error');

    setIsSaving(true);
    const paymentId = toSafeDocId(displayRef, type === 'refund' ? 'refund' : 'payment');
    const payload = {
      displayRef,
      clientId: selectedClient.id,
      portalId: selectedPortalId,
      methodId: effectiveSelectedMethodId,
      amount: numericAmount,
      receivedAt: new Date(date).toISOString(),
      proformaId: effectiveSelectedProformaId || '',
      referenceType: effectiveSelectedProformaId ? 'proforma_linked' : 'general_balance',
      createdBy: user?.uid || '',
      note,
    };

    const res = type === 'refund'
      ? await recordClientRefundWithFinancials(tenantId, paymentId, payload)
      : await recordClientPaymentWithFinancials(tenantId, paymentId, payload);

    if (!res.ok) {
      pushStatus(res.error || `Failed to ${type}.`, 'error');
      setIsSaving(false);
      return;
    }

    await sendUniversalNotification({
      tenantId,
      topic: 'finance',
      subTopic: type === 'refund' ? 'refund' : 'payment',
      type,
      title: type === 'refund' ? 'Refund Processed' : 'Payment Received',
      message: `${displayRef} for ${selectedClient.fullName || selectedClient.tradeName || selectedClient.displayClientId || selectedClient.id}.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/receive-payments`,
      actionPresets: ['view'],
      entityType: 'clientPayment',
      entityId: paymentId,
      entityLabel: displayRef,
      quickView: {
        title: displayRef,
        subtitle: type === 'refund' ? 'Refund Entry' : 'Payment Entry',
        fields: [
          { label: 'Client', value: selectedClient.fullName || selectedClient.tradeName || selectedClient.displayClientId || selectedClient.id },
          { label: 'Amount', value: `AED ${numericAmount.toFixed(2)}` },
          { label: 'Portal', value: selectedPortal?.name || selectedPortalId },
          { label: 'Method', value: effectiveSelectedMethodId },
          { label: 'Reference Type', value: payload.referenceType },
        ],
      },
    });

    pushStatus(
      type === 'refund'
        ? `Refund ${displayRef} recorded successfully.`
        : `Payment ${displayRef} recorded successfully.`,
      'success',
    );
    await loadData();
    await resetForm();
    setIsSaving(false);
  };

  return (
    <PageShell
      title="Receive Payments"
      subtitle="Record client payments or refunds with main balance as the primary ledger."
      icon={Wallet}
    >
      <div className="space-y-4">
        {status ? (
          <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${statusType === 'error' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
            {status}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
              Payment Ref
              <input className={`${inputClass} bg-transparent`} value={displayRef} readOnly />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
              Entry Type
              <select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
              Date
              <input type="date" className={inputClass} value={date} max={today} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
              Amount
              <input type="number" min={0} step="0.01" className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} required />
            </label>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Client</p>
            <ClientSearchField
              onSelect={setSelectedClient}
              selectedId={selectedClient?.id}
              filterType="parent"
              placeholder="Search company or individual clients..."
            />
          </div>

          {selectedClient ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Current Client Balance</p>
                <p className={`mt-1 text-sm font-black ${currentClientBalance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  <CurrencyValue value={currentClientBalance} iconSize="h-3 w-3" />
                </p>
                <p className={`mt-1 text-xs font-bold ${projectedClientBalance < 0 ? 'text-rose-600' : 'text-[var(--c-muted)]'}`}>
                  After this entry: <CurrencyValue value={projectedClientBalance} iconSize="h-3 w-3" />
                </p>
              </div>
              <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Optional Proforma Link</p>
                <select className={inputClass} value={effectiveSelectedProformaId} onChange={(event) => setSelectedProformaId(event.target.value)}>
                  <option value="">Keep as general balance</option>
                  {availableProformas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayRef || item.id} • Due AED {Number(item.balanceDue || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
              Receiving Portal
              <select
                className={inputClass}
                value={selectedPortalId}
                onChange={(event) => {
                  setSelectedPortalId(event.target.value);
                  setSelectedMethodId('');
                  setShowPortalBalance(false);
                }}
                required
              >
                <option value="">Select portal...</option>
                {portals.map((item) => (
                  <option key={item.id} value={item.id}>{item.name || item.id}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
              Method
              <select className={inputClass} value={effectiveSelectedMethodId} onChange={(event) => setSelectedMethodId(event.target.value)} required>
                <option value="">Select method...</option>
                {availableMethods.map((method) => (
                  <option key={method.id} value={method.id}>{method.label}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedPortal ? (
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[var(--c-text)]">{selectedPortal.name}</p>
                  <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{selectedPortal.type || 'Portal'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortalBalance((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--c-text)]"
                >
                  {showPortalBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPortalBalance ? 'Hide Balance' : 'Show Balance'}
                </button>
              </div>
              {showPortalBalance ? (
                <p className={`mt-2 text-sm font-black ${currentPortalBalance < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  <CurrencyValue value={currentPortalBalance} iconSize="h-3 w-3" />
                </p>
              ) : null}
              {showPortalBalance ? (
                <p className={`mt-1 text-xs font-bold ${projectedPortalBalance < 0 ? 'text-rose-600' : 'text-[var(--c-muted)]'}`}>
                  After this entry: <CurrencyValue value={projectedPortalBalance} iconSize="h-3 w-3" />
                </p>
              ) : null}
            </div>
          ) : null}

          <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
            Note (Optional)
            <textarea
              rows={2}
              className={inputClass}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason, bank reference, or comment..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="rounded-xl bg-[var(--c-accent)] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              {isSaving ? 'Processing...' : (type === 'refund' ? 'Process Refund' : 'Receive Payment')}
            </button>
            <button
              type="button"
              onClick={() => void resetForm()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-xs font-black text-[var(--c-text)]"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default ReceivePaymentsPage;
