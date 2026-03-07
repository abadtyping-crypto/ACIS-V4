import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import SettingCard from './SettingCard';
import { getTenantSettingDoc, upsertTenantSettingDoc } from '../../lib/backendStore';
import { createSyncEvent } from '../../lib/syncEvents';
import { useTenant } from '../../context/TenantContext';
import { uploadBrandLogoAsset, validateBrandLogoAsset } from '../../lib/brandLogoStorage';
import ImageStudio from '../common/ImageStudio';
import { getCroppedImg } from '../../lib/imageStudioUtils';

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]';

const labelClass = 'text-sm text-[var(--c-muted)]';

const emirates = [
  'ABU_DHABI',
  'DUBAI',
  'SHARJAH',
  'AJMAN',
  'UMM_AL_QUWAIN',
  'RAS_AL_KHAIMAH',
  'FUJAIRAH',
];

const LOGO_FUNCTIONS = [
  { key: 'paymentReceipt', label: 'Payment Receipt' },
  { key: 'nextInvoice', label: 'Next Invoice' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'performerInvoice', label: 'Performer Invoice' },
  { key: 'statement', label: 'Statements' },
];

const MAX_LOGO_SLOTS = 5;

const defaultLogoLibrary = Array.from({ length: MAX_LOGO_SLOTS }, (_, index) => ({
  slotId: `logo_${index + 1}`,
  name: `Logo Slot ${index + 1}`,
  url: '',
}));

const defaultLogoUsage = LOGO_FUNCTIONS.reduce((acc, item) => {
  acc[item.key] = 'logo_1';
  return acc;
}, {});

const toDigits = (value) => String(value || '').replace(/\D/g, '');

const toUpper = (value) => String(value || '').toUpperCase().trim();

const toLower = (value) => String(value || '').toLowerCase().trim();

const toProperCase = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeTrnDigits = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/TRN\s*:?/g, '')
    .replace(/\D/g, '')
    .slice(0, 15);

const normalizePhone = (value) => toDigits(value).slice(0, 9);
const normalizePoBox = (value) => toDigits(value).slice(0, 8);
const logoFilterMap = {
  natural: { label: 'Natural', css: 'none', canvas: 'none' },
  vibrant: { label: 'Vibrant', css: 'saturate(1.18) contrast(1.1)', canvas: 'saturate(118%) contrast(110%)' },
  soft: { label: 'Soft', css: 'brightness(1.05) saturate(0.9)', canvas: 'brightness(105%) saturate(90%)' },
  mono: { label: 'Mono', css: 'grayscale(1) contrast(1.08)', canvas: 'grayscale(100%) contrast(108%)' },
};
const LOGO_OUTPUT_SIZE = 512;
const LOGO_MAX_BYTES = 240 * 1024;

const normalizeHexColor = (value, fallback) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return fallback;
  if (raw.length === 7) return raw.toUpperCase();
  const chars = raw.slice(1).split('');
  return `#${chars.map((char) => `${char}${char}`).join('')}`.toUpperCase();
};

const validateNineDigitUae = (digits) => {
  if (!digits) return '';
  if (digits.startsWith('0')) return 'Leading 0 is not allowed.';
  if (digits.length > 9) return 'Maximum 9 digits allowed.';
  return '';
};

