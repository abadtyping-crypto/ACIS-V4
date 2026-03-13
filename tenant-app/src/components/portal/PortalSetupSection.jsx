import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ImageIcon, Layers, ListChecks, Wallet } from 'lucide-react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/useAuth';
import {
    fetchTenantPortals,
    upsertTenantPortal,
    deleteTenantPortal,
    upsertTenantPortalTransaction,
    generateDisplayPortalId,
} from '../../lib/backendStore';
import { uploadPortalIcon } from '../../lib/portalStorage';
import { createSyncEvent } from '../../lib/syncEvents';
import { generateNotificationId } from '../../lib/notificationTemplate';
import { sendUniversalNotification } from '../../lib/notificationDrafting';
import { generateDisplayTxId, toSafeDocId } from '../../lib/txIdGenerator';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import { fetchApplicationIconLibrary, upsertApplicationIcon } from '../../lib/applicationIconLibraryStore';
import { toSafeDocId as toSafeIconId } from '../../lib/idUtils';
import { uploadApplicationIconAsset, validateApplicationIconFile } from '../../lib/applicationIconStorage';
import ImageStudio from '../common/ImageStudio';
import DirhamIcon from '../common/DirhamIcon';
import { getCroppedImg } from '../../lib/imageStudioUtils';
import {
    DEFAULT_PORTAL_CATEGORIES,
    buildMethodIconMap,
    createCustomCategoryDefinition,
    createCustomMethodDefinition,
    resolveCategoryMethodIds,
    resolvePortalCategories,
    resolvePortalCategory,
    resolvePortalMethodById,
    resolvePortalMethodDefinitions,
    resolveMethodIconUrl,
    sanitizePortalEntityName,
} from '../../lib/transactionMethodConfig';

const portalTypes = DEFAULT_PORTAL_CATEGORIES;

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

const iconBadgeBaseClass = 'inline-flex items-center justify-center rounded-md';

const ICON_OUTPUT_SIZE = 256;
const ICON_MAX_BYTES = 100 * 1024;

