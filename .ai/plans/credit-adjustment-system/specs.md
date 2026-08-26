# Plan 2 — Credit Adjustment System: Specifications

> Spec-driven-development plan for the Siraj Station LMS Credit Adjustment feature
> observed in the customer reference video (Add / Subtract / Subtract-With-Carryover).

---

## 1. Overview

The Siraj LMS already tracks student credit hours through the `credit_transactions`
ledger table and the `CreditService` domain service. The current ledger supports
purchases (`recordPurchase`), per-lesson bookings (`deductForBooking`), cancellations
(`refundOnCancel`), and read-only balance/transaction queries.

The customer reference video shows an additional **Credit Adjustment System** that
lets an accounting operator manually grant, claw back, or re-allocate credit hours
for a student. Three adjustment types are required:

| # | Adjustment Type         | Effect on student ledger        | Side effect                              |
|---|-------------------------|---------------------------------|------------------------------------------|
| 1 | **Add**                 | Positive `credit_transaction`  | —                                        |
| 2 | **Subtract**            | Negative `credit_transaction`   | —                                        |
| 3 | **Subtract With Carryover** | Negative `credit_transaction` + teacher carryover entry | Allocates the deducted value as a payout obligation to a chosen teacher (links to **Plan 5: Carryover Balance Module**) |

This plan **extends** the existing `credit_transactions` table, `CreditReason` enum,
`CreditService`, and the accounting UI — it does **not** fork or duplicate the ledger.

---

## 2. Goals & Non-Goals

### Goals
1. Let an accounting operator grant bonus credit hours to a student (Add).
2. Let an accounting operator claw back unearned or disputed credit hours (Subtract).
3. Let an accounting operator deduct credit hours from a student **and** record a
   payout obligation to a specific teacher for a date range (Subtract With Carryover).
4. Provide a dynamic form whose carryover section appears only when
   "Subtract With Carryover" is selected.
5. Persist a full, idempotent, auditable audit trail for every adjustment.
6. Gate every operation behind a dedicated `ACCOUNTING_CREDITS_MANAGE` permission.

### Non-Goals (out of scope for this plan)
- Carrying the carryover balance through to actual teacher payout settlement
  (owned by **Plan 5: Carryover Balance Module**). This plan only **writes** the
  carryover entry; it does not reconcile or pay it out.
- Bulk adjustment import via CSV/Excel.
- Student-facing UI for adjustments (students see results via existing
  `/students/credits` portal page, not the accounting form).
- Automatic reversal of past bookings tied to a subtract adjustment.
- Refund of a real monetary payment (still owned by the existing
  `recordPurchase` / payments module).

---

## 3. Glossary

| Term                          | Meaning                                                                                              |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **Credit transaction**        | A row in `credit_transactions`. The single source of truth for credit changes.                      |
| **Adjustment**                | A manual, operator-initiated credit change (Add / Subtract / Subtract With Carryover).               |
| **Carryover**                 | The act of moving value deducted from a student's credit to a teacher's pending payout balance.      |
| **Carryover entry**           | A row in the teacher carryover ledger (Plan 5) recording the payout obligation.                     |
| **Adjustment type**           | One of `Add`, `Subtract`, `Subtract With Carryover` — the new `CreditAdjustmentType` enum.           |
| **Actor**                     | The authenticated staff user performing the adjustment; recorded as `creditedByUserId`.             |
| **Idempotency key**           | SHA-256 hash of (studentId, adjustmentType, changeAmount, carryoverTeacherId, fromDate, toDate, notes). Prevents duplicate submissions. |

---

## 4. User Stories & EARS Acceptance Criteria

EARS syntax used throughout:
- **Ubiquitous:** "The system shall <response>."
- **Event-driven:** "When <trigger>, the system shall <response>."
- **State-driven:** "While <state>, the system shall <response>."
- **Optional:** "Where <precondition>, the system shall <response>."
- **Unwanted:** "If <condition>, then the system shall <response>."

---

### US-1: Accounting operator opens the Student Credits list

**As an** accounting operator
**I want** to open a dedicated Student Credits list under the Accounting section
**So that** I can find a student and initiate a credit adjustment.

#### Acceptance Criteria (EARS)

- **AC-1.1 (Ubiquitous)** The system shall expose a route at `/accounting/credits`
  that renders the Student Credits list page.
