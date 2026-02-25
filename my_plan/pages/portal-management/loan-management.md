# Loan Management Workflow Plan

## 1) Objective

Document the loan origination and management workflow as a dedicated Loan Management component routed within Portal Management so the UI, validations, and backend updates stay aligned with portal balances, transaction creation, and loan person lifecycle.

---

## 2) Scope

1. Loan person identification/onboarding tied to portal flows.
2. Portal balance adjustments for disbursements and receipts.
3. Synchronization: loans transactions, portal transactions, and loan person balances.
4. Maintenance of loan person metadata (edit/delete) with safeguards.

---

## 3) Loan Person Selection + Quick Add

### 3.1 Mode toggle

- Default interface shows:
  1. `Select Existing Loan Person` dropdown/search
  2. `Quick Add Loan Person` toggle (activates inline form)
- Dropdown should support ultra-fast filtering (same as client search) and show loan person ID + name.

### 3.2 Quick Add form requirements

| Field | Validation |
| --- | --- |
| Person Name | Mandatory, uppercase, max 80 characters |
| Primary Mobile | Optional, `+971` pre-filled, 9 digits, no leading `0`, hint `5xxxxxxxx` |
| Identification toggle | Switch between `Emirates ID` and `Passport` |
| Emirates ID | Conditional (active if toggle selects Emirates ID). Numeric, exactly 15 digits, starts with `784`, unique globally (loan persons). |
| Passport Number | Conditional (active if toggle selects Passport). Uppercase alphanumeric, max 10 chars, unique globally. |

### 3.3 Backend behavior after quick add

1. Use existing loan person counter (settings-driven) to generate sequential Loan Person ID.
2. Save loan person document in `loanPersons/{loanPersonId}` (tenant-scoped).
3. Immediately select this loan person for current transaction.
4. Ensure uniqueness checks run before save.

---

## 4) Transaction Validation + Amount Entry

1. Once loan person selected, display outstanding pending loan amount if balance non-zero.
2. Display pending amount clearly (UI banner) but do not block progressing to amount entry.
3. Next stage includes:
   - `Loan Amount` input (current disbursement).
   - `Portal` dropdown (existing portal sub-menu entries).
   - `Transaction Method` (populated once portal chosen; options like `Cash`, `Bank Transfer`, `Cheque`).

---

## 5) Optional Commitment Date

- Provide optional calendar widget labeled `Committed Repayment Date`.
- User may skip selection; absence of date is allowed.

---

## 6) Save Flow (Portal + Loan Updates)

On saving transaction:
1. Debit portal balance by loan amount.
2. Create portal transaction record capturing portal ID, method, amount, and metadata.
3. Create loans transaction record linking loan person, amount, portal context.
4. Update loan person balance (increase outstanding liability). Keep history for pending display.
5. Always write `/syncEvents` for the domain write + portal/loan record writes.

---

## 7) Reverse Flow (Loan Repayment)

- Provide `Receive Loan` action that mirrors disbursement steps:
  1. Select loan person.
  2. Enter incoming amount, portal, and method.
  3. Optional commitment date is repurposed as settlement date.
  4. On save: credit portal balance, create portal transaction, create loans transaction (type `repayment`), update loan person balance (reduce liability), create sync events.

---

## 8) Loan Person Management

1. Edit option allows updating name, mobile, ID type/values.
2. Delete option only enabled when loan person outstanding balance equals zero.
3. Deletion removes loan person document (and dependent records if any) after audit trail entry.

---

## 9) Milestones

| Milestone | Scope |
| --- | --- |
| M1 | Loan person selection UI + quick add toggle |
| M2 | Quick add validations + uniqueness + ID generator |
| M3 | Pending balance display + amount entry + portal/method selectors |
| M4 | Optional commitment date UI |
| M5 | Save flow (portal balance + portal transaction + loans transaction + loan person update + sync events) |
| M6 | Receive loan reverse flow + balances |
| M7 | Loan person edit/delete safeguards |
| M8 | Responsive QA + build verification |

---

## 10) Acceptance Checklist

- [ ] Loan person dropdown search is ultra-fast and shows ID + name.
- [ ] Quick add honors uppercase name + `+971` phone rules.
- [ ] Emirates ID/passport uniqueness enforced globally before create.
- [ ] Loan person counter generates sequential IDs per tenant.
- [ ] Pending balance displays without blocking new transactions.
- [ ] Portal selection drives transaction method availability.
- [ ] Saving updates portal balance, portal transaction, loans transaction, loan person balance, and writes sync events.
- [ ] Receive loan path mirrors the save flow and reverses balance effects.
- [ ] Loan person delete is blocked until balance zero.
- [ ] `/syncEvents` entries exist for every write (loan person, portal, loans transaction).

---

## 11) Notes

- Tie Portal Management UI to existing portal submenu configuration to avoid redundant dropdowns.
- Reuse validation helpers from client onboarding for phone/email/ID normalization.
- Audit/transaction logging should reuse standard fields (`tenantId`, `createdBy`, `entityType`, etc.).
