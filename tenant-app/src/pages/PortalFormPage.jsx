import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Check,
    ImagePlus,
    Layers,
    Plus,
    Wallet,
    X,
    Zap,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import ImageStudio from '../components/common/ImageStudio';
import DirhamIcon from '../components/common/DirhamIcon';
import { useAuth } from '../context/useAuth';
import { useTenant } from '../context/useTenant';
import { createSyncEvent } from '../lib/syncEvents';
import { generateNotificationId } from '../lib/notificationTemplate';
import { sendUniversalNotification } from '../lib/notificationDrafting';
import { getCroppedImg } from '../lib/imageStudioUtils';
import {
    fetchTenantPortals,
    upsertTenantPortal,
    upsertTenantPortalTransaction,
    generateDisplayPortalId,
} from '../lib/backendStore';
import { uploadPortalIcon } from '../lib/portalStorage';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';
import { canUserPerformAction } from '../lib/userControlPreferences';
import { generateDisplayTxId, toSafeDocId } from '../lib/txIdGenerator';
import { toSafeDocId as toSafeIconId } from '../lib/idUtils';
import {
    DEFAULT_PORTAL_CATEGORIES,
    buildMethodIconMap,
    createCustomMethodDefinition,
    resolvePortalCategories,
    resolvePortalCategory,
    resolveCategoryMethodIds,
    resolvePortalMethodDefinitions,
    resolveMethodIconUrl,
    resolvePortalTypeIcon,
    DEFAULT_PORTAL_ICON,
    sanitizePortalEntityName,
} from '../lib/transactionMethodConfig';
import { getPublicAssetUrl } from '../lib/publicAsset';

/* ─── Constants ──────────────────────────────────────────────── */
const ICON_OUTPUT_SIZE = 256;
const ICON_MAX_BYTES = 100 * 1024;

// Map method IDs to their real local asset (if available)
const METHOD_ASSET_MAP = {
    cashByHand: getPublicAssetUrl('portals/methods/cashByHand.png'),
    bankTransfer: getPublicAssetUrl('portals/methods/banktransfer.png'),
    checqueDeposit: getPublicAssetUrl('portals/methods/chequeDeposit.png'),
    onlinePayment: getPublicAssetUrl('portals/methods/onlinepayment.png'),
    tabby: getPublicAssetUrl('portals/methods/tabby.png'),
    tamara: getPublicAssetUrl('portals/methods/tamara.png'),
};

/* ─── Helpers ────────────────────────────────────────────────── */
const fallbackTypeIcon = (type) => {
    return resolvePortalTypeIcon(type);
};

const resolveMethodAsset = (methodId, firestoreIconMap) => {
    const fromFirestore = resolveMethodIconUrl(firestoreIconMap, methodId);
    if (fromFirestore) return fromFirestore;
    return METHOD_ASSET_MAP[methodId] || null;
};

/* ─── Sub-components ─────────────────────────────────────────── */

/** Single portal-category tile */
const CategoryTile = ({ category, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)] ${
            isActive
                ? 'border-[var(--c-accent)] bg-[color:color-mix(in_srgb,var(--c-accent)_10%,var(--c-surface))] shadow-md'
                : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:border-[var(--c-accent)]/40 hover:bg-[var(--c-surface)]'
        }`}
    >
        {isActive && (
            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--c-accent)] text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
        )}
        <div className="h-12 w-12 overflow-hidden rounded-xl border border-[var(--c-border)] bg-white">
            <img
                src={category.icon}
                alt={category.label}
                className="h-full w-full object-cover"
                onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_PORTAL_ICON;
                }}
            />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)]'}`}>
            {category.label}
        </span>
    </button>
);

