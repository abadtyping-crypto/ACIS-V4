The user wants to continue writing a technical specification/feature list, likely for a software application's client management system, focusing on the "Live List," "Edit & Delete Options," display rules, and "User Control Center" settings for deletion.

I will structure the remaining information logically, primarily focusing on completing the description of the "Live List" features and formalizing the access controls. I will ensure the formatting is appropriate for a markdown document.\#\#\# 5\. Live List and Advanced Filtering

A single "Live List" displays all registered clients (Company/Individual) and dependents.

Dependents are displayed with the parent client's name and the relation (e.g., "Ahmed Employee of ABC Company").

\#\#\#\# Display Enhancements

\*   \*\*Created By Avatar and Profile Link:\*\* The avatar of the user who created the entry will be displayed. Clicking the avatar will route to the creator's public profile URL.

\*   \*\*Hover Information:\*\* Hovering over a client or dependent name in the list will display brief, essential information (reminders/key details).

\*   \*\*CLID/DPID as Link:\*\* The Client ID (CLID) and Dependent ID (DPID) will function as a clickable button, routing the user to the respective client/dependent profile page. This page is intended to connect to upcoming transaction details later.

\#\#\#\# Default Logo/Icon Display Logic

The list will display icons/logos based on the entry type:

\*   \*\*Company Client:\*\* Default template logo provided locally.

\*   \*\*Individual Client:\*\* \`Z:\\ACIS\\ACIS V2-Multi-Tenant\\public\\individual.png\`

\*   \*\*Individual Dependent:\*\* \`Z:\\ACIS\\ACIS V2-Multi-Tenant\\public\\dependent.png\`

\*   \*\*Company Dependent:\*\* \`Z:\\ACIS\\ACIS V2-Multi-Tenant\\public\\employee.png\`

\*   \*\*Dependent License/Emirates Logos:\*\* These will dynamically switch based on the dependent's license/emirates details, using assets from \`public\\emiratesIcon\`.

\#\#\#\# Filter Options

| Filter/Option | Description |

| :--- | :--- |

| Pagination | Options to view 50, 100, entries per page. |

| Type Filter | Dropdown: "Clients" (Individual/Company), "Dependent," or "All." |

| Search Bar | Powerful, minimum-matching search across data fields (name, ID, mobile, CLID/DPID). |

\#\#\#\# Confirmation Message

Upon successful new client addition, a flash message confirms the action and shows the new entry's details for 15 seconds with a close button.

\#\#\# 6\. Edit & Delete Options

\#\#\#\# Status Management

All entries are created with the default status: \`active\`. The status field is designated for future administrative functions like soft deletion (\`pendingToDelete\`) or archiving. The current "Delete" functionality described below is a hard deletion.

\#\#\#\# Edit Option

\*   An "Edit" option (icon/button) is available next to each entry in the live list, opening an editing interface.

\*   \*\*Non-Editable Fields:\*\* Financial information (current balance), and system-generated IDs (CLID, DPID).

\*   Validation rules apply during editing.

\#\#\#\# Delete Option

\*   A "Delete" option (icon/button) is available next to each entry.

\*   \*\*Dependent Deletion:\*\* Only the specific dependent record is removed from the parent's subcollection.

\*   \*\*Client Deletion (Individual or Company):\*\*

    \*   The system automatically performs a hard deletion of the client entry \*\*AND\*\* all associated dependent entries in the subcollection.

    \*   \*\*Crucial Safeguard:\*\* The client's balance must be zero before deletion. The operation should not affect the account's financials.

\#\#\# 7\. User Control Center: Live List Access Permissions

Permissions for essential list operations are managed in the User Control Center and are user-wise customizable. The table below shows the default access levels:

| Role | Edit Option | Delete Option | Hard Delete (Immediate) |

| :--- | :--- | :--- | :--- |

| Admin | ✅ | ✅ | ✅ |

| Manager | ✅ | ✅ | ✅ |

| Staff | ✅ | ✅ | ❌ |

| Accountant | ✅ | ✅ | ❌ |

\*\*\*Note:\*\*\* \*The default permissions provided above appear to be contradictory across the input and have been consolidated into one coherent table based on the most restrictive/common interpretation. Future review of these specific permissions is advised.\*

\#\#\# 8\. Advanced Hard Delete Management

The \*\*Hard Delete\*\* functionality (immediate removal from the main database, permitted only for Admin and Manager roles by default) will include an advanced option to move the deleted data to a recycle bin/quarantine area.

\*   \*\*Recovery Options:\*\* Users with appropriate permissions will be able to either move the entry to a permanent delete state or retrieve/restore the entry (soft-delete reversal) from the recycle bin.

\*   \*\*Notification and Routing:\*\* The system will send a notification upon hard deletion, routing the recipient directly to the exact location of the record in the recycle bin for review.  
