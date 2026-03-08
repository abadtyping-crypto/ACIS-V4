   
Detailed Specification: Daily Transaction Module

This document outlines the requirements and functional specifications for the "Daily Transaction" module, which serves as the core sales and profit recording system for a service-based company specializing in government transaction handling. The company operates without any product inventory, focusing purely on service provision.-----1. Module Overview

The Daily Transaction page is the primary interface for logging all service activities performed on behalf of clients. Each entry represents a single service sale, capturing all financial and logistical details necessary for accurate reporting, profit calculation, and client/portal balance management.2. User Interface: Sidebar AccessDaily Transaction

* **Default Action:** Selecting "Daily Transaction" from the main sidebar navigation will immediately open the transaction logging form, prioritizing the action of *adding a new transaction*.

\-----3. Adding Transaction Details: Form Fields and Logic

The transaction form must capture the following details, with integrated validation and intelligent default settings:3.1 Core Transaction Information

| Field | Requirement | Description & Business Logic |
| ----- | ----- | ----- |
| **Date** (\*) | **Mandatory. Default to Today's Date.** | Should be editable to allow back-dated entries. |
| **Application** (\*) | **Mandatory. Dropdown with Search/Filter.** | Lists all available **Government Transactions**. Includes an **"+ Add New Option"** to create a reusable application template. |
| **Government Charge** (\*) | **Mandatory. Pre-filled, but Editable.** | The standard fee charged by the government for the selected service. Allows for modification if an existing value is shown. |
| **Client Charge** (\*) | **Mandatory. Pre-filled, but Editable.** | The total fee charged to the client (includes the Gov Charge and the company's profit margin). Allows modification if an existing value is shown. |
| **Transaction Id** | **Optional. Alphanumeric input.** | Government-issued transaction ID for future tracking and reference. |

3.2 Application Management (Reusable Templates)

The "Add New Option" for the Application dropdown facilitates the creation of a reusable service template. These templates will be stored and accessible across other relevant pages.

* **Template Data Structure:**  
  * `name`: (string) **Mandatory.** The unique name of the service/application.  
  * `description`: (string) **Optional.** The unique name of the service/application.  
  * `govCharge`: (number) **Optional.** The default government fee.  
  * `clientCharge`: (number) **Optional.** The default total client fee.  
  * `icon`: (string) **Optional.**  
    * An icon selection tool must be provided, drawing from a central icon library.  
    * Recently used icons should be highlighted for quick access.  
    * An option to upload a new custom icon is required.  
    * If no icon is chosen, the default `📄` icon must be applied to the template.  
  * `status`: (string) Handled by **Backend Firestore** (e.g., 'Active').  
  * **Application UID:** The unique identifier for the application must be derived directly from the application's `name` (e.g., a slug or canonical name).

3.3 Client & Dependent Information

| Field | Requirement | Description & Business Logic |
| ----- | ----- | ----- |
| **Client** (\*) | **Mandatory.** Dropdown with **Search/Filter**. | Displays a list of all clients, including their **Client ID** and **Display Picture (DP)**. The client's **Current Balance** must be prominently displayed next to their name in the selector. |
| **Dependent** | **Optional.** Dropdown with **Search/Filter**. | If selected, the transaction is logged against the *Dependent* but still financially linked to the *Client*. If skipped, the transaction is logged directly under the *Client's* application record. |
| **Client Charge Logic** | **Critical Business Rule.** | The system *must* allow a transaction to be performed even if the resulting client balance goes **negative**. A **warning notification** must be immediately displayed to the user ("Insufficient Client Balance"). A mandatory **notification record** must also be created in the system logs detailing the transaction performed on insufficient funds (Safety Tool/Audit Log). |

3.4 Payment Portal Details

The transaction must be linked to a funding source:

| Field | Requirement | Description & Business Logic |
| ----- | ----- | ----- |
| **Paid Portal** (\*) | **Mandatory.** Selection option (e.g., radio buttons, cards). | Displays existing payment portals, each with its **allocated icon**. Once a portal is selected, its **Current Balance** appears in a dedicated area, which is **hidden by default**. The balance is made visible only upon clicking the dedicated area (privacy/data sensitivity). |
| **Portal Transaction Method** (\*) | **Mandatory.** Selection option (e.g., dropdown). | Portals hold multiple transaction methods (e.g., Debit Card, Bank Transfer), each with an **allocated icon**. The system allows the user to set one method as the **default** for the selected portal on the transaction page. This default will automatically populate on subsequent uses of the same portal, though the user retains the ability to choose an alternate method. |

3.5 Tracking Integration (Optional)

If a **Transaction Id** is provided, the following optional tracking feature must be presented:

| Feature | Requirement | Description & Business Logic |
| ----- | ----- | ----- |
| **Add to Tracking?** | **Conditional Option.** Default to **"No"**. | If the user clicks **"Yes"**, a new optional field appears: |
| **Tracking Number** | **Optional.** Number/String input. | Allows the entry of an additional tracking number, as some applications require more than just the government Transaction ID for proper follow-up. |
| **Tracking Visibility** | **Mandatory Selection.** | Allows the user to set the visibility of the new tracking record: **"Visible to All Users"** (default) or **"Only Me"** (private tracking). The transaction will then be automatically moved to the dedicated *Tracking Page*. |

\-----4. Backend Logic & Financial Transactions

Upon successful saving of the daily transaction, the backend must execute the following critical financial and record-keeping operations:

1. **Client Balance Update:** The `clientCharge` amount must be **deducted** from the selected Client's current balance.  
2. **Portal Balance Update:** The `governmentCharge` amount must be **deducted** from the selected Portal's current balance.  
3. **Portal Transaction Creation:** A new record for the portal usage must be created.  
   * **Crucial Condition:** **If `governmentCharge` is 0 (a free-of-cost transaction), a Portal Transaction record MUST NOT be created.** This prevents unnecessary record clutter (avoiding "silly errors").

4.1 Daily Transaction Record Schema

The primary transaction document will be stored in Firestore under the document name `dailyTransactions`. The UID must follow the prefix method defined in the **In App Setting Page**.

| Field | Type | Requirement | Description |
| ----- | ----- | ----- | ----- |
| `invoiced` | boolean | **Backend Record. Default: false.** | Used by other pages/modules to check if the transaction has been included in an invoice. |
| `applicationId` | UID (string) | **Mandatory.** | UID of the service template used. |
| `clientCharge` | number | **Mandatory.** | The total amount charged to the client. |
| `clientId` | number | **Mandatory.** | The ID of the client. |
| `createdAt` | timestamp | **Mandatory.** | Timestamp of record creation. |
| `createdBy` | UID (string) | **Mandatory.** | UID of the user who logged the transaction. |
| `dependentId` | string | **Optional.** | UID of the dependent, if applicable. |
| `governmentCharge` | number | **Mandatory.** | The government fee component. |
| `paidPortalId` | string | **Mandatory.** | UID of the portal used for payment. |
| `portalTransactionMethod` | string | **Mandatory.** | The method used for the portal transaction. |
| `profit` | number | **Calculated.** | `profit` \= `clientCharge` \- `governmentCharge`. |
| `status` | string | Default: "Active". | Current status of the transaction record. |

4.2 Tracking ID Generation

If tracking is enabled, a unique, sequential tracking ID must be generated following a strict format. This format should be presented as the default in the template:

| Component | Format | Description |
| ----- | ----- | ----- |
| **Prefix** | `TRK` | **Must be added** to the global `/t/:tenantId/settings/prefixes` configuration. |
| **Date** | `YYYYMMDD` | Current date (e.g., `20260307`). |
| **Counter** | `0001` (4 digits) | Sequential counter, reset daily. |

**Counter Management:** This daily sequential counter must be stored and managed in the `/t/:tenantId/settings/counters` document/collection and must be reliably **incremented** with every new *Daily Transaction* created within that tenant.-----5. Module Integration and Contextual Access

The functionality to add a Daily Transaction must be integrated into other parts of the system to improve workflow, requiring contextual adjustments to the form:

* **Client Page Integration:** The "Add Daily Transaction" option must be available within the Client details page. When accessed from here, the **"Client" selection option MUST BE HIDDEN**, as the client is already implied by the context.  
* **Dependent Page Integration:** The "Add Daily Transaction" option must also be available within the Dependent details page. When accessed from here, the system must allow the user to log the transaction under the dependent, automatically linking it to the dependent's associated client.  
* **Reflection:** All transactions logged from any of these entry points must be accurately reflected and visible within the main **Client Pages** financial history and transaction lists.

