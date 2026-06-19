UX Specification: Tab - Add Permissions

Context

Displays all system permissions not yet assigned to this group.

Layout

Top Bar:

Filters: Search Input + Category Dropdown.

Top: BulkActionBar (Hidden unless selectedCount > 0).

Action: [ Assign {count} Permissions ] (Primary color button).

Content: MultiSelectDataGrid

Columns

Checkbox: Multi-select toggle.

Permission Key: e.g., billing.view.

Category: e.g., Billing.

Description: Details.

Interactions

Checkbox selection is unrestricted here.

Clicking the bulk assign button triggers a confirmation modal. Upon success, the UI should automatically clear the selection and preferably redirect the user back to the "Current Permissions" tab.