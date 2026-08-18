# Uncommitted Changes Review Plan — Round 3

**Date**: 2026-08-18
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: Full depth — security, performance, business-logic, deploy-safety, duplication, dead-code
**Files Reviewed**: 295 changed files (292 with hunks > 0), 791 hunks, +9952/-3511 lines

## Summary

Round 3 review of 295 uncommitted files. All 6 tracks dispatched in parallel. Security, performance, deploy-safety, and dead-code tracks are clean — changes are predominantly security hardening, i18n threading, and input validation. Two CRITICAL findings: a business-logic regression where profile status/timezone updates are silently dropped, and a duplication issue where a new path-traversal guard reimplements an existing helper. Three WARNING findings about duplicate locale error keys for meeting token errors.

## Findings

### CRITICAL (2)

- [x] [CRITICAL] business-logic: `backend/services/profile/profile.service.ts:535` — `updateCoreUserFields` now routes `core.status` and `core.timezone` to `UserRepository.updateProfileFields`, but that repo method silently ignores `status` and `timezone` (only writes name/email/avatarUrl/displayCurrency/phone). Previously `core.status` was persisted via `UserRepository.updateStatus` AND audited via `AuditService` (USER_STATUS_CHANGED), and `core.timezone` via `updateTimezone`; both handlers were deleted in this diff while `CoreUserProfileFields` still declares status/timezone as valid inputs. Net result: status-change state transitions are silently dropped and unaudited, and core.timezone updates are ignored without error.
  → Fix: Restored `handleStatusUpdate` (permission check + `UserRepository.updateStatus` + `AuditService.createManyAdminAuditLogs` with USER_STATUS_CHANGED) and `UserRepository.updateTimezone` call in `updateCoreUserFields`. Added `AuditService` import.

- [x] [CRITICAL] duplication: `backend/lib/storage/local-storage-path.ts:32` — Newly added `resolvePublicStoragePath` reimplements the exact path-traversal guard already provided by the existing `getAbsolutePath` helper in `backend/storage/disk/local/utils.ts:16-18` (`relativeToBase.startsWith("..") || path.isAbsolute` → throw "Path traversal detected"), and also duplicates the sibling `resolveLocalStoragePath` in the same file. Should call `getAbsolutePath(publicRoot, subPath)` instead of inlining the guard.
  → Fix: Replaced inline path-traversal guards in both `resolvePublicStoragePath` and `resolveLocalStoragePath` with calls to the shared `getAbsolutePath` helper (which throws typed `StorageValidationError` instead of generic `Error`).

### WARNING (3)

- [x] [WARNING] duplication: `shared/locale/types/errors/index.ts:261` — Newly added `MeetingTokenErrors` interface (lines 261-264) redeclares the same `providerTokenUpdateFailed`/`providerTokenInsertFailed` keys already declared in `MeetingProviderErrors` (lines 195-196). The `meeting:` block should reuse `meetingProvider` or the new interface should be eliminated.
  → Fix: Removed duplicate `providerTokenUpdateFailed`/`providerTokenInsertFailed` from `MeetingProviderErrors` interface. Kept `MeetingTokenErrors` (used by the `meeting:` namespace which is referenced by `meeting-provider-token.repository.ts`). The `meetingProvider:` namespace no longer has these dead keys.

- [x] [WARNING] duplication: `shared/locale/ar/errors/index.ts:343` — Newly added `meeting:` block (lines 343-346) duplicates the `providerTokenUpdateFailed`/`providerTokenInsertFailed` Arabic string literals just added in the `meetingProvider:` block (lines 296-297) of the same file.
  → Fix: Removed duplicate `providerTokenUpdateFailed`/`providerTokenInsertFailed` from the `meetingProvider:` block. Kept the `meeting:` block (referenced by code via `errorsTranslations.meeting.*`).

- [x] [WARNING] duplication: `shared/locale/en/errors/index.ts:344` — Newly added `meeting:` block (lines 344-347) duplicates the `providerTokenUpdateFailed`/`providerTokenInsertFailed` English string literals just added in the `meetingProvider:` block (lines 297-298) of the same file.
  → Fix: Removed duplicate `providerTokenUpdateFailed`/`providerTokenInsertFailed` from the `meetingProvider:` block. Kept the `meeting:` block (referenced by code via `errorsTranslations.meeting.*`).

## Recommended Actions

1. **Fix CRITICAL business-logic**: Restore status/timezone persistence in `updateCoreUserFields` — either by adding those columns to `updateProfileFields` repo method or by re-calling the dedicated `updateStatus`/`updateTimezone` methods with audit logging.
2. **Fix CRITICAL duplication**: Replace `resolvePublicStoragePath`'s inline path-traversal guard with a call to the shared `getAbsolutePath` helper from `backend/storage/disk/local/utils.ts`.
3. **Fix WARNING duplications (×3)**: Remove the duplicate `MeetingTokenErrors` interface and `meeting:` error blocks in locale types/ar/en — reuse `MeetingProviderErrors` / `meetingProvider:` instead.

## Layer Compliance Notes

- Security track: All changes security-positive (auth hardening, input validation, MIME allowlist, rate limiting). No regressions.
- Performance track: No N+1, missing indexes, or unbounded queries introduced. Proper memoization and cleanup observed.
- Business-logic track: CRITICAL regression — status/timezone silently dropped in profile service refactor.
- Deploy-safety track: All API changes are intended privilege restrictions or security tightening. i18n keys verified.
- Duplication track: Path-traversal guard duplicated instead of using shared helper; meeting token error keys duplicated across two locale namespaces.
- Dead-code track: No unreachable code, unused imports, or orphaned exports introduced.

## Fix Status

- Total findings: 5
- Fixed: 5 / 5
- Remaining: 0
