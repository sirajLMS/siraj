# Uncommitted Changes Review Plan

**Date**: 2026-08-18
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: security, performance, business-logic, deploy-safety, duplication, dead-code
**Files Reviewed**: 50 changed files

## Summary

Reviewed 50 changed files (115 hunks, +627/-141 lines) across all 6 tracks. Most changes are security hardening (LIKE wildcard escaping, MIME/extension allowlists, password complexity, edge auth redirect) and additive generated GraphQL code. Found 5 issues: 1 CRITICAL (IP spoofing bypasses rate limiter), 3 WARNING (missing authScopes, effect dep widening, redundant wrapper), 1 SUGGESTION (maxItems duplicated 3×). All findings are in files modified by this diff.

## Findings

### CRITICAL (1)
- [x] [CRITICAL] security: backend/graphql/gqlContextFactory.ts:82 — `getIpAddress` returns raw `x-forwarded-for` for non-IPv4 values, allowing per-request IP spoofing that bypasses the login rate limiter (brute-force protection).
  → Fix: Added IPv6 regex check; non-IP values now collapse to `127.0.0.1` loopback fallback, restoring rate-limiter protection.

### WARNING (3)
- [x] [WARNING] security/deploy-safety: backend/graphql/mutation/shared/test-helper.mutation.ts:59 — `bootstrapDemoSuperAdmin` mutation lacks `authScopes: { loggedIn: true }` that the sibling `ensureDemoUsers` has, creating an inconsistent unauthenticated super-admin entry point (mitigated by `assertTestHelperAllowed`).
  → Fix: Added `authScopes: { loggedIn: true }` to `bootstrapDemoSuperAdmin` field definition.
- [x] [WARNING] performance: frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.ts:403 — useEffect dependency widened to `[store]` (fresh object each render), causing the effect to re-run on every render instead of only when `store.ensureDraftDates` reference changes.
  → Fix: Narrowed dependency array from `[store]` to `[store.ensureDraftDates]`.
- [x] [WARNING] duplication: backend/services/system/reference-data.service.ts:20 — New `isDrizzleTable` wrapper duplicates `isTable` (drizzle-orm) with identical signature; redundant, drift risk.
  → Fix: Removed `isDrizzleTable` wrapper, updated call site to use `isTable` directly. Removed now-unused `type Table` import.

### SUGGESTION (1)
- [x] [SUGGESTION] duplication: backend/graphql/pothos/storage/storage.pothos.ts:308 — `directives: { constraint: { maxItems: 100 } }` duplicated 3× within the file; extract a shared constant.
  → Fix: Added `MAX_STORAGE_PATH_ITEMS = 100` constant, replaced all 3 occurrences.

## Recommended Actions

1. **CRITICAL**: Restore IP sanitization in `getIpAddress` — collapse non-IPv4/non-IPv6 values to `127.0.0.1` to prevent rate-limiter bypass via spoofed headers.
2. **WARNING**: Add `authScopes: { loggedIn: true }` to `bootstrapDemoSuperAdmin` mutation for consistency.
3. **WARNING**: Narrow useEffect dep in `useSearchScheduleViewModel.ts` back to `[store.ensureDraftDates]`.
4. **WARNING**: Remove `isDrizzleTable` wrapper in `reference-data.service.ts`, call `isTable` directly at lines 34/35.
5. **SUGGESTION**: Extract `MAX_STORAGE_ITEMS` constant in `storage.pothos.ts`.

## Layer Compliance Notes

- All fixes target files modified by this diff only.
- No pre-existing issues in unchanged files will be touched.
- Concurrent agent work respected — no undoing of other agents' changes.

## Fix Status

- Total findings: 5
- Fixed: 5 / 5
- Remaining: 0
