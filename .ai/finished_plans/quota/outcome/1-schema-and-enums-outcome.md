# Outcome — Task 1 & 2: Database Schema & Enums

## Summary

Successfully created all database tables, TypeScript enums, PostgreSQL pgEnums, and Pothos GraphQL registrations required for the Quota entity and On-Demand scheduling integration.

## Key Changes Implemented

1. **`backend/enum/billing/quota.enum.ts`**:
   - `QuotaKind` (`PACKAGE`, `PERIODIC`)
   - `QuotaStatus` (`ACTIVE`, `EXPIRED`, `ARCHIVED`)
   - `QuotaPeriodType` (`WEEKLY`, `MONTHLY`, `CUSTOM`)
   - `QuotaLedgerReason` (`GRANT`, `RESERVE`, `REDEEM`, `RELEASE`, `EXPIRE`, `ADJUST`)
   - Re-exported from `backend/enum/billing/index.ts`

2. **`backend/enum/scheduling/scheduling.enum.ts`**:
   - `SchedulingMode` (`NUMBER_OF_CLASSES`, `ON_DEMAND`, `QUOTA`)
   - `OnDemandNoCreditsOutcome` (`AUTO_CANCEL`, `AUTO_ABSENT_NO_CREDITS`, `REMIND_ONLY`)
   - `OnDemandStatus` (`PENDING_CREDIT`, `AVAILABLE`, `CONVERTED`, `NO_CREDITS_CANCELLED`, `NO_CREDITS_ABSENT`, `CANCELLED`)

3. **`backend/enum/classes/class-instance-detail.enum.ts`**:
   - Extended `ClassExecutionState` with 4 on-demand states: `ON_DEMAND_PENDING_CREDITS`, `ON_DEMAND_CONFLICT_HELD`, `ON_DEMAND_NO_CREDITS_CANCELLED`, `ON_DEMAND_NO_CREDITS_ABSENT`

4. **`backend/db/schema/enums.ts`**:
   - Registered `quotaKindEnum`, `quotaStatusEnum`, `quotaPeriodTypeEnum`, `quotaLedgerReasonEnum`, `schedulingModeEnum`, `onDemandNoCreditsOutcomeEnum`, `onDemandStatusEnum`

5. **`backend/graphql/pothos/shared/enum.pothos.ts`**:
   - Registered all new enums into GraphQL schema via Pothos

6. **`backend/db/schema/billing/quotas.ts` & `quota-ledger.ts`**:
   - Created `quotas` table with partial indexes for FIFO (`studentId, status, remaining`) and sweeper (`validUntil`)
   - Created `quota_ledger` append-only table with indexes on `idempotencyKey`, `quotaId, createdAt`, `studentId`, `classInstanceId`, `recurringScheduleId`
   - Re-exported via `backend/db/schema/billing/index.ts`

7. **`backend/db/schema/classes/scheduling.ts`**:
   - Added `quotaId`, `earmarkedClasses`, `schedulingMode`, `generationHorizonWeeks`, `ondemandNoCreditsOutcome` columns + indexes to `recurring_schedules`
   - Added `ondemandStatus` column + index to `class_instances`

8. **Migration & DB Apply**:
   - Updated `4c-system_settings_seed.sql` with 5 system settings keys (`default_ondemand_horizon_weeks`, `default_ondemand_no_credits_outcome`, `ondemand_teacher_digest_hour`, `ondemand_no_credits_resolution_lead_minutes`, `quota_low_balance_threshold_percent`)
   - Executed `bun db push` and `bun db migrate` successfully

## Verification

- Per-file quality loop passed (`bun tsgo` + `bun biome:check` + lint queue)
- `bun run db push` and `bun run db migrate` executed cleanly without errors

## Carry-Over Points for Phase 2

- Next task is Phase 2 (Backend Types & Repositories): `backend/types/billing/quota.types.ts` and `backend/types/scheduling/scheduling.types.ts`, followed by `quota.repository.ts` and `quota-ledger.repository.ts`.
