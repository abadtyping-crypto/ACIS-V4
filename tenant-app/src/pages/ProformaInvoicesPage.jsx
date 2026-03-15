import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ban,
  Download,
  Mail,
  Plus,
  Save,
  SendHorizontal,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { useTenant } from '../context/useTenant';
import { useAuth } from '../context/useAuth';
import ServiceSearchField from '../components/dailyTransaction/ServiceSearchField';
import CurrencyValue from '../components/common/CurrencyValue';
import {
  convertQuotationToProforma,
  fetchTenantProformaInvoices,
  fetchTenantQuotations,
  sendTenantDocumentEmail,
  upsertTenantProformaInvoice,
} from '../lib/backendStore';
import { generateTenantPdf } from '../lib/pdfGenerator';
import { sendUniversalNotification } from '../lib/notificationDrafting';
import { createSyncEvent } from '../lib/syncEvents';

const inputClass = 'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm font-bold text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]';

const toLineItem = (item, index) => {
  const qty = Math.max(1, Number(item?.qty || 1));
  const amount = Math.max(0, Number(item?.amount || 0));
  const lineTotal = Number.isFinite(Number(item?.lineTotal)) ? Number(item.lineTotal) : qty * amount;
  return {
    rowId: String(item?.rowId || `${index + 1}`),
    applicationId: String(item?.applicationId || ''),
    name: String(item?.name || ''),
    description: String(item?.description || ''),
    qty,
    amount,
    govCharge: Number(item?.govCharge || 0) || 0,
    lineTotal,
  };
};

