import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import 'react-phone-input-2/lib/style.css';
import {
  COUNTRY_PHONE_OPTIONS,
  DEFAULT_COUNTRY_PHONE_ISO2,
  PREFERRED_COUNTRY_ORDER,
  findCountryPhoneOption,
} from '../../lib/countryPhoneData';

const FlagSprite = ({ iso2 }) => (
  <span className="acis-phone-flag-sprite react-tel-input" style={{ width: 'auto', position: 'static', display: 'inline-flex' }}>
    <span className={`flag ${String(iso2 || '').toLowerCase()}`} style={{ display: 'block', margin: 0 }} />
  </span>
);

const CountryPhoneField = ({
  countryIso2 = DEFAULT_COUNTRY_PHONE_ISO2,
  value = '',
  onCountryChange,
  onValueChange,
  onValuePaste,
  onValueBlur,
  id,
  name,
  placeholder = 'Enter mobile number',
  errorMessage = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedCountry = findCountryPhoneOption(countryIso2);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const orderedCountries = useMemo(() => {
    const preferred = [];
    const rest = [];
    COUNTRY_PHONE_OPTIONS.forEach((country) => {
      if (PREFERRED_COUNTRY_ORDER.includes(country.iso2)) preferred.push(country);
      else rest.push(country);
    });
    preferred.sort((left, right) => PREFERRED_COUNTRY_ORDER.indexOf(left.iso2) - PREFERRED_COUNTRY_ORDER.indexOf(right.iso2));
    return [...preferred, ...rest];
  }, []);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orderedCountries;
    return orderedCountries.filter((country) =>
      country.name.toLowerCase().includes(query)
      || country.iso2.toLowerCase().includes(query)
      || country.dialCode.includes(query.replace(/^\+/, '')),
    );
  }, [orderedCountries, searchQuery]);

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
    <div ref={rootRef} className="relative mt-1">
      <div
        className={`compact-field flex overflow-hidden rounded-2xl border bg-[var(--c-panel)] text-[var(--c-text)] shadow-sm transition ${
          errorMessage
            ? 'border-red-400/70 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-400/10'
            : 'border-[var(--c-border)] focus-within:border-[var(--c-accent)] focus-within:ring-4 focus-within:ring-[var(--c-accent)]/5'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (isOpen) closeDropdown();
            else setIsOpen(true);
          }}
          className="inline-flex h-full shrink-0 items-center gap-2 border-r border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_32%,var(--c-panel)_68%)] px-3 text-left outline-none transition hover:bg-[color:color-mix(in_srgb,var(--c-surface)_42%,var(--c-panel)_58%)] focus-visible:bg-[color:color-mix(in_srgb,var(--c-surface)_42%,var(--c-panel)_58%)]"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <FlagSprite iso2={selectedCountry.iso2} />
          <ChevronDown className={`h-4 w-4 text-[var(--c-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="inline-flex items-center border-r border-[var(--c-border)] px-2.5 text-[13px] font-semibold text-[var(--c-text)]">
          +{selectedCountry.dialCode}
        </div>
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          onPaste={onValuePaste}
          onBlur={onValueBlur}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-[var(--c-text)] outline-none placeholder:text-[var(--c-muted)]"
        />
      </div>
      {errorMessage ? (
        <p className="mt-2 text-xs font-bold normal-case tracking-normal text-red-400">
          {errorMessage}
        </p>
      ) : null}

      {isOpen ? (
        <div className="compact-popover absolute left-0 top-[calc(100%+0.45rem)] z-[80] overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] shadow-[0_24px_48px_-28px_color-mix(in_srgb,var(--c-text)_55%,transparent)]">
          <div className="border-b border-[var(--c-border)] p-3">
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search country or code"
              className="w-full rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_16%,var(--c-panel)_84%)] px-3 py-2.5 text-sm font-semibold text-[var(--c-text)] outline-none transition placeholder:text-[var(--c-muted)] focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/10"
            />
          </div>

          <div className="overflow-y-auto py-1" style={{ maxHeight: 'var(--d-popover-max-h)' }}>
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-sm font-semibold text-[var(--c-muted)]">No country found</div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.iso2 === selectedCountry.iso2;
                return (
                  <button
                    key={`${country.iso2}-${country.dialCode}`}
                    type="button"
                    onClick={() => {
                      onCountryChange?.(country.iso2);
                      closeDropdown();
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      isSelected
                        ? 'bg-[var(--c-accent-soft)] text-[var(--c-text)]'
                        : 'text-[var(--c-text)] hover:bg-[color:color-mix(in_srgb,var(--c-surface)_18%,var(--c-panel)_82%)]'
                    }`}
                  >
                    <FlagSprite iso2={country.iso2} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{country.name}</span>
                      <span className="block text-xs font-semibold text-[var(--c-muted)]">+{country.dialCode}</span>
                    </span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-[var(--c-accent)]" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CountryPhoneField;
