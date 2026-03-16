import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Copy, Mail, Ban, CheckCircle2, RefreshCcw, Plus, Tags, X, GripVertical, Users, UserPlus } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { useTenant } from '../context/useTenant';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import ClientSearchField from '../components/dailyTransaction/ClientSearchField';
import ServiceSearchField from '../components/dailyTransaction/ServiceSearchField';
import CurrencyValue from '../components/common/CurrencyValue';
import DirhamIcon from '../components/common/DirhamIcon';
import ProgressVideoOverlay from '../components/common/ProgressVideoOverlay';
import CountryPhoneField from '../components/common/CountryPhoneField';
import EmirateSelect from '../components/common/EmirateSelect';
import ServiceTemplateEditor from '../components/common/ServiceTemplateEditor';
import ApplicationIconQuickAddPanel from '../components/common/ApplicationIconQuickAddPanel';
import { WhatsAppIcon } from '../components/settings/BrandingSubsections';
import {
  DEFAULT_COUNTRY_PHONE_ISO2,
  findCountryPhoneOption,
} from '../lib/countryPhoneData';
import {
  getMobileNumberValidationMessage,
  normalizeMobileNumberInput,
} from '../lib/mobileNumberRules';
import {
  fetchTenantQuotations,
  fetchTenantPdfTemplates,
  generateDisplayDocumentRef,
  sendTenantDocumentEmail,
  convertQuotationToProforma,
  upsertTenantQuotation,
} from '../lib/backendStore';
import { fetchApplicationIconLibrary } from '../lib/applicationIconLibraryStore';
import { generateTenantPdf } from '../lib/pdfGenerator';
import { createSyncEvent } from '../lib/syncEvents';
import { sendUniversalNotification } from '../lib/notificationDrafting';
import { toSafeDocId } from '../lib/idUtils';
import { fetchServiceTemplates, upsertServiceTemplate } from '../lib/serviceTemplateStore';
import {
  buildServiceTemplatePayload,
  createEmptyServiceTemplateDraft,
  findServiceTemplateNameConflict,
  normalizeLibraryDescription,
  validateServiceTemplateDraft,
} from '../lib/serviceTemplateRules';
import {
  DEFAULT_QUOTATION_TERMS,
  resolvePdfTemplateForRenderer,
} from '../lib/pdfTemplateRenderer';

const inputClass = 'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm font-bold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/5';
const selectClass = 'mt-1 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm font-bold text-[var(--c-text)] outline-none transition focus:border-[var(--c-accent)] focus:ring-4 focus:ring-[var(--c-accent)]/5';
const activeTabClass = 'bg-[var(--c-accent)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--c-accent)_28%,transparent)]';
const activeChoiceCardClass = 'border-[var(--c-accent)] bg-[color:color-mix(in_srgb,var(--c-accent)_10%,var(--c-surface))]';
const activeChoiceIconClass = 'bg-[var(--c-accent)] text-white';
const activeSoftTagClass = 'border-[var(--c-accent)]/45 bg-[color:color-mix(in_srgb,var(--c-accent)_12%,transparent)] text-[var(--c-accent)]';
const primaryActionClass = 'bg-[var(--c-accent)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--c-accent)_24%,transparent)] hover:opacity-95';

const makeContactId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createManualMobileContact = (overrides = {}) => ({
  id: makeContactId('mobile'),
  value: '',
  countryIso2: DEFAULT_COUNTRY_PHONE_ISO2,
  whatsAppEnabled: true,
  ...overrides,
});
const createManualEmailContact = (overrides = {}) => ({
  id: makeContactId('email'),
  value: '',
  emailEnabled: true,
  ...overrides,
});
const syncManualClientContacts = (draft) => {
  const mobileContacts = Array.isArray(draft.mobileContacts) && draft.mobileContacts.length
    ? draft.mobileContacts
    : [createManualMobileContact()];
  const emailContacts = Array.isArray(draft.emailContacts) && draft.emailContacts.length
    ? draft.emailContacts
    : [createManualEmailContact()];
  const primaryMobileContact = mobileContacts.find((contact) => String(contact.value || '').trim()) || mobileContacts[0];
  const primaryEmailContact = emailContacts.find((contact) => String(contact.value || '').trim()) || emailContacts[0];
  return {
    ...draft,
    mobileContacts,
    emailContacts,
    primaryMobile: primaryMobileContact?.value || '',
    primaryMobileCountry: primaryMobileContact?.countryIso2 || DEFAULT_COUNTRY_PHONE_ISO2,
    primaryEmail: primaryEmailContact?.value || '',
  };
};
const createEmptyManualClient = () => syncManualClientContacts({
  clientType: 'company',
  legalName: '',
  tradeName: '',
  brandName: '',
  primaryMobile: '',
  primaryMobileCountry: DEFAULT_COUNTRY_PHONE_ISO2,
  primaryEmail: '',
  emirate: '',
  mobileContacts: [createManualMobileContact()],
  emailContacts: [createManualEmailContact()],
});

