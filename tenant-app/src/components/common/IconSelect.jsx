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
    const triggerClass = [
        'flex w-full items-center justify-between rounded-[1.15rem]',
        'border border-white/40 bg-[color:color-mix(in_srgb,var(--c-surface)_82%,white_18%)]',
        'px-3 py-2.5 text-left text-sm font-bold shadow-sm outline-none transition',
        'text-[var(--c-text)]',
        'shadow-[-10px_-10px_18px_rgba(255,255,255,0.7),10px_10px_22px_rgba(148,163,184,0.22)]',
        'focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/10',
        'disabled:opacity-50',
    ].join(' ');
    const panelClass = [
        'absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-[1.25rem]',
        'border border-white/45 bg-[color:color-mix(in_srgb,var(--c-surface)_88%,white_12%)]',
        'p-2 shadow-2xl',
        'shadow-[-12px_-12px_24px_rgba(255,255,255,0.72),14px_14px_28px_rgba(148,163,184,0.24)]',
        'backdrop-blur-sm',
    ].join(' ');

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
                className={triggerClass}
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
                <div className={panelClass}>
                    {searchable ? (
                        <div className="sticky top-0 z-10 mb-1 rounded-xl bg-[color:color-mix(in_srgb,var(--c-surface)_90%,white_10%)] p-1">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(event) => onSearchChange?.(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full rounded-xl border border-white/40 bg-[color:color-mix(in_srgb,var(--c-panel)_82%,white_18%)] px-3 py-2 text-xs font-semibold text-[var(--c-text)] outline-none transition shadow-[inset_2px_2px_5px_rgba(148,163,184,0.16),inset_-2px_-2px_5px_rgba(255,255,255,0.65)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
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
                                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                                    opt.value === value
                                        ? 'border border-[var(--c-accent)]/20 bg-[color:color-mix(in_srgb,var(--c-accent)_14%,white_86%)] text-[var(--c-accent)] shadow-[inset_2px_2px_6px_rgba(148,163,184,0.14),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]'
                                        : 'border border-transparent text-[var(--c-text)] hover:border-white/35 hover:bg-[color:color-mix(in_srgb,var(--c-panel)_78%,white_22%)] hover:shadow-[inset_2px_2px_6px_rgba(148,163,184,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.62)]'
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
