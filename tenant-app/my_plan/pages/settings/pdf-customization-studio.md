# PDF Customization Studio Plan

## 1) Objective

Give tenants a centralized "PDF Customization Studio" inside Settings. This studio surfaces every PDF-producing experience (payment acknowledgements, invoice/quotation statements, receipt acknowledgements, performer invoices, and any future statement exports) behind a single toggleable workspace so operations teams can tweak logo, branding assets, QR codes, and layout helpers without touching code.

---

## 2) Scope

1. Add a new Settings option (e.g., under Branding or New "PDF Studio") that opens the studio panel.
2. List every current PDF producer (Payment Receipt, Next Invoice, Quotation, Performer Invoice, Statements) and tie them to profile presets.
3. Provide real-time previews of header/footer/cover layers plus row-level sections (body, totals, QR block, notes).
4. Allow enable/disable toggles, asset uploads, and fine-grained spacing/margin controls.
5. Persist tenant-specific templates (per document type) in Firestore settings so renderer picks them up.
6. Document how PDF generator service will consume template metadata + when regeneration occurs.

---

## 3) UI / Studio Layout

1. Panel opens inside `SettingsPage` in a dedicated card (`SettingCard` style). Tabs or accordion for each document type.
2. Each tab contains:
   - Template selector (Default / Custom presets) + duplicate/delete actions.
   - Logo uploader (SVG/PNG) with live preview of `logoPosition` (left/center/right).
   - Header area fields (title text, meta rows, background color/pattern select).
   - Footer area controls (text, link, QR toggle, alignment).
   - QR block toggle that when enabled lets user choose data source (`paymentLink`, `invoiceUrl`) and size.
   - Layout controls for margins, padding, paper size (A4/letter), orientation.
   - Branding overrides (background image, gradient, accent colors pulled from theme variables).
3. Provide preview canvas referencing existing assets (mock data) and a "Render Preview" button.
4. Expose validation messages inline (e.g., image file size, required header text when QR overlay enabled).

---

## 4) Data + Persistence

1. Store templates under `tenants/{tenantId}/settings/pdfTemplates/{documentType}` with payload:
   - `templateId`, `name`, `logoUrl`, `headerText`, `footerText`, `qrEnabled`, `qrSource`, `margins`, `brandColors`, `orientation`, `lastUpdatedBy`, `lastUpdatedAt`.
2. Provide Firestore service helper (`fetchTenantPdfTemplates`, `upsertTenantPdfTemplate`, `deleteTenantPdfTemplate`).
3. When user hits "Save template", write new or update existing doc plus a sync event entry (`entityType: pdfTemplate`).
4. PDF generator (existing service) reads template metadata before rendering each PDF and falls back to defaults when template missing.
5. Add a cache bust query parameter or `templateVersion` field so renderer knows when to reload new assets.

---

## 5) Integration Points

1. Payment receipt, next invoice, quotation, performer invoice, statement exports must request template by type before calling PDF renderer.
2. Each PDF call passes metadata (logoUrl, header/footer blocks, QR config) to the renderer; fallback uses shared defaults typical today.
3. Provide `isTemplateEnabled` flag per type so operations can disable custom layouts and fall back to legacy layout instantly.
4. Optionally surface preview links in each PDF page that open the studio with the right tab/variant in edit mode.

---

## 6) Toggle & Access Controls

1. Studio access permission lives under `User Control Center`; default open to Admin + Manager, but view + edit toggles per UID.
2. Include a global switch (Settings > Preferences) to enable/disable premium features like QR, gradient backgrounds, or cover page statements.
3. Use action-level blocking to prevent unauthorized saves; show readable message referencing User Control Center if blocked.

---

## 7) Acceptance Criteria

- [ ] Settings page surfaces a new PDF Studio card with tabbed flows for each PDF-producing document.
- [ ] Templates can be created, duplicated, deleted, and marked active per document type.
- [ ] Logo/header/footer/QR/margins controls persist to Firestore and trigger sync events.
- [ ] Renderer reads the active template before generating a PDF and reverts to defaults if template disabled.
- [ ] Premium toggles gate advanced visual controls and respect user access rules.
- [ ] Inline preview updates when a key field changes and shows mock data for clarity.

---

## 8) Tests & Verification

1. Manual: Create custom template for payment receipt, toggle QR, upload logo, save, and generate sample PDF verifying new layout.
2. Automated: Unit tests for template service helpers and renderer fallbacks.
3. QA: Responsive check for studio panel on 320px, 768px, 1200px states and keyboard navigation for form controls.

---

## 9) Future Enhancements

1. Expose API endpoint to export/import template JSON for sharing between tenants.
2. Add a marketplace of branded templates with per-tenant defaults.
3. Allow scheduling preview exports (PDF snapshot in app) after template edits.
