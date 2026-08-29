# Pre-Generated Instance Materialization

The on-demand instance generator (`scripts/ondemand-instance-generator.ts`) is a daily cron entry point (invoked via `bun run ondemand:generate`) that materializes upcoming `classInstances` ahead of time from active recurring schedules whose `schedulingMode` is `ON_DEMAND`. For each schedule it computes a rolling generation window (default 2 weeks, per `generationHorizonWeeks`, clamped by `effectiveFrom`/`effectiveUntil`), loads the active `recurringScheduleDays` and any overlapping existing instances, and short-circuits when the schedule has no active days. Inside a per-schedule transaction it locks the student's active quotas (`SELECT FOR UPDATE`) and combines credit balance with remaining quota; students with zero combined balance are skipped entirely. Each candidate slot is matched by day-of-week in the schedule's IANA timezone, checked against `AvailabilityService.isSlotAvailable` in a batched `Promise.all`, and then classified sequentially (so a running balance is tracked): `NOT_ACTIVATED` when the slot is free and balance remains, `ON_DEMAND_PENDING_CREDITS` when balance is exhausted, and `ON_DEMAND_CONFLICT_HELD` when the slot is unavailable. New rows are inserted with `ON CONFLICT DO NOTHING` keyed by a deterministic idempotency key, so concurrent or repeated runs cannot double-insert; afterwards `QuotaService.refreshStudentOndemandInstances` re-reconciles the student's on-demand instances. Downstream, `ClassSessionService` redeems an open quota or deducts credits when a `PENDING_CREDIT` instance actually starts.

## Key sources

- `scripts/ondemand-instance-generator.ts` — entry point, window computation, slot building, batched availability checks, transactional quota lock + insert, quota refresh
- `backend/services/session/class-session.service.ts` — downstream consumption: session-start quota redemption / credit deduction for `PENDING_CREDIT` on-demand instances
- `docs/billing/quota-system.md` — cron cadence context for the generator

```mermaid
%% On-Demand Instance Materialization - pre-generates upcoming classInstances from recurring templates
flowchart TB
    START["cron: bun run ondemand:generate"] --> RUN["runOndemandInstanceGenerator"]
    RUN --> SELECT["SELECT recurringSchedules<br/>WHERE schedulingMode = ON_DEMAND<br/>AND deletedAt IS NULL (limit 500)"]

    SELECT --> EACH["generateInstancesForSchedule (parallel per schedule)"]
    EACH --> RANGE["computeScheduleDateRange<br/>generationHorizonWeeks (default 2)<br/>clamped by effectiveFrom / effectiveUntil"]

    RANGE --> GUARDS{"parallel read-only guards"}
    GUARDS --> DAYS["SELECT recurringScheduleDays<br/>WHERE isActive = true"]
    GUARDS --> OVERLAP["SELECT overlapping classInstances<br/>same student OR teacher in window"]

    DAYS --> EMPTY{"any active days?"}
    EMPTY -- "no" --> SKIP1["return 0 (skip schedule)"]
    EMPTY -- "yes" --> TX["begin DB transaction"]

    TX --> LOCKQ["CreditRepository.getBalance +<br/>SELECT quotas FOR UPDATE<br/>(status = ACTIVE)"]
    LOCKQ --> BAL{"availableBalance = creditsRemaining<br/>+ quotaRemaining > 0?"}
    BAL -- "no" --> SKIP2["log and return 0"]
    BAL -- "yes" --> SLOTS["generatePendingInstancesForRange"]

    SLOTS --> P1["Phase 1: walk dates, match day-of-week<br/>in schedule timezone, build slots<br/>computeStartAtInTimezone"]
    P1 --> P2["Phase 2: batched AvailabilityService.isSlotAvailable<br/>skip slots already in conflict set"]
    P2 --> P3["Phase 3: determineExecutionState per slot<br/>decrement running balance sequentially"]

    P3 --> STATE{"slot outcome"}
    STATE -- "available + balance" --> NA["executionState = NOT_ACTIVATED<br/>ondemandStatus = AVAILABLE"]
    STATE -- "no balance" --> PC["executionState = ON_DEMAND_PENDING_CREDITS<br/>ondemandStatus = PENDING_CREDIT"]
    STATE -- "not available" --> CH["executionState = ON_DEMAND_CONFLICT_HELD<br/>ondemandStatus = null"]

    NA --> INSERT["INSERT classInstances<br/>ON CONFLICT DO NOTHING<br/>(idempotencyKey per slot)"]
    PC --> INSERT
    CH --> INSERT

    INSERT --> REFRESH["QuotaService.refreshStudentOndemandInstances(studentId)"]

    INSERT -.-> DOWN["downstream: ClassSessionService on session start<br/>PENDING_CREDIT -> redeem quota or deduct credit"]
```

Machine-checkable copy: [instance-generation.mmd](instance-generation.mmd)
