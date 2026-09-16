# Plan 6 — Expense Ledger: Specifications

> Spec-driven-development plan for the Siraj Station LMS Expense Ledger
> module observed in the customer reference video (auto-generated
> salary payouts + manual operational expenses, all in a single
> filterable grid).

---

## 1. Overview

After Plan 5 (Carryover Balance Module) lands, the platform gains the
ability to convert unpaid carryover records into expense rows (type
`Salaries`). After this plan (Plan 6) lands, those rows live in a new
`expenses` table alongside manually entered operational expenses
(`Marketing`, `Logistics`, `Technology`), all exposed through a single
filterable grid at `/accounting/expenses`.

The Siraj LMS already has:

- `teacher-dues` table — per-lesson accrual (different concept; not
  touched by this plan).
- `teacher-payments` table — cash disbursement records (different
  concept; not touched by this plan).
- `payments` table (Plan 1) — student cash-in records (read by Plan 7).

What the platform **does not yet have** is the canonical **Expense
Ledger** that the customer reference video shows: a single table that
holds both auto-generated salary payouts (Plan 5's `bulkCarryoverToExpense`)
and manually entered operational expenses, with CRUD + filter +
bulk-delete.

This plan introduces the `expenses` table as the single source of
truth for all outgoing money. Plan 5 writes `Salaries` rows into it;
accounting operators manually enter `Marketing`, `Logistics`,
`Technology` rows. Plan 7 reads from it to compute Total Expenses for
the P&L dashboard.

---

## 2. Goals & Non-Goals

### Goals
1. Introduce a new `expenses` table with: `teacherId` (nullable),
   `teacherName` (nullable), `title`, `type` (`Salaries`/`Marketing`/
   `Logistics`/`Technology`), `expenseValue`, `expenseCurrency`,
   `paymentDate`, `expenseDate` (YYYY-MM), `note`, `createdByUserId`,
   plus provenance fields (`sourceEntity`, `sourceEntityId`),
   soft-delete (`deletedAt`), and audit timestamps.
2. Expose `ExpenseService.create` / `update` / `delete` / `bulkDelete`
   as the canonical API used both by manual UI and by Plan 5's
   `bulkCarryoverToExpense` (via `createInternal` that accepts an
   existing Drizzle transaction).
3. Provide CRUD UI at `/accounting/expenses`: Add New, Edit, Delete,
   Bulk Delete, Filter (title, type, expenseDate month, payment date
   range), CSV export.
4. Auto-generate `Salaries` expense rows from Plan 5's `bulkCarryoverToExpense`
   action with provenance (`sourceEntity = 'carryover_balances'`).
5. Gate every mutation behind `ACCOUNTING_EXPENSES_MANAGE` and every
   read behind `ACCOUNTING_EXPENSES_VIEW`.
6. Emit a structured `audit_logs` entry on every create / update /
   delete / bulk-delete + soft-delete (so deleted rows remain
   reconstructible for audit).
7. Expose `sourceEntity` + `sourceEntityId` on every expense so
   drill-down can jump back to Plan 5's carryover row (or future
   source modules).

### Non-Goals (out of scope for this plan)
- The carryover-to-expense conversion flow — owned by Plan 5
  (`carryover-balance-module`). This plan owns the `expenses` table +
  the manual CRUD UI + the `ExpenseService.createInternal` callable
  from Plan 5's transaction.
- Tax / VAT / withholding calculation (separate finance plan).
- Multi-currency conversion at expense time — the `expenseValue` is
  stored in `expenseCurrency`; FX reconciliation is owned by the
  existing FX module.
- Receipts / attachments upload (deferred to a future plan).
- Approval workflow for expenses above a threshold (deferred).
- Recurring expense templates (deferred).
- Notifications on expense creation / deletion (separate notification plan).

---

## 3. Glossary

