# Clients Onboarding Implementation Plan (V3)

## 1) Objective

Implement a tenant-safe client onboarding system with:

1. Three client types: `company`, `individual`, `dependent`.
2. Strong field-level validation and formatting.
3. ID generation with global defaults and user-level override.
4. Sync-safe writes with optional portal transaction creation.

---

## 2) Client Types and ID Defaults

1. Company default display ID template: `CLID0001`.
2. Individual default display ID template: `CLID0001`.
3. Dependent default display ID template: `DPID0001`.
4. Firestore document ID remains UID/random; display ID is separate (`displayClientId`).
5. Dependent must be linked to an existing parent client (`company` or `individual`).

---

## 3) Live List & Advanced Filtering (Mobile + Desktop)

1. A single `Live List` displays all companies, individuals, and dependents with the following characteristics:
   - Dependents show `Parent Name + Relation` (e.g., “Ahmed Employee of ABC Company”).
   - Each row includes avatar (linked to the creator’s public profile), client/dependent name with hover reminder, clickable Client ID button (routes to profile), and status pill (`active`/future states).
   - Default logos per type:
     - Company = `public/emiratesIcon`
     - Individual = `public/individual.png`
     - Individual dependent = `public/dependent.png`
     - Company dependent = `public/employee.png`
2. Filtering controls:
   - Pagination toggles (50/100 entries).
   - Type dropdown: `Clients` (company + individual), `Dependent`, `All`.
   - Search input (min match) across name, display ID, mobile, CLID/DPID.
   - Status indicator currently `active` but pluggable for future soft delete/archiving.
3. Realtime feedback:
   - After creating a client, show a flash message for 15s with created record details and a close button.
   - Flash uses same fields as list entry for quick confirmation.

---

## 4) Permissions-Based Edit & Delete

1. User Control Center defines access rules (default view shows matrix):
   - **Edit**: Admin ✅❌, Staff ✅, Accountant ✅, Manager ✅
   - **Delete**: Admin ✅❌, Staff ✅, Accountant ✅, Manager ✅
   - **Hard Delete**: Admin ✅, Staff ❌, Accountant ❌, Manager ✅
2. Row actions:
   - `Edit` button opens editing interface; system-generated IDs (CLID/DPID) and financial fields (balances) read-only. Validation applies on save.
   - `Delete` removes entity (hard delete now). Client deletion cascades to dependents; dependent deletion removes only dependent doc.
   - Hard delete action routes to Recycle Bin plan; sending a notification links directly to the bin entry for recovery.
3. Hard delete permissions for staff/accountant currently `❌` but future controls can allow once status migration occurs.

---

## 5) Tracking & Status

1. Every entry starts with `status: active`; reserved for future states like `pendingToDelete` or `archived`.
2. Deletion process ensures balance is zero before removing client (prevents financial impact); dependents may delete independently.
3. Flash message and recycle bin notifications highlight the destination (client profile/recycle bin) and upcoming transaction integrations.

---

## 6) Mobile Search Behavior

1. Search bar inside the Live List displays quick action chips: `Add Company`, `Add Individual`, `Add Dependent`.
   - Tapping a chip opens the corresponding quick-add form inside the mobile layout.
2. Universal search icon sits in the header; tapping it opens a spotlight-style modal/input that filters the live list and, when a client/dependent result is selected, routes directly to their public profile.
3. The universal search experience is reused for future transaction links that should also route through the same client profile pathway.

---

## 3) Prefixing Control Hierarchy

ID generation source priority:

1. User-profile prefix template (if enabled for that user).
2. Tenant/global client prefix template.
3. System fallback defaults (`CLID{####}`, `DPID{####}`).

Rules:

1. User-specific prefix setting is managed inside user profile settings.
2. IDs created by that user must follow user template when configured.
3. If user template missing/disabled, use global template.

---

## 4) Company Onboarding Fields and Validation

### 4.1 Mandatory Fields

1. Trade License Number
   - Mandatory
   - Uppercase while saving
   - Max 15 characters

