# Accounting workflow journey diagrams

Mermaid diagrams for the cross-actor journey suites in this directory. Each section maps to one test file and uses the same actor names, service entry points, and event types as the journey code.

## record-payment-balance-visibility.test.ts

An academy admin records a paid hour-package payment; the invoice, payment row, hour-ledger PURCHASE row, and the student's denormalized balance facets all land in one transaction. The student and linked parent read the new balance, view-only staff read the payment row, unrelated actors are denied everywhere, and the ACCOUNTING_PAYMENT_RECORDED notification reaches only the student and the linked parent.

```mermaid
sequenceDiagram
  autonumber
  participant admin as "admin - academy operator"
  participant svc as "AccountingPaymentService"
  participant db as "Postgres - single transaction"
  participant student as "student"
  participant parent as "linked parent"
  participant staff as "staff - VIEW only"
  participant outsider as "unrelated family"
  participant notify as "notification dispatch spy"

  admin->>svc: recordPayment student 10h USD 300 paid
  svc->>db: insert payment row
  svc->>db: upsert invoice PAID with paidDate
  svc->>db: insert PURCHASE hour-ledger row of plus 10h
  svc->>db: bump creditHoursTotal and creditHoursRemaining to 10
  svc-->>admin: payment return - invoiceStatus PAID
  svc-)notify: ACCOUNTING_PAYMENT_RECORDED fire-and-forget
  notify-->>student: dispatch
  notify-->>parent: dispatch
  Note over notify: fan-out is the student plus the linked parent only

  student->>svc: getStudentBalance and getStudentTransactions
  svc-->>student: total 10 - remaining 10 - plus ledger row
  parent->>svc: same association-scoped reads
  svc-->>parent: same balance and ledger
  staff->>svc: getById and listPaginated via VIEW
  svc-->>staff: payment row visible

  outsider->>svc: any balance or ledger read
  svc-->>outsider: insufficientPermissions denial
  staff->>svc: recordPayment without MANAGE
  svc-->>staff: denied before any write
```

## toggle-paid-invoice-cascade.test.ts

The paid-sibling rule drives the invoice status: an invoice stays PAID while any sibling payment is paid, flips to UNPAID when the last paid sibling is toggled off, and returns to PAID when one is toggled back on. The `accounting_paid_toggle_auto_flips_invoice` setting decouples the flags entirely, and a stale `expectedInvoiceVersion` is rejected before any write.

```mermaid
stateDiagram-v2
  [*] --> UNPAID : invoice derived by recordPayment
  UNPAID --> PAID : recordPayment paid or togglePaidStatus ON
  PAID --> PAID : togglePaidStatus OFF while a paid sibling remains
  PAID --> UNPAID : togglePaidStatus OFF on the last paid sibling
  UNPAID --> PAID : togglePaidStatus ON restores paidDate
  PAID --> PAID : toggle skipped when auto-flip setting is false
  UNPAID --> UNPAID : toggle skipped when auto-flip setting is false
  PAID --> PAID : stale expectedInvoiceVersion rejected before write

  note right of PAID
    paidDate follows the toggled payment date
    staff with VIEW observe every flip on reads
    staff and outsiders cannot toggle at all
  end note
```

## edit-payment-hours-adjustment.test.ts

Editing a payment's creditHours writes an ADJUSTMENT hour-ledger row carrying the signed delta and moves the balance facets; note-only and unchanged-hours edits write nothing. A decrease past the available balance raises a ConflictError with a full rollback, and actors without ACCOUNTING_PAYMENTS_MANAGE are denied before any write.

```mermaid
sequenceDiagram
  autonumber
  participant admin as "admin"
  participant svc as "AccountingPaymentService"
  participant db as "Postgres"
  participant student as "student"
  participant parent as "linked parent"
  participant staff as "staff - VIEW only"
  participant outsider as "unrelated family"

  admin->>svc: recordPayment baseline 10h
  svc->>db: PURCHASE row plus 10h - facets 10 of 10

  admin->>svc: update creditHours 10 to 15
  svc->>db: insert ADJUSTMENT row plus 5h
  svc->>db: bump creditHoursTotal and creditHoursRemaining to 15
  svc->>db: sync invoice creditHours snapshot to 15
  student->>svc: getStudentBalance plus hour ledger
  svc-->>student: 15 of 15 with PURCHASE and ADJUSTMENT rows
  parent->>svc: same association-scoped reads
  svc-->>parent: same view

  admin->>svc: update creditHours 15 to 12
  svc->>db: insert ADJUSTMENT row minus 3h
  svc->>db: creditHoursRemaining 12 - total stays 15

  admin->>svc: update note or gateway only - hours unchanged
  svc-->>admin: no ledger row - balance untouched

  Note over svc: simulated consumption leaves remaining at 1
  admin->>svc: update creditHours to 1 implies minus 11 delta
  svc-->>admin: ConflictError insufficientHours - full rollback

  staff->>svc: update without ACCOUNTING_PAYMENTS_MANAGE
  svc-->>staff: denied before any write
  outsider->>svc: any balance or ledger read
  svc-->>outsider: insufficientPermissions denial
```

