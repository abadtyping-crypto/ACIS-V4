import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { createSyncEvent } from '../lib/syncEvents';
import {
    fetchTenantPortals,
    upsertTenantPortal,
    upsertTenantNotification,
    upsertTenantPortalTransaction,
} from '../lib/backendStore';
import { uploadPortalIcon } from '../lib/portalStorage';
import ImageZoomTool from '../components/common/ImageZoomTool';
import { canUserPerformAction } from '../lib/userControlPreferences';
import { generateDisplayTxId, toSafeDocId } from '../lib/txIdGenerator';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';

const portalTypes = [
    { id: 'Bank', label: 'Bank', icon: '/portals/bank.png', methods: ['bankTransfer', 'cdmDeposit', 'checqueDeposit', 'onlinePayment', 'cashWithdrawals'] },
    { id: 'Card Payment', label: 'Card Payment', icon: '/portals/cardpayment.png', methods: ['onlinePayment', 'bankTransfer'] },
    { id: 'Petty Cash', label: 'Petty Cash', icon: '/portals/pettycash.png', methods: ['cashByHand', 'cdmDeposit', 'cashWithdrawals'] },
    { id: 'Portals', label: 'Portals', icon: '/portals/portals.png', methods: ['cashByHand', 'bankTransfer', 'onlinePayment'] },
    { id: 'Terminal', label: 'Terminal', icon: '/portals/terminal.png', methods: ['bankTransfer', 'tabby', 'Tamara'] },
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

const iconFilterMap = {
    natural: { label: 'Natural', css: 'none', canvas: 'none' },
    vibrant: { label: 'Vibrant', css: 'saturate(1.2) contrast(1.1)', canvas: 'saturate(120%) contrast(110%)' },
    soft: { label: 'Soft', css: 'brightness(1.05) saturate(0.9)', canvas: 'brightness(105%) saturate(90%)' },
};

const ICON_OUTPUT_SIZE = 256;
const ICON_MAX_BYTES = 100 * 1024;

const canvasToBlob = (canvas, quality) =>
    new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
    });

const buildIconBlob = async ({ src, width, height, zoom, offsetX, offsetY, filterKey }) => {
    const image = new Image();
    image.src = src;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    const safeZoom = Math.max(1, Math.min(3, Number(zoom || 1)));
    const minSide = Math.min(width, height);
    const cropSize = minSide / safeZoom;
    const maxPanX = Math.max(0, (width - cropSize) / 2);
    const maxPanY = Math.max(0, (height - cropSize) / 2);
    const centerX = width / 2 + (Math.max(-100, Math.min(100, Number(offsetX || 0))) / 100) * maxPanX;
    const centerY = height / 2 + (Math.max(-100, Math.min(100, Number(offsetY || 0))) / 100) * maxPanY;
    const sx = Math.max(0, Math.min(width - cropSize, centerX - cropSize / 2));
    const sy = Math.max(0, Math.min(height - cropSize, centerY - cropSize / 2));

    const canvas = document.createElement('canvas');
    canvas.width = ICON_OUTPUT_SIZE;
    canvas.height = ICON_OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.filter = iconFilterMap[filterKey]?.canvas || 'none';
    ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, ICON_OUTPUT_SIZE, ICON_OUTPUT_SIZE);

    const qualities = [0.8, 0.7, 0.6];
    let picked = null;
    for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, quality);
        if (!blob) continue;
        picked = blob;
        if (blob.size <= ICON_MAX_BYTES) break;
    }
    return picked;
};

const loadImageMeta = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        img.onerror = () => reject(new Error('Invalid image file.'));
        img.src = src;
    });

