# Uncommitted Changes Review Plan

**Date**: 2025-08-18
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: All 6 (security, performance, business-logic, deploy-safety, duplication, dead-code)
**Files Reviewed**: 298 changed files, 799 hunks, +10894/-3483 lines

## Summary

Round 4 review of 298 uncommitted files across 6 tracks. Security, deploy-safety, and duplication tracks are CLEAN. Performance track found 1 HIGH (redundant `getUserContext` DB queries on profile view hot path). Business-logic track found 1 HIGH (parent OWN-scope timezone silently dropped). Dead-code track found 1 MEDIUM (11 orphaned `parse*` exports in `frontend/lib/enum.ts`).

## Findings

### CRITICAL (0)
(none)

### HIGH (2)
- [x] [HIGH] performance: backend/services/profile/profile.service.ts:221 — `assertCanViewProfile`/`assertProfilePermission` refactor dropped single-fetched `permissionContext` reuse. Each call to `PermissionsService.hasPermission`/`hasAnyPermission` invokes `getUserContext` (2-3 uncached DB queries). A single `getUnifiedProfile` triggers ~3-4× redundant `getUserContext` calls (6-12 DB queries) on a hot path.
  → Fix: Introduced `PermissionCheckContext` type (UserPermissionContext + actorUserId). Refactored all permission helper functions to accept pre-fetched context and use sync `contextHasPermission`/`contextHasAnyPermission` instead of async `PermissionsService.hasPermission`. Entry points (`resolvePageContext`, `getProfileByUserId`, `applyProfileUpdate`) fetch `getUserContext` once and thread the context through all calls.

- [x] [HIGH] business-logic: backend/services/profile/profile.service.ts:629 — `applyParentUpdate` timezone update gated behind `scope === ProfileScope.OTHER` only. Parent self-edit (OWN scope) sends `timezone` via `updateOwnProfile` but `ParentRepository.updateParentProfile` doesn't persist it. Timezone silently dropped.
  → Fix: Removed the `scope === ProfileScope.OTHER` guard on the timezone update in `applyParentUpdate` so `UserRepository.updateTimezone` is called for all scopes.

### MEDIUM (1)
- [x] [MEDIUM] dead-code: frontend/lib/enum.ts:35 — New file exports 12 `parse*` functions but only `parseParentStatus` is imported anywhere. The other 11 are orphaned exports.
  → Fix: Removed all 11 unused `parse*` exports and their enum imports. Kept `parseParentStatus` and the shared `parseEnumValue` helper. Fixed import path from `@/frontend/graphql/generated/gql/graphql-types` to `@/frontend/common/graphql/generated/gql/graphql-types`.

## Recommended Actions

All 3 findings fixed and verified:
1. Performance: Single `getUserContext` fetch per profile operation, context threaded through all permission checks
2. Business logic: Parent timezone now persisted for all scopes (OWN + OTHER)
3. Dead code: 11 orphaned exports removed, import path corrected

## Layer Compliance Notes

- `getBackendTranslations` usage is another agent's i18n refactoring work — respected, not undone.
- Pre-existing tsgo errors (getBackendTranslations, ErrorsLabels, timezone/phone return type) are from another agent's concurrent work — not fixed per user's rule.

## Fix Status

- Total findings: 3
- Fixed: 3 / 3
- Remaining: 0
