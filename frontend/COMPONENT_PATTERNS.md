# Dashboard UI Component Patterns

**Last updated:** 2026-06-13  
**Status:** Phases 0–2 complete; card/header migration complete on implemented pages; typography standardized on class detail cards

This document defines the shared UI layer for Siraj dashboard pages. All new dashboard views **must** follow these patterns.

**Related docs:**

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — page rollout and workflow
- [AGENTS.md](AGENTS.md) — Dashboard UI Patterns (agent rules)
- [`.kiro/design-consistency-analysis.md`](.kiro/design-consistency-analysis.md) — original audit + progress
- [`.gemini/ui-consistency-analysis.md`](.gemini/ui-consistency-analysis.md) — findings + guidelines
- [`.cursor/plans/UI Pattern Analysis-d1994f10.plan.md`](.cursor/plans/UI%20Pattern%20Analysis-d1994f10.plan.md) — rollout plan + todos

---

## Architecture

```
DashboardLayout (pageMargin only)
  └── PageContainer (section gap — NO extra p: 2/3)
        ├── PageHeader (title, subtitle, breadcrumbs?, actions?)
        ├── MetricCard grid
        └── SectionPanel (title bar + actions)
              ├── AppDataGrid (desktop, ≥ md)
              └── *CardList (mobile, < md)
```

**Import from:** `@/frontend/components/ui`

---

## Layout

### PageContainer

- **Purpose:** Single content wrapper inside `DashboardLayout`. Fixes double-padding.
- **Rule:** Views must **not** add outer `p: 2`, `p: 3`, or `p: { xs: 2, md: 3 }`.
- **Spacing:** Uses `theme.layout.sectionGap` between child sections.

```tsx
<PageContainer>
  <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
  {/* sections */}
</PageContainer>
```

### PageHeader

- **Title:** `variant="headlineLg"` (use `titleVariant="headlineMd"` on mobile if needed)
- **Subtitle:** `variant="bodyLg"`
- **Actions:** Pass `FilterButton`, `PrimaryPageAction`, `ExportButton` presets
- **Breadcrumbs:** Optional `breadcrumbs` prop (see class audit `ClassAuditView`)

### SectionPanel

- **Purpose:** Bordered `Paper` with optional title bar and action slot
- **Use for:** Table sections, list sections with filter/export buttons
- **Children:** `AppDataGrid` (desktop) or card lists (mobile)

---

## Tables — AppDataGrid

**Default:** Use `@mui/x-data-grid` via [`AppDataGrid`](src/components/ui/AppDataGrid.tsx). Do **not** hand-build MUI `Table` for list pages.

### Wrapper features

- Themed headers (`palette.table.header`)
- Built-in pagination (client or server mode)
- Empty state overlay (`emptyMessage` prop)
- Loading overlay (`loading` prop)
- `disableRowSelectionOnClick` by default

### Page-specific DataGrid components

Place column definitions in `src/views/dashboard/<feature>/components/*DataGrid.tsx`:

| Component                    | Route                           | Pagination                         |
| ---------------------------- | ------------------------------- | ---------------------------------- |
| `StudentDirectoryDataGrid`   | `/students`                     | Client                             |
| `AcademicScheduleDataGrid`   | `/schedule/alerts`              | Server (`paginationMode="server"`) |
| `StatusTrackingDataGrid`     | `/schedule/tracking/status`     | Client                             |
| `RescheduleTrackingDataGrid` | `/schedule/tracking/reschedule` | Client                             |
| `ScheduleOverviewDataGrid`   | `/dashboard`                    | Client                             |

### Mobile strategy

- **Desktop (`≥ md`):** `AppDataGrid` inside `SectionPanel`
- **Mobile (`< md`):** Keep existing `*CardList` components — do not force DataGrid on small screens

### Exceptions (keep MUI Table)

- `RegisteredStudentsSection` on class audit — embedded 2/4-column section inside a card
- Style these tables to match `palette.table.header` tokens

---

## Cards

### BaseCard

Low-level wrapper enforcing `theme.layout.radius.card`, `theme.layout.cardPadding`, `theme.palette.border.light`, `theme.palette.shadow.card`.

Use for all class detail and audit section cards (e.g. `ClassInfoCard`, `MetadataCard`, `RegisteredStudentsSection` shell). Override with `sx={{ p: 0 }}` when the card has a custom header bar or table body.

### MetricCard

Use for all stat/metric displays. Variants: `default | error | highlight | danger | compact`. Optional `animated` for dashboard home.

```tsx
<MetricCard icon={Icon} label="Total Students" value={1284} variant="default" />
```

**Do not create** new per-feature metric card components.

Dashboard home uses [`MetricCardGrid`](../src/views/dashboard/reports/components/MetricCardGrid.tsx) wrapping shared `MetricCard` with `animated`. Class admin live metrics use shared `MetricCard` in [`LivePerformanceGrid`](../src/views/dashboard/classes/components/LivePerformanceGrid.tsx).

---

## Status badges

Use shared [`StatusBadge`](src/components/ui/StatusBadge.tsx):

```tsx
<StatusBadge category="studentAccount" status={row.accountStatus} label={label} />
<StatusBadge category="classSession" status="active" label={labels.active} />
<StatusBadge category="sessionTracking" status={row.status} label={label} icon={<BlockOutlined />} />
```

### Categories

