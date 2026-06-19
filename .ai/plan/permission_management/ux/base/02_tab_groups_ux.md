UX Specification: Tab - Permission Groups

Layout

Top Bar:

Left: Search input ("Search groups by name or slug...")

Right: Primary Button [ + Create Group ] -> Triggers 08_modal_create_group_ux.md

Content: PaginatedDataGrid

Columns

Name: Group display name.

Type: Renders SystemBadge if isSystem === true, otherwise "Custom".

Users Assigned: Integer count of users in this group.

Permissions Count: Integer count of permissions attached.

Actions (Row-level):

[ Manage ] (Primary link) -> Navigates to /permissions/groups/[id] (Single Group View).

[ Edit ] (Icon) -> Triggers Edit Modal. (Hidden/Disabled for System groups).

[ Delete ] (Icon) -> Triggers Delete Modal. (Hidden/Disabled for System groups).

Interactions

Clicking "Manage" pushes the router to the Single Group View.