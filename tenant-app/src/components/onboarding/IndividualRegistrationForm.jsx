import { useState, useEffect, useRef } from 'react';
import {
    fetchTenantPortals,
    upsertClient,
    checkIndividualDuplicate,
    generateDisplayClientId,
    getTenantSettingDoc,
    upsertTenantPortalTransaction,
    sendTenantWelcomeEmail,
    db
} from '../../lib/backendStore';
import { doc, getDoc } from 'firebase/firestore';
import { generateDisplayTxId, toSafeDocId } from '../../lib/txIdGenerator';
import IconSelect from '../common/IconSelect';
import { TRANSACTION_METHODS, TX_METHOD_LABELS } from '../../lib/transactionMethodConfig';

const txMethodMetaById = TRANSACTION_METHODS.reduce((acc, method) => {
    acc[method.id] = method;
    return acc;
}, {});

const identificationMethodOptions = [
    { value: 'emiratesId', label: 'Emirates ID', icon: '/onboardingIcons/emiratesId.svg' },
    { value: 'passport', label: 'Passport', icon: '/onboardingIcons/passport.svg' },
];

const fallbackPortalIcon = (type) => {
    if (type === 'Bank') return '/portals/bank.png';
    if (type === 'Card Payment') return '/portals/cardpayment.png';
    if (type === 'Petty Cash') return '/portals/pettycash.png';
    if (type === 'Terminal') return '/portals/terminal.png';
    return '/portals/portals.png';
};

const DirhamAmount = ({ amount, className = '' }) => (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
        <img src="/dirham.svg" alt="AED" className="h-4 w-4 object-contain" />
        <span>{(Number(amount || 0)).toLocaleString()}</span>
    </span>
);

