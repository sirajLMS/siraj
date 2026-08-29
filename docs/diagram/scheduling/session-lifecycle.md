# Class Session Lifecycle & Expiry

A class instance is born as a `NOT_ACTIVATED` row (outcome `PENDING`) generated from a recurring schedule — pool-mode schedules redeem student quota up front via `QuotaService.redeemForInstances` and stamp `quotaDeducted`, while on-demand instances wait in `PENDING_CREDIT` and deduct quota or credit when activated. Staff (or admins via override) activate the instance once `SystemRulesService` accepts the activation time window, then mark it started (`RUNNING`) and finally stop it into `COMPLETED`/`TAKEN`; alternatively they mark it `ABSENT` (after the absent waiting period) or `LEAVE` (which releases quota or refunds credit). Auto-expiry is cronless and just-in-time: admin and teacher dashboard reads call `ClassInstanceExpiryService.processExpiredInstances`, which finds instances past the `session_missed_grace_minutes` window, marks them `COMPLETED`/`MISSED` via `markClassMissedBySystem`, and notifies only the parent with `CLASS_MARKED_MISSED`. Every manual transition is permission-gated, validated against the allowed state machine, and followed by a cache invalidation plus a `CLASS_*` lifecycle notification to parent and teacher via `dispatchWithPreferences`. Admins can additionally `deleteInstance` (soft-delete with quota release or credit refund and best-effort meeting cancel), `reschedule` (supersede the original, insert a fresh successor, and re-deduct quota or credit onto it), or `reset` the instance back to `NOT_ACTIVATED` with the same refund-or-release handling. Edge cases: dispatch failures are logged and never fail the action, quota release on a quota-backed instance that fails does NOT trigger a phantom credit refund, and missing `recurringScheduleId` on a deducted instance is logged as `quota_release_skipped_no_schedule`.

## Key sources

- `backend/services/session/class-session.service.ts`
- `backend/services/session/class-instance-expiry.service.ts`
- `backend/services/scheduling/state-change-validation.service.ts`
- `backend/services/schedule/recurring-class.service.ts`
- `backend/services/schedule/schedule.service.ts`
- `backend/services/teacher/teacher-dashboard.service.ts`
- `backend/db/repo/scheduling/state-changes.ts`

## Diagram

```mermaid
%% Class Session Lifecycle & Expiry - ClassSessionService + ClassInstanceExpiryService
stateDiagram-v2
    state "NOT_ACTIVATED" as NotActivated
    state "ACTIVATED" as Activated
    state "RUNNING" as Running
    state "COMPLETED" as Completed
    state "SOFT_DELETED" as Deleted

    [*] --> NotActivated: schedule generation via RecurringClassService
    NotActivated --> Activated: activate or activateOverride
    Activated --> Running: updateStatusStart
    Running --> Completed: stop with outcome TAKEN
    Activated --> Completed: updateStatusAbsent with outcome ABSENT
    Activated --> Completed: updateStatusLeave with outcome LEAVE
    NotActivated --> Completed: automated absent or leave
    NotActivated --> Completed: auto expiry with outcome MISSED
    Completed --> NotActivated: reset
    NotActivated --> Deleted: deleteInstance

    note right of NotActivated
        Billing hook on booking: pool-mode schedules redeem quota up front
        via QuotaService.redeemForInstances and set quotaDeducted.
        On-demand instances wait in PENDING_CREDIT and deduct quota or
        credit at activation time instead.
    end note

    note right of Activated
        activate enforces the SystemRulesService time window.
        override variant requires extra permissions and skips the window.
        Every transition dispatches a lifecycle notification
        to parent and teacher via dispatchWithPreferences.
    end note

    note left of Completed
        Outcomes recorded on the instance: TAKEN, ABSENT, LEAVE, MISSED.
        Leave, reset, and delete release the quota through
        QuotaService.tryReleaseForInstance and fall back to a
        CreditService refund when the instance is not quota-backed.
    end note

    note left of Deleted
        deleteInstance also cancels the remote meeting best-effort
        and dispatches CLASS_CANCELLED.
        reschedule supersedes the original, inserts a fresh successor,
        and re-deducts quota or credit onto it.
    end note

    note right of Completed
        Auto expiry runs just-in-time: Admin and teacher dashboard reads
        call ClassInstanceExpiryService.processExpiredInstances, which
        marks instances missed after the session_missed_grace_minutes
        window and notifies only the parent with CLASS_MARKED_MISSED.
    end note
```

Machine-checkable copy: [session-lifecycle.mmd](./session-lifecycle.mmd)
