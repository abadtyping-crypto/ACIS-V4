# Handover Notes

## Scope

This note is for the next agent working on:

- Portal Management
- Applications Icon Library / logo flow
- Notification drafting and notification UI
- ID prefixing
- Client onboarding
- Mobile universal search

Last commit containing this work:

- `12687dc` `feat: update portal and onboarding workflows`

Working tree status at handover:

- clean at the time of this note

## What Was Implemented

### 1. Universal Notification Drafting Layer

Added shared notification drafting helper:

- [src/lib/notificationDrafting.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/notificationDrafting.js)

Purpose:

- Any page/agent can draft notifications with one shared method.
- Supports:
  - standard payload
  - routed notification
  - non-routed notification
  - `quickView` payload
  - auto `View Details` action for quick view

Main helpers:

- `buildQuickViewPayload(...)`
- `buildUniversalNotificationDraft(...)`
- `sendUniversalNotification(...)`

Existing lower-level notification system still used underneath:

- [src/lib/notificationTemplate.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/notificationTemplate.js)
- [src/lib/backendStore.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/backendStore.js)

### 2. Universal Quick View Modal

Added shared modal template:

- [src/components/common/QuickViewModal.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/common/QuickViewModal.jsx)

Purpose:

- Reusable popup details view.
- To be used from notifications or from any page with a `View Details` button.
- Supports:
  - title
  - subtitle
  - badge
  - image
  - description
  - fields
  - sections

### 3. Notifications Page Now Supports Quick View

Updated:

- [src/pages/NotificationsPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/NotificationsPage.jsx)

Behavior:

- If notification action has `actionType: 'quickView'`, modal opens.
- If notification has no route but has `quickView`, clicking card opens modal.
- Route notifications still navigate normally.

### 4. Portal Creation Notification Migrated to Universal Method

Updated:

- [src/components/portal/PortalSetupSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/PortalSetupSection.jsx)

Portal create now:

- sends universal notification
- includes `quickView`
- includes route path

This file is the best current reference for the next agent to copy notification drafting from.

### 5. Portal Setup / Create-Manage Flow

Large changes were made in:

- [src/components/portal/PortalSetupSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/PortalSetupSection.jsx)
- [src/lib/transactionMethodConfig.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/transactionMethodConfig.js)
- [src/pages/PortalDetailPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/PortalDetailPage.jsx)
- [src/pages/DailyTransactionPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/DailyTransactionPage.jsx)

Implemented concepts:

- Portal Logo and Portal Icon are separated in setup flow.
- Custom portal categories can be added.
- Custom transaction methods can be added.
- Category-based default methods restored through shared config helpers.
- Daily transaction and portal detail pages now understand custom portal methods.

Shared config added/expanded in:

- `DEFAULT_PORTAL_CATEGORIES`
- `resolvePortalCategories(...)`
- `resolvePortalCategory(...)`
- `resolvePortalMethodDefinitions(...)`
- `resolvePortalMethodById(...)`
- `resolveCategoryMethodIds(...)`

### 6. Mobile Universal Search Includes Portals

Updated:

- [src/pages/SearchPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/SearchPage.jsx)
- [src/pages/FavoritesPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/FavoritesPage.jsx)

Behavior:

- Search now loads live portal records.
- Search matches:
  - portal name
  - display portal ID
  - portal ID
  - type
  - status
- Clicking a portal result opens:
  - `/t/:tenantId/portal-management/:portalId`
- Portal results can be starred in Favorites.

### 7. Client Onboarding Backend Cleanup

Updated:

- [src/lib/backendStore.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/backendStore.js)
- [src/lib/userControlPreferences.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/userControlPreferences.js)
- [src/pages/ClientsOnboardingPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/ClientsOnboardingPage.jsx)
- [src/components/onboarding/CompanyRegistrationForm.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/onboarding/CompanyRegistrationForm.jsx)
- [src/components/onboarding/IndividualRegistrationForm.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/onboarding/IndividualRegistrationForm.jsx)
- [src/components/onboarding/DependentRegistrationForm.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/onboarding/DependentRegistrationForm.jsx)

