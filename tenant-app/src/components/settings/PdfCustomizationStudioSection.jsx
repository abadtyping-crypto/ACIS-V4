import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useTenant } from '../../context/TenantContext';
import {
  fetchTenantPdfTemplates,
  getTenantSettingDoc,
  upsertTenantPdfTemplate,
} from '../../lib/backendStore';
import {
  PDF_DEFAULT_TEMPLATE,
  PDF_DOCUMENT_TYPES,
  normalizePdfTemplatePayload,
} from '../../lib/pdfTemplateRenderer';
import { uploadPdfTemplateAsset, validatePdfTemplateAsset } from '../../lib/pdfTemplateStorage';
import { createSyncEvent } from '../../lib/syncEvents';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import SettingCard from './SettingCard';

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]';
const labelClass = 'text-sm text-[var(--c-muted)]';

const premiumDefaults = {
  pdfPremiumFeaturesEnabled: true,
  pdfPremiumQrEnabled: true,
  pdfPremiumGradientEnabled: true,
  pdfPremiumCoverPageEnabled: true,
};

const createRecord = (documentType, label) => ({
  documentType,
  isTemplateEnabled: true,
  activeTemplateId: 'default',
  templateVersion: 1,
  templates: [
    normalizePdfTemplatePayload({
      ...PDF_DEFAULT_TEMPLATE,
      name: `${label} Default`,
      titleText: label,
    }),
  ],
  lastUpdatedBy: '',
  lastUpdatedAt: '',
});

const normalizeRecord = (documentType, label, raw) => {
  const fallback = createRecord(documentType, label);
  if (!raw || typeof raw !== 'object') return fallback;
  const templates = Array.isArray(raw.templates)
    ? raw.templates.map(normalizePdfTemplatePayload)
    : fallback.templates;
  const activeId = String(raw.activeTemplateId || templates[0]?.templateId || 'default');
  return {
    documentType,
    isTemplateEnabled: raw.isTemplateEnabled !== false,
    activeTemplateId: templates.some((item) => item.templateId === activeId) ? activeId : templates[0].templateId,
    templateVersion: Number(raw.templateVersion) || 1,
    templates,
    lastUpdatedBy: String(raw.lastUpdatedBy || ''),
    lastUpdatedAt: String(raw.lastUpdatedAt || ''),
  };
};

const normalizeNumber = (value, fallback, max = 240) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
};

