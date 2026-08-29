# Credit-Hours Accounting Flow

The hour-based parallel ledger lets accounting staff sell time to students as hour packages beside the existing class-quota system: every hour write lands in `credit_transactions.changeAmountHours` (XOR with the class-based `changeAmount`) and is mirrored onto the denormalized `students.creditHoursTotal` / `creditHoursRemaining` columns inside the same transaction. A staff member triggers a purchase from the accounting payments form, and `AccountingPaymentService.recordPayment` atomically records the payment and its `CREDIT_HOURS_PACKAGE` invoice, inserts the positive hour ledger row, and bumps the student's balance — all under a per-student advisory lock with content-derived idempotency keys, so double-submits and concurrent retries return the original row instead of double-crediting. Session consumption runs through `CreditService.deductHoursForBooking` (wired in production once the `student.billingMode` discriminator lands per deferred item D-1), which checks the hour balance, writes a negative ledger row under a unit-discriminated idempotency key, and decrements the student balance; cancelling an instance pre-start mirrors the flow through `refundHoursOnCancel`. Balances are exposed via the `studentCreditHourBalance` query (IDOR-guarded by `assertAssociatedOrManage`) and surface in the student profile credit-hours tab and the accounting credits list, where staff with `ACCOUNTING_CREDITS_MANAGE` can also post manual add/subtract adjustments through `CreditService.recordAdjustment` — subtractions are guarded by a sufficiency check inside the advisory-locked transaction, and subtract-with-carryover additionally writes a teacher payout carryover row. After a committed purchase, `AccountingNotificationService` fires a non-blocking `ACCOUNTING_PAYMENT_RECORDED` notification, and a low-hour `ACCOUNTING_LOW_HOURS` reminder goes out when the balance drops below the configured threshold.

## Key sources

- `app/(dashboard)/accounting/credits/page.tsx` — credits list route gated by `withPageAuth([ACCOUNTING_CREDITS_MANAGE])`
- `backend/services/billing/credit.service.ts` — hour ledger purchase/deduction/refund, adjustments, balances, idempotency keys
- `backend/services/billing/accounting-payment.service.ts` — `recordPayment` single-tx purchase flow (invoice, payment, hour credit, notification)
- `backend/db/repo/billing/credit.repository.ts` — `createHourPurchase`, `deductHoursForBooking`, `getHourBalance`, ledger queries
- `docs/billing/credit-hours-system.md` — canonical reference: data model, XOR CHECK, notifications, deferred items

## Diagram

```mermaid
%% Credit-Hours Accounting Flow — hour-based parallel ledger (package purchase, booking deduction, balance views)
sequenceDiagram
    autonumber
    participant Staff as Accounting Staff
    participant Page as Accounting Pages
    participant GQL as GraphQL API
    participant APS as AccountingPaymentService
    participant CS as CreditService
    participant Repo as CreditRepository plus StudentRepository
    participant DB as PostgreSQL
    participant NS as AccountingNotificationService

    Note over Staff,NS: Arc 1 — Hour-package purchase via recordAccountingPayment
    Staff->>Page: Open accounting payments new form
    Page->>GQL: mutation recordAccountingPayment
    GQL->>APS: recordPayment actor input
    APS->>APS: requirePermission ACCOUNTING_PAYMENTS_MANAGE
    APS->>DB: advisory lock student plus validate plan in tx
    alt Duplicate idempotency key
        APS-->>GQL: return existing payment row no double credit
    else New payment
        APS->>Repo: insert payment and CREDIT_HOURS_PACKAGE invoice
        Repo->>DB: createHourPurchase credit_transactions changeAmountHours positive
        Repo->>DB: addCreditHours bumps students creditHoursTotal and creditHoursRemaining
        APS->>NS: notifyPaymentRecorded ACCOUNTING_PAYMENT_RECORDED
    end

    Note over Staff,NS: Arc 2 — Session consumption deduct or refund booking hours
    GQL->>CS: deductHoursForBooking studentId classInstanceId hours
    CS->>Repo: getHourBalance in tx
    alt remaining less than hours
        CS-->>GQL: ConflictError insufficientHours
    else Sufficient hours
        CS->>Repo: findByIdempotencyKeys hour-unit ledger key
        alt Key already exists
            CS-->>GQL: no-op idempotent
        else Fresh deduction
            CS->>DB: deductHoursForBooking changeAmountHours negative
            CS->>DB: deductCreditHours lower students balance
            CS->>NS: ACCOUNTING_LOW_HOURS when below threshold
        end
    end
    Note over CS,DB: Cancel pre-start runs refundHoursOnCancel — mirrored insert plus addCreditHours

    Note over Staff,NS: Arc 3 — Balance views and manual adjustments
    Staff->>Page: Open accounting credits page or student credit-hours tab
    Page->>GQL: query studentCreditHourBalance or credit transactions hoursOnly
    GQL->>CS: getStudentHourBalance with assertAssociatedOrManage IDOR guard
    CS->>Repo: read denormalized students balance plus ledger rows
    Staff->>GQL: mutation recordCreditAdjustment add or subtract
    GQL->>CS: recordAdjustment requires ACCOUNTING_CREDITS_MANAGE
    CS->>Repo: createAdjustment ledger row plus balanced student update
    CS-->>GQL: ConflictError INSUFFICIENT_CLASSES when subtraction exceeds balance
```

Machine-checkable copy: [credit-hours-accounting.mmd](./credit-hours-accounting.mmd)
