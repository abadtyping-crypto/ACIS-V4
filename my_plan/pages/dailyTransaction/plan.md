# Daily Transaction Module Implementation Plan

## 1) Objective

Implement a professional, robust "Daily Transaction" module to record service sales, calculate profit, and manage client/portal balances in a service-based business model (no inventory).

---

## 2) User Interface: Sidebar & Access

- **Primary Access**: Selecting "Daily Transaction" from the main sidebar opens the transaction logging workspace.
- **Default Action**: The page defaults to showing a **Live List** of recent transactions, with a prominent **Add New Transaction** toggle/button to open the logging form.
- **Exchange Feature**: A dedicated **Exchange Button** must be present on the page (UI placeholder for future currency/payment exchange logic).

---

## 3) Form Fields & Business Logic

### 3.1 Core Transaction Data

| Field | Type | Rules |
| :--- | :--- | :--- |
| **Date** | Date | Mandatory. Defaults to today. Editable for back-dated entries. |
| **Application** | Searchable Selection | Mandatory. Selected from reusable service templates. |
| **Gov. Charge** | Currency | Mandatory. Pre-filled from template; manually editable. |
| **Client Charge** | Currency | Mandatory. Pre-filled from template; manually editable. |
| **Transaction ID** | Text | Optional. Government-issued reference number. |

### 3.2 Application Templates (Service Catalog)

A dedicated "Add New Option" in the Application dropdown allows creating reusable templates:

- **Application Name**: Mandatory & Unique.
- **Fees**: Default `govCharge` and `clientCharge`.
- **Iconography**:
  - Selector for built-in library icons.
  - Recent icon highlight.
  - Custom icon upload support.
  - Fallback: Default document icon (`📄`).
- **Identification**: `applicationId` is derived from the canonical Name (Sluggish/UID).

### 3.3 Client & Dependent Integration

- **Client Selection**: Searchable dropdown showing **Client ID**, **Profile Picture**, and **Live Balance**.
- **Dependent Selection**: Optional. Filters based on the selected Client.
- **Pre-Selection & Locking (Profile Context)**:
  - If transaction is opened from a **Client Profile**: The client is pre-selected and the field is hidden or locked (read-only).
  - If transaction is opened from a **Dependent Page**: Both the **Parent Client** and the **Dependent** are pre-selected and locked.
- **Financial Safety (Insufficient Funds)**:
  - System **must allow** transactions even if client balance is insufficient.
  - **Warning UI**: "Insufficient Client Balance" alert shown immediately.
  - **Audit Log**: Mandatory system record created for any transaction involving negative balances.

### 3.4 Payment Portal Logic

- **Portal Selection**: Visual cards/radio buttons with portal-specific icons.
- **Balance Privacy**: Portal balance is **hidden by default**. Viewable only upon user click.
- **Transaction Method**:
  - Selection (e.g., Card, Bank Transfer, Cash).
  - **Smart Defaults**: The system remembers and auto-selects the "Last Used Method" or "Default Method" per portal for that specific user.

### 3.5 Optional Tracking Workflow

If a **Transaction ID** is provided, the user can enable tracking:

- **Add to Tracking?**: Toggle (Default: No).
- **Secondary Tracking Number**: Optional additional reference field.
- **Visibility**: Choice between "Visible to All" (Default) or "Private (Only Me)".
- **Action**: Transactions marked for tracking are automatically indexed on the dedicated "Tracking Page".

---

## 4) Backend Operations & Financial Integrity

### 4.1 Post-Save Workflow

Upon saving, the system must perform the following atomic operations:

1. **Deduct** `clientCharge` from the selected Client’s balance.
2. **Deduct** `governmentCharge` from the selected Portal’s balance.
3. **Portal Record**: Create a new Portal Transaction entry.
   - **Exclusion**: If `governmentCharge` is `0`, **no** Portal Transaction record is created.
4. **Sync Event Tracking**: Create a mandatory **Sync Event** (following the pattern in Client Onboarding) to ensure the transaction is synchronized across all platforms.

### 4.2 Live List (Data Display)

- **Consistency**: The Daily Transaction page must feature a **Live List** using the exact same design, styling, and layout as the **Clients Onboarding** page.
- **Elements**: Row-based entries showing transaction details, client icons, status pills, and action buttons.
- **Search & Filter**: Real-time filtering by client, date, or application type, consistent with the onboarding list behavior.
- **Invoice Indicator**: Transactions with `invoiced: true` must display a small **Invoice Icon** (e.g., `receipt-check`) in the list.

### 4.3 Record Schema: `dailyTransactions`

| Key | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Prefixed ID (e.g., `DTX0001`). |
| `applicationId` | String | UID of the service template. |
| `clientId` | String | UID of the client. |
| `dependentId` | String | UID of the dependent (optional). |
| `clientCharge` | Number | Total fee charged to client. |
| `governmentCharge`| Number | Cost paid to government. |
| `profit` | Number | Computed: `clientCharge - governmentCharge`. |
| `paidPortalId` | String | UID of the funding source. |
| `invoiced` | Boolean | Default: `false`. |
| `status` | String | Default: `active`. |
| `createdAt` | Timestamp | Server-side creation time. |
| `createdBy` | String | UID of the operator. |

### 4.4 Tracking ID Generation

Tracking IDs follow a daily sequential counter:

