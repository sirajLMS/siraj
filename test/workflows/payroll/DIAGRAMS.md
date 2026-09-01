# Payroll workflow journey diagrams

Mermaid diagram for the cross-actor journey suite in this directory, using the same actor names, service entry points, and statuses as the journey code.

## auto-calculation-to-payroll-visibility.test.ts

The teacher drives a scheduled session through the real state machine with their attendance telemetry, and the operator's terminal transitions fire the automatic payroll calculation inside the same transaction as the state change; the unattended historical row (migrated terminal session without attendance telemetry) is settled separately through the operator's standalone reconciliation calculation. The accounting operator then reads the calculated rows through the report service, teacher and student class-detail surfaces stay payroll-blind, the audit trail carries exactly one status-transition event per calculation and no override events, and unauthorized actors are denied.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - class owner"
  participant operator as "accounting operator - academy_admin"
  participant student as "student - own dashboard only"
  participant session as "ClassSessionService"
  participant payroll as "PayrollCalculationService"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"

  teacher->>session: activate onTimeInstance
  teacher->>session: updateStatusStart onTimeInstance
  session->>db: executionState RUNNING plus actualStartAt

  operator->>session: stop onTimeInstance
  session->>payroll: calculateForInstance attributed to operator in same transaction
  payroll->>db: CALCULATED snapshot 120.00 SAR plus PAYROLL_STATUS_TRANSITION event
  session-)notify: CLASS_COMPLETED
  notify-->>teacher: completion fan-out reaches the class teacher

  operator->>session: activateOverride studentAbsentInstance
  operator->>session: updateStatusAbsent studentAbsentInstance
  session->>payroll: calculateForInstance student-absence branch
  payroll->>db: CALCULATED snapshot 120.00 SAR full scheduled window

  note over operator,db: unattendedInstance is a historical terminal row — migrated completed session without attendance telemetry
  operator->>payroll: calculateForInstance reconciliation on unattendedInstance
  payroll->>payroll: teacher-absence branch — no join telemetry pays zero
  payroll->>db: CALCULATED snapshot 0.00 SAR plus PAYROLL_STATUS_TRANSITION event

  operator->>payroll: getReport filtered by teacher
  payroll-->>operator: three CALCULATED rows plus aggregates 240.00 SAR

  teacher->>session: getClassInstanceDetail own instance
  session->>session: actor lacks ACCOUNTING_PAYROLL_VIEW so payroll snapshot fields are stripped
  session-->>teacher: detail without any payroll fields
  student->>session: getClassInstanceDetail own instance
  session->>session: actor lacks ACCOUNTING_PAYROLL_VIEW so payroll snapshot fields are stripped
  session-->>student: detail without any payroll fields

  operator->>session: getClassStatusEvents for the three instances
  session-->>operator: lifecycle events plus one PAYROLL_STATUS_TRANSITION each and no PAYROLL_OVERRIDE

  teacher->>payroll: getReport
  payroll-->>teacher: ForbiddenError insufficientPermissions
  student->>payroll: getReport
  payroll-->>student: ForbiddenError insufficientPermissions
