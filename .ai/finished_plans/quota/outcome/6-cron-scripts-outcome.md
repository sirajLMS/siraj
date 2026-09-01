# Phase 6 Outcome: Cron Scripts

## Tasks Covered
- Task 13: Quota expiry sweeper (`scripts/quota-expiry-sweeper.ts`)
- Task 14: On-demand instance generator (`scripts/ondemand-instance-generator.ts`)
- Task 15: On-demand no-credits resolver (`scripts/ondemand-no-credits-resolver.ts`)
- Task 16: Teacher digest cron (`scripts/ondemand-teacher-digest-cron.ts`)
- Task 17: System settings seed & script commands in `package.json`

---

## Implementation Details

1. **`scripts/quota-expiry-sweeper.ts`**:
   - Executes `QuotaService.expireOverdueQuotas()` and `QuotaService.refreshPeriodicQuotas()`.
   - Idempotent per quota/period. Registered in `package.json` as `"quota:expire"`.

2. **`scripts/ondemand-instance-generator.ts`**:
   - Queries `recurring_schedules` with `schedulingMode = ON_DEMAND`.
   - Reads active days from `recurring_schedule_days`.
   - Checks `AvailabilityService.isSlotAvailable` per slot:
     - Sets `executionState = ON_DEMAND_CONFLICT_HELD` when slot has a teacher/student conflict.
     - Sets `executionState = ON_DEMAND_PENDING_CREDITS` and `ondemandStatus = PENDING_CREDIT` when available student balance (credits + active quotas) <= 0.
     - Otherwise sets `executionState = NOT_ACTIVATED` and `ondemandStatus = AVAILABLE`.
   - Re-evaluates pending credit instances using `QuotaService.refreshStudentOndemandInstances` for students with balance > 0.
   - Registered in `package.json` as `"ondemand:generate"`.

3. **`scripts/ondemand-no-credits-resolver.ts`**:
   - Reads `ondemand_no_credits_resolution_lead_minutes` (default 240m).
   - Queries pending credit instances scheduled to start within lead time window.
   - Evaluates schedule's `ondemandNoCreditsOutcome`:
     - `AUTO_CANCEL` -> `executionState = ON_DEMAND_NO_CREDITS_CANCELLED` and `ondemandStatus = NO_CREDITS_CANCELLED`.
     - `AUTO_ABSENT_NO_CREDITS` -> `executionState = ON_DEMAND_NO_CREDITS_ABSENT` and `ondemandStatus = NO_CREDITS_ABSENT`.
   - Registered in `package.json` as `"ondemand:resolve"`.

4. **`scripts/ondemand-teacher-digest-cron.ts`**:
   - Reads `ondemand_teacher_digest_hour` setting (default 9 AM).
   - Queries pending on-demand instances grouped by teacher.
   - Derives teacher local hour using `schedule.timezone`.
   - Dispatches `sendOndemandTeacherDailyDigest` when current local hour matches configured target hour.
   - Registered in `package.json` as `"ondemand:teacher-digest"`.

5. **`package.json` commands added**:
   - `"quota:expire"`
   - `"ondemand:generate"`
   - `"ondemand:resolve"`
   - `"ondemand:teacher-digest"`

---

## Quality Verification

- `bun tsgo`: Clean (0 errors)
- `bun biome:check`: Clean (0 errors, 0 warnings)
