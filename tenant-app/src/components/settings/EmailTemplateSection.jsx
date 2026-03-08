import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { fetchTenantMailConfig, sendTenantWelcomeEmail, upsertTenantMailConfig } from '../../lib/backendStore';
import { createSyncEvent } from '../../lib/syncEvents';
import SettingCard from './SettingCard';

const rowClass = 'grid grid-cols-1 gap-1 sm:grid-cols-[160px_1fr] sm:items-center py-2';
const inputClass = 'w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm font-semibold text-[var(--c-text)] outline-none focus:ring-1 focus:ring-[var(--c-accent)]';

const EmailTemplateSection = () => {
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const [config, setConfig] = useState({
        enableWelcomeEmail: false,
        welcomeForCompany: true,
        welcomeForIndividual: true,
        welcomeSubject: 'Welcome to {{tenantName}}',
        welcomeHtml: `<div style="background-color: #f8fafc; padding: 40px 20px; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: {{brandColor}}; height: 6px;"></div>
    <div style="padding: 40px;">
      <p style="margin: 0 0 20px; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em;">{{tenantName}}</p>
      <div style="color: #475569; font-size: 16px; line-height: 1.6;">
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Welcome {{clientName}},</h2>
        <p>We're excited to have you with us. Your account has been successfully created.</p>
        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Client ID</p>
          <p style="margin: 4px 0 0; font-size: 24px; font-weight: 800; color: {{brandColor}};">{{displayClientId}}</p>
        </div>
        <p>Thank you for choosing <strong>{{tenantName}}</strong>.</p>
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Best regards,</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">The {{tenantName}} Team</p>
          <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">Need assistance? <a href="mailto:{{supportEmail}}" style="color: {{brandColor}}; text-decoration: none; font-weight: 600;">{{supportEmail}}</a></p>
        </div>
      </div>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">© {{year}} {{tenantName}}. All rights reserved.</p>
    </div>
  </div>
</div>`,
        statementSubject: '{{tenantName}} - Your {{documentType}}',
        statementHtml: `<div style="background-color: #f8fafc; padding: 40px 20px; font-family: sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: {{brandColor}}; height: 6px;"></div>
    <div style="padding: 40px;">
      <p style="margin: 0 0 20px; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em;">{{tenantName}}</p>
      <div style="color: #475569; font-size: 16px; line-height: 1.6;">
        <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Hello {{recipientName}},</h2>
        <p>Please find attached your <strong>{{documentType}}</strong> regarding transaction <strong>{{txId}}</strong>.</p>
        <p>A PDF copy is attached for your records. If you have any questions, please reach out to our team.</p>
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">Best regards,</p>
          <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">The {{tenantName}} Team</p>
          <p style="margin: 16px 0 0; font-size: 12px; color: #94a3b8;">Questions? Contact us at <a href="mailto:{{supportEmail}}" style="color: {{brandColor}}; text-decoration: none; font-weight: 600;">{{supportEmail}}</a></p>
        </div>
      </div>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">© {{year}} {{tenantName}}. All rights reserved.</p>
    </div>
  </div>
</div>`,
    });
    const [testTo, setTestTo] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [previewWelcome, setPreviewWelcome] = useState(false);
    const [previewStatement, setPreviewStatement] = useState(false);

    const createPreviewHtml = (html) => {
        if (!html) return '';
        return html
            .replace(/{{tenantName}}/g, tenantId || 'Workspace Name')
            .replace(/{{brandColor}}/g, 'var(--c-accent, #0b5ed7)')
            .replace(/{{clientName}}/g, 'John Doe')
            .replace(/{{recipientName}}/g, 'Jane Doe')
            .replace(/{{clientType}}/g, 'Individual')
            .replace(/{{displayClientId}}/g, 'CLID-TEST-001')
            .replace(/{{documentType}}/g, 'Invoice')
            .replace(/{{txId}}/g, 'TX-1234')
            .replace(/{{year}}/g, new Date().getFullYear())
            .replace(/{{supportEmail}}/g, 'support@example.com');
    };

    useEffect(() => {
        let active = true;
        fetchTenantMailConfig(tenantId).then((result) => {
            if (!active || !result.ok || !result.data) return;
            setConfig((prev) => ({
                ...prev,
                ...result.data,
            }));
        });
        return () => { active = false; };
    }, [tenantId]);

    const onSave = async () => {
        setIsSaving(true);
        setStatus({ message: 'Saving templates...', type: 'info' });

        const payload = {
            ...config,
            updatedBy: user.uid,
        };

        const res = await upsertTenantMailConfig(tenantId, payload);
        if (!res.ok) {
            setStatus({ message: `Save failed: ${res.error}`, type: 'error' });
            setIsSaving(false);
            return;
        }

        await createSyncEvent({
            tenantId,
            eventType: 'update',
            entityType: 'settingsMail',
            entityId: 'mailConfiguration',
            changedFields: Object.keys(payload),
            createdBy: user.uid,
        });

        setStatus({ message: 'Templates saved successfully.', type: 'success' });
        setIsSaving(false);
        setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    };

    const handleSendWelcomeTest = async () => {
        if (!testTo.trim()) {
            setStatus({ message: 'Enter a test recipient email.', type: 'error' });
            return;
        }
        setStatus({ message: 'Sending test welcome email...', type: 'info' });
        const result = await sendTenantWelcomeEmail(tenantId, {
            toEmail: testTo.trim(),
            clientName: 'Test Client',
            clientType: 'individual',
            displayClientId: 'CLID-TEST-0001',
            forceSend: true,
        });
        if (result.ok && !result.skipped) {
            setStatus({ message: 'Test welcome email sent.', type: 'success' });
        } else {
            setStatus({ message: `Test failed: ${result.error || 'skipped'}`, type: 'error' });
        }
    };

    return (
        <SettingCard
            title="Email Template Customization"
            description="Customize the content and appearance of automated emails sent to clients."
        >
            <div className="space-y-8">
                {/* Welcome Email Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[var(--c-accent)]">Welcome Email</h3>
                    <p className="text-xs text-[var(--c-muted)]">Sent automatically when a new client or dependent is onboarded.</p>

                    <div className="grid gap-4 rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_30%,transparent)] p-4">
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Enable Welcome Email</label>
                            <input
                                type="checkbox"
                                checked={!!config.enableWelcomeEmail}
                                onChange={(e) => setConfig({ ...config, enableWelcomeEmail: e.target.checked })}
                                className="h-4 w-4 accent-[var(--c-accent)]"
                            />
                        </div>

                        <div className="flex gap-6 py-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-[var(--c-muted)]">
                                <input
                                    type="checkbox"
                                    checked={!!config.welcomeForCompany}
                                    onChange={(e) => setConfig({ ...config, welcomeForCompany: e.target.checked })}
                                    className="h-4 w-4 accent-[var(--c-accent)]"
                                />
                                For Companies
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-[var(--c-muted)]">
                                <input
                                    type="checkbox"
                                    checked={!!config.welcomeForIndividual}
                                    onChange={(e) => setConfig({ ...config, welcomeForIndividual: e.target.checked })}
                                    className="h-4 w-4 accent-[var(--c-accent)]"
                                />
                                For Individuals
                            </label>
                        </div>

                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Subject Line</label>
                            <input
                                type="text"
                                value={config.welcomeSubject || ''}
                                onChange={(e) => setConfig({ ...config, welcomeSubject: e.target.value })}
                                className={inputClass}
                                placeholder="Welcome to {{tenantName}}"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-[var(--c-muted)]">HTML Content</label>
                                <button
                                    type="button"
                                    onClick={() => setPreviewWelcome(!previewWelcome)}
                                    className="rounded-md border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--c-accent)] transition hover:bg-[var(--c-panel)]"
                                >
                                    {previewWelcome ? 'Edit HTML' : 'Live Preview'}
                                </button>
                            </div>

                            {previewWelcome ? (
                                <div
                                    className="w-full rounded-xl border border-[var(--c-border)] bg-slate-50 p-4 max-h-[400px] overflow-auto shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: createPreviewHtml(config.welcomeHtml) }}
                                />
                            ) : (
                                <>
                                    <textarea
                                        rows={8}
                                        value={config.welcomeHtml || ''}
                                        onChange={(e) => setConfig({ ...config, welcomeHtml: e.target.value })}
                                        className={`${inputClass} font-mono text-xs`}
                                    />
                                    <p className="text-[10px] text-[var(--c-muted)]">
                                        Tokens: {'{{tenantName}}'}, {'{{clientName}}'}, {'{{clientType}}'}, {'{{displayClientId}}'}, {'{{brandColor}}'}, {'{{year}}'}, {'{{supportEmail}}'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-[var(--c-border)]" />

                {/* Statement Email Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[var(--c-accent)]">Portal Statement Email</h3>
                    <p className="text-xs text-[var(--c-muted)]">Sent when sharing portal statements or document attachments via email.</p>

                    <div className="grid gap-4 rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-panel)_30%,transparent)] p-4">
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Subject Line</label>
                            <input
                                type="text"
                                value={config.statementSubject || ''}
                                onChange={(e) => setConfig({ ...config, statementSubject: e.target.value })}
                                className={inputClass}
                                placeholder="{{tenantName}} - Document"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-[var(--c-muted)]">HTML Content</label>
                                <button
                                    type="button"
                                    onClick={() => setPreviewStatement(!previewStatement)}
                                    className="rounded-md border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--c-accent)] transition hover:bg-[var(--c-panel)]"
                                >
                                    {previewStatement ? 'Edit HTML' : 'Live Preview'}
                                </button>
                            </div>

                            {previewStatement ? (
                                <div
                                    className="w-full rounded-xl border border-[var(--c-border)] bg-slate-50 p-4 max-h-[400px] overflow-auto shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: createPreviewHtml(config.statementHtml) }}
                                />
                            ) : (
                                <>
                                    <textarea
                                        rows={8}
                                        value={config.statementHtml || ''}
                                        onChange={(e) => setConfig({ ...config, statementHtml: e.target.value })}
                                        className={`${inputClass} font-mono text-xs`}
                                    />
                                    <p className="text-[10px] text-[var(--c-muted)]">
                                        Tokens: {'{{tenantName}}'}, {'{{recipientName}}'}, {'{{documentType}}'}, {'{{txId}}'}, {'{{brandColor}}'}, {'{{year}}'}, {'{{supportEmail}}'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="rounded-xl bg-[var(--c-accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save All Templates'}
                    </button>

                    <div className="flex flex-1 items-center gap-2 max-w-sm">
                        <input
                            type="email"
                            placeholder="Test recipient email"
                            value={testTo}
                            onChange={(e) => setTestTo(e.target.value)}
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={handleSendWelcomeTest}
                            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Test Welcome
                        </button>
                    </div>

                    {status.message && (
                        <p className={`w-full text-xs font-bold ${status.type === 'error' ? 'text-rose-500' : status.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                            {status.message}
                        </p>
                    )}
                </div>
            </div>
        </SettingCard>
    );
};

export default EmailTemplateSection;