const ProformaInvoicesPage = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [serviceRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const selectedIdRef = useRef('');

  const pushStatus = (message, type = 'info') => {
    setStatus(message);
    setStatusType(type);
  };

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const hydrateEditorFromRow = useCallback((row) => {
    const next = (row?.items || []).map((item, index) => toLineItem(item, index));
    setEditItems(next);
  }, []);

  const loadData = useCallback(async (preferredId = '') => {
    if (!tenantId) return;
    setIsLoading(true);
    const [proformaRes, quotationRes] = await Promise.all([
      fetchTenantProformaInvoices(tenantId),
      fetchTenantQuotations(tenantId),
    ]);
    if (proformaRes.ok) {
      const nextRows = proformaRes.rows || [];
      setRows(nextRows);
      const currentId = selectedIdRef.current;
      const resolvedId = (preferredId && nextRows.some((item) => item.id === preferredId))
        ? preferredId
        : (nextRows.some((item) => item.id === currentId) ? currentId : (nextRows[0]?.id || ''));
      setSelectedId(resolvedId);
      hydrateEditorFromRow(nextRows.find((item) => item.id === resolvedId) || null);
    }
    if (quotationRes.ok) setQuotations(quotationRes.rows || []);
    setIsLoading(false);
  }, [tenantId, hydrateEditorFromRow]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      void loadData();
    });
    return () => cancelAnimationFrame(handle);
  }, [loadData]);

  const selectedProforma = useMemo(
    () => rows.find((item) => item.id === selectedId) || rows[0] || null,
    [rows, selectedId],
  );

  const convertibleQuotations = useMemo(
    () => quotations.filter((item) => !item.proformaId && String(item.status || '').toLowerCase() !== 'canceled'),
    [quotations],
  );

  const totals = useMemo(() => {
    const totalAmount = editItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.amount) || 0)), 0);
    const amountPaid = Math.max(0, Number(selectedProforma?.amountPaid || 0));
    return {
      totalAmount,
      amountPaid,
      balanceDue: Math.max(0, totalAmount - amountPaid),
    };
  }, [editItems, selectedProforma?.amountPaid]);

  const handleAddItem = (service) => {
    if (!service) return;
    const already = editItems.some((item) => item.applicationId && item.applicationId === service.id);
    if (already) {
      pushStatus(`"${service.name}" already exists. Update quantity instead.`, 'error');
      return;
    }
    setEditItems((prev) => [
      ...prev,
      toLineItem(
        {
          applicationId: service.id,
          name: service.name,
          description: service.description,
          qty: 1,
          amount: Number(service.clientCharge || 0),
          govCharge: Number(service.govCharge || 0),
        },
        prev.length,
      ),
    ]);
  };

  const handleItemChange = (rowId, field, value) => {
    setEditItems((prev) => prev.map((item) => {
      if (item.rowId !== rowId) return item;
      if (field === 'qty') return { ...item, qty: Math.max(1, Number(value) || 1) };
      if (field === 'amount') return { ...item, amount: Math.max(0, Number(value) || 0) };
      return { ...item, [field]: value };
    }));
  };

  const handleRemoveItem = (rowId) => {
    setEditItems((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const handleSave = async () => {
    if (!selectedProforma?.id) return;
    if (editItems.length === 0) {
      pushStatus('At least one application is required.', 'error');
      return;
    }
    setIsSaving(true);
    const payload = {
      items: editItems.map((item, index) => toLineItem(item, index)),
      totalAmount: totals.totalAmount,
      balanceDue: totals.balanceDue,
      updatedBy: user?.uid || '',
      status: totals.balanceDue <= 0 ? 'paid' : selectedProforma.status || 'drafted',
    };
    const res = await upsertTenantProformaInvoice(tenantId, selectedProforma.id, payload);
    if (!res.ok) {
      pushStatus(res.error || 'Failed to save proforma changes.', 'error');
      setIsSaving(false);
      return;
    }
    await createSyncEvent({
      tenantId,
      eventType: 'update',
      entityType: 'proformaInvoice',
      entityId: selectedProforma.id,
      changedFields: Object.keys(payload),
      createdBy: user?.uid || '',
    });
    await sendUniversalNotification({
      tenantId,
      topic: 'documents',
      subTopic: 'proforma',
      type: 'update',
      title: 'Proforma Updated',
      message: `${selectedProforma.displayRef || selectedProforma.id} was updated.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/proforma-invoices`,
      actionPresets: ['view'],
      entityType: 'proformaInvoice',
      entityId: selectedProforma.id,
      entityLabel: selectedProforma.displayRef || selectedProforma.id,
    });
    pushStatus('Proforma saved successfully.', 'success');
    await loadData(selectedProforma.id);
    setIsSaving(false);
  };

  const handleMarkSent = async () => {
    if (!selectedProforma?.id) return;
    setIsSaving(true);
    const res = await upsertTenantProformaInvoice(tenantId, selectedProforma.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      updatedBy: user?.uid || '',
    });
    if (!res.ok) {
      pushStatus(res.error || 'Failed to mark proforma as sent.', 'error');
      setIsSaving(false);
      return;
    }
    await sendUniversalNotification({
      tenantId,
      topic: 'documents',
      subTopic: 'proforma',
      type: 'status',
      title: 'Proforma Sent',
      message: `${selectedProforma.displayRef || selectedProforma.id} marked as sent.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/proforma-invoices`,
      actionPresets: ['view'],
      entityType: 'proformaInvoice',
      entityId: selectedProforma.id,
      entityLabel: selectedProforma.displayRef || selectedProforma.id,
    });
    pushStatus('Proforma marked as sent.', 'success');
    await loadData(selectedProforma.id);
    setIsSaving(false);
  };

  const handleCancel = async () => {
    if (!selectedProforma?.id) return;
    const reason = window.prompt('Enter cancellation reason (minimum 30 characters):', '');
    const normalized = String(reason || '').trim();
    if (!normalized) return;
    if (normalized.length < 30) {
      pushStatus('Cancellation reason must be at least 30 characters.', 'error');
      return;
    }

    setIsSaving(true);
    const res = await upsertTenantProformaInvoice(tenantId, selectedProforma.id, {
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      canceledBy: user?.uid || '',
      cancellationReason: normalized,
      updatedBy: user?.uid || '',
    });
    if (!res.ok) {
      pushStatus(res.error || 'Failed to cancel proforma.', 'error');
      setIsSaving(false);
      return;
    }
    await sendUniversalNotification({
      tenantId,
      topic: 'documents',
      subTopic: 'proforma',
      type: 'cancel',
      title: 'Proforma Canceled',
      message: `${selectedProforma.displayRef || selectedProforma.id} was canceled.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/proforma-invoices`,
      actionPresets: ['view'],
      entityType: 'proformaInvoice',
      entityId: selectedProforma.id,
      entityLabel: selectedProforma.displayRef || selectedProforma.id,
      quickView: {
        title: selectedProforma.displayRef || selectedProforma.id,
        subtitle: 'Cancellation Reason',
        description: normalized,
      },
    });
    pushStatus('Proforma canceled.', 'success');
    await loadData(selectedProforma.id);
    setIsSaving(false);
  };

  const buildPdfData = (proforma) => ({
    txId: proforma.displayRef || proforma.id,
    date: proforma.createdAt || new Date().toISOString(),
    recipientName: proforma.clientSnapshot?.name || proforma.clientSnapshot?.tradeName || 'Client',
    amount: Number(proforma.totalAmount || 0),
    description: 'Proforma Invoice',
    items: (proforma.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.amount,
      total: item.lineTotal,
    })),
  });

  const handleDownloadPdf = async () => {
    if (!selectedProforma) return;
    const pdfRes = await generateTenantPdf({
      tenantId,
      documentType: 'nextInvoice',
      data: buildPdfData(selectedProforma),
      save: true,
      filename: `${selectedProforma.displayRef || selectedProforma.id}.pdf`,
    });
    pushStatus(
      pdfRes.ok
        ? `PDF generated for ${selectedProforma.displayRef || selectedProforma.id}.`
        : (pdfRes.error || 'Failed to generate PDF.'),
      pdfRes.ok ? 'success' : 'error',
    );
  };

  const handleEmail = async () => {
    if (!selectedProforma) return;
    const email = String(selectedProforma.clientSnapshot?.email || '').trim().toLowerCase();
    if (!email) {
      pushStatus('No recipient email available for this proforma.', 'error');
      return;
    }
    const pdfRes = await generateTenantPdf({
      tenantId,
      documentType: 'nextInvoice',
      data: buildPdfData(selectedProforma),
      save: false,
      returnBase64: true,
      filename: `${selectedProforma.displayRef || selectedProforma.id}.pdf`,
    });
    if (!pdfRes.ok) {
      pushStatus(pdfRes.error || 'Failed to generate PDF for email.', 'error');
      return;
    }

    const emailRes = await sendTenantDocumentEmail(
      tenantId,
      email,
      'nextInvoice',
      pdfRes.base64,
      buildPdfData(selectedProforma),
    );
    if (!emailRes.ok) {
      pushStatus(emailRes.error || 'Failed to send proforma email.', 'error');
      return;
    }
    await upsertTenantProformaInvoice(tenantId, selectedProforma.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      updatedBy: user?.uid || '',
    });
    await sendUniversalNotification({
      tenantId,
      topic: 'documents',
      subTopic: 'proforma',
      type: 'send',
      title: 'Proforma Emailed',
      message: `${selectedProforma.displayRef || selectedProforma.id} emailed to ${email}.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/proforma-invoices`,
      actionPresets: ['view'],
      entityType: 'proformaInvoice',
      entityId: selectedProforma.id,
      entityLabel: selectedProforma.displayRef || selectedProforma.id,
    });
    pushStatus(`Proforma emailed to ${email}.`, 'success');
    await loadData(selectedProforma.id);
  };

  const handleConvertQuotation = async () => {
    if (!selectedQuotationId) return;
    setIsSaving(true);
    const res = await convertQuotationToProforma(tenantId, selectedQuotationId, {
      createdBy: user?.uid || '',
    });
    if (!res.ok) {
      pushStatus(res.error || 'Failed to convert quotation.', 'error');
      setIsSaving(false);
      return;
    }
    await sendUniversalNotification({
      tenantId,
      topic: 'documents',
      subTopic: 'proforma',
      type: 'create',
      title: 'Proforma Created',
      message: `${res.proformaDisplayRef || 'Proforma'} generated from quotation.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/proforma-invoices`,
      actionPresets: ['view'],
      entityType: 'proformaInvoice',
      entityId: res.proformaId || '',
      entityLabel: res.proformaDisplayRef || '',
    });
    pushStatus(
      res.alreadyConverted
        ? `Quotation already converted as ${res.proformaDisplayRef || 'proforma'}.`
        : `Converted successfully as ${res.proformaDisplayRef}.`,
      'success',
    );
    await loadData(res.proformaId || '');
    setSelectedQuotationId('');
    setIsSaving(false);
  };

  const handleOpenReceivePayment = () => {
    if (!selectedProforma) return;
    const params = new URLSearchParams();
    if (selectedProforma.clientId) params.set('clientId', selectedProforma.clientId);
    params.set('proformaId', selectedProforma.id);
    navigate(`/t/${tenantId}/receive-payments?${params.toString()}`);
  };

  return (
    <PageShell
      title="Proforma Invoices"
      subtitle="Manage proforma lifecycle, edit service lines, and trigger payment flow."
      icon={Plus}
    >
      <div className="space-y-4">
        {status ? (
          <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${statusType === 'error' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>
            {status}
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Create From Quotation</p>
          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
            <select
              value={selectedQuotationId}
              onChange={(event) => setSelectedQuotationId(event.target.value)}
              className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm font-bold text-[var(--c-text)]"
            >
              <option value="">Select quotation to convert...</option>
              {convertibleQuotations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayRef} • {item.clientSnapshot?.name || item.clientSnapshot?.tradeName || 'Client'}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleConvertQuotation()}
              disabled={!selectedQuotationId || isSaving}
              className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-black text-white disabled:opacity-50"
            >
              Convert
            </button>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Proforma List</p>
            {isLoading ? (
              <p className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3 text-sm text-[var(--c-muted)]">Loading...</p>
            ) : rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-3 text-sm text-[var(--c-muted)]">No proforma invoices found.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      hydrateEditorFromRow(item);
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left ${selectedProforma?.id === item.id ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/10' : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}
                  >
                    <p className="text-sm font-black text-[var(--c-text)]">{item.displayRef || item.id}</p>
                    <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{item.status || 'drafted'}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--c-text)]">
                      <CurrencyValue value={item.totalAmount || 0} iconSize="h-3 w-3" />
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            {!selectedProforma ? (
              <p className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-6 text-sm text-[var(--c-muted)]">Select a proforma invoice.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-black text-[var(--c-text)]">{selectedProforma.displayRef || selectedProforma.id}</p>
                    <p className="text-sm font-bold text-[var(--c-muted)]">{selectedProforma.clientSnapshot?.name || selectedProforma.clientSnapshot?.tradeName || 'Client'}</p>
                  </div>
                  <p className="rounded-full border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-1 text-xs font-black uppercase tracking-wider text-[var(--c-text)]">
                    {selectedProforma.status || 'drafted'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Total</p>
                    <p className="mt-1 text-sm font-black text-[var(--c-text)]"><CurrencyValue value={totals.totalAmount} iconSize="h-3 w-3" /></p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Paid</p>
                    <p className="mt-1 text-sm font-black text-emerald-600"><CurrencyValue value={totals.amountPaid} iconSize="h-3 w-3" /></p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Balance Due</p>
                    <p className="mt-1 text-sm font-black text-rose-600"><CurrencyValue value={totals.balanceDue} iconSize="h-3 w-3" /></p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Add Application</p>
                  <div className="mt-2">
                    <ServiceSearchField
                      onSelect={handleAddItem}
                      selectedId={null}
                      placeholder="Search applications..."
                      onCreateNew={null}
                      refreshKey={serviceRefreshKey}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {editItems.map((item) => (
                    <div key={item.rowId} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                      <div className="grid gap-2 md:grid-cols-[1.5fr_110px_140px_auto] md:items-end">
                        <div>
                          <p className="text-sm font-black text-[var(--c-text)]">{item.name || item.applicationId || 'Application'}</p>
                          <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{item.applicationId || '-'}</p>
                        </div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                          Qty
                          <input
                            type="number"
                            min={1}
                            className={inputClass}
                            value={item.qty}
                            onChange={(event) => handleItemChange(item.rowId, 'qty', event.target.value)}
                          />
                        </label>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">
                          Amount
                          <input
                            type="number"
                            min={0}
                            className={inputClass}
                            value={item.amount}
                            onChange={(event) => handleItemChange(item.rowId, 'amount', event.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.rowId)}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-bold">
                        <span className="text-[var(--c-muted)]">Line Total</span>
                        <span className="text-[var(--c-text)]"><CurrencyValue value={(Number(item.qty) || 0) * (Number(item.amount) || 0)} iconSize="h-3 w-3" /></span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedProforma.cancellationReason ? (
                  <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    Cancellation reason: {selectedProforma.cancellationReason}
                  </p>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <button type="button" onClick={() => void handleSave()} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-black text-[var(--c-text)] disabled:opacity-50"><Save className="h-4 w-4" />Save</button>
                  <button type="button" onClick={() => void handleMarkSent()} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-black text-[var(--c-text)] disabled:opacity-50"><SendHorizontal className="h-4 w-4" />Mark Sent</button>
                  <button type="button" onClick={() => void handleEmail()} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-black text-[var(--c-text)] disabled:opacity-50"><Mail className="h-4 w-4" />Email</button>
                  <button type="button" onClick={() => void handleDownloadPdf()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-black text-[var(--c-text)]"><Download className="h-4 w-4" />Download</button>
                  <button type="button" onClick={() => handleOpenReceivePayment()} className="rounded-xl bg-[var(--c-accent)] px-3 py-2 text-xs font-black text-white">Receive Payment</button>
                  <button type="button" onClick={() => void handleCancel()} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50"><Ban className="h-4 w-4" />Cancel</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default ProformaInvoicesPage;