## low-hours-notification.test.ts

Hour deductions via `deductHoursForBooking` move the balance down; the post-commit probe `maybeNotifyLowHours` fires ACCOUNTING_LOW_HOURS only when the balance lands at or below the configured threshold. The alert targets the student and the linked parent only — admin fan-out is deferred — and a rejected deduction never triggers it.

```mermaid
flowchart TD
  A["admin recordPayment funds 10h"] --> B["deductHoursForBooking lands above threshold"]
  B --> C["DEDUCTION ledger row - balance still above threshold"]
  C --> D["maybeNotifyLowHours probe"]
  D --> E{"remaining at or below threshold?"}
  E -->|"no"| F["no ACCOUNTING_LOW_HOURS dispatch"]
  B2["deductHoursForBooking drops balance below threshold"] --> E
  E -->|"yes"| G["dispatch ACCOUNTING_LOW_HOURS"]
  G --> H["student notified"]
  G --> I["linked parent notified"]
  G -->|"admin fan-out deferred"| J["admins and staff are NOT targets"]
  K["deduction beyond available balance"] --> L["ConflictError insufficientHours"]
  L --> M["no ledger row - no alert - alert set unchanged"]
```

## session-audit-access-isolation.test.ts

An academy_admin accounting operator reads the session audit report scoped to one teacher and receives exactly that teacher's rows (further narrowed by student, status, and date filters), while teacher- and student-role actors are denied with FORBIDDEN before any read or log line — even when filtering by their own ids. Every successful read emits the structured audit log, and the export-shaped read carries the totalCount the CSV route's truncation header encodes.

```mermaid
sequenceDiagram
  autonumber
  participant operator as "operator - academy_admin"
  participant svc as "SessionAuditService"
  participant repo as "SessionAuditRepository"
  participant auditlog as "logger.info spy"
  participant teacher as "teacher - teacher_default"
  participant student as "student - student_default"

  operator->>svc: getReport operator filters teacherId teacherA
  svc->>repo: findReportRows scoped filter
  repo-->>svc: exactly teacher A rows
  svc-)auditlog: "Session audit report query" actorUserId plus filters
  svc-->>operator: totalCount 3 plus aggregates

  operator->>svc: getReport with student plus status plus date filters
  svc-->>operator: exactly one narrowing row per filter

  operator->>svc: export-shaped read limit 10000 offset 0
  svc-->>operator: totalCount against rows length feeds X-Export-Truncated

  teacher->>svc: getReport filters teacherId own or other
  svc-->>teacher: ForbiddenError FORBIDDEN before any read
  student->>svc: getReport filters studentId own
  svc-->>student: ForbiddenError FORBIDDEN before any read
  Note over svc: denial precedes validation - reversed date range is still FORBIDDEN
```

## session-audit-session-lifecycle.test.ts

A teacher activates and joins the on-time session (`activate` + `updateStatusStart` — RUNNING, `actual_start_at` set, audit status still `open`), the operator's terminal `stop` resolves COMPLETED/TAKEN so the row reads `end` with the auto-calculated payroll snapshot attached, and a service-driven absence lands absent-with-start so the mapper yields `absent_student`, while the telemetry-less COMPLETED/ABSENT cast row maps to `Absent`. The accounting operator reads each transition back through `SessionAuditService.getReport` pinned to the shared mapper, scoped filters never leak the second teacher's rows, actors without `ACCOUNTING_REPORTS_VIEW` are rejected FORBIDDEN, report reads never dispatch notifications, and teacher/student-facing detail surfaces stay payroll-blind after the snapshot lands.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - teacher_default"
  participant operator as "operator - academy_admin"
  participant session as "ClassSessionService"
  participant db as "Postgres - committed rows"
  participant audit as "SessionAuditService"
  participant notify as "notification dispatch spy"
  participant outsider as "teacher or parent without reports view"

  teacher->>session: activate then updateStatusStart on-time session
  session->>db: RUNNING with actual_start_at stamped
  operator->>audit: getReport filter teacherId
  audit-->>operator: currentStatus open via mapToSessionAuditStatus

  operator->>session: stop on-time session
  session->>db: COMPLETED and TAKEN - actual_end_at - payroll snapshot CALCULATED 120.00
  audit-->>operator: currentStatus end - payroll columns populated

  operator->>session: activateOverride plus updateStatusAbsent on never-joined session
  session->>db: COMPLETED and ABSENT - state machine stamps actual_start_at
  audit-->>operator: currentStatus absent_student
  audit-->>operator: telemetry-less COMPLETED and ABSENT row maps Absent
  Note over audit: absent branch is Absent only when start telemetry is absent

  audit-->>operator: aggregates end 1 - Absent 1 - absent_student 1 - total 240.00
  audit-->>operator: second teacher rows absent from first teacher filter
  outsider->>audit: getReport without ACCOUNTING_REPORTS_VIEW
  audit-->>outsider: ForbiddenError FORBIDDEN insufficientPermissions
  Note over audit,notify: report reads never trigger notification dispatch
