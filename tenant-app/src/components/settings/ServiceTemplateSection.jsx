import { useCallback, useEffect, useState } from 'react';
import SettingCard from './SettingCard';
import { useTenant } from '../../context/useTenant';
import { useAuth } from '../../context/useAuth';
import { toSafeDocId } from '../../lib/idUtils';
import ServiceTemplateEditor from '../common/ServiceTemplateEditor';
import ApplicationIconQuickAddPanel from '../common/ApplicationIconQuickAddPanel';
import {
    fetchServiceTemplates,
    upsertServiceTemplate,
    deleteServiceTemplate,
} from '../../lib/serviceTemplateStore';
import { fetchApplicationIconLibrary } from '../../lib/applicationIconLibraryStore';
import { createSyncEvent } from '../../lib/syncEvents';
import CurrencyValue from '../common/CurrencyValue';
import {
    buildServiceTemplatePayload,
    createEmptyServiceTemplateDraft,
    findServiceTemplateNameConflict,
    hydrateServiceTemplateDraft,
    validateServiceTemplateDraft,
} from '../../lib/serviceTemplateRules';

const ServiceTemplateSection = () => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [rows, setRows] = useState([]);
    const [icons, setIcons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [isIconQuickAddOpen, setIsIconQuickAddOpen] = useState(false);

    // Form State
    const [draft, setDraft] = useState(createEmptyServiceTemplateDraft());
    const [editingId, setEditingId] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [templateRes, iconRes] = await Promise.all([
            fetchServiceTemplates(tenantId),
            fetchApplicationIconLibrary(tenantId),
        ]);

        if (templateRes.ok) setRows(templateRes.rows);
        if (iconRes.ok) setIcons(iconRes.rows);

        setIsLoading(false);
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId) return undefined;
        const timer = window.setTimeout(() => {
            loadData();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [tenantId, loadData]);

    const resetForm = () => {
        setDraft(createEmptyServiceTemplateDraft());
        setEditingId(null);
        setError('');
        setIsIconQuickAddOpen(false);
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        setDraft(hydrateServiceTemplateDraft(row));
        setError('');
        setStatus('');
    };

    const handleSubmit = async () => {
        const validationError = validateServiceTemplateDraft(draft);
        if (validationError) return setError(validationError);

        const duplicateRow = findServiceTemplateNameConflict(rows, draft.name, editingId);
        if (duplicateRow) {
            return setError('Another application already uses this name variant (case/space). Choose a unique name.');
        }

        setIsSaving(true);
        setError('');
        setStatus('');

        const templateId = editingId || toSafeDocId(String(draft.name || '').trim(), 'svc_tpl');
        const payload = buildServiceTemplatePayload(draft, {
            createdBy: user.uid,
            updatedBy: user.uid,
            editing: Boolean(editingId),
        });

        const res = await upsertServiceTemplate(tenantId, templateId, payload);
        if (res.ok) {
            await createSyncEvent({
                tenantId,
                eventType: editingId ? 'update' : 'create',
                entityType: 'serviceTemplate',
                entityId: templateId,
                changedFields: Object.keys(payload),
                createdBy: user.uid,
            });
            setStatus(editingId ? 'Template updated.' : 'Template created.');
            resetForm();
            await loadData();
        } else {
            setError(res.error || 'Failed to save template.');
        }
        setIsSaving(false);
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete template "${row.name}"?`)) return;
        setIsSaving(true);
        const res = await deleteServiceTemplate(tenantId, row.id);
        if (res.ok) {
            await createSyncEvent({
                tenantId,
                eventType: 'delete',
                entityType: 'serviceTemplate',
                entityId: row.id,
                changedFields: ['id'],
                createdBy: user.uid,
            });
            setStatus('Template deleted.');
            await loadData();
        } else {
            setError(res.error || 'Failed to delete template.');
        }
        setIsSaving(false);
    };

    return (
        <SettingCard
            title="Application Templates"
            description="Define reusable service catalog items with default pricing and icons."
        >
            <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                <ServiceTemplateEditor
                    draft={draft}
                    onDraftChange={setDraft}
                    icons={icons}
                    iconActionSlot={(
                        <ApplicationIconQuickAddPanel
                            tenantId={tenantId}
                            createdBy={user?.uid || ''}
                            existingIcons={icons}
                            suggestedName={draft.name}
                            isOpen={isIconQuickAddOpen}
                            onOpen={() => setIsIconQuickAddOpen(true)}
                            onClose={() => setIsIconQuickAddOpen(false)}
                            onCreated={(createdIcon) => {
                                setIcons((prev) => (
                                    [...prev, createdIcon].sort((a, b) => String(a.iconName || '').localeCompare(String(b.iconName || ''), undefined, { sensitivity: 'base' }))
                                ));
                                setDraft((prev) => ({ ...prev, iconId: createdIcon.iconId }));
                                setStatus(`Icon "${createdIcon.iconName}" added and selected.`);
                                setError('');
                            }}
                        />
                    )}
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSubmit();
                    }}
                    onCancel={resetForm}
                    isSaving={isSaving}
                    error={error}
                    status={status}
                    submitLabel={editingId ? 'Update Template' : 'Save Template'}
                    showCancel={Boolean(editingId)}
                />
            </div>

            <div className="mt-6">
                <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Saved Templates</p>
                {isLoading ? (
                    <p className="mt-4 text-center text-sm text-[var(--c-muted)] italic">Loading templates...</p>
                ) : rows.length === 0 ? (
                    <div className="mt-4 rounded-2xl border-2 border-dashed border-[var(--c-border)] p-8 text-center">
                        <p className="text-sm text-[var(--c-muted)]">No application templates found. Add your first service above.</p>
                    </div>
                ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {rows.map((row) => (
                            <div
                                key={row.id || row.name}
                                className="group relative flex items-center gap-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4 transition hover:border-[var(--c-accent)]/50"
                            >
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
                                    {(icons.find((icon) => icon.iconId === row.iconId)?.iconUrl) ? (
                                        <img src={icons.find((icon) => icon.iconId === row.iconId)?.iconUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                                    ) : (
                                        <span className="text-2xl">📄</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[var(--c-text)]">{row.name}</p>
                                    {row.description ? (
                                        <p className="mt-1 line-clamp-2 text-xs text-[var(--c-muted)]">{row.description}</p>
                                    ) : null}
                                    <div className="mt-1 flex gap-3 text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                        <span className="flex items-center gap-1">
                                            Gov: <CurrencyValue value={row.govCharge} />
                                        </span>
                                        <span className="flex items-center gap-1">
                                            Client: <CurrencyValue value={row.clientCharge} />
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(row)}
                                        className="rounded-lg p-2 text-[var(--c-muted)] hover:bg-[var(--c-surface)] hover:text-[var(--c-accent)]"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(row)}
                                        className="rounded-lg p-2 text-[var(--c-muted)] hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SettingCard>
    );
};

export default ServiceTemplateSection;

