# Credit Adjustment with Idempotency

Accounting staff record corrective credit adjustments on a student's class-credit balance through the `recordCreditAdjustment` GraphQL mutation (invoked from the billing UI via the Apollo `recordCreditAdjustmentMutationDocument`). The resolver authenticates the caller, then `CreditService.recordAdjustment` enforces the `ACCOUNTING_CREDITS_MANAGE` permission and validates the input: hours must be a finite number of at least 1, and a subtract-with-carryover adjustment requires a complete carryover block (teacher, from/to dates, payment date not in the future). Every adjustment derives a deterministic SHA-256 idempotency key from the identifying fields (student, adjustment type, hours, carryover fields — deliberately excluding the free-text reason) via `deriveAdjustmentIdempotencyKey`, so a retried or double-submitted request collapses onto the same ledger row instead of double-writing. The adjustment executes in a single transaction: a per-student advisory lock serializes concurrent adjustments, the balance guard (`assertSufficientClasses`) rejects over-deductions under that lock, the idempotency check returns the first persisted row on a double-submit, and a unique-key race on `credit_transactions.idempotency_key` resolves to the winning row. A successful run inserts the signed ledger row (the audit entry, carrying the sanitized reason notes and the crediting user), adjusts the student's class count, refreshes on-demand quota instances, and — for carryover adjustments only — mirrors the entry into `teacher_carryover_balances` when that table exists.

## Key sources

- `backend/graphql/mutation/billing/credit-adjustment.mutation.ts` — Pothos `recordCreditAdjustment` mutation field, auth, resolver delegation
- `backend/services/billing/credit.service.ts` — `recordAdjustment`, `validateAdjustmentInput`, `executeAdjustmentTransaction`, `runAdjustment`, `assertSufficientClasses`, `resolveDuplicateAdjustment`
- `backend/services/billing/credit-adjustment.idempotency.ts` — `deriveAdjustmentIdempotencyKey` (SHA-256 over identifying fields)
- `backend/services/billing/carryover-handoff.ts` — `maybeInsertCarryoverBalanceEntry` (no-op until the payouts table ships)
- `backend/db/repo/billing/credit.repository.ts` — `createAdjustment`, `findByIdempotencyKeys`
- `backend/db/schema/billing/credit-transactions.ts` — `credit_transactions` table with unique `idempotency_key` index
- `frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts` — client-side mutation document

## Diagram

```mermaid
%% Credit adjustment with idempotency: staff corrective credit/debit of student class credits
sequenceDiagram
    autonumber
    actor Staff as Staff Operator
    participant FE as Apollo Client
    participant GQL as recordCreditAdjustment Mutation
    participant SVC as CreditService
    participant IDK as deriveAdjustmentIdempotencyKey
    participant REPO as CreditRepository
    participant DB as PostgreSQL
    participant QS as QuotaService
    participant CH as carryoverHandoff

    Staff->>FE: Submit adjustment form (type, hours, reason)
    FE->>GQL: recordCreditAdjustment(input)
    GQL->>GQL: requireAuth(ctx)
    GQL->>SVC: recordAdjustment(actorUserId, input, tErrors)
    SVC->>SVC: requirePermission ACCOUNTING_CREDITS_MANAGE
    SVC->>SVC: validateAdjustmentInput
    Note over SVC: hours >= 1, carryover block required and date-checked for SUBTRACT_WITH_CARRYOVER
    SVC->>IDK: deriveAdjustmentIdempotencyKey(input)
    IDK-->>SVC: SHA-256 key over studentId, type, hours, carryover fields
    SVC->>DB: BEGIN transaction
    SVC->>DB: acquireAdvisoryLock(student key)
    SVC->>DB: assertStudentExists, assertTeacherExists (carryover)
    alt subtract adjustments
        SVC->>DB: assertSufficientClasses (balance guard)
    end
    SVC->>REPO: findByIdempotencyKeys(key, tx)
    alt matching ledger row already exists
        REPO-->>SVC: existing row
        SVC-->>GQL: return first persisted row (double-submit collapses)
    else no existing row
        SVC->>REPO: createAdjustment (signed hours, notes, key)
        REPO->>DB: INSERT credit_transactions row
        alt unique violation race
            DB-->>SVC: unique violation on idempotency key
            SVC->>SVC: resolveDuplicateAdjustment (winner row)
            SVC-->>GQL: return winning row
        end
        SVC->>DB: StudentRepository addClasses or deductClasses
        SVC->>QS: refreshStudentOndemandInstances(studentId, tx)
        opt carryover adjustment
            SVC->>CH: maybeInsertCarryoverBalanceEntry(tx, payload)
            CH->>DB: INSERT teacher_carryover_balances (if table exists)
        end
        SVC->>DB: COMMIT
        SVC-->>GQL: CreditAdjustmentResult (audit ledger row)
    end
    GQL-->>FE: adjustment result with id
    FE-->>Staff: confirmation
```

[Machine-checkable copy: `docs/diagram/billing/credit-adjustment.mmd`](credit-adjustment.mmd)
