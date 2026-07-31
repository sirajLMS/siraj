# Outcome: Task 5 - Directory Caching

## Summary
Wrapped `StaffDirectoryService.getDirectory` and `ParentDirectoryService.getParentDirectory` read paths with `cachedRead` using 30s TTL, identity+role-scoped cache keys, and tag indexing (`teacherDirectory`, `parentDirectory`). Permission checks remain strictly outside the cache wrapper.

## Details of Changes
1. **`backend/services/teacher/staff-directory.service.ts`**:
   - `getDirectory`: evaluated `assertDirectoryAccess` first (outside cache), obtained `context` via `PermissionsService.getUserContext(userId)`, built cache key `ec:teacher:dir:${roleId}:${stableStringify({ search, paginationArgs })}`, wrapped directory query with `cachedRead` (30s TTL, tag `teacherDirectory`).
2. **`backend/services/parent/parent-directory.service.ts`**:
   - `getParentDirectory`: evaluated `assertDirectoryAccess` first (outside cache), obtained `context` via `PermissionsService.getUserContext(actorUserId)`, built cache key `ec:parent:dir:${roleId}:${stableStringify({ search, pagination, lifecycleStatus })}`, wrapped directory query with `cachedRead` (30s TTL, tag `parentDirectory`).

## Verification Results
- `bun tsgo`: Passed (0 errors)
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase5`): Passed (`success: true`, exit code 0)
