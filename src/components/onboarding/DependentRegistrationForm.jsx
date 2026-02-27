import { useState, useEffect, useRef, useCallback } from 'react';
import { searchClients, generateDisplayClientId, getTenantSettingDoc, db, checkIndividualDuplicate, upsertDependentUnderParent } from '../../lib/backendStore';
import { doc, getDoc } from 'firebase/firestore';
import IconSelect from '../common/IconSelect';
import { resolveClientTypeIcon } from '../../lib/clientIcons';

const DependentRegistrationForm = ({ activeType, tenantId, user, onCancel, onSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [parent, setParent] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [nextId, setNextId] = useState('...');
    const [form, setForm] = useState({
        fullName: '',
        relationship: '',
        identificationMethod: 'emiratesId',
        emiratesId: '',
        passportNumber: '',
        workPermitNumber: '',
        personCode: '',
        mobile: '',
        email: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const submitLockRef = useRef(false);
    const parentType = String(parent?.type || '').toLowerCase();

    useEffect(() => {
        if (!parent) return;
        const loadNextId = async () => {
            const settingsRes = await getTenantSettingDoc(tenantId, 'transactionIdRules');
            const rules = settingsRes.ok && settingsRes.data ? settingsRes.data['DPID'] || {} : {};
            const prefix = rules.prefix || 'DPID';
            const padding = Number(rules.padding) || 4;

            const counterSnap = await getDoc(doc(db, 'tenants', tenantId, 'counters', 'clients'));
            const currentSeq = counterSnap.exists() ? counterSnap.data().lastDependentSeq || 0 : 0;
            setNextId(`${prefix}${String(currentSeq + 1).padStart(padding, '0')}`);
        };
        loadNextId();
    }, [tenantId, parent]);

    const handleSearch = useCallback(async () => {
        const queryText = String(searchQuery || '').trim();
        setIsSearching(true);
        const res = await searchClients(tenantId, queryText);
        if (res.ok) {
            const eligibleParents = (res.rows || []).filter(
                (item) => item.type === 'company' || item.type === 'individual',
            );
            setSearchResults(eligibleParents);
        }
        setIsSearching(false);
    }, [searchQuery, tenantId]);

    useEffect(() => {
        if (!tenantId || parent) return;
        const timer = setTimeout(() => {
            handleSearch();
        }, 250);
        return () => clearTimeout(timer);
    }, [handleSearch, parent, tenantId]);

    const parentOptions = searchResults.map((item) => ({
        value: item.id,
        label: item.fullName || item.tradeName || 'Unnamed',
        icon: resolveClientTypeIcon(item, null),
        meta: `${item.displayClientId || item.id} • ${item.type}`,
    }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!parent) return;
        if (parentType === 'company') {
            setForm((prev) => ({ ...prev, relationship: 'employee' }));
            return;
        }
        setForm((prev) => ({
            ...prev,
            relationship: prev.relationship || 'wife',
        }));
    }, [parent, parentType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLockRef.current || isSaving) return;
        submitLockRef.current = true;
        setIsSaving(true);
        let shouldUnlock = true;
        setStatus({ type: 'info', message: 'Validating dependent data...' });

        try {
            const normalized = {
                ...form,
                fullName: form.fullName.toUpperCase().trim(),
                identificationMethod: String(form.identificationMethod || 'emiratesId'),
                emiratesId: form.emiratesId.replace(/-/g, '').trim(),
                passportNumber: form.passportNumber.toUpperCase().trim(),
                workPermitNumber: String(form.workPermitNumber || '').replace(/\D/g, '').slice(0, 10),
                personCode: String(form.personCode || '').replace(/\D/g, '').slice(0, 14),
                mobile: String(form.mobile || '').replace(/\D/g, ''),
                email: String(form.email || '').trim().toLowerCase(),
                tenantId,
                parentId: parent.id,
                parentName: parent.fullName || parent.tradeName,
                parentClientType: parentType,
                createdBy: user.uid,
                status: 'active'
            };

            if (!parent || parent.type === 'dependent') {
                setStatus({ type: 'error', message: 'Please select a valid parent client (company or individual).' });
                return;
            }

            if (normalized.identificationMethod === 'emiratesId' && normalized.emiratesId.length !== 15) {
                setStatus({ type: 'error', message: 'Emirates ID must be 15 digits.' });
                return;
            }
            if (normalized.identificationMethod === 'emiratesId' && !normalized.emiratesId.startsWith('784')) {
                setStatus({ type: 'error', message: 'Emirates ID must start with 784.' });
                return;
            }
            if (normalized.identificationMethod === 'passport') {
                if (!normalized.passportNumber) {
                    setStatus({ type: 'error', message: 'Passport Number is required in Passport mode.' });
                    return;
                }
                if (!/^[A-Z0-9]{1,10}$/.test(normalized.passportNumber)) {
                    setStatus({ type: 'error', message: 'Passport must be uppercase alphanumeric (max 10 chars).' });
                    return;
                }
            }
            if (parentType === 'company' && normalized.relationship !== 'employee') {
                setStatus({ type: 'error', message: 'Company parent relation is fixed to Employee.' });
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
                    setStatus({ type: 'error', message: `Passport ${normalized.passportNumber} + ${normalized.fullName} already exists.` });
                } else {
                    setStatus({ type: 'error', message: `Emirates ID ${normalized.emiratesId} is already registered.` });
                }
                return;
            }

            setStatus({ type: 'info', message: 'Generating Dependent ID...' });
            const displayId = await generateDisplayClientId(tenantId, 'dependent');

            const finalPayload = {
                ...normalized,
                displayClientId: displayId,
                type: 'dependent'
            };

            setStatus({ type: 'info', message: 'Saving to database...' });
            // Strict rule: dependent backend doc ID must be the generated DPID value (no random UID).
            const dependentDocId = displayId;
            const res = await upsertDependentUnderParent(tenantId, parent.id, dependentDocId, finalPayload);

            if (res.ok) {
                shouldUnlock = false;
                setStatus({ type: 'success', message: `Successfully registered as ${displayId} !` });
                setTimeout(() => {
                    if (onSuccess) onSuccess({ id: res.id, ...finalPayload });
                }, 1000);
            } else {
                setStatus({ type: 'error', message: res.error || 'Failed to register dependent.' });
            }
        } finally {
            if (shouldUnlock) {
                submitLockRef.current = false;
                setIsSaving(false);
            }
        }
    };

    if (!parent) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-4 border-b border-[var(--c-border)] pb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--c-text)]">Step 1: Link to Parent/Sponsor</h2>
                </header>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Parent/Sponsor *</label>
                    <IconSelect
                        value=""
                        onChange={(selectedId) => {
                            const selected = searchResults.find((item) => item.id === selectedId) || null;
                            if (selected) setParent(selected);
                        }}
                        options={parentOptions}
                        placeholder={isSearching ? 'Searching...' : 'Select parent client'}
                        searchable
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Search by Name or Emirates ID..."
                    />
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex items-center justify-between border-b border-[var(--c-border)] pb-6">
                <div>
                    <h2 className="text-xl font-black text-[var(--c-text)] uppercase">{activeType} Registration</h2>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Linked to:</span>
                        <span className="rounded-full bg-[var(--c-accent)]/10 px-2.5 py-0.5 text-[10px] font-black text-[var(--c-accent)]">
                            {parent.fullName || parent.tradeName} ({parent.displayClientId})
                        </span>
                        <button type="button" onClick={() => setParent(null)} className="text-[10px] font-bold text-rose-500 hover:underline">Change</button>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Next Available ID</p>
                    <p className="text-lg font-black text-[var(--c-accent)]">{nextId}</p>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Dependent Full Name *</label>
                        <input
                            type="text"
                            name="fullName"
                            required
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value.toUpperCase() })}
                            placeholder="AS PER EID"
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Identification Method *</label>
                            <select
                                name="identificationMethod"
                                value={form.identificationMethod}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        identificationMethod: e.target.value,
                                        emiratesId: e.target.value === 'emiratesId' ? prev.emiratesId : '',
                                        passportNumber: e.target.value === 'passport' ? prev.passportNumber : '',
                                    }))
                                }
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            >
                                <option value="emiratesId">Emirates ID</option>
                                <option value="passport">Passport</option>
                            </select>
                        </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                            {form.identificationMethod === 'passport' ? 'Passport *' : 'Emirates ID *'}
                        </label>
                        <input
                            type="text"
                            name={form.identificationMethod === 'passport' ? 'passportNumber' : 'emiratesId'}
                            required
                            maxLength={form.identificationMethod === 'passport' ? 10 : 15}
                            value={form.identificationMethod === 'passport' ? form.passportNumber : form.emiratesId}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    [form.identificationMethod === 'passport' ? 'passportNumber' : 'emiratesId']:
                                        form.identificationMethod === 'passport'
                                            ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                                            : e.target.value.replace(/\D/g, '')
                                }))
                            }
                            placeholder={form.identificationMethod === 'passport' ? 'N123456' : '784xxxxxxxxxxxx'}
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Relation *</label>
                        {parentType === 'company' ? (
                            <input
                                type="text"
                                name="relationship"
                                readOnly
                                value="employee"
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-sm font-bold text-[var(--c-muted)] shadow-sm"
                            />
                        ) : (
                            <select
                                name="relationship"
                                required
                                value={form.relationship}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            >
                                <option value="wife">Wife</option>
                                <option value="husband">Husband</option>
                                <option value="son">Son</option>
                                <option value="daughter">Daughter</option>
                                <option value="father">Father</option>
                                <option value="mother">Mother</option>
                                <option value="domestic worker">Domestic Worker</option>
                            </select>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Mobile Number</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={form.mobile}
                                onChange={handleChange}
                                placeholder="5xxxxxxxx"
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="person@email.com"
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {parentType === 'company' ? (
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Work Permit Number</label>
                        <input
                            type="text"
                            name="workPermitNumber"
                            maxLength={10}
                            value={form.workPermitNumber}
                            onChange={(e) => setForm((prev) => ({ ...prev, workPermitNumber: e.target.value.replace(/\D/g, '') }))}
                            placeholder="Max 10 digits"
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Person Code</label>
                        <input
                            type="text"
                            name="personCode"
                            maxLength={14}
                            value={form.personCode}
                            onChange={(e) => setForm((prev) => ({ ...prev, personCode: e.target.value.replace(/\D/g, '') }))}
                            placeholder="Max 14 digits"
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                        <p className="text-[10px] font-semibold text-[var(--c-muted)]">Issued by MOHRE and available in employee list.</p>
                    </div>
                </div>
            ) : null}

            <div className="flex items-center gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-[var(--c-accent)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50"
                >
                    {isSaving ? 'Registering...' : 'Register Dependent'}
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

export default DependentRegistrationForm;