```


## session-audit-payroll-visibility.test.ts

The payroll write path (auto-calculation at the terminal stop, operator override to PARTIALLY 50%, lesson-report approval to WAITING_PAID, dues settlement to PAID) mutates the payroll snapshot columns, and the accounting operator's read-only `SessionAuditService.getReport` plus the CSV serialization reflect every post-override value with correct aggregates; the payment-date tooltip appears only on the PAID row, and actors without `ACCOUNTING_REPORTS_VIEW` are denied before any read.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - teacher_default"
  participant operator as "operator - academy_admin"
  participant session as "ClassSessionService"
  participant payroll as "PayrollCalculationService"
  participant lesson as "LessonReportService"
  participant dues as "TeacherDueService"
  participant audit as "SessionAuditService"
  participant csv as "serializeSessionAuditCsv"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"
  participant denied as "denied actors - teacher student parent"

  operator->>audit: getReport filter teacherId
  audit-->>operator: three rows NOT_CALCULATED - empty payroll columns - total 0.00

  teacher->>session: activate and updateStatusStart on-time session
  operator->>session: stop
  session->>db: COMPLETED and TAKEN - payroll snapshot CALCULATED 120.00
  operator->>session: activateOverride and updateStatusAbsent on second session
  session->>db: COMPLETED - payroll snapshot CALCULATED 120.00
  operator->>audit: getReport filter teacherId
  audit-->>operator: two CALCULATED rows at 120.00 - total 240.00

  operator->>payroll: applyOverride PARTIALLY 50 with note
  payroll->>db: calculation_status PARTIALLY - amount 60.00 - is_partial_percentage 50 - payroll_note
  payroll->>db: append PAYROLL_OVERRIDE audit event plus audit_logs mirror
  Note over payroll,notify: override dispatches no notification
  operator->>audit: getReport filter teacherId
  audit-->>operator: PARTIALLY row with note and share - total 180.00

  teacher->>lesson: submitReport
  operator->>lesson: approveReport
  lesson->>db: due 120.00 accrued - instance WAITING_PAID
  operator->>dues: markAsPaid against teacher_payments fixture
  dues->>db: due PAID with payment date - instance PAID
  operator->>audit: getReport filter teacherId
  audit-->>operator: PAID row with teacherDuePaymentDate - others null - paid 1 unpaid 2

  operator->>csv: serialize rows
  csv-->>operator: PAID line with payment date - PARTIALLY line with note and share - NOT_CALCULATED line empty

  denied->>audit: getReport any filter
  audit-->>denied: ForbiddenError FORBIDDEN insufficientPermissions
```


## carryover-to-expense.journey.test.ts

