# Class Catalog Entry Creation

Creating a class at `/classes/new` registers a recurring class in the class catalog for a student–teacher–subject combination. The page (`app/(dashboard)/classes/new/page.tsx`) is gated by `withPageAuth` with `SCHEDULE_MANAGE_RECURRING` and renders `CreateRecurringClassContainer`, a react-hook-form + Zod form instantiating the compile-time `createRecurringClassSchema` (subject, classType `REGULAR`/`TRIAL`/`ADVANCE`, day-of-week pattern, default start time, duration, IANA timezone, scheduling mode, optional quota/rate overrides). On submit the `createRecurringClass` server action maps the form to a service input and calls `RecurringClassService.createRecurringClass`, which validates permission (`SCHEDULE_CREATE_CLASS`), the subject's active status, schedule-pattern conflicts via `AvailabilityService`, and credit balance or quota remaining (skipped for `ON_DEMAND` mode). Inside a single DB transaction it resolves the teacher's default meeting provider, computes a frozen rate snapshot, writes the `recurring_schedules` row, its day rows, and the generated `class_instances`, then reserves quota (earmark or pool redeem) or deducts credits per instance with idempotency keys. After commit, the service fires `CLASS_SCHEDULED` notifications per instance (failures are logged, never thrown) and best-effort generates meeting join URLs, so the class is immediately ready to be scheduled and attended, note the subject catalog itself (categories/subjects/resources) is bootstrapped separately via `ClassCatalogService` upserts in `backend/services/classes/class-catalog.service.ts`.

## Key sources

- `app/(dashboard)/classes/new/page.tsx` — page entry, `withPageAuth` gating, renders the recurring-class container
- `app/(dashboard)/classes/new/actions.ts` — `createRecurringClass` server action: input mapping, days check, localized error handling
- `frontend/common/views/dashboard/classes/recurring/recurringClassSchema.ts` — Zod schema for the form (subjectId, classType, days, duration, timezone, schedulingMode, quota/rate fields)
- `backend/services/schedule/recurring-class.service.ts` — `RecurringClassService.createRecurringClass`: validation, transaction, side effects
- `backend/services/classes/class-catalog.service.ts` — subject/category/resource catalog upserts used by seeders (read for the "catalog entry" framing, not called by the page)

## Diagram

```mermaid
%% Class Catalog Entry Creation — recurring class creation from /classes/new (subject, classType REGULAR/TRIAL/ADVANCE, scheduling readiness)
sequenceDiagram
    autonumber
    actor A as StaffAdmin
    participant P as "ClassesNewPage (withPageAuth SCHEDULE_MANAGE_RECURRING)"
    participant F as "CreateRecurringClassContainer (RHF + createRecurringClassSchema)"
    participant SA as "createRecurringClass server action"
    participant CS as "RecurringClassService"
    participant PS as "PermissionsService"
    participant AV as "AvailabilityService"
    participant MS as "EffectiveMeetingService"
    participant R as "SchedulingRepository / RecurringScheduleRepository"
    participant B as "CreditService / QuotaService"
    participant N as "Notification Dispatch (CLASS_SCHEDULED)"
    participant DB as "PostgreSQL"

    A->>P: Open /classes/new
    P-->>A: Render recurring class form
    A->>F: Fill student, teacher, subjectId, classType, days, start time, duration, timezone, schedulingMode, quota or rate
    F->>F: Zod validate (days enabled, duration > 0, IANA timezone)
    F->>SA: Submit RecurringClassFormData
    SA->>SA: mapFormDataToServiceInput + parseIanaTimezone
    SA->>CS: createRecurringClass(userId, input, tErrors)
    CS->>PS: hasPermission SCHEDULE_CREATE_CLASS
    alt No permission or invalid input
        PS-->>CS: UnauthorizedError / ValidationError
        CS-->>SA: throw DomainError
        SA-->>F: localized failure message
    else Validated
        CS->>DB: ClassSubjectRepository.getSubjectById (must exist and be active)
        CS->>AV: assertSchedulePatternAvailable (student/teacher conflicts, horizon window)
        CS->>B: validateBalanceOrQuota (quota remaining or credit balance > 0, skipped for ON_DEMAND)
        CS->>R: db.transaction begin
        CS->>MS: resolveForNewBooking (teacher default meeting provider)
        CS->>R: fetchRawRateData + resolveClassRate -> RateSnapshot
        CS->>R: createRecurringScheduleWithInstances (recurring_schedules, days, class_instances)
        alt Quota earmarked classes
            CS->>B: QuotaService.reserveForRecurringSchedule
        else Quota pool mode
            CS->>B: QuotaService.redeemForInstances
        else Credit-backed mode
            CS->>B: CreditService.deductForBooking per instance (sequential, idempotency keys)
        end
        CS->>DB: commit transaction
        CS->>A: StudentRepository.recalcHoursPerWeekIfSqlite (SQLite fallback, PG uses triggers)
        CS->>N: dispatch CLASS_SCHEDULED per instance (Promise.allSettled, non-fatal on failure)
        CS->>MS: MeetingConfigSnapshotService.generateAndAttachForClassInstance (best-effort per instance)
        CS-->>SA: recurringScheduleId, classInstanceCount, meetingUrl
        SA-->>F: success payload
        F-->>A: Show confirmation
    end
```

Machine-checkable copy: [class-creation.mmd](./class-creation.mmd)
