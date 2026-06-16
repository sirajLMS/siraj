# Design Consistency Analysis

**Date:** 2026-06-13  
**Scope:** All pages and components in `/src/views` and `/src/components`  
**Implementation status:** [COMPONENT_PATTERNS.md](../COMPONENT_PATTERNS.md) — Phases 0–2 largely complete  
**Rollout plan:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) § Shared Dashboard UI Layer

## Executive Summary

The application previously used **6+ different card patterns**, **3 different table implementations**, and **multiple status badge approaches** without a unified design system. A shared UI layer now exists at [`src/components/ui/`](../src/components/ui/).

---

## Implementation Progress (2026-06-13)

### Completed

| Item                 | Location                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Shared UI layer      | `src/components/ui/` — PageContainer, PageHeader, SectionPanel, BaseCard, MetricCard, StatusBadge, AppDataGrid, ActionButtons |
| Theme tokens         | `theme.layout.radius`, `sectionGap`, `typography.labelUppercase`, `MuiDataGrid` overrides                                     |
| Double-padding fix   | All 9 implemented views use `PageContainer` (no inner `p: 2/3`)                                                               |
| DataGrid migrations  | Students, Schedule Alerts, Status Tracking, Reschedule Tracking, Dashboard schedule overview                                  |
| PageHeader           | Students, Schedule Alerts, Reschedule, Status Tracking                                                                        |
| MetricCard adoption  | Students, Schedule Alerts, Reschedule, Status Tracking (desktop)                                                              |
| StatusBadge adoption | All DataGrids, student directory cards/rows                                                                                   |

### In progress

- `PageContainer` / `PageHeader` not yet on `/classes/[id]` or `/classes/new`
- Typography hardcoding in some class/audit views

### Not started

- `formFieldStyles.ts` promotion to shared forms layer
- Lint enforcement for new pages
- Full `BaseCard` migration for class detail cards

---

## 1. Card Components — Multiple Patterns

### Original problem

| Component               | Border Radius | Layout                              | Hover Effect        | Use Case          |
| ----------------------- | ------------- | ----------------------------------- | ------------------- | ----------------- |
| `StudentMetricCard`     | `10`          | Icon right, flex                    | Border color change | Student metrics   |
| `MetricCard` (reports)  | `3`           | Count first, circular bordered icon | Transform + shadow  | Dashboard metrics |
| `StatusMetricCard`      | `3`           | Icon top-right, vertical            | Border + shadow     | Schedule status   |
| `TrackingMetricCard`    | `3`           | Icon right, conditional bg          | Border change       | Tracking metrics  |
| `AlertsQuotaMetricCard` | `3`           | Icon top-left, trend chip           | Shadow only         | Alerts page       |
| `StudentDirectoryCard`  | `3`           | Nested subcomponents                | Scale transform     | Student cards     |

### Resolution

- **Target:** [`MetricCard`](../src/components/ui/MetricCard.tsx) + [`BaseCard`](../src/components/ui/BaseCard.tsx)
- **Status:** Migrated on students, schedule alerts, reschedule, status tracking, dashboard home, class live performance; legacy per-feature cards removed
- **Remaining:** None on implemented pages

---

## 2. Tables — Inconsistent Structure

### Original problem

Hand-built MUI Tables with divergent headers, pagination, and empty states.

### Resolution

- **Target:** [`AppDataGrid`](../src/components/ui/AppDataGrid.tsx) (`@mui/x-data-grid`)
- **Status:** 5 list tables migrated to feature `*DataGrid` wrappers
- **Exception:** `RegisteredStudentsSection` keeps lightweight MUI Table
- **Remaining:** Style `RegisteredStudentsSection` to match DataGrid tokens

---

## 3. Status Badges — Multiple Implementations

### Original problem

`StudentStatusBadge` (Box), schedule `StatusBadge` (Chip), inline chips.

### Resolution

- **Target:** [`StatusBadge`](../src/components/ui/StatusBadge.tsx) with category prop
- **Categories:** `studentAccount`, `classSession`, `classStatus`, `sessionTracking`, `trackingStatus`, `session`, `enrollment`
- **Status:** Used in all DataGrids and student directory
- **Remaining:** Mobile card lists may still use schedule `StatusBadgeAction` display helpers

---

## 4. Typography & Font Styling

### Target

Use theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) via `PageHeader` and shared components.

### Status

Migrated pages use theme variants. Class detail and audit views still have hardcoded `sx` typography.

---

## 5. Button Patterns

### Resolution

`PrimaryPageAction`, `FilterButton`, `ExportButton` presets in `src/components/ui/ActionButtons.tsx`.

Table cell compact buttons still use inline `sx` — acceptable until `CompactTableAction` preset is added.

---

## 6. Spacing & Layout

### Double-padding fix

`DashboardLayout` applies `pageMargin`; views now use `PageContainer` without additional padding.

### Theme layout tokens

`theme.layout.cardPadding`, `sectionGap`, `radius.*` now defined and used by shared components.

---

## Recommendations — Updated Status

| Recommendation                       | Status                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| Single MetricCard                    | In progress — legacy per-feature cards removed; reports grid pending |
| Single StatusBadge                   | Done for DataGrids; card lists pending                               |
| Standardized DataTable → AppDataGrid | Done for 5 list pages                                                |
| Design tokens in theme               | Done                                                                 |
| Component guidelines document        | Done — [COMPONENT_PATTERNS.md](../COMPONENT_PATTERNS.md)             |

---

## Phased Rollout — Updated

| Phase                 | Original scope            | Status      |
| --------------------- | ------------------------- | ----------- |
| 0 Foundation          | UI primitives + theme     | **Done**    |
| 1 Cards               | MetricCard                | **Partial** |
| 2 Tables              | AppDataGrid               | **Done**    |
| 3 Badges              | StatusBadge               | **Partial** |
| 4 Layout + typography | PageContainer, PageHeader | **Partial** |
| 5 Forms               | formFieldStyles promotion | Not started |
| 6 Enforcement         | Lint rules                | Not started |

---

## Next Steps

1. Migrate mobile card list badges to shared `StatusBadge`
2. Add `PageContainer` to class detail/create views
3. Enforce patterns in AGENTS.md / code review for new pages