| Term                          | Meaning                                                                                              |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **Expense**                   | A row in the new `expenses` table — one outgoing monetary transaction.                              |
| **Expense type**              | One of `Salaries`, `Marketing`, `Logistics`, `Technology` — the new `ExpenseType` enum.             |
| **`Salaries` expense**        | Auto-generated from Plan 5's `bulkCarryoverToExpense`; not manually creatable (UI hides the option). |
| **Operational expense**       | Manually entered by an accounting operator for `Marketing`, `Logistics`, or `Technology`.            |
| **`expenseDate`**             | `YYYY-MM` string — the accounting month the expense belongs to (not the payment date).                |
| **`paymentDate`**             | Full ISO date — when the real-world payout happened (used by Plan 5's `bulkCarryoverToExpense`).     |
| **`sourceEntity`**            | Provenance field — `null` for manual expenses; `'carryover_balances'` for auto-generated salary rows. |
| **`sourceEntityId`**          | UUID pointer back to the source row (e.g., the `carryover_balances.id`).                            |
| **Soft-delete**               | `deletedAt` is set to `now()` instead of hard-deleting; rows remain for audit + Plan 7 reporting.    |
| **`teacherId` / `teacherName`**| Optional — set when the expense is tied to a teacher (always set for `Salaries`; sometimes for `Logistics` like a teacher transport reimbursement). |
| **`ExpenseService.createInternal`** | The internal entry point that accepts an existing Drizzle `tx` — called by Plan 5 inside its own transaction. |

---

## 4. User Stories & EARS Acceptance Criteria

EARS syntax used throughout:
- **Ubiquitous:** "The system shall <response>."
- **Event-driven:** "When <trigger>, the system shall <response>."
- **State-driven:** "While <state>, the system shall <response>."
- **Optional:** "Where <precondition>, the system shall <response>."
- **Unwanted:** "If <condition>, then the system shall <response>."

---

### US-1: Accounting operator opens the Expense Ledger list page

**As an** accounting operator
**I want** to open a dedicated Expense Ledger page under the Accounting
section
**So that** I can audit, edit, and delete both salary payouts and
operational expenses.

#### Acceptance Criteria (EARS)

- **AC-1.1 (Ubiquitous)** The system shall expose a route at
  `/accounting/expenses` that renders the Expense Ledger list page.
- **AC-1.2 (Event-driven)** When the user navigates to
  `/accounting/expenses` without the `ACCOUNTING_EXPENSES_VIEW`
  permission, the system shall render a 403 / insufficient-permissions
  state and shall **not** execute any expense query.
- **AC-1.3 (State-driven)** While the user holds the
  `ACCOUNTING_EXPENSES_VIEW` permission, the system shall render a
  paginated MUI `DataGrid` of expense rows with columns: title,
  type (chip), teacher (when set), value + currency, payment date,
  expense month, source (Manual / Carryover), note, created-at, and
  (when `ACCOUNTING_EXPENSES_MANAGE` is held) per-row Edit + Delete
  actions + bulk-action toolbar (Add New, Bulk Delete, Export CSV).
- **AC-1.4 (Event-driven)** When the user applies a filter (title
  search, type multi-select, expense month, payment date range), the
  system shall debounce the search by 300 ms and refetch with the new
  variables, preserving the current page size but resetting to page 1.
- **AC-1.5 (Event-driven)** When the sidebar renders for a user with
  `ACCOUNTING_EXPENSES_VIEW` or `ACCOUNTING_EXPENSES_MANAGE`, the
  system shall show an "Expenses" item under the `grp_finance` group
  with the `receiptLong` icon and href `/accounting/expenses`.
- **AC-1.6 (Event-driven)** When the user clicks "Export CSV", the
  system shall download the currently-filtered result set (max 10 000
  rows) as a UTF-8 CSV file with one row per expense.
- **AC-1.7 (State-driven)** While an expense row has
  `sourceEntity = 'carryover_balances'`, the system shall render a
  "From Carryover" chip in the row; clicking the chip opens the
  CarryoverDetailDrawer (Plan 5) for the linked carryover.

---

### US-2: Plan 5 auto-generates Salaries expenses

**As an** accounting system
**I want** the `bulkCarryoverToExpense` action (Plan 5) to insert
expense rows directly into the `expenses` table inside its own
transaction
**So that** the expense and the carryover update are atomic.

#### Acceptance Criteria (EARS)

- **AC-2.1 (Event-driven)** When Plan 5's `bulkCarryoverToExpense`
  runs, it shall call `ExpenseService.createInternal(input, tx,
  tErrors)` with `type = Salaries`, `teacherId`, `teacherName`,
  `title`, `expenseValue`, `expenseCurrency`, `paymentDate`,
  `expenseDate`, `note`, `sourceEntity = 'carryover_balances'`,
  `sourceEntityId = <carryoverId>`, `createdByUserId`.
- **AC-2.2 (State-driven)** While the caller passes an existing
  `tx`, `ExpenseService.createInternal` shall **not** open a new
  transaction — it shall use the caller's tx so the insert is atomic
  with the carryover update.
- **AC-2.3 (Event-driven)** When the insert succeeds, the service
  shall return the full `Expense` row (with `id`) so Plan 5 can store
  `carryover_balances.expenseId = <new id>`.
- **AC-2.4 (Event-driven)** When the insert fails (e.g., invalid
  `expenseDate` format), the service shall throw a typed
  `DomainError` (`EXPENSE_CREATE_FAILED` with a contextual reason);
  Plan 5's outer tx shall roll back.
- **AC-2.5 (Ubiquitous)** The system shall **not** allow manual
  creation of `Salaries` expense rows from the UI — the Add New modal
  (US-3) shall hide the `Salaries` option from the type dropdown.

---

### US-3: Add New / Edit / Delete / Bulk Delete (manual CRUD)

**As an** accounting operator
**I want** to manually create, edit, and delete operational expenses
**So that** the platform's expense ledger reflects real-world
operational spend.

#### Acceptance Criteria (EARS)

- **AC-3.1 (Event-driven)** When the operator clicks "Add New", the
  system shall open a modal/dialog with fields: title (text, required,
  max 200 chars), type (select: `Marketing` / `Logistics` /
  `Technology`; `Salaries` hidden per AC-2.5), teacher (autocomplete,
  optional), value (number, required, ≥ 0, max 12 digits + 2
  decimals), currency (currency select, required), paymentDate (date,
  required), expenseDate (month picker, `YYYY-MM`, required), note
  (textarea, optional, max 2000 chars).
- **AC-3.2 (Event-driven)** When the operator submits the Add New
  form, the system shall call `createExpense` with the supplied fields
  + `createdByUserId = actorUserId`; `sourceEntity = null`,
  `sourceEntityId = null`.
- **AC-3.3 (Event-driven)** When the operator clicks "Edit" on a row,
  the system shall open the same modal pre-filled; the `type` field is
  editable for operational expenses but **disabled** for `Salaries`
  expenses (a `Salaries` expense cannot be re-categorized; the
  operator must Unpay the carryover via Plan 5 instead).
- **AC-3.4 (Event-driven)** When the operator clicks "Delete" on a
  row, the system shall open a confirmation dialog showing title +
  value; on confirm, calls `deleteExpense(id)` which soft-deletes
  (`deletedAt = now()`).
- **AC-3.5 (State-driven)** While an expense has
  `sourceEntity = 'carryover_balances'` AND the linked carryover is
  `isPaid = true`, the system shall reject a direct delete with
  `EXPENSE_DELETE_VIA_UNPAY` and shall instead direct the operator to
  Plan 5's Unpay flow (which soft-deletes the expense + reverts the
  carryover atomically).
