import { useCallback, useEffect, useMemo, useState } from 'react';
import SettingCard from './SettingCard';
import { useTenant } from '../../context/useTenant';
import { useAuth } from '../../context/useAuth';
import { toSafeDocId } from '../../lib/idUtils';
import useIsDesktopLayout from '../../hooks/useIsDesktopLayout';
import { normalizeLibraryTitle } from '../../lib/serviceTemplateRules';
import {
  deleteApplicationIcon,
  fetchApplicationIconLibrary,
  getApplicationIconById,
  upsertApplicationIcon,
} from '../../lib/applicationIconLibraryStore';
import { Layout, Library } from 'lucide-react';
import {
  deleteApplicationIconAssetByUrl,
  uploadApplicationIconAsset,
  validateApplicationIconFile,
} from '../../lib/applicationIconStorage';
import { createSyncEvent } from '../../lib/syncEvents';

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]';

const normalizeNameForCompare = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]/g, '');

const sanitizeIconName = (value) =>
  normalizeLibraryTitle(value);

const ApplicationIconLibrarySection = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const isDesktop = useIsDesktopLayout();

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [iconName, setIconName] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [editingIconId, setEditingIconId] = useState('');
  const [editingOldUrl, setEditingOldUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const isEditing = Boolean(editingIconId);

  const resetForm = () => {
    setIconName('');
    setIconFile(null);
    setEditingIconId('');
    setEditingOldUrl('');
  };

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchApplicationIconLibrary(tenantId);
    if (res.ok) {
      setRows(res.rows || []);
      setError('');
    } else {
      setError(res.error || 'Failed to load icon library.');
    }
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const editingRow = useMemo(
    () => rows.find((item) => item.iconId === editingIconId) || null,
    [rows, editingIconId],
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file) return;
    const validationError = validateApplicationIconFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIconFile(file);
  };

  const handleStartEdit = (row) => {
    setIconName(String(row.iconName || ''));
    setEditingIconId(row.iconId);
    setEditingOldUrl(String(row.iconUrl || ''));
    setIconFile(null);
    setStatus('');
    setError('');
  };

  const handleSubmit = async () => {
    const trimmedName = sanitizeIconName(iconName);
    if (!trimmedName) {
      setError('Icon Name is mandatory.');
      return;
    }

    if (!isEditing && !iconFile) {
      setError('Select an icon image before saving.');
      return;
    }

    const nextIconId = toSafeDocId(trimmedName, 'app_icon');
    const nextNameKey = normalizeNameForCompare(trimmedName);
    setIsSaving(true);
    setError('');
    setStatus('');

    const currentId = editingIconId || nextIconId;
    const currentUrl = editingRow ? String(editingRow.iconUrl || '') : '';
    const isRename = isEditing && nextIconId !== currentId;

    try {
      const duplicateByNameVariant = rows.some((row) => {
        if (!row?.iconId) return false;
        if (isEditing && row.iconId === currentId) return false;
        return normalizeNameForCompare(row.iconName || row.iconId) === nextNameKey;
      });
      if (duplicateByNameVariant) {
        throw new Error('Another icon already uses this name variant (case/space). Choose a unique name.');
      }

      if (isRename) {
        const existing = await getApplicationIconById(tenantId, nextIconId);
        if (!existing.ok) throw new Error(existing.error || 'Unable to validate target icon id.');
        if (existing.exists) throw new Error('Another icon already uses this name. Choose a different name.');
      }

      let nextIconUrl = currentUrl;
      if (iconFile) {
        const uploadRes = await uploadApplicationIconAsset({
          tenantId,
          iconId: nextIconId,
          fileBlob: iconFile,
          oldUrl: isRename ? '' : currentUrl,
        });
        if (!uploadRes.ok) throw new Error(uploadRes.error || 'Icon upload failed.');
        nextIconUrl = uploadRes.iconUrl;
      }

      if (isRename) {
        const createRes = await upsertApplicationIcon(
          tenantId,
          nextIconId,
          {
            iconName: trimmedName,
            iconUrl: nextIconUrl,
            createdBy: user.uid,
            updatedBy: user.uid,
          },
          { isCreate: true },
        );
        if (!createRes.ok) throw new Error(createRes.error || 'Failed to create renamed icon.');

        const deleteRes = await deleteApplicationIcon(tenantId, currentId);
        if (!deleteRes.ok) throw new Error(deleteRes.error || 'Failed to remove old icon record.');

        if (iconFile && editingOldUrl && editingOldUrl !== nextIconUrl) {
          await deleteApplicationIconAssetByUrl(editingOldUrl);
        }
      } else {
        const saveRes = await upsertApplicationIcon(
          tenantId,
          currentId,
          {
            iconName: trimmedName,
            iconUrl: nextIconUrl,
            createdBy: editingRow?.createdBy || user.uid,
            updatedBy: user.uid,
          },
          { isCreate: !isEditing },
        );
        if (!saveRes.ok) throw new Error(saveRes.error || 'Failed to save icon.');
      }

      await createSyncEvent({
        tenantId,
        eventType: isEditing ? 'update' : 'create',
        entityType: 'applicationIcon',
        entityId: nextIconId,
        changedFields: ['iconName', 'iconUrl', 'updatedBy'],
        createdBy: user.uid,
      });

      setStatus(isEditing ? 'Icon updated successfully.' : 'Icon added successfully.');
      resetForm();
      await loadRows();
    } catch (saveError) {
      setError(saveError?.message || 'Failed to save icon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const allow = window.confirm(`Delete icon "${row.iconName}"?`);
    if (!allow) return;
    setIsSaving(true);
    setError('');
    setStatus('');
    const deleteRes = await deleteApplicationIcon(tenantId, row.iconId);
    if (!deleteRes.ok) {
      setError(deleteRes.error || 'Failed to delete icon.');
      setIsSaving(false);
      return;
    }
    await deleteApplicationIconAssetByUrl(String(row.iconUrl || ''));
    await createSyncEvent({
      tenantId,
      eventType: 'delete',
      entityType: 'applicationIcon',
      entityId: row.iconId,
      changedFields: ['iconId'],
      createdBy: user.uid,
    });
    if (editingIconId === row.iconId) resetForm();
    setStatus('Icon deleted.');
    setIsSaving(false);
    await loadRows();
  };

  return (
    <SettingCard
      title="Applications Icon Library"
      description="Upload reusable app/module icons. Icon Name is mandatory and used as the backend document ID."
      showHeader={false}
      showDescription={false}
    >
      <div className="space-y-8">
        {/* Section 1: Add/Edit Icon Form */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--c-border)] pb-2 text-[var(--c-accent)]">
            <Layout className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--c-text)]">
              {isEditing ? 'Edit Icon Details' : 'Add New Icon'}
            </span>
          </div>

          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-[var(--c-muted)]">
                Icon Name *
                <input
                  className={inputClass}
                  value={iconName}
                  onChange={(event) => setIconName(event.target.value)}
                  placeholder="Example: Invoice Management"
                />
              </label>

              <label className="text-sm text-[var(--c-muted)]">
                Icon Image {isEditing ? '(optional for rename only)' : '*'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className={inputClass}
                />
              </label>
            </div>

            {isEditing && editingRow ? <p className="mt-2 text-xs text-[var(--c-muted)]">Editing selected icon.</p> : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {isEditing ? 'Update Icon' : 'Add Icon'}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-sm font-semibold text-[var(--c-text)] transition hover:bg-[var(--c-panel)]"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
            
            {error ? (
              <p className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold ${isDesktop ? 'border-rose-200 bg-white text-rose-600' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
                {error}
              </p>
            ) : null}
            {status ? (
              <p className={`mt-3 rounded-lg border px-3 py-2 text-sm font-semibold ${isDesktop ? 'border-emerald-200 bg-white text-emerald-700' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                {status}
              </p>
            ) : null}
          </div>
        </section>

        {/* Section 2: Library Items */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--c-border)] pb-2 text-[var(--c-accent)]">
            <Library className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--c-text)]">Library Items</span>
          </div>

          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
            <p className="text-xs text-[var(--c-muted)] mb-3">Upload reusable app/module icons. Icon Name is used as the document ID.</p>
            {isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-accent)] border-t-transparent" />
                <p className="text-sm text-[var(--c-muted)]">Loading icons...</p>
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--c-muted)]">No icons added yet.</p>
            ) : (
              <div className={`grid gap-4 ${isDesktop ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {rows.map((row) => (
                  <article key={row.iconId} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1 border border-[var(--c-border)]/30 ${isDesktop ? 'bg-white' : 'bg-[var(--c-panel)]'}`}>
                        {row.iconUrl ? (
                          <img src={row.iconUrl} alt="Icon preview" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-semibold text-[var(--c-muted)]">No Icon</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--c-text)]">{row.iconName || row.iconId}</p>
                        <p className="truncate text-[10px] font-medium text-[var(--c-muted)]">Local Library</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(row)}
                        className="flex-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--c-text)] hover:bg-[var(--c-surface)] transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </SettingCard>
  );
};

export default ApplicationIconLibrarySection;

