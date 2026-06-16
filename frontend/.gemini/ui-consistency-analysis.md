# UI Consistency Analysis Report

**Date:** 2026-06-13  
**Implementation status:** Shared UI layer shipped — see [COMPONENT_PATTERNS.md](../COMPONENT_PATTERNS.md)  
**Page rollout:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) § Shared Dashboard UI Layer

## Overview

An analysis of the implemented pages and components within `src/views/dashboard` revealed duplicated logic and a lack of unified design patterns. The custom UI theme in `src/providers/theme.ts` was frequently bypassed in favor of hardcoded values.

**Update (2026-06-13):** A shared component library now exists at `src/components/ui/`. Phases 0–2 of the unification plan are largely complete.

---

## Implementation Summary

### Built (`src/components/ui/`)

| Component                                             | Resolves                         |
| ----------------------------------------------------- | -------------------------------- |
| `PageContainer`                                       | Double-padding bug               |
| `PageHeader`                                          | Missing/inconsistent page titles |
| `SectionPanel`                                        | Copy-pasted Paper + header bar   |
| `BaseCard`                                            | Card radius/shadow/border drift  |
| `MetricCard`                                          | 6+ metric card variants          |
| `StatusBadge`                                         | 3+ status badge patterns         |
| `AppDataGrid`                                         | 5+ hand-built MUI Tables         |
| `PrimaryPageAction` / `FilterButton` / `ExportButton` | Ad-hoc button styles             |

### Theme extensions (`src/providers/theme.ts`)

- `layout.radius` (card, button, badge, section)
- `layout.sectionGap`
- `typography.labelUppercase`
- `MuiDataGrid` style overrides (`palette.table.header`)

### Migrated pages

All 9 implemented dashboard views use `PageContainer`. Five list tables use `AppDataGrid` via feature-specific `*DataGrid` wrappers. Students, Schedule Alerts, Reschedule Tracking, and Status Tracking use `PageHeader` + `MetricCard`.

---

## Original Findings (resolved / in progress)

### 1. Data Tables — **Resolved (desktop list pages)**

- **Was:** 5+ custom MUI Table implementations with duplicated header/hover/pagination logic
- **Now:** `AppDataGrid` + feature `*DataGrid` components
- **Remaining:** Keep `RegisteredStudentsSection` as MUI Table exception; style to match tokens

### 2. Cards — **In progress**

- **Was:** Inconsistent border radius (3 vs 10 vs 16), mixed Card/Paper/Box
- **Now:** `BaseCard` + `MetricCard` with `theme.layout.radius.card = 3`
- **Remaining:** Dashboard home reports grid, class detail cards, mobile inline metric boxes

### 3. Page Layouts — **Resolved**

- **Was:** Double padding (`DashboardLayout.pageMargin` + view `p: 2/3`)
- **Now:** `PageContainer` only — no extra view padding
- **Was:** No standard `PageContainer` / `PageHeader`
- **Now:** Shared components on all list pages; `AuditPageHeader` pending migration

### 4. Typography — **In progress**

- **Was:** Hardcoded `sx` font styles bypassing theme variants
- **Now:** `PageHeader` uses `headlineLg` / `bodyLg`; DataGrid uses `labelUppercase`
- **Remaining:** Class detail views, mobile metric grids

---

## Proposed Architectural Approach — Status

| Proposal               | Implementation                         | Status  |
| ---------------------- | -------------------------------------- | ------- |
| `BaseCard`             | `src/components/ui/BaseCard.tsx`       | Done    |
| `BaseTable` → DataGrid | `src/components/ui/AppDataGrid.tsx`    | Done    |
| `PageContainer`        | `src/components/ui/PageContainer.tsx`  | Done    |
| `PageHeader`           | `src/components/ui/PageHeader.tsx`     | Done    |
| Typography refactoring | Via shared components + theme variants | Partial |

---

## Guidelines for New Pages

Read [COMPONENT_PATTERNS.md](../COMPONENT_PATTERNS.md) before implementing any new dashboard page. Key rules:

1. **Never** add outer `p: 2/3` inside views — use `PageContainer`
2. **Always** use `AppDataGrid` for desktop list tables (unless documented exception)
3. **Always** use `MetricCard` for stat displays
4. **Always** use shared `StatusBadge` for status cells
5. **Always** use theme typography variants, not hardcoded fonts

---

## Remaining Work

- Consolidate reports `MetricCardGrid` with shared `MetricCard`
- Migrate `AuditPageHeader` to `PageHeader`
- Promote form field styles to shared layer
- Add enforcement guidance to code review / lint
