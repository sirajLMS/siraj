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
