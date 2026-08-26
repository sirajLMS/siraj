# Plan 4 — Session Event Audit Enhancement: Specifications

> Spec-driven-development plan for the Siraj Station LMS Session Event
> Audit "Full Reports" view observed in the customer reference video
> (room entry/exit tracking, status mapping, payroll column exposure).

---

## 1. Overview

The Siraj LMS already captures everything the reference video shows
in its session-event audit screen — the timestamps live on
`class_instances`:

| Video field           | Existing Siraj column                                  | Notes                                                                                       |
|-----------------------|---------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `openSessionTime`     | `class_instances.actual_start_at`                      | Room-entry timestamp (when the teacher joined the meeting).                                 |
| `endSessionTime`      | `class_instances.actual_end_at`                         | Room-exit timestamp (when the teacher left).                                                |
| `durationAssumed`     | `class_instances.scheduled_end_at - scheduled_start_at`| Scheduled duration in minutes; matches the existing `duration_minutes` column.             |
| `currentStatus`       | Derived from `execution_state` + `outcome`             | Mapped to one of: `open`, `end`, `Absent`, `absent_student`.                               |
| payroll fields        | Added by **Plan 3** (teacher-payroll-engine)            | `calculated_duration`, `teacher_paid_amount`, `calculation_status`, `is_partial_percentage`, `payroll_note`. |

This plan **does not add new database columns**. Its job is to:

1. **Expose** the existing data through a new GraphQL query layer
   (`sessionAuditReport`) and a derived-status mapper
   (`mapToSessionAuditStatus`).
2. **Render** a "Full Reports" grid view at `/accounting/reports`
   with one row per `class_instance`, showing the video-spec fields
   plus the payroll columns from Plan 3.
