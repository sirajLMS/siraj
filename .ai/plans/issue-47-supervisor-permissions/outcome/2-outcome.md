# Phase 2 Outcome: Backend — System Group Permission Bundle Editing

## Summary

Backend `updateGroup` flow modified to allow permission bundle editing for system groups while keeping name/slug/description immutable and delete blocked.

## Files Modified

1. **`backend/db/repo/permissions/permission-management.repository.ts`** (Task 2.1)
   - `updateGroup` method: Replaced `if (existing.isSystem) throw cannotModifySystemPermissionGroup` with conditional logic:
     - System group + `permissionIds` provided → replace permission bundle (delete old + insert new)
     - System group + `permissionIds` undefined → return existing group as-is (no-op)
     - System group + only name/description → return existing as-is (silently ignored)
     - Non-system group → existing behavior unchanged
   - `deleteGroup` `isSystem` guard remains unchanged — system groups cannot be deleted

2. **`backend/services/auth/permission-management.service.ts`** (Task 2.2)
   - `updateGroup` method: Added `requireGroupExists` fetch to check `isSystem` before validation
   - For system groups: skips `validateGroupName`, passes `name: undefined` and `description: undefined` to repository
   - For non-system groups: existing behavior unchanged

## Files NOT Modified
- `deleteGroup` — delete guard for system groups intentionally kept
- No type files changed (existing types already support the new behavior)

## Verification
- Both files passed `sub-loop.ts --lifecycle codescene` (exit 0)
- All progressive checks passed: tsgo → oxlint → biome → lint:type-aware → duplicates → codescene

## Carry-Forward Knowledge
- Frontend always sends `name` and `description` even for permission-only updates — backend must silently ignore these for system groups
- The `requireGroupExists` helper (line 97-101) is used to fetch the group before deciding whether to validate
- Task 2.3 (test update) depends on these changes — test must expect success instead of throw for system group updates
