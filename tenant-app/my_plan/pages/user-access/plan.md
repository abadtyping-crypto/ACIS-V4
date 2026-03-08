# User Access & Transaction ID Plan (V2)

## 1) Objective

Build a tenant-safe system with:
1. Custom transaction ID rules per tenant.
2. User-wise access customization (UID-level), not only role-wise.
3. User-wise notification customization.
4. Action-level blocking (page visible, restricted actions blocked with clear message).

---

## 2) Core Rules (Final)

1. `createdBy`, `updatedBy`, `approvedBy` store UID only.
2. Keep Firestore doc UID as primary key for all entities.
3. Use readable IDs as display fields (`displayTransactionId`, etc.), not as Firestore key.
4. Portal/Application entities follow the same UID-first rule.
5. Access is checked at action level (create/update/delete/approve/adjust), not page level only.

---

## 3) Transaction ID Customization

### 3.1 Transaction Types

1. Portal Transactions (`POR`)
2. Operation Expenses (`EXP`)
3. Loan Transactions (`LON`)
4. Loan Person (`LOAN`)

### 3.2 Default Format

1. `POR-DDMMYYYY-0001`
2. `EXP-DDMMYYYY-0001`
3. `LON-DDMMYYYY-0001`
4. `LOAN0001`

### 3.3 Tenant Customization Options

Per tenant:
1. `skipDate` (true/false)
2. `sequenceStart` (numeric)
3. `padding` (example `4` => `0001`)
4. `prefix` (example `POR`, `EXP`, `LON`)

### 3.4 Storage Model

1. Firestore document ID remains random UID.
2. Add `displayTransactionId` field for readable ID.
3. Keep sequence counters in tenant-scoped settings:
   - `lastPortalTransactionSeq`
   - `lastOperationExpenseSeq`
   - `lastLoanTransactionSeq`
   - `lastLoanPersonSeq`

---

## 4) Access & Notification Architecture

### 4.1 Model

Use hybrid model:
1. Role defaults (`staff`, `accountant`, `manager`)
2. User overrides (`userOverrides[uid]`)

Effective permission = `roleDefault` merged with `userOverride`.

### 4.2 Action-Level Enforcement

1. UI can show page and options.
2. Restricted action returns:
   - UI message: `You can't perform this transaction`
3. Backend must enforce same check before execution.

### 4.3 Notification Customization

Per user UID:
1. Feature notifications on/off
2. Event-level on/off (create/update/delete/approval/etc.)
3. Channel preferences (in-app/email/flash)
4. Quiet hours / mute duration

---

## 5) UI Component Structure

Keep separate components, managed in one page:

1. `UserFunctionAccessSection`
   - controls user-wise action permissions.

2. `UserNotificationRulesSection`
   - controls user-wise notification behavior.

3. `UserControlCenterPage`
   - single place to select user and manage both sections.

---

## 6) Suggested Permission Matrix (Role Defaults)

| Function | Staff | Accountant | Manager |
| --- | --- | --- | --- |
| Create New Portal | ❌ | ❌ | ❌ |
| Create New Portal (Notification) | ❌ | ✅ | ✅ |
| Direct Balance Adjustment | ❌ | ✅ | ❌ |
| Direct Balance Adjustment (Notification) | ❌ | ✅ | ✅ |
| Loan Management | ❌ | ✅ | ✅ |
| Loan Management (Notification) | ❌ | ✅ | ✅ |
| Internal Transfer | ✅ | ✅ | ✅ |
| Internal Transfer (Notification) | ✅ | ✅ | ✅ |

Note: any row can be overridden per UID.

---

## 7) Email Trigger (Tenant SMTP)

1. Tenant configures SMTP in settings.
2. Backend stores SMTP config encrypted per tenant.
3. UI triggers backend endpoint to send email.
4. Backend sends email using tenant SMTP (not frontend direct SMTP).

---

## 8) Milestones

| Milestone | Scope |
| --- | --- |
| M1 | Transaction ID core + tenant sequence counters |
| M2 | Transaction ID customization options (`skipDate`, `prefix`, `start`) |
| M3 | User-wise access model (role defaults + UID overrides) |
| M4 | User-wise notification rules component |
| M5 | Combined User Control Center page |
| M6 | Backend action-level enforcement + standardized error response |
| M7 | Tenant SMTP configuration + send-email integration |
| M8 | Full QA (web + mobile + electron platform visibility rules) |

---

## 9) Non-Negotiable Security

1. UI checks are not enough; backend check is mandatory.
2. Every sensitive action logs:
   - `tenantId`
   - `uid`
   - `action`
   - `status`
   - `timestamp`
3. Never expose hidden/system admin IDs in normal user lists.
