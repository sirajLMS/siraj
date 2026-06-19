Permission Management — Plan 5: Frontend UI (Single Group)

Route: /permissions/groups/[id]

Section 1: Single Group Container

File: frontend/views/dashboard/permissions/SingleGroupContainer.tsx

Logic: Fetches permissionGroup(id) ensuring users and permissions are loaded.

Layout: Renders Breadcrumbs, Large Title + Description, and Sub-tabs.

Section 2: Sub-Tab Components

Files: components/single-group/

CurrentPermissionsTab.tsx:

Renders MultiSelectDataGrid.

Core Logic Gate: Map over permissions. If a permission is deemed "Core" (based on business logic or isSystem), apply CSS opacity, disable the row checkbox, and swap the Remove action for a Locked icon.

Include BulkActionBar that appears when selectedCount > 0 to trigger bulk removal.

AddPermissionsTab.tsx:

Filters out already assigned permissions.

Checkbox selection allows bulk [ Assign Selected ].

AssignedUsersTab.tsx:

Renders MultiSelectDataGrid of users.

Checkbox selection triggers BulkActionBar -> "Remove Users from Group".

"Assign Users" button opens a standard multi-user selector modal.

Section 3: Final Verification

Navigation: Add /permissions to navigationConfig.ts guarded by AppPermission.PERMISSION_GROUPS_MANAGE.

Tests:

Smoke test: Bulk assigning 10 users to a group.

Smoke test: Attempting to remove a Core permission (UI should physically prevent click).

Smoke test: User Overrides modal correctly calculates "Effective State".

Success Criteria:

[ ] Multi-select arrays correctly exclude disabled/Core rows when "Select All" is clicked.

[ ] bun quality-gate passes.