Implemented:

- Real client ID generation already supported split mode in backend.
- Added preview helper to match real backend rules:
  - `previewDisplayClientId(...)`
- Company preview now follows company rule.
- Individual preview now follows individual rule.
- Dependent preview now follows dependent rule.

Added permission keys:

- `createClient`
- `notifyCreateClient`

Client onboarding now:

- checks `createClient`
- company and individual send notification using universal drafting helper
- dependent does not send notification

Firestore cleanup:

- UI-only helper fields are no longer written to client documents:
  - `createPortalTransaction`
  - `portalId`
  - `portalMethod`
  - `sendWelcomeEmail`

Portal opening-balance transaction from onboarding remains separate and still posts when selected.

### 8. Loan Quick Add Theme Fix

Updated:

- [src/components/portal/LoanManagementSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/LoanManagementSection.jsx)

Fixed:

- quick-add block no longer uses hardcoded white inputs
- added title/subtitle inside quick-add card
- now respects dark/light theme better

## ID Prefixing Guidance

### Shared Rule Source

All ID rules are read from:

- tenant setting doc `transactionIdRules`

Main formatter helpers:

- [src/lib/idFormat.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/idFormat.js)
- [src/lib/txIdGenerator.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/txIdGenerator.js)
- [src/lib/backendStore.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/backendStore.js)

### Client ID Behavior

Client ID generation is now intended to work like this:

- unified mode:
  - company and individual use `CLID`
- separate mode:
  - company uses `CCID`
  - individual uses `ICID`
- dependent always uses `DPID`

Backend generator:

- `generateDisplayClientId(tenantId, type)`

Preview helper:

- `previewDisplayClientId(tenantId, type)`

### Portal and Transaction IDs

Current generators:

- portals:
  - `generateDisplayPortalId(tenantId)`
  - rule key `PID`
- transactions:
  - `generateDisplayTxId(tenantId, type)`

Known types already in use:

- `POR`
- `TRF`
- `LON`
- `LOAN`
- `DTID`

## Notification Guidance For Next Agent

### Recommended New Standard

For any new page or event:

1. Use `sendUniversalNotification(...)`
2. Include `routePath` if page navigation is needed
3. Include `quickView` if popup details are useful
4. Include `entityType`, `entityId`, `pageKey`, `sectionKey`

### Example Pattern

Best current reference:

- [src/components/portal/PortalSetupSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/PortalSetupSection.jsx)

### Important Remaining Notification Cleanup

Old backend paths still write directly without checking notification permission:

- internal transfer notification
- loan transaction notification

These are still in:

- [src/lib/backendStore.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/backendStore.js)

Next agent should:

- check `notifyInternalTransfer`
- check `notifyLoanManagement`
- check `notifyDirectBalanceAdjust` once direct-balance-adjust exists as real action
- migrate these writes to `sendUniversalNotification(...)`

## Portal Management: Current Reality vs Required Plan

### Important: Portal Management Is Still Not Finished

The user said portal management is still not matching the required plan.

This is correct.

What exists now:

- one main portal page with function switching:
  - [src/pages/PortalManagementPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/PortalManagementPage.jsx)

It currently renders sections inside one page:

- summary
- setup
- loan
- internal transfer
- balance
- recent
- reports

### Required Future Direction

Next agent should treat portal functions as separate pages/routes, not only one local switcher, if following the user’s final direction.

Recommended route split:

- `portal-management/summary`
- `portal-management/setup`
- `portal-management/internal-transfer`
- `portal-management/direct-balance-adjust`
- `portal-management/loan-management`
- `portal-management/recent-activity`
- `portal-management/reports`

### What Must Not Be Broken

Existing portal logic should remain.

Do not remove current working transaction method logic while adding portal improvements.

## Important Broken / Incomplete Items

### 1. Application Icon Library / Logo Upload Flow

The user specifically reported that the icon / logo library flow is now not working correctly.

This is a real handover warning.

Problem summary:

