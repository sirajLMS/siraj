UX Specification: Manage User Overrides Modal

Context

This is a highly complex modal used to resolve the "Effective Permissions" matrix for a single user. It allows an admin to explicitly allow (Grant) or explicitly block (Deny) a permission, regardless of the user's group assignments.

Trigger

[ + Add Override ] or [ Manage Overrides ] in the User Overrides Tab.

Layout: Full-Screen or Large Modal

Header:

Title: "Manage Access Overrides"

Subtitle: "Configuring explicit rules for {User Name} ({User Email})"

Left Sidebar (User Context):

User Avatar & Info.

List of "Current Groups" (Read-only tags).

Main Content Area (Tabbed or Segmented):

Toggle: [ View Effective Permissions (Read-Only) ] | [ Edit Explicit Overrides ]

Mode 1: View Effective Permissions

A read-only PaginatedDataGrid showing the net result of all groups and overrides.

Columns:

Permission: e.g., users.create

Effective State: Green Check (Allowed) or Red X (Denied).

Source: How did they get this?

Renders SystemBadge variant: "Inherited from [Group]", "Explicit Grant", or "Explicit Deny".

Mode 2: Edit Explicit Overrides

A list of all system permissions grouped by Category (similar to a complex accordion or table).

Columns:

Permission: Name and description.

Group Baseline: What do their current groups say? (e.g., "Allowed via 'Admin'" or "Not Set").

Override Control (Tri-state segmented control or Dropdown):

[ Inherit (Default) ] - Clears any overrides.

[ Explicit Allow ] - Grants permission even if groups don't.

[ Explicit Deny ] - Blocks permission even if groups grant it.

Interaction & Save

Changing a value from "Inherit" to "Deny" immediately highlights the row to indicate an unsaved pending change.

Footer: [ Cancel ] [ Save Overrides ]