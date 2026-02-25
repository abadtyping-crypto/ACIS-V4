# Portal Management Overview Plan

## 1) Purpose

Document how portal management surfaces the Loan Management component (see `Loan Management Workflow Plan`) and its adjacent responsibilities. This overview also defines how the mobile UI should split each function so that portals, loans, transfers, and setup actions remain discrete on the smallest screens.

---

## 2) Routing & Mobile Structure

1. Portal Management routes to the `Loan Management` component as a dedicated subpage; the mobile layout should mount everything inside `MobileLayout`.
2. The view splits into four standalone sections that can be toggled or scrolled sequentially in mobile UI:
   - `PortalSummarySection` (portal balances + navigation shortcuts)
   - `LoanManagementSection` (loan person selection/quick add + amount entry + commitment date)
   - `InternalTransferSection` (same as `internal-transfer` plan, separate component)
   - `PortalSetupSection` (adding/editing portal definitions)
3. Each section has its own hooks/state (`usePortalSummary`, `useLoanManagement`, `useInternalTransfer`, `usePortalSetup`) so mobile presentation remains pure and each function stays isolated.

---

## 3) Section Responsibilities

1. `PortalSummarySection`
   - Fetch portal list + balances (tenant context)
   - Display quick action buttons (e.g., “New Loan”, “Transfer”, “Add Portal”)
   - Share selected portal info down to loan/transfer sections via callbacks or context
2. `LoanManagementSection`
   - Handles loan person dropdown/quick add, pending balance banner, portal/method selectors, optional commitment date, save, receive loan flow
   - Reuses mobile-friendly cards/forms with stepper-like transitions (each function toggles visibility via `useLoanManagement` state)
3. `InternalTransferSection`
   - Independent component following `internal-transfer` plan; includes form, validation, and portal balance adjustments for transfers
4. `PortalSetupSection`
   - Contains portal creation/editing UI from `adding-portal` plan, scoped to mobile card layout, no backend logic inside presentational card

---

## 4) Mobile UI Guidelines

1. Use `MobileLayout` shell (scrollable column, safe spacing, no horizontal overflow at 320px).
2. Each section renders inside a `SectionCard` (title, optional help text, primary action). Cards are stacked vertically but can be collapsed/expanded independently.
3. Section content only renders callbacks/props; business logic (data fetch, validation, saves) is handled in separate hooks and service modules.
4. Provide meaningful hierarchy: e.g., `PortalSummarySection` includes a summarized header, `LoanManagementSection` shows current loan person info, `InternalTransferSection` anchors portal picker. Buttons sized >=44px.
5. Enable sectional toggles (e.g., “Show loan details”, “Quick add new person”) so mobile users control flow without scrolling through everything at once.

---

## 5) References & Sub-Plans

- `pages/portal-management/loan-management.md`: dedicated Loan Management workflow.
- `pages/portal-management/internal-transfer.md`: internal transfer component spec.
- `pages/portal-management/adding-portal.md`: portal setup UI and wiring.
