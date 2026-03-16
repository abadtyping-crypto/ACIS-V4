import { memo, useEffect, useRef, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { fetchTenantClients } from '../../lib/backendStore';
import { useTenant } from '../../context/useTenant';
import { resolveClientTypeIcon } from '../../lib/clientIcons';
import CurrencyValue from '../common/CurrencyValue';

/**
 * Reusable Client Search Component
 * Supports searching both root clients and dependents.
 * Optimized with local filtering after initial fetch.
 */
const ClientSearchField = ({ onSelect, selectedId, placeholder = 'Search Client...', filterType, parentId }) => {
    const { tenantId } = useTenant();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!tenantId) return;
            setIsLoading(true);
            try {
                const res = await fetchTenantClients(tenantId);
                if (isMounted && res.ok) {
                    let data = res.rows;
                    if (filterType === 'parent') {
                        data = data.filter(c => c.type === 'company' || c.type === 'individual');
                    }
                    if (filterType === 'dependent') {
                        data = data.filter(c => String(c.type || '').toLowerCase() === 'dependent');
                    }
                    if (parentId) {
                        data = data.filter(
                            (c) => String(c.type || '').toLowerCase() === 'dependent' && String(c.parentId) === String(parentId),
                        );
                    }
                    setRows(data);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [tenantId, filterType, parentId]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = query.trim() === ''
        ? rows.slice(0, 5)
        : rows.filter(item => {
            const q = query.toLowerCase();
            return (
                (item.fullName || '').toLowerCase().includes(q) ||
                (item.tradeName || '').toLowerCase().includes(q) ||
                (item.displayClientId || '').toLowerCase().includes(q) ||
                (item.emiratesId || '').includes(q) ||
                (item.primaryMobile || '').includes(q)
            );
        }).slice(0, 15);

    const parentById = rows.reduce((acc, current) => {
        acc[current.id] = current;
        return acc;
    }, {});

    const getClientIcon = (item) => {
        if (!item) return <Search className="h-5 w-5" />;
        const parent = item.parentId ? parentById[item.parentId] : null;
        const iconPath = resolveClientTypeIcon(item, parent);
        return <img src={iconPath || '/avatar.png'} className="h-6 w-6 object-contain" alt="" />;
    };

    const selectedItem = rows.find(r => r.id === selectedId);

    const handleSelect = (item) => {
        onSelect(item);
        setIsOpen(false);
        setQuery('');
    };

    const getBalanceValue = (item) => {
        const raw = item?.balance ?? item?.openingBalance ?? 0;
        const numeric = Number(raw);
        return Number.isFinite(numeric) ? numeric : 0;
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                onClick={() => setIsOpen(true)}
                className={`compact-field flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-xl border bg-[var(--c-panel)] px-3 py-2.5 transition-all ${isOpen ? 'border-[var(--c-accent)] ring-4 ring-[var(--c-accent)]/5' : 'border-[var(--c-border)]'
                    }`}
            >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--c-surface)] text-[var(--c-muted)]">
                    {getClientIcon(selectedItem)}
                </div>
                <div className="min-w-0 flex-1">
                    {selectedItem ? (
                        <>
                            <p className="truncate text-sm font-semibold text-[var(--c-text)]">
                                {selectedItem.fullName || selectedItem.tradeName}
                            </p>
                            <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                {selectedItem.displayClientId} • {selectedItem.type}
                            </p>
                            <div className={`mt-1 text-[10px] ${getBalanceValue(selectedItem) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                <CurrencyValue value={getBalanceValue(selectedItem)} iconSize="h-2.5 w-2.5" />
                            </div>
                        </>
                    ) : (
                        <p className="text-sm font-bold text-[var(--c-muted)]">{placeholder}</p>
                    )}
                </div>
                {isOpen && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--c-surface)]">
                        <ChevronRight className="h-4 w-4 rotate-90 text-[var(--c-muted)]" />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[400px] overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="sticky top-0 border-b border-[var(--c-border)] bg-[var(--c-surface)] p-3">
                        <input
                            autoFocus
                            className="compact-field w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 text-sm font-semibold outline-none focus:border-[var(--c-accent)]"
                            placeholder="Type to search (Name, ID, Mobile, Emirates ID)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-2">
                        {isLoading && rows.length === 0 ? (
                            <p className="p-8 text-center text-xs text-[var(--c-muted)] italic">Fetching clients...</p>
                        ) : filtered.length === 0 ? (
                            <p className="p-8 text-center text-xs font-bold text-[var(--c-muted)] uppercase tracking-widest">No matching results found</p>
                        ) : (
                            filtered.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--c-accent)]/5 ${selectedId === item.id ? 'bg-[var(--c-accent)]/10' : ''
                                        }`}
                                >
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--c-panel)] text-[var(--c-muted)]">
                                        {getClientIcon(item)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[var(--c-text)]">
                                            {item.fullName || item.tradeName}
                                        </p>
                                        <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                            {item.displayClientId} • {item.type} {item.relationship ? `(${item.relationship})` : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[10px] font-semibold ${getBalanceValue(item) < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                            <CurrencyValue value={getBalanceValue(item)} iconSize="h-2.5 w-2.5" />
                                        </p>
                                    </div>
                                    {selectedId === item.id && (
                                        <div className="h-2 w-2 rounded-full bg-[var(--c-accent)]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(ClientSearchField);
