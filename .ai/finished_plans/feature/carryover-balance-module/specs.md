# Plan 5 — Carryover Balance Module: Specifications

> Spec-driven-development plan for the Siraj Station LMS Carryover
> Balance module observed in the customer reference video
> (aggregate teacher payout settlement, real-world payout → expense
> conversion).

---

## 1. Overview

After Plan 3 (Teacher Payroll Calculation Engine) and Plan 4 (Session
Event Audit) land, every audited `class_instances` row carries a
final `calculationStatus` (`CALCULATED`, `PARTIALLY`, `REFUND`) and a
pre-computed `teacherPaidAmount` + `teacherPaidCurrency`. The Siraj
LMS already has a `teacher_dues` table that accrues one row per
approved lesson report, but it has no concept of an **aggregate
payout settlement** — the operator-facing artefact shown in the
reference video where many audited sessions are bundled into a single
payable record per teacher, then paid out in the real world and
finally converted to an `Expense` (Plan 6).

The customer reference video shows:

1. **Bulk "Carryover Balance" action** — admin selects audited session
   rows on the Session Event Audit grid (Plan 4), then the system
   aggregates them by teacher (students count, students text,
   total duration in hours, payable amount in the teacher's currency)
   and creates one `carryover_balances` row per teacher. The
   underlying sessions transition to `WAITING_PAID`.
2. **Manual CRUD** — Add New / Edit / Delete / Bulk Delete on the
   carryover list.
3. **Bulk "To Expense" action** — admin selects unpaid carryover
   records, opens a modal with Payment Date + Expense Date (month),
   confirms, and the system creates one `expenses` row per carryover
   (type `Salaries`), marks the carryover as paid, and transitions the
   underlying sessions to `PAID`.
4. **Filter** — by teacher, paid status (`Paid`/`Unpaid`/`Both`),
   date ranges, and a disabled-teachers toggle.
5. **Read model** — the carryover list is a paginated, filterable
   MUI `DataGrid` with per-row totals and a bulk-action toolbar.

This plan introduces a new `carryover_balances` table that is the
**link** between Plan 3/4's per-session payroll computation and Plan
6's `expenses` ledger. It does **not** fork the existing
`teacher_dues` / `teacher_payments` flows — those remain the source of
truth for the existing per-lesson accrual. Carryover is a
**settlement aggregate** that sits on top of `class_instances` +
`teacher_dues`.

---

## 2. Goals & Non-Goals

### Goals
1. Introduce a new `carryover_balances` table that aggregates many
   audited `class_instances` rows into one payable record per teacher,
   with: teacherId, studentsCount, studentsText, totalDuration
   (hours), payable amount, teacherCurrency, paid amount, fromDate,
   toDate, paymentDate, isDisabledTeacher, isPaid.
2. Provide a "Bulk Carryover" mutation that takes a list of audited
   session ids, groups them by teacher, creates one
   `carryover_balances` row per group, links the underlying sessions
   to it via a new `carryover_balance_id` FK on `class_instances`, and
   transitions the sessions to `WAITING_PAID` (Plan 3's `CalculationStatus`).
3. Provide a "Bulk To Expense" mutation that converts unpaid carryover
   rows into Plan 6 `expenses` rows (type `Salaries`), marks the
   carryover as paid, sets `paymentDate`, and transitions the linked
   sessions to `PAID` in the same transaction.
4. Provide full CRUD on carryover records (Add New, Edit, Delete, Bulk
   Delete) with safe deletion semantics (delete a carryover row only
   unlinks the linked sessions; it never silently discards a paid
   carryover).
5. Provide a paginated, filterable `/accounting/carryover` page with
   filter (teacher, paid status, date range, disabled teachers toggle)
   and a per-row aggregate footer.
6. Gate every mutation behind `ACCOUNTING_CARRYOVER_MANAGE` and every
   read behind `ACCOUNTING_CARRYOVER_VIEW`.
7. Emit a structured `audit_logs` entry on every bulk create, edit,
   delete, and to-expense action so the trail is reconstructible.

### Non-Goals (out of scope for this plan)
- Disbursing cash to teachers — that stays in the existing
  `teacher_payments` flow when an accounting operator pays a teacher
  via a payment method snapshot. Carryover's `isPaid = true` only
  marks that **an expense row** was created; the cash disbursement
  itself may or may not have happened (the video shows the operator
  recording the payment date so accounting can reconcile).
- The `expenses` table schema — that is owned by Plan 6
  (`expense-ledger`). This plan **writes** rows into Plan 6's table
  via a service call; it does not duplicate it.
- Per-session recalculations — Plan 3 owns the calculation layer;
  carryover aggregates whatever Plan 3 already produced.
- Multi-currency conversion at payout time — handled by the existing
  FX module. Carryover stores the teacher's `teacherCurrency` snapshot
  and the payable amount in that currency; expense rows created from
  it inherit the same currency.
- Notifications to teachers on payout (separate notification plan).
- Bulk CSV import of carryover records (out of scope for v1).

---

## 3. Glossary

| Term                          | Meaning                                                                                              |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **Carryover Balance**         | A row in the new `carryover_balances` table — one aggregate payable record per teacher, spanning a date range. |
| **Audited session**           | A `class_instances` row whose `calculationStatus` is one of `CALCULATED`, `PARTIALLY`, `REFUND` (Plan 3) and which is not yet linked to a carryover. |
| **Bulk Carryover action**     | The mutation that takes a list of audited session ids, groups by teacher, and creates one `carryover_balances` row per group. |
| **Bulk To Expense action**    | The mutation that takes a list of unpaid carryover ids, creates `expenses` rows (type `Salaries`), marks the carryover as paid, and transitions sessions to `PAID`. |
| **`studentsCount`**           | The number of distinct students across the aggregated sessions.                                     |
| **`studentsText`**            | A comma-separated, human-readable string of student names (truncated to 500 chars).                  |
| **`totalDuration`**           | Sum of `calculatedDuration` (minutes) across the aggregated sessions, divided by 60, rounded to 2 decimals — i.e. billable hours. |
| **`payable`**                 | The aggregate `teacherPaidAmount` across the aggregated sessions (numeric 12,2).                     |
| **`teacherCurrency`**         | Snapshot of the dominant currency across the aggregated sessions (defaults to `teachers.rateCurrency`). |
| **`paid`**                    | The amount paid so far against this carryover (always equals `payable` once `isPaid = true`; 0 otherwise). |
| **`isDisabledTeacher`**       | Snapshot boolean at creation time — true when the linked teacher's `users.status = DEACTIVATED`.     |
| **`isPaid`**                  | Boolean — true once a "Bulk To Expense" has produced an expense row for this carryover.               |
| **`fromDate` / `toDate`**     | Min / max scheduled-start dates across the aggregated sessions.                                     |
| **`paymentDate`**             | Operator-supplied date on the "Bulk To Expense" modal — when the real-world payout happened.         |
| **Linked sessions**           | The `class_instances` rows whose `carryover_balance_id` FK points at this carryover row.             |

---

## 4. User Stories & EARS Acceptance Criteria

EARS syntax used throughout:
- **Ubiquitous:** "The system shall <response>."
- **Event-driven:** "When <trigger>, the system shall <response>."
- **State-driven:** "While <state>, the system shall <response>."
- **Optional:** "Where <precondition>, the system shall <response>."
- **Unwanted:** "If <condition>, then the system shall <response>."

---

### US-1: Accounting operator opens the Carryover Balance list page

**As an** accounting operator
**I want** to open a dedicated Carryover Balance page under the
Accounting section
**So that** I can audit, edit, and settle aggregate teacher payouts.

#### Acceptance Criteria (EARS)

- **AC-1.1 (Ubiquitous)** The system shall expose a route at
  `/accounting/carryover` that renders the Carryover Balance list page.
- **AC-1.2 (Event-driven)** When the user navigates to
  `/accounting/carryover` without the `ACCOUNTING_CARRYOVER_VIEW`
  permission, the system shall render a 403 / insufficient-permissions
  state and shall **not** execute any carryover query.
- **AC-1.3 (State-driven)** While the user holds the
  `ACCOUNTING_CARRYOVER_VIEW` permission, the system shall render a
  paginated MUI `DataGrid` of carryover rows with columns: teacher,
  students count, students text, total duration (hours), payable +
  currency, paid + currency, from date, to date, payment date,
  disabled-teacher chip, paid chip, and (when
  `ACCOUNTING_CARRYOVER_MANAGE` is held) per-row Edit + Delete actions
  and a bulk-action toolbar (Add New, Bulk To Expense, Bulk Delete).
- **AC-1.4 (Event-driven)** When the user applies a filter (teacher,
  paid status, date range, disabled teachers toggle), the system
  shall debounce by 300 ms and refetch with the new variables,
  preserving the current page size but resetting to page 1.
- **AC-1.5 (Event-driven)** When the sidebar renders for a user with
  `ACCOUNTING_CARRYOVER_VIEW` or `ACCOUNTING_CARRYOVER_MANAGE`, the
  system shall show a "Carryover" item under the `grp_finance` group
  with the `accountBalanceWallet` icon and href `/accounting/carryover`.
- **AC-1.6 (Event-driven)** When the user clicks "Export CSV", the
  system shall download the currently-filtered result set (max
  10 000 rows) as a UTF-8 CSV file with one row per carryover.

---

### US-2: Bulk "Carryover Balance" action aggregates audited sessions

**As an** accounting operator
**I want** to select audited session rows on the Plan 4 audit grid and
create aggregate carryover records per teacher
**So that** I can settle many sessions as a single payout.

#### Acceptance Criteria (EARS)

- **AC-2.1 (Event-driven)** When the operator selects one or more
  audited session rows on `/accounting/reports` (Plan 4) and clicks
  the "Carryover Balance" bulk action, the system shall call the
  `bulkCreateCarryoverBalances` mutation with the selected instance ids
  + the actor's id.
- **AC-2.2 (Event-driven)** When the mutation runs, the system shall
  group the selected instances by `teacherId` and create **one**
  `carryover_balances` row per group.
- **AC-2.3 (State-driven)** While a selected instance is not in an
  audited state (`calculationStatus` not in `CALCULATED`, `PARTIALLY`,
  `REFUND`), the system shall reject the mutation with a
  `CARRYOVER_SESSION_NOT_AUDITED` domain error and shall not create
  any carryover row.
- **AC-2.4 (State-driven)** While a selected instance is already
  linked to a carryover (`carryover_balance_id IS NOT NULL`), the
  system shall reject with `CARRYOVER_SESSION_ALREADY_LINKED` and shall
  not modify any row.
- **AC-2.5 (Event-driven)** When the mutation succeeds for a group,
  the system shall, in a single transaction:
  1. Insert a `carryover_balances` row with `teacherId`, `studentsCount`,
     `studentsText`, `totalDuration` (hours, 2 decimals), `payable`
     (sum of `teacherPaidAmount`), `teacherCurrency` (dominant
     currency), `paid = 0`, `fromDate`, `toDate`, `isDisabledTeacher`
     (snapshot), `isPaid = false`, `createdByUserId = actorUserId`.
  2. Update every instance in the group to set
     `carryover_balance_id = <new id>`, `calculationStatus =
     WAITING_PAID`, and emit a `PAYROLL_STATUS_TRANSITION` event
     (Plan 3 AC-9.4).
- **AC-2.6 (Event-driven)** When the `studentsText` would exceed
  500 characters, the system shall truncate to 497 chars + an
  ellipsis and persist the truncated form.
- **AC-2.7 (Event-driven)** When the group mixes currencies (rare,
  but possible if a teacher's rate currency changed mid-period), the
  system shall pick the **dominant** currency (the one with the most
  rows) and convert the others via the existing FX module's latest
  rate; the converted rows' original amounts are preserved in
  `carryover_balance_items.originalAmount` (see §5.3).
- **AC-2.8 (Unwanted)** If the FX rate is missing for any
  cross-currency conversion, the system shall fail the whole mutation
  with `CARRYOVER_FX_RATE_MISSING` and shall not create any row.
- **AC-2.9 (Event-driven)** When the same `bulkCreateCarryoverBalances`
  mutation is submitted twice with the same `clientRequestId` within
  a 60-second window, the system shall return the first-applied
  result and shall not create duplicate carryover rows.
- **AC-2.10 (Event-driven)** When the mutation succeeds, the system
  shall emit one `audit_logs` row per created carryover with
  `action = CARRYOVER_CREATE`, `entityId = carryover.id`,
  `actorUserId`, and `metadata = { instanceIds, studentsCount,
  totalDuration, payable, currency }`.

---

### US-3: Bulk "To Expense" converts unpaid carryover to expenses

**As an** accounting operator
**I want** to select unpaid carryover records and convert them to
expenses
**So that** the platform's P&L reflects the real-world teacher payout.

#### Acceptance Criteria (EARS)

- **AC-3.1 (Event-driven)** When the operator selects one or more
  unpaid carryover rows on `/accounting/carryover` and clicks the
  "Bulk To Expense" bulk action, the system shall open a modal with
  two required fields: Payment Date (date) + Expense Date (month,
  `YYYY-MM`).
- **AC-3.2 (Event-driven)** When the operator confirms the modal, the
  system shall call the `bulkCarryoverToExpense` mutation with the
  selected carryover ids, `paymentDate`, `expenseDate` (YYYY-MM),
  `note` (optional), and `clientRequestId`.
- **AC-3.3 (State-driven)** While a selected carryover has
  `isPaid = true`, the system shall reject with
  `CARRYOVER_ALREADY_PAID` and shall not modify any row.
- **AC-3.4 (Event-driven)** When the mutation succeeds for a
  carryover, the system shall, in a single transaction:
  1. Insert an `expenses` row (Plan 6) with `teacherId`, `teacherName`
     (snapshot), `title = "Teacher payout — <fromDate> to <toDate>"`,
     `type = Salaries`, `expenseValue = payable`,
     `expenseCurrency = teacherCurrency`, `paymentDate`,
     `expenseDate` (YYYY-MM), `note`, `createdByUserId = actorUserId`,
     `sourceEntity = carryover_balances`, `sourceEntityId = carryover.id`.
  2. Update the carryover row to set `isPaid = true`, `paid =
     payable`, `paymentDate = <input>`, `expenseId = <new id>`,
     `paidAt = now()`, `paidByUserId = actorUserId`.
  3. Update every linked session to set `calculationStatus = PAID`
     and emit a `PAYROLL_STATUS_TRANSITION` event (Plan 3 AC-9.5).
- **AC-3.5 (Event-driven)** When the mutation succeeds, the system
  shall emit one `audit_logs` row per converted carryover with
  `action = CARRYOVER_TO_EXPENSE`, `entityId = carryover.id`,
  `actorUserId`, and `metadata = { expenseId, paymentDate, expenseDate,
  amount, currency }`.
- **AC-3.6 (Unwanted)** If Plan 6's `ExpenseService.create` fails for
  any carryover (e.g., invalid `expenseDate`), the whole mutation
  shall roll back with `CARRYOVER_TO_EXPENSE_FAILED` and a contextual
  reason.
- **AC-3.7 (Event-driven)** When the same `bulkCarryoverToExpense`
  mutation is submitted twice with the same `clientRequestId` within
  a 60-second window, the system shall return the first-applied
  result and shall not create duplicate expenses.
- **AC-3.8 (Event-driven)** When the operator does not provide an
  `expenseDate`, the system shall default it to the YYYY-MM of
  `paymentDate` so the expense lands in the same month as the payout.

---

### US-4: Add New / Edit / Delete / Bulk Delete (CRUD)

**As an** accounting operator
**I want** to manually create, edit, and delete carryover records
**So that** I can correct errors and handle edge cases not covered by
the bulk actions.

#### Acceptance Criteria (EARS)

- **AC-4.1 (Event-driven)** When the operator clicks "Add New", the
  system shall open a modal/dialog with fields: teacher (autocomplete,
  required), fromDate (date, required), toDate (date, required,
  `>= fromDate`), payable (number, required, ≥ 0), teacherCurrency
  (currency select, required), studentsCount (integer, optional),
  studentsText (text, optional), note (textarea, optional). The modal
  does **not** require linked sessions — a manual carryover can stand
  alone (the video shows ad-hoc settlement).
- **AC-4.2 (Event-driven)** When the operator submits the Add New
  form, the system shall call `createCarryoverBalance` with the
  supplied fields + `createdByUserId = actorUserId`; the mutation
  creates a row with `isPaid = false`, `paid = 0`,
  `isDisabledTeacher` = current snapshot of the teacher's
  `users.status`, and `totalDuration = null` (manual carryover has no
  aggregated hours).
- **AC-4.3 (Event-driven)** When the operator clicks "Edit" on a row,
  the system shall open the same modal pre-filled with the row's
  values; the `teacher` field is read-only (teacher re-assignment is
  not allowed via edit — must delete + recreate).
- **AC-4.4 (Event-driven)** When the operator submits the Edit form,
  the system shall call `updateCarryoverBalance(id, patch)`; the
  patch is restricted to `fromDate`, `toDate`, `payable`,
  `teacherCurrency`, `studentsCount`, `studentsText`, `note`.
- **AC-4.5 (Event-driven)** When the operator clicks "Delete" on a
  single row, the system shall open a confirmation dialog showing
  the row's teacher + payable; on confirm, calls
  `deleteCarryoverBalance(id)`.
- **AC-4.6 (State-driven)** While a carryover has `isPaid = true`,
  the system shall reject the delete with `CARRYOVER_PAID_CANNOT_DELETE`
  and shall instead offer "Unpay" (see US-7).
- **AC-4.7 (Event-driven)** When the delete succeeds, the system
  shall unlink the linked sessions (`carryover_balance_id = NULL`,
  revert `calculationStatus` from `WAITING_PAID` back to its prior
  value stored on `carryover_balance_items.originalStatus`), then
  hard-delete the carryover row + its items, all in one transaction.
- **AC-4.8 (Event-driven)** When the operator selects multiple rows
  and clicks "Bulk Delete", the system shall call
  `bulkDeleteCarryoverBalances(ids)`; the bulk applies per-row guards
  (AC-4.6) atomically — either all-delete or all-roll-back.
- **AC-4.9 (Event-driven)** When the operator attempts a Bulk Delete
  that includes any `isPaid = true` row, the system shall surface
  the rejection list and shall not delete any of the unpaid rows in
  the batch (atomic per the operator's intent — no partial delete).
- **AC-4.10 (Event-driven)** When the operator deletes a carryover,
  the system shall emit an `audit_logs` row with
  `action = CARRYOVER_DELETE`, `entityId = carryover.id`,
  `actorUserId`, `metadata = { teacherId, payable, currency }`.

---

### US-5: Filter the carryover list

**As an** accounting operator
**I want** to filter the carryover list by teacher, paid status,
date range, and disabled teachers
**So that** I can focus on the slice I need to settle.

#### Acceptance Criteria (EARS)

- **AC-5.1 (Event-driven)** When the operator picks a teacher from
  the autocomplete, the system shall filter rows by exact `teacherId`.
- **AC-5.2 (Event-driven)** When the operator picks a paid status
  (`Paid` / `Unpaid` / `Both`), the system shall filter `isPaid`
  accordingly; `Both` disables the filter.
- **AC-5.3 (Event-driven)** When the operator picks a date range
  (`fromDate` / `toDate` on the carryover, not the session), the
  system shall filter rows where `carryover.fromDate >= filter.from`
  AND `carryover.toDate <= filter.to`.
- **AC-5.4 (Event-driven)** When the operator toggles "Show disabled
  teachers" off (default), the system shall filter rows where
  `isDisabledTeacher = false`. When toggled on, no filter is applied.
- **AC-5.5 (Event-driven)** When the operator types a search term
  (matches teacher name OR studentsText, case-insensitive), the
  system shall apply a `ILIKE` filter and debounce by 300 ms.
- **AC-5.6 (Event-driven)** When the operator clicks "Clear filters",
  the system shall reset all filters to defaults (paid status =
  `Both`, disabled toggle off, no search term, no date range).

---

### US-6: Permission gating

**As a** security-conscious platform
**I want** every carryover operation to require a dedicated permission
**So that** only authorized accounting staff can read or settle
payouts.

#### Acceptance Criteria (EARS)

- **AC-6.1 (Ubiquitous)** The system shall require the
  `ACCOUNTING_CARRYOVER_VIEW` permission for: viewing
  `/accounting/carryover`, calling the `carryoverBalances` query, and
  exporting CSV.
- **AC-6.2 (Ubiquitous)** The system shall require the
  `ACCOUNTING_CARRYOVER_MANAGE` permission for: calling the
  `bulkCreateCarryoverBalances`, `bulkCarryoverToExpense`,
  `createCarryoverBalance`, `updateCarryoverBalance`,
  `deleteCarryoverBalance`, `bulkDeleteCarryoverBalances`, and
  `unpayCarryoverBalance` mutations, and seeing the bulk-action
  toolbar in the UI.
- **AC-6.3 (Event-driven)** When a user without
  `ACCOUNTING_CARRYOVER_VIEW` calls the `carryoverBalances` query,
  the system shall reject with an `INSUFFICIENT_PERMISSIONS` GraphQL
  error and shall not execute the underlying query.
- **AC-6.4 (Event-driven)** When a user without
  `ACCOUNTING_CARRYOVER_MANAGE` calls any of the mutations, the
  system shall reject with `INSUFFICIENT_PERMISSIONS` and shall not
  touch any row.
- **AC-6.5 (Event-driven)** When a mutation is allowed, the system
  shall record the authenticated user's id as the `actorUserId` on
  the emitted `audit_logs` row.

---

### US-7: Unpay a paid carryover (correction flow)

**As an** accounting operator
**I want** to "unpay" a carryover that was mistakenly converted to
expense
**So that** I can correct the payout without losing the audit trail.

#### Acceptance Criteria (EARS)

- **AC-7.1 (Event-driven)** When the operator clicks "Unpay" on a
  paid carryover row, the system shall open a confirmation dialog
  warning that the linked expense will be soft-deleted (Plan 6) and
  the sessions will revert to `WAITING_PAID`.
- **AC-7.2 (Event-driven)** When the operator confirms, the system
  shall call `unpayCarryoverBalance(id, note)`; in a single
  transaction:
  1. Soft-delete the linked `expenses` row (Plan 6's `deletedAt`).
  2. Revert the carryover row to `isPaid = false`, `paid = 0`,
     `paymentDate = null`, `expenseId = null`, `paidAt = null`,
     `paidByUserId = null`.
  3. Revert every linked session's `calculationStatus` to
     `WAITING_PAID` (from `PAID`) and emit a `PAYROLL_STATUS_TRANSITION`
     event with `toState = WAITING_PAID`.
- **AC-7.3 (Event-driven)** When the unpay succeeds, the system shall
  emit an `audit_logs` row with `action = CARRYOVER_UNPAID`,
  `entityId = carryover.id`, `actorUserId`, `metadata = { expenseId,
  reason: note }`.
- **AC-7.4 (State-driven)** While the linked `expenses` row is
  already soft-deleted, the system shall skip the soft-delete step
  and proceed with the carryover revert (idempotent).

---

### US-8: Auditability & history

**As an** auditor
**I want** every carryover mutation to be reconstructible
**So that** I can explain any teacher payout settlement.

#### Acceptance Criteria (EARS)

- **AC-8.1 (Ubiquitous)** The system shall expose the carryover
  fields on a new `CarryoverBalancePothosObject` GraphQL type and a
  `carryoverBalance(id)` query for drill-down.
- **AC-8.2 (Event-driven)** When the operator opens a carryover row
  detail drawer (or hovers), the system shall show the linked
  sessions list (read from `class_instances.carryover_balance_id`).
- **AC-8.3 (Ubiquitous)** The system shall never hard-delete an
  `audit_logs` row whose `action` starts with `CARRYOVER_`;
  corrections are made via the Unpay flow, not by editing history.
- **AC-8.4 (Event-driven)** When a carryover is deleted, the system
  shall preserve the linked `audit_logs` rows (the carryover's
  `audit_logs.entityId` becomes orphaned but the rows remain — the
  audit trail survives the deletion).

---

## 5. Edge Cases

| # | Edge case                                                                                | Expected behavior                                                                                                                                              |
|---|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1 | Operator double-clicks "Carryover Balance" on the same selection.                         | Second call returns the first-applied result; no duplicate carryover rows (idempotency via `clientRequestId` + 60-second window).                                  |
| E2 | Bulk Carryover selection includes a session already linked to a carryover.                | Whole mutation rejected with `CARRYOVER_SESSION_ALREADY_LINKED`; no rows created.                                                                                |
| E3 | Bulk Carryover selection mixes currencies across a single teacher's group.                | Dominant currency picked; others converted via latest FX rate; per-item original amount + currency preserved in `carryover_balance_items`.                       |
| E4 | Bulk Carryover with FX rate missing for a currency pair.                                  | Whole mutation rejected with `CARRYOVER_FX_RATE_MISSING`; no rows created.                                                                                      |
| E5 | Bulk To Expense on a carryover with `isPaid = true`.                                      | Rejected with `CARRYOVER_ALREADY_PAID`; operator can use the Unpay flow first.                                                                                  |
| E6 | Bulk To Expense modal submitted without `paymentDate`.                                     | Mutation validation rejects with `PAYMENT_DATE_REQUIRED`.                                                                                                        |
| E7 | Bulk To Expense modal submitted with `expenseDate` not in `YYYY-MM` format.                | Mutation validation rejects with `EXPENSE_DATE_INVALID`.                                                                                                         |
| E8 | Delete on a carryover with `isPaid = true`.                                                | Rejected with `CARRYOVER_PAID_CANNOT_DELETE`; UI offers the Unpay flow.                                                                                         |
| E9 | Bulk Delete where 1 of 5 rows is `isPaid = true`.                                          | Whole batch rejected with `CARRYOVER_PAID_CANNOT_DELETE`; no rows deleted (atomic per operator intent).                                                         |
| E10 | Edit attempt to change the `teacher` field.                                               | Rejected at the UI layer (field is read-only); server rejects with `CARRYOVER_TEACHER_IMMUTABLE` if the patch includes `teacherId`.                             |
| E11 | `studentsText` exceeds 500 characters after concatenation.                                 | Server truncates to 497 + ellipsis; logs a warning.                                                                                                             |
| E12 | `totalDuration` produces more than 2 decimal places (e.g., 47 / 60 = 0.78333…).           | Server rounds to 2 decimals (banker's rounding) and stores as numeric(8,2).                                                                                    |
| E13 | Carryover created for a teacher whose `users.status = DEACTIVATED` at creation time.      | `isDisabledTeacher = true` snapshot; row visible in the grid with a disabled chip; the "Show disabled teachers" toggle filters it by default.                   |
| E14 | Teacher is deactivated **after** the carryover was created.                              | `isDisabledTeacher` snapshot stays false (creation-time snapshot); the operator can re-evaluate via a future "refresh snapshot" action (out of scope for v1).    |
| E15 | Two operators concurrently run "Bulk To Expense" on the same carryover.                   | The first commit wins; the second sees `CARRYOVER_ALREADY_PAID` and surfaces it (the second operator's `clientRequestId` differs, so no idempotency short-circuit).|
| E16 | Carryover spans sessions whose `teacherPaidAmount` was later overridden (Plan 3 US-6).     | Carryover's `payable` reflects the **snapshot at creation time**; the override after the fact is recorded on the session but does not flow back to the carryover. Operator must delete + recreate the carryover to pick up the new amount. |
| E17 | Unpay on a carryover whose linked `expenses` row was already hard-deleted by Plan 6.      | The `expenses` row lookup returns null; the system treats it as already-deleted and proceeds with the carryover revert (idempotent).                             |
| E18 | RTL / Arabic locale active.                                                              | All labels, paid chips, the Bulk To Expense modal, and the date pickers render RTL.                                                                              |
| E19 | Operator has `ACCOUNTING_CARRYOVER_VIEW` but not `_MANAGE`.                               | Carryover page renders read-only; bulk-action toolbar hidden; mutations rejected at the GraphQL layer.                                                          |
| E20 | CSV export exceeds 10 000 rows.                                                           | Server caps at 10 000, includes a `X-Export-Truncated: true` header, and shows a toast in the UI warning that the export was truncated.                         |

---

## 6. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                          |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | Performance     | The `/accounting/carryover` list shall render its first paint in < 1.5 s on a 1 000-carryover dataset (server + network).                                            |
| NFR-2  | Performance     | The `bulkCreateCarryoverBalances` mutation shall complete in < 2 s p95 for a batch of 50 sessions (single grouped insert + 50 row updates + audit logs).              |
| NFR-3  | Performance     | The `bulkCarryoverToExpense` mutation shall complete in < 1.5 s p95 for a batch of 10 carryovers.                                                                    |
| NFR-4  | Concurrency     | The bulk-action idempotency guard shall hold under concurrent duplicate submissions (same `clientRequestId`) — exactly one set of row mutations, one set of audit rows.|
| NFR-5  | Security        | All mutations shall be authenticated, permission-scoped, and shall record `actorUserId` from the session — never from a client-supplied field.                       |
| NFR-6  | Auditability    | Every bulk create, edit, delete, to-expense, and unpay action shall be reconstructible from `carryover_balances` + `carryover_balance_items` + `audit_logs` alone. |
| NFR-7  | i18n            | All user-facing strings (page title, column headers, chips, modals, toasts, errors) shall be available in EN and AR via the compile-time i18n pipeline.            |
| NFR-8  | Accessibility   | The DataGrid, filter bar, Add New / Edit modal, Bulk To Expense modal, and Delete confirmation dialog shall be keyboard-navigable and labelled for screen readers (WCAG 2.1 AA). |
| NFR-9  | Data integrity  | All bulk-action writes (carryover insert + session updates + expense insert + audit logs) shall be in the same PostgreSQL transaction.                                |
| NFR-10 | Compatibility   | The schema migration shall be additive-only (new table + new FK column on `class_instances`); zero downtime for existing scheduling / payroll flows.                |
| NFR-11 | Observability   | Every bulk action shall emit a structured log event with `actorUserId`, `carryoverIds`, `action`, `amount`, `currency`.                                              |
| NFR-12 | Currency safety | The carryover's `payable` is stored in the dominant `teacherCurrency`; per-item original amounts are preserved for cross-currency audit.                              |

---

## 7. Traceability Matrix

| AC        | Covered by implementation section                              | Test file                                                                |
|-----------|----------------------------------------------------------------|--------------------------------------------------------------------------|
| AC-1.x    | Frontend › Routes & Navigation                                | `carryover-list.page.test.tsx`                                          |
| AC-2.x    | Service › `bulkCreateCarryoverBalances`                       | `carryover-bulk-create.service.test.ts`                                  |
| AC-3.x    | Service › `bulkCarryoverToExpense` + Frontend › BulkToExpenseModal | `carryover-to-expense.service.test.ts` + `BulkToExpenseModal.test.tsx` |
| AC-4.x    | Service › `create/update/delete/bulkDelete` + Frontend › CarryoverFormDialog | `carryover-crud.service.test.ts` + `CarryoverFormDialog.test.tsx`     |
| AC-5.x    | Frontend › FilterBar + Repository › filter query              | `carryover-filter.repository.test.ts` + `CarryoverFilterBar.test.tsx`  |
| AC-6.x    | GraphQL › `requirePermission` + route middleware              | `carryover.mutation.test.ts` › "permission denied"                      |
| AC-7.x    | Service › `unpayCarryoverBalance`                              | `carryover-unpay.service.test.ts`                                        |
| AC-8.x    | GraphQL › `CarryoverBalancePothosObject` + audit_logs          | `carryover-audit.test.ts`                                                |

---

## 8. Open Questions

| # | Question                                                                                                                | Status | Default assumed                                                          |
|---|-------------------------------------------------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------|
| Q1 | Should the "Bulk Carryover" action require **all** selected sessions to share the same currency, or convert cross-currency? | Open   | Convert cross-currency via the FX module (US-2 AC-2.7); per-item original preserved. |
| Q2 | Should "Unpay" be allowed after the linked `expenses` row has been exported to an external accounting system (QuickBooks, Xero)? | Open   | No export integration in v1; Unpay is always allowed. The operator decides whether the external system needs a manual reversal. |
| Q3 | Should a manual "Add New" carryover (no linked sessions) be allowed to be Bulk-To-Expense'd? | Open   | Yes — the video shows ad-hoc settlement; a manual carryover can be settled just like an aggregated one. |
| Q4 | Should the `studentsText` include parent names too, or just students? | Open   | Just students (matches the video). Parent names are visible via the student drill-down. |
| Q5 | Should "Bulk Delete" be atomic (all-or-nothing) or permissive (delete what's deletable, report the rest)? | Open   | Atomic in v1 — operator intent is clearer; permissive mode deferred. |
| Q6 | Should the carryover store the operator who created it (`createdByUserId`) and the operator who paid it (`paidByUserId`) as separate fields? | Open   | Yes — both, for audit clarity. `createdByUserId` is set on creation; `paidByUserId` only when `Bulk To Expense` runs. |
| Q7 | Should the "disabled teacher" snapshot refresh when the teacher's `users.status` changes? | Open   | No in v1 — creation-time snapshot only. A "refresh snapshot" action is deferred. |
