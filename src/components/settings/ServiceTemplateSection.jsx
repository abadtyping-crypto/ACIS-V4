import { useCallback, useEffect, useState } from 'react';
import SettingCard from './SettingCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { toSafeDocId } from '../../lib/idUtils';
import {
    fetchServiceTemplates,
    upsertServiceTemplate,
    deleteServiceTemplate,
} from '../../lib/serviceTemplateStore';
import { fetchApplicationIconLibrary } from '../../lib/applicationIconLibraryStore';
import { createSyncEvent } from '../../lib/syncEvents';
import DirhamIcon from '../common/DirhamIcon';
import CurrencyValue from '../common/CurrencyValue';

const inputClass =
    'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]';

const ServiceTemplateSection = () => {
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [rows, setRows] = useState([]);
    const [icons, setIcons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [govCharge, setGovCharge] = useState('');
    const [clientCharge, setClientCharge] = useState('');
    const [selectedIconId, setSelectedIconId] = useState('');
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
        if (tenantId) loadData();
    }, [tenantId, loadData]);

    const resetForm = () => {
        setName('');
        setGovCharge('');
        setClientCharge('');
        setSelectedIconId('');
        setEditingId(null);
        setError('');
    };

    const handleEdit = (row) => {
        setEditingId(row.id);
        setName(row.name || '');
        setGovCharge(String(row.govCharge || ''));
        setClientCharge(String(row.clientCharge || ''));
        setSelectedIconId(row.iconId || '');
        setError('');
        setStatus('');
    };

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) return setError('Application Name is required.');
        if (!govCharge || isNaN(govCharge)) return setError('Valid Gov. Charge is required.');
        if (!clientCharge || isNaN(clientCharge)) return setError('Valid Client Charge is required.');

        setIsSaving(true);
        setError('');
        setStatus('');

        const templateId = editingId || toSafeDocId(trimmedName, 'svc_tpl');
        const selectedIcon = icons.find(i => i.iconId === selectedIconId);

        const payload = {
            name: trimmedName,
            govCharge: Number(govCharge),
            clientCharge: Number(clientCharge),
            profit: Number(clientCharge) - Number(govCharge),
            iconId: selectedIconId,
            iconUrl: selectedIcon?.iconUrl || '',
            updatedBy: user.uid,
        };

        if (!editingId) {
            payload.createdAt = new Date().toISOString();
            payload.createdBy = user.uid;
        }

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
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">
                        Application Name *
                        <input
                            className={inputClass}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Visa Processing"
                        />
                    </label>

                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">
                        Gov. Charge (AED) *
                        <input
                            type="number"
                            className={inputClass}
                            value={govCharge}
                            onChange={(e) => setGovCharge(e.target.value)}
                            placeholder="0.00"
                        />
                    </label>

                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">
                        Client Charge (AED) *
                        <input
                            type="number"
                            className={inputClass}
                            value={clientCharge}
                            onChange={(e) => setClientCharge(e.target.value)}
                            placeholder="0.00"
                        />
                    </label>

                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">
                        Default Icon
                        <select
                            className={inputClass}
                            value={selectedIconId}
                            onChange={(e) => setSelectedIconId(e.target.value)}
                        >
                            <option value="">Default (📄)</option>
                            {icons.map((icon) => (
                                <option key={icon.iconId} value={icon.iconId}>
                                    {icon.iconName}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="rounded-xl bg-[var(--c-accent)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                    >
                        {editingId ? 'Update Template' : 'Save Template'}
                    </button>
                    {editingId && (
                        <button
                            onClick={resetForm}
                            className="rounded-xl border border-[var(--c-border)] px-6 py-2.5 text-sm font-bold text-[var(--c-text)]"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {error && <p className="mt-3 text-xs font-bold text-rose-500 uppercase">{error}</p>}
                {status && <p className="mt-3 text-xs font-bold text-emerald-500 uppercase">{status}</p>}
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
                                    {row.iconUrl ? (
                                        <img src={row.iconUrl} alt="" className="h-8 w-8 object-contain" />
                                    ) : (
                                        <span className="text-2xl">📄</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-[var(--c-text)]">{row.name}</p>
                                    <div className="mt-1 flex gap-3 text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                        <span className="flex items-center gap-1">
                                            Gov: <CurrencyValue amount={row.govCharge} hideIcon />
                                        </span>
                                        <span className="flex items-center gap-1">
                                            Client: <CurrencyValue amount={row.clientCharge} hideIcon />
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