3. **Filter** the grid by teacher, student, date range, and
   `currentStatus` (the video's `open`/`end`/`Absent`/`absent_student`).
4. **Export** the filtered result to CSV for accounting's monthly
   reconciliation.
5. **Drill-down**: click a row to open the existing
   `/classes/[id]/audit` page (which Plan 3 extended with a Payroll
   Calculation card).

The video also references the `paid`/`unpaid` axis — that lives on
`class_instances.calculation_status` (Plan 3) and `teacher_dues.status`
(existing). This plan surfaces both in the grid.

---

## 2. Goals & Non-Goals

### Goals
1. Provide a single "Full Reports" view at `/accounting/reports`
   that exposes every session event (room entry/exit, status, payroll)
   without requiring the operator to jump between `/reports`,
   `/teacher-dues`, and `/classes/[id]/audit`.
2. Map the existing `execution_state` + `outcome` enums to the four
   video-spec `currentStatus` values (`open`, `end`, `Absent`,
   `absent_student`) in a single, well-tested mapper function so the
   rule lives in exactly one place.
3. Surface the Plan 3 payroll columns (`calculation_status`,
   `teacher_paid_amount`, etc.) in the same grid so accounting can
   audit both session telemetry and pay in one screen.
4. Filter by teacher, student, date range, and `currentStatus`; sort
   by any column; paginate server-side.
5. Export the filtered result to CSV (max 10 000 rows; truncation
   signaled via response header + UI toast).
6. Gate every read behind a dedicated `ACCOUNTING_REPORTS_VIEW`
   permission; gate the (small) admin action surface behind
   `ACCOUNTING_REPORTS_MANAGE`.

### Non-Goals (out of scope for this plan)
- New database columns (Plan 3 owns the only schema additions).
- Real-time room telemetry — the source of `actual_start_at` /
  `actual_end_at` is the existing in-app meeting join/leave webhook,
  owned by the meeting-adapter layer.
- Computing payroll amounts — owned by Plan 3's
  `PayrollCalculationService`. This plan only **renders** the
  pre-computed values.
- A new audit-log table — the existing `class_status_events` +
  `audit_logs` tables remain the source of truth for change history.
- Student-facing audit views (parents see session history via the
  existing `/students/history` portal).
- Per-session video playback / recording review (separate LMS plan).
- Bulk re-calculation across sessions (owned by Plan 3's backfill
  script).
- Notifications on session events (separate notification plan).

---

## 3. Glossary

| Term                          | Meaning                                                                                              |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **`openSessionTime`**          | Existing `class_instances.actual_start_at` — the room-entry timestamp.                              |
| **`endSessionTime`**            | Existing `class_instances.actual_end_at` — the room-exit timestamp.                                  |
| **`durationAssumed`**         | Scheduled minutes = `scheduled_end_at - scheduled_start_at` (mirrors `duration_minutes`).            |
| **`currentStatus`**           | Derived video-spec status: one of `open`, `end`, `Absent`, `absent_student`.                          |
| **`open`**                     | Session is currently running — `execution_state = RUNNING` (or `ACTIVATED` with `actual_start_at`).   |
| **`end`**                      | Session has ended normally — `execution_state = COMPLETED` AND `outcome = TAKEN`.                     |
| **`Absent`**                   | Teacher absence — `execution_state = COMPLETED` AND `outcome = ABSENT` AND `actual_start_at IS NULL`.|
| **`absent_student`**          | Student absence — `execution_state = COMPLETED` AND `outcome = ABSENT` AND `actual_start_at IS NOT NULL` (teacher joined, student did not). |
| **`isPaid`**                   | Derived boolean — `calculation_status = PAID` (Plan 3).                                              |
| **`isWaitingPaid`**           | Derived boolean — `calculation_status = WAITING_PAID` (Plan 3).                                       |
| **Drill-down**                | Clicking a grid row navigates to `/classes/[id]/audit`.                                              |
| **Session Audit Report row** | A denormalized projection of `class_instances` + `teachers` + `students` + `class_subjects` + Plan 3 payroll fields. |

---

## 4. User Stories & EARS Acceptance Criteria

EARS syntax used throughout:
- **Ubiquitous:** "The system shall <response>."
- **Event-driven:** "When <trigger>, the system shall <response>."
- **State-driven:** "While <state>, the system shall <response>."
- **Optional:** "Where <precondition>, the system shall <response>."
- **Unwanted:** "If <condition>, then the system shall <response>."

---

### US-1: Accounting operator opens the Full Reports page

**As an** accounting operator
**I want** to open a dedicated Full Reports page under the Accounting
section
**So that** I can audit session events (room entry/exit, status, pay)
in a single screen.

#### Acceptance Criteria (EARS)

- **AC-1.1 (Ubiquitous)** The system shall expose a route at
  `/accounting/reports` that renders the Session Audit Full Reports
  page.
- **AC-1.2 (Event-driven)** When the user navigates to
  `/accounting/reports` without the `ACCOUNTING_REPORTS_VIEW`
  permission, the system shall render a 403 / insufficient-permissions
  state and shall **not** execute any audit query.
- **AC-1.3 (State-driven)** While the user holds the
  `ACCOUNTING_REPORTS_VIEW` permission, the system shall render a
  paginated MUI `DataGrid` of class instances with columns: scheduled
  date, teacher, student, subject, `openSessionTime`, `endSessionTime`,
  `durationAssumed`, `currentStatus`, `calculatedDuration`,
  `teacherPaidAmount` + currency, `calculationStatus`, and (when
  `ACCOUNTING_REPORTS_MANAGE` is held) a per-row "Open audit page"
  action.
- **AC-1.4 (Event-driven)** When the user applies a filter (teacher,
  student, date range, `currentStatus`), the system shall debounce the
  input by 300 ms and refetch with the new variables, preserving the
  current page size but resetting to page 1.
- **AC-1.5 (Event-driven)** When the sidebar renders for a user with
  `ACCOUNTING_REPORTS_VIEW`, the system shall show a "Full Reports"
  item under the `grp_reports` group with the `assessment` icon and
  href `/accounting/reports`.
- **AC-1.6 (Event-driven)** When the user clicks "Export CSV", the
  system shall download the currently-filtered result set (max 10 000
  rows) as a UTF-8 CSV file with one row per session event.

---

### US-2: Status mapping from `executionState` + `outcome`

**As a** system
**I want** a single, well-tested mapper that converts the existing
`execution_state` + `outcome` pair into the video-spec `currentStatus`
**So that** the grid renders consistent labels and the rule is not
duplicated across the codebase.

#### Acceptance Criteria (EARS)

- **AC-2.1 (Ubiquitous)** The system shall expose a single function
  `mapToSessionAuditStatus(executionState, outcome, actualStartAt)` →
  one of `"open" | "end" | "Absent" | "absent_student"` (literal string
  values matching the video spec).
- **AC-2.2 (Event-driven)** When `execution_state IN (RUNNING,
  ACTIVATED)` AND `actual_start_at IS NOT NULL`, the mapper shall
  return `"open"`.
- **AC-2.3 (Event-driven)** When `execution_state = COMPLETED` AND
  `outcome = TAKEN`, the mapper shall return `"end"`.
- **AC-2.4 (Event-driven)** When `execution_state = COMPLETED` AND
  `outcome = ABSENT` AND `actual_start_at IS NULL`, the mapper shall
  return `"Absent"` (teacher absence — the teacher never joined).
- **AC-2.5 (Event-driven)** When `execution_state = COMPLETED` AND
  `outcome = ABSENT` AND `actual_start_at IS NOT NULL`, the mapper
  shall return `"absent_student"` (student absence — the teacher
  joined, the student did not).
- **AC-2.6 (Event-driven)** When `execution_state = COMPLETED` AND
  `outcome = LEAVE`, the mapper shall return `"absent_student"` (a
  student-initiated leave is treated as student absence for pay
  purposes — the teacher showed up).
- **AC-2.7 (Unwanted)** If `execution_state = NOT_ACTIVATED` or any
  `ON_DEMAND_*` state that does not match the above rules, the mapper
  shall return `"open"` (sessions that never started are treated as
  still-open from the audit perspective).
- **AC-2.8 (Event-driven)** When the mapper runs on a row whose
  `outcome = CANCELLED` or `RESCHEDULED`, the mapper shall return
  `"open"` (these are not real terminal states for pay purposes).
- **AC-2.9 (Ubiquitous)** The system shall expose the mapper as a
  pure function in `shared/constants/...` so both server (Pothos
  resolver) and client (Storybook fixtures, unit tests) can use the
  same rule without a circular import.
- **AC-2.10 (Event-driven)** When the grid renders a row, the system
  shall display a colored `Chip` per status: `open` = blue, `end` =
  green, `Absent` = red, `absent_student` = amber.

---

### US-3: Grid row exposes room entry/exit + durations

**As an** accounting operator
**I want** every grid row to show when the teacher entered the room,
when they left, the scheduled duration, and the calculated duration
**So that** I can spot sessions where the teacher was late or left
early.

#### Acceptance Criteria (EARS)

- **AC-3.1 (Ubiquitous)** The system shall render the `openSessionTime`
  column from `class_instances.actual_start_at`, formatted in the
  user's locale + timezone.
- **AC-3.2 (Ubiquitous)** The system shall render the `endSessionTime`
  column from `class_instances.actual_end_at`, formatted in the user's
  locale + timezone.
- **AC-3.3 (Ubiquitous)** The system shall render the `durationAssumed`
  column from `scheduled_end_at - scheduled_start_at` (minutes), as
  an integer.
- **AC-3.4 (Ubiquitous)** The system shall render the
  `calculatedDuration` column from `class_instances.calculated_duration`
  (Plan 3); when null, the cell shall display "—" (em dash).
- **AC-3.5 (Event-driven)** When `actual_start_at` is null, the cell
  shall display "Not joined" in muted text and the row's
  `currentStatus` shall reflect `Absent` or `open` per the mapper.
- **AC-3.6 (Event-driven)** When `actual_end_at` is null but
  `actual_start_at` is set, the cell shall display "In progress" in
  muted text and the `currentStatus` shall reflect `open`.
- **AC-3.7 (Event-driven)** When the operator hovers over a
  `openSessionTime` or `endSessionTime` cell, the system shall render
  a tooltip showing the raw UTC timestamp + the IANA timezone of the
  student's booking timezone snapshot.

---

### US-4: Filters by teacher / student / date range / status

**As an** accounting operator
**I want** to filter the grid by teacher, student, date range, and
`currentStatus`
**So that** I can drill into a specific slice of sessions.

#### Acceptance Criteria (EARS)

- **AC-4.1 (Ubiquitous)** The system shall render a filter bar above
  the grid with: teacher autocomplete, student autocomplete, date-range
  picker, `currentStatus` multi-select, and a free-text search input.
- **AC-4.2 (Event-driven)** When the operator selects a teacher, the
  grid shall refetch with `filter.teacherId = <id>` and reset to page 1.
- **AC-4.3 (Event-driven)** When the operator selects a date range, the
  grid shall filter on `scheduled_start_at` between `dateFrom` 00:00
  and `dateTo` 23:59 in the user's timezone.
- **AC-4.4 (Event-driven)** When the operator selects one or more
  `currentStatus` values, the grid shall fetch with
  `filter.currentStatuses = [...]` and the server shall apply the
  inverse of the `mapToSessionAuditStatus` mapper (i.e., expand
  `"Absent"` into the matching `execution_state` + `outcome` +
  `actual_start_at IS NULL` SQL predicate).
- **AC-4.5 (Event-driven)** When the operator types into the free-text
  search, the system shall debounce by 300 ms and match against teacher
  name + student name (case-insensitive `ILIKE`).
- **AC-4.6 (Event-driven)** When the operator clicks "Clear filters",
  the system shall reset every filter to its default (last 30 days,
  no teacher, no student, all statuses, empty search) and refetch.
- **AC-4.7 (State-driven)** While the filter bar holds any non-default
  state, the system shall render a "Clear filters" affordance;
  otherwise it shall be hidden.

---

### US-5: Sorting + pagination

**As an** accounting operator
**I want** to sort by any column and paginate server-side
**So that** I can scan large result sets without loading everything
at once.

#### Acceptance Criteria (EARS)

- **AC-5.1 (Ubiquitous)** The system shall support sorting on every
  rendered column except `payrollNote` (free text).
- **AC-5.2 (Event-driven)** When the operator clicks a sortable column
  header, the system shall toggle asc/desc and refetch with the new
  `sort` variable.
- **AC-5.3 (Ubiquitous)** The system shall paginate server-side with a
  default page size of 50 and a max of 200; page-size selector exposes
  25 / 50 / 100 / 200.
- **AC-5.4 (Event-driven)** When the operator changes the page size,
  the system shall reset to page 1 and refetch.
- **AC-5.5 (Unwanted)** If the operator requests a page beyond the last
  (e.g., `offset > totalCount`), the system shall clamp to the last
  page and refetch.

---

### US-6: Payroll columns from Plan 3

**As an** accounting operator
**I want** the grid to also show the Plan 3 payroll columns
**So that** I can audit session telemetry and pay in one screen.

#### Acceptance Criteria (EARS)

- **AC-6.1 (Ubiquitous)** The system shall render the
  `calculatedDuration` column (Plan 3) and the `teacherPaidAmount` +
  `teacherPaidCurrency` columns (Plan 3) on every row.
- **AC-6.2 (Ubiquitous)** The system shall render the
  `calculationStatus` column (Plan 3) as a colored `Chip` per the
  Plan 3 status-chip component spec.
- **AC-6.3 (Event-driven)** When `calculationStatus = PARTIALLY`
  (Plan 3), the system shall render the `isPartialPercentage` value
  next to the chip (e.g., "Partially · 50%").
- **AC-6.4 (Event-driven)** When `calculationStatus = PAID`, the
  system shall render a green check icon in the cell and link the
  `teacher_dues` row via a hover tooltip showing the payment date.
- **AC-6.5 (Optional)** Where the row has a `payrollNote` (Plan 3),
  the system shall render a small note icon in the row's trailing cell
  and show the full note in a hover popover.
- **AC-6.6 (Event-driven)** When the operator clicks the
  `calculationStatus` chip on a row, the system shall navigate to
  `/classes/[id]/audit` (the existing audit drawer page that Plan 3
  extended with a Payroll Calculation card).

---

### US-7: Permission gating

**As a** security-conscious platform
**I want** every audit operation to require a dedicated permission
**So that** only authorized accounting staff can read or drill into
session events.

#### Acceptance Criteria (EARS)

- **AC-7.1 (Ubiquitous)** The system shall require the
  `ACCOUNTING_REPORTS_VIEW` permission for: viewing
  `/accounting/reports`, calling the `sessionAuditReport` query, and
  exporting CSV.
- **AC-7.2 (Ubiquitous)** The system shall require the
  `ACCOUNTING_REPORTS_MANAGE` permission for: the per-row "Override"
  action shortcut (which deep-links into the audit drawer's Payroll
  card with the override dialog pre-opened).
- **AC-7.3 (Event-driven)** When a user without
  `ACCOUNTING_REPORTS_VIEW` calls the `sessionAuditReport` query, the
  system shall reject with an `INSUFFICIENT_PERMISSIONS` GraphQL error
  and shall not execute the underlying query.
- **AC-7.4 (Event-driven)** When a user without
  `ACCOUNTING_REPORTS_MANAGE` clicks the row's "Override" shortcut,
  the system shall navigate to the audit page but shall hide the
  Override button (the existing per-page permission gating on
  `/classes/[id]/audit` then takes over).

---

### US-8: CSV export

**As an** accounting operator
**I want** to export the filtered result to CSV
**So that** I can run monthly reconciliation in Excel.

#### Acceptance Criteria (EARS)

- **AC-8.1 (Ubiquitous)** The system shall expose a CSV export route at
  `GET /api/accounting/reports/export` that mirrors the
  `sessionAuditReport` query filters.
- **AC-8.2 (Event-driven)** When the operator clicks "Export CSV",
  the system shall issue a `GET` request to the export route with the
  current filters serialized as query parameters.
- **AC-8.3 (Ubiquitous)** The CSV shall have a header row with the
  same column order as the grid, plus extra columns: `teacherId`,
  `studentId`, `classInstanceId` (so accounting can join back to the
  internal IDs).
- **AC-8.4 (Event-driven)** When the result set exceeds 10 000 rows,
  the system shall cap at 10 000, set the
  `X-Export-Truncated: true` response header, and the UI shall show a
  toast warning that the export was truncated.
- **AC-8.5 (Event-driven)** When the export route receives an
  unauthenticated request, the system shall return 401.
- **AC-8.6 (Event-driven)** When the export route receives an
  authenticated request without `ACCOUNTING_REPORTS_VIEW`, the system
  shall return 403.

---

### US-9: Drill-down to existing audit page

**As an** accounting operator
**I want** to click a row to open the existing audit page
**So that** I can see the full session history, communications, and
(now Plan 3) payroll override history.

#### Acceptance Criteria (EARS)

- **AC-9.1 (Event-driven)** When the operator clicks anywhere on a
  grid row (except the action cells), the system shall navigate to
  `/classes/[instanceId]/audit`.
- **AC-9.2 (Event-driven)** When the operator clicks the
  "Open audit page" row action (gated on
  `ACCOUNTING_REPORTS_MANAGE`), the system shall navigate to
  `/classes/[instanceId]/audit?openOverride=1` so the audit drawer's
  Payroll card opens the Override dialog automatically (Plan 3
  reads the `openOverride` query param).
- **AC-9.3 (Ubiquitous)** The system shall preserve the current
  filter state in the URL query string so the operator can use the
  browser's back button to return to the same filtered grid view.

---

## 5. Edge Cases

| # | Edge case                                                                                | Expected behavior                                                                                                                                              |
|---|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1 | Row's `actual_start_at` is null + `execution_state = NOT_ACTIVATED`.                     | `currentStatus = "open"`; `openSessionTime` cell shows "Not joined" in muted text.                                                                              |
| E2 | Row's `actual_start_at` is null + `execution_state = COMPLETED` + `outcome = ABSENT`.    | `currentStatus = "Absent"`; payroll column from Plan 3 shows `calculatedDuration = 0`, `teacherPaidAmount = 0.00`.                                              |
| E3 | Row's `actual_start_at` is set + `actual_end_at` is null.                                | `currentStatus = "open"`; `endSessionTime` cell shows "In progress" in muted text; payroll columns remain `NOT_CALCULATED` (the calculator waits for `COMPLETED`). |
| E4 | Row's `execution_state = COMPLETED` + `outcome = LEAVE`.                                  | `currentStatus = "absent_student"`; payroll column shows full scheduled pay (Plan 3 AC-4.E13).                                                                  |
| E5 | Filter `currentStatuses = ["Absent"]` returns zero rows.                                 | The grid shows the empty state with the filter chip "Absent" so the operator can clear it.                                                                      |
| E6 | Operator sorts by `teacherPaidAmount` on a result set where most rows have null amounts.  | Null amounts sort as "smallest" ascending (Postgres default); descending puts them last.                                                                         |
| E7 | CSV export on a date-range filter with `dateFrom > dateTo`.                              | Server returns 400 with a clear validation error; UI shows an inline error on the date-range picker.                                                            |
| E8 | Two operators concurrently filter the same teacher; one exports CSV.                      | Each gets their own filtered export; no cross-operator interference.                                                                                            |
| E9 | Operator opens `/accounting/reports?teacherId=<id>&status=Absent` directly via URL.     | The filter bar pre-populates from the URL query params; the grid fetches with those filters on first render (AC-9.3).                                          |
| E10| Operator navigates to `/accounting/reports` then clicks browser back from the audit page.| The grid restores the previous filter state from the URL query string (AC-9.3).                                                                                |
| E11| Row's `actual_start_at` is before `scheduled_start_at` (teacher joined early).           | `openSessionTime` cell shows the earlier timestamp verbatim; `currentStatus = "open"` or `"end"` per the mapper.                                                |
| E12| Row's `actual_end_at` is after `scheduled_end_at` (teacher left late).                    | `endSessionTime` cell shows the later timestamp verbatim; the `calculatedDuration` cell caps at `scheduled_end_at` (Plan 3 rule AC-3.9).                       |
| E13| `teacherPaidCurrency` differs from the operator's display currency.                      | The grid renders the amount + currency code as-is (no FX conversion in this plan); a future enhancement may add a display-currency toggle.                     |
| E14| CSV export exceeds 10 000 rows.                                                           | Server caps at 10 000; `X-Export-Truncated: true` header; UI toast warns.                                                                                       |
| E15| `payrollNote` exceeds 200 chars in the CSV.                                              | CSV cell wraps in quotes and preserves the full note (CSV escaping handles it); the grid's hover popover shows the first 200 chars with ellipsis + tooltip "View full" on click. |
| E16| RTL / Arabic locale active.                                                              | All labels, status chips, and filter inputs render RTL; the date-range picker mirrors LTR layout.                                                              |
| E17| Operator has `ACCOUNTING_REPORTS_VIEW` but not `_MANAGE`.                                 | Grid renders read-only; "Open audit page" row action hidden; the row-click still navigates to the audit page (which itself gates the Override button).          |
| E18| Session is soft-deleted between filter open and CSV export.                              | Server excludes soft-deleted rows from the export; the row count in the CSV may differ from the displayed grid by the count of newly-deleted rows.            |
| E19| Operator's locale timezone differs from the student's booking timezone.                  | `openSessionTime` / `endSessionTime` render in the operator's locale timezone (per AC-3.1); the tooltip shows the raw UTC + student's booking timezone (AC-3.7). |
| E20| `execution_state = ON_DEMAND_NO_CREDITS_ABSENT` (student never confirmed an on-demand class). | `currentStatus = "Absent"` if `actual_start_at IS NULL`, else `"absent_student"`; payroll column reflects Plan 3's on-demand-aware calculation.                |

---

## 6. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                          |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | Performance     | The `/accounting/reports` grid shall render its first paint in < 1.5 s on a 1 000-session dataset (server + network).                                              |
| NFR-2  | Performance     | The `sessionAuditReport` query shall return a 50-row page in < 400 ms p95 (single joined query, server-side filter).                                                |
| NFR-3  | Performance     | The CSV export route shall serialize 10 000 rows in < 3 s p95.                                                                                                       |
| NFR-4  | Concurrency     | Multiple concurrent operator queries with different filters shall not interfere; each gets its own transaction snapshot.                                            |
| NFR-5  | Security        | All reads shall be authenticated and permission-scoped; the export route shall re-check the permission server-side (not trust the UI).                              |
| NFR-6  | Auditability   | The grid is read-only at the data layer; no writes occur. Drill-down writes (overrides) are owned by Plan 3 and emit their own audit events.                       |
| NFR-7  | i18n            | All user-facing strings (page title, column headers, status chips, filter labels, toasts, errors) shall be available in EN and AR via the compile-time i18n pipeline.|
| NFR-8  | Accessibility   | The DataGrid, filter bar, status chips, and CSV button shall be keyboard-navigable and labelled for screen readers (WCAG 2.1 AA).                                  |
| NFR-9  | Data integrity  | The grid reads from a single SQL projection; no N+1 queries for teacher/student/subject names.                                                                     |
| NFR-10 | Compatibility  | This plan introduces **zero** schema migrations. It depends on Plan 3's schema being applied first (the 8 new payroll columns on `class_instances`).              |
| NFR-11 | Observability  | Every query + export shall emit a structured log event with `actorUserId`, `filters`, `limit`, `offset`, and `rowCount`.                                            |
| NFR-12 | URL-state      | The current filter + sort + pagination state shall be reflected in the URL query string so the operator can bookmark / share / restore a specific view.            |

---

## 7. Traceability Matrix

| AC        | Covered by implementation section                              | Test file                                                                |
|-----------|----------------------------------------------------------------|--------------------------------------------------------------------------|
| AC-1.x    | Frontend › Routes & Navigation                                | `frontend/common/views/dashboard/accounting/reports/SessionAuditReportsContainer.test.tsx`                                    |
| AC-2.x    | Service › `mapToSessionAuditStatus` mapper                     | `shared/constants/classes/session-audit-status.test.ts`                                    |
| AC-3.x    | Frontend › DataGrid columns + Formatters                       | `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.test.tsx`                                          |
| AC-4.x    | Frontend › FilterBar + Backend › query filter                  | `frontend/common/views/dashboard/accounting/reports/SessionAuditFilterBar.test.tsx` + `backend/graphql/query/accounting/session-audit.query.test.ts`         |
| AC-5.x    | Frontend › DataGrid sort/paginate + Backend › pagination      | `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.test.tsx`                                          |
| AC-6.x    | Frontend › Payroll columns integration                        | `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.test.tsx` › "payroll columns"                      |
| AC-7.x    | GraphQL › `requirePermission` + route middleware                | `backend/graphql/query/accounting/session-audit.query.test.ts` › "permission denied"                     |
| AC-8.x    | Backend › `/api/accounting/reports/export` route               | `app/api/accounting/reports/export/route.test.ts`                                            |
| AC-9.x    | Frontend › Row click → `/classes/[id]/audit`                   | `frontend/common/views/dashboard/accounting/reports/SessionAuditDataGrid.test.tsx` › "drill-down"                            |

---

## 8. Open Questions

| # | Question                                                                                                                | Status | Default assumed                                                          |
|---|-------------------------------------------------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------|
| Q1 | Should the `currentStatus` mapper return `"open"` for `NOT_ACTIVATED` or a fifth value like `"pending"`?                | Open   | `"open"` in v1 — the audit view treats not-yet-started sessions as "still open". A future enhancement may add `"pending"`. |
| Q2 | Should the grid show the operator's locale timezone or the student's booking timezone in the `openSessionTime` cell?     | Open   | Operator's locale timezone in the cell; raw UTC + student's booking timezone in the tooltip (AC-3.7). |
| Q3 | Should the CSV export include the operator's name + timestamp on every row, or only the latest override?                | Open   | No — the CSV is a snapshot of session events; the override history is available via the audit drawer (Plan 3). |
| Q4 | Should the filter bar support saving "favorite filters" per operator?                                                    | Open   | No — out of scope for v1; the URL-state mechanism (AC-9.3) lets operators bookmark filters manually. |
| Q5 | Should the grid show a "live" indicator when a session is currently `RUNNING` (i.e., `actual_start_at` set + `actual_end_at` null)? | Open   | Yes — the `currentStatus = "open"` chip is rendered with a pulse animation when the session is `RUNNING` and the row is within the last 24 hours. |
| Q6 | Should the export support XLSX in addition to CSV?                                                                       | Open   | CSV only in v1; XLSX is deferred (the existing reports module owns XLSX if/when needed). |