const BrandDetailsSection = () => {
  const { tenant, tenantId } = useTenant();
  const { user } = useAuth();
  const [form, setForm] = useState({
    companyName: toUpper(tenant?.name || ''),
    brandName: '',
    landline1: '',
    landline2: '',
    mobile1: '',
    mobile2: '',
    primaryAddress: '',
    secondaryAddress: '',
    emirate: '',
    poBoxNumber: '',
    poBoxEmirate: '',
    email1: '',
    webAddress: '',
    taxEnabled: true,
    taxPercentage: '5',
    taxRegistrationNumber: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIban: '',
    bankSwift: '',
    bankBranch: '',
    uiPrimaryColor: '#1778F2',
    uiSecondaryColor: '#45B6FF',
    uiTertiaryColor: '#6DE3D7',
    uiTextOnAccent: '#FFFFFF',
    uiGradientEnabled: true,
    locationPin: '',
  });

  const [errors, setErrors] = useState({});
  const [saveMessage, setSaveMessage] = useState('');
  const [logoLibrary, setLogoLibrary] = useState(defaultLogoLibrary);
  const [logoUsage, setLogoUsage] = useState(defaultLogoUsage);
  const [logoErrors, setLogoErrors] = useState({});
  const [logoUploading, setLogoUploading] = useState({});
  const [activeLogoEditorSlotId, setActiveLogoEditorSlotId] = useState('');
  const [logoRawUrl, setLogoRawUrl] = useState('');
  const [logoSourceUrl, setLogoSourceUrl] = useState('');
  const [logoZoom, setLogoZoom] = useState(1);
  const [logoRotation, setLogoRotation] = useState(0);
  const [logoFilter, setLogoFilter] = useState('natural');
  const [logoDirty, setLogoDirty] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
    setLogoDirty(true);
  }, []);

  const setRotationWrapper = (val) => {
    setLogoRotation(val);
    setLogoDirty(true);
  };

  useEffect(() => {
    let active = true;
    getTenantSettingDoc(tenantId, 'branding').then((result) => {
      if (!active || !result.ok || !result.data) return;
      const data = result.data;
      setForm((prev) => ({
        ...prev,
        companyName: toUpper(data.companyName || prev.companyName),
        brandName: toUpper(data.brandName || ''),
        landline1: normalizePhone(data.landline1 || ''),
        landline2: normalizePhone(data.landline2 || ''),
        mobile1: normalizePhone(data.mobile1 || ''),
        mobile2: normalizePhone(data.mobile2 || ''),
        primaryAddress: String(data.primaryAddress || ''),
        secondaryAddress: String(data.secondaryAddress || ''),
        emirate: String(data.emirate || ''),
        poBoxNumber: normalizePoBox(data.poBoxNumber || ''),
        poBoxEmirate: String(data.poBoxEmirate || ''),
        email1: toLower(data.email1 || ''),
        webAddress: toLower(data.webAddress || ''),
        taxEnabled: data.taxEnabled !== false,
        taxPercentage: String(data.taxPercentage || 5),
        taxRegistrationNumber: normalizeTrnDigits(data.taxRegistrationNumber || ''),
        bankName: String(data.bankName || ''),
        bankAccountName: String(data.bankAccountName || ''),
        bankAccountNumber: String(data.bankAccountNumber || ''),
        bankIban: String(data.bankIban || ''),
        bankSwift: String(data.bankSwift || ''),
        bankBranch: String(data.bankBranch || ''),
        uiPrimaryColor: normalizeHexColor(data.uiPrimaryColor, '#1778F2'),
        uiSecondaryColor: normalizeHexColor(data.uiSecondaryColor, '#45B6FF'),
        uiTertiaryColor: normalizeHexColor(data.uiTertiaryColor, '#6DE3D7'),
        uiTextOnAccent: normalizeHexColor(data.uiTextOnAccent, '#FFFFFF'),
        uiGradientEnabled: data.uiGradientEnabled !== false,
        locationPin: String(data.locationPin || ''),
      }));
      const incomingLibrary = Array.isArray(data.logoLibrary) ? data.logoLibrary : [];
      const normalizedLibrary = defaultLogoLibrary.map((slot) => {
        const match = incomingLibrary.find((item) => item.slotId === slot.slotId);
        return match
          ? {
            slotId: slot.slotId,
            name: String(match.name || slot.name),
            url: String(match.url || ''),
          }
          : slot;
      });
      setLogoLibrary(normalizedLibrary);
      const incomingUsage = data.logoUsage && typeof data.logoUsage === 'object' ? data.logoUsage : {};
      const allowedSlots = new Set(defaultLogoLibrary.map((slot) => slot.slotId));
      const sanitizedUsage = LOGO_FUNCTIONS.reduce((acc, item) => {
        const candidate = String(incomingUsage[item.key] || defaultLogoUsage[item.key] || 'logo_1');
        acc[item.key] = allowedSlots.has(candidate) ? candidate : 'logo_1';
        return acc;
      }, {});
      setLogoUsage(sanitizedUsage);
    });
    return () => {
      active = false;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!logoRawUrl || !logoRawUrl.startsWith('blob:')) return () => { };
    return () => {
      URL.revokeObjectURL(logoRawUrl);
    };
  }, [logoRawUrl]);

  const poBoxDisabled = !toDigits(form.poBoxNumber);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (key, value) => {
    updateField(key, toDigits(value).slice(0, 9));
  };

  const handlePoBoxChange = (value) => {
    const nextPoBox = toDigits(value).slice(0, 8);
    setForm((prev) => ({
      ...prev,
      poBoxNumber: nextPoBox,
      poBoxEmirate: nextPoBox ? prev.poBoxEmirate : '',
    }));
  };

  const updateLogoSlot = (slotId, patch) => {
    setLogoLibrary((prev) =>
      prev.map((slot) => (slot.slotId === slotId ? { ...slot, ...patch } : slot)),
    );
  };

  const openLogoEditor = (slotId) => {
    const slot = logoLibrary.find((item) => item.slotId === slotId);
    setActiveLogoEditorSlotId(slotId);
    setLogoRawUrl('');
    setLogoSourceUrl(slot?.url || '/logo.png');
    setLogoZoom(1);
    setLogoRotation(0);
    setLogoFilter('natural');
    setLogoDirty(false);
    setCroppedAreaPixels(null);
  };

  const closeLogoEditor = () => {
    setActiveLogoEditorSlotId('');
    setLogoRawUrl('');
    setLogoSourceUrl('');
    setLogoZoom(1);
    setLogoRotation(0);
    setLogoFilter('natural');
    setLogoDirty(false);
    setCroppedAreaPixels(null);
  };

  const onLogoEditorFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeLogoEditorSlotId) return;
    const validationError = validateBrandLogoAsset(file);
    if (validationError) {
      setLogoErrors((prev) => ({ ...prev, [activeLogoEditorSlotId]: validationError }));
      return;
    }

    try {
      const nextUrl = URL.createObjectURL(file);
      setLogoRawUrl(nextUrl);
      setLogoSourceUrl(nextUrl);
      setLogoZoom(1);
      setLogoRotation(0);
      setLogoFilter('natural');
      setLogoDirty(true);
      setLogoErrors((prev) => ({ ...prev, [activeLogoEditorSlotId]: '' }));
    } catch {
      setLogoErrors((prev) => ({ ...prev, [activeLogoEditorSlotId]: 'Unable to read image file.' }));
    }
  };

  const onLogoEditorReset = () => {
    if (!activeLogoEditorSlotId) return;
    const slot = logoLibrary.find((item) => item.slotId === activeLogoEditorSlotId);
    setLogoRawUrl('');
    setLogoSourceUrl(slot?.url || '/logo.png');
    setLogoZoom(1);
    setLogoRotation(0);
    setLogoFilter('natural');
    setLogoDirty(false);
    setCroppedAreaPixels(null);
    setLogoErrors((prev) => ({ ...prev, [activeLogoEditorSlotId]: '' }));
  };

  const handleLogoUpload = async (slotId, fileBlob) => {
    if (!fileBlob) return;
    const validationError = validateBrandLogoAsset(fileBlob);
    if (validationError) {
      setLogoErrors((prev) => ({ ...prev, [slotId]: validationError }));
      return;
    }
    setLogoUploading((prev) => ({ ...prev, [slotId]: true }));
    const slot = logoLibrary.find((item) => item.slotId === slotId);
    const result = await uploadBrandLogoAsset({
      tenantId,
      slotId,
      oldUrl: slot?.url,
      fileBlob,
    });
    setLogoUploading((prev) => ({ ...prev, [slotId]: false }));
    if (!result.ok) {
      setLogoErrors((prev) => ({ ...prev, [slotId]: result.error || 'Upload failed.' }));
      return;
    }
    updateLogoSlot(slotId, { url: result.url });
    setLogoErrors((prev) => ({ ...prev, [slotId]: '' }));
  };

  const applyLogoEditor = async () => {
    if (!activeLogoEditorSlotId) return;
    if (!logoDirty || !logoRawUrl || !croppedAreaPixels) {
      setLogoErrors((prev) => ({ ...prev, [activeLogoEditorSlotId]: 'Adjust crop or choose file before upload.' }));
      return;
    }

    try {
      const processedBlob = await getCroppedImg(
        logoRawUrl,
        croppedAreaPixels,
        logoRotation,
        logoFilterMap[logoFilter]?.canvas || 'none'
      );
      await handleLogoUpload(activeLogoEditorSlotId, processedBlob);
      closeLogoEditor();
    } catch (error) {
      setLogoErrors((prev) => ({ ...prev, [activeLogoEditorSlotId]: error?.message || 'Logo processing failed.' }));
    }
  };

  const onSave = async () => {
    const payload = {
      companyName: toUpper(form.companyName),
      brandName: toUpper(form.brandName),
      landline1: normalizePhone(form.landline1),
      landline2: normalizePhone(form.landline2),
      mobile1: normalizePhone(form.mobile1),
      mobile2: normalizePhone(form.mobile2),
      primaryAddress: toProperCase(form.primaryAddress),
      secondaryAddress: toProperCase(form.secondaryAddress),
      emirate: form.emirate || '',
      poBoxNumber: normalizePoBox(form.poBoxNumber),
      poBoxEmirate: normalizePoBox(form.poBoxNumber) ? form.poBoxEmirate || '' : '',
      email1: toLower(form.email1),
      webAddress: toLower(form.webAddress),
      taxEnabled: Boolean(form.taxEnabled),
      taxPercentage: Number(toDigits(form.taxPercentage) || 5),
      taxRegistrationNumber: normalizeTrnDigits(form.taxRegistrationNumber),
      bankName: String(form.bankName || '').trim(),
      bankAccountName: String(form.bankAccountName || '').trim(),
      bankAccountNumber: String(form.bankAccountNumber || '').trim(),
      bankIban: String(form.bankIban || '').trim().toUpperCase(),
      bankSwift: String(form.bankSwift || '').trim().toUpperCase(),
      bankBranch: String(form.bankBranch || '').trim(),
      uiPrimaryColor: normalizeHexColor(form.uiPrimaryColor, '#1778F2'),
      uiSecondaryColor: normalizeHexColor(form.uiSecondaryColor, '#45B6FF'),
      uiTertiaryColor: normalizeHexColor(form.uiTertiaryColor, '#6DE3D7'),
      uiTextOnAccent: normalizeHexColor(form.uiTextOnAccent, '#FFFFFF'),
      uiGradientEnabled: Boolean(form.uiGradientEnabled),
      locationPin: String(form.locationPin || '').trim(),
      logoLibrary: defaultLogoLibrary.map((baseSlot) => {
        const slot = logoLibrary.find((item) => item.slotId === baseSlot.slotId) || baseSlot;
        return {
          slotId: baseSlot.slotId,
          name: String(slot.name || baseSlot.name || ''),
          url: String(slot.url || ''),
        };
      }),
      logoUsage: LOGO_FUNCTIONS.reduce((acc, item) => {
        const candidate = String(logoUsage[item.key] || 'logo_1');
        const slotExists = defaultLogoLibrary.some((slot) => slot.slotId === candidate);
        acc[item.key] = slotExists ? candidate : 'logo_1';
        return acc;
      }, {}),
      updatedBy: user.uid,
    };

    const nextErrors = {};

    if (!payload.companyName && !payload.brandName) {
      nextErrors.companyName = 'Provide Company Name or Brand Name.';
      nextErrors.brandName = 'Provide Company Name or Brand Name.';
    }

    const phoneFields = [
      ['landline1', payload.landline1],
      ['landline2', payload.landline2],
      ['mobile1', payload.mobile1],
      ['mobile2', payload.mobile2],
    ];

    phoneFields.forEach(([field, digits]) => {
      const err = validateNineDigitUae(digits);
      if (err) nextErrors[field] = err;
    });

    if (payload.poBoxNumber.length > 8) {
      nextErrors.poBoxNumber = 'Maximum 8 digits allowed.';
    }

    if (payload.taxEnabled && !Number.isFinite(payload.taxPercentage)) {
      nextErrors.taxPercentage = 'Tax percentage must be numeric.';
    }

    if (payload.taxRegistrationNumber && payload.taxRegistrationNumber.length > 15) {
      nextErrors.taxRegistrationNumber = 'TRN supports maximum 15 digits.';
    }

    if (payload.bankIban && payload.bankIban.length < 10) {
      nextErrors.bankIban = 'IBAN looks too short.';
    }

    if (payload.bankSwift && payload.bankSwift.length < 6) {
      nextErrors.bankSwift = 'SWIFT code looks too short.';
    }
    if (!/^#[0-9A-F]{6}$/i.test(payload.uiPrimaryColor)) nextErrors.uiPrimaryColor = 'Use valid HEX color.';
    if (!/^#[0-9A-F]{6}$/i.test(payload.uiSecondaryColor)) nextErrors.uiSecondaryColor = 'Use valid HEX color.';
    if (!/^#[0-9A-F]{6}$/i.test(payload.uiTertiaryColor)) nextErrors.uiTertiaryColor = 'Use valid HEX color.';
    if (!/^#[0-9A-F]{6}$/i.test(payload.uiTextOnAccent)) nextErrors.uiTextOnAccent = 'Use valid HEX color.';

    const invalidLogo =
      payload.logoLibrary.length !== MAX_LOGO_SLOTS ||
      payload.logoLibrary.some((slot) => !slot.slotId || !slot.name);
    if (invalidLogo) {
      nextErrors.logoLibrary = 'Each logo slot must have a name.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setSaveMessage('Fix validation errors before saving.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      companyName: payload.companyName,
      brandName: payload.brandName,
      primaryAddress: payload.primaryAddress,
      secondaryAddress: payload.secondaryAddress,
      email1: payload.email1,
      webAddress: payload.webAddress,
      taxRegistrationNumber: payload.taxRegistrationNumber,
      taxPercentage: String(payload.taxPercentage),
      uiPrimaryColor: payload.uiPrimaryColor,
      uiSecondaryColor: payload.uiSecondaryColor,
      uiTertiaryColor: payload.uiTertiaryColor,
      uiTextOnAccent: payload.uiTextOnAccent,
      uiGradientEnabled: payload.uiGradientEnabled,
      locationPin: payload.locationPin,
    }));

    const write = await upsertTenantSettingDoc(tenantId, 'branding', payload);
    if (!write.ok) {
      setSaveMessage(`Brand details save failed: ${write.error}`);
      return;
    }

    const sync = await createSyncEvent({
      tenantId,
      eventType: 'update',
      entityType: 'settingsBranding',
      entityId: 'branding',
      changedFields: Object.keys(payload),
      createdBy: user.uid,
    });

    setSaveMessage(
      sync.backendSynced
        ? 'Brand details saved and synced with backend.'
        : 'Brand details saved. Backend sync pending.',
    );
  };

  const trnPreview = useMemo(() => {
    const digits = normalizeTrnDigits(form.taxRegistrationNumber);
    return digits ? `TRN:${digits}` : 'TRN:';
  }, [form.taxRegistrationNumber]);

  if (!user) return null;

  return (
    <SettingCard
      title="Brand Details"
      description="Company identity and statutory settings with strict save-time normalization."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Company Name (Optional)
          <input
            className={inputClass}
            value={form.companyName}
            onChange={(event) => updateField('companyName', event.target.value.toUpperCase())}
            placeholder="COMPANY NAME"
          />
          {errors.companyName ? <p className="mt-1 text-xs text-rose-600">{errors.companyName}</p> : null}
        </label>

        <label className={labelClass}>
          Brand Name (Short, Optional)
          <input
            className={inputClass}
            value={form.brandName}
            onChange={(event) => updateField('brandName', event.target.value.toUpperCase())}
            placeholder="BRAND NAME"
          />
          {errors.brandName ? <p className="mt-1 text-xs text-rose-600">{errors.brandName}</p> : null}
        </label>

        <label className={labelClass}>
          Landline #1
          <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3">
            <span className="pr-2 text-sm text-[var(--c-muted)]">+971</span>
            <input
              className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
              value={form.landline1}
              onChange={(event) => handlePhoneChange('landline1', event.target.value)}
              inputMode="numeric"
              maxLength={9}
              placeholder="4xxxxxxx"
            />
          </div>
          {errors.landline1 ? <p className="mt-1 text-xs text-rose-600">{errors.landline1}</p> : null}
        </label>

        <label className={labelClass}>
          Landline #2
          <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3">
            <span className="pr-2 text-sm text-[var(--c-muted)]">+971</span>
            <input
              className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
              value={form.landline2}
              onChange={(event) => handlePhoneChange('landline2', event.target.value)}
              inputMode="numeric"
              maxLength={9}
              placeholder="4xxxxxxx"
            />
          </div>
          {errors.landline2 ? <p className="mt-1 text-xs text-rose-600">{errors.landline2}</p> : null}
        </label>

        <label className={labelClass}>
          Mobile #1
          <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3">
            <span className="pr-2 text-sm text-[var(--c-muted)]">+971</span>
            <input
              className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
              value={form.mobile1}
              onChange={(event) => handlePhoneChange('mobile1', event.target.value)}
              inputMode="numeric"
              maxLength={9}
              placeholder="5xxxxxxxx"
            />
          </div>
          {errors.mobile1 ? <p className="mt-1 text-xs text-rose-600">{errors.mobile1}</p> : null}
        </label>

        <label className={labelClass}>
          Mobile #2
          <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3">
            <span className="pr-2 text-sm text-[var(--c-muted)]">+971</span>
            <input
              className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
              value={form.mobile2}
              onChange={(event) => handlePhoneChange('mobile2', event.target.value)}
              inputMode="numeric"
              maxLength={9}
              placeholder="5xxxxxxxx"
            />
          </div>
          {errors.mobile2 ? <p className="mt-1 text-xs text-rose-600">{errors.mobile2}</p> : null}
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Primary Address
          <input
            className={inputClass}
            value={form.primaryAddress}
            onChange={(event) => updateField('primaryAddress', event.target.value)}
            placeholder="Primary address"
          />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Secondary Address
          <input
            className={inputClass}
            value={form.secondaryAddress}
            onChange={(event) => updateField('secondaryAddress', event.target.value)}
            placeholder="Secondary address"
          />
        </label>

        <label className={labelClass}>
          Emirate
          <select
            className={inputClass}
            value={form.emirate}
            onChange={(event) => updateField('emirate', event.target.value)}
          >
            <option value="">Select emirate</option>
            {emirates.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          P.O. Box Number
          <input
            className={inputClass}
            value={form.poBoxNumber}
            onChange={(event) => handlePoBoxChange(event.target.value)}
            inputMode="numeric"
            maxLength={8}
            placeholder="Digits only"
          />
          {errors.poBoxNumber ? <p className="mt-1 text-xs text-rose-600">{errors.poBoxNumber}</p> : null}
        </label>

        <label className={labelClass}>
          P.O. Box Emirate
          <select
            className={inputClass}
            value={form.poBoxEmirate}
            onChange={(event) => updateField('poBoxEmirate', event.target.value)}
            disabled={poBoxDisabled}
          >
            <option value="">Select emirate</option>
            {emirates.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Email Address #1
          <input
            className={inputClass}
            value={form.email1}
            onChange={(event) => updateField('email1', event.target.value.toLowerCase())}
            placeholder="email@domain.com"
          />
        </label>

        <label className={labelClass}>
          Web Address
          <input
            className={inputClass}
            value={form.webAddress}
            onChange={(event) => updateField('webAddress', event.target.value.toLowerCase())}
            placeholder="www.example.com"
          />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Google Maps Location Pin (URL)
          <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3">
            <input
              className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
              value={form.locationPin}
              onChange={(event) => updateField('locationPin', event.target.value)}
              placeholder="https://maps.google.com/..."
            />
            {form.locationPin && (
              <a
                href={form.locationPin}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs font-semibold text-[var(--c-accent)] hover:underline"
              >
                Test Pin
              </a>
            )}
          </div>
          <p className="mt-1 text-[10px] text-[var(--c-muted)]">
            Paste the Google Maps "Share" link or "Plus Code" here for future reference.
          </p>
        </label>

        <div className="sm:col-span-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-[var(--c-text)]">Tax / Registration</p>
            <button
              type="button"
              onClick={() => updateField('taxEnabled', !form.taxEnabled)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${form.taxEnabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
            >
              {form.taxEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Tax Percentage
              <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3">
                <input
                  className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
                  value={form.taxPercentage}
                  onChange={(event) => updateField('taxPercentage', toDigits(event.target.value))}
                  inputMode="numeric"
                  placeholder="5"
                  disabled={!form.taxEnabled}
                />
                <span className="pl-2 text-sm text-[var(--c-muted)]">%</span>
              </div>
              {errors.taxPercentage ? <p className="mt-1 text-xs text-rose-600">{errors.taxPercentage}</p> : null}
            </label>

            <label className={labelClass}>
              Tax Registration Number (TRN)
              <div className="mt-1 flex items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3">
                <span className="pr-2 text-sm text-[var(--c-muted)]">TRN:</span>
                <input
                  className="w-full bg-transparent py-2.5 text-sm text-[var(--c-text)] outline-none"
                  value={form.taxRegistrationNumber}
                  onChange={(event) => updateField('taxRegistrationNumber', normalizeTrnDigits(event.target.value))}
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="15 digits max"
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--c-muted)]">Preview: {trnPreview}</p>
              {errors.taxRegistrationNumber ? <p className="mt-1 text-xs text-rose-600">{errors.taxRegistrationNumber}</p> : null}
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-[var(--c-text)]">Bank Details</p>
          <p className="text-xs text-[var(--c-muted)]">These details can appear on PDFs and statements.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Bank Name
            <input
              className={inputClass}
              value={form.bankName}
              onChange={(event) => updateField('bankName', event.target.value)}
              placeholder="Bank name"
            />
          </label>
          <label className={labelClass}>
            Account Name
            <input
              className={inputClass}
              value={form.bankAccountName}
              onChange={(event) => updateField('bankAccountName', event.target.value)}
              placeholder="Account name"
            />
          </label>
          <label className={labelClass}>
            Account Number
            <input
              className={inputClass}
              value={form.bankAccountNumber}
              onChange={(event) => updateField('bankAccountNumber', event.target.value)}
              placeholder="Account number"
            />
          </label>
          <label className={labelClass}>
            IBAN
            <input
              className={inputClass}
              value={form.bankIban}
              onChange={(event) => updateField('bankIban', event.target.value.toUpperCase())}
              placeholder="AE00 0000 0000 0000 0000 000"
            />
            {errors.bankIban ? <p className="mt-1 text-xs text-rose-600">{errors.bankIban}</p> : null}
          </label>
          <label className={labelClass}>
            SWIFT / BIC
            <input
              className={inputClass}
              value={form.bankSwift}
              onChange={(event) => updateField('bankSwift', event.target.value.toUpperCase())}
              placeholder="BANKAEAD"
            />
            {errors.bankSwift ? <p className="mt-1 text-xs text-rose-600">{errors.bankSwift}</p> : null}
          </label>
          <label className={labelClass}>
            Branch
            <input
              className={inputClass}
              value={form.bankBranch}
              onChange={(event) => updateField('bankBranch', event.target.value)}
              placeholder="Branch name"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-[var(--c-text)]">Brand UI Theme (3 Colors)</p>
          <p className="text-xs text-[var(--c-muted)]">Customize gradient colors and text color for a tenant-specific premium look.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Primary Color
            <input
              type="color"
              className={`${inputClass} h-11 p-1`}
              value={form.uiPrimaryColor}
              onChange={(event) => updateField('uiPrimaryColor', event.target.value.toUpperCase())}
            />
            {errors.uiPrimaryColor ? <p className="mt-1 text-xs text-rose-600">{errors.uiPrimaryColor}</p> : null}
          </label>
          <label className={labelClass}>
            Secondary Color
            <input
              type="color"
              className={`${inputClass} h-11 p-1`}
              value={form.uiSecondaryColor}
              onChange={(event) => updateField('uiSecondaryColor', event.target.value.toUpperCase())}
            />
            {errors.uiSecondaryColor ? <p className="mt-1 text-xs text-rose-600">{errors.uiSecondaryColor}</p> : null}
          </label>
          <label className={labelClass}>
            Tertiary Color
            <input
              type="color"
              className={`${inputClass} h-11 p-1`}
              value={form.uiTertiaryColor}
              onChange={(event) => updateField('uiTertiaryColor', event.target.value.toUpperCase())}
            />
            {errors.uiTertiaryColor ? <p className="mt-1 text-xs text-rose-600">{errors.uiTertiaryColor}</p> : null}
          </label>
          <label className={labelClass}>
            Font Color On Accent
            <input
              type="color"
              className={`${inputClass} h-11 p-1`}
              value={form.uiTextOnAccent}
              onChange={(event) => updateField('uiTextOnAccent', event.target.value.toUpperCase())}
            />
            {errors.uiTextOnAccent ? <p className="mt-1 text-xs text-rose-600">{errors.uiTextOnAccent}</p> : null}
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--c-text)]">
            <input
              type="checkbox"
              checked={form.uiGradientEnabled}
              onChange={(event) => updateField('uiGradientEnabled', event.target.checked)}
              className="h-4 w-4 accent-[var(--c-accent)]"
            />
            Enable Gradient Effect
          </label>
          <div
            className="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm"
            style={{
              background: form.uiGradientEnabled
                ? `linear-gradient(125deg, ${form.uiPrimaryColor} 0%, ${form.uiSecondaryColor} 54%, ${form.uiTertiaryColor} 100%)`
                : form.uiPrimaryColor,
              color: form.uiTextOnAccent,
            }}
          >
            Preview Sample
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--c-text)]">Logo Library</p>
            <p className="text-xs text-[var(--c-muted)]">Upload up to 5 logos and map each function to a slot.</p>
          </div>
        </div>

        {errors.logoLibrary ? <p className="text-xs text-rose-600">{errors.logoLibrary}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          {logoLibrary.map((slot) => (
            <div key={slot.slotId} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
              <label className={labelClass}>
                Slot Name
                <input
                  className={inputClass}
                  value={slot.name}
                  onChange={(event) => updateLogoSlot(slot.slotId, { name: event.target.value })}
                  placeholder="Logo Slot Name"
                />
              </label>
              {slot.url ? (
                <div className="mt-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] p-2">
                  <img src={slot.url} alt={slot.name} className="h-16 w-auto object-contain" />
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--c-muted)]">No logo uploaded yet.</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openLogoEditor(slot.slotId)}
                  className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--c-text)]"
                >
                  Edit / Upload
                </button>
                <button
                  type="button"
                  onClick={() => updateLogoSlot(slot.slotId, { url: '' })}
                  className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold text-rose-600"
                >
                  Remove
                </button>
                {logoUploading[slot.slotId] ? (
                  <p className="text-xs text-[var(--c-muted)]">Uploading...</p>
                ) : null}
              </div>
              {logoErrors[slot.slotId] ? (
                <p className="mt-1 text-xs text-rose-600">{logoErrors[slot.slotId]}</p>
              ) : null}
            </div>
          ))}
        </div>

        {activeLogoEditorSlotId ? (
          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--c-text)]">
                Logo Editor: {logoLibrary.find((slot) => slot.slotId === activeLogoEditorSlotId)?.name || activeLogoEditorSlotId}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyLogoEditor}
                  disabled={logoUploading[activeLogoEditorSlotId]}
                  className="rounded-lg bg-[var(--c-accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Apply & Upload
                </button>
                <button
                  type="button"
                  onClick={closeLogoEditor}
                  className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs font-semibold text-[var(--c-text)]"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="mt-4">
              <ImageStudio
                sourceUrl={logoSourceUrl}
                onReset={onLogoEditorReset}
                zoom={logoZoom}
                setZoom={setLogoZoom}
                rotation={logoRotation}
                setRotation={setRotationWrapper}
                filter={logoFilter}
                setFilter={setLogoFilter}
                filterMap={logoFilterMap}
                onFileChange={onLogoEditorFileChange}
                onCropComplete={onCropComplete}
                title={`Editing ${logoLibrary.find((s) => s.slotId === activeLogoEditorSlotId)?.name}`}
                aspect={1}
                cropShape="rect"
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
          <p className="text-sm font-semibold text-[var(--c-text)]">Logo Usage by Function</p>
          <p className="text-xs text-[var(--c-muted)]">Choose which logo slot applies to each document type.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {LOGO_FUNCTIONS.map((item) => (
              <label key={item.key} className={labelClass}>
                {item.label}
                <select
                  className={inputClass}
                  value={logoUsage[item.key] || 'logo_1'}
                  onChange={(event) =>
                    setLogoUsage((prev) => ({ ...prev, [item.key]: event.target.value }))
                  }
                >
                  {logoLibrary.map((slot) => (
                    <option key={slot.slotId} value={slot.slotId}>
                      {slot.name || slot.slotId}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="rounded-xl bg-[var(--c-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Save Brand Details
        </button>
        {saveMessage ? <p className="text-sm text-[var(--c-muted)]">{saveMessage}</p> : null}
      </div>
    </SettingCard >
  );
};

export default BrandDetailsSection;
