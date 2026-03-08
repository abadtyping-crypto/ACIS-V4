import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { getTenantSettingDoc, upsertTenantSettingDoc } from '../../lib/backendStore';
import { createSyncEvent } from '../../lib/syncEvents';
import SettingCard from './SettingCard';

const rowClass =
  'flex min-h-11 items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2';

const initialPreferences = {
  showVerificationQrByDefault: true,
  compactMobilePdfRows: true,
  autoSendInvoiceOnApproval: false,
  pdfPremiumFeaturesEnabled: true,
  pdfPremiumQrEnabled: true,
  pdfPremiumGradientEnabled: true,
  pdfPremiumCoverPageEnabled: true,
};

const PreferenceSection = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getTenantSettingDoc(tenantId, 'preferenceSettings').then((result) => {
      if (!active || !result.ok || !result.data) return;
      setPreferences((prev) => ({
        ...prev,
        ...result.data,
      }));
    });
    return () => {
      active = false;
    };
  }, [tenantId]);

  if (!user) return null;

  const onToggle = (key) => {
    setPreferences((prev) => {
      if (key === 'pdfPremiumFeaturesEnabled') {
        const nextEnabled = !prev.pdfPremiumFeaturesEnabled;
        return {
          ...prev,
          pdfPremiumFeaturesEnabled: nextEnabled,
          pdfPremiumQrEnabled: nextEnabled ? prev.pdfPremiumQrEnabled : false,
          pdfPremiumGradientEnabled: nextEnabled ? prev.pdfPremiumGradientEnabled : false,
          pdfPremiumCoverPageEnabled: nextEnabled ? prev.pdfPremiumCoverPageEnabled : false,
        };
      }
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  const onSave = async () => {
    setIsSaving(true);
    setSaveMessage('Saving preference settings...');
    const payload = {
      ...preferences,
      updatedBy: user.uid,
    };
    const write = await upsertTenantSettingDoc(tenantId, 'preferenceSettings', payload);
    if (!write.ok) {
      setSaveMessage(`Preference save failed: ${write.error}`);
      setIsSaving(false);
      return;
    }

    const sync = await createSyncEvent({
      tenantId,
      eventType: 'update',
      entityType: 'settingsPreferences',
      entityId: 'preferenceSettings',
      changedFields: Object.keys(payload),
      createdBy: user.uid,
    });

    setSaveMessage(
      sync.backendSynced
        ? 'Preferences saved and synced with backend.'
        : 'Preferences saved. Backend sync pending.',
    );
    setIsSaving(false);
  };

  const premiumDisabled = !preferences.pdfPremiumFeaturesEnabled;

  return (
    <SettingCard
      title="Preferences"
      description="Default behaviors for documents and global premium feature flags."
    >
      <div className="space-y-2">
        <div className={rowClass}>
          <span className="text-sm text-[var(--c-text)]">Show verification QR by default</span>
          <input
            type="checkbox"
            checked={preferences.showVerificationQrByDefault}
            onChange={() => onToggle('showVerificationQrByDefault')}
            className="h-4 w-4 accent-[var(--c-accent)]"
          />
        </div>
        <div className={rowClass}>
          <span className="text-sm text-[var(--c-text)]">Use compact table rows for mobile PDF</span>
          <input
            type="checkbox"
            checked={preferences.compactMobilePdfRows}
            onChange={() => onToggle('compactMobilePdfRows')}
            className="h-4 w-4 accent-[var(--c-accent)]"
          />
        </div>
        <div className={rowClass}>
          <span className="text-sm text-[var(--c-text)]">Auto-send invoice on approval</span>
          <input
            type="checkbox"
            checked={preferences.autoSendInvoiceOnApproval}
            onChange={() => onToggle('autoSendInvoiceOnApproval')}
            className="h-4 w-4 accent-[var(--c-accent)]"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-[var(--c-border)] pt-4">
        <div className={rowClass}>
          <span className="text-sm font-semibold text-[var(--c-text)]">Enable PDF premium features</span>
          <input
            type="checkbox"
            checked={preferences.pdfPremiumFeaturesEnabled}
            onChange={() => onToggle('pdfPremiumFeaturesEnabled')}
            className="h-4 w-4 accent-[var(--c-accent)]"
          />
        </div>
        <div className={`${rowClass} ${premiumDisabled ? 'opacity-60' : ''}`}>
          <span className="text-sm text-[var(--c-text)]">Premium QR controls</span>
          <input
            type="checkbox"
            disabled={premiumDisabled}
            checked={preferences.pdfPremiumQrEnabled}
            onChange={() => onToggle('pdfPremiumQrEnabled')}
            className="h-4 w-4 accent-[var(--c-accent)] disabled:cursor-not-allowed"
          />
        </div>
        <div className={`${rowClass} ${premiumDisabled ? 'opacity-60' : ''}`}>
          <span className="text-sm text-[var(--c-text)]">Premium gradient backgrounds</span>
          <input
            type="checkbox"
            disabled={premiumDisabled}
            checked={preferences.pdfPremiumGradientEnabled}
            onChange={() => onToggle('pdfPremiumGradientEnabled')}
            className="h-4 w-4 accent-[var(--c-accent)] disabled:cursor-not-allowed"
          />
        </div>
        <div className={`${rowClass} ${premiumDisabled ? 'opacity-60' : ''}`}>
          <span className="text-sm text-[var(--c-text)]">Premium cover-page statements</span>
          <input
            type="checkbox"
            disabled={premiumDisabled}
            checked={preferences.pdfPremiumCoverPageEnabled}
            onChange={() => onToggle('pdfPremiumCoverPageEnabled')}
            className="h-4 w-4 accent-[var(--c-accent)] disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-xl bg-[var(--c-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saveMessage ? <p className="text-sm text-[var(--c-muted)]">{saveMessage}</p> : null}
      </div>
    </SettingCard>
  );
};

export default PreferenceSection;