- **Prefix**: Uses the customizable `TRK` prefix managed in the **ID Rules & Counters** section of the Settings page.
- **Format**: `TRK-YYYYMMDD-####` (e.g., `TRK-20260307-0001`).
- **Reset**: The counter resets to `0001` daily at 00:00 (managed via tenant counters).
- **Default**: The initial default prefix will be `TRK`.

---

## 5) Milestone & Implementation Steps

| Phase | Task |
| :--- | :--- |
| **M1** | Update **Settings > ID Rules** (`TRK` prefix) & **User Control Center** (Permissions/Notifications) & Application Templates. |
| **M2** | Build the Daily Transaction form UI and **Exchange Button** placeholder. |
| **M3** | Implement Client/Portal balance fetch & hidden visibility. |
| **M4** | Develop Backend Atomic Transaction (Balance Updates + History + **Sync Events**). |
| **M5** | Implement **Live List** (Client Onboarding style) and search/filter logic. |
| **M6** | Build Tracking ID generator & Visibility controls. |
| **M7** | Implement Contextual Access (Locking Client on Profile Pages). |

---

## 6) Contextual Business Rules

- **Auto-Selection**: When launched from a Client Profile or Dependent Page, the form automatically consumes the ID from the URL/Context and skips the manual selection step.
- **Immediate Reflection**: Every transaction must immediately update the **Statement of Account** section *inside* the Client's Profile page. No manual refresh should be required.
- **Financial History**: Transactions must immediately reflect in the cumulative balances shown on the Client profile header.

---

## 7) Transaction Deletion & Safety Rules

### 7.1 Deletion Constraints

- **Invoiced Transactions**: System prevents the deletion of any transaction where `invoiced: true`.
  - **Alert**: "Deletion Failed. An invoice has been created for this transaction, and it cannot be deleted."
- **Permission-Based Access**:
  - **Soft Delete**: Move to Recycle Bin. (Allowed for Admin/Staff by default).
  - **Hard Delete**: Permanent removal from Recycle Bin. (**Disabled for Staff**; Admin/Accountant only).
- **Pending Transactions**: Deletion is allowed (Soft Delete method).

### 7.2 Deletion & Reversal Logic

When a transaction is deleted (Soft Delete):

1. **Status Update**: The record is marked as `status: "deleted"`.
2. **Client Statement (Silent Removal)**:
    - The transaction is immediately hidden from the Client Statement.
    - The `clientCharge` is added back to the Client's balance.
    - From the client's perspective, the record is removed without trace.
3. **Portal Management (Audit Reversal)**:
    - To maintain perfect compliance, the original portal record is **not** deleted.
    - A **new Reversal Transaction** is created in the Portal to refund the `governmentCharge`. This ensures the portal statement matches the real-world balance.

### 7.3 Recycle Bin & Notifications

1. **Recycle Bin**: Deleted transactions are moved to a system-wide recycle bin.
2. **System Notification**: Triggered immediately after deletion with two options:
    - **Confirm**: Finalizes the deletion (internal cleanup - requires **Hard Delete** permission).
    - **Retrieve**: Restores the transaction by flipping `status` to "active" and re-deducting balances.

---

## 8) User Control Center Configuration

### 8.1 Function Access (Action Keys)

The following keys must be added to `userControlPreferences.js` and manageable via the User Control Center:

- `softDeleteTransaction`: Toggle for moving records to Recycle Bin.
- `hardDeleteTransaction`: Toggle for permanent removal (Default: OFF for Staff).

### 8.2 Notification Rules (Event Toggles)

New event trigger for user-wise notification rules:

- `negativeClientBalance`: Mandatory notification triggered whenever a transaction results in a client balance falling below zero. (Default: ON for All).

---

## 9) Global Standards & Compliance (Strict)

### 9.1 Currency & Monetary Display

- **Strict Rule**: No dollar symbols (`$`) or USD labels allowed.
- **Component Standard**: All monetary displays MUST use the shared `DirhamIcon` and `CurrencyValue` components from `src/components/common/`.
- **Text Labels**: Where icons are unsupported, use the plain text `AED` label.

### 9.2 Data Naming & Metadata

- **Naming**: All Firestore field names must be `camelCase` (e.g., `clientCharge`, `paidPortalId`).
- **Audit Fields**: Every record must include `createdAt`, `createdBy`, `updatedAt`, and `updatedBy`.
- **Identity**: `createdBy` and `updatedBy` must store the **UID string only** (no names or emails).
- **Sync Events**: Every data-changing operation MUST trigger a `/syncEvents` write as per Rule #17 in `PROJECT_RULES.md`.

---

## 10) Post-Save Data Management

### 10.1 Financial Lock (Strict)

To ensure balance integrity in a client-side Firestore environment, the following fields are **locked** permanently after the transaction is saved:

- **Application Type**
- **Client / Dependent Identity**
- **Funding Portal**
- **Amounts** (`clientCharge`, `governmentCharge`, `profit`)

### 10.2 Editable Informational Fields

Users may update the following non-financial fields at any time:

- **Transaction ID**: For adding government reference numbers received later.
- **Add to Tracking?**: Users can opt-in to tracking after the transaction has been created.
- **Tracking Meta**: Secondary tracking numbers and visibility (Public/Private) can be adjusted post-save.
- **Notes/Comments**: Internal descriptors.

### 10.3 Correction Workflow

If a financial error is made (wrong amount/wrong client):

1. Use the **Soft Delete** button (Section 7).
2. The system handles the balance reversal automatically.
3. User creates a new, correct transaction.