const makeItem = (service) => ({
  rowId: `${service?.id || 'row'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  applicationId: service?.id || '',
  name: service?.name || '',
  description: service?.description || '',
  qty: 1,
  amount: Number(service?.clientCharge || 0),
  govCharge: Number(service?.govCharge || 0),
});

const createEmptyItemBuilder = () => ({
  service: null,
  qty: 1,
  amount: '',
});
const createQuotationTerm = (overrides = {}) => ({
  id: makeContactId('term'),
  type: 'custom',
  text: '',
  templateText: '',
  ...overrides,
});
const stripLeadingTermNumber = (value) => String(value || '').replace(/^\s*\d+\.\s*/, '').trim();
const parseQuotationTerms = (rawTerms) => {
  const sourceLines = String(rawTerms || '')
    .split(/\r?\n/)
    .map((line) => stripLeadingTermNumber(line))
    .filter(Boolean)
    .slice(0, 5);
  return sourceLines.map((line) => (
    line.includes('{{expiryDate}}')
      ? createQuotationTerm({ type: 'expiry', templateText: line })
      : createQuotationTerm({ type: 'custom', text: line })
  ));
};
const cloneQuotationTerms = (terms) => terms.map((term) => createQuotationTerm({
  type: term.type,
  text: term.text || '',
  templateText: term.templateText || '',
}));
const resolveQuotationTermText = (term, expiryDate) => {
  const source = term.type === 'expiry' ? term.templateText : term.text;
  return String(source || '')
    .replaceAll('{{expiryDate}}', String(expiryDate || '').trim() || 'the selected expiry date')
    .trim();
};
const serializeQuotationTerms = (terms, expiryDate) => terms
  .map((term, index) => {
    const text = resolveQuotationTermText(term, expiryDate);
    return text ? `${index + 1}. ${text}` : '';
  })
  .filter(Boolean)
  .join('\n');
const serializeQuotationTermTemplates = (terms) => terms
  .map((term) => ({
    type: term.type,
    text: term.type === 'expiry' ? term.templateText : term.text,
  }))
  .map((term) => ({
    ...term,
    text: String(term.text || '').trim(),
  }))
  .filter((term) => term.text);
const resolveStoredQuotationTerms = (storedTerms, expiryDate) => serializeQuotationTerms(
  Array.isArray(storedTerms)
    ? storedTerms.map((term) => createQuotationTerm({
      type: term?.type === 'expiry' ? 'expiry' : 'custom',
      text: term?.type === 'expiry' ? '' : String(term?.text || ''),
      templateText: term?.type === 'expiry' ? String(term?.text || '') : '',
    }))
    : [],
  expiryDate,
);

const addWeeks = (dateValue, weeks) => {
  const base = new Date(dateValue);
  if (Number.isNaN(base.getTime())) return new Date().toISOString().slice(0, 10);
  base.setDate(base.getDate() + (Number(weeks) || 0) * 7);
  return base.toISOString().slice(0, 10);
};

const formatAmountInputValue = (value) => {
  if (value === '' || value === null || value === undefined) return '0.00';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0.00';
  return numeric.toFixed(2);
};

const toProperText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const QuotationPage = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('create');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityWeeks, setValidityWeeks] = useState(2);
  const [reference, setReference] = useState('');
  const [quotationDescription, setQuotationDescription] = useState('');
  const [clientMode, setClientMode] = useState('manual');
  const [existingClient, setExistingClient] = useState(null);
  const [selectedDependents, setSelectedDependents] = useState([]);
  const [manualClient, setManualClient] = useState(createEmptyManualClient);
  const [itemBuilder, setItemBuilder] = useState(createEmptyItemBuilder());
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [serviceRefreshKey, setServiceRefreshKey] = useState(0);
  const [manualMobileErrors, setManualMobileErrors] = useState({});
  const [manualEmailErrors, setManualEmailErrors] = useState({});
  const [applicationIcons, setApplicationIcons] = useState([]);
  const [isInlineTemplateOpen, setIsInlineTemplateOpen] = useState(false);
  const [isInlineTemplateIconQuickAddOpen, setIsInlineTemplateIconQuickAddOpen] = useState(false);
  const [inlineTemplateDraft, setInlineTemplateDraft] = useState(createEmptyServiceTemplateDraft());
  const [inlineTemplateError, setInlineTemplateError] = useState('');
  const [isInlineTemplateSaving, setIsInlineTemplateSaving] = useState(false);
  const [defaultQuotationTerms, setDefaultQuotationTerms] = useState(() => parseQuotationTerms(DEFAULT_QUOTATION_TERMS));
  const [quotationTerms, setQuotationTerms] = useState(() => cloneQuotationTerms(parseQuotationTerms(DEFAULT_QUOTATION_TERMS)));
  const [draggedItemRowId, setDraggedItemRowId] = useState('');
  const [dragOverItemRowId, setDragOverItemRowId] = useState('');
  const statusRef = useRef(null);
  const quotationDateFieldRef = useRef(null);
  const validityFieldRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    const [quoteRef, quotationsRes] = await Promise.all([
      generateDisplayDocumentRef(tenantId, 'quotation'),
      fetchTenantQuotations(tenantId),
    ]);

    setReference(quoteRef);
    if (quotationsRes.ok) setRows(quotationsRes.rows || []);
    setIsLoading(false);
  }, [tenantId]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      void loadData();
    });
    return () => cancelAnimationFrame(handle);
  }, [loadData]);

  useEffect(() => {
    let active = true;
    if (!tenantId) return undefined;
    fetchApplicationIconLibrary(tenantId).then((res) => {
      if (!active || !res.ok) return;
      setApplicationIcons(res.rows || []);
    });
    return () => {
      active = false;
    };
  }, [tenantId, serviceRefreshKey]);

  useEffect(() => {
    let active = true;
    if (!tenantId) return undefined;
    fetchTenantPdfTemplates(tenantId).then((res) => {
      if (!active || !res.ok) return;
      const { template } = resolvePdfTemplateForRenderer({
        documentType: 'quotation',
        templateDoc: res.byType?.quotation,
      });
      const parsed = parseQuotationTerms(template?.termsAndConditions || DEFAULT_QUOTATION_TERMS);
      if (parsed.length) {
        setDefaultQuotationTerms(parsed);
        setQuotationTerms(cloneQuotationTerms(parsed));
      }
    });
    return () => {
      active = false;
    };
  }, [tenantId]);

  const expiryDate = useMemo(() => addWeeks(quotationDate, validityWeeks), [quotationDate, validityWeeks]);
  const resolvedQuotationTerms = useMemo(
    () => serializeQuotationTerms(quotationTerms, expiryDate),
    [quotationTerms, expiryDate],
  );
  const selectedQuotation = useMemo(
    () => rows.find((item) => item.id === selectedQuotationId) || rows[0] || null,
    [rows, selectedQuotationId],
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.amount) || 0)), 0),
    [items],
  );
  const pushStatus = (message, type = 'info') => {
    setStatus(message);
    setStatusType(type);
    window.requestAnimationFrame(() => {
      statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };
  const focusQuotationDateControls = useCallback(() => {
    const target = validityFieldRef.current || quotationDateFieldRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.focus?.();
  }, []);

  const validateManualMobile = useCallback((mobileValue, countryIso2, fieldLabel = 'Mobile number') => (
    getMobileNumberValidationMessage(mobileValue, countryIso2, { fieldLabel })
  ), []);
  const validateManualEmail = useCallback((emailValue, fieldLabel = 'Email address') => {
    const normalized = String(emailValue || '').trim().toLowerCase();
    if (!normalized) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? '' : `${fieldLabel} format is invalid.`;
  }, []);

  const updateManualClient = useCallback((updater) => {
    setManualClient((prev) => syncManualClientContacts(typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const updateMobileContact = useCallback((contactId, mutate) => {
    updateManualClient((prev) => ({
      ...prev,
      mobileContacts: prev.mobileContacts.map((contact) => (
        contact.id === contactId ? mutate(contact) : contact
      )),
    }));
  }, [updateManualClient]);

  const updateEmailContact = useCallback((contactId, mutate) => {
    updateManualClient((prev) => ({
      ...prev,
      emailContacts: prev.emailContacts.map((contact) => (
        contact.id === contactId ? mutate(contact) : contact
      )),
    }));
  }, [updateManualClient]);

  const handleManualMobileChange = useCallback((contactId, value) => {
    const target = manualClient.mobileContacts.find((contact) => contact.id === contactId);
    if (!target) return;
    const normalized = normalizeMobileNumberInput(value, target.countryIso2);
    updateMobileContact(contactId, (contact) => ({ ...contact, value: normalized }));
    setManualMobileErrors((prev) => (
      prev[contactId]
        ? { ...prev, [contactId]: validateManualMobile(normalized, target.countryIso2) }
        : prev
    ));
  }, [manualClient.mobileContacts, updateMobileContact, validateManualMobile]);

  const handleManualMobileCountryChange = useCallback((contactId, countryIso2) => {
    const target = manualClient.mobileContacts.find((contact) => contact.id === contactId);
    if (!target) return;
    const normalized = normalizeMobileNumberInput(target.value, countryIso2);
    updateMobileContact(contactId, (contact) => ({
      ...contact,
      countryIso2,
      value: normalized,
    }));
    setManualMobileErrors((prev) => (
      prev[contactId]
        ? { ...prev, [contactId]: validateManualMobile(normalized, countryIso2) }
        : prev
    ));
  }, [manualClient.mobileContacts, updateMobileContact, validateManualMobile]);

  const handleManualMobilePaste = useCallback((contactId, event) => {
    const pastedText = event.clipboardData?.getData('text') || '';
    const target = manualClient.mobileContacts.find((contact) => contact.id === contactId);
    if (!pastedText || !target) return;
    event.preventDefault();
    const normalized = normalizeMobileNumberInput(pastedText, target.countryIso2);
    updateMobileContact(contactId, (contact) => ({ ...contact, value: normalized }));
    setManualMobileErrors((prev) => (
      prev[contactId]
        ? { ...prev, [contactId]: validateManualMobile(normalized, target.countryIso2) }
        : prev
    ));
  }, [manualClient.mobileContacts, updateMobileContact, validateManualMobile]);

  const handleManualMobileBlur = useCallback((contactId) => {
    const target = manualClient.mobileContacts.find((contact) => contact.id === contactId);
    if (!target) return;
    setManualMobileErrors((prev) => ({
      ...prev,
      [contactId]: validateManualMobile(target.value, target.countryIso2),
    }));
  }, [manualClient.mobileContacts, validateManualMobile]);

  const appendManualMobileContact = useCallback(() => {
    updateManualClient((prev) => {
      if (prev.mobileContacts.length >= 3) return prev;
      return {
        ...prev,
        mobileContacts: [...prev.mobileContacts, createManualMobileContact()],
      };
    });
  }, [updateManualClient]);

  const removeManualMobileContact = useCallback((contactId) => {
    updateManualClient((prev) => {
      if (prev.mobileContacts.length <= 1) {
        return {
          ...prev,
          mobileContacts: [createManualMobileContact()],
        };
      }
      return {
        ...prev,
        mobileContacts: prev.mobileContacts.filter((contact) => contact.id !== contactId),
      };
    });
    setManualMobileErrors((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
  }, [updateManualClient]);

  const toggleMobileWhatsApp = useCallback((contactId) => {
    updateManualClient((prev) => {
      const target = prev.mobileContacts.find((contact) => contact.id === contactId);
      if (!target) return prev;
      const nextEnabled = !target.whatsAppEnabled;
      let nextContacts = prev.mobileContacts.map((contact) => (
        contact.id === contactId ? { ...contact, whatsAppEnabled: nextEnabled } : contact
      ));
      if (!nextEnabled && nextContacts.length < 3) {
        nextContacts = [...nextContacts, createManualMobileContact()];
      }
      return {
        ...prev,
        mobileContacts: nextContacts,
      };
    });
  }, [updateManualClient]);

  const handleManualEmailChange = useCallback((contactId, value) => {
    const normalized = String(value || '').toLowerCase().replace(/\s+/g, '');
    updateEmailContact(contactId, (contact) => ({ ...contact, value: normalized }));
    setManualEmailErrors((prev) => (
      prev[contactId]
        ? { ...prev, [contactId]: validateManualEmail(normalized) }
        : prev
    ));
  }, [updateEmailContact, validateManualEmail]);

  const handleManualEmailBlur = useCallback((contactId) => {
    const target = manualClient.emailContacts.find((contact) => contact.id === contactId);
    if (!target) return;
    setManualEmailErrors((prev) => ({
      ...prev,
      [contactId]: validateManualEmail(target.value),
    }));
  }, [manualClient.emailContacts, validateManualEmail]);

  const appendManualEmailContact = useCallback(() => {
    updateManualClient((prev) => {
      if (prev.emailContacts.length >= 3) return prev;
      return {
        ...prev,
        emailContacts: [...prev.emailContacts, createManualEmailContact()],
      };
    });
  }, [updateManualClient]);

  const removeManualEmailContact = useCallback((contactId) => {
    updateManualClient((prev) => {
      if (prev.emailContacts.length <= 1) {
        return {
          ...prev,
          emailContacts: [createManualEmailContact()],
        };
      }
      return {
        ...prev,
        emailContacts: prev.emailContacts.filter((contact) => contact.id !== contactId),
      };
    });
    setManualEmailErrors((prev) => {
      const next = { ...prev };
      delete next[contactId];
      return next;
    });
  }, [updateManualClient]);

  const toggleEmailConversation = useCallback((contactId) => {
    updateManualClient((prev) => {
      const target = prev.emailContacts.find((contact) => contact.id === contactId);
      if (!target) return prev;
      const nextEnabled = !target.emailEnabled;
      let nextContacts = prev.emailContacts.map((contact) => (
        contact.id === contactId ? { ...contact, emailEnabled: nextEnabled } : contact
      ));
      if (!nextEnabled && nextContacts.length < 3) {
        nextContacts = [...nextContacts, createManualEmailContact()];
      }
      return {
        ...prev,
        emailContacts: nextContacts,
      };
    });
  }, [updateManualClient]);

  const handleQuotationTermChange = useCallback((termId, nextText) => {
    setQuotationTerms((prev) => prev.map((term) => {
      if (term.id !== termId || term.type === 'expiry') return term;
      return {
        ...term,
        text: nextText,
      };
    }));
  }, []);

  const appendQuotationTerm = useCallback(() => {
    setQuotationTerms((prev) => (
      prev.length >= 5
        ? prev
        : [...prev, createQuotationTerm({ text: '' })]
    ));
  }, []);

  const removeQuotationTerm = useCallback((termId) => {
    setQuotationTerms((prev) => prev.filter((term) => term.id !== termId));
  }, []);

  const resetComposer = useCallback(async () => {
    setQuotationDate(new Date().toISOString().slice(0, 10));
    setValidityWeeks(2);
    setQuotationDescription('');
    setClientMode('manual');
    setExistingClient(null);
    setSelectedDependents([]);
    setManualClient(createEmptyManualClient());
    setItems([]);
    setItemBuilder(createEmptyItemBuilder());
    setStatus('');
    setManualMobileErrors({});
    setManualEmailErrors({});
    setQuotationTerms(cloneQuotationTerms(defaultQuotationTerms));
    setIsInlineTemplateOpen(false);
    setInlineTemplateDraft(createEmptyServiceTemplateDraft());
    setInlineTemplateError('');
    const nextRef = await generateDisplayDocumentRef(tenantId, 'quotation');
    setReference(nextRef);
  }, [defaultQuotationTerms, tenantId]);

  const handleAddItem = (service, overrides = {}) => {
    const alreadyExists = items.find((item) => item.applicationId === service?.id);
    if (alreadyExists) {
      pushStatus(`"${service?.name || 'Application'}" already exists. Increase quantity instead.`, 'error');
      return;
    }
    setItems((prev) => [...prev, {
      ...makeItem(service),
      qty: Math.max(1, Number(overrides.qty ?? 1) || 1),
      amount: Math.max(0, Number(overrides.amount ?? service?.clientCharge ?? 0) || 0),
    }]);
  };

  const handleSelectApplication = (service) => {
    setItemBuilder({
      service,
      qty: 1,
      amount: formatAmountInputValue(service?.clientCharge || 0),
    });
  };

  const handleAddBuiltItem = () => {
    if (!itemBuilder.service) {
      pushStatus('Select an application first.', 'error');
      return;
    }
    handleAddItem(itemBuilder.service, {
      qty: itemBuilder.qty,
      amount: itemBuilder.amount,
    });
    setItemBuilder(createEmptyItemBuilder());
  };

  const handleInlineTemplateSave = async () => {
    const validationError = validateServiceTemplateDraft(inlineTemplateDraft);
    if (validationError) {
      setInlineTemplateError(validationError);
      return;
    }
    if (!tenantId || !user?.uid) {
      setInlineTemplateError('Missing tenant or user context.');
      return;
    }

    const trimmedName = String(inlineTemplateDraft.name || '').trim();
    const templateId = toSafeDocId(trimmedName, 'svc_tpl');

    setIsInlineTemplateSaving(true);
    setInlineTemplateError('');

    const existingTemplatesRes = await fetchServiceTemplates(tenantId);
    if (!existingTemplatesRes.ok) {
      setInlineTemplateError(existingTemplatesRes.error || 'Failed to validate application uniqueness.');
      setIsInlineTemplateSaving(false);
      return;
    }

    const duplicateRow = findServiceTemplateNameConflict(existingTemplatesRes.rows || [], trimmedName);
    if (duplicateRow) {
      setInlineTemplateError('Another application already uses this name variant (case/space). Choose a unique name.');
      setIsInlineTemplateSaving(false);
      return;
    }

    const payload = buildServiceTemplatePayload(inlineTemplateDraft, {
      createdBy: user.uid,
      editing: false,
    });

    const res = await upsertServiceTemplate(tenantId, templateId, payload);
    if (!res.ok) {
      setInlineTemplateError(res.error || 'Failed to create application.');
      setIsInlineTemplateSaving(false);
      return;
    }

    await createSyncEvent({
      tenantId,
      eventType: 'create',
      entityType: 'serviceTemplate',
      entityId: templateId,
      changedFields: Object.keys(payload),
      createdBy: user.uid,
    });

    const createdTemplate = { id: templateId, ...payload };
    setServiceRefreshKey((prev) => prev + 1);
    setIsInlineTemplateOpen(false);
    setIsInlineTemplateIconQuickAddOpen(false);
    setInlineTemplateDraft(createEmptyServiceTemplateDraft());
    setInlineTemplateError('');
    setItemBuilder({
      service: createdTemplate,
      qty: 1,
      amount: formatAmountInputValue(createdTemplate.clientCharge || 0),
    });
    pushStatus(`Application "${createdTemplate.name}" created.`, 'success');
    setIsInlineTemplateSaving(false);
  };

  const handleItemChange = (rowId, field, value) => {
    setItems((prev) => prev.map((item) => {
      if (item.rowId !== rowId) return item;
      if (field === 'qty') return { ...item, qty: Math.max(1, Number(value) || 1) };
      if (field === 'amount') return { ...item, amount: Math.max(0, Number(value) || 0) };
      return { ...item, [field]: value };
    }));
  };

  const removeItem = (rowId) => {
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const moveItemRow = useCallback((sourceRowId, targetRowId) => {
    if (!sourceRowId || !targetRowId || sourceRowId === targetRowId) return;
    setItems((prev) => {
      const sourceIndex = prev.findIndex((item) => item.rowId === sourceRowId);
      const targetIndex = prev.findIndex((item) => item.rowId === targetRowId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prev;
      const next = [...prev];
      const [movedItem] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedItem);
      return next;
    });
  }, []);

  const addDependentChip = (item) => {
    if (!item?.id || selectedDependents.some((dep) => dep.id === item.id)) return;
    setSelectedDependents((prev) => [...prev, item]);
  };

  const removeDependentChip = (id) => {
    setSelectedDependents((prev) => prev.filter((item) => item.id !== id));
  };

  const buildQuotationPayload = (overrides = {}) => {
    const filledMobileContacts = manualClient.mobileContacts.filter((contact) => String(contact.value || '').trim());
    const filledEmailContacts = manualClient.emailContacts.filter((contact) => String(contact.value || '').trim());
    const primaryMobileContact = filledMobileContacts[0] || manualClient.mobileContacts[0] || createManualMobileContact();
    const primaryEmailContact = filledEmailContacts[0] || manualClient.emailContacts[0] || createManualEmailContact();
    const clientSnapshot = clientMode === 'existing'
      ? {
          id: existingClient?.id || '',
          name: existingClient?.fullName || existingClient?.tradeName || '',
          tradeName: existingClient?.tradeName || '',
          email: existingClient?.primaryEmail || '',
          type: existingClient?.type || '',
        }
      : {
          id: '',
          name: manualClient.legalName,
          tradeName: manualClient.tradeName,
          brandName: manualClient.brandName,
          email: primaryEmailContact.value || '',
          mobile: primaryMobileContact.value || '',
          mobileCountryIso2: primaryMobileContact.countryIso2 || DEFAULT_COUNTRY_PHONE_ISO2,
          mobileDialCode: findCountryPhoneOption(primaryMobileContact.countryIso2 || DEFAULT_COUNTRY_PHONE_ISO2)?.dialCode || '',
          mobileContacts: filledMobileContacts.map((contact) => ({
            value: contact.value,
            countryIso2: contact.countryIso2,
            dialCode: findCountryPhoneOption(contact.countryIso2)?.dialCode || '',
            whatsAppEnabled: Boolean(contact.whatsAppEnabled),
          })),
          emailContacts: filledEmailContacts.map((contact) => ({
            value: contact.value,
            emailEnabled: Boolean(contact.emailEnabled),
          })),
          emirate: manualClient.emirate,
          type: manualClient.clientType,
        };

    return {
      displayRef: reference,
      quoteDate: quotationDate,
      description: normalizeLibraryDescription(quotationDescription),
      validityWeeks: Number(validityWeeks),
      expiryDate,
      termsAndConditions: resolvedQuotationTerms,
      termsTemplateLines: serializeQuotationTermTemplates(quotationTerms),
      clientMode,
      clientId: clientMode === 'existing' ? (existingClient?.id || null) : null,
      dependentIds: selectedDependents.map((item) => item.id),
      dependentNames: selectedDependents.map((item) => item.fullName || item.tradeName || item.displayClientId),
      clientSnapshot,
      items: items.map((item) => ({
        applicationId: item.applicationId,
        name: item.name,
        description: item.description,
        qty: Number(item.qty) || 1,
        amount: Number(item.amount) || 0,
        govCharge: Number(item.govCharge) || 0,
        lineTotal: (Number(item.qty) || 0) * (Number(item.amount) || 0),
      })),
      totalAmount,
      status: 'generated',
      sourceQuotationId: null,
      cancellationReason: null,
      acceptedAt: null,
      createdBy: user?.uid || '',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  };

  const validateComposer = useCallback(() => {
    if (!reference) return 'Quotation reference is missing.';
    if (!quotationDate) return 'Quotation date is required.';
    if (Number(validityWeeks) < 1 || Number(validityWeeks) > 8) return 'Validity must be between 1 and 8 weeks.';
    if (items.length === 0) return 'Add at least one application.';
    if (clientMode === 'existing' && !existingClient?.id) return 'Select an existing client.';
    if (clientMode === 'manual') {
      if (!manualClient.legalName.trim()) return manualClient.clientType === 'individual' ? 'Name is required.' : 'Company legal name is required.';
      if (manualClient.clientType === 'company' && !manualClient.tradeName.trim()) return 'Trade Name is required.';
      const mobileErrors = {};
      const filledMobileContacts = manualClient.mobileContacts.filter((contact) => String(contact.value || '').trim());
      if (filledMobileContacts.length === 0) {
        const firstMobileId = manualClient.mobileContacts[0]?.id;
        if (firstMobileId) mobileErrors[firstMobileId] = 'Mobile number is required.';
        setManualMobileErrors(mobileErrors);
        return 'At least one mobile number is required.';
      }
      let mobileErrorMessage = '';
      manualClient.mobileContacts.forEach((contact, index) => {
        const normalized = String(contact.value || '').trim();
        const shouldValidate = index === 0 || normalized;
        if (!shouldValidate) return;
        const nextError = validateManualMobile(contact.value, contact.countryIso2, `Mobile number ${index + 1}`);
        if (nextError && !mobileErrorMessage) mobileErrorMessage = nextError;
        mobileErrors[contact.id] = nextError;
      });
      setManualMobileErrors(mobileErrors);
      if (mobileErrorMessage) return mobileErrorMessage;

      const emailErrors = {};
      let emailErrorMessage = '';
      manualClient.emailContacts.forEach((contact, index) => {
        const nextError = validateManualEmail(contact.value, `Email ${index + 1}`);
        if (nextError && !emailErrorMessage) emailErrorMessage = nextError;
        emailErrors[contact.id] = nextError;
      });
      setManualEmailErrors(emailErrors);
      if (emailErrorMessage) return emailErrorMessage;
    }
    return '';
  }, [clientMode, existingClient?.id, items.length, manualClient.clientType, manualClient.emailContacts, manualClient.legalName, manualClient.mobileContacts, manualClient.tradeName, quotationDate, reference, validityWeeks, validateManualEmail, validateManualMobile]);

  const buildPdfData = (quotation) => ({
    txId: quotation.displayRef,
    date: quotation.quoteDate,
    expiryDate: quotation.expiryDate,
    termsAndConditions: quotation.termsAndConditions || resolveStoredQuotationTerms(quotation.termsTemplateLines, quotation.expiryDate),
    recipientName: quotation.clientSnapshot?.name || quotation.clientSnapshot?.tradeName || 'Client',
    amount: quotation.totalAmount,
    description: quotation.description || 'Quotation',
    items: (quotation.items || []).map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.amount,
      total: item.lineTotal,
    })),
  });

  const saveQuotation = async () => {
    const validationError = validateComposer();
    if (validationError) {
      pushStatus(validationError, 'error');
      return;
    }

    const shouldGenerate = window.confirm(
      `Generate quotation ${reference} now?\n\nPlease confirm before continuing.`,
    );
    if (!shouldGenerate) return;

    setIsSaving(true);
    const quotationId = toSafeDocId(reference, 'quotation');
    const payload = buildQuotationPayload();
    const res = await upsertTenantQuotation(tenantId, quotationId, payload);

    if (res.ok) {
      await createSyncEvent({
        tenantId,
        eventType: 'create',
        entityType: 'quotation',
        entityId: quotationId,
        changedFields: Object.keys(payload),
        createdBy: user?.uid,
      });
      await sendUniversalNotification({
        tenantId,
        topic: 'documents',
        subTopic: 'quotation',
        type: 'create',
        title: 'Quotation Generated',
        message: `${reference} was generated successfully.`,
        createdBy: user?.uid,
        routePath: `/t/${tenantId}/quotations`,
        actionPresets: ['view'],
        entityType: 'quotation',
        entityId: quotationId,
        entityLabel: reference,
      });
      pushStatus(`Quotation ${reference} generated.`, 'success');
      await loadData();
      setSelectedQuotationId(quotationId);
      setActiveView('existing');
      await resetComposer();
    } else {
      pushStatus(res.error || 'Failed to save quotation.', 'error');
    }
    setIsSaving(false);
  };

  const updateExistingQuotation = async (quotationId, nextPayload) => {
    const res = await upsertTenantQuotation(tenantId, quotationId, nextPayload);
    if (res.ok) {
      await loadData();
      setSelectedQuotationId(quotationId);
    }
    return res;
  };

  const handleClone = async (quotation) => {
    const nextRef = await generateDisplayDocumentRef(tenantId, 'quotation');
    const nextId = toSafeDocId(nextRef, 'quotation');
    const payload = {
      ...quotation,
      displayRef: nextRef,
      sourceQuotationId: quotation.id,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      status: 'generated',
      cancellationReason: null,
      acceptedAt: null,
      createdBy: user?.uid || quotation.createdBy || '',
    };
    const res = await upsertTenantQuotation(tenantId, nextId, payload);
    pushStatus(res.ok ? `Quotation cloned as ${nextRef}.` : (res.error || 'Failed to clone quotation.'), res.ok ? 'success' : 'error');
    if (res.ok) {
      await loadData();
      setSelectedQuotationId(nextId);
      setActiveView('existing');
    }
  };

  const handleExtend = async (quotation) => {
    const nextRef = await generateDisplayDocumentRef(tenantId, 'quotation');
    const nextId = toSafeDocId(nextRef, 'quotation');
    const expireRes = await updateExistingQuotation(quotation.id, { status: 'expired' });
    if (!expireRes.ok) {
      pushStatus(expireRes.error || 'Failed to expire the current quotation.', 'error');
      return;
    }
    const nextPayload = {
      ...quotation,
      displayRef: nextRef,
      sourceQuotationId: quotation.id,
      quoteDate: new Date().toISOString().slice(0, 10),
      expiryDate: addWeeks(new Date().toISOString().slice(0, 10), quotation.validityWeeks || 2),
      termsAndConditions: resolveStoredQuotationTerms(
        quotation.termsTemplateLines,
        addWeeks(new Date().toISOString().slice(0, 10), quotation.validityWeeks || 2),
      ) || quotation.termsAndConditions || '',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      status: 'generated',
      cancellationReason: null,
      acceptedAt: null,
      createdBy: user?.uid || quotation.createdBy || '',
    };
    const createRes = await upsertTenantQuotation(tenantId, nextId, nextPayload);
    pushStatus(createRes.ok ? `Quotation extended as ${nextRef}.` : (createRes.error || 'Failed to create the extended quotation.'), createRes.ok ? 'success' : 'error');
    if (createRes.ok) {
      await loadData();
      setSelectedQuotationId(nextId);
    }
  };

  const handleCancel = async (quotation) => {
    const reason = window.prompt('Enter cancellation reason (minimum 30 characters):', '');
    const normalizedReason = toProperText(reason);
    if (!normalizedReason) return;
    if (normalizedReason.length < 30) {
      pushStatus('Cancellation reason must be at least 30 characters.', 'error');
      return;
    }
    const res = await updateExistingQuotation(quotation.id, {
      status: 'canceled',
      cancellationReason: normalizedReason,
      canceledAt: new Date().toISOString(),
      canceledBy: user?.uid || '',
    });
    pushStatus(res.ok ? `Quotation ${quotation.displayRef} canceled.` : (res.error || 'Failed to cancel quotation.'), res.ok ? 'success' : 'error');
  };

  const handleAccept = async (quotation) => {
    const shouldConvert = window.confirm(
      `Convert ${quotation.displayRef} to Proforma Invoice now?\n\nThis will mark the quotation as converted.`,
    );
    if (!shouldConvert) return;

    setIsSaving(true);
    const res = await convertQuotationToProforma(tenantId, quotation.id, {
      createdBy: user?.uid || '',
    });
    setIsSaving(false);

    if (!res.ok) {
      pushStatus(res.error || 'Failed to convert quotation to proforma.', 'error');
      return;
    }

    await sendUniversalNotification({
      tenantId,
      topic: 'documents',
      subTopic: 'proforma',
      type: 'create',
      title: 'Proforma Created',
      message: `${res.proformaDisplayRef || 'Proforma'} created from ${quotation.displayRef}.`,
      createdBy: user?.uid || '',
      routePath: `/t/${tenantId}/proforma-invoices`,
      actionPresets: ['view'],
      entityType: 'proformaInvoice',
      entityId: res.proformaId || '',
      entityLabel: res.proformaDisplayRef || '',
    });

    pushStatus(
      res.alreadyConverted
        ? `${quotation.displayRef} already converted to ${res.proformaDisplayRef || 'proforma'}.`
        : `Quotation converted to ${res.proformaDisplayRef}.`,
      'success',
    );
    await loadData();
    setActiveView('existing');
    navigate(`/t/${tenantId}/proforma-invoices`);
  };

  const handleDownloadPdf = async (quotation) => {
    const pdfRes = await generateTenantPdf({
      tenantId,
      documentType: 'quotation',
      data: buildPdfData(quotation),
      save: true,
      filename: `${quotation.displayRef}.pdf`,
    });
    pushStatus(pdfRes.ok ? `PDF generated for ${quotation.displayRef}.` : (pdfRes.error || 'Failed to generate PDF.'), pdfRes.ok ? 'success' : 'error');
  };

  const handleEmail = async (quotation) => {
    const email = String(quotation.clientSnapshot?.email || '').trim().toLowerCase();
    if (!email) {
      pushStatus('No recipient email is available for this quotation.', 'error');
      return;
    }
    const pdfRes = await generateTenantPdf({
      tenantId,
      documentType: 'quotation',
      data: buildPdfData(quotation),
      save: false,
      returnBase64: true,
      filename: `${quotation.displayRef}.pdf`,
    });
    if (!pdfRes.ok) {
      pushStatus(pdfRes.error || 'Failed to generate quotation PDF for email.', 'error');
      return;
    }
    const emailRes = await sendTenantDocumentEmail(tenantId, email, 'quotation', pdfRes.base64, buildPdfData(quotation));
    pushStatus(emailRes.ok ? `Quotation emailed to ${email}.` : (emailRes.error || 'Failed to send quotation email.'), emailRes.ok ? 'success' : 'error');
  };

  return (
    <PageShell
      title="Quotation Workspace"
      subtitle="Create, review, and manage client quotations before they move into proforma conversion."
      icon={FileText}
      eyebrow="Quotation"
      widthPreset="data"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setActiveView('create')} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${activeView === 'create' ? activeTabClass : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}>Create Quotation</button>
            <button type="button" onClick={() => setActiveView('existing')} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${activeView === 'existing' ? activeTabClass : 'bg-[var(--c-panel)] text-[var(--c-muted)]'}`}>Existing Quotations</button>
          </div>
        </div>

        {status ? <div ref={statusRef} className={`rounded-2xl border px-4 py-3 text-sm font-bold ${statusType === 'error' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>{status}</div> : null}

        {activeView === 'create' ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)_220px]">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Quotation Date<input ref={quotationDateFieldRef} type="date" className={inputClass} style={{ colorScheme: resolvedTheme }} value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} /></label>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Validity Duration<select ref={validityFieldRef} className={selectClass} value={validityWeeks} onChange={(e) => setValidityWeeks(Number(e.target.value))}>{[1,2,3,4,5,6,7,8].map((week) => <option key={week} value={week}>{week} Week{week > 1 ? 's' : ''}</option>)}</select><p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Expires on {expiryDate}</p></label>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Client Source</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClientMode('existing');
                      setExistingClient(null);
                      setSelectedDependents([]);
                    }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${clientMode === 'existing' ? activeChoiceCardClass : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${clientMode === 'existing' ? activeChoiceIconClass : 'bg-[var(--c-surface)] text-[var(--c-accent)]'}`}>
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-[var(--c-text)]">Existing Client</span>
                      <span className="block text-[10px] font-bold uppercase text-[var(--c-muted)]">Select from saved list</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClientMode('manual');
                      setExistingClient(null);
                      setSelectedDependents([]);
                    }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${clientMode === 'manual' ? activeChoiceCardClass : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${clientMode === 'manual' ? activeChoiceIconClass : 'bg-[var(--c-surface)] text-[var(--c-accent)]'}`}>
                      <UserPlus className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-[var(--c-text)]">New Client</span>
                      <span className="block text-[10px] font-bold uppercase text-[var(--c-muted)]">Enter details manually</span>
                    </span>
                  </button>
                </div>
              </div>

              {clientMode === 'existing' ? (
                <div className="space-y-4">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Existing Client</p><div className="mt-1"><ClientSearchField onSelect={(item) => { setExistingClient(item); setSelectedDependents([]); }} selectedId={existingClient?.id} filterType="parent" placeholder="Search company or individual clients..." /></div></div>
                  {existingClient ? (
                    <>
                      <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Add Dependents</p><div className="mt-1"><ClientSearchField onSelect={addDependentChip} selectedId={null} filterType="dependent" parentId={existingClient.id} placeholder="Search dependents for this client..." /></div></div>
                      {selectedDependents.length ? <div className="flex flex-wrap gap-2">{selectedDependents.map((item) => <button key={item.id} type="button" onClick={() => removeDependentChip(item.id)} className="rounded-full border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-1 text-xs font-bold text-[var(--c-text)]">{item.fullName || item.tradeName || item.displayClientId} ×</button>)}</div> : null}
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Client Type</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setManualClient((prev) => ({ ...prev, clientType: 'company' }))}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${manualClient.clientType === 'company' ? activeChoiceCardClass : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}
                      >
                        <img src="/company.png" alt="Company" className="h-10 w-10 rounded-xl object-cover" />
                        <div>
                          <p className="text-sm font-black text-[var(--c-text)]">Company</p>
                          <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Default quotation client</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualClient((prev) => ({ ...prev, clientType: 'individual' }))}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${manualClient.clientType === 'individual' ? activeChoiceCardClass : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}
                      >
                        <img src="/individual.png" alt="Individual" className="h-10 w-10 rounded-xl object-cover" />
                        <div>
                          <p className="text-sm font-black text-[var(--c-text)]">Individual</p>
                          <p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Switch naming to person flow</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">{manualClient.clientType === 'individual' ? 'Name' : 'Company Legal Name'}<input className={inputClass} value={manualClient.legalName} onChange={(e) => setManualClient((prev) => ({ ...prev, legalName: e.target.value }))} placeholder={manualClient.clientType === 'individual' ? 'Full name' : 'Company legal name'} /></label>
                  {manualClient.clientType === 'company' ? (
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Trade Name<input className={inputClass} value={manualClient.tradeName} onChange={(e) => setManualClient((prev) => ({ ...prev, tradeName: e.target.value.toUpperCase() }))} placeholder="Trade Name As Per License" /></label>
                  ) : null}
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Brand Name<input className={inputClass} value={manualClient.brandName} onChange={(e) => setManualClient((prev) => ({ ...prev, brandName: e.target.value }))} placeholder="Optional brand name" /></label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Mobile Number</p>
                      <button
                        type="button"
                        onClick={appendManualMobileContact}
                        disabled={manualClient.mobileContacts.length >= 3}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Add mobile number"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3 normal-case tracking-normal">
                      {manualClient.mobileContacts.map((contact, index) => (
                        <div key={contact.id} className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CountryPhoneField
                              countryIso2={contact.countryIso2}
                              value={contact.value}
                              onCountryChange={(countryIso2) => handleManualMobileCountryChange(contact.id, countryIso2)}
                              onValueChange={(value) => handleManualMobileChange(contact.id, value)}
                              onValuePaste={(event) => handleManualMobilePaste(contact.id, event)}
                              onValueBlur={() => handleManualMobileBlur(contact.id)}
                              name={`mobile-${index + 1}`}
                              placeholder={contact.countryIso2 === DEFAULT_COUNTRY_PHONE_ISO2 ? 'XX XXX XXXX' : 'XXXX'}
                              errorMessage={manualMobileErrors[contact.id] || ''}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMobileWhatsApp(contact.id)}
                            className={`mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                              contact.whatsAppEnabled
                                ? 'border-emerald-500/50 bg-emerald-500/12 text-emerald-400'
                                : 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]'
                            }`}
                            aria-label={contact.whatsAppEnabled ? 'Disable WhatsApp for this number' : 'Enable WhatsApp for this number'}
                            title={contact.whatsAppEnabled ? 'WhatsApp enabled' : 'WhatsApp disabled'}
                          >
                            <WhatsAppIcon className="h-5 w-5" />
                          </button>
                          {manualClient.mobileContacts.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeManualMobileContact(contact.id)}
                              className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)] transition hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400"
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Email Address</p>
                      <button
                        type="button"
                        onClick={appendManualEmailContact}
                        disabled={manualClient.emailContacts.length >= 3}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="Add email address"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3 normal-case tracking-normal">
                      {manualClient.emailContacts.map((contact, index) => (
                        <div key={contact.id} className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className={`mt-1 flex h-11 overflow-hidden rounded-xl border bg-[var(--c-panel)] text-[var(--c-text)] shadow-sm transition ${
                              manualEmailErrors[contact.id]
                                ? 'border-red-400/70 focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-400/10'
                                : 'border-[var(--c-border)] focus-within:border-[var(--c-accent)] focus-within:ring-4 focus-within:ring-[var(--c-accent)]/5'
                            }`}>
                              <input
                                type="email"
                                value={contact.value}
                                onChange={(e) => handleManualEmailChange(contact.id, e.target.value)}
                                onBlur={() => handleManualEmailBlur(contact.id)}
                                placeholder="name@domain.com"
                                className="min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-[var(--c-text)] outline-none placeholder:text-[var(--c-muted)]"
                                name={`email-${index + 1}`}
                              />
                            </div>
                            {manualEmailErrors[contact.id] ? (
                              <p className="mt-2 text-xs font-bold normal-case tracking-normal text-red-400">
                                {manualEmailErrors[contact.id]}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleEmailConversation(contact.id)}
                            className={`mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                              contact.emailEnabled
                                ? activeSoftTagClass
                                : 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]'
                            }`}
                            aria-label={contact.emailEnabled ? 'Disable email conversation for this address' : 'Enable email conversation for this address'}
                            title={contact.emailEnabled ? 'Email conversation enabled' : 'Email conversation disabled'}
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                          {manualClient.emailContacts.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeManualEmailContact(contact.id)}
                              className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)] transition hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400"
                              aria-label="Remove email address"
                              title="Remove email address"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                    Emirates
                    <div className="mt-1">
                      <EmirateSelect
                        value={manualClient.emirate}
                        onChange={(value) => setManualClient((prev) => ({ ...prev, emirate: value }))}
                        placeholder="Select emirate"
                      />
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--c-accent)_14%,transparent)] text-[var(--c-accent)]">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[var(--c-text)]">Description</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Purpose of this quotation</p>
                </div>
              </div>

              <label className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                Description
                <textarea
                  className={`${inputClass} min-h-[84px] resize-y`}
                  value={quotationDescription}
                  onChange={(e) => setQuotationDescription(e.target.value)}
                  onBlur={() => setQuotationDescription((prev) => normalizeLibraryDescription(prev))}
                  placeholder="Purpose of this quotation"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--c-accent)_14%,transparent)] text-[var(--c-accent)]">
                  <Tags className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[var(--c-text)]">Add Services</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">Build line items</p>
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.9fr)_56px_132px_176px_132px] xl:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--c-muted)]">Application / Service</p>
                  <div className="mt-2">
                    <ServiceSearchField
                      onSelect={handleSelectApplication}
                      selectedId={itemBuilder.service?.id || null}
                      placeholder="Select service..."
                      onCreateNew={null}
                      refreshKey={serviceRefreshKey}
                      variant="compact"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--c-muted)] opacity-0">New</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInlineTemplateOpen((prev) => !prev);
                      setInlineTemplateError('');
                    }}
                    className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
                    aria-label="Add new application template"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <label className="text-xs font-black uppercase tracking-wider text-[var(--c-muted)]">
                  Quantity
                  <input
                    type="number"
                    min={1}
                    className={`${inputClass} mt-2`}
                    value={itemBuilder.qty}
                    onChange={(event) => setItemBuilder((prev) => ({ ...prev, qty: Math.max(1, Number(event.target.value) || 1) }))}
                  />
                </label>

                <label className="text-xs font-black uppercase tracking-wider text-[var(--c-muted)]">
                  Unit Price
                  <div className="mt-2 flex h-10 max-w-[176px] items-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] pl-3 pr-2 focus-within:border-[var(--c-accent)] focus-within:ring-4 focus-within:ring-[var(--c-accent)]/5">
                    <DirhamIcon className="mr-3 h-4 w-4 shrink-0 text-[var(--c-muted)]" />
                    <input
                      type="number"
                      min={0}
                      className="w-[9ch] min-w-0 bg-transparent text-sm font-bold text-[var(--c-text)] outline-none placeholder:text-[var(--c-muted)]"
                      value={itemBuilder.amount}
                      onChange={(event) => setItemBuilder((prev) => ({ ...prev, amount: event.target.value }))}
                      onBlur={(event) => setItemBuilder((prev) => ({ ...prev, amount: formatAmountInputValue(event.target.value) }))}
                      placeholder="0.00"
                    />
                  </div>
                </label>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--c-muted)] opacity-0">Add</p>
                  <button
                    type="button"
                    onClick={handleAddBuiltItem}
                    className={`mt-2 h-10 w-full rounded-xl px-4 text-sm font-bold transition ${primaryActionClass}`}
                  >
                    Add
                  </button>
                </div>
              </div>

              {isInlineTemplateOpen ? (
                <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-[var(--c-accent)]">Add New Application</p>
                  <ServiceTemplateEditor
                    draft={inlineTemplateDraft}
                    onDraftChange={setInlineTemplateDraft}
                    icons={applicationIcons}
                    iconActionSlot={(
                      <ApplicationIconQuickAddPanel
                        tenantId={tenantId}
                        createdBy={user?.uid || ''}
                        existingIcons={applicationIcons}
                        suggestedName={inlineTemplateDraft.name}
                        isOpen={isInlineTemplateIconQuickAddOpen}
                        onOpen={() => setIsInlineTemplateIconQuickAddOpen(true)}
                        onClose={() => setIsInlineTemplateIconQuickAddOpen(false)}
                        onCreated={(createdIcon) => {
                          setApplicationIcons((prev) => (
                            [...prev, createdIcon].sort((a, b) => String(a.iconName || '').localeCompare(String(b.iconName || ''), undefined, { sensitivity: 'base' }))
                          ));
                          setInlineTemplateDraft((prev) => ({ ...prev, iconId: createdIcon.iconId }));
                          setInlineTemplateError('');
                          pushStatus(`Icon "${createdIcon.iconName}" added and selected.`, 'success');
                        }}
                      />
                    )}
                    onSubmit={handleInlineTemplateSave}
                    onCancel={() => {
                      setIsInlineTemplateOpen(false);
                      setIsInlineTemplateIconQuickAddOpen(false);
                      setInlineTemplateError('');
                      setInlineTemplateDraft(createEmptyServiceTemplateDraft());
                    }}
                    isSaving={isInlineTemplateSaving}
                    error={inlineTemplateError}
                    submitLabel={isInlineTemplateSaving ? 'Saving...' : 'Save Application'}
                    showCancel
                    wrapInForm={false}
                    tone="surface"
                  />
                </div>
              ) : null}

              {items.length ? (
                <div className="space-y-3">
                  {items.map((item, index) => <div key={item.rowId} draggable onDragStart={() => { setDraggedItemRowId(item.rowId); setDragOverItemRowId(item.rowId); }} onDragOver={(event) => { event.preventDefault(); if (dragOverItemRowId !== item.rowId) setDragOverItemRowId(item.rowId); }} onDrop={(event) => { event.preventDefault(); moveItemRow(draggedItemRowId, item.rowId); setDraggedItemRowId(''); setDragOverItemRowId(''); }} onDragEnd={() => { setDraggedItemRowId(''); setDragOverItemRowId(''); }} className={`rounded-2xl border bg-[var(--c-panel)] p-4 transition ${dragOverItemRowId === item.rowId ? 'border-[var(--c-accent)] ring-2 ring-[var(--c-accent)]/15' : 'border-[var(--c-border)]'}`}><div className="grid gap-4 md:grid-cols-[64px_56px_1.6fr_120px_176px_auto] md:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--c-muted)]">Order</p><p className="mt-2 text-lg font-black text-[var(--c-text)]">{index + 1}</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--c-muted)]">Move</p><button type="button" draggable tabIndex={-1} className="mt-1 inline-flex h-11 w-11 cursor-grab items-center justify-center rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)] active:cursor-grabbing"><GripVertical className="h-5 w-5" /></button></div><div><p className="text-sm font-black text-[var(--c-text)]">{item.name}</p><p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{item.applicationId}</p></div><label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Quantity<input type="number" min={1} className={inputClass} value={item.qty} onChange={(e) => handleItemChange(item.rowId, 'qty', e.target.value)} /></label><label className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Amount<div className="mt-1 flex h-[50px] max-w-[176px] items-center rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] pl-3 pr-2 focus-within:border-[var(--c-accent)] focus-within:ring-4 focus-within:ring-[var(--c-accent)]/5"><DirhamIcon className="mr-3 h-4 w-4 shrink-0 text-[var(--c-muted)]" /><input type="number" min={0} className="w-[9ch] min-w-0 bg-transparent text-sm font-bold text-[var(--c-text)] outline-none placeholder:text-[var(--c-muted)]" value={item.amount} onChange={(e) => handleItemChange(item.rowId, 'amount', e.target.value)} placeholder="0.00" /></div></label><button type="button" onClick={() => removeItem(item.rowId)} className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700">Remove</button></div><div className="mt-3 flex items-center justify-between text-xs font-bold"><span className="text-[var(--c-muted)]">Line Total</span><span className="text-[var(--c-text)]"><CurrencyValue value={(Number(item.qty) || 0) * (Number(item.amount) || 0)} iconSize="h-3 w-3" /></span></div></div>)}
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3"><span className="text-sm font-black text-[var(--c-text)]">Quotation Total</span><span className="text-lg font-black text-[var(--c-text)]"><CurrencyValue value={totalAmount} iconSize="h-4 w-4" /></span></div>
                </div>
              ) : <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-6 text-center text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">No applications added yet.</div>}
            </div>

            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-[var(--c-text)]">Terms and Conditions</p>
                  <p className="text-xs font-black uppercase tracking-wider text-[var(--c-muted)]">Shown on this quotation only</p>
                </div>
                <button
                  type="button"
                  onClick={appendQuotationTerm}
                  disabled={quotationTerms.length >= 5}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Add term and condition"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                {quotationTerms.map((term, index) => {
                  const resolvedText = resolveQuotationTermText(term, expiryDate);
                  return (
                    <div key={term.id} className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--c-muted)]">Condition {index + 1}</p>
                          {term.type === 'expiry' ? (
                            <p className="mt-2 text-sm font-bold text-[var(--c-text)]">{resolvedText}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {term.type === 'expiry' ? (
                            <button
                              type="button"
                              onClick={focusQuotationDateControls}
                              className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[var(--c-text)] transition hover:border-[var(--c-accent)] hover:text-[var(--c-accent)]"
                            >
                              Edit Date
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeQuotationTerm(term.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-muted)] transition hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400"
                            aria-label={`Remove condition ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {term.type === 'custom' ? (
                        <textarea
                          className={`${inputClass} mt-3 min-h-[72px] resize-y normal-case tracking-normal`}
                          value={term.text}
                          onChange={(e) => handleQuotationTermChange(term.id, e.target.value)}
                          placeholder="Enter a quotation condition for this client"
                        />
                      ) : (
                        <p className="mt-3 text-xs font-bold text-[var(--c-muted)]">
                          This condition follows the selected expiry date. Use Edit Date to update it from the quotation date section.
                        </p>
                      )}
                    </div>
                  );
                })}
                {quotationTerms.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-6 text-center text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">
                    No terms added for this quotation.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end"><button type="button" onClick={() => void saveQuotation()} disabled={isSaving || isLoading} className={`min-w-[180px] rounded-xl px-6 py-3 text-sm font-bold transition disabled:opacity-50 ${primaryActionClass}`}>{isSaving ? 'Generating...' : 'Generate Quotation'}</button></div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm"><p className="mb-3 text-sm font-bold text-[var(--c-text)]">Quotation List</p><div className="space-y-2">{rows.map((quotation) => <button key={quotation.id} type="button" onClick={() => setSelectedQuotationId(quotation.id)} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedQuotationId === quotation.id ? activeChoiceCardClass : 'border-[var(--c-border)] bg-[var(--c-panel)]'}`}><p className="text-sm font-black text-[var(--c-text)]">{quotation.displayRef}</p><p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">{quotation.status || 'generated'} • {quotation.quoteDate}</p><div className="mt-2 text-xs font-bold text-[var(--c-text)]"><CurrencyValue value={quotation.totalAmount || 0} iconSize="h-3 w-3" /></div></button>)}{rows.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-6 text-center text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">No quotations generated yet.</div> : null}</div></div>
            <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-sm">
              {selectedQuotation ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-bold text-[var(--c-text)]">{selectedQuotation.displayRef}</p><p className="text-sm font-bold text-[var(--c-muted)]">{selectedQuotation.clientSnapshot?.name || selectedQuotation.clientSnapshot?.tradeName || 'Client'}</p></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Status</p><p className="text-sm font-black text-[var(--c-text)]">{selectedQuotation.status || 'generated'}</p></div></div>
                  <div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Quote Date</p><p className="mt-2 text-sm font-black text-[var(--c-text)]">{selectedQuotation.quoteDate || '-'}</p></div><div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Expiry Date</p><p className="mt-2 text-sm font-black text-[var(--c-text)]">{selectedQuotation.expiryDate || '-'}</p></div><div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Total</p><div className="mt-2 text-sm font-black text-[var(--c-text)]"><CurrencyValue value={selectedQuotation.totalAmount || 0} iconSize="h-3 w-3" /></div></div></div>
                  <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4"><p className="mb-3 text-sm font-black text-[var(--c-text)]">Applications</p><div className="space-y-2">{(selectedQuotation.items || []).map((item, index) => <div key={`${selectedQuotation.id}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3"><div><p className="text-sm font-black text-[var(--c-text)]">{item.name}</p><p className="text-[10px] font-bold uppercase text-[var(--c-muted)]">Qty {item.qty}</p></div><div className="text-sm font-black text-[var(--c-text)]"><CurrencyValue value={item.lineTotal || 0} iconSize="h-3 w-3" /></div></div>)}</div></div>
                  {String(selectedQuotation.termsAndConditions || '').trim() ? <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4"><p className="mb-3 text-sm font-black text-[var(--c-text)]">Terms and Conditions</p><div className="space-y-2">{String(selectedQuotation.termsAndConditions || '').split(/\r?\n/).filter(Boolean).map((term, index) => <p key={`${selectedQuotation.id}-term-${index}`} className="text-sm font-bold text-[var(--c-text)]">{term}</p>)}</div></div> : null}
                  {selectedQuotation.cancellationReason ? <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-700">Cancellation reason: {selectedQuotation.cancellationReason}</div> : null}
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6"><button type="button" onClick={() => void handleDownloadPdf(selectedQuotation)} className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-xs font-black text-[var(--c-text)]">Download PDF</button><button type="button" onClick={() => void handleEmail(selectedQuotation)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-xs font-black text-[var(--c-text)]"><Mail className="h-4 w-4" />Email</button><button type="button" onClick={() => void handleClone(selectedQuotation)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-xs font-black text-[var(--c-text)]"><Copy className="h-4 w-4" />Clone</button><button type="button" onClick={() => void handleExtend(selectedQuotation)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3 text-xs font-black text-[var(--c-text)]"><RefreshCcw className="h-4 w-4" />Extend</button><button type="button" onClick={() => void handleAccept(selectedQuotation)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700"><CheckCircle2 className="h-4 w-4" />Accept</button><button type="button" onClick={() => void handleCancel(selectedQuotation)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700"><Ban className="h-4 w-4" />Cancel</button></div>
                </div>
              ) : <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] p-6 text-center text-xs font-bold uppercase tracking-widest text-[var(--c-muted)]">Select a quotation to review it.</div>}
            </div>
          </div>
        )}

      </div>
      <ProgressVideoOverlay
        open={isSaving}
        dismissible={false}
        minimal
        frameless
        videoSrc="/Video/DocumentGeneration.mp4"
        frameWidthClass="max-w-[360px]"
        backdropClassName="bg-white/92 backdrop-blur-sm"
        title="Quotation Generating"
        subtitle=""
      />
    </PageShell>
  );
};

export default QuotationPage;