The teacher drives telemetry so both sessions land CALCULATED (on-time stop, then an absent resolution via `activateOverride`/`updateStatusAbsent`), the accounting operator aggregates both into one carryover via `CarryoverBalanceService.bulkCreateCarryoverBalances` (sessions WAITING_PAID, one CARRYOVER_CREATE audit row), then settles it via `bulkCarryoverToExpense` (carryover isPaid with payment date and expense reference, both sessions PAID with a settlement event each, one CARRYOVER_TO_EXPENSE audit row carrying the full expense payload in metadata — the ledger adapter persists no rows of its own). A same-payload re-submit replays the first result with no audit or ledger growth, a second operator's concurrent settle is denied as already-paid, and the read-only auditor (custom VIEW-only group) reads the paid row and its drill-down sessions while remaining locked out of the settle surface.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - teacher_default"
  participant operator as "operator - academy_admin"
  participant session as "ClassSessionService"
  participant carryover as "CarryoverBalanceService"
  participant db as "Postgres - committed rows"
  participant notify as "notification dispatch spy"
  participant viewer as "auditor - carryover VIEW only"
  participant second as "second operator - academy_admin"

  teacher->>session: activate then updateStatusStart on-time session
  operator->>session: stop
  session->>db: COMPLETED - payroll snapshot CALCULATED 120.00
  session-->>notify: CLASS_COMPLETED to teacher

  operator->>session: activateOverride plus updateStatusAbsent
  session->>db: absent session CALCULATED 120.00

  operator->>carryover: bulkCreateCarryoverBalances both sessions
  carryover->>db: one carryover payable 240.00 - sessions WAITING_PAID and linked
  carryover->>db: one CARRYOVER_CREATE audit row

  operator->>carryover: bulkCarryoverToExpense paymentDate plus expenseDate
  carryover->>db: carryover isPaid - paymentDate - expenseId - paidByUserId
  carryover->>db: both sessions PAID with settlement events
  carryover->>db: one CARRYOVER_TO_EXPENSE audit row with settlement metadata
  Note over carryover,notify: settle dispatches no notifications

  viewer->>carryover: getReport paid filter plus getLinkedSessions
  carryover-->>viewer: paid row 240.00 - two sessions currentStatus PAID

  operator->>carryover: bulkCarryoverToExpense identical payload
  carryover-->>operator: replayed result - same expenseId and audit ids - no new rows

  second->>carryover: bulkCarryoverToExpense same carryover
  carryover-->>second: DomainError CARRYOVER_ALREADY_PAID
  viewer->>carryover: bulkCarryoverToExpense
  carryover-->>viewer: ForbiddenError insufficientPermissions
```

## carryover-bulk-create.journey.test.ts

An accounting operator bulk-creates carryover balances from audited sessions: the sessions link to one carryover per teacher and flip to WAITING_PAID, one CARRYOVER_CREATE audit row lands per carryover plus a PAYROLL_STATUS_TRANSITION event per session, and the linked state is readable by the second operator and a view-only carryover auditor while teachers are denied everywhere. Re-selections are rejected honestly (already-linked on the legacy-linked row, not-audited on the linked set), and the flow dispatches no notifications.

```mermaid
sequenceDiagram
  autonumber
  participant operator as "operator - academy_admin"
  participant second as "second operator - academy_admin"
  participant viewer as "viewer - carryover view only"
  participant carryover as "CarryoverBalanceService"
  participant audit as "SessionAuditService"
  participant db as "Postgres - committed rows"
  participant teacher as "teacher - teacher_default"
  participant notify as "notification dispatch spy"

  operator->>audit: getReport per teacher
  audit-->>operator: three sessions at CALCULATED - carryover report empty

  viewer->>carryover: bulkCreateCarryoverBalances
  carryover-->>viewer: ForbiddenError insufficientPermissions before any write

  operator->>carryover: bulkCreateCarryoverBalances 3 sessions 2 teachers
  carryover->>db: one carryover per teacher plus item snapshots
  carryover->>db: sessions linked and moved to WAITING_PAID
  carryover->>db: one CARRYOVER_CREATE audit row per carryover
  carryover->>db: PAYROLL_STATUS_TRANSITION event per session

  second->>carryover: getReport plus getLinkedSessions
  carryover-->>second: both carryovers with CALCULATED to WAITING_PAID snapshots
  viewer->>carryover: same reads under view only scope
  carryover-->>viewer: same rows and linked sessions
  second->>audit: getReport per teacher
  audit-->>second: sessions read WAITING_PAID on the audit grid
  teacher->>carryover: getReport or getLinkedSessions
  carryover-->>teacher: ForbiddenError insufficientPermissions

  second->>carryover: bulkCreateCarryoverBalances already-linked legacy row
  carryover-->>second: DomainError CARRYOVER_SESSION_NOT_AUDITED - linked sessions sit in WAITING_PAID
  second->>carryover: bulkCreateCarryoverBalances same linked set
  carryover-->>second: DomainError CARRYOVER_SESSION_NOT_AUDITED
  Note over carryover,notify: bulk create dispatches no notifications
