import { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { toSafeDocId } from '../../lib/idUtils';
import { createSyncEvent } from '../../lib/syncEvents';
import ImageStudio from '../common/ImageStudio';
import DirhamIcon from '../common/DirhamIcon';
import { getCroppedImg } from '../../lib/imageStudioUtils';
import {
  fetchApplicationIconLibrary,
  getApplicationIconById,
  upsertApplicationIcon,
} from '../../lib/applicationIconLibraryStore';
import { upsertServiceTemplate } from '../../lib/serviceTemplateStore';
import {
  uploadApplicationIconAsset,
  validateApplicationIconFile,
} from '../../lib/applicationIconStorage';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-500/40 bg-slate-700/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20';

const QuickAddServiceTemplateModal = ({ isOpen, onClose, onCreated }) => {
  const { tenantId } = useTenant();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [govCharge, setGovCharge] = useState('');
  const [clientCharge, setClientCharge] = useState('');
  const [selectedIconId, setSelectedIconId] = useState('');
  const [newIconName, setNewIconName] = useState('');
  const [newIconFile, setNewIconFile] = useState(null);
  const [newIconRawUrl, setNewIconRawUrl] = useState('');
  const [newIconZoom, setNewIconZoom] = useState(1);
  const [newIconRotation, setNewIconRotation] = useState(0);
  const [newIconFilter, setNewIconFilter] = useState('natural');
  const [newIconCropPixels, setNewIconCropPixels] = useState(null);
  const [icons, setIcons] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !tenantId) return;
    let active = true;
    fetchApplicationIconLibrary(tenantId).then((res) => {
      if (!active) return;
      if (res.ok) setIcons(res.rows || []);
    });
    return () => {
      active = false;
    };
  }, [isOpen, tenantId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const resetState = () => {
    setName('');
    setDescription('');
    setGovCharge('');
    setClientCharge('');
    setSelectedIconId('');
    setNewIconName('');
    setNewIconFile(null);
    if (newIconRawUrl && newIconRawUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newIconRawUrl);
    }
    setNewIconRawUrl('');
    setNewIconZoom(1);
    setNewIconRotation(0);
    setNewIconFilter('natural');
    setNewIconCropPixels(null);
    setError('');
    setIsSaving(false);
  };

  useEffect(() => {
    return () => {
      if (newIconRawUrl && newIconRawUrl.startsWith('blob:')) {
        URL.revokeObjectURL(newIconRawUrl);
      }
    };
  }, [newIconRawUrl]);

  const handleClose = () => {
    if (isSaving) return;
    resetState();
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return setError('Application Name is required.');
    if (!govCharge || Number.isNaN(Number(govCharge))) return setError('Valid Gov. Charge is required.');
    if (!clientCharge || Number.isNaN(Number(clientCharge))) return setError('Valid Client Charge is required.');
    if (!tenantId || !user?.uid) return setError('Missing tenant or user context.');

    setIsSaving(true);
    setError('');

    let resolvedIconId = selectedIconId || '';
    if (newIconFile) {
      let iconBlobForUpload = newIconFile;
      if (newIconRawUrl && newIconCropPixels) {
        const croppedBlob = await getCroppedImg(newIconRawUrl, newIconCropPixels, newIconRotation, 'none');
        if (croppedBlob) iconBlobForUpload = croppedBlob;
      }

      const validationError = validateApplicationIconFile(iconBlobForUpload);
      if (validationError) {
        setError(validationError);
        setIsSaving(false);
        return;
      }

      const iconNameToUse = String(newIconName || trimmedName).trim();
      const iconId = toSafeDocId(iconNameToUse, 'app_icon');
      const exists = await getApplicationIconById(tenantId, iconId);
      if (!exists.ok) {
        setError(exists.error || 'Failed to validate icon name.');
        setIsSaving(false);
        return;
      }
      if (exists.exists) {
        setError('Icon name already exists. Use a different icon name.');
        setIsSaving(false);
        return;
      }

      const uploadRes = await uploadApplicationIconAsset({
        tenantId,
        iconId,
        fileBlob: iconBlobForUpload,
      });
      if (!uploadRes.ok) {
        setError(uploadRes.error || 'Icon upload failed.');
        setIsSaving(false);
        return;
      }

      const saveIconRes = await upsertApplicationIcon(
        tenantId,
        iconId,
        {
          iconName: iconNameToUse,
          iconUrl: uploadRes.iconUrl,
          createdBy: user.uid,
        },
        { isCreate: true },
      );
      if (!saveIconRes.ok) {
        setError(saveIconRes.error || 'Failed to save icon library entry.');
        setIsSaving(false);
        return;
      }

      await createSyncEvent({
        tenantId,
        eventType: 'create',
        entityType: 'applicationIcon',
        entityId: iconId,
        changedFields: ['iconName', 'iconUrl', 'createdBy'],
        createdBy: user.uid,
      });

      resolvedIconId = iconId;
    }

    const templateId = toSafeDocId(trimmedName, 'svc_tpl');
    const payload = {
      name: trimmedName,
      description: description.trim(),
      govCharge: Number(govCharge),
      clientCharge: Number(clientCharge),
      iconId: resolvedIconId,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    };

    const res = await upsertServiceTemplate(tenantId, templateId, payload);
    if (!res.ok) {
      setError(res.error || 'Failed to create template.');
      setIsSaving(false);
      return;
    }

    await createSyncEvent({
      tenantId,
      eventType: 'create',
      entityType: 'serviceTemplate',
      entityId: templateId,
      changedFields: Object.keys(payload),
      createdBy: user.uid,
    });

    const createdTemplate = {
      id: templateId,
      ...payload,
    };
    resetState();
    onCreated?.(createdTemplate);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-sky-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div>
            <p className="text-sm font-black tracking-widest text-sky-300 uppercase">Add New Application</p>
            <p className="text-xs text-slate-400">Create reusable application without leaving this page.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-600 bg-slate-800 p-2 text-slate-300 transition hover:text-white"
            aria-label="Close quick add"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Application Name *
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter service name"
              />
            </label>

            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 sm:col-span-2">
              Description (Optional)
              <textarea
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Service details, rules or notes..."
                rows={2}
              />
            </label>

            <label className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Application Icon (Reusable / Optional)
              <select className={inputClass} value={selectedIconId} onChange={(e) => setSelectedIconId(e.target.value)}>
                <option value="">Default (📄)</option>
                {icons.map((icon) => (
                  <option key={icon.iconId} value={icon.iconId}>
                    {icon.iconName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-bold uppercase tracking-widest text-slate-300 sm:col-span-2">
              Upload New Icon (Optional)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className={inputClass}
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  event.target.value = '';
                  if (!file) return;
                  const validationError = validateApplicationIconFile(file);
                  if (validationError) {
                    setError(validationError);
                    return;
                  }
                  const objectUrl = URL.createObjectURL(file);
                  if (newIconRawUrl && newIconRawUrl.startsWith('blob:')) URL.revokeObjectURL(newIconRawUrl);
                  setNewIconFile(file);
                  setNewIconRawUrl(objectUrl);
                  setNewIconZoom(1);
                  setNewIconRotation(0);
                  setNewIconFilter('natural');
                  setNewIconCropPixels(null);
                  setError('');
                }}
              />
            </label>

            {newIconRawUrl ? (
              <div className="sm:col-span-2">
                <ImageStudio
                  sourceUrl={newIconRawUrl}
                  onReset={() => {
                    if (newIconRawUrl && newIconRawUrl.startsWith('blob:')) URL.revokeObjectURL(newIconRawUrl);
                    setNewIconFile(null);
                    setNewIconRawUrl('');
                    setNewIconCropPixels(null);
                    setNewIconZoom(1);
                    setNewIconRotation(0);
                    setNewIconFilter('natural');
                  }}
                  onFileChange={() => { }}
                  onCropComplete={(_, pixels) => setNewIconCropPixels(pixels)}
                  zoom={newIconZoom}
                  setZoom={setNewIconZoom}
                  rotation={newIconRotation}
                  setRotation={setNewIconRotation}
                  filter={newIconFilter}
                  setFilter={setNewIconFilter}
                  filterMap={{ natural: { label: 'Natural' } }}
                  title="Icon Crop Studio"
                  aspect={1}
                  cropShape="rect"
                  showFilters={false}
                  workspaceHeightClass="h-[220px] sm:h-[260px]"
                  minZoom={0.5}
                  maxZoom={4}
                />
              </div>
            ) : null}

            {newIconFile ? (
              <label className="text-xs font-bold uppercase tracking-widest text-slate-300 sm:col-span-2">
                New Icon Name (Required for Upload)
                <input
                  className={inputClass}
                  value={newIconName}
                  onChange={(e) => setNewIconName(e.target.value)}
                  placeholder={`Default: ${name.trim() || 'Application Name'}`}
                />
              </label>
            ) : null}

            <label className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Default Gov <DirhamIcon className="inline h-3 w-3 align-text-bottom text-slate-300" /> * (Required)
              <input
                type="number"
                className={inputClass}
                value={govCharge}
                onChange={(e) => setGovCharge(e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Default Client <DirhamIcon className="inline h-3 w-3 align-text-bottom text-slate-300" /> * (Required)
              <input
                type="number"
                className={inputClass}
                value={clientCharge}
                onChange={(e) => setClientCharge(e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>

          {error ? <p className="text-xs font-bold text-rose-400">{error}</p> : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-700 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-400 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddServiceTemplateModal;