```

## override-to-settlement-lifecycle.test.ts

The operator overrides a calculated session to Partially 50%, the teacher's lesson report is approved so the due accrues from the overridden amount and the instance flips to WAITING_PAID inside the approval transaction, the operator settles the due against a recorded teacher payment (PAID flip plus teacherPaymentId link in one transaction), the audit trail attributes every payroll event to the operator while the teacher sees only their settled dues, and settled or awaiting rows reject further overrides.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - class owner"
  participant operator as "accounting operator - academy_admin"
  participant session as "ClassSessionService"
  participant payroll as "PayrollCalculationService"
  participant reports as "LessonReportService"
  participant dues as "TeacherDueService"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"

  teacher->>session: activate plus updateStatusStart onTimeInstance
  operator->>session: stop onTimeInstance
  session->>payroll: calculateForInstance attributed to operator in same transaction
  payroll->>db: CALCULATED 120.00 SAR plus PAYROLL_STATUS_TRANSITION event

  operator->>payroll: applyOverride Partially 50 with operator note
  payroll->>db: PARTIALLY 60.00 SAR plus PAYROLL_OVERRIDE event
  operator->>payroll: duplicate applyOverride inside idempotency window
  payroll-->>operator: first-applied result with the same audit event id

  teacher->>reports: submitReport onTimeInstance
  operator->>reports: approveReport
  reports->>dues: createDueEntry inside the approval transaction
  dues->>db: teacher_due 60.00 SAR PENDING plus instance flips WAITING_PAID plus PAYROLL_STATUS_TRANSITION event
  reports-)notify: LESSON_REPORT_REVIEWED to the submitting teacher

  teacher->>dues: getPendingDues plus getMonthlyReport as own teacher
  dues-->>teacher: accrued and settled amounts only — no override internals
  teacher->>session: getClassInstanceDetail own instance
  session-->>teacher: detail without any payroll fields

  operator->>db: insert teacher_payments fixture — cash payout 60.00 SAR
  operator->>dues: markAsPaid dueId with teacherPaymentId
  dues->>db: due PAID plus teacherPaymentId link plus instance flips PAID plus PAYROLL_STATUS_TRANSITION event

  operator->>session: getClassStatusEvents for onTimeInstance
  session-->>operator: three transitions plus one override event newest first
  note over operator,db: raw class_status_events rows attribute all four payroll events to the operator

  operator->>payroll: applyOverride on the PAID row
  payroll-->>operator: DomainError PAYROLL_ALREADY_PAID alreadyPaid
  teacher->>payroll: applyOverride
  payroll-->>teacher: ForbiddenError insufficientPermissions

  operator->>session: activateOverride plus updateStatusAbsent studentAbsentInstance
  session->>payroll: calculateForInstance student-absence branch
  payroll->>db: CALCULATED 120.00 SAR full scheduled window

  teacher->>reports: submitReport studentAbsentInstance
  operator->>reports: approveReport
  reports->>dues: createDueEntry inside the approval transaction
  dues->>db: teacher_due 120.00 SAR PENDING plus instance flips WAITING_PAID

  operator->>payroll: applyOverride Partially without force
  payroll-->>operator: DomainError PAYROLL_AWAITING_SETTLEMENT awaitingSettlement
```

## payroll-permission-denials.test.ts

Every payroll surface — the report query service, the CSV export permission gate, and the override mutation — rejects actors without the matching payroll permission before any row is read or written. The journey lands one calculated baseline row, then the teacher, parent, student, and a non-payroll staff actor probe all three surfaces, and a view-only auditor proves view access covers reads and the export gate but never the override mutation; instance rows, event history, the audit trail, and the notification fan-out stay untouched.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - teacher_default"
  participant operator as "accounting operator - academy_admin"
  participant parent as "parent - permissionless"
  participant student as "student - student_default"
  participant staff as "staff - staff_default, no payroll grants"
  participant viewer as "read-only auditor - view-only group"
  participant session as "ClassSessionService"
  participant payroll as "PayrollCalculationService"
  participant gate as "requirePermission ACCOUNTING_PAYROLL_VIEW"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"

  teacher->>session: activate plus updateStatusStart onTimeInstance
  operator->>session: stop onTimeInstance
  session->>payroll: calculateForInstance in the same transaction
  payroll->>db: CALCULATED snapshot 120.00 SAR plus one status-transition event
  session-)notify: CLASS_COMPLETED fan-out intercepted then cleared
  note over db: baseline snapshot of all cast instance rows and event counts

  par report query denials
    teacher->>payroll: getReport filtered by teacher
    payroll-->>teacher: ForbiddenError insufficientPermissions
    parent->>payroll: getReport
    payroll-->>parent: ForbiddenError insufficientPermissions
    student->>payroll: getReport
    payroll-->>student: ForbiddenError insufficientPermissions
    staff->>payroll: getReport
    payroll-->>staff: ForbiddenError insufficientPermissions
  and CSV export gate denials
    teacher->>gate: export permission check
    gate-->>teacher: ForbiddenError insufficientPermissions
    parent->>gate: export permission check
    gate-->>parent: ForbiddenError insufficientPermissions
    student->>gate: export permission check
    gate-->>student: ForbiddenError insufficientPermissions
    staff->>gate: export permission check
    gate-->>staff: ForbiddenError insufficientPermissions
  and override mutation denials
    teacher->>payroll: applyOverride Partially 50
    payroll-->>teacher: ForbiddenError insufficientPermissions
    parent->>payroll: applyOverride Partially 50
    payroll-->>parent: ForbiddenError insufficientPermissions
    student->>payroll: applyOverride Partially 50
    payroll-->>student: ForbiddenError insufficientPermissions
    staff->>payroll: applyOverride Partially 50
    payroll-->>staff: ForbiddenError insufficientPermissions
    viewer->>payroll: applyOverride Partially 50
    payroll-->>viewer: ForbiddenError insufficientPermissions — view cannot override
  end

  viewer->>payroll: getReport filtered by teacher
  payroll-->>viewer: CALCULATED row 120.00 SAR
  viewer->>gate: export permission check
  gate-->>viewer: view permission passes

  note over db: instance rows, class_status_events, and audit_logs identical to the baseline — denied calls wrote nothing
  notify-->>notify: zero dispatches from denied calls
```
