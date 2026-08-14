# Spec: Remove Container-Level `<RequirePermission>` Wrappers

## Overview

The codebase has redundant client-side permission checks (`<RequirePermission>` wrapping entire containers) that duplicate the server-side `requirePermissionForPage` guard in `page.tsx`. The client checks are:
1. **Not a security boundary** — they read from a client-mutable Zustand store (`useUserStore`)
2. **Already mismatched** — billing page checks 4 perms server-side, only 1 client-side
3. **Redundant** — the server guard blocks unauthorized users before HTML is sent

The service/GraphQL layer provides an independent third tier of enforcement on every API call.

## User Stories

**As a** developer maintaining the codebase,
**I want** to eliminate redundant container-level permission checks,
**so that** there is one authoritative permission gate per page (server-side), reducing maintenance burden and eliminating drift bugs.

**As a** security-conscious developer,
**I want** the server-side `requirePermissionForPage` to be the single page-level permission gate,
**so that** permission checking is centralized, testable, and not bypassable.

## Acceptance Criteria (EARS)

### AC-1: Container-level `<RequirePermission>` wrappers removed
1. WHEN a container has `<RequirePermission>` wrapping its entire return value AND the corresponding `page.tsx` has a matching `requirePermissionForPage` call THEN the `<RequirePermission>` wrapper SHALL be removed and children rendered directly.
2. WHEN a container has `<RequirePermission>` wrapping its entire return value AND the corresponding `page.tsx` has NO `requirePermissionForPage` call THEN a `requirePermissionForPage` call SHALL be added to `page.tsx` BEFORE removing the client wrapper.

### AC-2: Fine-grained `<RequirePermission>` preserved
3. WHEN `<RequirePermission>` gates an individual button, tab, section, or sub-component (not the entire container return) THEN it SHALL be preserved — this provides UX value (hiding affordances).

### AC-3: ViewModel-level `hasPermission` preserved
4. WHEN a ViewModel uses `useUserStore().hasPermission()` to control button/tab visibility THEN it SHALL be preserved — this is fine-grained UX gating, not page-level access control.

### AC-4: Server guards widened for partial matches
5. WHEN a `page.tsx` checks a permission subset of the client `<RequirePermission>` wrapper THEN the `page.tsx` `requirePermissionForPage` call SHALL be widened to include all permissions the client checked, THEN the client wrapper SHALL be removed.

### AC-5: Page.tsx direct `<RequirePermission>` removed
6. WHEN a `page.tsx` Server Component uses `<RequirePermission>` directly AND also calls `requirePermissionForPage` THEN the redundant `<RequirePermission>` SHALL be removed.

### AC-6: Unused imports cleaned
7. WHEN `<RequirePermission>` is removed from a file THEN the `RequirePermission` import SHALL be removed if no longer used in that file.
8. WHEN `AppPermission` is removed from a file THEN the `AppPermission` import SHALL be removed if no longer used in that file.

### AC-7: AGENTS.md updated
9. AFTER all removals complete THEN `app/AGENTS.md` line 34 SHALL be updated to reflect that container-level `<RequirePermission>` is no longer required as defense-in-depth.
10. AFTER all removals complete THEN `frontend/views/AGENTS.md` and `frontend/AGENTS.md` SHALL be updated if they reference `<RequirePermission>` as a required pattern.

### AC-8: No security regression
11. WHEN a user without the required permission navigates to any gated page THEN the server-side `requirePermissionForPage` SHALL redirect them to `/dashboard` or call `forbidden()`.
12. WHEN a user without permission attempts a GraphQL mutation/query THEN the service layer SHALL reject the request (independent of page guards).

### AC-9: Type safety maintained
13. AFTER all changes THEN `bun tsgo` SHALL report 0 new errors (baseline: 0).
14. AFTER all changes THEN `bun biome:check` SHALL report 0 new warnings.
15. AFTER all changes THEN `bun run lint` SHALL report 0 new lint errors.

## Scope

### In Scope
- Removing `<RequirePermission>` wrappers from ~45 container files
- Adding `requirePermissionForPage` to 2 page.tsx files that lack server guards (`complaints/page.tsx`)
- Widening server guard permission arrays in 5 page.tsx files with partial matches
- Removing 1 direct `<RequirePermission>` from `permissions/page.tsx`
- Cleaning up unused `RequirePermission` and `AppPermission` imports
- Updating `app/AGENTS.md` to reflect the new convention
- Creating `docs/auth/permission-architecture.md` reference doc

### Out of Scope
- ViewModel-level `hasPermission` calls (these control button/tab visibility — KEEP)
- Fine-grained `<RequirePermission>` on buttons/tabs/sections (KEEP)
- Service-layer permission checks (already independent — untouched)
- Server-side `requirePermissionForPage` implementation (unchanged)
- `DashboardContainer` / `dashboard/page.tsx` (intentionally no permission gate — redirects to role-specific dashboard)