- **AC-1.2 (Event-driven)** When the user navigates to `/accounting/credits`
  without the `ACCOUNTING_CREDITS_MANAGE` permission, the system shall render
  a 403 / insufficient-permissions state and shall **not** execute any ledger query.
- **AC-1.3 (State-driven)** While the user holds the
  `ACCOUNTING_CREDITS_MANAGE` permission, the system shall render a paginated
  table of students with columns: name, parent, `classesRemaining`,
  `classesTotal`, last-transaction-at, and a per-row "Adjust Credits" action.
- **AC-1.4 (Event-driven)** When the user clicks "Adjust Credits" on a row,
  the system shall navigate to `/accounting/credits/adjust?studentId=<id>`.
- **AC-1.5 (Optional)** Where the `studentId` query param is present on
  `/accounting/credits/adjust`, the system shall pre-select that student in the
  adjustment form's student picker.
- **AC-1.6 (Event-driven)** When the sidebar renders for a user with
  `ACCOUNTING_CREDITS_MANAGE`, the system shall show a "Credits" item under the
  Accounting group with the `accountBalanceWallet` icon and href `/accounting/credits`.

---

### US-2: Operator performs an **Add** adjustment

**As an** accounting operator
**I want** to grant bonus credit hours to a student
**So that** the student can book additional lessons without a new purchase.

#### Acceptance Criteria (EARS)

- **AC-2.1 (Event-driven)** When the operator selects the "Add" radio option,
  the system shall hide the carryover section and shall require only Student,
  Hours, Reason, and Notes.
- **AC-2.2 (Ubiquitous)** The system shall require `hours` to be a positive integer
  (≥ 1) for an Add adjustment.
- **AC-2.3 (Event-driven)** When the operator submits a valid Add adjustment,
  the system shall create exactly one `credit_transactions` row with
  `changeAmount = +hours`, `reason = CREDIT_ADJUSTMENT_ADD`,
  `adjustmentType = 'Add'`, and a deterministic idempotency key.
- **AC-2.4 (Event-driven)** When the Add succeeds, the system shall increment
  `students.classesRemaining` and `students.classesTotal` by `hours` in the
  same database transaction and shall refresh on-demand quota instances.
- **AC-2.5 (Event-driven)** When the operator submits the same Add adjustment
  twice (same idempotency key), the system shall return the first-created
  transaction row without creating a duplicate and without re-incrementing the
  student balance.
- **AC-2.6 (Event-driven)** When the Add succeeds, the system shall navigate
  back to `/accounting/credits` and shall show a success toast citing the new
  `classesRemaining`.

---

### US-3: Operator performs a **Subtract** adjustment

**As an** accounting operator
**I want** to deduct unearned or disputed credit hours from a student
**So that** the ledger reflects reality without a payout to any teacher.

#### Acceptance Criteria (EARS)

- **AC-3.1 (Event-driven)** When the operator selects the "Subtract" radio option,
  the system shall hide the carryover section and shall require Student, Hours,
  Reason, and Notes.
- **AC-3.2 (Ubiquitous)** The system shall require `hours` to be a positive
  integer (≥ 1) for a Subtract adjustment. The entered value is the magnitude;
  the stored `changeAmount` is negative.
- **AC-3.3 (Unwanted)** If subtracting `hours` would drive
  `students.classesRemaining` below zero, then the system shall reject the
  submission with a `INSUFFICIENT_CLASSES` domain error and shall not write any
  ledger row.
- **AC-3.4 (Event-driven)** When the operator submits a valid Subtract
  adjustment, the system shall create exactly one `credit_transactions` row
  with `changeAmount = -hours`, `reason = CREDIT_ADJUSTMENT_SUBTRACT`,
  `adjustmentType = 'Subtract'`, and a deterministic idempotency key.
- **AC-3.5 (Event-driven)** When the Subtract succeeds, the system shall
  decrement `students.classesRemaining` by `hours` in the same transaction
  (leaving `classesTotal` unchanged) and shall refresh on-demand quota instances.
- **AC-3.6 (Event-driven)** When the operator submits the same Subtract
  adjustment twice, the system shall return the first-created transaction row
  without creating a duplicate and without re-decrementing the balance.

---

