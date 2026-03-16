import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { EMIRATE_OPTIONS, findEmirateOption } from '../../lib/emirateData';

const EmirateSelect = ({
  value = '',
  onChange,
  placeholder = 'Select emirate',
  searchPlaceholder = 'Search emirate',
  emptyMessage = 'No emirate found',
  errorMessage = '',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const selected = findEmirateOption(value);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectOption = (nextValue) => {
    closeDropdown();
    window.requestAnimationFrame(() => {
      onChange?.(nextValue);
    });
  };

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return EMIRATE_OPTIONS;
    return EMIRATE_OPTIONS.filter((item) => item.label.toLowerCase().includes(query));
  }, [searchQuery]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) closeDropdown();
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') closeDropdown();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isOpen) closeDropdown();
          else if (!disabled) setIsOpen(true);
        }}
        className={`compact-field flex w-full items-center justify-between gap-3 rounded-2xl border bg-[var(--c-panel)] px-3 text-left text-[13px] font-semibold text-[var(--c-text)] outline-none transition ${
          errorMessage
            ? 'border-red-400/70 focus:border-red-400 focus:ring-4 focus:ring-red-400/10'
            : 'border-[var(--c-border)] focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/5'
        } disabled:cursor-not-allowed disabled:opacity-60`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--c-border)] bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
              <img
                src={selected.icon}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-[var(--c-muted)]">{placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--c-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="compact-popover absolute left-0 top-[calc(100%+0.45rem)] z-[80] w-full overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] shadow-[0_24px_48px_-28px_color-mix(in_srgb,var(--c-text)_55%,transparent)]">
          <div className="border-b border-[var(--c-border)] p-3">
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_16%,var(--c-panel)_84%)] px-3 py-2.5 text-sm font-semibold text-[var(--c-text)] outline-none transition placeholder:text-[var(--c-muted)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
            />
          </div>

          <div className="overflow-y-auto py-1" style={{ maxHeight: 'var(--d-popover-max-h)' }}>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm font-semibold text-[var(--c-muted)]">{emptyMessage}</div>
            ) : (
              filteredOptions.map((item) => {
                const isSelected = item.value === value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleSelectOption(item.value)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      isSelected
                        ? 'bg-[var(--c-accent-soft)] text-[var(--c-text)]'
                        : 'text-[var(--c-text)] hover:bg-[color:color-mix(in_srgb,var(--c-surface)_18%,var(--c-panel)_82%)]'
                    }`}
                  >
                    <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--c-border)] bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
                      <img
                        src={item.icon}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{item.label}</span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-[var(--c-accent)]" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 text-xs font-bold normal-case tracking-normal text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default EmirateSelect;
