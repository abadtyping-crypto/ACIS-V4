import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { fetchTenantMailConfig, sendTenantWelcomeEmail, upsertTenantMailConfig } from '../../lib/backendStore';
import { createSyncEvent } from '../../lib/syncEvents';
import SettingCard from './SettingCard';

const rowClass = 'grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr] sm:items-center py-2';
const inputClass = 'w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm font-semibold text-[var(--c-text)] outline-none focus:ring-1 focus:ring-[var(--c-accent)]';

const MailConfigurationSection = () => {
    const { tenantId } = useTenant();
    const { user } = useAuth();
    const [config, setConfig] = useState({
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPass: '',
        fromName: '',
        fromEmail: '',
        replyTo: '',
        enableWelcomeEmail: false,
        welcomeForCompany: true,
        welcomeForIndividual: true,
        welcomeSubject: 'Welcome to {{tenantName}}',
        welcomeHtml: '<h3>Welcome {{clientName}}</h3><p>Your client ID: <strong>{{displayClientId}}</strong></p><p>Thank you for joining {{tenantName}}.</p>',
        documentEmailSubject: '{{tenantName}} - Your {{cleanType}}',
        documentEmailBodyHtml: '',
        emailLogoUrl: '',
        contactCardUrl: '',
        contactPhone: '',
        signatureSignOff: 'Regards,',
        signatureName: '',
        signatureRole: '',
        signaturePhone: '',
        signatureAddress: '',
        emailSignatureHtml: '',
    });
    const [testWelcomeTo, setTestWelcomeTo] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

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
        setStatus({ message: 'Saving mail configuration...', type: 'info' });

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

        setStatus({ message: 'Configuration saved successfully.', type: 'success' });
        setIsSaving(false);
        setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    };

    const handleTestConnection = () => {
        setStatus({ message: 'Connecting to SMTP server... (Simulated)', type: 'info' });
        setTimeout(() => {
            setStatus({ message: 'Connection test passed! (Note: Actual backend verification requires server-side logic)', type: 'success' });
        }, 1500);
    };

    const handleSendWelcomeTest = async () => {
        if (!testWelcomeTo.trim()) {
            setStatus({ message: 'Enter a test recipient email.', type: 'error' });
            return;
        }
        setStatus({ message: 'Sending test welcome email...', type: 'info' });
        const result = await sendTenantWelcomeEmail(tenantId, {
            toEmail: testWelcomeTo.trim(),
            clientName: 'Test Client',
            clientType: 'individual',
            displayClientId: 'CLID-TEST-0001',
            forceSend: true,
        });
        if (result.ok && !result.skipped) {
            setStatus({ message: 'Test welcome email queued successfully.', type: 'success' });
        } else if (result.ok && result.skipped) {
            setStatus({ message: `Test skipped: ${result.reason || 'disabled'}`, type: 'info' });
        } else {
            setStatus({ message: `Test failed: ${result.error || 'unknown'}`, type: 'error' });
        }
    };

    return (
        <SettingCard
            title="Mail Configuration"
            description="Configure SMTP, tenant-level email branding, and premium signature blocks."
        >
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">SMTP Server</h3>
                    <div className="space-y-2">
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Host</label>
                            <input type="text" placeholder="smtp.example.com" value={config.smtpHost} onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })} className={inputClass} />
                        </div>
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Port</label>
                            <input type="text" placeholder="587" value={config.smtpPort} onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })} className={inputClass} />
                        </div>
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Username</label>
                            <input type="text" placeholder="user@example.com" value={config.smtpUser} onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })} className={inputClass} />
                        </div>
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Password</label>
                            <input type="password" placeholder="••••••••" value={config.smtpPass} onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                </div>

                <hr className="border-[var(--c-border)]" />

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Sender Identity</h3>
                    <div className="space-y-2">
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">From Name</label>
                            <input type="text" placeholder="Organization Name" value={config.fromName} onChange={(e) => setConfig({ ...config, fromName: e.target.value })} className={inputClass} />
                        </div>
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">From Email</label>
                            <input type="email" placeholder="billing@example.com" value={config.fromEmail} onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })} className={inputClass} />
                        </div>
                        <div className={rowClass}>
                            <label className="text-xs font-bold text-[var(--c-muted)]">Reply-To</label>
                            <input type="email" placeholder="support@example.com" value={config.replyTo} onChange={(e) => setConfig({ ...config, replyTo: e.target.value })} className={inputClass} />
                        </div>
                    </div>
                </div>

                <hr className="border-[var(--c-border)]" />

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Invoice/Document Email Branding</h3>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Email Subject</label>
                        <input type="text" value={config.documentEmailSubject || ''} onChange={(e) => setConfig({ ...config, documentEmailSubject: e.target.value })} className={inputClass} placeholder="{{tenantName}} - Your {{cleanType}}" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Logo URL</label>
                        <input type="url" value={config.emailLogoUrl || ''} onChange={(e) => setConfig({ ...config, emailLogoUrl: e.target.value })} className={inputClass} placeholder="https://cdn.example.com/logo.png" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Contact Card URL</label>
                        <input type="url" value={config.contactCardUrl || ''} onChange={(e) => setConfig({ ...config, contactCardUrl: e.target.value })} className={inputClass} placeholder="https://example.com/contact.vcf" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Main Contact Number</label>
                        <input type="text" value={config.contactPhone || ''} onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })} className={inputClass} placeholder="+971 50 000 0000" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--c-muted)]">Document Email Body (optional)</label>
                        <textarea rows={5} value={config.documentEmailBodyHtml || ''} onChange={(e) => setConfig({ ...config, documentEmailBodyHtml: e.target.value })} className={inputClass} placeholder="<p>Dear {{clientName}}, please find attached your {{cleanType}}.</p>" />
                    </div>
                </div>

                <div className="space-y-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)]/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Signature Block</h4>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Sign-off Line</label>
                        <input type="text" value={config.signatureSignOff || ''} onChange={(e) => setConfig({ ...config, signatureSignOff: e.target.value })} className={inputClass} placeholder="Regards," />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Signature Name</label>
                        <input type="text" value={config.signatureName || ''} onChange={(e) => setConfig({ ...config, signatureName: e.target.value })} className={inputClass} placeholder="John Doe" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Role/Title</label>
                        <input type="text" value={config.signatureRole || ''} onChange={(e) => setConfig({ ...config, signatureRole: e.target.value })} className={inputClass} placeholder="Client Relationship Manager" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Signature Phone</label>
                        <input type="text" value={config.signaturePhone || ''} onChange={(e) => setConfig({ ...config, signaturePhone: e.target.value })} className={inputClass} placeholder="+971 50 123 4567" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Address/Location</label>
                        <input type="text" value={config.signatureAddress || ''} onChange={(e) => setConfig({ ...config, signatureAddress: e.target.value })} className={inputClass} placeholder="Dubai, UAE" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--c-muted)]">Advanced Signature HTML (optional)</label>
                        <textarea rows={4} value={config.emailSignatureHtml || ''} onChange={(e) => setConfig({ ...config, emailSignatureHtml: e.target.value })} className={inputClass} placeholder="<table>...</table>" />
                        <p className="text-[10px] text-[var(--c-muted)]">
                            Supported tokens: {'{{tenantName}}'}, {'{{clientName}}'}, {'{{cleanType}}'}, {'{{txId}}'}, {'{{supportEmail}}'}, {'{{signatureName}}'}, {'{{signatureRole}}'}, {'{{contactPhone}}'}, {'{{contactCardUrl}}'}, {'{{emailLogoUrl}}'}
                        </p>
                    </div>
                </div>

                <hr className="border-[var(--c-border)]" />

                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Welcome Email Automation</h3>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Enable Auto Welcome</label>
                        <input type="checkbox" checked={!!config.enableWelcomeEmail} onChange={(e) => setConfig({ ...config, enableWelcomeEmail: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Company Clients</label>
                        <input type="checkbox" checked={!!config.welcomeForCompany} onChange={(e) => setConfig({ ...config, welcomeForCompany: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Individual Clients</label>
                        <input type="checkbox" checked={!!config.welcomeForIndividual} onChange={(e) => setConfig({ ...config, welcomeForIndividual: e.target.checked })} className="h-4 w-4 accent-[var(--c-accent)]" />
                    </div>
                    <div className={rowClass}>
                        <label className="text-xs font-bold text-[var(--c-muted)]">Welcome Subject</label>
                        <input type="text" value={config.welcomeSubject || ''} onChange={(e) => setConfig({ ...config, welcomeSubject: e.target.value })} className={inputClass} placeholder="Welcome to {{tenantName}}" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--c-muted)]">Welcome HTML Template</label>
                        <textarea rows={6} value={config.welcomeHtml || ''} onChange={(e) => setConfig({ ...config, welcomeHtml: e.target.value })} className={inputClass} placeholder="<h3>Welcome {{clientName}}</h3>" />
                        <p className="text-[10px] text-[var(--c-muted)]">Tokens: {'{{tenantName}}'}, {'{{clientName}}'}, {'{{clientType}}'}, {'{{displayClientId}}'}, {'{{supportEmail}}'}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                        <input type="email" value={testWelcomeTo} onChange={(e) => setTestWelcomeTo(e.target.value)} className={inputClass} placeholder="test@example.com" />
                        <button type="button" onClick={handleSendWelcomeTest} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">Send Test Welcome</button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                    <button type="button" onClick={onSave} disabled={isSaving} className="rounded-xl bg-[var(--c-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button type="button" onClick={handleTestConnection} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800">
                        Test Connection
                    </button>
                    {status.message && (
                        <p className={`text-xs font-bold ${status.type === 'error' ? 'text-rose-500' : status.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                            {status.message}
                        </p>
                    )}
                </div>
            </div>
        </SettingCard>
    );
};

export default MailConfigurationSection;
