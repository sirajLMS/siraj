# Recurring Schedule Creation

A staff user opens the recurring-schedules dashboard (`app/(dashboard)/recurring-schedules`) and fills the `CreateRecurringClassContainer` form with teacher, student, subject, weekly days and start times, duration, rate, and timezone (defaulted from the browser via `resolveBrowserIanaTimezoneId`). On submit, `useCreateRecurringClassViewModel` runs the Zod-validated form through the GraphQL `createRecurringClass` mutation (a parallel server-action entry exists at `app/(dashboard)/classes/new/actions.ts`), which forwards the input to `RecurringClassService.createRecurringClass`. The service first validates the caller's `SCHEDULE_CREATE_CLASS` permission, required fields, and subject, then resolves the timezone-aware schedule pattern and asks `AvailabilityService.assertSchedulePatternAvailable` to build concrete occurrences and batch-check them against existing `class_instances` and the teacher's availability windows — any conflict throws a localized `ValidationError`. It also verifies the student has quota remaining or a positive credit balance before persisting. Inside a single transaction, `SchedulingRepository.createRecurringScheduleWithInstances` inserts the `recurring_schedules` row plus its `recurring_schedule_days`, takes advisory locks, computes instance rows for the configured number of weeks, and batch-inserts the `class_instances`, billing then runs in one of three branches (earmarked quota reservation, pool-quota redemption, or sequential `CreditService.deductForBooking` per instance), skipped entirely for `ON_DEMAND` mode. After commit, best-effort side effects fire: `CLASS_SCHEDULED` notifications to parent/teacher/student and per-instance meeting URL generation — neither failure type surfaces to the caller. The client receives the schedule id, instance ids, and first meeting URL, optionally posts the meeting config, and redirects to the first class instance.

## Key sources

- `app/(dashboard)/recurring-schedules/page.tsx` — list page entry (also `app/(dashboard)/classes/new/actions.ts` server action)
- `frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer.tsx` and `useCreateRecurringClassViewModel.ts` — form, timezone defaulting, mutation submit
- `backend/graphql/mutation/scheduling/schedule.mutation.ts` — `createRecurringClass` mutation field
- `backend/graphql/pothos/classes/recurring-class.pothos.ts` — input/result object definitions
- `backend/services/schedule/recurring-class.service.ts` — orchestration: validation, transaction, billing branches, notifications, meeting URLs
- `backend/services/scheduling/availability.service.ts` — `assertSchedulePatternAvailable` conflict checks
- `backend/db/repo/scheduling/recurring.ts` — `createRecurringScheduleWithInstances` persistence
- `backend/services/schedule/resolve-viewer-timezone.ts` — viewer timezone resolution (user profile, then system default)

```mermaid
%% Recurring Schedule Creation — build a recurring class series
sequenceDiagram
    autonumber
    actor Staff as Staff User
    participant FE as CreateRecurringClassContainer
    participant GQL as Mutation createRecurringClass
    participant RCS as RecurringClassService
    participant AV as AvailabilityService
    participant EMT as EffectiveMeetingService
    participant Repo as SchedulingRepository
    participant DB as PostgreSQL
    participant Bill as "QuotaService / CreditService"
    participant Side as Side Effects

    Staff->>FE: Pick teacher, student, subject, weekly days, start times, duration, rate
    Note over FE: Zod schema validates form, timezone defaults via resolveBrowserIanaTimezoneId
    Staff->>FE: Submit form
    FE->>GQL: createRecurringClass input via Apollo useMutation
    GQL->>GQL: Require ctx.user and superAdmin authScope
    GQL->>RCS: createRecurringClass userId, input

    RCS->>RCS: validateCreateRecurringClass

    alt Permission denied or invalid input
        RCS-->>GQL: UnauthorizedError or ValidationError
        GQL-->>FE: Localized error message
        FE-->>Staff: Show error snackbar
    else Validation passes
        RCS->>AV: assertSchedulePatternAvailable days, range, timezone
        Note over AV: buildPatternOccurrences expands weekly days into concrete occurrences in the chosen timezone
        Note over AV: batch overlap check vs class_instances, then validateBookingAvailabilityBatch
        AV-->>RCS: Throw ValidationError on any conflict
        RCS->>RCS: validateBalanceOrQuota quota remaining or credit balance
        RCS->>DB: Begin transaction
        RCS->>EMT: resolveForNewBooking teacherId
        EMT-->>RCS: Meeting join URL
        RCS->>RCS: resolveClassRate to RateSnapshot
        RCS->>Repo: createRecurringScheduleWithInstances
        Repo->>DB: Insert recurring_schedules row and recurring_schedule_days
        Repo->>DB: pg advisory locks on teacher and student
        Repo->>Repo: computeInstanceRows for generateInstancesForWeeks
        Repo->>Repo: validateInstanceBatch overlap and availability
        Repo->>DB: Batch insert class_instances

        alt ON DEMAND mode
            RCS->>RCS: Skip billing, weeks set to 0
        else Earmarked quota
            RCS->>Bill: QuotaService reserveForRecurringSchedule
        else Pool quota
            RCS->>Bill: QuotaService redeemForInstances
        else Credit backed
            RCS->>Bill: CreditService deductForBooking sequentially per instance
        end

        RCS->>DB: Commit transaction
        RCS->>Side: Dispatch CLASS_SCHEDULED notifications best effort
        RCS->>Side: Generate meeting URL per instance best effort
        RCS-->>GQL: recurringScheduleId, classInstanceIds, meetingUrl
        GQL-->>FE: CreateRecurringClassResult
        FE->>FE: postCreateRecurringMeetingConfig then redirect to first class
    end
```

Standalone copy: [recurring-schedule-creation.mmd](./recurring-schedule-creation.mmd)
