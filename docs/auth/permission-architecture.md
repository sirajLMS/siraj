# Client-Side Permission Architecture

This document explains the 3-tier permission architecture, why container-level `<RequirePermission>` wrappers were removed, and what remains.

## The 3-Tier Permission Model

Siraj enforces permissions across three independent layers:

| Tier | Location | Enforcement | Bypassable? |
|------|----------|-------------|-------------|
| **1. Server Page Guard** | `app/(dashboard)/*/page.tsx` → `requirePermissionForPage()` | DB-backed `PermissionsService.getUserContext()` — checks role assignments from PostgreSQL | No — server-side redirect on failure |
| **2. Service / GraphQL Layer** | `backend/services/**` + Pothos resolvers | Every mutation/query re-checks permissions via `PermissionsService` | No — server-side, independent of page guard |
| **3. Client `<RequirePermission>`** | `frontend/common/components/auth/RequirePermission.tsx` | Reads `useUserStore().hasPermission()` from Zustand store (hydrated from GraphQL login response) | Yes — trivially via DevTools (`permissions: ["*"]`) |

### Why Tier 3 (Client Wrapper) Was Removed

The container-level `<RequirePermission>` wrapper that gated entire page returns:

1. **Redundant**: Duplicated the same permissions already enforced by the server page guard (Tier 1).
2. **Trivially bypassable**: The Zustand store is client-mutable. Setting `permissions: ["*"]` in DevTools bypasses all client checks.
3. **False sense of security**: Appeared to be defense-in-depth but provided no actual protection beyond the server guard.
4. **Mismatched**: Could drift from the server guard (e.g., server guard widened after client wrapper was written).

### What Was Kept

**ViewModel-level `hasPermission`**: Controls button/tab visibility (e.g., showing/hiding create/edit/delete buttons based on permissions). This provides genuine UX value — users without permission don't see buttons they can't use.

**Fine-grained `<RequirePermission>` on specific components**: Gates individual dialogs, tab panels, action bars, and toolbar sections (not entire page returns). These remain where they serve as UX-level conditional rendering.

### What Was Removed

Container-level `<RequirePermission>` wrappers that wrapped the entire container return — rendering `fallback={null}` if the user lacked permission. These were redundant with the server guard and provided no security value.

## Rules / Conventions

- **Every permission-gated page MUST call `requirePermissionForPage` in `page.tsx`** — this is THE security boundary.
- **The service/GraphQL layer MUST independently re-check permissions** on every mutation/query — this is the secondary boundary.
- **Container-level `<RequirePermission>` MUST NOT wrap entire page returns** — it's redundant and bypassable.
- **Fine-grained `<RequirePermission>` MAY gate individual components** (buttons, tabs, dialogs, sections) for UX purposes.
- **The `/dashboard` route is intentionally unguarded** — it's a role-dispatching page. Role-specific sub-containers (`AdminDashboardContainer`, `ParentDashboardContainer`, etc.) use `<RequirePermission>` as the only gate since there's no per-role page guard.
- **Permission arrays use OR semantics** — any one matching permission grants access. Super-admin bypasses all checks.

## What NOT to Do

- Do NOT add container-level `<RequirePermission>` wrappers that gate entire page returns — rely on the server guard.
- Do NOT remove the server-side `requirePermissionForPage` call — it is the security boundary.
- Do NOT remove fine-grained `<RequirePermission>` on buttons/tabs/sections — these are UX gates.
- Do NOT remove `<RequirePermission>` from dashboard role-dispatched sub-containers — they have no server page guard.

## Rollout Summary

| Metric | Count |
|--------|-------|
| Container wrappers removed | 56 files |
| page.tsx client wrappers removed | 1 file (`app/(dashboard)/permissions/page.tsx`) |
| Server guards fixed/added (Phase 1) | 4 files |
| Fine-grained gates kept | 28+ files |
| Special cases | 1 (`TeacherWeeklyScheduleContainer`: outer removed, inner kept) |
| Total files modified | 61 |

## Related Documents

- `app/AGENTS.md` — App Router layer rules
- `backend/lib/auth/require-permission.ts` — Server guard implementation
- `frontend/common/components/auth/RequirePermission.tsx` — Component (still used for fine-grained gating)
