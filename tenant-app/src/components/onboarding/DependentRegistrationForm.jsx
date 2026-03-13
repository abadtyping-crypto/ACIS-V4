import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    searchClients,
    generateDisplayClientId,
    previewDisplayClientId,
    checkIndividualDuplicate,
    upsertDependentUnderParent
} from '../../lib/backendStore';
import IconSelect from '../common/IconSelect';
import { resolveClientTypeIcon } from '../../lib/clientIcons';
import { canUserPerformAction } from '../../lib/userControlPreferences';

const relationOptionsByParent = {
    company: [
        { value: 'employee', label: 'Employee', icon: '/employee.png' },
        { value: 'investor', label: 'Investor', icon: '/onboardingIcons/investor.svg' },
        { value: 'partner', label: 'Partner', icon: '/onboardingIcons/partner.svg' },
    ],
    individual: [
        { value: 'wife', label: 'Wife', icon: '/onboardingIcons/wife.svg' },
        { value: 'husband', label: 'Husband', icon: '/onboardingIcons/husband.svg' },
        { value: 'son', label: 'Son', icon: '/onboardingIcons/son.svg' },
        { value: 'daughter', label: 'Daughter', icon: '/onboardingIcons/daughter.svg' },
        { value: 'father', label: 'Father', icon: '/onboardingIcons/father.svg' },
        { value: 'mother', label: 'Mother', icon: '/onboardingIcons/mother.svg' },
        { value: 'domestic worker', label: 'Domestic Worker', icon: '/onboardingIcons/domesticWorker.svg' },
    ],
};

const baseIdentificationOptions = [
    { value: 'emiratesId', label: 'Emirates ID', icon: '/onboardingIcons/emiratesId.svg' },
    { value: 'passport', label: 'Passport', icon: '/onboardingIcons/passport.svg' },
];

