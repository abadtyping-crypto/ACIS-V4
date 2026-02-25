import { useState, useEffect, useCallback } from 'react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import {
    fetchTenantPortals,
    upsertTenantPortal,
    deleteTenantPortal,
    upsertTenantTransaction
} from '../../lib/backendStore';
import { uploadPortalIcon } from '../../lib/portalStorage';
import { createSyncEvent } from '../../lib/syncEvents';
import { generateDisplayTxId, toSafeDocId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import ImageZoomTool from '../common/ImageZoomTool';

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

const fallbackPortalIcon = (type) => {
    if (type === 'Bank') return '/portals/bank.png';
    if (type === 'Card Payment') return '/portals/cardpayment.png';
    if (type === 'Petty Cash') return '/portals/pettycash.png';
    if (type === 'Terminal') return '/portals/terminal.png';
    return '/portals/portals.png';
};

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

const PortalSetupSection = ({ isOpen, onToggle, refreshKey }) => {
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const [portals, setPortals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'form'

    // Form State
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [form, setForm] = useState({
        name: '',
        balance: 0,
        balanceType: 'positive',
        type: 'Bank',
        methods: [],
    });
    const [editingPortal, setEditingPortal] = useState(null);

    // Icon State
    const [iconRawUrl, setIconRawUrl] = useState('');
    const [iconSourceUrl, setIconSourceUrl] = useState('');
    const [iconMeta, setIconMeta] = useState({ width: 0, height: 0 });
    const [iconZoom, setIconZoom] = useState(1);
    const [iconOffsetX, setIconOffsetX] = useState(0);
    const [iconOffsetY, setIconOffsetY] = useState(0);
    const [iconFilter, setIconFilter] = useState('natural');
    const [iconDirty, setIconDirty] = useState(false);

    const fetchPortals = useCallback(async () => {
        setIsLoading(true);
        const res = await fetchTenantPortals(tenantId);
        if (res.ok) setPortals(res.rows);
        setIsLoading(false);
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        fetchPortals();
    }, [tenantId, isOpen, fetchPortals, refreshKey]);

    const handleEdit = (p) => {
        setEditingPortal(p);
        setForm({
            name: p.name,
            balance: Number(p.balance || 0),
            balanceType: p.balanceType || 'positive',
            type: p.type || 'Bank',
            methods: p.methods || [],
        });
        setIconSourceUrl(p.iconUrl);
        setIconDirty(false);
        setView('form');
    };

    const handleAddNew = () => {
        if (!canUserPerformAction(tenantId, user, 'createPortal')) {
            setStatus({ message: "You don't have permission to create portals.", type: 'error' });
            return;
        }
        setEditingPortal(null);
        setForm({
            name: '',
            balance: 0,
            balanceType: 'positive',
            type: 'Bank',
            methods: portalTypes[0].methods,
        });
        setIconSourceUrl(portalTypes[0].icon);
        setIconRawUrl('');
        setIconDirty(false);
        setView('form');
    };

    const onTypeChange = (newType) => {
        const typeObj = portalTypes.find((t) => t.id === newType);
        setForm((prev) => ({
            ...prev,
            type: newType,
            methods: typeObj ? typeObj.methods : prev.methods,
        }));
        if (!iconDirty) setIconSourceUrl(typeObj ? typeObj.icon : '');
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
            setStatus({ message: 'Unable to read image file.', type: 'error' });
        }
    };

    const onIconReset = () => {
        setIconRawUrl('');
        const typeIcon = portalTypes.find(t => t.id === form.type)?.icon;
        setIconSourceUrl(typeIcon || '');
        setIconMeta({ width: 0, height: 0 });
        setIconZoom(1);
        setIconOffsetX(0);
        setIconOffsetY(0);
        setIconDirty(false);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setStatus({ message: 'Portal name is required.', type: 'error' });
            return;
        }

        setIsSaving(true);
        const targetPortalId = editingPortal?.id || `portal_${Date.now()}`;
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
                    portalId: targetPortalId,
                    fileBlob: blob,
                    oldIconUrl: editingPortal?.iconUrl,
                });
                if (uploadRes.ok) iconUrl = uploadRes.iconUrl;
                else throw new Error(uploadRes.error);
            } catch (e) {
                setStatus({ message: `Icon processing failed: ${e.message}`, type: 'error' });
                setIsSaving(false);
                return;
            }
        }

        const openingAmount = Number(form.balance) || 0;
        const openingSignedBalance = openingAmount * (form.balanceType === 'negative' ? -1 : 1);
        const payload = {
            name: form.name,
            type: form.type,
            methods: form.methods,
            iconUrl,
            status: editingPortal?.status || 'active',
            createdBy: editingPortal?.createdBy || user.uid,
            createdAt: editingPortal?.createdAt || new Date().toISOString(),
            ...(!editingPortal ? { balance: openingSignedBalance, balanceType: form.balanceType } : {}),
        };

        const res = await upsertTenantPortal(tenantId, targetPortalId, payload);
        if (!res.ok) {
            setStatus({ message: res.error || 'Failed to save portal.', type: 'error' });
            setIsSaving(false);
            return;
        }

        // Opening Balance
        if (!editingPortal && openingAmount > 0) {
            const displayTxId = await generateDisplayTxId(tenantId, 'POR');
            await upsertTenantTransaction(tenantId, toSafeDocId(displayTxId, 'tx'), {
                portalId: targetPortalId,
                displayTransactionId: displayTxId,
                amount: openingSignedBalance,
                type: 'Opening Balance',
                date: new Date().toISOString(),
                createdBy: user.uid,
            });
        }

        await createSyncEvent({
            tenantId,
            eventType: editingPortal ? 'update' : 'create',
            entityType: 'portal',
            entityId: targetPortalId,
            changedFields: Object.keys(payload),
            createdBy: user.uid,
        });

        setStatus({ message: 'Saved successfully!', type: 'success' });
        setTimeout(() => {
            setStatus({ message: '', type: '' });
            setView('list');
            fetchPortals();
        }, 1500);
        setIsSaving(false);
    };

    const handleDelete = async (p) => {
        if (!confirm(`Are you sure you want to delete ${p.name}? It can be recovered from the Recycle Bin.`)) return;
        setIsSaving(true);
        const res = await deleteTenantPortal(tenantId, p.id, user.uid);
        if (res.ok) {
            setStatus({ message: 'Portal moved to Recycle Bin.', type: 'success' });
            fetchPortals();
            setTimeout(() => setStatus({ message: '', type: '' }), 2000);
        } else {
            setStatus({ message: res.error || 'Delete failed.', type: 'error' });
        }
        setIsSaving(false);
    };

    const primaryAction = view === 'list' ? (
        <button
            onClick={handleAddNew}
            className="rounded-xl bg-[var(--c-accent)] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
        >
            Add New
        </button>
    ) : (
        <button
            onClick={() => { setView('list'); setStatus({ message: '', type: '' }); }}
            className="rounded-xl border border-[var(--c-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--c-text)] hover:bg-slate-50 transition"
        >
            Back to List
        </button>
    );

    return (
        <SectionCard
            title="Portal Setup & Configuration"
            subtitle={view === 'form' ? (editingPortal ? `Editing ${editingPortal.name}` : 'Setup a new portal') : 'Manage portal names, types, and methods'}
            defaultOpen={isOpen}
            onToggle={onToggle}
            primaryAction={primaryAction}
        >
            <div className="space-y-4">
                {view === 'list' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {isLoading ? (
                            <p className="col-span-full py-4 text-center text-xs text-[var(--c-muted)]">Loading portals...</p>
                        ) : portals.length === 0 ? (
                            <p className="col-span-full py-4 text-center text-xs text-[var(--c-muted)]">No portals configured yet.</p>
                        ) : (
                            portals.map(p => (
                                <div key={p.id} className="group flex items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm transition hover:border-[var(--c-accent)]">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 overflow-hidden rounded-lg bg-[var(--c-surface)]">
                                            <img
                                                src={p.iconUrl || fallbackPortalIcon(p.type)}
                                                alt={p.name}
                                                className="h-full w-full object-cover"
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = fallbackPortalIcon(p.type);
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-[var(--c-text)]">{p.name}</p>
                                            <p className="text-[10px] text-[var(--c-muted)] uppercase tracking-wider">{p.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="rounded-lg bg-[var(--c-panel)] p-1.5 text-[var(--c-muted)] hover:text-[var(--c-accent)] transition"
                                            title="Edit"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p)}
                                            className="rounded-lg bg-[var(--c-panel)] p-1.5 text-[var(--c-muted)] hover:text-rose-500 transition"
                                            title="Delete"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Left Column: Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Portal Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20"
                                        placeholder="e.g. Operation Bank A"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{editingPortal ? 'Current Balance' : 'Opening Balance'}</label>
                                        <input
                                            type="number"
                                            value={form.balance}
                                            onChange={(e) => setForm(f => ({ ...f, balance: e.target.value }))}
                                            disabled={!!editingPortal}
                                            className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 disabled:opacity-50"
                                        />
                                    </div>
                                    {!editingPortal && Number(form.balance) > 0 && (
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Type</label>
                                            <select
                                                value={form.balanceType}
                                                onChange={(e) => setForm(f => ({ ...f, balanceType: e.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs font-bold outline-none"
                                            >
                                                <option value="positive">Positive (+)</option>
                                                <option value="negative">Negative (-)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Portal Category</label>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        {portalTypes.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => onTypeChange(t.id)}
                                                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${form.type === t.id ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/5' : 'border-[var(--c-border)] bg-white hover:bg-slate-50'}`}
                                            >
                                                <img src={t.icon} alt={t.label} className="h-6 w-6 object-contain" />
                                                <span className="text-[9px] font-bold uppercase text-[var(--c-muted)]">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Icon & Methods */}
                            <div className="space-y-4">
                                <ImageZoomTool
                                    sourceUrl={iconSourceUrl}
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
                                    title="Portal Icon"
                                    previewBgClass="bg-white"
                                    previewFrame={false}
                                    previewRoundedClass="rounded-xl"
                                    compact={true}
                                />

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Allowed Methods</label>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {transactionMethods.map(m => {
                                            const active = form.methods.includes(m.id);
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setForm(f => ({
                                                        ...f,
                                                        methods: active ? f.methods.filter(id => id !== m.id) : [...f.methods, m.id]
                                                    }))}
                                                    className={`flex items-center gap-2 rounded-xl border p-2 transition ${active ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/5' : 'border-[var(--c-border)] bg-white hover:bg-slate-50'}`}
                                                >
                                                    <img src={m.icon} alt={m.label} className="h-4 w-4 object-contain" />
                                                    <span className="text-[10px] font-bold text-[var(--c-text)]">{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        {status.message && (
                            <div className={`rounded-xl border p-3 text-xs font-bold text-center animate-pulse ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                                {status.message}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-[var(--c-border)]">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 rounded-xl bg-[var(--c-accent)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 hover:opacity-90 disabled:opacity-50 transition"
                            >
                                {isSaving ? 'Saving...' : editingPortal ? 'Update Portal' : 'Create Portal'}
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className="flex-1 rounded-xl border border-[var(--c-border)] py-3 text-sm font-bold text-[var(--c-text)] hover:bg-[var(--c-panel)] transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SectionCard>
    );
};

export default PortalSetupSection;
