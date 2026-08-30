# Billing workflow journey diagrams

Mermaid diagrams for the credit-adjustment journey suites in this directory. Each section maps to one test file and uses the same actor names, service entry points, and ledger reasons as the journey code.

## credit-adjustment-student-visibility.test.ts

An admin operator records Add and Subtract adjustments through `recordAdjustment`; each commits a signed ledger row and moves the student's class balance. The student and linked parent observe both rows, repeated submissions collapse onto the first row, oversized subtractions and actors without the manage permission write nothing, and every committed adjustment emits an audit entry with no user notification.

```mermaid
sequenceDiagram
  autonumber
  participant operator as "admin operator"
  participant svc as "CreditService"
  participant db as "Postgres"
  participant audit as "AuditService createManyAuditLogs"
  participant student as "student"
  participant parent as "linked parent"
  participant outsider as "unrelated family"
  participant legacy as "legacy credits-manage user"
  participant staff as "staff - VIEW only"

  operator->>svc: recordAdjustment ADD 4 classes
  svc->>db: insert CREDIT_ADJUSTMENT_ADD row plus 4
  svc->>db: classesTotal 4 - classesRemaining 4
  svc->>audit: UPDATE audit - Credit adjustment ADD

  operator->>svc: recordAdjustment SUBTRACT 2 classes
  svc->>db: insert CREDIT_ADJUSTMENT_SUBTRACT row minus 2
  svc->>db: classesRemaining 2 - total stays 4
  svc->>audit: UPDATE audit - Credit adjustment SUBTRACT

  student->>svc: getStudentBalance and getStudentTransactions
  svc-->>student: total 4 - remaining 2 - both ledger rows
  parent->>svc: same association-scoped reads
  svc-->>parent: same balance and ledger

  operator->>svc: repeated submission with same payload
  svc-->>operator: returns first row - no new write - no audit
  operator->>svc: SUBTRACT beyond remaining balance
  svc-->>operator: insufficientBalance error - zero writes

  outsider->>svc: any balance or ledger read
  svc-->>outsider: insufficientPermissions denial
  legacy->>svc: recordAdjustment with legacy permission only
  svc-->>legacy: read allowed - write denied
  staff->>svc: recordAdjustment without credits MANAGE
  svc-->>staff: denied before any write
  Note over svc,audit: adjustments carry no user notification fan-out
```

## credit-adjustment-carryover.test.ts

Subtract-with-carryover adjustments deduct the student's classes, stamp the carryover teacher and date-range columns on the ledger row, and hand the payout metadata to the carryover settlement boundary inside the same transaction. Concurrent operators both commit, an identical resubmission reuses the first row without a second handoff, and every denial path writes nothing.

```mermaid
sequenceDiagram
  autonumber
  participant opA as "operator A - admin"
  participant opB as "operator B - second admin"
  participant svc as "CreditService"
  participant handoff as "maybeInsertCarryoverBalanceEntry"
  participant db as "Postgres"
  participant student as "student"
  participant parent as "linked parent"
  participant teacher as "carryover payee teacher"

  opA->>svc: recordAdjustment ADD 6 classes - seed
  svc->>db: classesTotal 6 - classesRemaining 6

  opA->>svc: recordAdjustment SUBTRACT_WITH_CARRYOVER 2 classes
  svc->>db: CREDIT_ADJUSTMENT_CARRYOVER row minus 2 with teacher and dates
  svc->>db: classesRemaining 4 - total stays 6
  svc->>handoff: live tx plus payload id teacher student dates hours approver
  handoff-->>svc: resolves cleanly - payout table not deployed yet

  student->>svc: getStudentTransactions
  svc-->>student: carryover row with teacher and date range
  parent->>svc: same read
  svc-->>parent: same row
  Note over teacher: unrelated teachers receive nothing

  par concurrent distinct submits
    opA->>svc: carryover range Apr 1 to Apr 2
    opB->>svc: carryover range Apr 1 to Apr 3
  end
  svc->>db: both commit with distinct ids

  opA->>svc: identical payload resubmitted
  svc-->>opA: returns existing row - no new row - no second handoff

  opA->>svc: oversized hours or unknown or deleted teacher
  svc-->>opA: error - nothing written - no handoff
  Note over svc: permissionless operator is denied before any write
```

## credit-adjustment-security.test.ts

Adversarial probes against the real service stack: actors with real teacher, parent, or student permission groups are denied; adjustments against soft-deleted or unknown students and carryover teachers raise NotFoundError with zero writes; sequential and concurrent double-submits collapse onto one ledger row; and hostile notes are sanitized before persistence and read back sanitized.

```mermaid
flowchart TD
  A["actor calls CreditService recordAdjustment"] --> B{"holds credits manage permission?"}
  B -->|"no - teacher parent student actors"| C["ForbiddenError - zero writes"]
  B -->|"yes"| D{"target student exists and active?"}
  D -->|"soft-deleted"| E["NotFoundError STUDENT_NOT_FOUND - zero writes"]
  D -->|"unknown id"| E
  D -->|"yes"| F{"carryover teacher exists and active?"}
  F -->|"soft-deleted or unknown"| G["NotFoundError TEACHER_NOT_FOUND - zero writes"]
  F -->|"yes or not a carryover"| H["sanitize notes HTML - strip script and handlers"]
  H --> I{"idempotency key already committed?"}
  I -->|"yes - sequential or concurrent replay"| J["return first row - one ledger row total"]
  I -->|"no"| K["commit ledger row and balance change"]
  K --> L["transaction history read-back serves sanitized notes"]
```
