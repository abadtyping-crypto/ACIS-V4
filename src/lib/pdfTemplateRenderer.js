export const PDF_DOCUMENT_TYPES = [
  { key: 'paymentReceipt', label: 'Payment Receipt' },
  { key: 'nextInvoice', label: 'Next Invoice' },
  { key: 'quotation', label: 'Quotation' },
  { key: 'performerInvoice', label: 'Performer Invoice' },
  { key: 'statement', label: 'Statements' },
];

// Renderer integration contract:
// 1) Fetch document-type template doc via fetchTenantPdfTemplates().
// 2) Resolve active template using resolvePdfTemplateForRenderer().
// 3) Pass returned "template" to the PDF renderer.
// 4) Asset URLs are versioned with ?tv={templateVersion} to force cache refresh after edits.
export const PDF_DEFAULT_TEMPLATE = Object.freeze({
  templateId: 'default',
  name: 'Default',
  logoUrl: '',
  logoPosition: 'left',
  titleText: '',
  headerText: '',
  headerBackground: '#0f172a',
  footerText: '',
  footerLink: '',
  footerAlignment: 'left',
  qrEnabled: false,
  qrSource: 'paymentLink',
  qrSize: 120,
  paperSize: 'A4',
  orientation: 'portrait',
  margins: { top: 24, right: 24, bottom: 24, left: 24 },
  rowPadding: 8,
  bodyLayout: 'standard',
  accentColor: '#2563eb',
  backgroundType: 'solid',
  backgroundColor: '#ffffff',
  backgroundImageUrl: '',
  gradientStart: '#eff6ff',
  gradientEnd: '#bfdbfe',
  coverPageEnabled: false,
  notes: '',
});

const ensurePositiveNumber = (value, fallback, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  if (Number.isFinite(max)) return Math.min(parsed, max);
  return parsed;
};

const coerceMargins = (margins) => {
  const safe = margins && typeof margins === 'object' ? margins : {};
  return {
    top: ensurePositiveNumber(safe.top, PDF_DEFAULT_TEMPLATE.margins.top, 120),
    right: ensurePositiveNumber(safe.right, PDF_DEFAULT_TEMPLATE.margins.right, 120),
    bottom: ensurePositiveNumber(safe.bottom, PDF_DEFAULT_TEMPLATE.margins.bottom, 120),
    left: ensurePositiveNumber(safe.left, PDF_DEFAULT_TEMPLATE.margins.left, 120),
  };
};

export const normalizePdfTemplatePayload = (template) => {
  const raw = template && typeof template === 'object' ? template : {};
  return {
    templateId: String(raw.templateId || PDF_DEFAULT_TEMPLATE.templateId),
    name: String(raw.name || PDF_DEFAULT_TEMPLATE.name).trim() || PDF_DEFAULT_TEMPLATE.name,
    logoUrl: String(raw.logoUrl || ''),
    logoPosition: ['left', 'center', 'right'].includes(raw.logoPosition)
      ? raw.logoPosition
      : PDF_DEFAULT_TEMPLATE.logoPosition,
    titleText: String(raw.titleText || ''),
    headerText: String(raw.headerText || ''),
    headerBackground: String(raw.headerBackground || PDF_DEFAULT_TEMPLATE.headerBackground),
    footerText: String(raw.footerText || ''),
    footerLink: String(raw.footerLink || ''),
    footerAlignment: ['left', 'center', 'right'].includes(raw.footerAlignment)
      ? raw.footerAlignment
      : PDF_DEFAULT_TEMPLATE.footerAlignment,
    qrEnabled: Boolean(raw.qrEnabled),
    qrSource: ['paymentLink', 'invoiceUrl'].includes(raw.qrSource)
      ? raw.qrSource
      : PDF_DEFAULT_TEMPLATE.qrSource,
    qrSize: ensurePositiveNumber(raw.qrSize, PDF_DEFAULT_TEMPLATE.qrSize, 240),
    paperSize: ['A4', 'Letter'].includes(raw.paperSize) ? raw.paperSize : PDF_DEFAULT_TEMPLATE.paperSize,
    orientation: ['portrait', 'landscape'].includes(raw.orientation)
      ? raw.orientation
      : PDF_DEFAULT_TEMPLATE.orientation,
    margins: coerceMargins(raw.margins),
    rowPadding: ensurePositiveNumber(raw.rowPadding, PDF_DEFAULT_TEMPLATE.rowPadding, 48),
    bodyLayout: ['standard', 'compact'].includes(raw.bodyLayout)
      ? raw.bodyLayout
      : PDF_DEFAULT_TEMPLATE.bodyLayout,
    accentColor: String(raw.accentColor || PDF_DEFAULT_TEMPLATE.accentColor),
    backgroundType: ['solid', 'gradient', 'image'].includes(raw.backgroundType)
      ? raw.backgroundType
      : PDF_DEFAULT_TEMPLATE.backgroundType,
    backgroundColor: String(raw.backgroundColor || PDF_DEFAULT_TEMPLATE.backgroundColor),
    backgroundImageUrl: String(raw.backgroundImageUrl || ''),
    gradientStart: String(raw.gradientStart || PDF_DEFAULT_TEMPLATE.gradientStart),
    gradientEnd: String(raw.gradientEnd || PDF_DEFAULT_TEMPLATE.gradientEnd),
    coverPageEnabled: Boolean(raw.coverPageEnabled),
    notes: String(raw.notes || ''),
  };
};

const withVersionCacheBuster = (url, templateVersion) => {
  const source = String(url || '').trim();
  if (!source) return '';
  const version = Number(templateVersion) || 1;
  try {
    const parsed = new URL(source);
    parsed.searchParams.set('tv', String(version));
    return parsed.toString();
  } catch {
    const separator = source.includes('?') ? '&' : '?';
    return `${source}${separator}tv=${version}`;
  }
};

export const resolvePdfTemplateForRenderer = ({ documentType, templateDoc, fallbackTemplate }) => {
  const fallback = normalizePdfTemplatePayload(fallbackTemplate || PDF_DEFAULT_TEMPLATE);
  const doc = templateDoc && typeof templateDoc === 'object' ? templateDoc : null;
  if (!doc || doc.documentType !== documentType || doc.isTemplateEnabled === false) {
    return {
      template: fallback,
      templateVersion: 1,
      templateEnabled: false,
    };
  }

  const templates = Array.isArray(doc.templates) ? doc.templates.map(normalizePdfTemplatePayload) : [];
  const activeId = String(doc.activeTemplateId || 'default');
  const activeTemplate = templates.find((item) => item.templateId === activeId) || templates[0] || fallback;
  const templateVersion = Number(doc.templateVersion) || 1;
  const resolved = {
    ...activeTemplate,
    logoUrl: withVersionCacheBuster(activeTemplate.logoUrl, templateVersion),
    backgroundImageUrl: withVersionCacheBuster(activeTemplate.backgroundImageUrl, templateVersion),
  };

  return {
    template: resolved,
    templateVersion,
    templateEnabled: true,
  };
};