### US-4: Operator performs a **Subtract With Carryover** adjustment

**As an** accounting operator
**I want** to deduct credit hours from a student and allocate the equivalent
value as a payout obligation to a specific teacher
**So that** the teacher is eventually paid for hours the student disputes but
the teacher already delivered.

#### Acceptance Criteria (EARS)

- **AC-4.1 (Event-driven)** When the operator selects the
  "Subtract With Carryover" radio option, the system shall render a green
  "Carryover" banner containing four fields: Teacher (autocomplete), From Date,
  To Date, Payment Date.
- **AC-4.2 (Ubiquitous)** The system shall require all four carryover fields
  (Teacher, From Date, To Date, Payment Date) whenever the adjustment type is
  "Subtract With Carryover".
- **AC-4.3 (Unwanted)** If `fromDate > toDate`, then the system shall reject
  the submission with a validation error before any database write.
- **AC-4.4 (Unwanted)** If `paymentDate` is more than 1 day in the future, then
  the system shall reject the submission with a validation error.
- **AC-4.5 (Unwanted)** If the chosen Teacher does not exist or is soft-deleted,
  then the system shall reject the submission with a `NOT_FOUND` error.
- **AC-4.6 (Unwanted)** If subtracting `hours` would drive
  `students.classesRemaining` below zero, then the system shall reject the
  submission with a `INSUFFICIENT_CLASSES` domain error and shall not write
  any ledger row or carryover entry.
- **AC-4.7 (Event-driven)** When the operator submits a valid Subtract With
  Carryover adjustment, the system shall, **in a single database transaction**:
  1. Create one `credit_transactions` row with `changeAmount = -hours`,
     `reason = CREDIT_ADJUSTMENT_CARRYOVER`, `adjustmentType = 'Subtract With Carryover'`,
     `carryoverTeacherId = <teacherId>`, `carryoverFromDate = <fromDate>`,
     `carryoverToDate = <toDate>`, `carryoverPaymentDate = <paymentDate>`.
  2. Decrement `students.classesRemaining` by `hours`.
  3. Insert one **teacher carryover balance entry** (Plan 5 table) referencing
     the credit transaction row, the teacher, the student, the date range, and
     the payment date.
- **AC-4.8 (Event-driven)** When the transaction commits, the system shall log
  an audit event capturing actor, studentId, teacherId, hours, date range, and
  payment date.
- **AC-4.9 (Event-driven)** When the operator submits the same Subtract With
  Carryover adjustment twice, the system shall return the first-created
  transaction row without creating a duplicate ledger row, duplicate carryover
  entry, or duplicate balance change.
- **AC-4.10 (State-driven)** While Plan 5 (Carryover Balance Module) is not yet
  deployed, the system shall still commit steps 1 and 2 of AC-4.7 and shall
  write the carryover entry to a temporary local table
  (`credit_transactions.carryoverTeacherId` + date fields) so Plan 5 can backfill
  its own table from these columns on activation.

---

### US-5: Reason field uses a rich text editor

**As an** accounting operator
**I want** to write a rich-text Reason for every adjustment
**So that** the audit trail captures context (bold for impact, lists for detail).

#### Acceptance Criteria (EARS)

- **AC-5.1 (Ubiquitous)** The system shall render the Reason field as a
  lightweight rich-text editor (bold, italic, underline, bullet list, ordered
  list) — not a plain `<textarea>`.
- **AC-5.2 (Ubiquitous)** The system shall persist the Reason as sanitized HTML
  in the `notes` column of `credit_transactions`.
- **AC-5.3 (Event-driven)** When the editor content is empty or contains only
  whitespace, the system shall require at least one non-empty character and
  shall block submission with a validation error.
- **AC-5.4 (Ubiquitous)** The system shall sanitize the HTML on the server before
  persisting (strip `<script>`, event handlers, and `javascript:` URLs) using
  the shared sanitization helper.

---

### US-6: Permission gating

**As a** security-conscious platform
**I want** every adjustment operation to require a dedicated permission
**So that** only authorized accounting staff can move credit.

#### Acceptance Criteria (EARS)

- **AC-6.1 (Ubiquitous)** The system shall require the
  `ACCOUNTING_CREDITS_MANAGE` permission for: viewing `/accounting/credits`,
  viewing `/accounting/credits/adjust`, and executing any of the three
  adjustment mutations.
