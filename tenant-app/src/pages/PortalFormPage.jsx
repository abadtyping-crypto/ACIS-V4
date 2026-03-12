import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useAuth } from '../context/useAuth';
import { useTenant } from '../context/TenantContext';
import { createSyncEvent } from '../lib/syncEvents';
import { buildNotificationPayload, generateNotificationId } from '../lib/notificationTemplate';
import {
    fetchTenantPortals,
    upsertTenantPortal,
    upsertTenantNotification,
    upsertTenantPortalTransaction,
    generateDisplayPortalId,
} from '../lib/backendStore';
import { canUserPerformAction } from '../lib/userControlPreferences';
import { generateDisplayTxId, toSafeDocId } from '../lib/txIdGenerator';
import { fetchApplicationIconLibrary, upsertApplicationIcon } from '../lib/applicationIconLibraryStore';
import { toSafeDocId as toSafeIconId } from '../lib/idUtils';
import { uploadApplicationIconAsset, validateApplicationIconFile } from '../lib/applicationIconStorage';
import {
    ALLOWED_METHOD_IDS,
    TRANSACTION_METHODS,
    buildMethodIconMap,
    resolveMethodIconUrl,
} from '../lib/transactionMethodConfig';

const portalTypes = [
    { id: 'Bank', label: 'Bank', icon: '/portals/bank.png', methods: ALLOWED_METHOD_IDS },
    { id: 'Card Payment', label: 'Card Payment', icon: '/portals/cardpayment.png', methods: ALLOWED_METHOD_IDS },
    { id: 'Petty Cash', label: 'Petty Cash', icon: '/portals/pettycash.png', methods: ALLOWED_METHOD_IDS },
    { id: 'Portals', label: 'Portals', icon: '/portals/portals.png', methods: ALLOWED_METHOD_IDS },
    { id: 'Terminal', label: 'Terminal', icon: '/portals/terminal.png', methods: ALLOWED_METHOD_IDS },
];

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
    const [selectedIconUrl, setSelectedIconUrl] = useState('');
    const [methodIconMap, setMethodIconMap] = useState({});
    const [iconLibrary, setIconLibrary] = useState([]);
    const [newIconName, setNewIconName] = useState('');
    const [newIconFile, setNewIconFile] = useState(null);
    const [isAddingIcon, setIsAddingIcon] = useState(false);
    const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);

    const loadIconLibrary = useCallback(async () => {
        const res = await fetchApplicationIconLibrary(tenantId);
        if (!res.ok) return false;
        setMethodIconMap(buildMethodIconMap(res.rows || []));
        setIconLibrary((res.rows || []).filter((r) => !!r.iconUrl));
        return true;
    }, [tenantId]);

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
                    setSelectedIconUrl(p.iconUrl || '');
                }
            }
            setIsLoading(false);
        });
    }, [tenantId, portalId]);

    useEffect(() => {
        if (!tenantId) return;
        let isMounted = true;
        loadIconLibrary().then((ok) => {
            if (!isMounted || !ok) return;
        });
        return () => {
            isMounted = false;
        };
    }, [tenantId, loadIconLibrary]);

    const handleNewIconFile = (event) => {
        const file = event.target.files?.[0] || null;
        event.target.value = '';
        if (!file) return;
        const validationError = validateApplicationIconFile(file);
        if (validationError) {
            setStatusMessage(validationError);
            setStatusType('error');
            return;
        }
        setNewIconFile(file);
        setStatusMessage('');
        setStatusType('info');
    };

    const handleAddIconToLibrary = async () => {
        const trimmedName = String(newIconName || '').trim();
        if (!trimmedName) {
            setStatusMessage('Icon name is required.');
            setStatusType('error');
            return;
        }
        if (!newIconFile) {
            setStatusMessage('Choose an icon image to upload.');
            setStatusType('error');
            return;
        }

        const iconId = toSafeIconId(trimmedName, 'app_icon');
        setIsAddingIcon(true);
        try {
            const uploadRes = await uploadApplicationIconAsset({
                tenantId,
                iconId,
                fileBlob: newIconFile,
            });
            if (!uploadRes.ok) {
                setStatusMessage(uploadRes.error || 'Icon upload failed.');
                setStatusType('error');
                return;
            }

            const saveRes = await upsertApplicationIcon(
                tenantId,
                iconId,
                {
                    iconName: trimmedName,
                    iconUrl: uploadRes.iconUrl,
                    createdBy: user.uid,
                    updatedBy: user.uid,
                },
                { isCreate: true },
            );
            if (!saveRes.ok) {
                setStatusMessage(saveRes.error || 'Failed to save icon library record.');
                setStatusType('error');
                return;
            }

            await createSyncEvent({
                tenantId,
                eventType: 'create',
                entityType: 'applicationIcon',
                entityId: iconId,
                changedFields: ['iconName', 'iconUrl', 'updatedBy'],
                createdBy: user.uid,
            });

            await loadIconLibrary();
            setSelectedIconUrl(uploadRes.iconUrl);
            setNewIconName('');
            setNewIconFile(null);
            setStatusMessage('Icon added to library and selected.');
            setStatusType('success');
        } finally {
            setIsAddingIcon(false);
        }
    };

    const onTypeChange = (newType) => {
        const typeObj = portalTypes.find((t) => t.id === newType);
        setForm((prev) => ({
            ...prev,
            type: newType,
            methods: typeObj ? typeObj.methods : prev.methods,
        }));
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
        const finalPortalId = portalId || await generateDisplayPortalId(tenantId);
        let iconUrl = selectedIconUrl || portalTypes.find((t) => t.id === form.type)?.icon || '';

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
            await upsertTenantNotification(
                tenantId,
                generateNotificationId({ topic: 'finance', subTopic: 'portal' }),
                buildNotificationPayload({
                    topic: 'finance',
                    subTopic: 'portal',
                    type: 'create',
                    title: 'Portal Created',
                    detail: `${form.name} was created successfully.`,
                    createdBy: user.uid,
                    routePath,
                    actionPresets: ['view'],
                    extra: {
                        eventType: 'create',
                        entityType: 'portal',
                        entityId: finalPortalId,
                    },
                }),
            );
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider">Custom Portal Icon</p>
                                    <button
                                        type="button"
                                        onClick={() => setIsLibraryPanelOpen((prev) => !prev)}
                                        className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-bold text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
                                    >
                                        {isLibraryPanelOpen ? 'Hide Library' : 'Show Library'}
                                    </button>
                                </div>
                                {isLibraryPanelOpen ? (
                                    <>
                                        {iconLibrary.length > 0 ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-3">
                                                {iconLibrary.map((item) => {
                                                    const isSelected = selectedIconUrl === item.iconUrl;
                                                    return (
                                                        <button
                                                            key={item.iconId}
                                                            type="button"
                                                            onClick={() => setSelectedIconUrl(isSelected ? '' : item.iconUrl)}
                                                            className={`aspect-square w-full rounded-xl flex items-center justify-center p-2.5 transition border ${isSelected
                                                                ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/10 ring-2 ring-[var(--c-accent)] ring-offset-2 ring-offset-[var(--c-surface)]'
                                                                : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:border-[var(--c-muted)]'
                                                                }`}
                                                        >
                                                            <img
                                                                src={item.iconUrl}
                                                                alt="Icon"
                                                                className="h-full w-full object-contain"
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-4 text-center text-sm text-[var(--c-muted)]">
                                                No custom icons available.
                                            </div>
                                        )}

                                        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
                                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Add New Icon to Library</p>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                <input
                                                    type="text"
                                                    value={newIconName}
                                                    onChange={(event) => setNewIconName(event.target.value)}
                                                    placeholder="Icon Name (e.g. hotel_portal)"
                                                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm text-[var(--c-text)] outline-none focus:ring-2 focus:ring-[var(--c-ring)]"
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                    onChange={handleNewIconFile}
                                                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm text-[var(--c-text)] outline-none"
                                                />
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddIconToLibrary}
                                                    disabled={isAddingIcon}
                                                    className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-xs font-bold text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] disabled:opacity-50"
                                                >
                                                    {isAddingIcon ? 'Adding...' : 'Add to Library'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3 text-xs text-[var(--c-muted)]">
                                        Library is hidden while you edit logo. Click "Show Library" only if you need to pick/add an icon.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-[var(--c-muted)] uppercase tracking-wider">Transaction Methods</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {TRANSACTION_METHODS.map((m) => {
                                        const selected = form.methods.includes(m.id);
                                        const firestoreIcon = resolveMethodIconUrl(methodIconMap, m.id);
                                        const MethodIcon = m.Icon;
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
                                                {firestoreIcon ? (
                                                    <img src={firestoreIcon} alt={m.label} className="h-6 w-6 object-contain" />
                                                ) : (
                                                    <MethodIcon className="h-5 w-5 text-slate-600" />
                                                )}
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