- **AC-3.6 (Event-driven)** When the operator selects multiple rows
  and clicks "Bulk Delete", the system shall call
  `bulkDeleteExpenses(ids)`; the bulk applies per-row guards (AC-3.5)
  atomically — either all-delete or all-roll-back.
- **AC-3.7 (Event-driven)** When the operator attempts a Bulk Delete
  that includes any AC-3.5-protected row, the system shall surface the
  rejection list and shall not soft-delete any of the unprotected rows
  in the batch (atomic — no partial delete).
- **AC-3.8 (Event-driven)** When the delete succeeds, the system shall
  emit an `audit_logs` row with `action = EXPENSE_DELETE`,
  `entityType = 'expenses'`, `entityId = <id>`, `actorUserId`,
  `metadata = { title, type, value, currency, sourceEntity }`.
- **AC-3.9 (Event-driven)** When the operator creates or edits an
  expense, the system shall emit an `audit_logs` row with
  `action = EXPENSE_CREATE` or `EXPENSE_UPDATE` accordingly.

---

### US-4: Filter the expense ledger

**As an** accounting operator
**I want** to filter the expense ledger by title, type, expense month,
and payment date range
**So that** I can focus on the slice I need to audit.

#### Acceptance Criteria (EARS)

- **AC-4.1 (Event-driven)** When the operator types a title search
  term, the system shall apply a `ILIKE '%term%'` filter on `title`
  (case-insensitive) and debounce by 300 ms.
