# Quota Purchase & Ledger Append

A staff admin with the `QUOTAS_MANAGE` permission opens `/quotas/new`, a page guarded by `withPageAuth`, and fills the quota form rendered by `QuotaFormContainer` — choosing a student, quota kind (PACKAGE or PERIODIC), total classes, validity window, and priority. The form view model validates the input client-side with a Zod schema, then issues the `createQuota` GraphQL mutation through Apollo; the resolver authenticates the caller and delegates to `QuotaService.createQuota`, which enforces the `QUOTAS_MANAGE` permission and opens a database transaction. Inside the transaction, `QuotaRepository.create` inserts the `quotas` row with status ACTIVE and `remaining = totalClasses`, guarded by `ON CONFLICT (idempotency_key) DO NOTHING` so duplicate submissions or retries return the existing row instead of double-granting. Immediately after, `QuotaLedgerRepository.insert` appends an idempotent GRANT entry (delta `+totalClasses`) to the append-only `quota_ledger` table, making the ledger the auditable source of truth for the new balance. On success the Apollo cache is updated in place and the user is redirected to the quotas list; permission failures surface as a localized FORBIDDEN error. Later, booking flows consume the grant via FIFO: `selectQuotaForBookingFIFO` row-locks the highest-priority, soonest-expiring active quota, and `redeemForInstance` appends REDEEM ledger entries linked to each class instance.

## Key sources

- `app/(dashboard)/quotas/new/page.tsx` — page entry, `withPageAuth([AppPermission.QUOTAS_MANAGE])` guard
- `frontend/common/views/dashboard/billing/quota/QuotaFormContainer.tsx` — form container wiring the view model to mobile/desktop views
- `frontend/common/views/dashboard/billing/quota/useQuotaFormViewModel.ts` — form state, Zod validation, `createQuotaMutationDocument` submission, cache update, redirect
- `frontend/common/graphql/sharedDocuments/billing/quota.documents.ts` — `createQuotaMutationDocument` GraphQL document
- `backend/graphql/mutation/billing/quota.mutation.ts` — `createQuota` mutation field, auth, error-code mapping
- `backend/services/billing/quota.service.ts` — `createQuota`, permission gate, transaction wrapper, FIFO `selectQuotaForBookingFIFO` / `redeemForInstance` consumption entry points
- `backend/db/repo/billing/quota.repository.ts` — idempotent quota INSERT, GRANT ledger append, FIFO selection ordering and row locking
- `backend/db/repo/billing/quota-ledger.repository.ts` — append-only ledger insert with idempotency-key conflict handling

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Staff Admin
    participant PG as /quotas/new page
    participant VM as useQuotaFormViewModel
    participant AP as Apollo Client
    participant GQL as createQuota mutation
    participant SVC as QuotaService
    participant REPO as QuotaRepository
    participant LED as QuotaLedgerRepository
    participant DB as PostgreSQL

    Admin->>PG: Open /quotas/new
    PG->>PG: withPageAuth guard requires QUOTAS_MANAGE
    PG->>VM: render QuotaFormContainer
    Admin->>VM: Pick student and plan (kind, totalClasses, validity, priority)
    VM->>VM: Zod validation via quotaSchema
    VM->>AP: createQuotaMutationDocument with QuotaSubmitInput
    AP->>GQL: POST GraphQL createQuota
    GQL->>GQL: requireAuth resolves actorUserId
    GQL->>SVC: createQuota(input, actorUserId, locale)
    SVC->>SVC: requirePermission QUOTAS_MANAGE

    alt permission denied
        SVC-->>GQL: UnauthorizedError
        GQL-->>AP: GraphQLError code FORBIDDEN
        AP-->>VM: error shown via createFailed label
    else authorized
        SVC->>REPO: create inside runInTx transaction
        REPO->>DB: INSERT quotas ON CONFLICT idempotency_key DO NOTHING
        alt new quota row
            DB-->>REPO: quotas row (status ACTIVE, remaining = totalClasses)
            REPO->>LED: insert GRANT entry (delta +totalClasses, key deriveGrantIdempotencyKey)
            LED->>DB: INSERT quota_ledger ON CONFLICT idempotency_key DO NOTHING
            DB-->>LED: appended ledger row
        else duplicate submission
            DB-->>REPO: no rows returned
            REPO->>DB: SELECT existing quotas row by idempotencyKey
            DB-->>REPO: existing quota (no double grant)
        end
    end

    SVC-->>GQL: QuotaReturnType
    GQL-->>AP: QuotaPothosObject
    AP->>AP: cache update appends row to quotasQueryDocument list
    AP-->>VM: success flag set
    VM-->>Admin: success banner, redirect to /quotas

    Note over SVC,DB: Later, booking consumes grants FIFO: selectQuotaForBookingFIFO locks the highest-priority, soonest-expiring ACTIVE quota SELECT FOR UPDATE, then redeemForInstance appends REDEEM rows (delta -1) referencing classInstanceId
```

Machine-checkable copy: [quota-purchase.mmd](quota-purchase.mmd)
