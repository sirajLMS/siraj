UX Specification: Reusable Components

This file defines the standard UI components utilized across the Permission Management module. Other views will reference these components.

1. PaginatedDataGrid

A standard data table component used for all list views.

Features:

Pagination Controls: Bottom right. Includes Previous / Next buttons, and current page indicator (e.g., "Page 1 of 10").

Page Size Selector: Dropdown in the bottom left (e.g., "Rows per page: [ 10 | 25 | 50 | 100 ]").

Global Search/Filter: A search bar at the top right of the grid to filter the current dataset.

Column Sorting: Clickable column headers with ASC/DESC icons.

Empty State: Illustrated empty state centered in the grid with a clear message (e.g., "No records found matching your criteria").

2. MultiSelectDataGrid

An extension of the PaginatedDataGrid.

Features:

Selection Column: The first column is strictly for checkboxes.

Header Checkbox: "Select All on Current Page".

Indeterminate State: Header checkbox shows a dash (-) if only some rows are selected.

Disabled Row State (Visual Feedback): If a row cannot be selected (e.g., Core Permissions), the entire row background is slightly dimmed. The checkbox itself is disabled (greyed out), and hovering anywhere over the checkbox or the row actions displays a Tooltip.

3. BulkActionBar

A floating or fixed toolbar that appears at the top of a MultiSelectDataGrid when selectedCount > 0.

Elements:

Text: "{count} items selected"

Action Buttons: (e.g., "Remove Selected", "Add Selected"). Buttons dynamically change color based on action intent (e.g., Red/Danger for removal, Primary for addition).

"Clear Selection" button (Icon or text).

4. SystemBadge

A visual indicator (chip/tag) to denote system-level, core, or conflict items.

Variants:

System Group: Gray/Blue background, indicates group cannot be deleted.

Core Permission: Red/Orange background, locked icon. Tooltip on hover: "Core permission. Cannot be removed."

Override Grant: Green background. "Explicitly Allowed via Override."

Override Deny: Red background. "Explicitly Denied via Override (Blocks Group)."

Inherited: Neutral outline. "Inherited from [Group Name]."