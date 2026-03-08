# Daily Transaction Implementation Plan (V4)

Last refreshed: 2026-03-07

## 1) Objective

Implement a tenant-safe Daily Transaction module for service operations (no inventory), with reliable financial posting, clear audit history, and strict sync-event compliance.

## 2) Route, Access, and Default Page Behavior

1. Route must stay tenant-first: `/t/:tenantId/daily-transaction`.
2. Sidebar entry opens the Daily Transaction page.
3. Default view is a Live List of recent transactions.
4. A clear `Add New Transaction` action opens the create form.
5. Keep an `Exchange` button placeholder only (no business logic in this phase).

## 3) Form Model and UX Rules

### 3.1 Core Fields

| Field | Type | Rules |
| --- | --- | --- |
| `transactionDate` | Date | Required, default today, back-date allowed. |
| `applicationId` | Searchable select | Required, from application templates. |
| `clientCharge` | Number | Required, prefill from template, editable before save. |
| `governmentCharge` | Number | Required, prefill from template, editable before save. |
| `governmentReferenceId` | String | Optional external reference. |
| `portalId` | Select/card | Required funding source. |
| `paymentMethod` | Enum | Required (card/bankTransfer/cash/other). |
| `notes` | String | Optional internal notes. |

### 3.2 Application Template Integration

1. Application templates are reusable service definitions.
2. Template fields: `applicationName` (unique), default `clientCharge`, default `governmentCharge`, icon reference.
3. Use deterministic template identity (`applicationId`).
4. Naming is `camelCase` across payloads.

### 3.3 Client and Dependent Context

1. Client select is searchable and shows display ID, icon, and live balance.
2. Dependent select is optional and scoped by selected parent client.
3. From client profile context: preselect and lock client.
4. From dependent profile context: preselect and lock both client and dependent.
5. Insufficient client balance does not block save, but must show warning and emit notification event.

### 3.4 Portal and Method Defaults

1. Portal balance is hidden by default and shown only on explicit reveal.
2. System remembers last used method per `(uid + portalId)` and prefills it on next create.

### 3.5 Optional Tracking

1. `addToTracking` toggle (default `false`).
2. `trackingNumberSecondary` optional.
3. `trackingVisibility` enum: `public` (default) or `private`.
4. When enabled, transaction appears in tracking index.

## 4) Save Transaction Workflow (Atomic)

On create, complete these steps in one atomic write flow:

1. Create `dailyTransactions/{docId}` record.
2. Deduct `clientCharge` from client balance.
3. Deduct `governmentCharge` from portal `balance`.
4. If `governmentCharge > 0`, create matching portal transaction in `tenants/{tenantId}/portalTransactions`.
5. Create `/syncEvents` entry with minimal payload (no full snapshots).
6. If client balance becomes negative, create `negativeClientBalance` notification event.

## 5) Live List Requirements

1. Follow the same list interaction pattern used in Clients Onboarding (search, filter, status pill, actions).
2. Filters: client, date range, application, status.
3. Show invoice marker when `invoiced: true`.
4. Realtime updates must reflect create/edit/delete changes without manual refresh.

## 6) Data Schema (dailyTransactions)

| Key | Type | Notes |
| --- | --- | --- |
| `displayTransactionId` | String | Human-readable ID (optional config-based). |
| `transactionDate` | Timestamp/Date | Effective business date. |
| `applicationId` | String | Required. |
| `clientId` | String | Required. |
| `dependentId` | String | Optional. |
| `clientCharge` | Number | Required. |
| `governmentCharge` | Number | Required. |
| `profit` | Number | Computed: `clientCharge - governmentCharge`. |
| `portalId` | String | Required; source portal UID. |
| `paymentMethod` | String | Required enum value. |
| `governmentReferenceId` | String | Optional. |
| `addToTracking` | Boolean | Default `false`. |
| `trackingId` | String | Optional, generated when tracking enabled. |
| `trackingNumberSecondary` | String | Optional. |
| `trackingVisibility` | String | `public` or `private`. |
| `invoiced` | Boolean | Default `false`. |
| `status` | String | `active` or `deleted`. |
| `createdAt` | Timestamp | Server timestamp. |
| `createdBy` | String | UID only. |
| `updatedAt` | Timestamp | Server timestamp. |
| `updatedBy` | String | UID only. |

## 7) Tracking ID Rules

1. Prefix comes from Settings ID rules (`TRK` default).
2. Format: `TRK-YYYYMMDD-####`.
3. Counter resets daily at tenant-local day boundary.
4. Counter storage must be tenant-scoped and deterministic.

## 8) Edit and Lock Rules

### 8.1 Locked After Save

1. `clientId`, `dependentId`
2. `applicationId`
3. `portalId`
4. `clientCharge`, `governmentCharge`, `profit`

### 8.2 Editable After Save

1. `governmentReferenceId`
2. `addToTracking`, `trackingNumberSecondary`, `trackingVisibility`
3. `notes`

### 8.3 Correction Policy

1. Financial mistakes are corrected through soft delete and recreate.
2. Direct edits to financial fields after save are not allowed.

## 9) Delete, Restore, and Recycle Bin

### 9.1 Constraints

1. Block delete if `invoiced: true` with clear error message.
2. `softDeleteTransaction` permission controls soft delete.
3. `hardDeleteTransaction` permission controls permanent delete from recycle bin.

### 9.2 Soft Delete (Atomic Reversal)

1. Set `status: deleted` and update audit fields.
2. Add back `clientCharge` to client balance.
3. Add back `governmentCharge` to portal balance.
4. Keep original portal transaction history; add a reversal portal transaction when needed for clear audit trace.
5. Write `/syncEvents` for delete action.

### 9.3 Restore

1. Set `status: active`.
2. Re-apply client and portal deductions.
3. Write `/syncEvents` for restore action.

## 10) User Control Center Hooks

1. Add function keys in `userControlPreferences.js`:
   - `softDeleteTransaction`
   - `hardDeleteTransaction`
2. Add notification toggle key:
   - `negativeClientBalance` (default ON).

## 11) Compliance Checklist (Must Pass)

1. Use AED only; no `$`/USD labels.
2. Use `DirhamIcon` and `CurrencyValue` for monetary display where applicable.
3. Keep all fields `camelCase`.
4. Store UID only in `createdBy`/`updatedBy`.
5. Every create/update/delete/restore must write one `/syncEvents` record.
6. Portal balance key must be `balance` only (lowercase).
7. Validate tenant scope on every read/write path.

## 12) Milestones

| Milestone | Scope |
| --- | --- |
| `M1` | Settings wiring (tracking prefix + user permissions + notification toggle). |
| `M2` | Create form UI + context-based client/dependent locking + exchange placeholder. |
| `M3` | Atomic create transaction flow (balances + portal transaction + sync event). |
| `M4` | Live List (filters/search/status/actions + invoice marker). |
| `M5` | Edit locks + tracking post-save editable fields. |
| `M6` | Soft delete/restore/recycle bin + permission enforcement + sync events. |
