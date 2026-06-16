## <!-- d1994f10-5618-4a30-88f9-c363cc8e2a05 -->

todos:

- id: "build-datagrid-wrapper"
  content: "Create src/components/ui/AppDataGrid.tsx — themed @mui/x-data-grid wrapper with palette.table.header, pagination, empty/loading slots, RTL support"
  status: completed
- id: "extend-theme-tokens"
  content: "Extend theme.ts with radius/spacing/typography tokens from .kiro analysis; add DataGrid styleOverrides"
  status: completed
- id: "extract-ui-primitives"
  content: "Create BaseCard, MetricCard, StatusBadge, PageContainer, PageHeader, SectionPanel, ActionButton presets in src/components/ui/"
  status: completed
- id: "fix-double-padding"
  content: "Remove per-view p:2/3 padding; use PageContainer as sole content spacing layer under DashboardLayout pageMargin"
  status: completed
- id: "migrate-tables-to-datagrid"
  content: "Migrate 5 main list tables to AppDataGrid; keep RegisteredStudentsSection as lightweight MUI Table (embedded section)"
  status: completed
- id: "migrate-cards-badges-buttons"
  content: "Replace 6 metric card variants + 3 status badge patterns; standardize button radius/transform rules"
  status: completed
- id: "migrate-existing-pages"
  content: "Refactor 9 implemented pages to shared primitives; fix dead pagination/filter/pageTitle wiring"
  status: completed
- id: "document-patterns"
  content: "Add COMPONENT_PATTERNS.md and AGENTS.md section with DataGrid, card, badge, and spacing guidelines"
  status: completed
- id: "delete-legacy-tables"
  content: "Remove deprecated \*Table.tsx files after confirming no imports remain"
  status: completed
- id: "migrate-remaining-metrics"
  content: "Migrate dashboard MetricCardGrid, LivePerformanceGrid, and class detail cards to shared MetricCard/BaseCard"
  status: completed
- id: "migrate-audit-header"
  content: "Replace AuditPageHeader with shared PageHeader + breadcrumbs"
  status: completed
- id: "promote-form-styles"
  content: "Promote formFieldStyles.ts to src/components/ui/form/"
  status: completed
- id: "enforce-patterns"
  content: "Add lint/review rules for AppDataGrid, MetricCard, StatusBadge on new pages"
  status: completed
  isProject: false

---

# UI Consistency Plan — Siraj Dashboard

**Last updated:** 2026-06-13  
**Living doc:** [COMPONENT_PATTERNS.md](../COMPONENT_PATTERNS.md)  
**Agent rules:** [AGENTS.md](../AGENTS.md) → Dashboard UI Patterns

## Sources

- Independent codebase audit (2026-06-13)
- [`.kiro/design-consistency-analysis.md`](../.kiro/design-consistency-analysis.md)
- [`.gemini/ui-consistency-analysis.md`](../.gemini/ui-consistency-analysis.md)
- User decision: **use `@mui/x-data-grid` when possible**

---

## Implementation Status (2026-06-13)

### Done

| Deliverable                       | Location                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| Shared UI layer                   | [`src/components/ui/`](../src/components/ui/)                                               |
| Theme tokens + DataGrid overrides | [`src/providers/theme.ts`](../src/providers/theme.ts)                                       |
| Documentation                     | [`COMPONENT_PATTERNS.md`](../COMPONENT_PATTERNS.md), AGENTS.md section                      |
| Double-padding fix                | All 9 views → `PageContainer`                                                               |
| DataGrid migrations (5)           | `*DataGrid.tsx` in students + schedule                                                      |
| PageHeader                        | Students, Schedule Alerts, Reschedule, Status Tracking, Class Audit                         |
| MetricCard                        | Dashboard home (`MetricCardGrid`), schedule pages, `LivePerformanceGrid`                    |
| BaseCard                          | All class detail + audit card components                                                    |
| StatusBadge                       | All DataGrids, student directory, mobile card lists                                         |
| Legacy cleanup                    | Removed 5 `*Table.tsx`, 4 per-feature metric cards, reports `MetricCard`, `AuditPageHeader` |
| Table header tokens               | `RegisteredStudentsSection` uses `palette.table.header.*`                                   |
| Typography cleanup                | Standardized `sx` typography on class detail cards                                          |

