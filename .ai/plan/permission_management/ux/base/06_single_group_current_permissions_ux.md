UX Specification: Tab - Current Permissions

Context

Displays permissions currently attached to the group. Allows removal via single-click or bulk actions.

Layout

Top Bar: Search input ("Search attached permissions...").

Top: BulkActionBar (Hidden unless selectedCount > 0).

Action: [ Remove {count} Permissions ] (Red button).

Content: MultiSelectDataGrid

Columns

Checkbox: Multi-select toggle.

Permission Key: e.g., content.edit.

Category: e.g., Content Management.

Requirement Status: Shows SystemBadge ("Core") if the relation is non-separable.

Actions:

[ Remove ] (Icon button).

Strict Visual & Interaction Rules

Core Permissions (Non-separable):

Visual: Row is lightly dimmed. Checkbox in column 1 is rendered as disabled (greyed out).

Row Action: The [ Remove ] button in column 5 is replaced with a locked icon.

Tooltip: Hovering over the disabled checkbox or lock icon displays: "This is a core permission required by the system for this group. It cannot be removed."

Bulk Selection Logic: If the user clicks "Select All" in the header, Core permissions are filtered out of the selection array and the count ignores them.