const newTemplateId = () => `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const validateTemplate = (template, premium) => {
  const errors = {};
  if (!template.name.trim()) errors.name = 'Template name is required.';
  if (template.qrEnabled && !template.headerText.trim()) {
    errors.headerText = 'Header text is required when QR is enabled.';
  }
  if (template.backgroundType === 'image' && !template.backgroundImageUrl.trim()) {
    errors.backgroundImageUrl = 'Background image is required for image mode.';
  }
  if (!premium.pdfPremiumFeaturesEnabled && (template.qrEnabled || template.backgroundType !== 'solid')) {
    errors.premium = 'Premium features are disabled from Preferences.';
  }
  return errors;
};

const PdfCustomizationStudioSection = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [activeType, setActiveType] = useState(PDF_DOCUMENT_TYPES[0].key);
  const [records, setRecords] = useState({});
  const [selectedIds, setSelectedIds] = useState({});
  const [premium, setPremium] = useState(premiumDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [previewTime, setPreviewTime] = useState('');

  const canView = Boolean(user) && canUserPerformAction(tenantId, user, 'pdfStudioView');
  const canEdit = Boolean(user) && canUserPerformAction(tenantId, user, 'pdfStudioEdit');

  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [templatesRes, prefRes] = await Promise.all([
        fetchTenantPdfTemplates(tenantId),
        getTenantSettingDoc(tenantId, 'preferenceSettings'),
      ]);
      if (!mounted) return;
      const nextRecords = {};
      const nextSelected = {};
      PDF_DOCUMENT_TYPES.forEach((item) => {
        const normalized = normalizeRecord(item.key, item.label, templatesRes.byType?.[item.key]);
        nextRecords[item.key] = normalized;
        nextSelected[item.key] = normalized.activeTemplateId;
      });
      setRecords(nextRecords);
      setSelectedIds(nextSelected);
      setPremium({
        ...premiumDefaults,
        ...(prefRes.ok && prefRes.data ? prefRes.data : {}),
      });
      setLoading(false);
      setErrors({});
      setStatus('');
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  const activeRecord = records[activeType];
  const selectedId = selectedIds[activeType] || activeRecord?.activeTemplateId || 'default';
  const activeTemplate = useMemo(() => {
    if (!activeRecord) return normalizePdfTemplatePayload(PDF_DEFAULT_TEMPLATE);
    return activeRecord.templates.find((item) => item.templateId === selectedId) || activeRecord.templates[0];
  }, [activeRecord, selectedId]);
  const previewHeaderBg =
    activeTemplate.templateId === 'default' && activeTemplate.headerBackground === '#0f172a'
      ? 'var(--c-accent)'
      : activeTemplate.headerBackground;

  const setRecord = (documentType, next) => {
    setRecords((prev) => ({ ...prev, [documentType]: next }));
  };

  const setSelectedId = (documentType, templateId) => {
    setSelectedIds((prev) => ({ ...prev, [documentType]: templateId }));
  };

  const updateTemplate = (patch) => {
    if (!activeRecord) return;
    const nextTemplates = activeRecord.templates.map((item) =>
      item.templateId === activeTemplate.templateId ? { ...item, ...patch } : item,
    );
    setRecord(activeType, { ...activeRecord, templates: nextTemplates });
  };

  const persistRecord = async (documentType, nextRecord, changedFields, successMsg) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      ...nextRecord,
      templateVersion: (Number(nextRecord.templateVersion) || 0) + 1,
      lastUpdatedBy: user.uid,
      lastUpdatedAt: new Date().toISOString(),
    };
    const write = await upsertTenantPdfTemplate(tenantId, documentType, payload);
    if (!write.ok) {
      setStatus(`Save failed: ${write.error}`);
      setSaving(false);
      return;
    }
    setRecord(documentType, payload);
    const sync = await createSyncEvent({
      tenantId,
      eventType: 'update',
      entityType: 'pdfTemplate',
      entityId: documentType,
      changedFields,
      createdBy: user.uid,
    });
    setStatus(sync.backendSynced ? successMsg : `${successMsg} Backend sync pending.`);
    setSaving(false);
  };

  const saveCurrentTemplate = async () => {
    if (!canEdit) {
      setStatus('Save blocked. Ask admin for PDF Studio Edit permission in User Control Center.');
      return;
    }
    const nextErrors = validateTemplate(activeTemplate, premium);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !activeRecord) return;
    const nextRecord = {
      ...activeRecord,
      activeTemplateId: activeTemplate.templateId,
      templates: activeRecord.templates.map(normalizePdfTemplatePayload),
    };
    await persistRecord(
      activeType,
      nextRecord,
      ['templates', 'activeTemplateId', 'isTemplateEnabled', 'templateVersion'],
      'Template saved.',
    );
  };

  const createTemplate = async (mode) => {
    if (!canEdit || !activeRecord) {
      setStatus('Create blocked. Ask admin for PDF Studio Edit permission.');
      return;
    }
    const label = PDF_DOCUMENT_TYPES.find((item) => item.key === activeType)?.label || 'Document';
    const source = mode === 'duplicate' ? activeTemplate : { ...PDF_DEFAULT_TEMPLATE, titleText: label };
    const nextTemplate = normalizePdfTemplatePayload({
      ...source,
      templateId: newTemplateId(),
      name: mode === 'duplicate' ? `${activeTemplate.name} Copy` : `${label} Custom`,
    });
    const nextRecord = {
      ...activeRecord,
      activeTemplateId: nextTemplate.templateId,
      templates: [...activeRecord.templates, nextTemplate],
    };
    setRecord(activeType, nextRecord);
    setSelectedId(activeType, nextTemplate.templateId);
    await persistRecord(activeType, nextRecord, ['templates', 'activeTemplateId', 'templateVersion'], 'Template created.');
  };

  const deleteTemplate = async () => {
    if (!canEdit || !activeRecord) {
      setStatus('Delete blocked. Ask admin for PDF Studio Edit permission.');
      return;
    }
    if (activeTemplate.templateId === 'default') {
      setStatus('Default template cannot be deleted.');
      return;
    }
    if (!window.confirm(`Delete "${activeTemplate.name}"?`)) return;
    const nextTemplates = activeRecord.templates.filter((item) => item.templateId !== activeTemplate.templateId);
    const nextActiveId = nextTemplates[0]?.templateId || 'default';
    const nextRecord = {
      ...activeRecord,
      templates: nextTemplates,
      activeTemplateId: nextActiveId,
    };
    setRecord(activeType, nextRecord);
    setSelectedId(activeType, nextActiveId);
    await persistRecord(activeType, nextRecord, ['templates', 'activeTemplateId', 'templateVersion'], 'Template deleted.');
  };

  const toggleTypeEnabled = async () => {
    if (!canEdit || !activeRecord) {
      setStatus('Action blocked. Ask admin for PDF Studio Edit permission.');
      return;
    }
    const nextRecord = { ...activeRecord, isTemplateEnabled: !activeRecord.isTemplateEnabled };
    setRecord(activeType, nextRecord);
    await persistRecord(activeType, nextRecord, ['isTemplateEnabled', 'templateVersion'], 'Template status updated.');
  };

  const uploadAsset = async (assetType, field, fileBlob) => {
    if (!canEdit || !activeRecord || !fileBlob) return;
    const validationError = validatePdfTemplateAsset(fileBlob);
    if (validationError) {
      setErrors((prev) => ({ ...prev, [field]: validationError }));
      return;
    }
    setUploading(true);
    const result = await uploadPdfTemplateAsset({
      tenantId,
      documentType: activeType,
      templateId: activeTemplate.templateId,
      assetType,
      oldUrl: activeTemplate[field],
      fileBlob,
    });
    setUploading(false);
    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [field]: result.error || 'Upload failed.' }));
      return;
    }
    updateTemplate({ [field]: result.url });
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setStatus(`${assetType} uploaded. Save template to commit.`);
  };

  if (loading) return <p className="text-xs text-[var(--c-muted)]">Loading PDF customization studio...</p>;

  if (!canView) {
    return (
      <SettingCard
        title="PDF Customization Studio"
        description="Centralized PDF branding and layout control."
      >
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Access blocked. Ask admin to enable PDF Studio View permission in User Control Center.
        </p>
      </SettingCard>
    );
  }

  return (
    <SettingCard
      title="PDF Customization Studio"
      description="Templates for payment receipts, invoices, quotations, performer invoices, and statements."
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {PDF_DOCUMENT_TYPES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setActiveType(item.key);
              setErrors({});
              setStatus('');
            }}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${activeType === item.key ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)] hover:text-[var(--c-text)]'}`}
          >
            {item.label}
          </button>
        ))}
        <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">
          <span>Status</span>
          <button
            type="button"
            onClick={() => void toggleTypeEnabled()}
            disabled={!canEdit || saving}
            className={`rounded-full px-2 py-1 text-[10px] font-bold ${activeRecord.isTemplateEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'}`}
          >
            {activeRecord.isTemplateEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <div className="grid gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
        <label className={labelClass}>
          Template
          <select
            value={selectedId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSelectedId(activeType, nextId);
              setRecord(activeType, { ...activeRecord, activeTemplateId: nextId });
            }}
            className={inputClass}
            disabled={!canEdit}
          >
            {activeRecord.templates.map((item) => (
              <option key={item.templateId} value={item.templateId}>{item.name}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => void createTemplate('new')} disabled={!canEdit || saving} className="self-end rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-semibold disabled:opacity-50">New</button>
        <button type="button" onClick={() => void createTemplate('duplicate')} disabled={!canEdit || saving} className="self-end rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-semibold disabled:opacity-50">Duplicate</button>
        <button type="button" onClick={() => void deleteTemplate()} disabled={!canEdit || saving || activeTemplate.templateId === 'default'} className="self-end rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50">Delete</button>
        <button type="button" onClick={() => void toggleTypeEnabled()} disabled={!canEdit || saving} className={`self-end rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${activeRecord.isTemplateEnabled ? 'bg-emerald-600' : 'bg-slate-500'}`}>{activeRecord.isTemplateEnabled ? 'Enabled' : 'Disabled'}</button>
        <button type="button" onClick={() => void saveCurrentTemplate()} disabled={!canEdit || saving} className="self-end rounded-xl bg-[var(--c-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>

      {!canEdit ? <p className="mt-2 text-xs text-amber-700">View only. Ask admin for PDF Studio Edit permission.</p> : null}
      {errors.premium ? <p className="mt-2 text-xs text-rose-700">{errors.premium}</p> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <label className={labelClass}>Template Name
            <input className={inputClass} value={activeTemplate.name} onChange={(event) => updateTemplate({ name: event.target.value })} disabled={!canEdit} />
            {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
          </label>
          <label className={labelClass}>Header Text
            <textarea className={inputClass} rows={3} value={activeTemplate.headerText} onChange={(event) => updateTemplate({ headerText: event.target.value })} disabled={!canEdit} />
            {errors.headerText ? <p className="mt-1 text-xs text-rose-600">{errors.headerText}</p> : null}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Title
              <input className={inputClass} value={activeTemplate.titleText} onChange={(event) => updateTemplate({ titleText: event.target.value })} disabled={!canEdit} />
            </label>
            <label className={labelClass}>Header Color
              <input type="color" className={`${inputClass} h-10 p-1`} value={activeTemplate.headerBackground} onChange={(event) => updateTemplate({ headerBackground: event.target.value })} disabled={!canEdit} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Footer Text
              <input className={inputClass} value={activeTemplate.footerText} onChange={(event) => updateTemplate({ footerText: event.target.value })} disabled={!canEdit} />
            </label>
            <label className={labelClass}>Footer Link
              <input className={inputClass} value={activeTemplate.footerLink} onChange={(event) => updateTemplate({ footerLink: event.target.value })} disabled={!canEdit} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Logo Position
              <select className={inputClass} value={activeTemplate.logoPosition} onChange={(event) => updateTemplate({ logoPosition: event.target.value })} disabled={!canEdit}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </label>
            <label className={labelClass}>Logo Upload
              <input type="file" accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp" className={inputClass} disabled={!canEdit || uploading} onChange={(event) => { const fileBlob = event.target.files?.[0]; if (!fileBlob) return; void uploadAsset('logo', 'logoUrl', fileBlob); event.target.value = ''; }} />
              {errors.logoUrl ? <p className="mt-1 text-xs text-rose-600">{errors.logoUrl}</p> : null}
            </label>
          </div>
          {activeTemplate.logoUrl ? <img src={activeTemplate.logoUrl} alt="Logo preview" className="max-h-20 rounded border border-[var(--c-border)] bg-[var(--c-surface)] p-2 object-contain" /> : null}
          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--c-text)]">QR Block</p>
              <input type="checkbox" checked={activeTemplate.qrEnabled} disabled={!canEdit || !premium.pdfPremiumFeaturesEnabled || !premium.pdfPremiumQrEnabled} onChange={(event) => updateTemplate({ qrEnabled: event.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>Source
                <select className={inputClass} value={activeTemplate.qrSource} disabled={!canEdit || !activeTemplate.qrEnabled} onChange={(event) => updateTemplate({ qrSource: event.target.value })}>
                  <option value="paymentLink">Payment Link</option><option value="invoiceUrl">Invoice URL</option>
                </select>
              </label>
              <label className={labelClass}>Size
                <input type="number" min={80} max={240} className={inputClass} value={activeTemplate.qrSize} disabled={!canEdit || !activeTemplate.qrEnabled} onChange={(event) => updateTemplate({ qrSize: normalizeNumber(event.target.value, 120) })} />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Paper Size
              <select className={inputClass} value={activeTemplate.paperSize} onChange={(event) => updateTemplate({ paperSize: event.target.value })} disabled={!canEdit}>
                <option value="A4">A4</option><option value="Letter">Letter</option>
              </select>
            </label>
            <label className={labelClass}>Orientation
              <select className={inputClass} value={activeTemplate.orientation} onChange={(event) => updateTemplate({ orientation: event.target.value })} disabled={!canEdit}>
                <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>Body Layout
              <select className={inputClass} value={activeTemplate.bodyLayout} onChange={(event) => updateTemplate({ bodyLayout: event.target.value })} disabled={!canEdit}>
                <option value="standard">Standard</option><option value="compact">Compact</option>
              </select>
            </label>
            <label className={labelClass}>Row Padding
              <input type="number" min={4} max={48} className={inputClass} value={activeTemplate.rowPadding} onChange={(event) => updateTemplate({ rowPadding: normalizeNumber(event.target.value, 8, 48) })} disabled={!canEdit} />
            </label>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
            <p className="mb-2 text-sm font-semibold text-[var(--c-text)]">Margins</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>Top<input type="number" min={0} max={120} className={inputClass} value={activeTemplate.margins.top} onChange={(event) => updateTemplate({ margins: { ...activeTemplate.margins, top: normalizeNumber(event.target.value, activeTemplate.margins.top, 120) } })} disabled={!canEdit} /></label>
              <label className={labelClass}>Right<input type="number" min={0} max={120} className={inputClass} value={activeTemplate.margins.right} onChange={(event) => updateTemplate({ margins: { ...activeTemplate.margins, right: normalizeNumber(event.target.value, activeTemplate.margins.right, 120) } })} disabled={!canEdit} /></label>
              <label className={labelClass}>Bottom<input type="number" min={0} max={120} className={inputClass} value={activeTemplate.margins.bottom} onChange={(event) => updateTemplate({ margins: { ...activeTemplate.margins, bottom: normalizeNumber(event.target.value, activeTemplate.margins.bottom, 120) } })} disabled={!canEdit} /></label>
              <label className={labelClass}>Left<input type="number" min={0} max={120} className={inputClass} value={activeTemplate.margins.left} onChange={(event) => updateTemplate({ margins: { ...activeTemplate.margins, left: normalizeNumber(event.target.value, activeTemplate.margins.left, 120) } })} disabled={!canEdit} /></label>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
            <p className="mb-2 text-sm font-semibold text-[var(--c-text)]">Branding Overrides</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>Accent
                <input type="color" className={`${inputClass} h-10 p-1`} value={activeTemplate.accentColor} onChange={(event) => updateTemplate({ accentColor: event.target.value })} disabled={!canEdit} />
              </label>
              <label className={labelClass}>Background Mode
                <select className={inputClass} value={activeTemplate.backgroundType} onChange={(event) => updateTemplate({ backgroundType: event.target.value })} disabled={!canEdit || !premium.pdfPremiumFeaturesEnabled}>
                  <option value="solid">Solid</option><option value="gradient" disabled={!premium.pdfPremiumGradientEnabled}>Gradient</option><option value="image" disabled={!premium.pdfPremiumGradientEnabled}>Image</option>
                </select>
              </label>
            </div>
            {activeTemplate.backgroundType === 'solid' ? (
              <label className={`${labelClass} mt-3 block`}>Background Color
                <input type="color" className={`${inputClass} h-10 p-1`} value={activeTemplate.backgroundColor} onChange={(event) => updateTemplate({ backgroundColor: event.target.value })} disabled={!canEdit} />
              </label>
            ) : null}
            {activeTemplate.backgroundType === 'gradient' ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>Gradient Start<input type="color" className={`${inputClass} h-10 p-1`} value={activeTemplate.gradientStart} onChange={(event) => updateTemplate({ gradientStart: event.target.value })} disabled={!canEdit || !premium.pdfPremiumGradientEnabled} /></label>
                <label className={labelClass}>Gradient End<input type="color" className={`${inputClass} h-10 p-1`} value={activeTemplate.gradientEnd} onChange={(event) => updateTemplate({ gradientEnd: event.target.value })} disabled={!canEdit || !premium.pdfPremiumGradientEnabled} /></label>
              </div>
            ) : null}
            {activeTemplate.backgroundType === 'image' ? (
              <div className="mt-3">
                <label className={labelClass}>Background Image Upload
                  <input type="file" accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp" className={inputClass} disabled={!canEdit || uploading || !premium.pdfPremiumGradientEnabled} onChange={(event) => { const fileBlob = event.target.files?.[0]; if (!fileBlob) return; void uploadAsset('background', 'backgroundImageUrl', fileBlob); event.target.value = ''; }} />
                  {errors.backgroundImageUrl ? <p className="mt-1 text-xs text-rose-600">{errors.backgroundImageUrl}</p> : null}
                </label>
                {activeTemplate.backgroundImageUrl ? <img src={activeTemplate.backgroundImageUrl} alt="Background preview" className="mt-2 max-h-28 rounded border border-[var(--c-border)] object-cover" /> : null}
              </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2">
              <span className="text-sm text-[var(--c-text)]">Cover Page for Statements</span>
              <input type="checkbox" checked={activeTemplate.coverPageEnabled} disabled={!canEdit || !premium.pdfPremiumFeaturesEnabled || !premium.pdfPremiumCoverPageEnabled} onChange={(event) => updateTemplate({ coverPageEnabled: event.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
            </div>
          </div>
          <label className={labelClass}>Notes
            <textarea rows={3} className={inputClass} value={activeTemplate.notes} onChange={(event) => updateTemplate({ notes: event.target.value })} disabled={!canEdit} />
          </label>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-sm font-semibold text-[var(--c-text)]">Preview Canvas</p>
          <button type="button" onClick={() => setPreviewTime(new Date().toLocaleTimeString())} className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold">Render Preview</button>
        </div>
        <div className="overflow-hidden rounded-xl bg-[var(--c-surface)] p-4 text-[var(--c-text)]">
          <div className={`mb-3 flex ${activeTemplate.logoPosition === 'center' ? 'justify-center' : activeTemplate.logoPosition === 'right' ? 'justify-end' : 'justify-start'} border-b border-[var(--c-border)] pb-3`}>
            {activeTemplate.logoUrl ? <img src={activeTemplate.logoUrl} alt="Logo preview" className="h-10 max-w-[120px] object-contain" /> : <div className="rounded border border-dashed border-[var(--c-border)] px-3 py-2 text-xs text-[var(--c-muted)]">Logo</div>}
          </div>
          <div className="rounded-lg px-3 py-2 text-white" style={{ backgroundColor: previewHeaderBg }}>
            <p className="text-sm font-semibold">{activeTemplate.titleText || 'Document Title'}</p>
            <p className="text-xs opacity-90">{activeTemplate.headerText || 'Header section preview text'}</p>
          </div>
          <div className="mt-3 space-y-1">
            {['Service Fee', 'Processing', 'VAT 5%'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-[var(--c-border)] px-2 text-xs text-[var(--c-text)]" style={{ paddingTop: activeTemplate.rowPadding, paddingBottom: activeTemplate.rowPadding }}>
                <span>{item}</span><span>AED {(120 + index * 40).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="rounded-md bg-[var(--c-panel)] px-3 py-2 text-xs text-[var(--c-text)]">Total: AED 300.00</div>
            {activeTemplate.qrEnabled ? <div className="grid place-items-center rounded border border-[var(--c-border)] bg-[var(--c-surface)] text-xs text-[var(--c-text)]" style={{ width: Math.max(80, activeTemplate.qrSize / 2), height: Math.max(80, activeTemplate.qrSize / 2) }}>QR</div> : null}
          </div>
          <div className={`mt-3 text-xs text-[var(--c-muted)] ${activeTemplate.footerAlignment === 'center' ? 'text-center' : activeTemplate.footerAlignment === 'right' ? 'text-right' : 'text-left'}`}>
            <p>{activeTemplate.footerText || 'Footer text preview'}</p>
            {activeTemplate.footerLink ? <p className="text-[var(--c-accent)]">{activeTemplate.footerLink}</p> : null}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-[var(--c-muted)]">
          {previewTime ? `Preview rendered at ${previewTime}` : 'Preview updates live as key fields change.'}
        </p>
      </div>

      {status ? <p className="mt-3 text-sm text-[var(--c-muted)]">{status}</p> : null}
    </SettingCard>
  );
};

export default PdfCustomizationStudioSection;

