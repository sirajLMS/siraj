# Phase 0: Pre-Implementation Baseline

**Date:** 2026-08-10
**Task:** Remove container-level `<RequirePermission>` wrappers

## Baseline Metrics

| Metric | Value |
|--------|-------|
| tsgo errors | 0 |
| biome warnings | 0 (not yet measured) |
| lint errors | 0 (not yet measured) |

## File Classification Summary

From the exploration and verification phases:

| Category | Count | Action |
|----------|-------|--------|
| **A — Container wrappers (remove)** | 59 files | Remove `<RequirePermission>` wrapper, clean imports |
| **B — Fine-grained gating (keep)** | 10 files | No changes — these gate individual buttons/tabs/sections |
| **C — Direct page.tsx usage (remove)** | 1 file (`permissions/page.tsx`) | Remove redundant client `<RequirePermission>` |

## Phase 1 (Server Guard Fixes) Details

4 `page.tsx` files need modification before Phase 2 can begin:
1. `complaints/page.tsx` — missing `requirePermissionForPage` entirely (add `SUPPORT_SUBMIT_COMPLAINT`)
2. `teachers/page.tsx` — partial match (add `TEACHERS_LIST`)
3. `parents/page.tsx` — partial match (add `PARENTS_LIST`)
4. `schedule/tracking/page.tsx` — partial match (add `DASHBOARD_VIEW_METRICS`)

## Special Cases

- **`AdminDashboardContainer.tsx`** — wraps with `DashboardViewMetrics` but is a sub-component of the dashboard dispatcher (`dashboard/page.tsx`), which is intentionally unguarded. **Keep** — this is fine-grained gating within the dispatcher.
- **`TeacherWeeklyScheduleContainer.tsx`** — has nested `<RequirePermission>`: outer gates page (`ScheduleViewWeekly`), inner gates dialog (`ScheduleCreateClass`). Remove outer, keep inner + import.
- **`RescheduleContainer.tsx`** — `RequirePermission` only on happy-path return (after loading/error checks). Remove it.
- **Tab panels** (`BillingTabPanels`, `SettingsTabPanels`, etc.) — fine-grained per-tab gating. **Keep all.**