/** Single transaction method pill / toggle */
const MethodPill = ({ method, isSelected, isCustom, onToggle, onRemove, iconMap }) => {
    const asset = resolveMethodAsset(method.id, iconMap);
    const MethodIcon = method.Icon;

    return (
        <div
            className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-150 ${
                isSelected
                    ? 'border-[var(--c-accent)] bg-[color:color-mix(in_srgb,var(--c-accent)_8%,var(--c-surface))]'
                    : 'border-[var(--c-border)] bg-[var(--c-panel)]'
            }`}
        >
            {/* Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--c-border)] bg-white">
                {asset ? (
                    <img
                        src={asset}
                        alt={method.label}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = METHOD_ASSET_MAP.onlinePayment;
                        }}
                    />
                ) : MethodIcon ? (
                    <MethodIcon className="h-4 w-4 text-[var(--c-muted)]" />
                ) : (
                    <Zap className="h-4 w-4 text-[var(--c-muted)]" />
                )}
            </div>

            {/* Label */}
            <span className={`flex-1 text-xs font-semibold ${isSelected ? 'text-[var(--c-text)]' : 'text-[var(--c-muted)]'}`}>
                {method.label}
                {isCustom && (
                    <span className="ml-1.5 rounded-full bg-[var(--c-accent)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--c-accent)]">
                        custom
                    </span>
                )}
            </span>

            {/* Toggle checkbox */}
            <button
                type="button"
                onClick={onToggle}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    isSelected
                        ? 'border-[var(--c-accent)] bg-[var(--c-accent)] text-white'
                        : 'border-[var(--c-border)] bg-transparent text-transparent hover:border-[var(--c-accent)]/50'
                }`}
                aria-label={isSelected ? `Disable ${method.label}` : `Enable ${method.label}`}
            >
                <Check className="h-3 w-3" strokeWidth={3} />
            </button>

            {/* Remove for custom only */}
            {isCustom && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[var(--c-muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                    aria-label={`Remove ${method.label}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
};

/** Status banner */
const StatusBanner = ({ message, type }) => {
    if (!message) return null;
    const styles = {
        error: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        info: 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]',
    };
    return (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[type] || styles.info}`}>
            {message}
        </div>
    );
};

/* ─── Main Page ───────────────────────────────────────────────── */
const PortalFormPage = () => {
    const { portalId } = useParams();
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const isEdit = !!portalId;

    // Loading / saving
    const [isLoading, setIsLoading] = useState(isEdit);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: 'info' });

    // Existing portal data (edit mode)
    const [existingPortal, setExistingPortal] = useState(null);

    // Form fields
    const [form, setForm] = useState({
        name: '',
        balance: '',
        balanceType: 'positive',
        type: DEFAULT_PORTAL_CATEGORIES[0].id,
        methods: resolveCategoryMethodIds(DEFAULT_PORTAL_CATEGORIES[0].id, []),
        customMethods: [],
    });

    // Logo (uploaded image) — goes through ImageStudio
    const [logoRawUrl, setLogoRawUrl] = useState('');       // blob URL for crop
    const [logoCroppedArea, setLogoCroppedArea] = useState(null);
    const [logoZoom, setLogoZoom] = useState(1);
    const [logoRotation, setLogoRotation] = useState(0);
    const [logoIsDirty, setLogoIsDirty] = useState(false);
    const [isLogoStudioOpen, setIsLogoStudioOpen] = useState(false);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(''); // existing saved logo
    const logoFileRef = useRef(null);

    // Portal icon (picked from library or type default)
    const [iconLibrary, setIconLibrary] = useState([]);
    const [firestoreIconMap, setFirestoreIconMap] = useState({});
    const [selectedIconUrl, setSelectedIconUrl] = useState('');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    // Add custom method
    const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
    const [newMethodName, setNewMethodName] = useState('');

    /* ── Load existing portal (edit mode) ─────── */
    useEffect(() => {
        if (!tenantId || !portalId) return;
        fetchTenantPortals(tenantId).then((res) => {
            if (res.ok) {
                const p = res.rows.find((item) => item.id === portalId);
                if (p) {
                    setExistingPortal(p);
                    setForm({
                        name: p.name || '',
                        balance: Number(p.balance || 0),
                        balanceType: p.balanceType || 'positive',
                        type: p.type || DEFAULT_PORTAL_CATEGORIES[0].id,
                        methods: Array.isArray(p.methods) ? p.methods : [],
                        customMethods: Array.isArray(p.customMethods) ? p.customMethods : [],
                    });
                    setLogoPreviewUrl(p.logoUrl || '');
                    setSelectedIconUrl(p.iconUrl || '');
                }
            }
            setIsLoading(false);
        });
    }, [tenantId, portalId]);

    /* ── Load icon library ─────────────────────── */
    const loadIconLibrary = useCallback(async () => {
        if (!tenantId) return;
        const res = await fetchApplicationIconLibrary(tenantId);
        if (res.ok) {
            const rows = res.rows || [];
            setFirestoreIconMap(buildMethodIconMap(rows));
            setIconLibrary(rows.filter((r) => !!r.iconUrl));
        }
    }, [tenantId]);

    useEffect(() => {
        loadIconLibrary();
    }, [loadIconLibrary]);

    /* ── Derived values ────────────────────────── */
    const allCategories = resolvePortalCategories([]);
    const activeCategory = resolvePortalCategory(form.type, []);
    const allMethodDefs = resolvePortalMethodDefinitions(form.customMethods);
    // Which methods are relevant to this category?
    const categoryDefaultMethodIds = resolveCategoryMethodIds(form.type, []);
    const visibleMethodDefs = allMethodDefs.filter((m) => {
        if (m.isCustom) return true; // always show custom
        return categoryDefaultMethodIds.includes(m.id);
    });
    const portalIconPreview = selectedIconUrl || activeCategory?.icon || fallbackTypeIcon(form.type);

    /* ── Category change ───────────────────────── */
    const handleCategoryChange = (newType) => {
        const defaults = resolveCategoryMethodIds(newType, []);
        setForm((prev) => ({
            ...prev,
            type: newType,
            // carry over custom method ids, reset default methods to this category's defaults
            methods: [
                ...defaults,
                ...prev.customMethods.map((m) => m.id),
            ],
        }));
        // Reset icon to category default if none manually selected
        if (!selectedIconUrl || !logoIsDirty) {
            const cat = resolvePortalCategory(newType, []);
            setSelectedIconUrl(cat?.icon || '');
        }
    };

    /* ── Toggle method on/off ──────────────────── */
    const handleToggleMethod = (methodId) => {
        setForm((prev) => ({
            ...prev,
            methods: prev.methods.includes(methodId)
                ? prev.methods.filter((id) => id !== methodId)
                : [...prev.methods, methodId],
        }));
    };

    /* ── Add custom method ─────────────────────── */
    const handleAddCustomMethod = () => {
        const label = sanitizePortalEntityName(newMethodName, '');
        if (!label) {
            setStatus({ message: 'Method name is required.', type: 'error' });
            return;
        }
        const methodId = toSafeIconId(label, 'portal_method');
        const alreadyExists = resolvePortalMethodDefinitions(form.customMethods).some((m) => m.id === methodId);
        if (alreadyExists) {
            setStatus({ message: 'A method with this name already exists.', type: 'error' });
            return;
        }
        const newMethod = createCustomMethodDefinition({ id: methodId, label, iconUrl: '' });
        setForm((prev) => ({
            ...prev,
            customMethods: [...prev.customMethods, newMethod],
            methods: [...prev.methods, methodId],
        }));
        setNewMethodName('');
        setIsAddMethodOpen(false);
        setStatus({ message: '', type: 'info' });
    };

    /* ── Remove custom method ──────────────────── */
    const handleRemoveCustomMethod = (methodId) => {
        setForm((prev) => ({
            ...prev,
            customMethods: prev.customMethods.filter((m) => m.id !== methodId),
            methods: prev.methods.filter((id) => id !== methodId),
        }));
    };

    /* ── Logo upload ───────────────────────────── */
    const handleLogoFileSelect = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const url = URL.createObjectURL(file);
        setLogoRawUrl(url);
        setLogoCroppedArea(null);
        setLogoZoom(1);
        setLogoRotation(0);
        setLogoIsDirty(true);
        setIsLogoStudioOpen(true);
    };

    const handleLogoClear = () => {
        setLogoRawUrl('');
        setLogoCroppedArea(null);
        setLogoIsDirty(false);
        setLogoPreviewUrl('');
        setIsLogoStudioOpen(false);
    };

    /* ── Save ──────────────────────────────────── */
    const handleSave = async () => {
        const name = form.name.trim();
        if (!name) {
            setStatus({ message: 'Portal name is required.', type: 'error' });
            return;
        }

        if (!isEdit && !canUserPerformAction(tenantId, user, 'createPortal')) {
            setStatus({ message: "You don't have permission to create portals.", type: 'error' });
            return;
        }

        setIsSaving(true);
        setStatus({ message: '', type: 'info' });

        const targetPortalId = portalId || (await generateDisplayPortalId(tenantId));

        // Process logo upload
        let logoUrl = existingPortal?.logoUrl || logoPreviewUrl || '';
        if (logoIsDirty && logoRawUrl && logoCroppedArea) {
            try {
                const blob = await getCroppedImg(
                    logoRawUrl,
                    logoCroppedArea,
                    logoRotation,
                    'natural',
                    ICON_OUTPUT_SIZE,
                    ICON_MAX_BYTES,
                );
                const uploadRes = await uploadPortalIcon({
                    tenantId,
                    portalId: targetPortalId,
                    fileBlob: blob,
                    oldIconUrl: existingPortal?.logoUrl,
                });
                if (uploadRes.ok) logoUrl = uploadRes.iconUrl;
                else throw new Error(uploadRes.error || 'Logo upload failed.');
            } catch (err) {
                setStatus({ message: err.message, type: 'error' });
                setIsSaving(false);
                return;
            }
        }

        const iconUrl = selectedIconUrl || activeCategory?.icon || fallbackTypeIcon(form.type);
        const openingAmount = isEdit ? 0 : Number(form.balance) || 0;
        const openingSignedBalance = openingAmount * (form.balanceType === 'negative' ? -1 : 1);

        const payload = {
            name,
            type: form.type,
            methods: form.methods,
            customMethods: form.customMethods,
            iconUrl,
            logoUrl,
            status: existingPortal?.status || 'active',
            createdBy: existingPortal?.createdBy || user.uid,
            updatedBy: user.uid,
            ...(isEdit
                ? {}
                : { balance: openingSignedBalance, balanceType: form.balanceType }),
        };

        const res = await upsertTenantPortal(tenantId, targetPortalId, payload);
        if (!res.ok) {
            setStatus({ message: res.error || 'Failed to save portal.', type: 'error' });
            setIsSaving(false);
            return;
        }

        // Opening balance transaction
        if (!isEdit && openingAmount > 0) {
            const displayTxId = await generateDisplayTxId(tenantId, 'POR');
            await upsertTenantPortalTransaction(
                tenantId,
                toSafeDocId(displayTxId, 'portal_tx'),
                {
                    portalId: targetPortalId,
                    displayTransactionId: displayTxId,
                    amount: openingSignedBalance,
                    type: 'Opening Balance',
                    date: new Date().toISOString(),
                    createdBy: user.uid,
                },
            );
        }

        // Notification (create only)
        if (!isEdit) {
            const routePath = `/t/${tenantId}/portal-management/${targetPortalId}`;
            await sendUniversalNotification({
                tenantId,
                notificationId: generateNotificationId({ topic: 'finance', subTopic: 'portal' }),
                topic: 'finance',
                subTopic: 'portal',
                type: 'create',
                title: 'Portal Created',
                message: `${name} was created successfully.`,
                createdBy: user.uid,
                routePath,
                actionPresets: ['view'],
                eventType: 'create',
                entityType: 'portal',
                entityId: targetPortalId,
                entityLabel: name,
                pageKey: 'portalManagement',
                sectionKey: 'portalSetup',
                quickView: {
                    badge: 'Portal',
                    title: name,
                    subtitle: activeCategory?.label || form.type,
                    imageUrl: iconUrl,
                    description: 'Portal created and ready for operational use.',
                    fields: [
                        { label: 'Portal ID', value: targetPortalId },
                        { label: 'Category', value: activeCategory?.label || form.type },
                        { label: 'Opening Balance', value: String(openingSignedBalance) },
                    ],
                },
            });
        }

        // Sync event
        await createSyncEvent({
            tenantId,
            eventType: isEdit ? 'update' : 'create',
            entityType: 'portal',
            entityId: targetPortalId,
            changedFields: Object.keys(payload),
            createdBy: user.uid,
        });

        setStatus({ message: isEdit ? 'Portal updated.' : 'Portal created successfully!', type: 'success' });
        setTimeout(() => navigate(`/t/${tenantId}/portal-management`), 1200);
    };

    /* ── Guard ─────────────────────────────────── */
    if (!user || isLoading) return null;

    /* ── Render ────────────────────────────────── */
    return (
        <PageShell
            title={isEdit ? 'Edit Portal' : 'New Portal'}
            subtitle={
                isEdit
                    ? `Editing "${existingPortal?.name || portalId}"`
                    : 'Configure your new operational portal below.'
            }
        >
            <div className="mx-auto max-w-4xl space-y-5 pb-20">

                {/* ── Section 1 · Basic Info ─────────────────────── */}
                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-sm">
                    <SectionHeading icon={Building2} label="Portal Information" />
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {/* Name */}
                        <div className="sm:col-span-2">
                            <FieldLabel>Portal Name</FieldLabel>
                            <input
                                id="portal-name"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Main Operating Bank"
                                className="mt-1.5 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-sm font-medium text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/20"
                            />
                        </div>

                        {/* Opening Balance — create only */}
                        {!isEdit && (
                            <>
                                <div>
                                    <FieldLabel>Opening Balance <span className="normal-case font-normal text-[var(--c-muted)]">(optional)</span></FieldLabel>
                                    <div className="relative mt-1.5">
                                        <DirhamIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-muted)]" />
                                        <input
                                            id="portal-opening-balance"
                                            type="number"
                                            min="0"
                                            value={form.balance}
                                            onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                                            placeholder="0"
                                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] pl-9 pr-4 py-2.5 text-sm font-medium text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                        />
                                    </div>
                                </div>
                                {Number(form.balance) > 0 && (
                                    <div>
                                        <FieldLabel>Balance Type</FieldLabel>
                                        <select
                                            id="portal-balance-type"
                                            value={form.balanceType}
                                            onChange={(e) => setForm((p) => ({ ...p, balanceType: e.target.value }))}
                                            className="mt-1.5 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-sm font-medium text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)]"
                                        >
                                            <option value="positive">Positive (+)</option>
                                            <option value="negative">Negative (−)</option>
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Current balance display — edit mode */}
                        {isEdit && (
                            <div>
                                <FieldLabel>Current Balance</FieldLabel>
                                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5">
                                    <DirhamIcon className="h-4 w-4 text-[var(--c-muted)]" />
                                    <span className={`text-sm font-bold ${Number(existingPortal?.balance || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {Number(existingPortal?.balance || 0).toLocaleString()}
                                    </span>
                                    <span className="ml-auto text-xs text-[var(--c-muted)]">AED · read-only</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Section 2 · Category ───────────────────────── */}
                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-sm">
                    <SectionHeading icon={Layers} label="Portal Category" />
                    <p className="mt-1 text-xs text-[var(--c-muted)]">
                        The category determines the default transaction methods for this portal.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {allCategories.map((cat) => (
                            <CategoryTile
                                key={cat.id}
                                category={cat}
                                isActive={form.type === cat.id}
                                onClick={() => handleCategoryChange(cat.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Section 3 · Logo ───────────────────────────── */}
                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <SectionHeading icon={ImagePlus} label="Portal Logo" />
                            <p className="mt-1 text-xs text-[var(--c-muted)]">
                                Optional. Upload a custom logo image for this portal (displayed in portal detail).
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <input
                                    ref={logoFileRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleLogoFileSelect}
                                    className="hidden"
                                    id="logo-upload-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => logoFileRef.current?.click()}
                                    className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-xs font-bold text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    {logoPreviewUrl || logoIsDirty ? 'Change Logo' : 'Add Logo'}
                                </button>
                                {(logoPreviewUrl || logoIsDirty) && (
                                    <button
                                        type="button"
                                        onClick={handleLogoClear}
                                        className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Logo preview + Portal icon side by side */}
                        <div className="flex shrink-0 flex-col items-center gap-2">
                            {(logoPreviewUrl || logoIsDirty) ? (
                                <div className="h-16 w-16 overflow-hidden rounded-xl border border-[var(--c-border)] bg-white shadow-sm">
                                    <img
                                        src={logoRawUrl || logoPreviewUrl}
                                        alt="Logo preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)]">
                                    <ImagePlus className="h-6 w-6 text-[var(--c-muted)]/50" />
                                </div>
                            )}
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--c-muted)]">Logo</span>
                        </div>
                    </div>

                    {/* Image Studio (logo crop) */}
                    {isLogoStudioOpen && logoRawUrl && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--c-border)]">
                            <div className="flex items-center justify-between border-b border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2">
                                <span className="text-xs font-bold text-[var(--c-text)]">Crop & adjust logo</span>
                                <button
                                    type="button"
                                    onClick={() => setIsLogoStudioOpen(false)}
                                    className="rounded-lg p-1 text-[var(--c-muted)] hover:text-[var(--c-text)]"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <ImageStudio
                                sourceUrl={logoRawUrl}
                                onReset={handleLogoClear}
                                onFileChange={handleLogoFileSelect}
                                zoom={logoZoom}
                                rotation={logoRotation}
                                setZoom={setLogoZoom}
                                setRotation={(v) => { setLogoRotation(v); setLogoIsDirty(true); }}
                                onCropComplete={(_, area) => { setLogoCroppedArea(area); setLogoIsDirty(true); }}
                                aspect={1}
                                cropShape="rect"
                                showFilters={false}
                            />
                        </div>
                    )}
                    {(logoPreviewUrl || logoRawUrl) ? (
                        <p className="mt-2 text-[11px] font-medium text-[var(--c-muted)]">
                            Logo upload is completed when you press {isEdit ? 'Update Portal' : 'Create Portal'}.
                        </p>
                    ) : null}

                    {/* ── Portal Icon (separate from logo) ─── */}
                    <div className="mt-5 border-t border-[var(--c-border)] pt-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Portal Icon</p>
                                <p className="mt-0.5 text-[11px] text-[var(--c-muted)]">
                                    Icon shown on portal cards and lists. Defaults to category icon.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Current icon preview */}
                                <div className="h-10 w-10 overflow-hidden rounded-xl border border-[var(--c-border)] bg-white">
                                    <img
                                        src={portalIconPreview}
                                        alt="Portal icon"
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = fallbackTypeIcon(form.type);
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsIconPickerOpen((v) => !v)}
                                    className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-bold text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
                                >
                                    {isIconPickerOpen ? 'Close Library' : 'Pick from Library'}
                                </button>
                                {selectedIconUrl && selectedIconUrl !== activeCategory?.icon && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedIconUrl(activeCategory?.icon || '')}
                                        className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Icon library picker */}
                        {isIconPickerOpen && (
                            <div className="mt-3">
                                {iconLibrary.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-4 text-center text-xs text-[var(--c-muted)]">
                                        No custom icons in library yet.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                                        {iconLibrary.map((item) => {
                                            const isActive = selectedIconUrl === item.iconUrl;
                                            return (
                                                <button
                                                    key={item.iconId}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedIconUrl(isActive ? (activeCategory?.icon || '') : item.iconUrl);
                                                        setIsIconPickerOpen(false);
                                                    }}
                                                    title={item.iconName}
                                                    className={`aspect-square rounded-xl border p-2 transition ${
                                                        isActive
                                                            ? 'border-[var(--c-accent)] bg-[color:color-mix(in_srgb,var(--c-accent)_12%,var(--c-surface))] ring-2 ring-[var(--c-accent)]/30'
                                                            : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:border-[var(--c-accent)]/40'
                                                    }`}
                                                >
                                                    <img
                                                        src={item.iconUrl}
                                                        alt={item.iconName}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = DEFAULT_PORTAL_ICON;
                                                        }}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Section 4 · Transaction Methods ───────────── */}
                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <SectionHeading icon={Zap} label="Transaction Methods" />
                        <button
                            type="button"
                            onClick={() => setIsAddMethodOpen((v) => !v)}
                            className="flex items-center gap-1.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-xs font-bold text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Custom
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-[var(--c-muted)]">
                        Default methods are pre-set for this category. Toggle them on or off. Add custom methods if needed.
                    </p>

                    {/* Add custom method inline form */}
                    {isAddMethodOpen && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                            <input
                                id="new-method-name"
                                type="text"
                                value={newMethodName}
                                onChange={(e) => setNewMethodName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMethod()}
                                placeholder="New method name…"
                                autoFocus
                                className="flex-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-medium text-[var(--c-text)] outline-none focus:border-[var(--c-accent)]"
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomMethod}
                                className="rounded-lg bg-[var(--c-accent)] px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsAddMethodOpen(false); setNewMethodName(''); }}
                                className="rounded-lg p-2 text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Method list */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {visibleMethodDefs.length === 0 ? (
                            <p className="col-span-full text-xs text-[var(--c-muted)]">No methods for this category.</p>
                        ) : (
                            visibleMethodDefs.map((method) => (
                                <MethodPill
                                    key={method.id}
                                    method={method}
                                    isSelected={form.methods.includes(method.id)}
                                    isCustom={!!method.isCustom}
                                    onToggle={() => handleToggleMethod(method.id)}
                                    onRemove={method.isCustom ? () => handleRemoveCustomMethod(method.id) : null}
                                    iconMap={firestoreIconMap}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Status banner ──────────────────────────────── */}
                <StatusBanner message={status.message} type={status.type} />

                {/* ── Action bar ───────────────────────────────────── */}
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-xl bg-[var(--c-accent)] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving ? 'Saving…' : isEdit ? 'Update Portal' : 'Create Portal'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/t/${tenantId}/portal-management`)}
                        className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] px-6 py-3 text-sm font-bold text-[var(--c-text)] transition hover:bg-[var(--c-panel)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Cancel
                    </button>
                </div>
            </div>

        </PageShell>
    );
};

/* ─── Tiny layout helpers ────────────────────────────────────── */
const SectionHeading = ({ icon: IconComponent, label }) => {
    const iconNode = typeof IconComponent === 'function'
        ? IconComponent({ className: 'h-3.5 w-3.5' })
        : null;

    return (
        <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--c-accent)]/30 bg-[color:color-mix(in_srgb,var(--c-accent)_14%,transparent)] text-[var(--c-accent)]">
                {iconNode}
            </span>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--c-text)]">{label}</p>
        </div>
    );
};

const FieldLabel = ({ children }) => (
    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--c-muted)]">
        {children}
    </label>
);

export default PortalFormPage;
