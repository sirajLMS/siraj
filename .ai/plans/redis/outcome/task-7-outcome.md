# Outcome: Task 7 - Mutation Invalidation Wiring

## Summary
Wired domain mutation write paths across parent profiles, teacher profiles, teacher dues, and permission management to tag invalidation helpers (`invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`). All cache invalidations are wrapped in fail-open `try/catch` blocks.

## Details of Changes
1. **`backend/services/parent/parent-profile.service.ts`**:
   - Wired `deactivateAccount`, `reactivateAccount`, `updateOwnProfile`, and `updateProfile` to `invalidateParentWrite(parentId, userId)`.
2. **`backend/services/teacher/teacher-portal.service.ts`**:
   - Wired `updateOwnProfile` to `invalidateTeacherWrite(teacherId, userId)`.
3. **`backend/services/staff/staff-profile.service.ts`**:
   - Wired `updateTeacherProfile` to `invalidateTeacherWrite(teacherId, profile.userId)`.
4. **`backend/services/teacher/teacher-due.service.ts`**:
   - Wired `createDueEntry` and `markAsPaid` to `invalidateClassLifecycle(teacherId, undefined)`.
5. **`backend/services/auth/permission-management.service.ts`**:
   - Wired `assignGroupToUser`, `revokeGroupFromUser`, `bulkAssignUsersToGroup`, `bulkRevokeUsersFromGroup`, and `updateUserOverrides` to `invalidateRoleChange(userId)`.

## Verification Results
- `bun tsgo`: Passed (0 errors)
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase7`): Passed (`success: true`, exit code 0)
