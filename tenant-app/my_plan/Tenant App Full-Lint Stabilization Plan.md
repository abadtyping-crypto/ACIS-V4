## Tenant App Full-Lint Stabilization Plan (Code-First, Behavior-Preserving)

### Summary

Bring `tenant-app` to a clean `npm run lint` state without broad ignores, while preserving current UI/finance behavior.  
Scope is limited to currently failing lint files and required dependency-path updates.

### Locked Decisions

- Lint strategy: **Code-first cleanup** (selected).
- Keep runtime behavior unchanged; refactor only for lint compliance and stability.
- Do not rebuild task module or change finance workflow logic in this pass.

### Current Failing Areas to Fix

1. `public/firebase-messaging-sw.js` (`importScripts`, `firebase` globals).
2. `src/components/portal/RecycleBinSidebar.jsx` (`Date.now` purity rule).
3. `src/context/RecycleBinContext.jsx` (`react-refresh/only-export-components`).
4. `src/context/TenantContext.jsx` (`set-state-in-effect` + `only-export-components`).
5. `src/lib/imageStudioUtils.js` (`reject` unused).
6. `src/pages/ClientDetailsPage.jsx` (`set-state-in-effect`).
7. `src/pages/DashboardPage.jsx` (`set-state-in-effect`).
8. `src/pages/DependentDetailsPage.jsx` (`set-state-in-effect`).
9. `vite.config.js` (`process` undefined under browser-only globals).

---

## Implementation Plan

### 1. ESLint config: add targeted environment overrides

Update `tenant-app/eslint.config.js` with per-file global scopes (no broad disable):

- Service worker globals for `public/firebase-messaging-sw.js`.
- Node globals for `vite.config.js` (and config files only).

Planned config shape:

- Keep current shared rules.
- Add file-specific entries:
  - `files: ['public/firebase-messaging-sw.js']` with `globals: globals.serviceworker`.
  - `files: ['vite.config.js', 'eslint.config.js']` with `globals: globals.node`.

### 2. Split hook exports from context component files (Fast Refresh compliance)

#### 2.1 Tenant context split

- Keep provider in `src/context/TenantContext.jsx` (export only component/provider constants).
- Move hook to new file `src/context/useTenant.js`:
  - Import context object from `TenantContext.jsx`.
  - Export `useTenant()` from the new file.

#### 2.2 RecycleBin context split

- Keep provider in `src/context/RecycleBinContext.jsx`.
- Move hook to new file `src/context/useRecycleBin.js`.

#### 2.3 Import migration

Bulk update imports across `src/**`:

- `useTenant` imports from `../context/TenantContext` / `../../context/TenantContext` -> `../context/useTenant` / `../../context/useTenant`.
- `useRecycleBin` imports from context file -> `useRecycleBin` file.
- Preserve provider imports (`TenantProvider`, `RecycleBinProvider`) from context files.

### 3. Remove set-state-in-effect violations using async loader wrappers

For these pages:

- `src/pages/ClientDetailsPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/DependentDetailsPage.jsx`
- `src/context/TenantContext.jsx` (branding load flow)

Refactor pattern:

- In `useEffect`, do not call setters directly in effect body.
- Use an inner async function invoked via `requestAnimationFrame` (or equivalent callback execution), with cancellation guard.
- Keep same success/error loading behavior and existing UI outputs.

### 4. RecycleBin purity fix (`Date.now` in render path)

In `src/components/portal/RecycleBinSidebar.jsx`:

- Replace direct `Date.now()` in memoized render computation.
- Use a time snapshot state refreshed by a timer effect (e.g., every minute), and compare against that state.
- Maintain current filter semantics (`all`, `24h`, `7d`) exactly.

### 5. Minor lint corrections

- `src/lib/imageStudioUtils.js`: remove unused `reject` from `toBlob` Promise callback and keep same blob output behavior.
- `public/firebase-messaging-sw.js`: align references to service-worker-compatible globals so lint recognizes defined symbols.

---

## Public API / Interface Changes

1. **New hook modules**

- `src/context/useTenant.js` (new)
- `src/context/useRecycleBin.js` (new)

1. **Import path changes required**

- All hook consumers switch to new hook module paths.
- Provider imports remain unchanged.

1. **No backend API changes**

- Existing finance APIs and route behavior remain as implemented.

---

## Test Cases and Validation Scenarios

### A. Lint

1. Run `npm run lint` in `tenant-app`.
2. Expect: zero errors.

### B. Context/Hook integrity

1. App boot should succeed with `TenantProvider` and `RecycleBinProvider`.
2. Pages/components using `useTenant` and `useRecycleBin` should render without runtime hook-context errors.

### C. Behavior parity checks

1. Dashboard, Client Details, Dependent Details still load data and show loading states.
2. Branding name resolution in tenant context still updates UI name from backend branding doc.
3. Recycle bin:

- Domain tabs work.
- Time filters (`all`, `24h`, `7d`) still produce expected filtering.
- Restore/delete actions unchanged.

### D. Config/runtime

1. Vite config lint passes with node globals.
2. Firebase messaging service worker lint passes with service-worker globals.

---

## Assumptions and Defaults

1. No functional redesign is intended; only lint-compliant refactors.
2. Any behavior-affecting edge case discovered during refactor will be handled by preserving existing logic first, then documenting if unavoidable.
3. Hook split is mandatory to satisfy Fast Refresh lint rule without disabling it.
4. This pass does not include unrelated UI redesign or portal workflow changes beyond lint compliance.
