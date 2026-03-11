import React from 'react';
import { Building2, Plus, Trash2, Share2, Banknote, Image, MessageSquare, Facebook, Instagram, Twitter, Linkedin, Layout, Library, ChevronDown, Phone } from 'lucide-react';
import IconSelect from '../common/IconSelect';
import ImageStudio from '../common/ImageStudio';

export const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`${className || ''} overflow-visible`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M13.601 2.326A7.854 7.854 0 0 0 8.034 0C3.641 0 .067 3.574.065 7.965A7.902 7.902 0 0 0 1.141 12L0 16l4.111-1.074a7.9 7.9 0 0 0 3.923 1.007h.003c4.393 0 7.967-3.573 7.968-7.965a7.9 7.9 0 0 0-2.404-5.642zM8.037 14.54h-.003a6.49 6.49 0 0 1-3.312-.908l-.237-.14-2.438.637.651-2.373-.154-.243a6.51 6.51 0 0 1-1.007-3.496C1.539 4.43 4.459 1.51 8.038 1.51c1.73 0 3.356.674 4.578 1.896a6.44 6.44 0 0 1 1.895 4.576c-.002 3.58-2.922 6.498-6.474 6.498z" />
    <path d="M11.615 9.401c-.196-.098-1.16-.572-1.34-.638-.18-.066-.312-.098-.443.098-.131.196-.508.638-.623.77-.115.131-.23.147-.426.049-.195-.098-.824-.304-1.57-.97-.58-.517-.972-1.156-1.087-1.352-.115-.196-.012-.302.086-.4.088-.087.196-.23.295-.345.098-.114.131-.196.196-.327.066-.131.033-.245-.016-.344-.05-.098-.443-1.068-.607-1.463-.16-.386-.322-.333-.442-.339l-.377-.007a.727.727 0 0 0-.525.245c-.18.196-.689.672-.689 1.639s.705 1.902.803 2.033c.098.131 1.388 2.12 3.363 2.971.47.203.837.324 1.123.414.472.151.902.13 1.242.079.379-.057 1.16-.474 1.324-.932.163-.458.163-.85.114-.932-.05-.082-.18-.131-.377-.229z" />
  </svg>
);

