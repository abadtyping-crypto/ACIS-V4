import { useState, useEffect, useRef } from 'react';
import { searchClients, upsertClient, generateDisplayClientId, getTenantSettingDoc, db, checkIndividualDuplicate } from '../../lib/backendStore';
import { doc, getDoc } from 'firebase/firestore';

const DependentRegistrationForm = ({ activeType, tenantId, user, onCancel, onSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [parent, setParent] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [nextId, setNextId] = useState('...');
    const [form, setForm] = useState({
        fullName: '',
        relationship: '',
        emiratesId: '',
        nationality: '',
        dateOfBirth: '',
        gender: '',
        openingBalance: '',
        balanceType: 'credit'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const submitLockRef = useRef(false);

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

    const handleSearch = async () => {
        if (searchQuery.length < 3) return;
        setIsSearching(true);
        const res = await searchClients(tenantId, searchQuery);
        if (res.ok) {
            const eligibleParents = (res.rows || []).filter(
                (item) => item.type === 'company' || item.type === 'individual',
            );
            setSearchResults(eligibleParents);
        }
        setIsSearching(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

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
                emiratesId: form.emiratesId.replace(/-/g, '').trim(),
                openingBalance: parseFloat(form.openingBalance) || 0,
                tenantId,
                parentId: parent.id,
                parentName: parent.fullName || parent.tradeName,
                createdBy: user.uid,
                status: 'active'
            };

            if (!parent || parent.type === 'dependent') {
                setStatus({ type: 'error', message: 'Please select a valid parent client (company or individual).' });
                return;
            }

            if (normalized.emiratesId.length !== 15) {
                setStatus({ type: 'error', message: 'Emirates ID must be 15 digits.' });
                return;
            }

            setStatus({ type: 'info', message: 'Checking for duplicates...' });
            const exists = await checkIndividualDuplicate(tenantId, normalized.emiratesId);
            if (exists) {
                setStatus({ type: 'error', message: `Emirates ID ${normalized.emiratesId} is already registered.` });
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
            const res = await upsertClient(tenantId, null, finalPayload);

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

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by Name or Emirates ID..."
                        className="flex-1 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="rounded-xl bg-[var(--c-accent)] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[var(--c-accent)]/20 transition hover:opacity-90 disabled:opacity-50"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                <div className="space-y-2">
                    {searchResults.map(res => (
                        <div
                            key={res.id}
                            onClick={() => setParent(res)}
                            className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4 transition hover:border-[var(--c-accent)] hover:bg-[var(--c-accent)]/5"
                        >
                            <div>
                                <p className="text-sm font-black text-[var(--c-text)]">{res.fullName || res.tradeName}</p>
                                <p className="text-[10px] font-bold text-[var(--c-muted)] uppercase tracking-wider">{res.displayClientId} • {res.type}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-[var(--c-accent)]">Select & Link</p>
                            </div>
                        </div>
                    ))}
                    {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                        <p className="py-8 text-center text-xs italic text-[var(--c-muted)]">No active clients found matching your query.</p>
                    )}
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
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Emirates ID *</label>
                        <input
                            type="text"
                            name="emiratesId"
                            required
                            maxLength={15}
                            value={form.emiratesId}
                            onChange={(e) => setForm({ ...form, emiratesId: e.target.value })}
                            placeholder="784xxxx"
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Relationship *</label>
                            <select
                                name="relationship"
                                required
                                value={form.relationship}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            >
                                <option value="">Select</option>
                                <option value="child">Child</option>
                                <option value="spouse">Spouse</option>
                                <option value="parent">Parent</option>
                                <option value="sibling">Sibling</option>
                                <option value="employee">Employee</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Gender *</label>
                            <select
                                name="gender"
                                required
                                value={form.gender}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Date of Birth *</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            required
                            value={form.dateOfBirth}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Initial Balance</label>
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
