# Outcome: Task 4 - Entity Lookups Caching

## Summary
Wrapped entity lookup paths for `getCurrentUser`, `cachedTeacherByUserId`, and `cachedParentByUserId` with `cachedRead` using identity+role-scoped cache keys (`ec:user:${userId}:${roleId}`, `ec:teacher:byUserId:${userId}:${roleId}`, `ec:parent:byUserId:${userId}:${roleId}`).

## Details of Changes
1. **`backend/lib/auth/cached-user.ts`**:
   - Wrapped inner `SessionService.getCurrentUserProfile(userId)` loader with `cachedRead` (300s TTL, tag `user:${userId}`).
   - Preserved outer `React.cache()` memoization wrapper.
2. **`backend/lib/auth/cached-teacher-by-user-id.ts`**:
   - Created `cachedTeacherByUserId(userId, roleId, loader)` wrapping loader with `cachedRead` (300s TTL, tag `teacher:byUserId:${userId}`).
3. **`backend/lib/auth/cached-parent-by-user-id.ts`**:
   - Created `cachedParentByUserId(userId, roleId, loader)` wrapping loader with `cachedRead` (300s TTL, tag `parent:byUserId:${userId}`).
4. **`backend/lib/auth/index.ts`**:
   - Re-exported `cached-teacher-by-user-id` and `cached-parent-by-user-id`.

## Verification Results
- `bun tsgo`: Passed (0 errors)
- `bun biome:check`: Passed (0 errors)
- Lint Queue (`phase4`): Passed (`success: true`, exit code 0)