- **AC-6.2 (Event-driven)** When a user without the permission calls the
  `recordCreditAdjustment` GraphQL mutation, the system shall reject with an
  `INSUFFICIENT_PERMISSIONS` error and shall not touch the ledger.
- **AC-6.3 (Event-driven)** When the mutation is allowed, the system shall
  record the authenticated user's id as `creditedByUserId` on the new
  `credit_transactions` row.

---

### US-7: Auditability & history

**As an** auditor
**I want** every adjustment to be visible in the student's transaction history
**So that** I can reconstruct any balance change.

#### Acceptance Criteria (EARS)

- **AC-7.1 (Ubiquitous)** The system shall surface Add/Subtract/Subtract-With-Carryover
  rows in the existing `getStudentTransactions` query without requiring a new
  query.
- **AC-7.2 (Event-driven)** When the transaction list renders a carryover row,
  the system shall display the teacher name, from-date, to-date, and payment
  date alongside the row.
- **AC-7.3 (Ubiquitous)** The system shall never mutate or delete a
  `credit_transactions` row after creation; corrections are made via a new
  compensating adjustment.

---

## 5. Edge Cases

| # | Edge case                                                                                | Expected behavior                                                                                                                                              |
|---|------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| E1 | Operator clicks "Submit" twice rapidly on the same form values.                         | Second call returns the first-created row (idempotency key collision → `ConflictError` caught and resolved to the existing row, no duplicate write).            |
| E2 | Operator changes Student after Teacher is selected in carryover mode.                   | Teacher selection is preserved (independent fields); only Student change re-validates balance sufficiency.                                                    |
| E3 | Operator switches from "Subtract With Carryover" back to "Add" after filling carryover.  | Carryover fields are cleared from the form state; submission uses the Add path; no carryover columns persisted.                                                |
| E4 | Operator selects a future `fromDate` (e.g., next month).                                | Allowed — the carryover date range is informational, not a booking constraint.                                                                                |
| E5 | Operator selects `fromDate == toDate`.                                                   | Allowed — represents a single-day range.                                                                                                                       |
| E6 | Operator selects `paymentDate` in the past.                                              | Allowed — represents a payout already made out-of-band.                                                                                                        |
| E7 | Student is soft-deleted between form-open and submit.                                     | Server rejects with `STUDENT_NOT_FOUND`; form shows error toast and keeps local state so the operator can pick another student.                                 |
| E8 | Teacher is soft-deleted between form-open and submit.                                    | Server rejects with `TEACHER_NOT_FOUND`; form highlights the Teacher field.                                                                                     |
| E9 | Network drops mid-submit; client retries with same idempotency key.                      | Server returns the originally-created row (idempotency guard).                                                                                                  |
| E10| `hours = 0` submitted.                                                                   | Client + server both reject (must be ≥ 1).                                                                                                                      |
| E11| `hours` exceeds `classesRemaining` in a Subtract path.                                   | Server rejects with `INSUFFICIENT_CLASSES`; no ledger row, no balance change.                                                                                  |
| E12| Reason contains `<script>alert(1)</script>`.                                             | Server sanitizer strips the script tag; persisted HTML is `<br>` or empty-stripped equivalent; submission succeeds if non-empty after sanitization.            |
| E13| Reason is 50 000 characters of valid HTML.                                               | Server truncates to the `notes` column limit (treat as `text` — no hard cap) but warns in logs if length > 10 000 chars.                                       |
| E14| Two operators concurrently Subtract-With-Carryover the same student for the same range.  | Each gets a distinct idempotency key (different actor/notes) → both succeed; both carryover entries are created. Balance sufficiency is re-checked inside the tx. |
| E15| Plan 5 Carryover Balance Module is not yet deployed.                                     | Subtract-With-Carryover still succeeds; the carryover metadata lives on `credit_transactions` columns and is backfilled when Plan 5 activates (AC-4.10).       |
| E16| Operator opens `/accounting/credits/adjust` with no `studentId` query param.             | Form renders with the Student picker empty and focused; carryover section hidden until "Subtract With Carryover" is chosen.                                     |
| E17| RTL / Arabic locale active.                                                              | All labels, banners, and date inputs render RTL; the green carryover banner aligns to the right.                                                                |
| E18| Operator has `CREDITS_MANAGE` but not the new `ACCOUNTING_CREDITS_MANAGE`.               | Existing `/students/credits` portal still works; new `/accounting/credits` route returns 403 until permission is granted.                                      |

