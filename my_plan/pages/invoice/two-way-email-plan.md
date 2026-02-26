# Two-Way Email Plan (Multi-Tenant)

This is the restored working plan for adding two-way email safely after launch.

## Goal

Enable each tenant to:
1. Send document emails from approved sender identity.
2. Receive replies into the system automatically.
3. Store email body + attachments in cloud storage.
4. Link each conversation to client and document/transaction ID.

---

## Current State (Launch Version)

1. Outbound SMTP is active.
2. CC/BCC defaults are configurable for document emails.
3. SMS is optional and separate.
4. Inbound reply capture is not yet implemented.

---

## Recommended Architecture

### 1) Outbound (keep existing)

1. `From`: `no-reply@yourdomain.com` or `documents@yourdomain.com`
2. `Reply-To`: `support@yourdomain.com`
3. `BCC`: `archive@yourdomain.com`
4. Optional `CC`: operations/manager mailboxes

### 2) Inbound (new)

Use provider webhook/API (recommended), not desktop client sync.

Options:
1. Mailgun inbound routes
2. SendGrid Inbound Parse
3. Postmark inbound webhook
4. Microsoft Graph / Gmail API (if tenant-specific mailbox model is required)

### 3) Storage and Linking

1. Save incoming email metadata in DB:
   - `tenantId`
   - `from`, `to`, `cc`, `subject`
   - `messageId`, `threadId`, `inReplyTo`
   - `receivedAt`
2. Save email body and attachments in cloud storage.
3. Parse token/reference from subject/body (example `TXID`, `CLID`) and link to record.

---

## Minimal Data Model

1. `tenant_email_threads`
2. `tenant_email_messages`
3. `tenant_email_attachments`
4. `tenant_email_routing_rules`

---

## Routing Rules

1. If customer email is valid: send to customer.
2. If customer email missing/invalid: send to fallback recipient (`info@` / `admin@`).
3. Always keep BCC archive for audit trail.
4. Reply handling:
   - If thread token exists: attach to existing thread.
   - Else route to tenant inbox queue as unlinked reply.

---

## Security and Compliance

1. SPF + DKIM + DMARC required before production.
2. Encrypt provider tokens/secrets at rest.
3. Never expose tokens in frontend.
4. Write audit log for send/retry/fail/inbound parse.
5. Apply per-tenant rate limits and attachment size checks.

---

## Rollout Plan

### Phase 1 (Now)
1. Keep outbound SMTP only.
2. Keep default CC/BCC.
3. Launch and observe reliability.

### Phase 2 (Next)
1. Add inbound webhook endpoint.
2. Store replies + attachments.
3. Add thread view in UI (client/document timeline).

### Phase 3 (Scale)
1. Auto-routing rules by team/client.
2. SLA alerts for unread replies.
3. Deliverability analytics (bounce, complaint, delay).

---

## Practical Note on Tools

1. Thunderbird is a desktop email client (manual operations).
2. Kleopatra is for encryption/key management.
3. For app automation, webhook/API-based inbound is the correct path.

---

## Acceptance Checklist

- [ ] Outbound sending stable with tenant domain.
- [ ] CC/BCC defaults verified.
- [ ] Fallback recipient logic verified.
- [ ] Inbound webhook receives test reply.
- [ ] Reply is linked to tenant + client/document record.
- [ ] Attachments are stored and retrievable.
- [ ] Audit trail visible to admin.