const employeeExtraIdentificationOptions = [
    { value: 'workPermit', label: 'Work Permit', icon: '/onboardingIcons/workPermit.svg' },
    { value: 'personCode', label: 'Person Code', icon: '/onboardingIcons/personCode.svg' },
];

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
    const isCompanyParent = parentType === 'company';
    const isEmployeeRelation = isCompanyParent && form.relationship === 'employee';

    useEffect(() => {
        if (!parent) return;
        const loadNextId = async () => {
            const previewId = await previewDisplayClientId(tenantId, 'dependent');
            setNextId(previewId);
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

    const parentOptions = useMemo(() => searchResults.map((item) => ({
        value: item.id,
        label: item.fullName || item.tradeName || 'Unnamed',
        icon: resolveClientTypeIcon(item, null),
        meta: `${item.displayClientId || item.id} • ${item.type}`,
    })), [searchResults]);

    const relationOptions = useMemo(() => {
        if (isCompanyParent) return relationOptionsByParent.company;
        return relationOptionsByParent.individual;
    }, [isCompanyParent]);

    const identificationOptions = useMemo(() => {
        if (isEmployeeRelation) return [...baseIdentificationOptions, ...employeeExtraIdentificationOptions];
        return baseIdentificationOptions;
    }, [isEmployeeRelation]);

    useEffect(() => {
        if (!parent) return;
        setForm((prev) => ({
            ...prev,
            relationship: '',
            identificationMethod: 'emiratesId',
            emiratesId: '',
            passportNumber: '',
            workPermitNumber: '',
            personCode: '',
        }));
    }, [parent, parent?.id]);

    useEffect(() => {
        if (!parent || !isCompanyParent) return;
        if (!form.relationship) {
            setForm((prev) => ({ ...prev, relationship: 'employee' }));
        }
    }, [form.relationship, isCompanyParent, parent]);

    useEffect(() => {
        if (isEmployeeRelation) return;
        if (form.identificationMethod === 'workPermit' || form.identificationMethod === 'personCode') {
            setForm((prev) => ({ ...prev, identificationMethod: 'emiratesId' }));
        }
    }, [form.identificationMethod, isEmployeeRelation]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLockRef.current || isSaving) return;
        submitLockRef.current = true;
        setIsSaving(true);
        let shouldUnlock = true;
        setStatus({ type: 'info', message: 'Validating dependent data...' });

        try {
            if (!canUserPerformAction(tenantId, user, 'createClient')) {
                setStatus({ type: 'error', message: "You don't have permission to create clients." });
                return;
            }

            const normalized = {
                ...form,
                fullName: form.fullName.toUpperCase().trim(),
                relationship: String(form.relationship || '').trim().toLowerCase(),
                identificationMethod: String(form.identificationMethod || 'emiratesId'),
                emiratesId: String(form.emiratesId || '').replace(/\D/g, ''),
                passportNumber: String(form.passportNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
                workPermitNumber: String(form.workPermitNumber || '').replace(/\D/g, '').slice(0, 10),
                personCode: String(form.personCode || '').replace(/\D/g, '').slice(0, 14),
                mobile: String(form.mobile || '').replace(/\D/g, ''),
                email: String(form.email || '').trim().toLowerCase(),
                tenantId,
                parentId: parent.id,
                parentName: parent.fullName || parent.tradeName,
                parentClientType: parentType,
                createdBy: user.uid,
                createdByDisplayName: user.displayName || '',
                createdByEmail: user.email || '',
                status: 'active',
                type: 'dependent',
            };

            if (!parent || parent.type === 'dependent') {
                setStatus({ type: 'error', message: 'Please select a valid parent client (company or individual).' });
                return;
            }
            if (!normalized.fullName) {
                setStatus({ type: 'error', message: 'Dependent Full Name is required.' });
                return;
            }
            if (!normalized.relationship) {
                setStatus({ type: 'error', message: 'Relation is required.' });
                return;
            }

            if (normalized.identificationMethod === 'workPermit' || normalized.identificationMethod === 'personCode') {
                if (!isEmployeeRelation) {
                    setStatus({ type: 'error', message: 'Work Permit and Person Code are available only for Employee relation.' });
                    return;
                }
            }

            if (normalized.identificationMethod === 'emiratesId') {
                if (normalized.emiratesId.length !== 15) {
                    setStatus({ type: 'error', message: 'Emirates ID must be 15 digits.' });
                    return;
                }
                if (!normalized.emiratesId.startsWith('784')) {
                    setStatus({ type: 'error', message: 'Emirates ID must start with 784.' });
                    return;
                }
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

            if (normalized.identificationMethod === 'workPermit') {
                if (!normalized.workPermitNumber) {
                    setStatus({ type: 'error', message: 'Work Permit is required when Work Permit identification is selected.' });
                    return;
                }
                if (normalized.workPermitNumber.length > 10) {
                    setStatus({ type: 'error', message: 'Work Permit must be 10 digits max.' });
                    return;
                }
            }

            if (normalized.identificationMethod === 'personCode') {
                if (!normalized.personCode) {
                    setStatus({ type: 'error', message: 'Person Code is mandatory when Person Code identification is selected.' });
                    return;
                }
                if (normalized.personCode.length > 14) {
                    setStatus({ type: 'error', message: 'Person Code must be 14 digits max.' });
                    return;
                }
            }

            if (isCompanyParent && normalized.relationship === 'employee' && !['emiratesId', 'passport', 'workPermit', 'personCode'].includes(normalized.identificationMethod)) {
                setStatus({ type: 'error', message: 'Invalid identification method for Employee relation.' });
                return;
            }
            if (isCompanyParent && normalized.relationship !== 'employee' && !['emiratesId', 'passport'].includes(normalized.identificationMethod)) {
                setStatus({ type: 'error', message: 'Investor/Partner supports Emirates ID or Passport only.' });
                return;
            }

            if (normalized.identificationMethod === 'emiratesId' || normalized.identificationMethod === 'passport') {
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
            }

            setStatus({ type: 'info', message: 'Generating Dependent ID...' });
            const displayId = await generateDisplayClientId(tenantId, 'dependent');

            const finalPayload = {
                ...normalized,
                displayClientId: displayId,
                emiratesId: normalized.identificationMethod === 'emiratesId' ? normalized.emiratesId : '',
                passportNumber: normalized.identificationMethod === 'passport' ? normalized.passportNumber : '',
                workPermitNumber: normalized.identificationMethod === 'workPermit' ? normalized.workPermitNumber : '',
                personCode: normalized.identificationMethod === 'personCode' ? normalized.personCode : '',
            };

            setStatus({ type: 'info', message: 'Saving to database...' });
            const dependentDocId = displayId; // strict: no random UID
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
                            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value.toUpperCase() }))}
                            placeholder="AS PER EID / PASSPORT"
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Relation *</label>
                        <IconSelect
                            value={form.relationship}
                            onChange={(nextRelation) => setForm((prev) => ({ ...prev, relationship: nextRelation }))}
                            options={relationOptions}
                            placeholder="Select relation"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Identification Method *</label>
                        <IconSelect
                            value={form.identificationMethod}
                            onChange={(nextMethod) => setForm((prev) => ({ ...prev, identificationMethod: nextMethod }))}
                            options={identificationOptions}
                            placeholder="Select identification method"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                            {form.identificationMethod === 'passport'
                                ? 'Passport *'
                                : form.identificationMethod === 'workPermit'
                                    ? 'Work Permit *'
                                    : form.identificationMethod === 'personCode'
                                        ? 'Person Code *'
                                        : 'Emirates ID *'}
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={
                                form.identificationMethod === 'passport'
                                    ? 10
                                    : form.identificationMethod === 'workPermit'
                                        ? 10
                                        : form.identificationMethod === 'personCode'
                                            ? 14
                                            : 15
                            }
                            value={
                                form.identificationMethod === 'passport'
                                    ? form.passportNumber
                                    : form.identificationMethod === 'workPermit'
                                        ? form.workPermitNumber
                                        : form.identificationMethod === 'personCode'
                                            ? form.personCode
                                            : form.emiratesId
                            }
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (form.identificationMethod === 'passport') {
                                    setForm((prev) => ({ ...prev, passportNumber: raw.toUpperCase().replace(/[^A-Z0-9]/g, '') }));
                                    return;
                                }
                                if (form.identificationMethod === 'workPermit') {
                                    setForm((prev) => ({ ...prev, workPermitNumber: raw.replace(/\D/g, '') }));
                                    return;
                                }
                                if (form.identificationMethod === 'personCode') {
                                    setForm((prev) => ({ ...prev, personCode: raw.replace(/\D/g, '') }));
                                    return;
                                }
                                setForm((prev) => ({ ...prev, emiratesId: raw.replace(/\D/g, '') }));
                            }}
                            placeholder={
                                form.identificationMethod === 'passport'
                                    ? 'N123456'
                                    : form.identificationMethod === 'workPermit'
                                        ? '10 digit max'
                                        : form.identificationMethod === 'personCode'
                                            ? '14 digit max'
                                            : '784xxxxxxxxxxxx'
                            }
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