---

## 6. Non-Functional Requirements

| ID     | Category        | Requirement                                                                                                                                                          |
|--------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR-1  | Performance     | The `/accounting/credits` list shall render its first paint in < 1.2 s on a 100-student dataset (server + network).                                                  |
| NFR-2  | Performance     | Each adjustment mutation shall complete in < 500 ms p95 including the transaction and audit log write.                                                              |
| NFR-3  | Concurrency     | Idempotency shall hold under concurrent duplicate submissions (same key) — exactly one ledger row, one balance change.                                              |
| NFR-4  | Security        | All mutations shall be authenticated, permission-scoped, and shall record `creditedByUserId` from the session — never from a client-supplied field.                  |
| NFR-5  | Auditability    | Every adjustment shall be reconstructible from `credit_transactions` alone (carryover columns self-contained until Plan 5 backfills).                                 |
| NFR-6  | i18n            | All user-facing strings (form labels, banner, toasts, errors) shall be available in EN and AR via the compile-time i18n pipeline.                                   |
| NFR-7  | Accessibility   | The RadioGroup, autocomplete, date pickers, and rich-text editor shall be keyboard-navigable and labelled for screen readers (WCAG 2.1 AA).                          |
| NFR-8  | Data integrity  | Ledger writes and student-balance writes shall be in the same PostgreSQL transaction; partial commits are forbidden.                                                 |
| NFR-9  | Observability   | Every adjustment shall emit a structured log event with `actorUserId`, `studentId`, `adjustmentType`, `changeAmount`, and (if carryover) `carryoverTeacherId`.      |
| NFR-10 | Compatibility   | The schema migration shall be additive-only (new nullable columns + enum values); zero downtime for existing `recordPurchase` / `deductForBooking` / `refundOnCancel`.|

---

## 7. Traceability Matrix

| AC        | Covered by implementation section                       | Test file                                                              |
|-----------|---------------------------------------------------------|------------------------------------------------------------------------|
| AC-1.x    | Frontend › Routes & Navigation                          | `frontend/common/views/dashboard/accounting/credits/StudentCreditsList.test.tsx` |
| AC-2.x     | Service › `addCredit`                                    | `backend/services/billing/credit-adjustment.service.test.ts` › "Add"                            |
| AC-3.x     | Service › `subtractCredit`                              | `backend/services/billing/credit-adjustment.service.test.ts` › "Subtract"                      |
| AC-4.x     | Service › `subtractWithCarryover` + Form › Carryover    | `backend/services/billing/credit-adjustment.service.test.ts` › "Carryover" + `frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.test.tsx` |
| AC-5.x     | Frontend › Rich-text Reason + Server sanitizer          | `CreditAdjustForm.test.tsx` › "rich text" + `backend/lib/sanitize/richTextSanitizer.test.ts`            |
| AC-6.x     | GraphQL › `requirePermission` + route middleware        | `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` › "permission denied"            |
| AC-7.x     | GraphQL › `getStudentTransactions` extension            | `backend/graphql/query/billing/credit.query.test.ts` › "includes adjustments"                        |

---

## 8. Open Questions

| # | Question                                                                                                                | Status | Default assumed                                                          |
|---|-------------------------------------------------------------------------------------------------------------------------|--------|--------------------------------------------------------------------------|
| Q1 | Should the "Accounting" group be a new `grp_accounting` or a rename of the existing `grp_finance`?                      | Open   | Reuse `grp_finance` (label "Finance") — add "Credits" item to it.        |
| Q2 | Does the carryover value need a currency conversion (student credit currency vs teacher rate currency)?                 | Open   | No conversion in this plan; Plan 5 handles currency at payout time.      |
| Q3 | Should the Reason rich-text be versioned (full history) or just latest?                                                | Open   | Latest only; the audit log captures the snapshot at creation.            |
| Q4 | Should Subtract be allowed to go negative if the operator overrides (force mode)?                                       | Open   | No force mode in v1; hard reject at `classesRemaining < hours`.          |