export const CompanyInfoSection = React.memo(({ 
  form, 
  errors, 
  updateField, 
  addArrayField, 
  removeArrayField, 
  handlePhoneArrayChange, 
  handlePoBoxChange, 
  updateArrayField,
  emiratesOptions,
  poBoxDisabled,
  labelClass,
  inputClass
}) => (
  <section className="space-y-4">
    <div className="flex items-center gap-2 border-b border-(--c-border) pb-2 text-(--c-accent)">
      <Building2 className="h-5 w-5" />
      <span className="text-sm font-bold uppercase tracking-wider text-(--c-text)">Company Information</span>
    </div>
    
    <div className="grid gap-4 md:grid-cols-2">
      <label className={labelClass}>
        Company Name
        <input
          className={inputClass}
          value={form.companyName}
          onChange={(event) => updateField('companyName', event.target.value.toUpperCase())}
          placeholder="COMPANY NAME"
        />
        {errors.companyName ? <p className="mt-1 text-xs text-rose-600">{errors.companyName}</p> : null}
      </label>

      <label className={labelClass}>
        Brand Name (Short)
        <input
          className={inputClass}
          value={form.brandName}
          onChange={(event) => updateField('brandName', event.target.value.toUpperCase())}
          placeholder="BRAND NAME"
        />
        {errors.brandName ? <p className="mt-1 text-xs text-rose-600">{errors.brandName}</p> : null}
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Landlines</span>
          <button type="button" onClick={() => addArrayField('landlines')} className="text-xs font-semibold text-(--c-accent) hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        {form.landlines.map((val, idx) => (
          <div key={`landline-${idx}`} className="flex items-center rounded-xl border border-(--c-border) bg-(--c-panel) px-3">
            <span className="pr-2 text-sm text-(--c-muted)">+971</span>
            <input
              className="w-full bg-transparent py-2.5 text-sm text-(--c-text) outline-none"
              value={val}
              onChange={(event) => handlePhoneArrayChange('landlines', idx, event.target.value)}
              inputMode="numeric"
              maxLength={9}
              placeholder="4xxxxxxx"
            />
            {idx > 0 && (
              <button type="button" onClick={() => removeArrayField('landlines', idx)} className="text-(--c-muted) hover:text-rose-500 pl-2">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {errors.phones ? <p className="mt-1 text-xs text-rose-600">{errors.phones}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Mobile Numbers</span>
          <button type="button" onClick={() => addArrayField('mobiles')} className="text-xs font-semibold text-(--c-accent) hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        {form.mobiles.map((val, idx) => (
          <div key={`mobile-${idx}`} className="flex items-center rounded-xl border border-(--c-border) bg-(--c-panel) px-3">
            <span className="pr-2 text-sm text-(--c-muted)">+971</span>
            <input
              className="w-full bg-transparent py-2.5 text-sm text-(--c-text) outline-none"
              value={val}
              onChange={(event) => handlePhoneArrayChange('mobiles', idx, event.target.value)}
              inputMode="numeric"
              maxLength={9}
              placeholder="5xxxxxxxx"
            />
            {idx > 0 && (
              <button type="button" onClick={() => removeArrayField('mobiles', idx)} className="text-(--c-muted) hover:text-rose-500 pl-2">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Addresses</span>
          <button type="button" onClick={() => addArrayField('addresses')} className="text-xs font-semibold text-(--c-accent) hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Address</button>
        </div>
        {form.addresses.map((val, idx) => (
          <div key={`address-${idx}`} className="flex items-center gap-2">
            <input
              className={inputClass}
              style={{ marginTop: 0 }}
              value={val}
              onChange={(event) => updateArrayField('addresses', idx, event.target.value)}
              placeholder={idx === 0 ? "Primary address" : "Secondary address"}
            />
            {idx > 0 && (
              <button type="button" onClick={() => removeArrayField('addresses', idx)} className="text-(--c-muted) hover:text-rose-500 mt-1 shrink-0 p-2 border border-transparent rounded-lg hover:bg-(--c-panel)">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>Emirate</span>
        <div className="mt-1">
          <IconSelect
            value={form.emirate}
            onChange={(val) => updateField('emirate', val)}
            options={emiratesOptions}
            placeholder="Select Emirate"
          />
        </div>
      </div>

      <label className={labelClass}>
        P.O. Box Number
        <input
          className={inputClass}
          value={form.poBoxNumber}
          onChange={(event) => handlePoBoxChange(event.target.value)}
          inputMode="numeric"
          maxLength={8}
          placeholder="Digits only"
        />
        {errors.poBoxNumber ? <p className="mt-1 text-xs text-rose-600">{errors.poBoxNumber}</p> : null}
      </label>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>P.O. Box Emirate</span>
        <div className="mt-1">
          <IconSelect
            value={form.poBoxEmirate}
            onChange={(val) => updateField('poBoxEmirate', val)}
            options={emiratesOptions}
            placeholder="Select Emirate"
            disabled={poBoxDisabled}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Email Addresses</span>
          <button type="button" onClick={() => addArrayField('emails')} className="text-xs font-semibold text-(--c-accent) hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add Email</button>
        </div>
        {form.emails.map((val, idx) => (
          <div key={`email-${idx}`} className="flex items-center rounded-xl border border-(--c-border) bg-(--c-panel) px-3">
            <input
              className="w-full bg-transparent py-2.5 text-sm text-(--c-text) outline-none"
              value={val}
              onChange={(event) => updateArrayField('emails', idx, event.target.value.toLowerCase())}
              placeholder="email@domain.com"
            />
            {idx > 0 && (
              <button type="button" onClick={() => removeArrayField('emails', idx)} className="text-(--c-muted) hover:text-rose-500 pl-2">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <label className={labelClass}>
        Web Address
        <input
          className={inputClass}
          value={form.webAddress}
          onChange={(event) => updateField('webAddress', event.target.value.toLowerCase())}
          placeholder="www.example.com"
        />
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        Google Maps Location Pin (URL)
        <div className="mt-1 flex items-center rounded-xl border border-(--c-border) bg-(--c-panel) px-3 focus-within:ring-2 focus-within:ring-(--c-accent)/20 focus-within:border-(--c-accent) transition shadow-sm">
          <input
            className="w-full bg-transparent py-2.5 text-sm text-(--c-text) outline-none"
            value={form.locationPin}
            onChange={(event) => updateField('locationPin', event.target.value)}
            placeholder="https://maps.google.com/..."
          />
          {form.locationPin && (
            <button
              type="button"
              onClick={() => {
                window.open(form.locationPin, 'MapTest', 'width=1000,height=800,menubar=no,status=no,toolbar=no,location=no,resizable=yes');
              }}
              className="ml-2 whitespace-nowrap rounded-lg bg-(--c-accent)/10 px-3 py-1.5 text-xs font-bold text-(--c-accent) transition hover:bg-(--c-accent)"
            >
              Test Pin
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px] text-(--c-muted)">
          Paste the Google Maps "Share" link or "Plus Code" here for future reference.
        </p>
      </label>
    </div>
  </section>
));

CompanyInfoSection.displayName = 'CompanyInfoSection';

export const SocialMediaSection = React.memo(({ 
  activeSocialKeys, 
  form, 
  updateField, 
  addSocialPlatform,
  removeSocialPlatform, 
  changeSocialPlatform,
  socialPlatforms
}) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between gap-2 border-b border-(--c-border) pb-2 text-(--c-accent)">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        <span className="text-sm font-bold uppercase tracking-wider text-(--c-text)">Social Media</span>
      </div>
      {activeSocialKeys.length < socialPlatforms.length ? (
        <button
          type="button"
          onClick={addSocialPlatform}
          className="flex items-center gap-1.5 rounded-lg bg-(--c-accent)/10 px-3 py-1.5 text-xs font-bold text-(--c-accent) transition hover:bg-(--c-accent)/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Link
        </button>
      ) : null}
    </div>
    
    <div className="rounded-xl border border-(--c-border) bg-(--c-panel) p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {activeSocialKeys.map((key) => {
          const platform = socialPlatforms.find(p => p.key === key);
          const availableOptions = socialPlatforms.filter(p => p.key === key || !activeSocialKeys.includes(p.key)).map(p => ({
            value: p.key,
            label: p.label,
            icon: p.icon
          }));

          return (
            <div key={key} className="flex flex-col gap-3 rounded-xl border border-(--c-border) bg-(--c-surface) p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <IconSelect
                    value={key}
                    onChange={(newKey) => {
                      if (newKey === key) return;
                      changeSocialPlatform(key, newKey);
                    }}
                    options={availableOptions}
                    className="!border-none !bg-transparent !shadow-none !rounded-none !p-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSocialPlatform(key)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--c-panel) text-(--c-muted) border border-(--c-border) hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition shadow-sm"
                  title="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-(--c-muted) opacity-70">
                  {platform?.label} Link
                </label>
                <input
                  className="w-full rounded-xl border border-(--c-border)/60 bg-(--c-panel) px-4 py-3 text-sm text-(--c-text) outline-none focus:border-(--c-accent) focus:ring-4 focus:ring-(--c-accent)/10 transition placeholder:text-(--c-muted)/30 font-medium"
                  value={form[key]}
                  onChange={(event) => updateField(key, event.target.value.toLowerCase())}
                  placeholder={`https://...`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
));

SocialMediaSection.displayName = 'SocialMediaSection';

export const BankDetailsSection = React.memo(({ 
  form, 
  errors, 
  updateBankDetailField,
  addBankDetail,
  removeBankDetail,
  labelClass,
  inputClass
}) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between gap-2 border-b border-(--c-border) pb-2 text-(--c-accent)">
      <div className="flex items-center gap-2">
        <Banknote className="h-5 w-5" />
        <span className="text-sm font-bold uppercase tracking-wider text-(--c-text)">Bank Details</span>
      </div>
      <button
        type="button"
        onClick={addBankDetail}
        className="flex items-center gap-1.5 rounded-lg bg-(--c-accent)/10 px-3 py-1.5 text-xs font-bold text-(--c-accent) transition hover:bg-(--c-accent)/20"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Bank
      </button>
    </div>

    <div className="space-y-4">
      {(form.bankDetails || []).map((bank, index) => (
        <div key={`bank-${index}`} className="rounded-xl border border-(--c-border) bg-(--c-panel) p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-(--c-muted)">Bank {index + 1}</p>
            {(form.bankDetails || []).length > 1 ? (
              <button
                type="button"
                onClick={() => removeBankDetail(index)}
                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Bank Name
              <input
                className={inputClass}
                value={bank.bankName || ''}
                onChange={(event) => updateBankDetailField(index, 'bankName', event.target.value)}
                placeholder="E.g., Emirates NBD"
              />
            </label>
            <label className={labelClass}>
              Account Name
              <input
                className={inputClass}
                value={bank.bankAccountName || ''}
                onChange={(event) => updateBankDetailField(index, 'bankAccountName', event.target.value)}
                placeholder="E.g., ACIS AG AJMAN"
              />
            </label>
            <label className={labelClass}>
              Account Number
              <input
                className={inputClass}
                value={bank.bankAccountNumber || ''}
                onChange={(event) => updateBankDetailField(index, 'bankAccountNumber', event.target.value)}
                placeholder="Digits only"
              />
            </label>
            <label className={labelClass}>
              IBAN
              <input
                className={inputClass}
                value={bank.bankIban || ''}
                onChange={(event) => updateBankDetailField(index, 'bankIban', event.target.value.toUpperCase())}
                placeholder="AE..."
              />
              {errors[`bankIban_${index}`] ? <p className="mt-1 text-xs text-rose-600">{errors[`bankIban_${index}`]}</p> : null}
            </label>
            <label className={labelClass}>
              SWIFT Code
              <input
                className={inputClass}
                value={bank.bankSwift || ''}
                onChange={(event) => updateBankDetailField(index, 'bankSwift', event.target.value.toUpperCase())}
                placeholder="BIC/SWIFT"
              />
              {errors[`bankSwift_${index}`] ? <p className="mt-1 text-xs text-rose-600">{errors[`bankSwift_${index}`]}</p> : null}
            </label>
            <label className={labelClass}>
              Branch Name
              <input
                className={inputClass}
                value={bank.bankBranch || ''}
                onChange={(event) => updateBankDetailField(index, 'bankBranch', event.target.value)}
                placeholder="E.g., Ajman Main Branch"
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  </section>
));

BankDetailsSection.displayName = 'BankDetailsSection';

export const LogoLibrarySection = React.memo(({ 
  visibleLogoSlots, 
  logoErrors, 
  logoUploading, 
  openLogoEditor, 
  removeLogoSlot, 
  updateLogoSlot,
  setVisibleSlotsCount,
  maxLogoSlots
}) => {
  const lastVisibleSlot = visibleLogoSlots[visibleLogoSlots.length - 1];
  const canAddNextSlot = Boolean(lastVisibleSlot?.url);

  return (
    <section className="space-y-4">
    <div className="flex items-center gap-2 border-b border-(--c-border) pb-2 text-(--c-accent)">
      <Library className="h-5 w-5" />
      <span className="text-sm font-bold uppercase tracking-wider text-(--c-text)">Logo Library</span>
    </div>

    <div className="rounded-xl border border-(--c-border) bg-(--c-panel) p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-(--c-muted) underline decoration-dotted">Maintain a centralized library of branded logos (Standard size: 512x512px).</p>
        </div>
        {visibleLogoSlots.length < maxLogoSlots && (
          <button
            type="button"
            onClick={() => {
              if (!canAddNextSlot) return;
              setVisibleSlotsCount(prev => Math.min(maxLogoSlots, prev + 1));
            }}
            disabled={!canAddNextSlot}
            title={!canAddNextSlot ? 'Upload the current slot before adding the next one.' : 'Add next slot'}
            className="flex items-center gap-1.5 rounded-lg bg-(--c-accent)/10 px-3 py-1.5 text-xs font-bold text-(--c-accent) transition hover:bg-(--c-accent)/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Slot
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleLogoSlots.map((slot, index) => {
          const previousSlot = index > 0 ? visibleLogoSlots[index - 1] : null;
          const canUploadThisSlot = index === 0 || Boolean(previousSlot?.url);

          return (
          <div key={slot.slotId} className="group relative overflow-hidden rounded-xl border border-(--c-border) bg-(--c-surface) p-3 shadow-sm transition hover:shadow-md">
            <div className="mb-3 flex aspect-square items-center justify-center rounded-lg border border-(--c-border)/50 bg-(--c-panel) font-bold text-(--c-muted) shadow-inner">
              {logoUploading[slot.slotId] ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--c-accent) border-t-transparent" />
                  <span className="text-[10px] font-bold tracking-tighter text-(--c-accent) uppercase">Uploading...</span>
                </div>
              ) : slot.url ? (
                <img src={slot.url} alt={slot.name} className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <Image className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">No Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest text-(--c-text) outline-none placeholder:text-(--c-muted)/30"
                value={slot.name}
                onChange={(e) => updateLogoSlot(slot.slotId, { name: e.target.value })}
                placeholder="LOGO NAME"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!canUploadThisSlot) return;
                    openLogoEditor(slot.slotId);
                  }}
                  disabled={!canUploadThisSlot}
                  title={!canUploadThisSlot ? 'Complete the previous slot first.' : (slot.url ? 'Change logo' : 'Upload logo')}
                  className="flex-1 rounded-lg border border-(--c-border) bg-(--c-panel) py-1.5 text-[10px] font-bold uppercase tracking-tighter text-(--c-text) transition hover:bg-(--c-accent) hover:text-white hover:border-(--c-accent) shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-(--c-panel) disabled:hover:text-(--c-text) disabled:hover:border-(--c-border)"
                >
                  {slot.url ? 'Change' : 'Upload'}
                </button>
                {slot.url && (
                  <button
                    type="button"
                    onClick={() => removeLogoSlot(slot.slotId)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 transition hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {!canUploadThisSlot ? (
                <p className="text-[10px] font-semibold text-amber-500">Upload previous slot first.</p>
              ) : null}
            </div>
            {logoErrors[slot.slotId] && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase">{logoErrors[slot.slotId]}</p>}
          </div>
        );
        })}
      </div>
    </div>
  </section>
  );
});

LogoLibrarySection.displayName = 'LogoLibrarySection';

export const LogoUsageSection = React.memo(({ 
  logoUsage, 
  logoFunctions, 
  assignedOptions, 
  setLogoUsage
}) => (
  <section className="space-y-4">
    <div className="flex items-center gap-2 border-b border-(--c-border) pb-2 text-(--c-accent)">
      <Layout className="h-5 w-5" />
      <span className="text-sm font-bold uppercase tracking-wider text-(--c-text)">Integration Mapping</span>
    </div>

    <div className="rounded-xl border border-(--c-border) bg-(--c-panel) p-4">
      <div className="mb-4">
        <p className="text-xs text-(--c-muted)">Assign your library logos to specific application features.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {logoFunctions.map((func) => (
          <div key={func.key} className="flex flex-col gap-2 rounded-xl border border-(--c-border) bg-(--c-surface) p-3 shadow-sm transition hover:shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--c-muted)">{func.label}</span>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-(--c-border) bg-(--c-panel) px-3 py-2 text-xs font-bold text-(--c-text) outline-none focus:ring-2 focus:ring-(--c-accent)/20 transition cursor-pointer pr-8"
                value={logoUsage[func.key] || 'logo_1'}
                onChange={(e) => setLogoUsage(prev => ({ ...prev, [func.key]: e.target.value }))}
              >
                {assignedOptions.map(opt => (
                  <option key={opt.slotId} value={opt.slotId}>{opt.name || `Logo Slot ${opt.slotId.split('_')[1]}`}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--c-muted) pointer-events-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
));

LogoUsageSection.displayName = 'LogoUsageSection';

export const LogoEditorSection = React.memo(({
  activeLogoEditorSlotId,
  logoLibrary,
  logoSourceUrl,
  logoZoom,
  setLogoZoom,
  logoRotation,
  setRotationWrapper,
  onCropComplete,
  onLogoEditorFileChange,
  onLogoEditorReset,
  applyLogoEditor,
  closeLogoEditor,
  logoUploading,
  logoErrors
}) => {
  if (!activeLogoEditorSlotId) return null;
  const targetSlot = logoLibrary.find(s => s.slotId === activeLogoEditorSlotId);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex h-[min(92vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c10] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-(--c-accent) shadow-[0_0_20px_rgba(var(--c-accent-rgb),0.3)]">
              <Image className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Logo Studio</h3>
              <p className="text-xs font-medium text-white/50 uppercase tracking-widest">{targetSlot?.name || 'New Logo'}</p>
            </div>
          </div>
          <button onClick={closeLogoEditor} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all">
            <Trash2 className="h-5 w-5 rotate-45" /> {/* Close icon via rotate Trash */}
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4 sm:p-5">
          <div className="h-full overflow-hidden rounded-2xl border border-white/5 bg-[#050505]">
            {logoSourceUrl ? (
              <ImageStudio
                sourceUrl={logoSourceUrl}
                zoom={logoZoom}
                rotation={logoRotation}
                setZoom={setLogoZoom}
                setRotation={setRotationWrapper}
                onCropComplete={onCropComplete}
                onFileChange={onLogoEditorFileChange}
                onReset={onLogoEditorReset}
                title={`Editing ${targetSlot?.name || 'Logo'}`}
                cropShape="rect"
                aspect={1}
                showFilters={false}
                workspaceHeightClass="h-[170px] sm:h-[230px] lg:h-[280px]"
              />
            ) : (
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 transition hover:bg-white/[0.02]">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-white/5 text-white/20">
                  <Plus className="h-8 w-8" />
                </div>
                <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Load Source Image</span>
                <input type="file" hidden accept="image/*" onChange={onLogoEditorFileChange} />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 bg-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            {logoErrors[activeLogoEditorSlotId] && (
              <p className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> {logoErrors[activeLogoEditorSlotId]}
              </p>
            )}
            <p className="text-[10px] text-white/30 uppercase tracking-tighter">Studio renders high-precision PNG output (512x512)</p>
          </div>
          <div className="flex gap-3">
            <button onClick={closeLogoEditor} className="px-6 py-2 text-xs font-bold text-white/50 uppercase hover:text-white transition">Cancel</button>
            <button
              onClick={applyLogoEditor}
              disabled={logoUploading[activeLogoEditorSlotId]}
              className="rounded-xl bg-(--c-accent) px-8 py-2.5 text-xs font-black text-white hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
            >
              {logoUploading[activeLogoEditorSlotId] ? 'Studying...' : 'Rerender & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

LogoEditorSection.displayName = 'LogoEditorSection';
