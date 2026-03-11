# Notification System Implementation Draft

This document outlines the architecture and data rules for the new Notification Tab module, adhering strictly to the principle of Minimal Writes and Rich Relational Reads.

## 1. Firestore Data Structure (Minimal Payload)
The Notification documents stored in Firestore should be as lightweight as possible. They will NOT store UI state (like icons, colors, or avatars).

**Sample Notification Document:**
```json
{
  "id": "SETBRA11030001",          // Deterministic sequence: 3-char Main Page + 3-char Sub Page + DDMM + 4-digit Sequence
  "topic": "settings",             // Page/Module identifier (e.g., 'finance', 'users', 'settings')
  "subTopic": "brand",             // Sub-page identifier to help generate the sequence ID
  "type": "approval_required",     // Specific event type
  "title": "Brand Settings Updated", 
  "message": "The tax details and logo have been modified.",
  "createdBy": "UID_12345",        // ONLY store the User ID, not their name or avatar
  "targetRoles": ["admin", "accountant"], // Default roles that should see this
  "targetUsers": ["UID_67890"],    // Specific users added via override
  "excludedUsers": ["UID_11111"],  // Specific users blocked via override (e.g., Accountant was blocked by Tenant)
  "timestamp": 1715610231000,
  "isRead": false,
  "routePath": "/settings/brand",  // The exact root path to redirect to when clicked
  "actions": [                     // Array of dynamic actions to render as buttons
    { 
      "label": "View Details", 
      "actionType": "link", 
      "route": "/settings/brand" 
    },
    { 
      "label": "Confirm", 
      "actionType": "api", 
      "endpoint": "approve_brand_change" 
    }
  ]
}
```

### Deterministic Sequence ID Rule
We strictly avoid random hash UIDs for notifications. The `id` field is generated using the following deterministic format:
`[MAIN_TAB_3_CHARS][SUB_TAB_3_CHARS][DDMM][0000_SEQUENCE]`

**Example for Settings -> Brand Settings updated on March 11th:**
*   Main Tab (Settings) = `SET`
*   Sub Tab (Brand) = `BRA`
*   Date (March 11) = `1103`
*   Sequence (First of the day) = `0001`
*   **Resulting UID: `SETBRA11030001`**

This ensures every notification ID is instantly readable and mathematically trackable.

## 2. Audience Resolution (Role vs. Override Logic)

By default, the backend will target notifications based on **Roles** (e.g., all `accountant` users should see finance notifications). However, the Tenant needs the ultimate power to override these defaults on a per-notification or per-user basis.

When a notification is generated, the backend checks for Tenant overrides before saving the payload.
*   **Default:** `targetRoles` array is populated based on module logic.
*   **Tenant Override (Disable):** If the Tenant decides an accountant should *not* see this, that accountant's UID is added to the `excludedUsers` array.
*   **Tenant Override (Enable):** If the Tenant decides a generic staff member *should* see this, their UID is added to the `targetUsers` array.

**UI Fetching Rule:**
When User "A" visits the Notification Tab, the frontend queries:
`WHERE targetRoles CONTAINS A.role OR targetUsers CONTAINS A.uid AND excludedUsers DOES NOT CONTAIN A.uid`

This architecture allows the Tenant to completely micro-manage who sees what, without having to generate duplicate notification documents for every single user.

## 3. UI Rendering Logic (Rich Reads)

The frontend Notification Component will dynamically resolve these minimal fields into rich UI elements:

### A. Prefix Icons based on `topic`
We will create a central dictionary (Icon Map) mapping `topic` keys to `lucide-react` icons.
*   If `topic` === `"settings"`, render `<SettingsIcon />` + `[Settings]` prefix.
*   If `topic` === `"users"`, render `<UsersIcon />` + `[Users]` prefix.

### B. Avatar Resolution (`createdBy`)
When the list of notifications is fetched, the frontend will collect all unique `createdBy` UIDs.
It will query the local Cache/Context (or Firestore `users` collection) to resolve the `UID` into:
*   `AvatarImageURL`
*   `UserDisplayName`
This ensures that if a user changes their name or picture later, all past notifications instantly reflect the new avatar without needing to update thousands of notification documents.

**Avatar Routing Rule:**
When the Avatar in the Notification UI is clicked, it will automatically Route/Redirect the user to the Public Profile page of that specific user (e.g., `/profile/:uid` or the already implemented public view page). This gives context to who performed the action without cluttering the notification tab.

### C. Dynamic Routing
When a User clicks the main Notification Card, the app will execute:
`navigate(notification.routePath)`
This requires ZERO hardcoded switch statements in the UI for routing.

### D. Customizable Action Buttons
The UI will loop through the `actions` array and render standard styled buttons based on your predefined rules. We will have 4 standard buttons we can pass in from the backend:

1.  **View** (`actionType: "link"`) -> Behaves like an anchor tag, pushing the user to a page to see more details.
2.  **Confirm** (`actionType: "api"`) -> Triggers an approval or state change in the backend.
3.  **Delete** (`actionType: "api"`) -> Performs a **Soft Delete** (flags the item as deleted but keeps it in DB). NEVER a permanent delete from a notification.
4.  **Retrieve** (`actionType: "api"`) -> Restores or retrieves an item that was previously soft-deleted.

```javascript
{notification.actions.map(action => (
  <button 
    onClick={() => handleAction(action)}
    className={getButtonStyles(action.label)} // View is Gray, Confirm is Green, Delete is Red, Retrieve is Blue
  >
    {action.label}
  </button>
))}
```

## 3. Implementation Steps
1.  **Define TypeScript/JSDoc Types** for the Notification Object to ensure all payloads match the schema.
2.  **Create the Icon Mapping Registry** for topics.
3.  **Build the Notification List UI** utilizing the existing User Cache layer for immediate Avatar loading.
4.  **Create Action Handlers** that orchestrate `link` vs `api` execution securely.
5.  **Refactor existing SyncEvents** or create a new trigger to push notifications into this exact schema when changes happen in the system.
