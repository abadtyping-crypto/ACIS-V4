# Invoice Email Integration Options (Multi-Tenant)

This note is a pre-implementation guide for the Invoice module so each tenant can connect their own mailbox and auto-attach invoice documents.

## Goal

Enable each tenant to:
1. Connect one or more email accounts.
2. Trigger outbound invoice emails from the app.
3. Attach invoice PDFs and optional supporting files.
4. Track status (queued, sent, failed, opened if provider supports tracking).

---

## Option 1: Direct SMTP/IMAP per tenant (quick start)

### How it works
- Tenant enters SMTP credentials (host, port, username, password/app-password).
- App sends invoice emails directly through tenant SMTP server.
- Optional IMAP connection can be used to sync sent-state.

### Pros
- Fastest to implement.
- Works with almost any provider.
- No heavy OAuth setup for first release.

### Cons
- Tenant must manage credentials manually.
- Password rotation and security handling become your responsibility.
- Some providers block basic auth.

### Best for
- MVP release when speed is priority.

---

## Option 2: OAuth provider integrations (recommended for production)

### How it works
- Tenant connects Gmail / Microsoft 365 using OAuth.
- Store refresh token encrypted per tenant.
- Send email through provider API (Gmail API / Microsoft Graph).

### Pros
- Better security and user trust.
- Fewer auth failures than raw SMTP in modern providers.
- Richer metadata and mailbox operations.

### Cons
- Higher initial implementation effort.
- Requires provider app registration, scopes, callback URLs.

### Best for
- Long-term scalable multi-tenant platform.

---

## Option 3: Transactional email relay + tenant “From” identity

### How it works
- Use one sending platform (e.g., SES, SendGrid, Postmark).
- Tenants verify domains/sender identities.
- App sends all invoice mails through central relay.

### Pros
- Strong deliverability controls and centralized analytics.
- Easier retries, queueing, and bounce handling.
- Minimal per-tenant connection complexity.

### Cons
- Tenants may prefer to send from their own mailbox provider.
- Domain verification flow needed.

### Best for
- Enterprises needing reliable delivery and reporting.

---

## Suggested architecture for your Invoice page

### 1) Tenant Email Connection Settings
Create a section under Settings:
- Provider Type: SMTP / Gmail OAuth / Microsoft OAuth / Relay.
- Sender identities: `fromName`, `fromEmail`, `replyTo`.
- Connection test button.
- Connection health status and last successful send.

### 2) Invoice Send Pipeline
Use async workflow:
- Generate invoice PDF.
- Build email payload (to/cc/bcc, subject, body, attachments).
- Push job into queue (`invoice_email_jobs`).
- Worker sends email and stores response.
- UI polls or subscribes for status updates.

### 3) Required data model (minimum)
- `tenant_email_connections`
- `invoice_email_templates`
- `invoice_email_logs`
- `invoice_email_attachments`

### 4) Security requirements
- Encrypt secrets/tokens at rest.
- Never expose tokens to frontend.
- Audit log every send/retry/failure.
- Per-tenant rate limits.

### 5) UX expectations for invoice page
- “Send Invoice” modal with:
  - Recipient preview.
  - Template selector.
  - Attachment checklist.
  - “Send test email” action.
- Status badges: Draft / Queued / Sent / Failed.
- Retry action for failed sends.

---

## Recommended rollout plan

### Phase 1 (fast)
- Implement SMTP connection + queue + logs + PDF attachment send.

### Phase 2 (secure/modern)
- Add Gmail OAuth and Microsoft OAuth providers.

### Phase 3 (enterprise)
- Add relay provider integration + bounce/webhook analytics.

---

## Practical recommendation before implementation

If you want the safest balance of speed + future-proofing:
1. Start with **SMTP + queue-based sender architecture**.
2. Build provider adapter interface from day one (`sendEmail(provider, payload)`).
3. Add OAuth providers without changing Invoice UI contract.

This gives immediate business value while keeping the design ready for production-grade integrations.