- **AC-4.2 (Event-driven)** When the operator picks one or more types
  from the multi-select, the system shall filter by `type IN (...)`.
- **AC-4.3 (Event-driven)** When the operator picks an expense month
  (`YYYY-MM`), the system shall filter by `expenseDate = '<YYYY-MM>'`.
- **AC-4.4 (Event-driven)** When the operator picks a payment date
  range (`from` / `to`), the system shall filter by
  `paymentDate BETWEEN from AND to`.
- **AC-4.5 (Event-driven)** When the operator toggles "Include
  deleted" off (default), the system shall filter
  `deletedAt IS NULL`. When toggled on, soft-deleted rows appear with
  a strike-through chip.
- **AC-4.6 (Event-driven)** When the operator clicks "Clear filters",
  the system shall reset all filters to defaults.

---

### US-5: Permission gating

**As a** security-conscious platform
**I want** every expense operation to require a dedicated permission
**So that** only authorized accounting staff can read or modify
expenses.

#### Acceptance Criteria (EARS)

- **AC-5.1 (Ubiquitous)** The system shall require the
  `ACCOUNTING_EXPENSES_VIEW` permission for: viewing
  `/accounting/expenses`, calling the `expenses` query, and exporting
  CSV.
- **AC-5.2 (Ubiquitous)** The system shall require the
  `ACCOUNTING_EXPENSES_MANAGE` permission for: calling the
  `createExpense`, `updateExpense`, `deleteExpense`,
  `bulkDeleteExpenses` mutations, and seeing the bulk-action toolbar
  in the UI.
- **AC-5.3 (Event-driven)** When a user without
  `ACCOUNTING_EXPENSES_VIEW` calls the `expenses` query, the system
  shall reject with an `INSUFFICIENT_PERMISSIONS` GraphQL error and
  shall not execute the underlying query.
- **AC-5.4 (Event-driven)** When a user without
  `ACCOUNTING_EXPENSES_MANAGE` calls any of the mutations, the system
  shall reject with `INSUFFICIENT_PERMISSIONS` and shall not touch any
  row.
- **AC-5.5 (Event-driven)** When a mutation is allowed, the system
  shall record the authenticated user's id as the `actorUserId` on the
  emitted `audit_logs` row.
- **AC-5.6 (State-driven)** While `ExpenseService.createInternal` is
  called from within Plan 5's `bulkCarryoverToExpense`, the permission
  check shall be **bypassed** (the caller — Plan 5 — has already
  verified `ACCOUNTING_CARRYOVER_MANAGE`, which is a strictly stronger
  permission); `createInternal` is **never** exposed via GraphQL
  directly.

---

### US-6: Soft-delete semantics + audit trail

**As an** auditor
**I want** deleted expenses to remain in the table for audit +
reporting
**So that** no expense ever disappears from the ledger.

#### Acceptance Criteria (EARS)

- **AC-6.1 (Ubiquitous)** The system shall **never hard-delete** an
  `expenses` row. The `deleteExpense` and `bulkDeleteExpenses`
  mutations set `deletedAt = now()` + `deletedByUserId`.