| Category          | Use case                       | Palette mapping                                            |
| ----------------- | ------------------------------ | ---------------------------------------------------------- |
| `studentAccount`  | Student directory              | `palette.status.active / .pending / .blocked`              |
| `classSession`    | Schedule alerts session status | active → active, upcoming → pending, missed → blocked      |
| `classStatus`     | Dashboard schedule overview    | scheduled → confirmed, in_progress → active, etc.          |
| `sessionTracking` | Status tracking rows           | regular, suspended_pending, on_leave, pending_verification |
| `trackingStatus`  | Reschedule tracking            | rescheduled, pending_leave                                 |
| `session`         | Direct `palette.status` key    | Pass status key directly                                   |
| `enrollment`      | Enrollment labels              | `palette.status.active / .pending / .cancelled`            |

**Do not** use inline `Chip` with hardcoded colors for status display.

---

## Action buttons

Use presets from `@/frontend/components/ui`:

| Component           | Use case                                 |
| ------------------- | ---------------------------------------- |
| `PrimaryPageAction` | Contained page actions (Add, New Report) |
| `FilterButton`      | Outlined filter triggers                 |
| `ExportButton`      | Outlined export/download                 |

Table cell actions (approve/reject, join session) may use compact `Button` with `borderRadius: 1.5` until a `CompactTableAction` preset is added.

---

## Forms

Use shared form field styles from `@/frontend/components/ui/form`:

```tsx
import { labelSx, standardInputSx, outlinedInputSx } from "@/frontend/components/ui/form";

<Box component="label" sx={labelSx}>
  {label}
</Box>
<Input sx={standardInputSx} />
```

### Available styles

| Export                    | Use case                                |
| ------------------------- | --------------------------------------- |
| `labelSx`                 | Uppercase form field labels             |
| `standardInputSx`         | MUI Input variant with themed underline |
| `outlinedInputSx`         | Outlined inputs with `borderRadius: 3`  |
| `timeInputStandardSx`     | TimePicker standard variant             |
| `timeInputOutlinedSx`     | TimePicker outlined variant             |
| `durationBoxSx(isMobile)` | Custom duration input container         |
| `AppDatePicker`           | MUI DatePicker with Arabic localization |
| `AppTimePicker`           | MUI TimePicker with Arabic localization |

**Note on Date & Time Pickers**: Always use `AppDatePicker` or `AppTimePicker` from `@/frontend/components/ui/form` rather than manually configuring MUI pickers and `LocalizationProvider`. They automatically handle the Arabic localization mappings and provider wrapping.

---

## Typography

Use theme variants — avoid hardcoded `fontFamily` / `fontSize` in `sx`:

| Element       | Variant                                         |
| ------------- | ----------------------------------------------- |
| Page title    | `headlineLg` via `PageHeader`                   |
| Section title | `titleLg` via `SectionPanel`                    |
| Metric label  | `labelUppercase`                                |
| Body text     | `bodyMd` / `bodyLg`                             |
| Table headers | `labelUppercase` (via DataGrid theme overrides) |

---

## Theme tokens

Defined in [`src/providers/theme/types.ts`](src/providers/theme/types.ts):

```typescript
theme.layout.radius.card      // 3
theme.layout.radius.button    // 2
theme.layout.radius.badge     // 3
theme.layout.sectionGap       // 1.5rem
theme.layout.cardPadding      // 1.5rem
theme.typography.labelUppercase
theme.palette.table.header.background / .text
theme.palette.shadow.card
theme.palette.border.light
```

DataGrid overrides: `MuiDataGrid` in theme `components`.

---

## Page migration checklist

When building or refactoring a dashboard page:

- [ ] Wrap content in `PageContainer` (no extra outer padding)
- [ ] Add `PageHeader` with title + subtitle + actions
- [ ] Use `MetricCard` for stat rows
- [ ] Use `SectionPanel` for table/list sections
- [ ] Desktop table → feature `*DataGrid` wrapping `AppDataGrid`
- [ ] Mobile → existing or new `*CardList`
- [ ] Status cells → shared `StatusBadge`
- [ ] Pass i18n `noEntries` / `noClasses` to DataGrid `emptyMessage`
- [ ] Wire real pagination (no decorative prev/next buttons)

### Migrated pages (2026-06-13)

| Route                           | PageContainer | PageHeader | MetricCard                | AppDataGrid                |
| ------------------------------- | ------------- | ---------- | ------------------------- | -------------------------- |
| `/dashboard`                    | Yes           | —          | Yes (MetricCardGrid)      | ScheduleOverviewDataGrid   |
| `/students`                     | Yes           | Yes        | Yes                       | StudentDirectoryDataGrid   |
| `/schedule/alerts`              | Yes           | Yes        | Yes                       | AcademicScheduleDataGrid   |
| `/schedule/tracking/status`     | Yes           | Yes        | Yes                       | StatusTrackingDataGrid     |
| `/schedule/tracking/reschedule` | Yes           | Yes        | Yes                       | RescheduleTrackingDataGrid |
| `/classes/[id]/audit`           | Yes           | Yes        | —                         | — (embedded table)         |
| `/classes/[id]`                 | Yes           | Yes        | Yes (LivePerformanceGrid) | —                          |
| /classes/new                  | Yes           | Yes        | —                         | —                          |
| /parents                      | Yes           | Yes        | Yes                       | ParentsDataGrid            |

---

## Remaining work

1. Add RTL `localeText` to `AppDataGrid` when Arabic DataGrid labels are needed
2. ESLint custom rules (optional, deferred)