2. Trade License Registered Emirates
   - Mandatory dropdown options only:
     - `Dubai`
     - `Umm Al Quwain`
     - `Ajman`
     - `Sharjah`
     - `Abu Dhabi`
     - `Fujairah`
     - `Ras Al Khaimah`

3. Trade Name
   - Mandatory
   - Uppercase while saving
   - UI hint: `Trade Name as per License.`

4. Primary Mobile Number
   - Mandatory
   - `+971` pre-filled (editable)
   - Save only 9 digits local part
   - Reject leading `0`
   - Hint: `5xxxxxxxx`

### 4.2 Optional Contact Fields

1. Secondary Number
   - Optional
   - `+971` pre-filled (editable)
   - Save only 9 digits local part
   - Reject leading `0`

2. Landline #1
   - Optional
   - `+971` pre-filled (editable)
   - Save only 9 digits local part
   - Reject leading `0`

3. Landline #2
   - Optional
   - `+971` pre-filled (editable)
   - Save only 9 digits local part
   - Reject leading `0`

4. Primary Email
   - Optional
   - Lowercase while saving
   - Must be valid email if provided

5. Secondary Email
   - Optional
   - Lowercase while saving
   - Must be valid email if provided

### 4.3 Paste and Blur Phone Handling

For any phone/mobile input:

1. Accept pasted values like `+971 58 675 6536`.
2. On blur, auto-trim extra characters/spaces.
3. Normalize to country code + valid 9-digit local number.
4. Validate digit length and leading digit rule.

### 4.4 Address and PO Box

1. Address
   - Optional free text
   - Force proper case while saving

2. PO Box
   - Optional
   - Max 10 digits

3. PO Box Emirates
   - Conditionally mandatory only when PO Box is entered
   - Same dropdown options as Trade License Registered Emirates
   - Hidden/disabled when PO Box is empty

### 4.5 Balance and Portal Transaction Flow

1. Balance
   - Optional
   - Can be positive or negative

2. If balance value is entered:
   - Show mandatory `Balance Type`:
     - `Credit` (client money with us)
     - `Debit` (our money with client)
   - Show mandatory `Create Portal Transaction?` (default `No`)

3. If `Create Portal Transaction? = Yes`:
   - Show mandatory `Transaction Portal` dropdown
   - Values from existing Portal sub-menu options

4. On save when transaction creation is `Yes`:
   - Update client overall balance
   - Create linked portal transaction record
   - Update selected portal tally/balance

### 4.6 Tax Registration Number (TRN)

1. TRN
   - Optional
   - Max 15 digits

2. Conditional field availability:
   - Visible/editable only when global setting `TRN Enabled/Disabled` is `Enabled`

3. If user attempts TRN input while disabled, show:
   - `Please enable the Tax Registration Number (TRN) option in the system settings to enter a TRN here.`

### 4.7 Duplicate Blocking (Company)

Block save when an existing company matches this exact combination:

1. Trade License Number
2. Trade Name
3. Trade License Registered Emirates

---

## 5) Individual Onboarding Fields and Validation

### 5.1 Identification Method

1. `Identification Method`
   - Mandatory dropdown
   - Label: `Select Identification Type`
   - Options: `Emirates ID`, `Passport`
   - Default: `Emirates ID`

2. `Emirates ID` (shown only when `Emirates ID` selected)
   - Mandatory in this mode
   - Numeric only
   - Exactly 15 digits
   - Must start with `784`

3. `Passport` (shown only when `Passport` selected)
   - Mandatory in this mode
   - Uppercase alphanumeric only
   - Max 10 characters

### 5.2 Identity and Contact

1. `Person Name`
   - Mandatory
   - Uppercase while saving
   - Max 80 characters
   - Hint: `Full name`

2. `Primary Mobile Number`
   - Mandatory
   - `+971` pre-filled (editable)
   - Save only 9-digit local part
   - Reject leading `0`
   - Hint: `5xxxxxxxx`

3. `Secondary Number`
   - Optional
   - `+971` pre-filled (editable)
   - Save only 9-digit local part
   - Reject leading `0`
   - Hint: `5xxxxxxxx`

4. Phone paste/blur format handling
   - Accept pasted values like `+971 5x xxx xxxx`
   - On blur, trim extra characters/spaces
   - Normalize and validate to valid UAE format