const IndividualRegistrationForm = ({ activeType, tenantId, user, onCancel, onSuccess }) => {
    const [portals, setPortals] = useState([]);
    const [nextId, setNextId] = useState('...');
    const [form, setForm] = useState({
        fullName: '',
        identificationMethod: 'emiratesId',
        emiratesId: '',
        passportNumber: '',
        unifiedNumber: '',
        primaryMobile: '',
        secondaryMobile: '',
        primaryEmail: '',
        address: '',
        poBox: '',
        poBoxEmirate: '',
        openingBalance: '',
        balanceType: 'credit',
        createPortalTransaction: false,
        portalId: '',
        portalMethod: '',
        sendWelcomeEmail: true,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const submitLockRef = useRef(false);

    useEffect(() => {
        const loadInitialData = async () => {
            fetchTenantPortals(tenantId).then(res => {
                if (res.ok) setPortals(res.rows);
            });

            const settingsRes = await getTenantSettingDoc(tenantId, 'transactionIdRules');
            const rules = settingsRes.ok && settingsRes.data ? settingsRes.data['CLID'] || {} : {};
            const prefix = rules.prefix || 'CLID';
            const padding = Number(rules.padding) || 4;

            const counterSnap = await getDoc(doc(db, 'tenants', tenantId, 'counters', 'clients'));
            const currentSeq = counterSnap.exists() ? counterSnap.data().lastClientSeq || 0 : 0;
            setNextId(`${prefix}${String(currentSeq + 1).padStart(padding, '0')}`);
        };
        loadInitialData();
    }, [tenantId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const normalizePhone = (val) => {
        if (!val) return '';
        const digits = val.replace(/\D/g, '');
        return digits.startsWith('0') ? digits.slice(1) : digits;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLockRef.current || isSaving) return;
        submitLockRef.current = true;
        setIsSaving(true);
        let shouldUnlock = true;
        setStatus({ type: 'info', message: 'Validating data...' });

        try {
            const normalized = {
                ...form,
                fullName: form.fullName.toUpperCase().trim(),
                identificationMethod: String(form.identificationMethod || 'emiratesId'),
                emiratesId: form.emiratesId.replace(/-/g, '').trim(),
                passportNumber: form.passportNumber.toUpperCase().trim(),
                primaryMobile: normalizePhone(form.primaryMobile),
                secondaryMobile: normalizePhone(form.secondaryMobile),
                primaryEmail: form.primaryEmail.toLowerCase().trim(),
                openingBalance: parseFloat(form.openingBalance) || 0,
                tenantId,
                createdBy: user.uid,
                createdByDisplayName: user.displayName || '',
                createdByEmail: user.email || '',
                status: 'active'
            };

            if (normalized.primaryMobile.length < 8) {
                setStatus({ type: 'error', message: 'Primary mobile must be at least 8 digits (excluding 0).' });
                return;
            }

            if (normalized.identificationMethod === 'emiratesId' && normalized.emiratesId.length !== 15) {
                setStatus({ type: 'error', message: 'Emirates ID must be 15 digits.' });
                return;
            }

            if (normalized.identificationMethod === 'passport' && !normalized.passportNumber) {
                setStatus({ type: 'error', message: 'Passport Number is required when Passport mode is selected.' });
                return;
            }

            if (normalized.createPortalTransaction && !normalized.portalId) {
                setStatus({ type: 'error', message: 'Select target portal when portal transaction is enabled.' });
                return;
            }
            if (normalized.createPortalTransaction && normalized.openingBalance > 0 && !normalized.portalMethod) {
                setStatus({ type: 'error', message: 'Select portal transaction method.' });
                return;
            }

            setStatus({ type: 'info', message: 'Checking for duplicates...' });
            const exists = await checkIndividualDuplicate(tenantId, {
                method: normalized.identificationMethod,
                emiratesId: normalized.emiratesId,
                passportNumber: normalized.passportNumber,
                fullName: normalized.fullName,
            });
            if (exists) {
                if (normalized.identificationMethod === 'passport') {
                    setStatus({
                        type: 'error',
                        message: `Passport ${normalized.passportNumber} with name ${normalized.fullName} is already registered.`
                    });
                } else {
                    setStatus({ type: 'error', message: `Emirates ID ${normalized.emiratesId} is already registered.` });
                }
                return;
            }

            setStatus({ type: 'info', message: 'Generating Client ID...' });
            const displayId = await generateDisplayClientId(tenantId, 'individual');

            const finalPayload = {
                ...normalized,
                displayClientId: displayId,
                type: 'individual'
            };

            setStatus({ type: 'info', message: 'Saving to database...' });
            const res = await upsertClient(tenantId, null, finalPayload);

            if (res.ok) {
                if (normalized.createPortalTransaction && normalized.portalId && normalized.openingBalance > 0) {
                    const displayTxId = await generateDisplayTxId(tenantId, 'POR');
                    const portalTxId = toSafeDocId(displayTxId, 'tx');
                    const txAmount =
                        normalized.balanceType === 'debit'
                            ? -Math.abs(normalized.openingBalance)
                            : Math.abs(normalized.openingBalance);
                    const txRes = await upsertTenantPortalTransaction(tenantId, portalTxId, {
                        portalId: normalized.portalId,
                        displayTransactionId: displayTxId,
                        amount: txAmount,
                        type: 'Client Opening Balance',
                        method: normalized.portalMethod,
                        category: 'Client Onboarding',
                        description: `Opening balance for ${normalized.fullName || normalized.emiratesId || normalized.passportNumber}`,
                        clientId: res.id,
                        date: new Date().toISOString(),
                        createdBy: user.uid,
                    });
                    if (!txRes.ok) {
                        setStatus({ type: 'error', message: txRes.error || 'Portal transaction failed during onboarding.' });
                        return;
                    }
                }
                if (normalized.sendWelcomeEmail) {
                    const mailRes = await sendTenantWelcomeEmail(tenantId, {
                        toEmail: normalized.primaryEmail,
                        clientName: normalized.fullName,
                        clientType: 'individual',
                        displayClientId: displayId,
                    });
                    if (!mailRes.ok) {
                        setStatus({ type: 'error', message: mailRes.error || 'Welcome email failed after registration.' });
                        return;
                    }
                }
                shouldUnlock = false;
                setStatus({ type: 'success', message: `Successfully registered as ${displayId} !` });
                setTimeout(() => {
                    if (onSuccess) onSuccess({ id: res.id, ...finalPayload });
                }, 1000);
            } else {
                setStatus({ type: 'error', message: res.error || 'Failed to register individual.' });
            }
        } finally {
            if (shouldUnlock) {
                submitLockRef.current = false;
                setIsSaving(false);
            }
        }
    };

    const selectedPortal = portals.find((p) => p.id === form.portalId) || null;
    const openingAmount = Math.abs(Number(form.openingBalance) || 0);
    const signedOpeningAmount = form.balanceType === 'debit' ? -openingAmount : openingAmount;
    const projectedBalance = selectedPortal ? Number(selectedPortal.balance || 0) + (form.createPortalTransaction ? signedOpeningAmount : 0) : null;
    const portalOptions = portals.map((p) => ({
        value: p.id,
        label: p.name,
        icon: p.iconUrl || fallbackPortalIcon(p.type),
        meta: p.type || '',
    }));
    const methodOptions = (selectedPortal?.methods || []).map((methodId) => ({
        value: methodId,
        label: TX_METHOD_LABELS[methodId] || methodId,
        icon: txMethodMetaById[methodId]?.Icon,
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex items-center justify-between border-b border-[var(--c-border)] pb-6">
                <div>
                    <h2 className="text-xl font-black text-[var(--c-text)] uppercase">{activeType} Registration</h2>
                    <p className="text-xs font-bold text-[var(--c-muted)]">Registering under {tenantId}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Next Available ID</p>
                    <p className="text-lg font-black text-[var(--c-accent)]">{nextId}</p>
                </div>
            </header>

            {/* Identity Details */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Full Name *</label>
                    <input
                        type="text"
                        name="fullName"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value.toUpperCase() })}
                        placeholder="AS PER EID / PASSPORT"
                        className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Identification Method *</label>
                    <IconSelect
                        value={form.identificationMethod}
                        onChange={(nextMethod) =>
                            setForm((prev) => ({
                                ...prev,
                                identificationMethod: nextMethod,
                                emiratesId: nextMethod === 'emiratesId' ? prev.emiratesId : '',
                                passportNumber: nextMethod === 'passport' ? prev.passportNumber : '',
                            }))
                        }
                        options={identificationMethodOptions}
                        placeholder="Select Identification Method"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                        {form.identificationMethod === 'passport' ? 'Passport Number *' : 'Emirates ID *'}
                    </label>
                    <input
                        type="text"
                        name={form.identificationMethod === 'passport' ? 'passportNumber' : 'emiratesId'}
                        required
                        maxLength={form.identificationMethod === 'passport' ? 20 : 18}
                        value={form.identificationMethod === 'passport' ? form.passportNumber : form.emiratesId}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                [form.identificationMethod === 'passport' ? 'passportNumber' : 'emiratesId']:
                                    form.identificationMethod === 'passport'
                                        ? e.target.value.toUpperCase()
                                        : e.target.value
                            }))
                        }
                        placeholder={form.identificationMethod === 'passport' ? 'e.g. N123456' : '784-xxxx-xxxxxxx-x'}
                        className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                    />
                </div>

                <div className="space-y-2 lg:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Unified Number (UID)</label>
                    <input
                        type="text"
                        name="unifiedNumber"
                        value={form.unifiedNumber}
                        onChange={handleChange}
                        placeholder="e.g. 123456789"
                        className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                    />
                </div>
            </div>

            {/* Contact Details */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Primary Mobile *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--c-muted)]">+971</span>
                            <input
                                type="tel"
                                name="primaryMobile"
                                required
                                value={form.primaryMobile}
                                onChange={handleChange}
                                placeholder="5x xxxxxxx"
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] pl-16 pr-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Primary Email</label>
                        <input
                            type="email"
                            name="primaryEmail"
                            value={form.primaryEmail}
                            onChange={(e) => setForm({ ...form, primaryEmail: e.target.value.toLowerCase() })}
                            placeholder="person@email.com"
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Residential Address</label>
                        <textarea
                            name="address"
                            rows={3}
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Villa/Apt, Area, City..."
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                </div>
            </div>

            {/* Balance & Portal */}
            <div className="rounded-2xl border-2 border-dashed border-[var(--c-border)] bg-[var(--c-panel)]/30 p-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Opening Balance</label>
                        <input
                            type="number"
                            name="openingBalance"
                            value={form.openingBalance}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Balance Type</label>
                        <select
                            name="balanceType"
                            value={form.balanceType}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        >
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Create Portal TX?</label>
                        <select
                            name="createPortalTransaction"
                            value={form.createPortalTransaction ? "Yes" : "No"}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    createPortalTransaction: e.target.value === "Yes",
                                    portalId: e.target.value === "Yes" ? prev.portalId : '',
                                    portalMethod: e.target.value === "Yes" ? prev.portalMethod : '',
                                }))
                            }
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Target Portal</label>
                        <IconSelect
                            value={form.portalId}
                            onChange={(nextPortalId) => setForm((prev) => ({ ...prev, portalId: nextPortalId, portalMethod: '' }))}
                            options={portalOptions}
                            placeholder="Select Portal"
                            disabled={!form.createPortalTransaction}
                        />
                    </div>
                </div>
                <div className="mt-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3">
                    <label className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Send Welcome Email</span>
                        <input
                            type="checkbox"
                            name="sendWelcomeEmail"
                            checked={!!form.sendWelcomeEmail}
                            onChange={(e) => setForm((prev) => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                            className="h-4 w-4 accent-[var(--c-accent)]"
                        />
                    </label>
                    <p className="mt-1 text-[10px] text-[var(--c-muted)]">Applies to this client only. Uses Mail Configuration template.</p>
                </div>
                {form.createPortalTransaction && selectedPortal && (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--c-muted)]">Selected Portal</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-lg">
                                    <img
                                        src={selectedPortal.iconUrl || fallbackPortalIcon(selectedPortal.type)}
                                        alt={selectedPortal.name}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = fallbackPortalIcon(selectedPortal.type);
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[var(--c-text)]">{selectedPortal.name}</p>
                                    <p className="text-xs font-bold text-[var(--c-muted)]">{selectedPortal.type || 'Portal'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Portal Balance</p>
                            <p className="text-lg font-black text-emerald-800">
                                <DirhamAmount amount={selectedPortal.balance} />
                            </p>
                            {form.openingBalance && (
                                <p className="text-xs font-semibold text-emerald-700">
                                    After posting: <DirhamAmount amount={projectedBalance} className="text-xs font-semibold text-emerald-700" />
                                </p>
                            )}
                        </div>
                    </div>
                )}
                {form.createPortalTransaction && selectedPortal && (
                    <div className="mt-4 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Portal Transaction Method {form.openingBalance && '*'}</label>
                        <IconSelect
                            value={form.portalMethod}
                            onChange={(nextMethod) => setForm((prev) => ({ ...prev, portalMethod: nextMethod }))}
                            options={methodOptions}
                            placeholder="Select Method"
                            disabled={!form.createPortalTransaction || !selectedPortal}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-[var(--c-accent)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50"
                >
                    {isSaving ? 'Registering...' : 'Register Individual'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-6 py-3.5 text-sm font-bold text-[var(--c-muted)] transition hover:text-[var(--c-text)]"
                >
                    Cancel
                </button>
            </div>

            {status.message && (
                <div className={`rounded-xl border p-4 text-center text-sm font-bold animate-pulse ${status.type === 'error' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'}`}>
                    {status.message}
                </div>
            )}
        </form>
    );
};

export default IndividualRegistrationForm;
