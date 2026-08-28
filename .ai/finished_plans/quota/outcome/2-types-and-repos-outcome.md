# Outcome — Task 3 & 4: Backend Types & Repositories

## Summary

Created canonical quota type definitions and implemented the repository layer (`QuotaRepository` and `QuotaLedgerRepository`) with optimistic locking, append-only ledger transaction guarantees, and FIFO selection logic.

## Key Changes Implemented

1. **`backend/types/billing/quota.types.ts`**:
   - `QuotaSelectType`, `QuotaInsertType`, `QuotaReturnType`
   - `QuotaLedgerSelectType`, `QuotaLedgerInsertType`, `QuotaLedgerReturnType`
   - `QuotaSubmitInput`, `QuotaUpdateInput`, `QuotaBalanceReturnType`, `QuotaExpirationBreakdown`
   - `QuotaPaginatedFilter`, `QuotaPaginatedResult`, `QuotaLedgerPaginatedResult`
   - Re-exported from `backend/types/billing/index.ts`

2. **`backend/types/scheduling/scheduling.types.ts`**:
   - Extended `CreateRecurringClassInput` with `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome`

3. **`backend/db/repo/billing/quota-ledger.repository.ts`**:
   - Implemented `insert`, `findByQuotaId`, `countByQuotaId`, `findByClassInstanceId`, `findByRecurringScheduleId`, `findByIdempotencyKey`, `computeBalance`

4. **`backend/db/repo/billing/quota.repository.ts`**:
   - Implemented `create`, `findById`, `listByStudent`, `listActiveByStudent`, `listAllPaginated`, `update` (optimistic locking via `version`), `softDelete`
   - Implemented `selectQuotaForBookingFIFO` (`ORDER BY priority ASC, validUntil ASC NULLS LAST, createdAt ASC`)
   - Implemented `reserveClasses`, `releaseForRecurringSchedule`, `redeemForInstance`, `releaseForInstance`, `expireOverdue`
   - Deterministic SHA-256 idempotency key helper functions for grant, redeem, reserve, release, and expire operations

5. **`backend/db/repo/billing/index.ts`**:
   - Re-exported `QuotaRepository` and `QuotaLedgerRepository`

## Verification

- Per-file quality loop passed (`bun tsgo` + `bun biome:check` + lint queue)

## Carry-Over Points for Phase 3

- Next phase is Phase 3: Services layer (`AvailabilityService`, `QuotaService`, `QuotaNotificationService`, and integrations in `recurring-class.service.ts`, `state-changes.ts`, `teacher-dashboard.service.ts`, `credit.service.ts`, `class-session.service.ts`).