5. `Person Emirates`
   - Optional dropdown
   - Options:
     - `Dubai`
     - `Umm Al Quwain`
     - `Ajman`
     - `Sharjah`
     - `Abu Dhabi`
     - `Fujairah`
     - `Ras Al Khaimah`

6. `Primary Email`
   - Optional
   - Lowercase while saving
   - Must be valid email if provided

7. `Secondary Email`
   - Optional
   - Lowercase while saving
   - Must be valid email if provided

### 5.3 Address and PO Box

1. `Address`
   - Optional free text
   - Force proper case while saving

2. `PO Box`
   - Optional
   - Max 10 digits

3. `PO Box Emirates`
   - Mandatory only when `PO Box` is entered
   - Same dropdown options as `Person Emirates`
   - Hidden/disabled when `PO Box` is empty

### 5.4 Closing Balance

1. `Closing Balance`
   - Optional
   - Allows negative value

2. Must follow same conditional flow as Company:
   - Mandatory `Balance Type` when balance entered
   - Mandatory `Create Portal Transaction?` when balance entered (default `No`)
   - Mandatory `Transaction Portal` when create transaction is `Yes`
   - Same save actions for balance update + portal transaction + portal tally update

### 5.5 Duplicate Blocking (Individual)

1. If `Identification Method = Emirates ID`:
   - Uniqueness enforced by Emirates ID only
   - Block save when existing Emirates ID matches

2. If `Identification Method = Passport`:
   - Uniqueness enforced by `(Passport + Person Name)` combination
   - Block save when both fields match existing record

---

## 6) Dependent Registration Fields and Validation

### 6.1 Parent Client Selection

1. `Parent Client ID`
   - Mandatory dropdown
   - Ultra-fast searchable list
   - Must select an existing parent client
   - Parent can be `company` or `individual`
2. On parent selection:
   - System reads parent client type
   - Relation behavior and conditional fields are derived from parent type

### 6.2 Identification Method and Identity

1. `Identification Method`
   - Same rules/options as Individual registration
   - Options: `Emirates ID`, `Passport`
   - Default: `Emirates ID`

2. `Emirates ID` (when selected)
   - Mandatory in this mode
   - Numeric only
   - Exactly 15 digits
   - Must start with `784`

3. `Passport` (when selected)
   - Mandatory in this mode
   - Uppercase alphanumeric only
   - Max 10 characters

4. `Person Name`
   - Mandatory
   - Uppercase while saving
   - Max 80 characters

### 6.3 Parent-Type Conditional Fields

If selected parent type is `company`, also show:

1. `Work Permit Number`
   - Optional
   - Numeric only
   - Max 10 digits
2. `Person Code`
   - Optional
   - Numeric only
   - Max 14 digits
   - Hint: `This code is issued by MOHRE and can be found on the employee list.`

### 6.4 Contact and Relation

1. `Mobile Number`
   - Optional
   - `+971` pre-filled (editable)
   - Save only 9-digit local part
   - Reject leading `0`
   - Hint: `5xxxxxxxx`

2. `Email`
   - Optional
   - Lowercase while saving
   - Must be valid email if provided

3. `Relation` (conditional)
   - If parent is `company`:
     - Default `Employee`
     - Non-editable
   - If parent is `individual`:
     - Dropdown options:
       - `Wife` (default)
       - `Husband`
       - `Son`
       - `Daughter`
       - `Father`
       - `Mother`
       - `Domestic Worker`

### 6.5 Duplicate Blocking (Dependent)

Use same duplicate logic as Individual:

1. Emirates ID mode: block on Emirates ID match.
2. Passport mode: block on `Passport + Person Name` match.

### 6.6 On Submit Action

1. Create dependent under selected parent client's dependents subcollection.
2. Suggested path: `tenants/{tenantId}/clients/{parentClientId}/dependents/{dependentId}`.
3. Store `parentClientId`, `parentClientType`, and generated dependent display ID.
4. Maintain sync event write as per mandatory sync rules.
5. `dependentId` must be deterministic from generated Dependent ID (e.g., `DPID0001`) and must not use random UID/auto ID.

