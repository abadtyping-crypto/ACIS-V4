import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import CountryPhoneField from './CountryPhoneField';
import { WhatsAppIcon } from '../settings/BrandingSubsections';
import { DEFAULT_COUNTRY_PHONE_ISO2 } from '../../lib/countryPhoneData';
import {
  createMobileContact,
  ensureMobileContacts,
  normalizeMobileContactValue,
  validateMobileContact,
} from '../../lib/mobileContactUtils';

const buttonBaseClass = 'inline-flex items-center justify-center rounded-2xl border transition';

const MobileContactsField = ({
  label = 'Mobile Numbers',
  contacts = [createMobileContact()],
  onChange,
  maxContacts = 3,
  required = false,
  className = '',
}) => {
  const safeContacts = useMemo(() => ensureMobileContacts(contacts), [contacts]);
  const [errors, setErrors] = useState({});

  const commitContacts = (nextContacts) => {
    onChange?.(ensureMobileContacts(nextContacts));
  };

  const updateContact = (contactId, mutate) => {
    commitContacts(safeContacts.map((contact) => (
      contact.id === contactId ? mutate(contact) : contact
    )));
  };

  const appendContact = () => {
    if (safeContacts.length >= maxContacts) return;
    commitContacts([...safeContacts, createMobileContact()]);
  };

  const removeContact = (contactId) => {
    const nextContacts = safeContacts.filter((contact) => contact.id !== contactId);
    commitContacts(nextContacts.length ? nextContacts : [createMobileContact()]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
  };

  const toggleWhatsApp = (contactId) => {
    let shouldAppend = false;
    const nextContacts = safeContacts.map((contact) => {
      if (contact.id !== contactId) return contact;
      const nextEnabled = !contact.whatsAppEnabled;
      if (!nextEnabled && safeContacts.length < maxContacts) shouldAppend = true;
      return { ...contact, whatsAppEnabled: nextEnabled };
    });
    commitContacts(shouldAppend ? [...nextContacts, createMobileContact()] : nextContacts);
  };

  const handleBlur = (contactId, contact, index) => {
    const fieldLabel = index === 0 && required ? 'Mobile number' : `Mobile number ${index + 1}`;
    setErrors((prev) => ({
      ...prev,
      [contactId]: validateMobileContact(contact.value, contact.countryIso2, fieldLabel),
    }));
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">{label}</p>
        <button
          type="button"
          onClick={appendContact}
          disabled={safeContacts.length >= maxContacts}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Add mobile number"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 normal-case tracking-normal">
        {safeContacts.map((contact, index) => (
          <div key={contact.id} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <CountryPhoneField
                countryIso2={contact.countryIso2 || DEFAULT_COUNTRY_PHONE_ISO2}
                value={contact.value}
                onCountryChange={(countryIso2) => {
                  const normalized = normalizeMobileContactValue(contact.value, countryIso2);
                  updateContact(contact.id, (current) => ({
                    ...current,
                    countryIso2,
                    value: normalized,
                  }));
                  setErrors((prev) => (
                    prev[contact.id]
                      ? { ...prev, [contact.id]: validateMobileContact(normalized, countryIso2, `Mobile number ${index + 1}`) }
                      : prev
                  ));
                }}
                onValueChange={(value) => {
                  const normalized = normalizeMobileContactValue(value, contact.countryIso2);
                  updateContact(contact.id, (current) => ({ ...current, value: normalized }));
                  setErrors((prev) => (
                    prev[contact.id]
                      ? { ...prev, [contact.id]: validateMobileContact(normalized, contact.countryIso2, `Mobile number ${index + 1}`) }
                      : prev
                  ));
                }}
                onValuePaste={(event) => {
                  const pastedText = event.clipboardData?.getData('text') || '';
                  if (!pastedText) return;
                  event.preventDefault();
                  const normalized = normalizeMobileContactValue(pastedText, contact.countryIso2);
                  updateContact(contact.id, (current) => ({ ...current, value: normalized }));
                  setErrors((prev) => (
                    prev[contact.id]
                      ? { ...prev, [contact.id]: validateMobileContact(normalized, contact.countryIso2, `Mobile number ${index + 1}`) }
                      : prev
                  ));
                }}
                onValueBlur={() => handleBlur(contact.id, contact, index)}
                name={`mobile-contact-${index + 1}`}
                placeholder={contact.countryIso2 === DEFAULT_COUNTRY_PHONE_ISO2 ? 'XX XXX XXXX' : 'XXXX'}
                errorMessage={errors[contact.id] || ''}
              />
            </div>

            <button
              type="button"
              onClick={() => toggleWhatsApp(contact.id)}
              className={`${buttonBaseClass} mt-1 h-14 w-14 shrink-0 ${
                contact.whatsAppEnabled
                  ? 'border-emerald-500/50 bg-emerald-500/12 text-emerald-400'
                  : 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]'
              }`}
              aria-label={contact.whatsAppEnabled ? 'Disable WhatsApp for this number' : 'Enable WhatsApp for this number'}
              title={contact.whatsAppEnabled ? 'WhatsApp enabled' : 'WhatsApp disabled'}
            >
              <WhatsAppIcon className="h-6 w-6" />
            </button>

            {safeContacts.length > 1 ? (
              <button
                type="button"
                onClick={() => removeContact(contact.id)}
                className={`${buttonBaseClass} mt-1 h-14 w-14 shrink-0 border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)] hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400`}
                aria-label="Remove mobile number"
                title="Remove mobile number"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileContactsField;
