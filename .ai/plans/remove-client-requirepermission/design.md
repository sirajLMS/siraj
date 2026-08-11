# Design: Remove Container-Level `<RequirePermission>` Wrappers

## Overview

This design removes redundant container-level `<RequirePermission>` wrappers that duplicate the server-side `requirePermissionForPage` guard. The approach uses a pool of 16 parallel subagents — each assigned one file to modify, with new files dispatches as pool slots free up.

## Architecture

### Current Flow (Before)
```
page.tsx (server) → requirePermissionForPage() → redirect if unauthorized
  → Container.tsx (client) → <RequirePermission> → render null if unauthorized (REDUNDANT)
    → View.tsx → Mobile/Desktop views
```

### Target Flow (After)
```
page.tsx (server) → requirePermissionForPage() → redirect if unauthorized
  → Container.tsx (client) → render children directly
    → View.tsx → Mobile/Desktop views
```

### Three Security Tiers (Unchanged)
1. **Server page guard** — `requirePermissionForPage` in each `page.tsx` (THE gate)
2. **Service/GraphQL layer** — `PermissionsService.hasPermission()` on every mutation/query
3. **Client ViewModel** — `hasPermission()` for button/tab visibility (UX, kept)

## Key Design Decisions

### Decision 1: Fix-then-remove for missing/mismatched server guards
**Context:** 2 pages lack server guards, 5 pages have partial matches
**Options:**
1. Add server guard first, then remove client wrapper — *Safe, ensures no gap*
2. Remove client wrapper first, then add server guard — *Risk: window of no protection*
**Decision:** Add/widen server guard FIRST, then remove client wrapper
**Rationale:** Prevents any window where no permission check exists

### Decision 2: Pool of 16 parallel subagents
**Context:** ~50 files to modify (45 removals + 5 server guard fixes + 1 page.tsx direct removal)
**Options:**
1. Sequential one-by-one — *Safe but very slow*
2. Pool of 16 parallel subagents — *Fast, fills slots as they free*
**Decision:** Pool of 16 parallel subagents
**Rationale:** Files are independent (each subagent modifies one file), no cross-file dependencies

### Decision 3: Two-phase execution
**Context:** Server guard fixes must complete before client wrapper removal for mismatched cases
**Decision:**
- **Phase 1**: Add/widen server guards in 7 page.tsx files (2 missing + 5 partial matches)
- **Phase 2**: Remove client `<RequirePermission>` wrappers from all ~50 files (pool of 16)
- **Phase 3**: Clean up unused imports, update AGENTS.md, create docs

### Decision 4: Keep `RequirePermission` component
**Context:** The `RequirePermission` component is still used for fine-grained gating (buttons, tabs, sections)
**Decision:** Do NOT delete `RequirePermission.tsx` — it remains in use by Category B files
**Rationale:** Fine-grained gating (e.g., action buttons in class details) still needs it

## File Classification

### Phase 1: Server Guard Fixes (7 files — sequential or small parallel batch)

#### 1A. Missing server guard (add `requirePermissionForPage`):
| # | File | Permission to add | Notes |
|---|------|-------------------|-------|
| 1 | `app/(dashboard)/complaints/page.tsx` | `[SUPPORT_SUBMIT_COMPLAINT]` | Has `getCachedParentIdForComplaints` — add permission check after |

#### 1B. Partial match (widen `requirePermissionForPage` permission array):
| # | File | Current perms | Add perm | Notes |
|---|------|---------------|---------|-------|
| 2 | `app/(dashboard)/teachers/page.tsx` | `[STAFF_VIEW_DIRECTORY]` | `TEACHERS_LIST` | Client checks both |
| 3 | `app/(dashboard)/parents/page.tsx` | `[PARENT_VIEW_DIRECTORY]` | `PARENTS_LIST` | Client checks both |
| 4 | `app/(dashboard)/schedule/tracking/page.tsx` | `[SESSION_RESCHEDULE, SCHEDULE_VIEW_ALL, SCHEDULE_VIEW_LIST]` | `DASHBOARD_VIEW_METRICS` | StatusTrackingContainer checks it |

**Note:** `AdminDashboardContainer` (#16) wraps with `[DashboardViewMetrics]` but renders inside `dashboard/page.tsx` which is the dispatcher — intentionally unguarded. The `<RequirePermission>` there is sub-component gating within the dashboard dispatcher, not a page-level wrapper. **Keep it** — it's the permission gate for the admin dashboard view specifically.

### Phase 2: Client Wrapper Removal (pool of 16)

Each subagent receives ONE file and must:
1. Read the target file
2. Remove the `<RequirePermission>` wrapper (replace with direct children)
3. Remove unused `RequirePermission` import
4. Remove unused `AppPermission` import if no longer used
5. Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
6. Fix any errors until exit 0
7. Report completion

**File list (Phase 2 — safe to remove because Phase 1 fixed the server guards):**
*(All 45+ Category A files from the exploration + 1 Category C file)*

### Phase 3: Cleanup & Documentation

1. Verify `RequirePermission.tsx` is still imported by Category B files (keep it)
2. Update `app/AGENTS.md` line 34 — remove mandatory `<RequirePermission>` defense-in-depth requirement
3. Update `frontend/views/AGENTS.md` if it references `<RequirePermission>`
4. Create `docs/auth/permission-architecture.md`
5. Run full quality gate

## Subagent Prompt Template

Each pool subagent receives:
```
You are modifying: <file-path>

TASK: Remove the container-level <RequirePermission> wrapper from this file.

The server-side `requirePermissionForPage` in the corresponding `page.tsx` already checks the same (or broader) permissions. The client wrapper is redundant with the server guard and is trivially bypassable via DevTools.

RULES:
1. Remove the <RequirePermission> wrapper — render children directly
2. Remove the `RequirePermission` import if no longer used in the file
3. Remove the `AppPermission` import if no longer used in the file
4. Do NOT remove any fine-grained <RequirePermission> that gates individual buttons/tabs/sections (only remove the wrapper that gates the ENTIRE container return)
5. After editing, run: bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
6. Fix any errors until the script exits 0
7. Read applicable AGENTS.md files printed by sub-loop.ts before fixing

Read these files before starting:
- /home/ahmed/Projects/siraj/.ai/plans/remove-client-requirepermission/specs.md
- /home/ahmed/Projects/siraj/frontend/AGENTS.md
- /home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md
```
