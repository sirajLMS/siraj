# Plan 3 — Teacher Payroll Calculation Engine: Specifications

> Spec-driven-development plan for the Siraj Station LMS Teacher Payroll
> Calculation Engine observed in the customer reference video (grace-period
> logic, late-entry pro-rating, admin override matrix, configurable settings).

---

## 1. Overview

The Siraj LMS already captures everything needed to compute teacher pay on a
per-`class_instances` basis: `scheduledStartAt`, `scheduledEndAt`,
`actualStartAt` (room-entry timestamp), `actualEndAt` (room-exit timestamp),
`executionState`, `outcome`, the rate snapshot (`rateAmount`, `rateCurrency`,
`rateSource`), and the teacher's own `teachers.hourlyRate` /
`teachers.rateCurrency`.

What the platform **does not yet have** is the **calculation layer** that
turns those raw timestamps into a billable amount with the rules shown in the
reference video:

1. **Grace period** — small lateness is forgiven so the teacher is still
   paid for the full scheduled duration.
   - 3-minute grace when `scheduled duration ≤ 30 min`.
   - 6-minute grace when `scheduled duration > 30 min`.
2. **On-time entry** → teacher paid for the full scheduled duration.
3. **Late entry beyond the grace window** → pay is pro-rated by the actual
   minutes the teacher was present.
4. **Student absence** (`outcome = ABSENT`, alias `absent_student`) →
   teacher is paid in **full** for the scheduled duration (the teacher
   showed up; the student did not).
5. **Teacher absence** (`outcome = ABSENT` with `executionState = COMPLETED`
   but `actualStartAt IS NULL`) → teacher is paid **zero**.
6. **Admin override matrix** — an accounting operator can override the
   calculated amount with one of: `Refund` (force 0), `Calculated`
   (re-run the formula), `Not Calculated` (skip; amount kept null),
   `Partially` (apply a percentage of the calculated amount).
7. **`CalculationStatus` enum** — `Not Calculated`, `Calculated`,
   `Partially`, `Refund`, `Waiting Paid`, `Paid`. Tracks the lifecycle
   from raw calculation through final settlement against
   `teacher_dues` / `teacher_payments`.
8. **Configurable grace-period thresholds** — stored in the existing
   `system_settings` table, not hardcoded, so an admin can tune
   `payroll.grace_short_minutes`, `payroll.grace_long_minutes`,
   `payroll.grace_threshold_minutes` without a redeploy.

This plan **extends** the existing `class_instances` table with payroll
metadata columns and adds a new `PayrollCalculationService` — it does
**not** fork the rate-resolver, teacher-dues, or teacher-payments
modules. The calculated amount produced here is the **input** to the
existing `teacher_dues` accrual flow (when a lesson report is approved).

---

## 2. Goals & Non-Goals

### Goals
1. Compute `calculatedDuration` (minutes) and `teacherPaidAmount` +
   `teacherPaidCurrency` for every `COMPLETED` class instance, applying
   the grace-period and outcome rules from the video.
2. Persist the result plus a `calculationStatus` enum and an optional
   `payrollNote` on `class_instances` itself (single source of truth).
3. Allow an accounting operator to override the calculation per
   instance via four discrete modes (Refund / Calculated /
   Not Calculated / Partially with a percentage).
4. Expose a "Full Reports" payroll page at `/accounting/payroll`
   filterable by teacher, student, date range, and calculation status,
   with per-row totals and CSV export.
5. Move the grace-period thresholds out of code and into
   `system_settings` so accounting can tune them at runtime.
6. Gate every mutation behind a dedicated `ACCOUNTING_PAYROLL_MANAGE`
   permission and every read behind `ACCOUNTING_PAYROLL_VIEW`.
7. Emit a structured audit-log entry on every override so the trail is
   reconstructible from `class_status_events` + `audit_logs` alone.

### Non-Goals (out of scope for this plan)
- Disbursing cash to teachers — that is the existing
  `teacher_payments` + `teacher_dues` flow. This plan only computes
  the **amount** that will eventually flow into `teacher_dues` when
  a lesson report is approved.