- **AC-6.2 (Event-driven)** When the Plan 5 `unpayCarryoverBalance`
  flow runs, it shall call `ExpenseService.softDelete` to set
  `deletedAt` on the linked expense (idempotent if already soft-deleted).
- **AC-6.3 (Ubiquitous)** The system shall expose `deletedAt` +
  `deletedByUserId` + `deletedReason` on the GraphQL `Expense` type
  so audit views can render the soft-delete metadata.
- **AC-6.4 (Event-driven)** When an expense is soft-deleted, the
  system shall emit an `audit_logs` row with `action = EXPENSE_DELETE`,
  `entityId = <id>`, `actorUserId`, `metadata = { reason }`.
- **AC-6.5 (Event-driven)** When an expense is restored (via a future
  "Restore" action — out of scope for v1), the system shall clear
  `deletedAt` and emit an `audit_logs` row with
  `action = EXPENSE_RESTORE`. (v1 only emits `EXPENSE_DELETE`; restore
  is deferred.)
- **AC-6.6 (State-driven)** While an expense is soft-deleted, the
  default filter (US-4 AC-4.5) hides it; Plan 7's P&L aggregation also
  excludes it.

---

### US-7: Provenance & drill-down

**As an** accounting operator
**I want** to see where each expense came from
**So that** I can drill back to the originating artefact (carryover,
manual entry, future source).

#### Acceptance Criteria (EARS)

- **AC-7.1 (Ubiquitous)** The system shall persist `sourceEntity`
  (nullable string) + `sourceEntityId` (nullable uuid) on every
  expense row.
- **AC-7.2 (Event-driven)** When `sourceEntity = 'carryover_balances'`,
  the expense list row shall render a clickable "From Carryover" chip
  that opens the `CarryoverDetailDrawer` (Plan 5) for the linked
  `sourceEntityId`.
- **AC-7.3 (Event-driven)** When `sourceEntity IS NULL`, the row shall
  render a "Manual" chip (no click handler).
- **AC-7.4 (Event-driven)** When the operator opens the Add New modal,
  the `sourceEntity` is implicitly `null` (manual); the modal does not
  expose the field.
- **AC-7.5 (Ubiquitous)** The system shall expose `sourceEntity` +
  `sourceEntityId` on the GraphQL `Expense` type so future modules
  (vendor invoices, reimbursement requests) can write rows with their
  own provenance without changing the schema.

---

### US-8: Auditability & history

**As an** auditor
**I want** every expense mutation to be reconstructible
**So that** I can explain any outgoing payment.

#### Acceptance Criteria (EARS)

- **AC-8.1 (Ubiquitous)** The system shall expose the expense fields
  on a new `ExpensePothosObject` GraphQL type and `expense(id)` +
  `expenses(filter)` queries.
- **AC-8.2 (Event-driven)** When the operator opens an expense row
  detail drawer (or hovers), the system shall show: full fields,
  source chip (with drill-down), audit-log timeline (from
  `audit_logs.entityId = <id>`).
- **AC-8.3 (Ubiquitous)** The system shall never hard-delete an
  `audit_logs` row whose `action` starts with `EXPENSE_`;
  corrections are made via soft-delete + re-create, not by editing
  history.
- **AC-8.4 (Event-driven)** When an expense is updated, the system
  shall emit `audit_logs.metadata.previousValues` so the audit trail
  shows what changed.

---

## 5. Edge Cases