### In progress

- ESLint custom rules (optional, deferred)

### Not started

- Add RTL `localeText` to `AppDataGrid`

---

## Architecture (target state — achieved on implemented pages)

```
DashboardLayout (pageMargin)
  └── PageContainer
        ├── PageHeader
        ├── MetricCard grid
        └── SectionPanel
              ├── AppDataGrid (desktop)
              └── *CardList (mobile)
```

Import: `@/frontend/components/ui`

---

## DataGrid migration map — complete

| Route                           | DataGrid component                                | Status              |
| ------------------------------- | ------------------------------------------------- | ------------------- |
| `/students`                     | `StudentDirectoryDataGrid`                        | Done                |
| `/schedule/alerts`              | `AcademicScheduleDataGrid` (server pagination)    | Done                |
| `/schedule/tracking/status`     | `StatusTrackingDataGrid`                          | Done                |
| `/schedule/tracking/reschedule` | `RescheduleTrackingDataGrid`                      | Done                |
| `/dashboard`                    | `ScheduleOverviewDataGrid`                        | Done                |
| `/classes/[id]/audit`           | MUI Table exception (`RegisteredStudentsSection`) | BaseCard shell done |

Legacy hand-built tables removed 2026-06-13.

---

## Remaining phases

### Phase 1 — Cards — **Done**

- [x] Shared `MetricCard` + `BaseCard`
- [x] Dashboard home `MetricCardGrid` → shared `MetricCard` (animated)
- [x] `LivePerformanceGrid` → shared `MetricCard`
- [x] Class detail + audit cards → `BaseCard`

### Phase 3 — Badges — **Done**

- [x] Shared `StatusBadge` with category mappings
- [x] Mobile card lists use shared `StatusBadge` (Status Tracking, Schedule Alerts, Reschedule)

### Phase 4 — Layout + typography — **Done**

- [x] `PageContainer`, `PageHeader`, `SectionPanel`, `ActionButton` presets
- [x] All implemented views on `PageContainer`
- [x] Class audit → shared `PageHeader` + breadcrumbs
- [x] `/classes/[id]` and `/classes/new` → `PageContainer` + `PageHeader`
- [x] Typography pass on class detail card internals

### Phase 5 — Forms — **Done**

- [x] Promote `formFieldStyles.ts` to `src/components/ui/form/`

### Phase 6 — Enforcement — **Done**

- [x] Document in code review checklist
- [ ] Optional ESLint custom rules (deferred)

---

## Page migration matrix

| Route                           | PageContainer | PageHeader |   MetricCard    | AppDataGrid | BaseCard |
| ------------------------------- | :-----------: | :--------: | :-------------: | :---------: | :------: |
| `/dashboard`                    |      Yes      |     —      |       Yes       |     Yes     |    —     |
| `/students`                     |      Yes      |    Yes     |       Yes       |     Yes     |    —     |
| `/schedule/alerts`              |      Yes      |    Yes     |       Yes       |     Yes     |    —     |
| `/schedule/tracking/status`     |      Yes      |    Yes     |       Yes       |     Yes     |    —     |
| `/schedule/tracking/reschedule` |      Yes      |    Yes     |       Yes       |     Yes     |    —     |
| `/classes/[id]/audit`           |      Yes      |    Yes     |        —        |  Exception  |   Yes    |
| `/classes/[id]`                 |      Yes      |    Yes     | Yes (perf grid) |      —      |   Yes    |
| `/classes/new`                  |      Yes      |    Yes     |        —        |      —      |    —     |

---

## Bottom line

Phases **0–2 and card/header migration are complete** on all 9 implemented pages. Shared primitives are in `src/components/ui/`. Remaining work: mobile badge consolidation, forms layer, table token polish, and enforcement for the 28 pages yet to be built.