- User wanted a simpler logo flow.
- During refactor, the previous icon-library behavior was partially changed.
- The current implementation in portal setup mixes:
  - Add Logo
  - Choose Icon
  - Add New Icon
  - inline library upload/crop

But the user says the method is still not correct and the previous working behavior was effectively disabled.

Main file to inspect:

- [src/components/portal/PortalSetupSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/PortalSetupSection.jsx)

User expectation for next agent:

- Keep portal logic same.
- Do not bring full icon library directly into the portal page in a messy way.
- Add only a proper `Add Logo` flow:
  - click `Add Logo`
  - studio opens
  - upload option is enough
- Portal icon and transaction method icon flows should remain separate.

### 2. Add Transaction Method vs Add Portal Must Stay Separate

User expectation:

- `Add Portal` is separate
- `Add Transaction Method` is separate
- optional icon support for transaction method can remain
- but agent should not merge these into one confusing flow

Current situation:

- custom category and custom method flow were added inside portal setup
- user is still not satisfied with the UX

Next agent should review:

- [src/components/portal/PortalSetupSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/PortalSetupSection.jsx)

### 3. Existing Transaction Method Edit Option Needs Review

User specifically said:

- existing portal transaction methods need editable support
- this should be separate and should be checked in UI

This has not been completed.

### 4. Portal Icon Library Should Not Be Reintroduced Blindly

User warned:

- next agent should not simply bring icon library directly back into portal flow in the old way

Instead:

- keep existing portal method logic
- add focused logo upload flow
- keep transaction method handling separate

### 5. Direct Balance Adjustment Is Still Not a Real Module

Currently:

- Portal Management only opens portal detail for balance adjustment

It is not yet:

- a dedicated page
- a dedicated action flow
- a dedicated notification path

### 6. Notification Permission Rule Layer Is Not Fully Applied Everywhere

Shared notification template exists.

But old modules still bypass notification permission checks in places.

## User Control / Permissions

### Existing State

User-control system was already working before recent edits.

Files:

- [src/lib/userControlPreferences.js](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/lib/userControlPreferences.js)

New additions made in this work:

- `createClient`
- `notifyCreateClient`

Existing relevant portal permissions already present:

- `createPortal`
- `notifyCreatePortal`
- `directBalanceAdjust`
- `notifyDirectBalanceAdjust`
- `loanManagement`
- `notifyLoanManagement`
- `internalTransfer`
- `notifyInternalTransfer`

### What Was Not Changed

User management was mostly left untouched because it was already working and was not the target of the recent patches.

## Search / Mobile Guidance

The user wants search to remain universal, especially in mobile.

This is now partially implemented for portals:

- portal records appear in search
- clicking result opens portal detail

Files:

- [src/pages/SearchPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/SearchPage.jsx)
- [src/pages/FavoritesPage.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/pages/FavoritesPage.jsx)

Next agent should preserve this and extend it if portal sub-pages become separate routes.

## Lint / Verification Already Run

The following areas were lint-checked during this work:

- portal setup / detail / daily transaction
- notification drafting / quick view / notifications page
- onboarding/backend files
- loan management quick-add fix
- search / favorites

No full production build was run for each step.

## Recommended First Actions For Next Agent

1. Read [src/components/portal/PortalSetupSection.jsx](c:/Users/SAMY-LAP/Desktop/ACIS%20V4/tenant-app/src/components/portal/PortalSetupSection.jsx) before changing anything else.
2. Fix the broken logo / icon library behavior first.
3. Keep `Add Logo`, `Portal Icon`, and `Transaction Method` flows separate.
4. Migrate old portal notifications in backend to `sendUniversalNotification(...)`.
5. If portal management is split into real pages, keep mobile search support for direct portal and sub-page access.
6. Preserve split client ID behavior and client notification rules already implemented.

## Final Warning

Portal Management is not complete and does not fully match the user’s design plan yet.

Do not assume current portal setup UX is approved.

The biggest unresolved area is:

- portal icon / logo / icon library workflow
- transaction method edit flow
- separate portal function pages
