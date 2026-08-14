# Phase 3: Frontend — Enable Permission Editing for System Groups

## Summary

Removed `isSystem` guards across 8 files (6 primary + 2 follow-up from unused-variable fixes) so that system permission groups can have their permission bundles edited (Add/Revoke permissions) and their Edit button/menu item enabled. System groups still CANNOT be renamed (name/description fields are read-only via `isSystem` flag on the form) or deleted (Delete menu item remains disabled).

## Changes Per File

### 3.1: `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx`
- **Guard removed:** `{!group.isSystem && (<StyledEditButton .../>)}` → `<StyledEditButton .../>` (unwrapped)
- **Effect:** Edit button is now visible for ALL groups including system groups
- **Quality:** sub-loop codescene exit 0

### 3.2: `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared.tsx`
- **Guard removed 1:** `{!group.isSystem && (<Tab value="add" .../>)}` → `<Tab value="add" .../>` (unwrapped) — "Add Permissions" tab now visible for all groups
- **Guard removed 2:** `{activeSubTab === "add" && !group.isSystem && (...)}` → `{activeSubTab === "add" && (...)}` — AddPermissionsTab content now renders for all groups
- **Quality:** sub-loop codescene exit 0

### 3.3: `frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared.tsx`
- **Guard removed:** `{!group.isSystem && (<StyledAssignFirstButtonShared .../>)}` → `<StyledAssignFirstButtonShared .../>` (unwrapped) — "Assign First Permission" button now visible for all groups
- **Follow-up fix:** Since `group` was no longer used in the component after removing the guard, removed it from the destructure. Also removed `group` from `CurrentPermissionsEmptyStateProps` interface in `currentPermissionsTabShared.types.ts` and removed the now-unused `PermissionGroup` import there. Updated both desktop and mobile callers to stop passing `group` to `CurrentPermissionsEmptyState`.
- **Quality:** sub-loop codescene exit 0

### 3.4: `frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop.tsx`
- **Guard removed:** `disabled={group.isSystem ?? false}` on Edit menu item → removed (Edit enabled for all groups)
- **KEPT:** `disabled={group.isSystem ?? false}` on Delete menu item — system groups CANNOT be deleted
- **Quality:** sub-loop codescene exit 0

### 3.5: `frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.mobile.tsx`
- **Guard removed:** `disabled={group.isSystem ?? false}` on Edit menu item → removed (Edit enabled for all groups)
- **KEPT:** `disabled={group.isSystem ?? false}` on Delete menu item — system groups CANNOT be deleted
- **Quality:** sub-loop codescene exit 0

### 3.6: `frontend/mobile/views/dashboard/permissions/components/currentPermissionsTab.mobile.tsx`
- **Guard removed:** `{!group.isSystem && permission.id ? (...)}` → `{permission.id ? (...)}` — Revoke button now visible for all groups including system groups
- **Follow-up fix:** Since `group` was no longer used in the component after removing the guard, removed it from the destructure (kept in `CurrentPermissionsTabProps` since desktop `currentPermissionsTab.desktop.tsx` still uses `group.isSystem`)
- **Quality:** sub-loop codescene exit 0

### 3.7: Pass `isSystem` flag to edit dialog form
- **`frontend/common/views/dashboard/permissions/types/permissionGroupForm.types.ts`:** Added `readonly isSystem: boolean` to `PermissionGroupFormContentProps` interface
- **`frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared.tsx`:**
  - Added `isSystem` to `PermissionGroupFormContentShared` destructure
  - Passes `isSystem={!!group?.isSystem}` from `PermissionGroupFormShared` to `PermissionGroupFormContentShared`
  - Changed `disabled={isLoading}` to `disabled={isLoading || isSystem}` on both the `name` and `description` `LocalizedStringFormField` components — name and description become read-only for system groups while the permission bundle section remains editable
- **Quality:** sub-loop codescene exit 0 for both files

### Follow-up files (not in original task list, modified to fix unused-variable tsgo errors)
- **`frontend/common/views/dashboard/permissions/types/currentPermissionsTabShared.types.ts`:** Removed `group: PermissionGroup` from `CurrentPermissionsEmptyStateProps` and the now-unused `PermissionGroup` import
- **`frontend/desktop/views/dashboard/permissions/components/currentPermissionsTab.desktop.tsx`:** Removed `group={group}` prop from `CurrentPermissionsEmptyState` call
- **Quality:** sub-loop codescene exit 0 for all three follow-up files

## isSystem Guards KEPT (Delete Protection)

| File | Location | Guard |
|------|----------|-------|
| Desktop datagrid | Edit menu — Delete item | `disabled={group.isSystem ?? false}` — KEPT |
| Desktop datagrid | Delete item sx | `group.isSystem ? text.disabled : error.main` — KEPT |
| Mobile card list | Edit menu — Delete item | `disabled={group.isSystem ?? false}` — KEPT |
| Mobile card list | Delete item sx | `group.isSystem ? text.disabled : error.main` — KEPT |

## Verification Results

All 11 modified files passed sub-loop `--lifecycle codescene` (progressive: tsgo → oxlint → biome → lint:type-aware → duplicates → codescene), exit code 0:

| # | File | Result |
|---|------|--------|
| 1 | `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx` | ✅ exit 0 |
| 2 | `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupViewShared.tsx` | ✅ exit 0 |
| 3 | `frontend/common/views/dashboard/permissions/components/__shared__/currentPermissionsTabShared.tsx` | ✅ exit 0 |
| 4 | `frontend/common/views/dashboard/permissions/types/currentPermissionsTabShared.types.ts` | ✅ exit 0 |
| 5 | `frontend/desktop/views/dashboard/permissions/components/permissionGroupsDataGrid.desktop.tsx` | ✅ exit 0 |
| 6 | `frontend/mobile/views/dashboard/permissions/components/permissionGroupCardList.mobile.tsx` | ✅ exit 0 |
| 7 | `frontend/mobile/views/dashboard/permissions/components/currentPermissionsTab.mobile.tsx` | ✅ exit 0 |
| 8 | `frontend/desktop/views/dashboard/permissions/components/currentPermissionsTab.desktop.tsx` | ✅ exit 0 |
| 9 | `frontend/common/views/dashboard/permissions/types/permissionGroupForm.types.ts` | ✅ exit 0 |
| 10 | `frontend/common/views/dashboard/permissions/components/__shared__/permissionGroupFormShared.tsx` | ✅ exit 0 |

## Notes

- No UI tests were run, per instructions.
- The desktop `currentPermissionsTab.desktop.tsx` still has `if (!group.isSystem)` guarding the Revoke column in the data-grid (line 49). This was NOT part of the task scope (Task 3.6 only targets the mobile file). The desktop Revoke guard is a behavior parity item that could be addressed separately.