```

## carryover-unpay.journey.test.ts

The accounting operator aggregates two audited sessions into one unpaid carryover, converts it to an expense (carryover paid with an expense reference, sessions PAID), then unpays it — the missing/expense-soft-delete-tolerant ledger revert clears every settlement field and returns the sessions to WAITING_PAID while the append-only audit trail keeps create, settle, and unpay rows; denials reject a double reversal and any actor without `ACCOUNTING_CARRYOVER_MANAGE`.

```mermaid
sequenceDiagram
  autonumber
  participant operator as "operator - academy_admin"
  participant viewer as "viewer - carryover view-only group"
  participant staff as "staff - staff_default"
  participant service as "CarryoverBalanceService"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"

  operator->>service: bulkCreateCarryoverBalances audited sessions
  service->>db: carryover unpaid - sessions WAITING_PAID and linked
  db-->>operator: one CARRYOVER_CREATE audit row
  viewer->>service: getReport filter paidStatus Unpaid
  service-->>viewer: carryover row with linked sessions

  operator->>service: bulkCarryoverToExpense payment date
  service->>db: carryover paid with expense reference - sessions PAID
  db-->>operator: CARRYOVER_TO_EXPENSE audit row appended
  viewer->>service: getReport filter paidStatus Paid
  service-->>viewer: paid row - sessions PAID

  operator->>service: unpayCarryoverBalance with note
  service->>db: expense soft-delete tolerated - carryover unpaid - sessions WAITING_PAID
  db-->>operator: CARRYOVER_UNPAID audit row with expenseId and reason

  operator->>service: unpayCarryoverBalance again
  service-->>operator: CARRYOVER_NOT_PAID rejection
  viewer->>service: unpayCarryoverBalance
  service-->>viewer: ForbiddenError insufficientPermissions
  staff->>service: unpayCarryoverBalance
  service-->>staff: ForbiddenError insufficientPermissions
  Note over service,notify: zero dispatches across the whole journey
```

## carryover-delete.journey.test.ts

An accounting operator aggregates audited sessions into per-teacher carryovers, then deletes teacher A's carryover: the linked sessions detach and revert to their per-item `originalStatus` snapshots, the deleted carryover disappears from the report while its `CARRYOVER_CREATE` and `CARRYOVER_DELETE` audit rows survive, and a second operator immediately re-selects the freed sessions into a new carryover that the first operator can read. Teacher B's carryover settles to expense and is then protected: single delete rejects with `CARRYOVER_PAID_CANNOT_DELETE`, a bulk delete mixing the paid row rolls the whole batch back, and a view-only staff actor is denied before any row moves.

```mermaid
sequenceDiagram
  autonumber
  participant operator as "operator - academy_admin"
  participant second as "second operator - academy_admin"
  participant viewer as "staff viewer - staff_default"
  participant carryover as "CarryoverBalanceService"
  participant db as "Postgres - committed rows"
  participant notify as "notification dispatch spy"

  operator->>carryover: bulkCreateCarryoverBalances - four audited sessions
  carryover->>db: carryover A 180.00 SAR - carryover B 240.00 SAR - sessions WAITING_PAID linked
  second->>carryover: bulkCreateCarryoverBalances - already-linked sessions
  carryover-->>second: DomainError CARRYOVER_SESSION_NOT_AUDITED - linked sessions sit in WAITING_PAID
  viewer->>carryover: deleteCarryoverBalance without carryover MANAGE
  carryover-->>viewer: ForbiddenError FORBIDDEN insufficientPermissions

  operator->>carryover: deleteCarryoverBalance - carryover A
  carryover->>db: sessions revert to item snapshots CALCULATED and PARTIALLY 50pct restored - carryover_balance_id NULLed
  carryover->>db: row hard-deleted - CARRYOVER_DELETE audit row appended - CREATE row preserved
  carryover-->>operator: getReport no longer lists carryover A - getById NotFound

  second->>carryover: bulkCreateCarryoverBalances - freed sessions
  carryover->>db: carryover A2 created - sessions re-linked WAITING_PAID
  operator->>carryover: getReport teacher A
  carryover-->>operator: second operator's carryover A2 visible cross-actor

  operator->>carryover: bulkCarryoverToExpense - carryover B
  carryover->>db: carryover B isPaid - sessions PAID - CARRYOVER_TO_EXPENSE audit row
  operator->>carryover: deleteCarryoverBalance - paid carryover B
  carryover-->>operator: DomainError CARRYOVER_PAID_CANNOT_DELETE - row intact
  operator->>carryover: bulkDeleteCarryoverBalances - A2 plus paid B
  carryover-->>operator: CARRYOVER_PAID_CANNOT_DELETE - whole batch rolled back - both rows listed
  operator->>carryover: bulkDeleteCarryoverBalances - A2 alone
  carryover->>db: sessions revert to snapshots and unlink - audit row preserved
  Note over carryover,notify: the whole journey dispatches no notifications
```
