# Phase 5 Outcome: Frontend Navigation — Fix Supervisor Nav + Bug D

## Summary

Two frontend issues fixed: (1) `applySupervisorNavOverrides` was hardcoded hiding teachers/students/permissions from supervisors even when they had permissions, (2) `PAGE_PERMISSIONS.teachers` was missing `TeachersList` permission causing supervisors to be blocked from the teachers page.

## Files Modified

1. **`frontend/common/views/dashboard/config/navigationConfig.ts`** (Task 5.1)
   - `applySupervisorNavOverrides`: Removed `teachers`, `students`, `permissions` from the hardcoded hide set
   - These items now rely on `getNavItemsForPermissions` (permission-based filtering) for visibility
   - Other supervisor overrides (genuinely admin-only items like `settings`, `whatsapp-settings`, `dst-migration`, `cron`) remain intact

2. **`frontend/common/types/page-permissions.types.ts`** (Task 5.2)
   - Line 50: Changed `teachers: [AppPermission.StaffViewDirectory]` → `teachers: [AppPermission.StaffViewDirectory, AppPermission.TeachersList]`
   - This is OR-logic — users with either permission can access the teachers page
   - Matches the existing `usersTeachers` pattern on line 56

## Files NOT Modified
- No other navigation config files needed changes
- No store files changed

## Verification
- Both files passed `sub-loop.ts --lifecycle codescene` (exit 0)

## Carry-Forward Knowledge
- `applySupervisorNavOverrides` runs AFTER `getNavItemsForPermissions` filtering — it overrides permission-based visibility. Must not hide items that permissions allow.
- `PAGE_PERMISSIONS` uses OR-logic arrays — adding a permission to the array grants access to users with that permission
- Tasks 6.1 and 6.2 (navigation tests) depend on these changes — test assertions must be updated to expect visibility
