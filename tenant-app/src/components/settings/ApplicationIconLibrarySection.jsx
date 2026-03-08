import { useCallback, useEffect, useMemo, useState } from 'react';
import SettingCard from './SettingCard';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { toSafeDocId } from '../../lib/idUtils';
import {
  deleteApplicationIcon,
  fetchApplicationIconLibrary,
  getApplicationIconById,
  upsertApplicationIcon,
} from '../../lib/applicationIconLibraryStore';
import {
  deleteApplicationIconAssetByUrl,
  uploadApplicationIconAsset,
  validateApplicationIconFile,
} from '../../lib/applicationIconStorage';
import { createSyncEvent } from '../../lib/syncEvents';

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]';

const ApplicationIconLibrarySection = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();

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
    const trimmedName = String(iconName || '').trim();
    if (!trimmedName) {
      setError('Icon Name is mandatory.');
      return;
    }

    if (!isEditing && !iconFile) {
      setError('Select an icon image before saving.');
      return;
    }

    const nextIconId = toSafeDocId(trimmedName, 'app_icon');
    setIsSaving(true);
    setError('');
    setStatus('');

    const currentId = editingIconId || nextIconId;
    const currentUrl = editingRow ? String(editingRow.iconUrl || '') : '';
    const isRename = isEditing && nextIconId !== currentId;

    try {
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
    >
      <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-[var(--c-muted)]">
            Icon Name *
            <input
              className={inputClass}
              value={iconName}
              onChange={(event) => setIconName(event.target.value)}
              placeholder="Example: invoice_management"
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

        {isEditing && editingRow ? (
          <p className="mt-2 text-xs text-[var(--c-muted)]">
            Editing ID: <span className="font-semibold text-[var(--c-text)]">{editingRow.iconId}</span>
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isEditing ? 'Update Icon' : 'Add Icon'}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="rounded-xl border border-[var(--c-border)] px-4 py-2 text-sm font-semibold text-[var(--c-text)]"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      {status ? <p className="mt-3 text-sm font-semibold text-emerald-600">{status}</p> : null}

      <div className="mt-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
        <p className="text-sm font-semibold text-[var(--c-text)]">Library Items</p>
        {isLoading ? (
          <p className="mt-2 text-sm text-[var(--c-muted)]">Loading icons...</p>
        ) : rows.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--c-muted)]">No icons added yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <article key={row.iconId} className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white">
                    {row.iconUrl ? (
                      <img src={row.iconUrl} alt={row.iconName} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-semibold text-[var(--c-muted)]">No Icon</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--c-text)]">{row.iconName || row.iconId}</p>
                    <p className="truncate text-xs text-[var(--c-muted)]">{row.iconId}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(row)}
                    className="rounded-lg border border-[var(--c-border)] px-3 py-1.5 text-xs font-semibold text-[var(--c-text)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </SettingCard>
  );
};

export default ApplicationIconLibrarySection;