- Tax / VAT / withholding calculation (separate finance plan).
- Multi-currency conversion at payout time (handled by the existing
  FX module when `teacher_dues.currency != teacher_payments.currency`).
- Real-time room telemetry / webinar attendance feeds — the source
  of `actualStartAt` / `actualEndAt` is the existing in-app meeting
  join/leave webhook, owned by the meeting-adapter layer.
- Bulk retroactive recalculation across historical sessions (a one-shot
  backfill script is documented in `implementation.md` §2.6 but executed
  out-of-band by accounting, not by this plan's runtime code).
- The "Full Reports" session-event audit grid view — that is
  **Plan 4** (`session-event-audit`). This plan produces the
  **columns** Plan 4 renders.

---

## 3. Glossary

| Term                          | Meaning                                                                                              |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **Scheduled duration**        | `scheduledEndAt - scheduledStartAt`, in minutes. Pre-existing column `durationMinutes` mirrors it. |
| **Actual duration**           | `actualEndAt - actualStartAt`, in minutes. Computed on the fly, not persisted.                       |
| **Grace period**               | A configurable number of minutes of lateness that is forgiven — the teacher is paid as if on-time.  |
| **Short-session grace**       | Grace threshold applied when scheduled duration ≤ `payroll.grace_threshold_minutes` (default 30).    |
| **Long-session grace**        | Grace threshold applied when scheduled duration > `payroll.grace_threshold_minutes`.                 |
| **Late entry**                | `actualStartAt - scheduledStartAt > grace`, i.e. the teacher joined after the grace window elapsed.   |
| **`calculatedDuration`**      | Persisted minutes the teacher is owed for, after applying grace / outcome / pro-rating rules.        |
| **`teacherPaidAmount`**       | Persisted monetary amount owed to the teacher = `calculatedDuration / 60 * effectiveHourlyRate`.     |
| **`teacherPaidCurrency`**     | Snapshot of `rateCurrency` (or `teachers.rateCurrency` fallback) at calculation time.                |
| **`calculationStatus`**       | Enum tracking lifecycle: `NOT_CALCULATED`, `CALCULATED`, `PARTIALLY`, `REFUND`, `WAITING_PAID`, `PAID`. |
| **`isPartialPercentage`**     | Nullable integer 0–100, set only when `calculationStatus = PARTIALLY`. The applied percentage.        |
| **`payrollNote`**             | Free-text operator note captured at override time. Optional, sanitized plain text.                   |
| **Effective rate**            | Resolved via the existing `rate-resolver.service.ts` precedence: `RECURRING > SUBJECT > TEACHER`.    |
| **Override**                  | An operator action that replaces the auto-calculated amount with one of the four modes.              |

---

## 4. User Stories & EARS Acceptance Criteria

EARS syntax used throughout:
- **Ubiquitous:** "The system shall <response>."
- **Event-driven:** "When <trigger>, the system shall <response>."
- **State-driven:** "While <state>, the system shall <response>."
- **Optional:** "Where <precondition>, the system shall <response>."
- **Unwanted:** "If <condition>, then the system shall <response>."

---

### US-1: Accounting operator opens the Payroll Reports page

**As an** accounting operator
**I want** to open a dedicated Payroll Reports page under the Accounting
section
**So that** I can audit, override, and export per-session teacher pay
calculations.

#### Acceptance Criteria (EARS)

- **AC-1.1 (Ubiquitous)** The system shall expose a route at
  `/accounting/payroll` that renders the Payroll Reports page.
- **AC-1.2 (Event-driven)** When the user navigates to `/accounting/payroll`
  without the `ACCOUNTING_PAYROLL_VIEW` permission, the system shall
  render a 403 / insufficient-permissions state and shall **not** execute
  any payroll query.
- **AC-1.3 (State-driven)** While the user holds the
  `ACCOUNTING_PAYROLL_VIEW` permission, the system shall render a paginated
  MUI `DataGrid` of class instances with columns: scheduled date, teacher,
  student, subject, scheduled duration, actual duration, calculated
  duration, paid amount + currency, calculation status, and (when
  `ACCOUNTING_PAYROLL_MANAGE` is held) a per-row "Override" action.
- **AC-1.4 (Event-driven)** When the user applies a filter (teacher,
  student, date range, or status), the system shall debounce the input
  by 300 ms and refetch with the new variables, preserving the current
  page size but resetting to page 1.
- **AC-1.5 (Event-driven)** When the sidebar renders for a user with
  `ACCOUNTING_PAYROLL_VIEW` or `ACCOUNTING_PAYROLL_MANAGE`, the system
  shall show a "Payroll" item under the `grp_finance` group with the
  `payments` icon and href `/accounting/payroll`.
- **AC-1.6 (Event-driven)** When the user clicks "Export CSV", the system
  shall download the currently-filtered result set (max 10 000 rows) as
  a UTF-8 CSV file with one row per class instance.

---

### US-2: Auto-calculation runs when a session reaches a terminal state

**As a** system
**I want** the payroll calculator to run automatically when a class
instance transitions into `COMPLETED` or any of the terminal
`ON_DEMAND_*` states
**So that** every payable session has a `calculatedDuration` and
`teacherPaidAmount` without an operator needing to trigger it manually.

#### Acceptance Criteria (EARS)

- **AC-2.1 (Event-driven)** When a class instance transitions to
  `executionState = COMPLETED` (via the existing `SchedulingService`
  state-machine), the system shall invoke
  `PayrollCalculationService.calculateForInstance(instanceId, actorUserId)`
  in the **same database transaction** as the state transition.
- **AC-2.2 (Event-driven)** When a class instance transitions to any
  `ON_DEMAND_*` terminal state, the system shall invoke the same
  calculator with a flag indicating the on-demand context (so
  `outcome = ABSENT` is treated as `absent_student` rather than
  teacher absence).
- **AC-2.3 (State-driven)** While the existing `class_instances_state_machine_chk`
  constraint prevents `outcome = TAKEN` without `actualStartAt`, the
  calculator shall treat a `COMPLETED + TAKEN` instance as **on-time**
  when `actualStartAt <= scheduledStartAt + grace`.
- **AC-2.4 (Event-driven)** When the calculator succeeds, the system
  shall set `calculationStatus = CALCULATED`, populate
  `calculatedDuration`, `teacherPaidAmount`, `teacherPaidCurrency`,
  and clear `isPartialPercentage` + `payrollNote` (unless an existing
  override is in place — see US-6).
- **AC-2.5 (Unwanted)** If the calculator throws (e.g. rate resolution
  fails), the system shall set `calculationStatus = NOT_CALCULATED`,
  leave amount columns null, persist `payrollNote = "Auto-calc failed: <reason>"`,
  and **shall not** roll back the state transition itself (the session
  is still `COMPLETED`; pay is reconciled later via US-6).
- **AC-2.6 (Event-driven)** When a session is later edited (e.g.
  `actualStartAt` corrected via the audit page), the system shall
  re-run the calculator only if `calculationStatus IN (CALCULATED,
  NOT_CALCULATED)`; sessions in `PARTIALLY`, `REFUND`, `WAITING_PAID`,
  or `PAID` are never auto-recalculated (operator must explicitly
  reset to `CALCULATED` first via US-6).

---

### US-3: Grace-period logic — on-time entry pays full scheduled duration

**As a** teacher
**I want** small lateness to be forgiven
**So that** joining the room 1–3 minutes late does not dock my pay.

#### Acceptance Criteria (EARS)

- **AC-3.1 (Ubiquitous)** The system shall resolve the grace thresholds
  from `system_settings` at calculation time, defaulting to 3 (short) and
  6 (long) when the settings are absent.
- **AC-3.2 (Event-driven)** When `actualStartAt` is null and
  `outcome = ABSENT`, the system shall apply the **student-absence rule**
  (US-4) instead of the grace-period logic.
- **AC-3.3 (Event-driven)** When `actualStartAt` is null and
  `outcome != ABSENT`, the system shall apply the **teacher-absence rule**
  (US-5).
- **AC-3.4 (State-driven)** While `scheduledDurationMinutes <=
  payroll.grace_threshold_minutes` (default 30), the system shall use
  `payroll.grace_short_minutes` (default 3) as the grace threshold.
- **AC-3.5 (State-driven)** While `scheduledDurationMinutes >
  payroll.grace_threshold_minutes`, the system shall use
  `payroll.grace_long_minutes` (default 6) as the grace threshold.
- **AC-3.6 (Event-driven)** When
  `actualStartAt <= scheduledStartAt + grace`, the system shall set
  `calculatedDuration = scheduledDurationMinutes` (full pay).
- **AC-3.7 (Event-driven)** When `actualStartAt > scheduledStartAt + grace`
  (late entry beyond grace), the system shall compute
  `calculatedDuration = max(0, scheduledEndAt - actualStartAt)` in
  minutes — i.e. pro-rate from the actual join time to the scheduled end.
- **AC-3.8 (Unwanted)** If `actualStartAt > scheduledEndAt` (teacher
  joined after the session window closed), the system shall set
  `calculatedDuration = 0` and `teacherPaidAmount = 0` but keep
  `calculationStatus = CALCULATED` (this is a valid zero-pay, not an
  error).
- **AC-3.9 (Event-driven)** When `actualEndAt` is later than
  `scheduledEndAt`, the system shall NOT credit the teacher for the
  over-time minutes (cap at `scheduledEndAt`); the spec pays for the
  scheduled window, not the actual overrun.

---

### US-4: Student absence — teacher is paid in full

**As a** teacher
**I want** to be paid in full when the student does not show up
**So that** my time investment in joining the room is honored.

#### Acceptance Criteria (EARS)

- **AC-4.1 (Event-driven)** When `outcome = ABSENT` AND
  `actualStartAt IS NOT NULL` (i.e. the teacher did join), the system
  shall treat the absence as a **student** absence and set
  `calculatedDuration = scheduledDurationMinutes`.
- **AC-4.2 (Event-driven)** When the calculator treats a row as
  student-absent, it shall set `teacherPaidAmount` from the full
  scheduled duration × effective rate.
- **AC-4.3 (Ubiquitous)** The system shall expose the
  `absent_student` semantic on the GraphQL layer as a derived boolean
  field `isStudentAbsence` so Plan 4's audit view can render it without
  re-implementing the rule.
- **AC-4.4 (Unwanted)** If `outcome = ABSENT` but
  `actualStartAt IS NULL`, the calculator shall treat it as a
  **teacher** absence (US-5) and pay zero — the rule is "teacher
  showed up, student did not".

---

### US-5: Teacher absence — teacher is paid zero

**As an** accounting operator
**I want** a teacher who never joined the room to receive zero pay
**So that** the platform does not pay for sessions that did not occur.

#### Acceptance Criteria (EARS)

- **AC-5.1 (Event-driven)** When `executionState = COMPLETED` AND
  `actualStartAt IS NULL` AND `outcome != ABSENT`, the system shall
  treat the row as a **teacher** absence, set `calculatedDuration = 0`
  and `teacherPaidAmount = 0`.
- **AC-5.2 (Event-driven)** When a teacher-absence is calculated, the
  system shall set `calculationStatus = CALCULATED` (a zero-pay
  calculation is still a successful calculation).
- **AC-5.3 (Event-driven)** When the calculator treats a row as
  teacher-absent, it shall expose a derived boolean `isTeacherAbsence`
  on the GraphQL layer so Plan 4 can distinguish the two absence
  flavors visually.

---

### US-6: Admin override matrix — Refund / Calculated / Not Calculated / Partially

**As an** accounting operator
**I want** to override the auto-calculated amount for a class instance
**So that** I can correct edge cases (refund a dissatisfied parent, skip
a disputed session, or pay a partial percentage).

#### Acceptance Criteria (EARS)

- **AC-6.1 (Event-driven)** When the operator opens the Override dialog
  from a row, the system shall render four radio options: `Refund`,
  `Calculated`, `Not Calculated`, `Partially`.
- **AC-6.2 (Event-driven)** When the operator selects `Refund` and
  confirms, the system shall set `calculationStatus = REFUND`,
  `teacherPaidAmount = 0`, `isPartialPercentage = null`, and persist
  the operator's note in `payrollNote`.
- **AC-6.3 (Event-driven)** When the operator selects `Calculated` and
  confirms, the system shall re-run the calculator from US-2/US-3,
  replace `calculatedDuration` + `teacherPaidAmount`, and set
  `calculationStatus = CALCULATED`.
- **AC-6.4 (Event-driven)** When the operator selects
  `Not Calculated` and confirms, the system shall set
  `calculationStatus = NOT_CALCULATED`, leave the amount columns
  null (or clear previously-set values), and persist the note.
- **AC-6.5 (Event-driven)** When the operator selects `Partially`, the
  system shall render a percentage input (0–100, integer only) and shall
  require a non-empty `payrollNote`.
- **AC-6.6 (Event-driven)** When the operator confirms `Partially`, the
  system shall set `calculationStatus = PARTIALLY`,
  `isPartialPercentage = <pct>`, recompute
  `teacherPaidAmount = baseAmount * (pct / 100)` (where `baseAmount` is
  the most recent `CALCULATED` value, or a fresh calc if none), and
  persist the note.
- **AC-6.7 (Unwanted)** If `calculationStatus` is already `PAID`, the
  system shall reject the override mutation with a `PAYROLL_ALREADY_PAID`
  domain error and shall not modify the row.
- **AC-6.8 (Unwanted)** If `calculationStatus` is `WAITING_PAID`, the
  system shall reject with `PAYROLL_AWAITING_SETTLEMENT` unless the
  operator supplies a `force=true` flag AND holds the
  `ACCOUNTING_PAYROLL_MANAGE` permission.
- **AC-6.9 (Event-driven)** When the override mutation succeeds, the
  system shall append a row to `class_status_events` with
  `eventType = 'PAYROLL_OVERRIDE'`, `fromState` = previous
  `calculationStatus`, `toState` = new `calculationStatus`, and the
  operator's note.
- **AC-6.10 (Event-driven)** When the operator submits the same override
  twice (same `instanceId` + same target status + same percentage +
  same note, within a 30-second window), the system shall return the
  first-applied result without creating a duplicate `class_status_events`
  row.

---

### US-7: Permission gating

**As a** security-conscious platform
**I want** every payroll operation to require a dedicated permission
**So that** only authorized accounting staff can read or override pay.

#### Acceptance Criteria (EARS)

- **AC-7.1 (Ubiquitous)** The system shall require the
  `ACCOUNTING_PAYROLL_VIEW` permission for: viewing `/accounting/payroll`,
  calling the `payrollReport` query, and exporting CSV.
- **AC-7.2 (Ubiquitous)** The system shall require the
  `ACCOUNTING_PAYROLL_MANAGE` permission for: calling the
  `applyPayrollOverride` mutation, and seeing the "Override" action
  in the UI.
- **AC-7.3 (Event-driven)** When a user without `ACCOUNTING_PAYROLL_VIEW`
  calls the `payrollReport` query, the system shall reject with an
  `INSUFFICIENT_PERMISSIONS` GraphQL error and shall not execute the
  underlying query.
- **AC-7.4 (Event-driven)** When a user without
  `ACCOUNTING_PAYROLL_MANAGE` calls the `applyPayrollOverride` mutation,
  the system shall reject with `INSUFFICIENT_PERMISSIONS` and shall not
  touch any row.
- **AC-7.5 (Event-driven)** When an override is allowed, the system
  shall record the authenticated user's id as the `actorUserId` on the
  emitted `class_status_events` row.

---

### US-8: Configurable grace-period settings

**As an** admin
**I want** to tune the grace-period thresholds without a redeploy
**So that** the platform can adapt to different term policies.

#### Acceptance Criteria (EARS)

- **AC-8.1 (Ubiquitous)** The system shall read three settings from
  `system_settings` at calculation time:
  - `payroll.grace_short_minutes` (default 3, integer ≥ 0).
  - `payroll.grace_long_minutes` (default 6, integer ≥ 0).
  - `payroll.grace_threshold_minutes` (default 30, integer ≥ 1).
- **AC-8.2 (Event-driven)** When the settings are missing or
  unparseable, the system shall fall back to the defaults and emit a
  structured warning log so accounting can spot a misconfiguration.
- **AC-8.3 (Event-driven)** When an admin updates any of the three
  settings via the existing General Settings UI, the system shall
  invalidate the in-process cache (the `SystemSettingsRepository`
  cache layer) so the next calculation picks up the new value.
- **AC-8.4 (Unwanted)** If `grace_short_minutes` or
  `grace_long_minutes` is negative, the system shall reject the setting
  update at the `system_settings` validation layer (existing
  `SystemSettingDataType.Integer` constraint + new CHECK).
- **AC-8.5 (Ubiquitous)** The settings shall be seeded by the
  `seed-system-settings` migration so a fresh install has them
  out-of-the-box.

---

### US-9: Auditability & history

**As an** auditor
**I want** every payroll calculation and override to be reconstructible
**So that** I can explain any teacher payment.

#### Acceptance Criteria (EARS)

- **AC-9.1 (Ubiquitous)** The system shall surface the calculated
  fields (`calculatedDuration`, `teacherPaidAmount`,
  `teacherPaidCurrency`, `calculationStatus`, `isPartialPercentage`,
  `payrollNote`) on the existing `ClassInstanceDetailPothosObject` so
  no new top-level query is needed.
- **AC-9.2 (Event-driven)** When the operator opens the audit drawer
  for a class instance (existing `/classes/[id]/audit` page), the
  system shall render a new "Payroll Calculation" card showing the
  current values + the chronological list of `PAYROLL_OVERRIDE`
  events from `class_status_events`.
- **AC-9.3 (Ubiquitous)** The system shall never hard-delete a
  `class_status_events` row of `eventType = 'PAYROLL_OVERRIDE'`;
  corrections are made via a new override, not by editing history.
- **AC-9.4 (Event-driven)** When a row moves from `CALCULATED` to
  `WAITING_PAID` (via the existing `teacher_dues` accrual when a
  lesson report is approved), the system shall emit a
  `PAYROLL_STATUS_TRANSITION` event with `toState = WAITING_PAID`.
- **AC-9.5 (Event-driven)** When a `teacher_dues` row is marked `PAID`
  via the existing `markTeacherDuesPaid` mutation, the system shall
  flip the linked `class_instances.calculationStatus` to `PAID` in
  the same transaction and emit a `PAYROLL_STATUS_TRANSITION` event
  with `toState = PAID`.

---

## 5. Edge Cases

| # | Edge case                                                                                | Expected behavior                                                                                                                                              |
|---|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1 | Operator clicks "Override" twice rapidly on the same row with the same target state.     | Second call returns the first-applied result; no duplicate `class_status_events` row (idempotency via `clientRequestId` + 30-second window).                  |
| E2 | Operator overrides to `Partially` with `percentage = 0`.                                  | Allowed — equivalent to `Refund` but with a distinct audit trail; `teacherPaidAmount = 0`, `isPartialPercentage = 0`.                                          |
| E3 | Operator overrides to `Partially` with `percentage = 100`.                                | Allowed — equivalent to full pay; `isPartialPercentage = 100`, `teacherPaidAmount = baseAmount`.                                                                |
| E4 | Auto-calc runs but `rateAmount` is null (rate-resolver returned nothing).                 | `calculationStatus = NOT_CALCULATED`, `payrollNote = "Auto-calc failed: rate resolution returned null"`. Operator can still override.                          |
| E5 | `actualStartAt` is before `scheduledStartAt` (teacher joined early).                     | Treated as on-time; `calculatedDuration = scheduledDurationMinutes`. Overtime is never credited.                                                                |
| E6 | `actualStartAt` is null but `actualEndAt` is set (partial telemetry).                    | Treated as teacher absence → `calculatedDuration = 0`, `teacherPaidAmount = 0`, `calculationStatus = CALCULATED`.                                                |
| E7 | `actualEndAt` is null but `actualStartAt` is set (session still in progress at calc time).| The calculator shall NOT run until `executionState = COMPLETED` (the state-machine guard). If force-triggered, falls back to `scheduledEndAt` as `actualEndAt`.|
| E8 | Session is rescheduled after calculation (existing reschedule flow).                     | The original instance keeps its `CALCULATED` row (frozen for audit); the new instance starts at `NOT_CALCULATED` and recalculates on its own completion.       |
| E9 | Session is soft-deleted after calculation.                                                | `calculationStatus` is preserved on the row for audit; the row no longer appears in `/accounting/payroll` (RLS soft-delete filter).                              |
| E10| Operator overrides a row that was already `PAID` via `teacher_dues`.                     | Rejected with `PAYROLL_ALREADY_PAID`; UI shows a non-dismissable warning banner.                                                                              |
| E11| Two operators concurrently override the same row to different states.                    | The second commit wins (last-writer-wins on the row); both `class_status_events` rows are preserved chronologically so the audit trail shows both attempts.    |
| E12| `payroll.grace_threshold_minutes` is updated mid-term; historical rows are not retroactively recalculated. | Allowed — the new threshold applies to future calculations only. Operator can manually re-run via the `Calculated` override on a per-row basis.         |
| E13| `outcome = LEAVE` (student leave) on a completed instance.                                | Treated like `absent_student` (US-4): teacher paid in full, since the teacher showed up and the absence was student-initiated.                                   |
| E14| Session is `ON_DEMAND_NO_CREDITS_ABSENT`.                                                 | The calculator runs but treats the row as teacher-absent (the student never confirmed, so the teacher is not owed pay unless they actually joined).            |
| E15| `payrollNote` exceeds 2 000 characters.                                                   | Server truncates to 2 000 with an ellipsis and logs a warning.                                                                                                 |
| E16| `payrollNote` contains `<script>` tags.                                                  | Server sanitizer strips tags (plain-text field, not rich-text); persisted as escaped plain text.                                                                |
| E17| CSV export exceeds 10 000 rows.                                                           | Server caps at 10 000, includes a `X-Export-Truncated: true` header, and shows a toast in the UI warning that the export was truncated.                         |
| E18| RTL / Arabic locale active.                                                              | All labels, status chips, and the Override dialog render RTL; the "Partially" percentage input aligns to the right.                                              |
| E19| Operator has `ACCOUNTING_PAYROLL_VIEW` but not `_MANAGE`.                                 | Reports page renders read-only; "Override" action hidden; mutation rejected at the GraphQL layer.                                                              |
| E20| `teacherPaidCurrency` differs from `teachers.rateCurrency` (legacy data).                 | The persisted `teacherPaidCurrency` follows the resolved rate snapshot (`rateCurrency`), not the teacher's default — consistency with `teacher_dues.currency`.  |

---

## 6. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                          |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | Performance     | The `/accounting/payroll` list shall render its first paint in < 1.5 s on a 1 000-session dataset (server + network).                                                |
| NFR-2  | Performance     | Each per-instance calculation shall complete in < 50 ms p95 (single-row read + rate resolve + arithmetic + write).                                                    |
| NFR-3  | Performance     | Each override mutation shall complete in < 300 ms p95 including the `class_status_events` insert and the audit-log write.                                              |
| NFR-4  | Concurrency     | The override idempotency guard shall hold under concurrent duplicate submissions (same `clientRequestId`) — exactly one row mutation, one event row.                  |
| NFR-5  | Security        | All mutations shall be authenticated, permission-scoped, and shall record `actorUserId` from the session — never from a client-supplied field.                       |
| NFR-6  | Auditability    | Every calculation and every override shall be reconstructible from `class_instances` + `class_status_events` + `audit_logs` alone.                                  |
| NFR-7  | i18n            | All user-facing strings (page title, column headers, status chips, override dialog, toasts, errors) shall be available in EN and AR via the compile-time i18n pipeline.|
| NFR-8  | Accessibility   | The DataGrid, filter bar, Override dialog RadioGroup, and percentage input shall be keyboard-navigable and labelled for screen readers (WCAG 2.1 AA).                  |
| NFR-9  | Data integrity  | Calculation writes, `class_status_events` inserts, and (when applicable) `class_instances.state` updates shall be in the same PostgreSQL transaction.                  |
| NFR-10 | Compatibility  | The schema migration shall be additive-only (new nullable columns + new enum values + new `system_settings` rows); zero downtime for existing scheduling flows.       |
| NFR-11 | Observability  | Every calculation and override shall emit a structured log event with `actorUserId`, `instanceId`, `previousStatus`, `newStatus`, and `amount`.                    |
| NFR-12 | Configurability | The grace-period thresholds shall be runtime-tunable via `system_settings` with no redeploy; the calculator shall read them on every invocation (no stale cache).      |

---

## 7. Traceability Matrix

| AC        | Covered by implementation section                              | Test file                                                                |
|-----------|----------------------------------------------------------------|--------------------------------------------------------------------------|
| AC-1.x    | Frontend › Routes & Navigation                                | `frontend/common/views/dashboard/accounting/payroll/PayrollReportsContainer.test.tsx`                                          |
| AC-2.x    | Service › `calculateForInstance` (auto-trigger)              | `backend/services/teachers/payroll-calculation.service.test.ts` › "auto-trigger"                    |
| AC-3.x    | Service › `calculateForInstance` (grace-period branch)        | `backend/services/teachers/payroll-calculation.service.test.ts` › "grace-period"                   |
| AC-4.x    | Service › student-absence branch                              | `backend/services/teachers/payroll-calculation.service.test.ts` › "student-absence"               |
| AC-5.x    | Service › teacher-absence branch                              | `backend/services/teachers/payroll-calculation.service.test.ts` › "teacher-absence"                |
| AC-6.x    | Service › `applyOverride` + Frontend › OverrideDialog         | `backend/services/teachers/payroll-override.service.test.ts` + `frontend/common/views/dashboard/accounting/payroll/OverrideDialog.test.tsx`           |
| AC-7.x    | GraphQL › `requirePermission` + route middleware              | `backend/graphql/mutation/teachers/payroll.mutation.test.ts` › "permission denied"                        |
| AC-8.x    | Service › `resolveGraceSettings` + seed-system-settings        | `backend/services/teachers/payroll-grace-settings.test.ts`                                |
| AC-9.x    | GraphQL › `ClassInstanceDetailPothosObject` extension + audit | `frontend/common/views/dashboard/accounting/payroll/OverrideDialog.test.tsx` (audit drawer assertion) |

---

## 8. Open Questions

| # | Question                                                                                                                | Status | Default assumed                                                          |
|---|-------------------------------------------------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------|
| Q1 | Should the "Partially" percentage be integer-only or allow decimal (e.g., 12.5%)?                                        | Open   | Integer-only (0–100) in v1; decimal support deferred.                   |
| Q2 | Should the override mutation emit a `teacher_dues` reversal when changing from `WAITING_PAID` back to `CALCULATED`?     | Open   | No — the existing `teacher_dues` flow owns its own reversal; this plan only updates `class_instances.calculationStatus` and lets the existing flow reconcile on its next run. |
| Q3 | Should the CSV export include the operator's name + timestamp on every override, or only the latest?                    | Open   | Latest only in the grid row; full history available via the audit drawer. |
| Q4 | Should the calculator run inside the state-transition transaction (synchronous) or as a deferred job?                    | Open   | Synchronous inside the same tx — keeps `calculationStatus` consistent with `executionState`. If perf becomes an issue, move to a deferred job. |
| Q5 | Should `Refund` also write a `credit_transactions` row to refund the student's credit?                                  | Open   | No — `Refund` here only zeroes the teacher pay. Student credit refunds are owned by the existing credit-adjustment module (Plan 2). |
| Q6 | Should the grace settings support per-subject or per-teacher overrides?                                                  | Open   | No — global settings only in v1; per-teacher overrides are out of scope. |
