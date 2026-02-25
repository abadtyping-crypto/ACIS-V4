import { useEffect, useRef, useState } from 'react';

const IconSelect = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select',
    disabled = false,
    className = '',
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
                        {selected.icon && <img src={selected.icon} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />}
                        <span className="truncate text-[var(--c-text)]">{selected.label}</span>
                    </span>
                ) : (
                    <span className="text-[var(--c-muted)]">{placeholder}</span>
                )}
                <span className="ml-3 text-xs text-[var(--c-muted)]">▼</span>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-1 shadow-xl">
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
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                                    opt.value === value ? 'bg-[var(--c-accent)]/10' : 'hover:bg-[var(--c-panel)]'
                                }`}
                            >
                                {opt.icon && <img src={opt.icon} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />}
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-[var(--c-text)]">{opt.label}</span>
                                    {opt.meta ? <span className="block truncate text-[10px] font-semibold text-[var(--c-muted)]">{opt.meta}</span> : null}
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
