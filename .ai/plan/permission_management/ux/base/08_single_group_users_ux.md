UX Specification: Tab - Assigned Users

Context

Allows the admin to view, assign, and unassign users for this specific group. Moving this from a modal to a tab allows for bulk user management.

Layout

Top Bar:

Left: Search input ("Search by User ID, Name, or Email...")

Right: Primary Button [ + Assign Users ] -> Triggers User Selection Dialog.

Top: BulkActionBar (Hidden unless selectedCount > 0).

Action: [ Remove {count} Users from Group ] (Red button).

Content: MultiSelectDataGrid

Columns

Checkbox: Multi-select toggle.

User Details: Avatar, Name, Email.

Assigned Date: Timestamp when they were added to the group.

Assigned By: Name of the admin who added them (or "System").

Actions:

[ View Overrides ] (Icon link) -> Navigates to Overrides Tab with this user filtered.

[ Remove ] (Icon button) -> Triggers confirmation dialog.

Interactions

Clicking [ Remove ] or using the BulkActionBar triggers a specific confirmation: "Are you sure you want to remove [User] from the [Group Name] group? They will immediately lose access to [X] permissions."