| # | Edge case                                                                                | Expected behavior                                                                                                                                              |
|---|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1 | Operator double-clicks "Add New" submit.                                                  | Second call returns the first-applied result; no duplicate expense rows (idempotency via `clientRequestId` + 30-second window).                                  |
| E2 | Edit attempt to change the `type` of a `Salaries` expense.                                | Field disabled in the UI; server rejects with `EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES` if the patch includes `type` and the existing row is `Salaries`.            |
| E3 | Delete on a `Salaries` expense whose carryover is `isPaid = true`.                         | Rejected with `EXPENSE_DELETE_VIA_UNPAY`; UI redirects to the Unpay flow on Plan 5.                                                                              |
| E4 | Delete on a `Salaries` expense whose carryover is `isPaid = false` (rare — only happens if the carryover was unpaid but the expense wasn't soft-deleted). | Allowed — soft-delete proceeds; the carryover is already unpaid so no cascade needed.                                                                              |
| E5 | Bulk Delete where 1 of 5 rows is a `Salaries` expense with `isPaid = true` carryover.     | Whole batch rejected with `EXPENSE_DELETE_VIA_UNPAY`; no rows soft-deleted (atomic).                                                                              |
| E6 | `expenseDate` not in `YYYY-MM` format.                                                    | Mutation validation rejects with `EXPENSE_DATE_INVALID`.                                                                                                         |
| E7 | `paymentDate` not in ISO date format.                                                    | Mutation validation rejects with `PAYMENT_DATE_INVALID`.                                                                                                         |
| E8 | `expenseValue` is negative.                                                              | Mutation validation rejects with `EXPENSE_VALUE_NEGATIVE`.                                                                                                       |
| E9 | `expenseValue` has more than 2 decimal places.                                          | Server rounds to 2 decimals (banker's rounding) and stores as numeric(12,2).                                                                                    |
| E10 | `title` exceeds 200 characters.                                                          | Server truncates to 200 with an ellipsis at 197; logs a warning.                                                                                                |
| E11 | `note` exceeds 2 000 characters.                                                          | Server truncates to 2 000 with an ellipsis; logs a warning.                                                                                                     |
| E12 | `note` contains `<script>` tags.                                                         | Server sanitizer strips tags (plain-text field, not rich-text); persisted as escaped plain text.                                                                |
| E13 | CSV export exceeds 10 000 rows.                                                           | Server caps at 10 000, includes a `X-Export-Truncated: true` header, and shows a toast in the UI warning that the export was truncated.                          |
| E14 | Two operators concurrently edit the same expense.                                        | Last-writer-wins on the row; both `audit_logs` rows preserved chronologically.                                                                                  |
| E15 | Soft-deleted expense appears in Plan 7's P&L aggregation.                                  | Excluded by default (AC-6.6); the aggregation query filters `deletedAt IS NULL`.                                                                                  |
| E16 | `Salaries` expense created via Plan 5 with `teacherName` snapshot later diverges from `teachers.user.displayName`. | The snapshot is preserved on the expense; no auto-refresh (consistent with Plan 5's `isDisabledTeacher` snapshot policy).                                       |
| E17 | Operator has `ACCOUNTING_EXPENSES_VIEW` but not `_MANAGE`.                               | Expense page renders read-only; toolbar hidden; mutations rejected at the GraphQL layer.                                                                        |
| E18 | RTL / Arabic locale active.                                                              | All labels, type chips, the Add New / Edit modal, and the date pickers render RTL.                                                                              |
| E19 | `sourceEntity = 'carryover_balances'` but the linked carryover was hard-deleted (Plan 5 E9). | The "From Carryover" chip renders as disabled; the drill-down query returns a 404; the expense row itself is unaffected (no cascade).                            |
| E20 | Expense created with `teacherId` set to a teacher who is later deactivated.               | The expense's `teacherName` snapshot stays; the `teachers.user.status` change does not cascade to the expense.                                                  |

---

## 6. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                          |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | Performance     | The `/accounting/expenses` list shall render its first paint in < 1.5 s on a 5 000-expense dataset (server + network).                                               |
| NFR-2  | Performance     | The `createExpense` mutation shall complete in < 300 ms p95 (single insert + audit log).                                                                              |
| NFR-3  | Performance     | The `bulkDeleteExpenses` mutation shall complete in < 1 s p95 for a batch of 20 expenses (20 soft-deletes + 20 audit logs in one tx).                                 |
| NFR-4  | Concurrency     | The create idempotency guard shall hold under concurrent duplicate submissions (same `clientRequestId`) — exactly one row mutation, one audit row.                  |
| NFR-5  | Security        | All mutations shall be authenticated, permission-scoped, and shall record `actorUserId` from the session — never from a client-supplied field.                       |
| NFR-6  | Auditability    | Every create / update / delete / bulk-delete / soft-delete action shall be reconstructible from `expenses` + `audit_logs` alone.                                    |
| NFR-7  | i18n            | All user-facing strings (page title, column headers, chips, modals, toasts, errors) shall be available in EN and AR via the compile-time i18n pipeline.            |
| NFR-8  | Accessibility   | The DataGrid, filter bar, Add New / Edit modal, Bulk Delete confirmation dialog, and date pickers shall be keyboard-navigable and labelled for screen readers (WCAG 2.1 AA). |
| NFR-9  | Data integrity  | The create / update / soft-delete writes + audit log insert shall be in the same PostgreSQL transaction.                                                              |
| NFR-10 | Compatibility   | The schema migration shall be additive-only (new table); zero downtime for existing flows.                                                                          |
| NFR-11 | Observability   | Every mutation shall emit a structured log event with `actorUserId`, `expenseId`, `action`, `value`, `currency`.                                                     |
| NFR-12 | Currency safety | The `expenseValue` is stored in `expenseCurrency`; no FX conversion at write time (FX is owned by the existing module + Plan 7's P&L aggregation).                    |

---

## 7. Traceability Matrix

| AC        | Covered by implementation section                              | Test file                                                                |
|-----------|----------------------------------------------------------------|--------------------------------------------------------------------------|
| AC-1.x    | Frontend › Routes & Navigation                                | `expense-list.page.test.tsx`                                            |
| AC-2.x    | Service › `createInternal` (Plan 5 cross-call)                | `expense-internal.service.test.ts`                                       |
| AC-3.x    | Service › `create/update/delete/bulkDelete` + Frontend › ExpenseFormDialog | `expense-crud.service.test.ts` + `ExpenseFormDialog.test.tsx`     |
| AC-4.x    | Frontend › FilterBar + Repository › filter query              | `expense-filter.repository.test.ts` + `ExpenseFilterBar.test.tsx`     |
| AC-5.x    | GraphQL › `requirePermission` + route middleware              | `expense.mutation.test.ts` › "permission denied"                      |
| AC-6.x    | Service › `softDelete` semantics + audit_logs                  | `expense-softdelete.service.test.ts`                                    |
| AC-7.x    | GraphQL › `ExpensePothosObject` source fields + drill-down    | `expense-drilldown.test.ts`                                              |
| AC-8.x    | GraphQL › `ExpensePothosObject` + audit_logs timeline         | `expense-audit.test.ts`                                                  |

---

## 8. Open Questions

| # | Question                                                                                                                | Status | Default assumed                                                          |
|---|-------------------------------------------------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------|
| Q1 | Should the `ExpenseType` enum be extensible at runtime (admin-defined types) or fixed at the 4 values? | Open   | Fixed at 4 values in v1; runtime extension deferred. |
| Q2 | Should the `Salaries` type be hidden from the Add New modal entirely, or shown-but-disabled? | Open   | Hidden entirely (AC-2.5) — operators must use Plan 5's flow to create salary expenses. |
| Q3 | Should soft-deleted expenses be restorable in v1? | Open   | No — only `deletedAt` is set; restore action deferred. |
| Q4 | Should the `teacherId` field on an operational expense (e.g., a teacher reimbursement under `Logistics`) trigger any cascade when the teacher is deactivated? | Open   | No cascade in v1 — the `teacherName` snapshot is preserved. |
| Q5 | Should the `expenseValue` be editable on a `Salaries` expense? | Open   | No — value is read-only for `Salaries` expenses (must Unpay + re-pay via Plan 5). |
| Q6 | Should the expense ledger support multi-currency aggregation in the footer? | Open   | No — single dominant currency in v1; Plan 7 handles per-currency P&L. |
| Q7 | Should `ExpenseService.createInternal` be exposed via a separate internal GraphQL endpoint, or strictly a TypeScript service call from Plan 5? | Open   | Strictly a TypeScript service call — never exposed via GraphQL (AC-5.6). |