const PortalSetupSection = ({ isOpen, onToggle, refreshKey }) => {
    const navigate = useNavigate();
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
        customCategories: [],
        customMethods: [],
    });
    const [editingPortal, setEditingPortal] = useState(null);

    // Icon State
    const [iconRawUrl, setIconRawUrl] = useState('');
    const [iconSourceUrl, setIconSourceUrl] = useState('');
    const [selectedPortalIconUrl, setSelectedPortalIconUrl] = useState('');
    const [iconZoom, setIconZoom] = useState(1);
    const [iconRotation, setIconRotation] = useState(0);
    const [iconFilter, setIconFilter] = useState('natural');
    const [iconDirty, setIconDirty] = useState(false);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [methodIconMap, setMethodIconMap] = useState({});
    const [iconLibrary, setIconLibrary] = useState([]);
    const [newIconName, setNewIconName] = useState('');
    const [newIconFile, setNewIconFile] = useState(null);
    const [newIconSourceUrl, setNewIconSourceUrl] = useState('');
    const [newIconZoom, setNewIconZoom] = useState(1);
    const [newIconRotation, setNewIconRotation] = useState(0);
    const [newIconCroppedAreaPixels, setNewIconCroppedAreaPixels] = useState(null);
    const [isAddingLibraryIcon, setIsAddingLibraryIcon] = useState(false);
    const [isLogoStudioOpen, setIsLogoStudioOpen] = useState(false);
    const [isLibraryStudioOpen, setIsLibraryStudioOpen] = useState(false);
    const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
    const [libraryTarget, setLibraryTarget] = useState('portalIcon');
    const [isCustomCategoryOpen, setIsCustomCategoryOpen] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState('');
    const [customCategoryIconUrl, setCustomCategoryIconUrl] = useState('');
    const [isCustomMethodOpen, setIsCustomMethodOpen] = useState(false);
    const [customMethodName, setCustomMethodName] = useState('');
    const [customMethodIconUrl, setCustomMethodIconUrl] = useState('');

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
        setIconDirty(true);
    }, []);

    const onLibraryCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setNewIconCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const setRotationWrapper = (val) => {
        setIconRotation(val);
        setIconDirty(true);
    };

    const setLibraryRotationWrapper = (val) => {
        setNewIconRotation(val);
    };

    const fetchPortals = useCallback(async () => {
        setIsLoading(true);
        const res = await fetchTenantPortals(tenantId);
        if (res.ok) setPortals(res.rows);
        setIsLoading(false);
    }, [tenantId]);

    const loadIconLibrary = useCallback(async () => {
        const res = await fetchApplicationIconLibrary(tenantId);
        if (!res.ok) return false;
        setMethodIconMap(buildMethodIconMap(res.rows || []));
        setIconLibrary((res.rows || []).filter((row) => !!row.iconUrl));
        return true;
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        fetchPortals();
    }, [tenantId, isOpen, fetchPortals, refreshKey]);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        let isMounted = true;
        loadIconLibrary().then((ok) => {
            if (!isMounted || !ok) return;
        });
        return () => {
            isMounted = false;
        };
    }, [tenantId, isOpen, refreshKey, loadIconLibrary]);

    const handleEdit = (p) => {
        setEditingPortal(p);
        setForm({
            name: p.name,
            balance: Number(p.balance || 0),
            balanceType: p.balanceType || 'positive',
            type: p.type || 'Bank',
            methods: p.methods || [],
            customCategories: Array.isArray(p.customCategories) ? p.customCategories : [],
            customMethods: Array.isArray(p.customMethods) ? p.customMethods : [],
        });
        setIconSourceUrl(p.logoUrl || '');
        setSelectedPortalIconUrl(p.iconUrl || '');
        setIconRotation(0);
        setIconDirty(false);
        setCroppedAreaPixels(null);
        setIsLogoStudioOpen(false);
        setIsLibraryPanelOpen(false);
        setNewIconName('');
        setNewIconFile(null);
        setNewIconSourceUrl('');
        setNewIconZoom(1);
        setNewIconRotation(0);
        setNewIconCroppedAreaPixels(null);
        setIsLibraryStudioOpen(false);
        setIsCustomCategoryOpen(false);
        setCustomCategoryName('');
        setCustomCategoryIconUrl('');
        setIsCustomMethodOpen(false);
        setCustomMethodName('');
        setCustomMethodIconUrl('');
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
            methods: resolveCategoryMethodIds(portalTypes[0].id, []),
            customCategories: [],
            customMethods: [],
        });
        setIconSourceUrl('');
        setSelectedPortalIconUrl(portalTypes[0].icon);
        setIconRawUrl('');
        setIconRotation(0);
        setIconDirty(false);
        setCroppedAreaPixels(null);
        setIsLogoStudioOpen(false);
        setIsLibraryPanelOpen(false);
        setNewIconName('');
        setNewIconFile(null);
        setNewIconSourceUrl('');
        setNewIconZoom(1);
        setNewIconRotation(0);
        setNewIconCroppedAreaPixels(null);
        setIsLibraryStudioOpen(false);
        setIsCustomCategoryOpen(false);
        setCustomCategoryName('');
        setCustomCategoryIconUrl('');
        setIsCustomMethodOpen(false);
        setCustomMethodName('');
        setCustomMethodIconUrl('');
        setView('form');
    };

    const onTypeChange = (newType) => {
        const typeObj = resolvePortalCategory(newType, form.customCategories);
        setForm((prev) => ({
            ...prev,
            type: newType,
            methods: typeObj ? typeObj.methodIds : prev.methods,
        }));
        if (!selectedPortalIconUrl) setSelectedPortalIconUrl(typeObj ? typeObj.icon : '');
    };

    const onIconFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            const nextUrl = URL.createObjectURL(file);
            setIconRawUrl(nextUrl);
            setIconSourceUrl(nextUrl);
            setIconZoom(1);
            setIconRotation(0);
            setIconDirty(true);
            setCroppedAreaPixels(null);
            setIsLogoStudioOpen(true);
        } catch (e) {
            console.error(e);
            setStatus({ message: 'Unable to read image file.', type: 'error' });
        }
    };

    const onIconReset = () => {
        setIconRawUrl('');
        setIconSourceUrl('');
        setIconZoom(1);
        setIconRotation(0);
        setIconDirty(false);
        setCroppedAreaPixels(null);
        setIsLogoStudioOpen(false);
    };

    const handleSelectLibraryIcon = (iconUrl) => {
        if (!iconUrl) return;
        if (libraryTarget === 'customCategory') {
            setCustomCategoryIconUrl(iconUrl);
            return;
        }
        if (libraryTarget === 'customMethod') {
            setCustomMethodIconUrl(iconUrl);
            return;
        }
        setSelectedPortalIconUrl(iconUrl);
        setIsLibraryPanelOpen(false);
    };

    const handleNewLibraryIconFile = (event) => {
        const file = event.target.files?.[0] || null;
        event.target.value = '';
        if (!file) return;
        const validationError = validateApplicationIconFile(file);
        if (validationError) {
            setStatus({ message: validationError, type: 'error' });
            return;
        }
        setNewIconFile(file);
        const nextUrl = URL.createObjectURL(file);
        setNewIconSourceUrl(nextUrl);
        setNewIconZoom(1);
        setNewIconRotation(0);
        setNewIconCroppedAreaPixels(null);
        setIsLibraryStudioOpen(true);
        setStatus({ message: '', type: '' });
    };

    const resetLibraryIconDraft = () => {
        setNewIconFile(null);
        setNewIconSourceUrl('');
        setNewIconZoom(1);
        setNewIconRotation(0);
        setNewIconCroppedAreaPixels(null);
        setIsLibraryStudioOpen(false);
    };

    const handleAddLibraryIcon = async () => {
        const trimmedName = String(newIconName || '').trim();
        if (!trimmedName) {
            setStatus({ message: 'Icon name is required.', type: 'error' });
            return;
        }
        if (!newIconFile) {
            setStatus({ message: 'Choose an icon image first.', type: 'error' });
            return;
        }

        const iconId = toSafeIconId(trimmedName, 'app_icon');
        setIsAddingLibraryIcon(true);
        try {
            const uploadBlob = newIconSourceUrl && newIconCroppedAreaPixels
                ? await getCroppedImg(
                    newIconSourceUrl,
                    newIconCroppedAreaPixels,
                    newIconRotation,
                    'natural',
                    ICON_OUTPUT_SIZE,
                    ICON_MAX_BYTES
                )
                : newIconFile;

            const uploadRes = await uploadApplicationIconAsset({
                tenantId,
                iconId,
                fileBlob: uploadBlob,
            });
            if (!uploadRes.ok) {
                setStatus({ message: uploadRes.error || 'Icon upload failed.', type: 'error' });
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
                setStatus({ message: saveRes.error || 'Failed to save icon record.', type: 'error' });
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
            handleSelectLibraryIcon(uploadRes.iconUrl);
            setNewIconName('');
            resetLibraryIconDraft();
            setStatus({ message: 'Icon added to library and selected.', type: 'success' });
        } finally {
            setIsAddingLibraryIcon(false);
        }
    };

    const handleAddCustomCategory = () => {
        const label = sanitizePortalEntityName(customCategoryName, '');
        if (!label) {
            setStatus({ message: 'Category name is required.', type: 'error' });
            return;
        }

        const categoryId = toSafeIconId(label, 'portal_category');
        const exists = resolvePortalCategories(form.customCategories).some((item) => item.id === categoryId);
        if (exists) {
            setStatus({ message: 'Category name already exists.', type: 'error' });
            return;
        }

        const nextCategory = createCustomCategoryDefinition({
            id: categoryId,
            label,
            iconUrl: customCategoryIconUrl || '',
            methodIds: [],
        });

        setForm((prev) => ({
            ...prev,
            type: nextCategory.id,
            methods: [],
            customCategories: [...prev.customCategories, nextCategory],
        }));
        setSelectedPortalIconUrl(nextCategory.icon);
        setIsCustomCategoryOpen(false);
        setIsLibraryPanelOpen(false);
        setLibraryTarget('portalIcon');
        setCustomCategoryName('');
        setCustomCategoryIconUrl('');
        setStatus({ message: 'Custom category added.', type: 'success' });
    };

    const handleAddCustomMethod = () => {
        const label = sanitizePortalEntityName(customMethodName, '');
        if (!label) {
            setStatus({ message: 'Transaction method name is required.', type: 'error' });
            return;
        }

        const methodId = toSafeIconId(label, 'portal_method');
        const exists = resolvePortalMethodDefinitions(form.customMethods).some((item) => item.id === methodId);
        if (exists) {
            setStatus({ message: 'Transaction method already exists.', type: 'error' });
            return;
        }

        const nextMethod = createCustomMethodDefinition({
            id: methodId,
            label,
            iconUrl: customMethodIconUrl || '',
        });

        setForm((prev) => {
            const nextCustomMethods = [...prev.customMethods, nextMethod];
            const nextCustomCategories = prev.customCategories.map((category) =>
                category.id === prev.type
                    ? { ...category, methodIds: [...new Set([...(category.methodIds || []), methodId])] }
                    : category
            );
            const activeType = resolvePortalCategory(prev.type, prev.customCategories);
            const nextMethods = activeType?.isCustom
                ? [...new Set([...prev.methods, methodId])]
                : prev.methods;

            return {
                ...prev,
                methods: nextMethods,
                customMethods: nextCustomMethods,
                customCategories: nextCustomCategories,
            };
        });

        setIsCustomMethodOpen(false);
        setIsLibraryPanelOpen(false);
        setLibraryTarget('portalIcon');
        setCustomMethodName('');
        setCustomMethodIconUrl('');
        setStatus({ message: 'Custom method added.', type: 'success' });
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setStatus({ message: 'Portal name is required.', type: 'error' });
            return;
        }

        setIsSaving(true);
        const targetPortalId = editingPortal?.id || await generateDisplayPortalId(tenantId);
        let logoUrl = editingPortal?.logoUrl || '';
        const activeCategory = resolvePortalCategory(form.type, form.customCategories);
        const iconUrl = selectedPortalIconUrl || activeCategory?.icon || fallbackPortalIcon(form.type);

        if (iconDirty && iconRawUrl && croppedAreaPixels) {
            try {
                const blob = await getCroppedImg(
                    iconRawUrl,
                    croppedAreaPixels,
                    iconRotation,
                    iconFilter,
                    ICON_OUTPUT_SIZE,
                    ICON_MAX_BYTES
                );
                const uploadRes = await uploadPortalIcon({
                    tenantId,
                    portalId: targetPortalId,
                    fileBlob: blob,
                    oldIconUrl: editingPortal?.logoUrl,
                });
                if (uploadRes.ok) logoUrl = uploadRes.iconUrl;
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
            logoUrl,
            customCategories: form.customCategories,
            customMethods: form.customMethods,
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
            await upsertTenantPortalTransaction(tenantId, toSafeDocId(displayTxId, 'portal_tx'), {
                portalId: targetPortalId,
                displayTransactionId: displayTxId,
                amount: openingSignedBalance,
                type: 'Opening Balance',
                date: new Date().toISOString(),
                createdBy: user.uid,
            });
        }

        if (!editingPortal) {
            const routePath = `/t/${tenantId}/portal-management/${targetPortalId}`;
            const notificationWrite = await sendUniversalNotification({
                tenantId,
                notificationId: generateNotificationId({ topic: 'finance', subTopic: 'portal' }),
                topic: 'finance',
                subTopic: 'portal',
                type: 'create',
                title: 'Portal Created',
                message: `${form.name} was created successfully.`,
                createdBy: user.uid,
                routePath,
                actionPresets: ['view'],
                eventType: 'create',
                entityType: 'portal',
                entityId: targetPortalId,
                entityLabel: form.name,
                pageKey: 'portalManagement',
                sectionKey: 'portalSetup',
                quickView: {
                    badge: 'Portal',
                    title: form.name,
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

            if (!notificationWrite.ok) {
                await sendUniversalNotification({
                    tenantId,
                    notificationId: generateNotificationId({ topic: 'finance', subTopic: 'portal', at: Date.now() + 1 }),
                    topic: 'finance',
                    subTopic: 'portal',
                    type: 'create',
                    title: 'Portal Created',
                    message: `${form.name} was created successfully.`,
                    createdBy: user.uid,
                    routePath,
                    actionPresets: ['view'],
                    eventType: 'create',
                    entityType: 'portal',
                    entityId: targetPortalId,
                    entityLabel: form.name,
                    pageKey: 'portalManagement',
                    sectionKey: 'portalSetup',
                    quickView: {
                        badge: 'Portal',
                        title: form.name,
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
            className="rounded-xl bg-(--c-accent) px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
        >
            Add New
        </button>
    ) : (
        <button
            onClick={() => { setView('list'); setStatus({ message: '', type: '' }); }}
            className="rounded-xl border border-(--c-border) bg-(--c-panel) px-3 py-1.5 text-xs font-bold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent)"
        >
            Back to List
        </button>
    );

    const portalCategories = resolvePortalCategories(form.customCategories);
    const activeCategory = resolvePortalCategory(form.type, form.customCategories);
    const methodDefinitions = resolvePortalMethodDefinitions(form.customMethods);
    const visibleMethods = methodDefinitions.filter((item) => (activeCategory?.methodIds || []).includes(item.id));
    const portalIconPreviewUrl = selectedPortalIconUrl || activeCategory?.icon || fallbackPortalIcon(form.type);

    return (
        <SectionCard
            title="Portal Setup & Configuration"
            subtitle={view === 'form' ? (editingPortal ? `Editing ${editingPortal.name}` : 'Setup a new portal') : 'Manage portal names, types, and methods'}
            defaultOpen={isOpen}
            onToggle={onToggle}
            primaryAction={primaryAction}
            titleIcon={Building2}
        >
            <div className="space-y-4">
                {view === 'list' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {isLoading ? (
                            <p className="col-span-full py-4 text-center text-xs text-(--c-muted)">Loading portals...</p>
                        ) : portals.length === 0 ? (
                            <p className="col-span-full py-4 text-center text-xs text-(--c-muted)">No portals configured yet.</p>
                        ) : (
                            portals.map(p => (
                                <div key={p.id} className="group flex items-center justify-between rounded-xl border border-(--c-border) bg-(--c-surface) p-3 shadow-sm transition hover:border-(--c-accent)">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)] p-1">
                                            <img
                                                src={p.iconUrl || fallbackPortalIcon(p.type)}
                                                alt={p.name}
                                                className="h-full w-full object-contain"
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = fallbackPortalIcon(p.type);
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-(--c-text)">{p.name}</p>
                                            <p className="text-[10px] text-(--c-muted) uppercase tracking-wider">{p.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => navigate(`/t/${tenantId}/portal-management/${p.id}`)}
                                            className="rounded-lg bg-(--c-panel) p-1.5 text-(--c-muted) hover:text-(--c-accent) transition"
                                            title="Open details"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3h7m0 0v7m0-7L10 14" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5h6m-6 0v14h14v-6" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="rounded-lg bg-(--c-panel) p-1.5 text-(--c-muted) hover:text-(--c-accent) transition"
                                            title="Edit"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p)}
                                            className="rounded-lg bg-(--c-panel) p-1.5 text-(--c-muted) hover:text-rose-500 transition"
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
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-(--c-muted)">
                                        <Building2 className="h-3.5 w-3.5 text-(--c-accent)" />
                                        Portal Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="mt-1 w-full rounded-xl border border-(--c-border) bg-(--c-surface) px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-(--c-accent)/20"
                                        placeholder="e.g. Operation Bank A"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-(--c-muted)">
                                            <Wallet className="h-3.5 w-3.5 text-(--c-accent)" />
                                            {editingPortal ? 'Current Balance' : 'Opening Balance'}
                                        </label>
                                        <div className="relative mt-1">
                                            <DirhamIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--c-muted)" />
                                            <input
                                                type="number"
                                                value={form.balance}
                                                onChange={(e) => setForm(f => ({ ...f, balance: e.target.value }))}
                                                disabled={!!editingPortal}
                                                className="w-full rounded-xl border border-(--c-border) bg-(--c-surface) pl-8 pr-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-(--c-accent)/20 disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    {!editingPortal && Number(form.balance) > 0 && (
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-(--c-muted)">Type</label>
                                            <select
                                                value={form.balanceType}
                                                onChange={(e) => setForm(f => ({ ...f, balanceType: e.target.value }))}
                                                className="mt-1 w-full rounded-xl border border-(--c-border) bg-(--c-surface) px-3 py-2 text-xs font-bold outline-none"
                                            >
                                                <option value="positive">Positive (+)</option>
                                                <option value="negative">Negative (-)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-(--c-muted)">
                                        <Layers className="h-3.5 w-3.5 text-(--c-accent)" />
                                        Portal Category
                                    </label>
                                    <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
                                        {portalCategories.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => onTypeChange(t.id)}
                                                className={`flex flex-col items-center gap-1.5 rounded-xl border bg-(--c-surface) p-2 transition ${form.type === t.id ? 'border-(--c-accent) shadow-sm ring-1 ring-(--c-accent)/20' : 'border-(--c-border) hover:border-(--c-accent)/30'}`}
                                            >
                                                <span className={`${iconBadgeBaseClass} h-11 w-11 rounded-lg bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)] ${form.type === t.id ? 'ring-1 ring-(--c-accent)/30' : ''}`}>
                                                    <img src={t.icon} alt={t.label} className="h-10 w-10 object-contain" />
                                                </span>
                                                <span className="text-[9px] font-bold uppercase text-(--c-text)">{t.label}</span>
                                                {t.isCustom && (
                                                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-(--c-accent)">Custom</span>
                                                )}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomCategoryOpen((prev) => !prev);
                                                setLibraryTarget('customCategory');
                                                setIsLibraryPanelOpen(true);
                                            }}
                                            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-(--c-accent)/60 bg-(--c-panel) p-3 text-center transition hover:border-(--c-accent)"
                                        >
                                            <span className={`${iconBadgeBaseClass} h-11 w-11 rounded-lg bg-(--c-accent)/10 text-(--c-accent)`}>+</span>
                                            <span className="text-[9px] font-bold uppercase text-(--c-text)">Add New Category</span>
                                        </button>
                                    </div>
                                    {isCustomCategoryOpen && (
                                        <div className="mt-3 space-y-2 rounded-xl border border-(--c-border) bg-(--c-surface) p-3">
                                            <input
                                                type="text"
                                                value={customCategoryName}
                                                onChange={(event) => setCustomCategoryName(event.target.value)}
                                                placeholder="Category name"
                                                className="w-full rounded-xl border border-(--c-border) bg-(--c-panel) px-3 py-2 text-xs font-bold text-(--c-text) outline-none"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 overflow-hidden rounded-xl border border-(--c-border) bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)] p-1">
                                                    <img
                                                        src={customCategoryIconUrl || '/portals/portals.png'}
                                                        alt="Category icon preview"
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <div className="text-[11px] text-(--c-muted)">
                                                    Choose from library or add a new icon below, then create the category.
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomCategory}
                                                    className="rounded-lg bg-(--c-accent) px-3 py-2 text-[10px] font-bold text-white transition hover:opacity-90"
                                                >
                                                    Save Category
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomCategoryOpen(false);
                                                        setCustomCategoryName('');
                                                        setCustomCategoryIconUrl('');
                                                    }}
                                                    className="rounded-lg border border-(--c-border) bg-(--c-panel) px-3 py-2 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent)"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Icon & Methods */}
                            <div className="space-y-4">
                                <div className="rounded-xl border border-(--c-border) bg-(--c-surface) p-3">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--c-muted)">
                                            <ImageIcon className="h-3.5 w-3.5 text-(--c-accent)" />
                                            Portal Logo
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsLogoStudioOpen((prev) => !prev)}
                                            className="rounded-lg border border-(--c-border) bg-(--c-panel) px-2.5 py-1 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent)"
                                        >
                                            {isLogoStudioOpen ? 'Close Logo' : 'Add Logo'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-15 w-15 overflow-hidden rounded-lg border border-(--c-border) bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)]">
                                            <img
                                                src={iconSourceUrl || fallbackPortalIcon(form.type)}
                                                alt="Portal logo preview"
                                                className="h-full w-full object-contain p-0"
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = fallbackPortalIcon(form.type);
                                                }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-(--c-muted)">
                                            Existing logo remains unchanged unless you explicitly update it.
                                        </p>
                                    </div>
                                </div>

                                {isLogoStudioOpen && (
                                    <ImageStudio
                                        sourceUrl={iconSourceUrl}
                                        onReset={onIconReset}
                                        zoom={iconZoom}
                                        setZoom={setIconZoom}
                                        rotation={iconRotation}
                                        setRotation={setRotationWrapper}
                                        filter={iconFilter}
                                        setFilter={setIconFilter}
                                        filterMap={iconFilterMap}
                                        onFileChange={onIconFileChange}
                                        onCropComplete={onCropComplete}
                                        title="Portal Icon Studio"
                                        previewBgClass="bg-white"
                                        previewFrame={false}
                                        previewRoundedClass="rounded-xl"
                                        showFilters={false}
                                        compact={true}
                                    />
                                )}

                                <div className="rounded-xl border border-(--c-border) bg-(--c-surface) p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-(--c-muted)">Portal Icon</p>
                                            <p className="mt-1 text-[11px] text-(--c-muted)">Choose a library icon for the portal tile. Logo and icon stay separate.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLibraryTarget('portalIcon');
                                                    setIsLibraryPanelOpen((prev) => (libraryTarget === 'portalIcon' ? !prev : true));
                                                }}
                                                className="rounded-lg border border-(--c-border) bg-(--c-panel) px-2 py-1 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent)"
                                            >
                                                Choose Icon
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLibraryTarget('portalIcon');
                                                    setIsLibraryPanelOpen(true);
                                                }}
                                                className="rounded-lg border border-(--c-border) bg-(--c-panel) px-2 py-1 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent)"
                                            >
                                                Add New Icon
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-15 w-15 overflow-hidden rounded-lg border border-(--c-border) bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)] p-1">
                                            <img
                                                src={portalIconPreviewUrl}
                                                alt="Portal icon preview"
                                                className="h-full w-full object-contain"
                                                onError={(event) => {
                                                    event.currentTarget.onerror = null;
                                                    event.currentTarget.src = fallbackPortalIcon(form.type);
                                                }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-(--c-muted)">
                                            This icon is used in portal cards, menus, and selectors.
                                        </p>
                                    </div>

                                    {isLibraryPanelOpen ? (
                                        <>
                                            <p className="mt-3 text-[11px] text-(--c-muted)">
                                                {libraryTarget === 'customCategory'
                                                    ? 'Choose an icon for the new category or upload one from your computer.'
                                                    : libraryTarget === 'customMethod'
                                                        ? 'Choose an icon for the new transaction method or upload one from your computer.'
                                                        : 'Choose from the icon library or add a new icon from your computer.'}
                                            </p>
                                            {iconLibrary.length > 0 ? (
                                                <div className="mt-2 grid grid-cols-5 gap-2">
                                                    {iconLibrary.map((item) => {
                                                        const selectedUrl = libraryTarget === 'customCategory'
                                                            ? customCategoryIconUrl
                                                            : libraryTarget === 'customMethod'
                                                                ? customMethodIconUrl
                                                                : selectedPortalIconUrl;
                                                        const isSelected = selectedUrl === item.iconUrl;
                                                        return (
                                                            <button
                                                                key={item.iconId}
                                                                type="button"
                                                                onClick={() => handleSelectLibraryIcon(item.iconUrl)}
                                                                className={`h-11 w-11 rounded-lg border border-(--c-border) bg-(--c-panel) p-1 transition ${isSelected ? 'border-(--c-accent) ring-1 ring-(--c-accent)/30' : 'hover:border-(--c-accent)/30'}`}
                                                            >
                                                                <img src={item.iconUrl} alt={item.iconName || item.iconId} className="h-full w-full object-contain" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-[11px] text-(--c-muted)">
                                                    Picture Library is empty. Add a new picture from your computer to continue.
                                                </p>
                                            )}

                                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                <input
                                                    type="text"
                                                    value={newIconName}
                                                    onChange={(event) => setNewIconName(event.target.value)}
                                                    placeholder="New icon name"
                                                    className="w-full rounded-xl border border-(--c-border) bg-(--c-panel) px-3 py-2 text-xs font-bold text-(--c-text) outline-none"
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                    onChange={handleNewLibraryIconFile}
                                                    className="w-full rounded-xl border border-(--c-border) bg-(--c-panel) px-3 py-2 text-xs text-(--c-text)"
                                                />
                                            </div>
                                            {isLibraryStudioOpen && (
                                                <div className="mt-3">
                                                    <ImageStudio
                                                        sourceUrl={newIconSourceUrl}
                                                        onReset={resetLibraryIconDraft}
                                                        zoom={newIconZoom}
                                                        setZoom={setNewIconZoom}
                                                        rotation={newIconRotation}
                                                        setRotation={setLibraryRotationWrapper}
                                                        onFileChange={handleNewLibraryIconFile}
                                                        onCropComplete={onLibraryCropComplete}
                                                        title="Picture Library Crop"
                                                        showFilters={false}
                                                        workspaceHeightClass="h-[220px]"
                                                    />
                                                </div>
                                            )}
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddLibraryIcon}
                                                    disabled={isAddingLibraryIcon}
                                                    className="rounded-lg border border-(--c-border) bg-(--c-panel) px-3 py-2 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent) disabled:opacity-50"
                                                >
                                                    {isAddingLibraryIcon ? 'Adding Icon...' : 'Upload from Computer'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="mt-2 text-[11px] text-(--c-muted)">Open the library when you need to choose an existing icon or add a new one.</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-(--c-muted)">
                                            <ListChecks className="h-3.5 w-3.5 text-(--c-accent)" />
                                            Allowed Methods
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCustomMethodOpen((prev) => !prev);
                                                setLibraryTarget('customMethod');
                                                setIsLibraryPanelOpen(true);
                                            }}
                                            className="rounded-lg border border-(--c-border) bg-(--c-panel) px-2 py-1 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent) hover:text-(--c-accent)"
                                        >
                                            Add New Method
                                        </button>
                                    </div>
                                    <p className="mt-1 text-[11px] text-(--c-muted)">
                                        The selected portal category controls the default methods. You can still add custom methods for your own workflow.
                                    </p>
                                    {isCustomMethodOpen && (
                                        <div className="mt-3 space-y-2 rounded-xl border border-(--c-border) bg-(--c-surface) p-3">
                                            <input
                                                type="text"
                                                value={customMethodName}
                                                onChange={(event) => setCustomMethodName(event.target.value)}
                                                placeholder="Transaction method name"
                                                className="w-full rounded-xl border border-(--c-border) bg-(--c-panel) px-3 py-2 text-xs font-bold text-(--c-text) outline-none"
                                            />
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 overflow-hidden rounded-xl border border-(--c-border) bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)] p-1">
                                                    <img
                                                        src={customMethodIconUrl || '/portals/portals.png'}
                                                        alt="Method icon preview"
                                                        className="h-full w-full object-contain"
                                                    />
                                                </div>
                                                <div className="text-[11px] text-(--c-muted)">
                                                    Select an icon from the library or upload a new one, then save the method.
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomMethod}
                                                    className="rounded-lg bg-(--c-accent) px-3 py-2 text-[10px] font-bold text-white transition hover:opacity-90"
                                                >
                                                    Save Method
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomMethodOpen(false);
                                                        setCustomMethodName('');
                                                        setCustomMethodIconUrl('');
                                                    }}
                                                    className="rounded-lg border border-(--c-border) bg-(--c-panel) px-3 py-2 text-[10px] font-bold text-(--c-text) transition hover:border-(--c-accent)"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {visibleMethods.map((m) => {
                                            const active = form.methods.includes(m.id);
                                            const libraryIcon = resolveMethodIconUrl(methodIconMap, m.id);
                                            const methodConfig = resolvePortalMethodById(m.id, form.customMethods);
                                            const iconUrl = m.iconUrl || methodConfig?.iconUrl || libraryIcon;
                                            const MethodIcon = m.Icon || methodConfig?.Icon;
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setForm(f => ({
                                                        ...f,
                                                        methods: active ? f.methods.filter(id => id !== m.id) : [...f.methods, m.id]
                                                    }))}
                                                    className={`flex items-center gap-2 rounded-xl border bg-(--c-surface) p-2 transition ${active ? 'border-(--c-accent) shadow-sm ring-1 ring-(--c-accent)/20' : 'border-(--c-border) hover:border-(--c-accent)/30'}`}
                                                >
                                                    <span className={`${iconBadgeBaseClass} h-9 w-9 shrink-0 rounded-lg bg-[color-mix(in_srgb,var(--c-surface)_20%,white_80%)] ${active ? 'ring-1 ring-(--c-accent)/30' : ''}`}>
                                                        {iconUrl ? (
                                                            <img src={iconUrl} alt={m.label} className="h-8 w-8 object-contain" />
                                                        ) : (
                                                            MethodIcon ? <MethodIcon className="h-5 w-5 text-[var(--c-text)]" /> : <span className="text-xs font-bold text-(--c-text)">{m.label.charAt(0)}</span>
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-(--c-text)">{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {!visibleMethods.length && (
                                        <p className="mt-3 text-[11px] text-(--c-muted)">
                                            No methods are assigned yet for this category. Add a new method to start configuring this portal.
                                        </p>
                                    )}
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
                        <div className="flex gap-3 pt-4 border-t border-(--c-border)">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 rounded-xl bg-(--c-accent) py-3 text-sm font-bold text-white shadow-lg shadow-(--c-accent)/20 hover:opacity-90 disabled:opacity-50 transition"
                            >
                                {isSaving ? 'Saving...' : editingPortal ? 'Update Portal' : 'Create Portal'}
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className="flex-1 rounded-xl border border-(--c-border) py-3 text-sm font-bold text-(--c-text) hover:bg-(--c-panel) transition"
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

