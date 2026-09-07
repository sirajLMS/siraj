# Expenses workflow journey diagrams

Mermaid diagrams for the cross-actor journey suites in this directory. Each section maps to one test file and uses the same actor names, service entry points, and event types as the journey code.

## carryover-unpay-expense-softdelete.test.ts

The accounting operator aggregates two audited sessions into an unpaid carryover, adds a manual bystander expense, and settles the carryover to a provenance-linked Salaries expense. While the carryover is paid the row is protected: a direct soft-delete rejects `EXPENSE_DELETE_VIA_UNPAY` and a bulk delete containing it rolls back atomically, leaving the bystander untouched. Un paying the carryover soft-deletes the expense in the same transaction, the default ledger view hides it while `includeDeleted` keeps it with its deletion marker, and exactly one EXPENSE_DELETE audit row carries the unpay note; double-reversal and view-only/staff/teacher denials leave the state untouched.

```mermaid
sequenceDiagram
  autonumber
  participant operator as "operator - academy_admin"
  participant viewer as "viewer - expenses view-only group"
  participant staff as "staff - staff_default"
  participant teacher as "teacher - teacher_default"
  participant carryover as "CarryoverBalanceService"
  participant ledger as "ExpenseService"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"

  operator->>carryover: bulkCreateCarryoverBalances audited sessions
  carryover->>db: carryover unpaid - sessions WAITING_PAID and linked
  operator->>ledger: create manual bystander expense
  ledger->>db: EXPENSE_CREATE audit row
  viewer->>ledger: getReport default view
  ledger-->>viewer: manual row visible

  operator->>carryover: bulkCarryoverToExpense payment date
  carryover->>db: carryover paid - provenance-linked Salaries expense
  db-->>operator: EXPENSE_CREATE audit row for settled expense
  viewer->>ledger: getReport default view
  ledger-->>viewer: settled row visible

  operator->>ledger: softDelete settled expense directly
  ledger-->>operator: EXPENSE_DELETE_VIA_UNPAY - use the Unpay flow
  operator->>ledger: bulkDelete manual plus protected
  ledger->>db: transaction rolls back - bystander untouched
  ledger-->>operator: EXPENSE_DELETE_VIA_UNPAY

  operator->>carryover: unpayCarryoverBalance with note
  carryover->>db: atomic tx - carryover unpaid and expense soft-deleted
  db-->>operator: one EXPENSE_DELETE audit row with reason
  viewer->>ledger: getReport default view
  ledger-->>viewer: deleted row hidden
  viewer->>ledger: getReport includeDeleted
  ledger-->>viewer: row visible with deletedAt and reason

  operator->>carryover: unpayCarryoverBalance again
  carryover-->>operator: carryover notPaid rejection - deletedAt unchanged
  viewer->>carryover: unpayCarryoverBalance
  carryover-->>viewer: ForbiddenError insufficientPermissions
  staff->>ledger: bulkDelete
  ledger-->>staff: ForbiddenError insufficientPermissions
  teacher->>ledger: getReport
  ledger-->>teacher: ForbiddenError insufficientPermissions
  Note over operator,notify: zero dispatches across the whole journey
```
