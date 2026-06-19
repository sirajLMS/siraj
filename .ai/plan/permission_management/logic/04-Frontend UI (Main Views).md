Permission Management — Plan 4: Frontend UI (Main Views)

Route: /permissions

Section 1: Task G — Main Container & Routing

File: frontend/views/dashboard/permissions/PermissionManagementContainer.tsx

Logic: Fetch permissionsQuery and permissionGroupsQuery.

Cleanup: Add useEffect(() => () => reset(), []) to prevent memory leaks when navigating away.

Layout: Render the Page Header and Main Tab Navigation.

Section 2: Tab Components

Files: components/tabs/

GroupsTab.tsx:

Renders PaginatedDataGrid.

Uses SystemBadge component.

[ Manage ] button routes to /permissions/groups/[id].

CatalogTab.tsx:

Read-only PaginatedDataGrid with Category filter dropdown.

OverridesTab.tsx:

Renders users with explicit Allow/Deny counts.

Highlight row if hasConflicts === true.

Action triggers the Manage Overrides Modal.

Section 3: Modals

CreateGroupModal.tsx: RHF + Zod validation.

ManageOverridesModal.tsx: (High Complexity)

Split layout: User context (left) vs Settings (right).

Tabbed content: "Effective View" (Read-only checkmarks) vs "Edit View" (Tri-state segmented controls: Inherit | Allow | Deny).

Tracks dirty state before firing updateUserOverrides mutation.

Success Criteria:

[ ] URL syncs with active tab (e.g., ?tab=overrides).

[ ] No hardcoded colors; use dynamic MUI palette values strictly.