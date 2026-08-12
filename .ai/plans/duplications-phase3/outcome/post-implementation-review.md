# Post-Implementation Review

**Date:** 2025-01-20
**Reviewers:** `review-backend-phase3`, `review-types-phase3`, `review-frontend-phase3` (all code-review subagents)
**Scope:** All files modified in commit `f97e41e03e`

## Review Summary

| Review | Subagent | Files Reviewed | Findings |
|--------|----------|----------------|----------|
| Backend | `review-backend-phase3` | All modified backend files (repo, schema, services, GraphQL, lib) | 1 HIGH — **FIXED** (lost `identifierLabel` default) |
| Types | `review-types-phase3` | All 8 modified type files | 0 issues |
| Frontend | `review-frontend-phase3` | All 111 modified frontend/app/test files | 0 issues (1 pre-existing bug fixed by refactor) |

## Backend Review

### HIGH Severity — FIXED

**Lost `identifierLabel` default in `SupportedOnlineAccountRepository.create`**

- **Root cause:** `makeBillingRepo` factory's `create()` dropped the `identifierLabel: input.identifierLabel ?? input.name` default
- **Fix:** Added `prepareInsert` hook to `BillingRepoConfig`; configured in `supported-online-account.repository.ts`
- **Verification:** tsgo/oxlint/biome/lint all pass clean
- **Details:** See `midpoint-review-R1.md`

## Types Review

### No Issues Found

All 8 type files pass review — no dropped fields, no circular imports, no re-export collisions. See `midpoint-review-R1.md` for details.

## Frontend Review

### No Issues Found

All 111 frontend/app/test files reviewed across 8 areas:

1. **`withPageAuth` (50+ pages)** — Auth triplet ordering preserved (`getLocale → getServerUserContext → redirectToLogin → requirePermissionForPage`). Empty-array and null permissions gated correctly. `context` is guaranteed non-null after `userId` guard passes.

2. **Admin section extraction** — Refactor **fixes a pre-existing bug**: the original `AdminOnlySection` had a no-op `ResetPasswordDialog` (`onConfirm` just closed the dialog without calling the API). The new `AdminSectionShared` properly calls `resetPassword()` via `useAdminResetPassword` hook.

3. **Tab panel factory** — Aria IDs, `canRender` null returns, `RequirePermission`, `Suspense`, and lazy loading all preserved. `RequirePermission` moved inside `Suspense` is benign (only reads Zustand store, independent of lazy chunk).

4. **Profile page split** — `renderProfilePageClient` passing `nationalIdComplete` unconditionally is safe (React treats explicit `undefined` same as omitted prop). Edit page correctly avoids `ProfilePageServer` to run forceComplete searchParams inspection first.

5. **Quota audience views** — Section order, labels, empty-state messages, icon colors/layouts, metrics constants all verified faithful.

6. **Auth banners** — Shared `simulationBannerShared.tsx` preserves all props and behaviors.

7. **Test mock navigation helpers** — Mock router method counts and behaviors verified equivalent.

8. **Test fixtures** — Test data shapes preserved.

### Feature-Flag-vs-Auth Ordering

For `/staff`, `/teachers`, `/parents`, `/users` pages: unauthenticated users now redirect to login before the feature-flag redirect to `/users?tab=...`. Since `/users` is also auth-gated, net effect is identical. For authenticated users lacking specific permission, they now fail-fast at the permission gate rather than bouncing to `/users?tab=...` — arguably more correct.

## Conclusion

Phase 3 duplication elimination refactoring is **clean** across all three review tracks. The single HIGH severity issue (lost `identifierLabel` default) has been fixed and verified. The refactor also incidentally fixed a pre-existing no-op bug in `AdminOnlySection`'s reset password dialog.