const PortalFormPage = () => {
    const { portalId } = useParams();
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('info');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!portalId);

    // Form State
    const [form, setForm] = useState({
        name: '',
        balance: 0,
        balanceType: 'positive',
        type: 'Bank',
        methods: [],
    });

    // Original portal (for update merge)
    const [existingPortal, setExistingPortal] = useState(null);

    // Icon Tool State
    const [iconRawUrl, setIconRawUrl] = useState('');
    const [iconSourceUrl, setIconSourceUrl] = useState('');
    const [iconMeta, setIconMeta] = useState({ width: 0, height: 0 });
    const [iconZoom, setIconZoom] = useState(1);
    const [iconOffsetX, setIconOffsetX] = useState(0);
    const [iconOffsetY, setIconOffsetY] = useState(0);
    const [iconFilter, setIconFilter] = useState('natural');
    const [iconDirty, setIconDirty] = useState(false);
    const [methodIconMap, setMethodIconMap] = useState({});

    useEffect(() => {
        if (!tenantId || !portalId) return;
        fetchTenantPortals(tenantId).then((res) => {
            if (res.ok) {
                const p = res.rows.find((item) => item.id === portalId);
                if (p) {
                    setExistingPortal(p);
                    setForm({
                        name: p.name,
                        balance: Number(p.balance || 0),
                        balanceType: p.balanceType || 'positive',
                        type: p.type || 'Bank',
                        methods: p.methods || [],
                    });
                    setIconSourceUrl(p.iconUrl);
                }
            }
            setIsLoading(false);
        });
    }, [tenantId, portalId]);

    useEffect(() => {
        if (!tenantId) return;
        let isMounted = true;
        fetchApplicationIconLibrary(tenantId).then((res) => {
            if (!isMounted || !res.ok) return;
            const nextMap = {};
            (res.rows || []).forEach((row) => {
                const key = String(row?.iconId || '').trim().toLowerCase();
                if (!key || !row?.iconUrl) return;
                nextMap[key] = row.iconUrl;
            });
            setMethodIconMap(nextMap);
        });
        return () => {
            isMounted = false;
        };
    }, [tenantId]);

    const onTypeChange = (newType) => {
        const typeObj = portalTypes.find((t) => t.id === newType);
        setForm((prev) => ({
            ...prev,
            type: newType,
            methods: typeObj ? typeObj.methods : prev.methods,
        }));
    };

    const onIconFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            const nextUrl = URL.createObjectURL(file);
            const meta = await loadImageMeta(nextUrl);
            setIconRawUrl(nextUrl);
            setIconMeta(meta);
            setIconSourceUrl(nextUrl);
            setIconZoom(1);
            setIconOffsetX(0);
            setIconOffsetY(0);
            setIconDirty(true);
        } catch (e) {
            console.error(e);
            setStatusMessage('Unable to read image file.');
            setStatusType('error');
        }
    };

    const onIconReset = () => {
        setIconRawUrl('');
        setIconSourceUrl('');
        setIconMeta({ width: 0, height: 0 });
        setIconZoom(1);
        setIconOffsetX(0);
        setIconOffsetY(0);
        setIconDirty(false);
    };

    const handleSavePortal = async () => {
        if (!form.name.trim()) {
            setStatusMessage('Portal name is required.');
            setStatusType('error');
            return;
        }

        // Action-Level Blocking (Milestone 3 Preview)
        const canCreate = canUserPerformAction(tenantId, user, 'createPortal');
        if (!portalId && !canCreate) {
            setStatusMessage("You don't have permission to create portals.");
            setStatusType('error');
            return;
        }

        setIsSaving(true);
        const finalPortalId = portalId || `portal_${Date.now()}`;
        let iconUrl = iconSourceUrl || portalTypes.find((t) => t.id === form.type)?.icon || '';

        if (iconDirty && iconRawUrl && iconMeta.width > 0 && iconMeta.height > 0) {
            try {
                const blob = await buildIconBlob({
                    src: iconRawUrl,
                    width: iconMeta.width,
                    height: iconMeta.height,
                    zoom: iconZoom,
                    offsetX: iconOffsetX,
                    offsetY: iconOffsetY,
                    filterKey: iconFilter,
                });
                const uploadRes = await uploadPortalIcon({
                    tenantId,
                    portalId: finalPortalId,
                    fileBlob: blob,
                    oldIconUrl: existingPortal?.iconUrl,
                });
                if (uploadRes.ok) {
                    iconUrl = uploadRes.iconUrl;
                } else {
                    setStatusMessage(uploadRes.error || 'Icon upload failed.');
                    setStatusType('error');
                    setIsSaving(false);
                    return;
                }
            } catch (e) {
                console.error(e);
                setStatusMessage('Icon processing failed.');
                setStatusType('error');
                setIsSaving(false);
                return;
            }
        }

        const openingAmount = Number(form.balance) || 0;
        const openingSignedBalance = openingAmount * (form.balanceType === 'negative' ? -1 : 1);
        const portalPayload = {
            name: form.name,
            type: form.type,
            methods: form.methods,
            iconUrl,
            status: existingPortal?.status || 'active',
            createdBy: existingPortal?.createdBy || user.uid,
            createdAt: existingPortal?.createdAt || new Date().toISOString(),
            ...(!portalId ? { balance: openingSignedBalance, balanceType: form.balanceType } : {}),
        };

        const res = await upsertTenantPortal(tenantId, finalPortalId, portalPayload);
        if (!res.ok) {
            setStatusMessage(res.error || 'Failed to save portal.');
            setStatusType('error');
            setIsSaving(false);
            return;
        }

        if (!portalId && openingAmount > 0) {
            const displayTxId = await generateDisplayTxId(tenantId, 'POR');
            await upsertTenantPortalTransaction(tenantId, toSafeDocId(displayTxId, 'portal_tx'), {
                portalId: finalPortalId,
                displayTransactionId: displayTxId,
                amount: openingSignedBalance,
                type: 'Opening Balance',
                date: new Date().toISOString(),
                createdBy: user.uid,
            });
        }

        if (!portalId) {
            const routePath = `/t/${tenantId}/portal-management/${finalPortalId}`;
            await upsertTenantNotification(tenantId, `notif_portal_create_${finalPortalId}`, {
                title: 'Portal Created',
                detail: `${form.name} was created successfully.`,
                eventType: 'create',
                entityType: 'portal',
                entityId: finalPortalId,
                routePath,
                targetRoles: [],
                createdAt: new Date().toISOString(),
                createdBy: user.uid,
            });
        }

        await createSyncEvent({
            tenantId,
            eventType: portalId ? 'update' : 'create',
            entityType: 'portal',
            entityId: finalPortalId,
            changedFields: Object.keys(portalPayload),
            createdBy: user.uid,
        });

        setStatusMessage(portalId ? 'Portal updated successfully.' : 'Portal created successfully.');
        setStatusType('success');
        setTimeout(() => navigate(`/t/${tenantId}/portal-management`), 1500);
    };

    if (!user || isLoading) return null;

    return (
        <PageShell
            title={portalId ? 'Edit Portal' : 'New Portal'}
            subtitle={portalId ? `Editing ${existingPortal?.name}` : 'Setup a new operational portal.'}
        >
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-xl">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider">
                                Portal Name
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-ring)]"
                                    placeholder="e.g. Main Operating Bank"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className={`block text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider ${portalId ? 'opacity-50' : ''}`}>
                                    {portalId ? 'Current Balance' : 'Opening Balance'}
                                    <input
                                        type="number"
                                        value={form.balance}
                                        onChange={(e) => setForm((p) => ({ ...p, balance: e.target.value }))}
                                        disabled={!!portalId}
                                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-ring)] disabled:cursor-not-allowed"
                                    />
                                </label>
                                {!portalId && Number(form.balance) > 0 && (
                                    <label className={`block text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider ${portalId ? 'opacity-50' : ''}`}>
                                        Balance Type
                                        <select
                                            value={form.balanceType}
                                            onChange={(e) => setForm((p) => ({ ...p, balanceType: e.target.value }))}
                                            disabled={!!portalId}
                                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-ring)] disabled:cursor-not-allowed"
                                        >
                                            <option value="positive">Positive (+)</option>
                                            <option value="negative">Negative (-)</option>
                                        </select>
                                    </label>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="block text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider">Portal Type</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {portalTypes.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => onTypeChange(t.id)}
                                            className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${form.type === t.id
                                                ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/5'
                                                : 'border-[var(--c-border)] bg-white hover:bg-slate-50'
                                                }`}
                                        >
                                            <img src={t.icon} alt={t.label} className="h-8 w-8 object-contain" />
                                            <span className="text-[10px] font-bold uppercase text-slate-600">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <ImageZoomTool
                                sourceUrl={iconSourceUrl || portalTypes.find((t) => t.id === form.type)?.icon}
                                onReset={onIconReset}
                                zoom={iconZoom}
                                setZoom={setIconZoom}
                                offsetX={iconOffsetX}
                                setOffsetX={setIconOffsetX}
                                offsetY={iconOffsetY}
                                setOffsetY={setIconOffsetY}
                                filter={iconFilter}
                                setFilter={setIconFilter}
                                filterMap={iconFilterMap}
                                onFileChange={onIconFileChange}
                                title="Portal Icon Settings"
                                tip="Optional: Customize the icon for this portal."
                                previewBgClass="bg-white"
                                previewFrame={false}
                                previewRoundedClass="rounded-xl"
                            />

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider">Transaction Methods</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {transactionMethods.map((m) => {
                                        const selected = form.methods.includes(m.id);
                                        const firestoreIcon = methodIconMap[String(m.id).toLowerCase()];
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setForm((p) => ({
                                                        ...p,
                                                        methods: selected ? p.methods.filter((id) => id !== m.id) : [...p.methods, m.id],
                                                    }));
                                                }}
                                                className={`flex items-center gap-3 rounded-xl border p-2 transition ${selected
                                                    ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/5'
                                                    : 'border-[var(--c-border)] bg-white hover:bg-slate-50'
                                                    }`}
                                            >
                                                <img src={firestoreIcon || m.icon} alt={m.label} className="h-6 w-6 object-contain" />
                                                <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4 border-t border-[var(--c-border)] pt-6">
                        <button
                            onClick={handleSavePortal}
                            disabled={isSaving}
                            className="rounded-xl bg-[var(--c-accent)] px-8 py-3 font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50"
                        >
                            {isSaving ? 'Processing...' : portalId ? 'Update Portal' : 'Create Portal'}
                        </button>
                        <button
                            onClick={() => navigate(`/t/${tenantId}/portal-management`)}
                            className="rounded-xl border border-[var(--c-border)] px-8 py-3 font-bold text-[var(--c-text)] transition hover:bg-[var(--c-panel)]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {statusMessage && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm animate-pulse ${statusType === 'error'
                            ? 'border-rose-700 bg-[#1b1013] text-rose-200'
                            : statusType === 'success'
                                ? 'border-emerald-700 bg-[#0f1c17] text-emerald-200'
                                : 'border-slate-700 bg-[#141a24] text-slate-200'
                            }`}
                    >
                        {statusMessage}
                    </div>
                )}
            </div>
        </PageShell>
    );
};

export default PortalFormPage;
