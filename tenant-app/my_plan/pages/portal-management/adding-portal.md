# Portal Management Workflow: Adding a New Portal

## Initial Portal Setup

1. **Portal Name Input:** The user is prompted to enter a unique name for the new portal.  
2. **Initial Amount Specification:**  
   * The user inputs the starting amount (balance) for the portal.  
   * **Default Value:** The amount can be `0`.  
3. **Balance Type Toggle:**  
   * If an amount greater than `0` is entered, a toggle appears to select the balance type:  
     * Negative Balance  
     * **Positive Balance (Default)**

## Portal Type and Iconography

1. **Portal Type Selection:** The user selects the portal type from a predefined list. This selection dictates pre-selected transaction methods (see Transaction Methods below).  
   * **Available Types:**  
     * Bank  
     * Card Payment  
     * Petty Cash  
     * Portals  
     * Terminal  
   * *System Path for Type Icons:* `Z:\ACIS\ACIS V2-Multi-Tenant\public\portals`  
2. **Icon Selection/Upload:**  
   * **Default Icons:** Standard icons corresponding to the selected Portal Type are available for selection.  
   * **Optional Image Upload:** If the user prefers a custom look, an optional portal icon image upload feature is available.  
   * **Image Processing Workflow:**  
     * Upon selection, a professional **Zoom & Cropping Tool** appears, allowing the user to adjust the picture layout.  
     * During the upload process, the image size is **auto-reduced** to a minimum size suitable for display.  
     * The final image is uploaded to **Firebucket** (a reference to Firebase Storage).

## Transaction Methods Configuration

1. **Transaction Methods Selection:** The user configures the methods allowed for transactions within this portal.  
   * **Order of Presentation:** Methods must be displayed in the following fixed order:  
     1. `cashByHand`  
     2. `bankTransfer`  
     3. `cdmDeposit`  
     4. `checqueDeposit`  
     5. `onlinePayment`  
     6. `cashWithdrawals`  
     7. `tabby`  
     8. `Tamara`  
   * *System Path for Method Icons:* `Z:\ACIS\ACIS V2-Multi-Tenant\public\portals\methods`  
2. **Smart Pre-selection:** Based on the chosen Portal Type, specific Transaction Methods are pre-selected for user convenience.

| Portal Type | Pre-selected Transaction Methods |
| :---- | :---- |
| Bank | `bankTransfer`, `cdmDeposit`, `checqueDeposit`, `onlinePayment`, `cashWithdrawals` |
| Card Payment | `onlinePayment`, `bankTransfer` |
| Petty Cash | `cashByHand`, `cdmDeposit`, `cashWithdrawals` |
| Portals | `cashByHand`, `bankTransfer`, `onlinePayment` |
| Terminal | `bankTransfer`, `tabby`, `Tamara` |

3. **Customization:** Users have the option to select additional icons for methods and manually type in new transaction methods.

## Submission and Activation

1. **Portal Activation:** Upon successful submission, the new portal is marked as active.  
2. **Initial Transaction Creation:**  
   * If the portal was added with an initial amount (\> 0), an **"Opening Balance"** transaction record will be automatically created.  
   * If the initial amount is `0`, no initial portal transaction is generated.

## Backend Path and ID Safety (Mandatory)

1. **Portal Transaction Collection Path:**  
   * `tenants/{tenantId}/transactions` must not be used for portal-opening and portal-only transaction history for this flow.  
   * Correct path for this workflow is: `tenants/{tenantId}/portalTransactions`  
2. **ID Prefix Rules Enforcement:**  
   * Portal transaction ID generation must follow `transactionIdRules` prefix/padding settings.  
   * `displayTransactionId` and document `UID` must remain aligned and deterministic in this flow (no random fallback IDs).  
3. **Consistency Across All Writes:**  
   * All portal-opening and related portal transaction writes must use the same path and same prefix/UID strategy in every function.

## Transaction Method Icon Source (Firestore)

1. **Method Icons From Firestore:**  
   * While adding/editing portal transaction methods, icon metadata must be collected from Firestore records (not only local static template assets).  
2. **Fallback Behavior:**  
   * If no Firestore icon exists for a method, use configured template fallback icon and keep method selectable.

## Auto-Created Portal Detail Page (New Requirement)

1. **Per-Portal Detail Route:**  
   * On portal creation, a dedicated portal page/route must be available for that portal.  
   * This page must show full portal history and portal-specific customization controls.  
2. **Portal Lifecycle Tracking:**  
   * Portal creation must create both:  
     * Notification record  
     * Sync event record  
3. **Notification Routing Payload:**  
   * Notification must store the exact route/path payload so clicking notification opens that specific portal detail page directly.

## Management of Existing Portals

* **Existing Portal Visibility:** Newly added portals will appear in the list of existing portals.  
* **Accessibility:** Accessible users are allowed to modify the following attributes of existing portals:  
  * Change Portal Icons.  
  * Edit Transaction Methods.  
* **Icon Re-upload Policy:** When a user re-uploads an icon:  
  * The professional Zoom & Cropping Tool process is repeated.  
  * The system must **remove the existing icon** from Firebucket (firestore) before uploading the new version to ensure data hygiene.
