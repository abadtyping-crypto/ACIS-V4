import { memo, useEffect, useRef, useState } from 'react';
import { Search, Tag, ChevronRight, Hash, Plus } from 'lucide-react';
import { fetchServiceTemplates } from '../../lib/serviceTemplateStore';
import { useTenant } from '../../context/useTenant';
import { fetchApplicationIconLibrary } from '../../lib/applicationIconLibraryStore';

const EMIRATES = [
    { name: 'Abu Dhabi', icon: '/emiratesIcon/abudhabi.png' },
    { name: 'Ajman', icon: '/emiratesIcon/ajman.png' },
    { name: 'Dubai', icon: '/emiratesIcon/dubai.png' },
    { name: 'Fujairah', icon: '/emiratesIcon/fujairah.png' },
    { name: 'Ras Al Khaimah', icon: '/emiratesIcon/rasAlKhaaimah.png' },
    { name: 'Sharjah', icon: '/emiratesIcon/sharjah.png' },
    { name: 'Umm Al Quwain', icon: '/emiratesIcon/ummAlQuwain.png' },
];

/**
 * Reusable Service/Template Search Component
 * Optimized for quick selection of application types.
 */
const ServiceSearchField = ({
    onSelect,
    selectedId,
    placeholder = 'Search Template...',
    onCreateNew,
    refreshKey = 0,
    openOnMount = false,
    variant = 'default',
}) => {
    const { tenantId } = useTenant();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [iconUrlById, setIconUrlById] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!tenantId) return;
            setIsLoading(true);
            try {
                const [res, iconRes] = await Promise.all([
                    fetchServiceTemplates(tenantId),
                    fetchApplicationIconLibrary(tenantId),
                ]);
                if (isMounted && res.ok) setRows(res.rows);
                if (isMounted && iconRes.ok) {
                    const next = {};
                    (iconRes.rows || []).forEach((item) => {
                        if (item.iconId && item.iconUrl) next[item.iconId] = item.iconUrl;
                    });
                    setIconUrlById(next);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [tenantId, refreshKey]);

    useEffect(() => {
        if (!openOnMount || selectedId) return;
        setIsOpen(true);
    }, [openOnMount, selectedId]);

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
        ? rows.slice(0, 10)
        : rows.filter(item => {
            const q = query.toLowerCase();
            return (
                (item.name || '').toLowerCase().includes(q) ||
                (item.code || '').toLowerCase().includes(q) ||
                (item.group || '').toLowerCase().includes(q)
            );
        }).slice(0, 20);

    const getTemplateIcon = (item) => {
        if (!item) return <Search className="h-5 w-5" />;
        const iconUrl = iconUrlById[item.iconId] || '';
        if (iconUrl) return <img src={iconUrl} className="h-full w-full object-cover rounded-lg" alt="" />;

        // Match Emirates
        const name = item.name || '';
        const foundEmirate = EMIRATES.find(e => name.toLowerCase().includes(e.name.toLowerCase()));
        if (foundEmirate) return <img src={foundEmirate.icon} className="h-6 w-6 object-contain" alt="" />;

        if (item.group?.toLowerCase().includes('gov')) return <Tag className="h-5 w-5 text-[var(--c-accent)]" />;
        if (item.group?.toLowerCase().includes('private')) return <Tag className="h-5 w-5 text-amber-500" />;

        return <Hash className="h-4 w-4" />;
    };

    const selectedItem = rows.find(r => r.id === selectedId);
    const isCompact = variant === 'compact';

    const handleSelect = (item) => {
        onSelect(item);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                onClick={() => setIsOpen(true)}
                className={`flex w-full cursor-pointer items-center gap-3 border bg-[var(--c-panel)] transition-all ${
                    isCompact ? 'min-h-[42px] rounded-xl px-3 py-2' : 'min-h-[50px] rounded-2xl px-4 py-3'
                } ${isOpen ? 'border-[var(--c-accent)] ring-4 ring-[var(--c-accent)]/5' : 'border-[var(--c-border)]'
                    }`}
            >
                <div className={`flex flex-shrink-0 items-center justify-center bg-[var(--c-surface)] text-[var(--c-muted)] ${isCompact ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'}`}>
                    {getTemplateIcon(selectedItem)}
                </div>
                <div className="min-w-0 flex-1">
                    {selectedItem ? (
                        <>
                            <p className={`truncate font-black text-[var(--c-text)] ${isCompact ? 'text-xs' : 'text-sm'}`}>
                                {selectedItem.name}
                            </p>
                            {selectedItem.description ? (
                                <p className={`truncate text-[var(--c-muted)] ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{selectedItem.description}</p>
                            ) : null}
                            <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase text-[var(--c-muted)]`}>
                                {selectedItem.code} • {selectedItem.group}
                            </p>
                        </>
                    ) : (
                        <p className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold text-[var(--c-muted)]`}>{placeholder}</p>
                    )}
                </div>
                {isOpen && (
                    <div className={`flex items-center justify-center bg-[var(--c-surface)] ${isCompact ? 'h-7 w-7 rounded-md' : 'h-8 w-8 rounded-lg'}`}>
                        <ChevronRight className="h-4 w-4 rotate-90 text-[var(--c-muted)]" />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[400px] overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="sticky top-0 border-b border-[var(--c-border)] bg-[var(--c-surface)] p-3">
                        <input
                            autoFocus
                            className="w-full font-bold rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-sm outline-none focus:border-[var(--c-accent)]"
                            placeholder="Search applications..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-2">
                        {isLoading && rows.length === 0 ? (
                            <p className="p-8 text-center text-xs text-[var(--c-muted)] italic">Fetching templates...</p>
                        ) : filtered.length === 0 ? (
                            <div className="p-8 text-center space-y-3">
                                <p className="text-xs font-bold text-[var(--c-muted)]">No matching template found.</p>
                                <button
                                    type="button"
                                    onClick={() => onCreateNew?.()}
                                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-[var(--c-accent)] text-[10px] font-black text-white uppercase shadow-lg shadow-[var(--c-accent)]/20"
                                >
                                    <Plus size={12} /> Create Custom
                                </button>
                            </div>
                        ) : (
                            filtered.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--c-accent)]/5 ${selectedId === item.id ? 'bg-[var(--c-accent)]/10' : ''
                                        }`}
                                >
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--c-panel)] text-[var(--c-muted)]">
                                        {getTemplateIcon(item)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-black text-[var(--c-text)]">
                                            {item.name}
                                        </p>
                                        {item.description ? (
                                            <p className="truncate text-[10px] text-[var(--c-muted)]">{item.description}</p>
                                        ) : null}
                                        <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">
                                            {item.code} • {item.group}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-[var(--c-text)]">{item.clientCharge}</p>
                                        <p className="text-[9px] font-bold text-[var(--c-muted)]">Gov: {item.govCharge}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(ServiceSearchField);
