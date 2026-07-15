---
name: "08: Fix PermissionsLabels callable and type issues"
overview: "Fix PermissionsLabels used as callable and argument type mismatches"
todos:
  - id: "1"
    content: Fix AddPermissionsTab.tsx - PermissionsLabels used as callable
    status: "pending"
  - id: "2"
    content: Fix ManageOverridesDialog.tsx - PermissionsLabels not callable
    status: "pending"
  - id: "3"
    content: Fix OverridesDataGrid.tsx - PermissionsLabels not callable
    status: "pending"
  - id: "4"
    content: Fix DeleteGroupDialog.tsx - argument type mismatch
    status: "pending"
  - id: "5"
    content: Fix OverridesDialogFooterProps - missing t prop
    status: "pending"
isProject: false
---

# Plan 08: Fix PermissionsLabels Issues

## Files to Modify (5 files)
- `frontend/common/views/dashboard/permissions/components/AddPermissionsTab.tsx`
- `frontend/common/views/dashboard/permissions/components/ManageOverridesDialog.tsx`
- `frontend/common/views/dashboard/permissions/components/OverridesDataGrid.tsx`
- `frontend/common/views/dashboard/permissions/components/DeleteGroupDialog.tsx`

## Key Issues
1. `PermissionsLabels` used as callable function but it's an object type
2. Argument type mismatches for string interpolation
3. Missing `t` prop in component interface