---

## 7) Confirmation Popup and Client ID Display

After successful save (company, individual, or dependent):

1. Show popup flash with saved details and generated Client ID (`CLIDxxxx` or `DPIDxxxx`).

Popup rules:

1. Visibility controlled by user profile toggle (example: `Show Save Confirmation`).
2. Content must include:
   - Generated `displayClientId`
   - All fields saved in that operation
3. Duration is user-configurable in profile preferences:
   - Example `3s`, `5s`, or `Until Manually Closed`

---

## 8) Data and Write Rules

1. All writes tenant-scoped under `tenants/{tenantId}`.
2. `createdBy` and `updatedBy` must store `uid` only.
3. Unknown payload keys rejected.
4. Every create/update/delete also writes one `/syncEvents` entry with mandatory fields.
5. Client write is complete only when domain write + related counter/transaction updates + sync event succeed.

---

## 9) UI Component Split (Function-Wise)

1. `ClientTypeSelectorSection`
2. `CompanyIdentitySection`
3. `CompanyContactSection`
4. `CompanyAddressAndPoBoxSection`
5. `CompanyBalanceSection`
6. `TrnSection`
7. `IndividualIdentificationSection`
8. `IndividualContactSection`
9. `IndividualAddressAndPoBoxSection`
10. `IndividualBalanceSection`
11. `DependentParentSelectorSection`
12. `DependentIdentitySection`
13. `DependentCompanyExtrasSection`
14. `DependentRelationSection`
15. `ClientIdPreviewSection`
16. `ClientReviewSubmitSection`
17. `ClientSaveConfirmationPopup`
18. `ClientsOnboardingPage` (container)

Rule:

1. Presentational components do not write data directly.
2. Business logic remains in page container/hooks/services.

---

## 10) Milestones

| Milestone | Scope |
| --- | --- |
| M1 | Finalize schema and client type rules |
| M2 | Implement global + user-level prefix template controls |
| M3 | Build display ID generator with fallback hierarchy |
| M4 | Implement company form sections and field normalizers |
| M5 | Implement balance-type and portal transaction conditional flow |
| M6 | Implement TRN conditional availability by global setting |
| M7 | Add duplicate blocking logic (license + name + emirate) |
| M8 | Implement Individual onboarding validation and duplicate rules |
| M9 | Implement dependent registration (parent search + relation + conditional fields) |
| M10 | Implement dependent subcollection write path and validations |
| M11 | Add profile-controlled confirmation popup with timing options |
| M12 | Sync events integration + create/update/delete coverage |
| M13 | Responsive QA (320px/mobile + desktop) + build verification |

---

## 11) Acceptance Checklist

- [ ] Company/Individual default IDs use `CLID` template; Dependent uses `DPID` template.
- [ ] User-profile prefix override works and falls back to global default.
- [ ] Company mandatory fields and uppercase transforms enforced.
- [ ] Emirates dropdown restricted to defined list.
- [ ] All `+971` contact fields normalize and validate 9-digit local numbers (no leading `0`).
- [ ] PO Box Emirates appears and becomes mandatory only when PO Box has value.
- [ ] Balance conditional fields behave exactly as defined.
- [ ] Portal transaction is created and portal tally updated when selected.
- [ ] TRN field respects global enable/disable and message behavior.
- [ ] Duplicate blocking on license+name+emirate works.
- [ ] Individual ID method switch (`Emirates ID`/`Passport`) conditionally enforces correct validation.
- [ ] Individual duplicate blocking works by `Emirates ID` or `Passport+Person Name` based on selected method.
- [ ] Dependent parent selection supports `company` and `individual` with ultra-fast search.
- [ ] Company-parent dependent flow enforces default non-editable `Employee` relation.
- [ ] Individual-parent dependent flow enforces relation dropdown with defined options.
- [ ] Company-parent dependent flow shows `Work Permit Number` and `Person Code` with max digit rules.
- [ ] Dependent records are saved under parent dependents subcollection path.
- [ ] Save confirmation popup follows user toggle + duration preferences.
- [ ] `/syncEvents` write occurs for each data-changing action.
