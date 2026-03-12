import { useEffect, useRef, useState } from 'react';

const IconSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select',
    disabled = false,
    searchable = false,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    className = '',
    hideLabel = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);
    const selected = options.find((opt) => opt.value === value) || null;

    useEffect(() => {
        const onDocumentClick = (event) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', onDocumentClick);
        return () => document.removeEventListener('mousedown', onDocumentClick);
    }, []);

    return (
        <div ref={rootRef} className={`relative ${className}`.trim()}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2.5 text-left text-sm font-bold shadow-sm outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10 disabled:opacity-50"
            >
                {selected ? (
                    <span className="flex min-w-0 items-center gap-2">
                        {selected.icon && (
                            typeof selected.icon === 'string' ? (
                                <img src={selected.icon} alt="" className="h-6 w-6 shrink-0 object-contain" />
                            ) : (
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-visible">
                                    <selected.icon className="h-5 w-5 text-[var(--c-accent)]" />
                                </span>
                            )
                        )}
                        {!hideLabel && <span className="truncate text-[var(--c-text)]">{selected.label}</span>}
                    </span>
                ) : (
                    <span className="text-[var(--c-muted)]">{placeholder}</span>
                )}
                <span className="ml-3 text-[10px] text-[var(--c-muted)]">▼</span>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-1 shadow-2xl">
                    {searchable ? (
                        <div className="sticky top-0 z-10 mb-1 rounded-lg bg-[var(--c-surface)] p-1">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(event) => onSearchChange?.(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] px-2.5 py-2 text-xs font-semibold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
                            />
                        </div>
                    ) : null}
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-xs font-semibold text-[var(--c-muted)]">No options available</div>
                    ) : (
                        options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left transition ${
                                    opt.value === value ? 'bg-[var(--c-accent)]/10 text-[var(--c-accent)]' : 'hover:bg-[var(--c-panel)] text-[var(--c-text)]'
                                }`}
                            >
                                {opt.icon && (
                                    typeof opt.icon === 'string' ? (
                                        <img src={opt.icon} alt="" className="h-6 w-6 shrink-0 object-contain" />
                                    ) : (
                                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-visible">
                                            <opt.icon className="h-5 w-5" />
                                        </span>
                                    )
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold">{opt.label}</span>
                                    {opt.meta ? <span className="block truncate text-[10px] font-semibold opacity-70">{opt.meta}</span> : null}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default IconSelect;
