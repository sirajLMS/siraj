# Future Schedule Projection

The Future Schedule page projects a teacher's upcoming class instances over a fixed 30-day horizon so teachers (and admins) can plan ahead. The entry point is `app/(dashboard)/schedule/future/page.tsx`, a server page guarded by `withPageAuth` and `requireTeacherIdForPage`, which renders `FutureScheduleContainer`, the client ViewModel `useFutureScheduleViewModel` issues the `teacherFutureSchedule` GraphQL query. The resolver (`backend/graphql/query/classes/class-session.query.ts`) requires a logged-in user and delegates to `ScheduleService.getTeacherFutureSchedule`, which first resolves the effective teacher via `resolveTeacherId` — admins with schedule/staff permissions may pass an explicit `teacherId`, otherwise the caller's own teacher record is used, and failure throws a locale-aware `unauthorizedAction` error. The service then queries monthly leave-quota usage (`leaveQuotaUsage` table plus the `teacher_max_leaves` system setting) and fetches projected rows from `classInstances` (joined to `students`, `classSubjects`, `recurringSchedules`) limited to non-deleted instances in `NOT_ACTIVATED`/`ACTIVATED` execution state between today and today + 30 days. Each row is mapped with an `EffectiveMeetingService` join URL and a `leaveRequestDisabled` flag whose reason is `time` (class already started) or `quota` (monthly leaves exhausted), and important notes plus an optional support contact are loaded in parallel (notes degrade to an empty list on failure). The returned payload (`classes`, `leaveQuotaUsed/Total`, `totalClasses`, `importantNotes`, `supportContact`) is rendered responsive mobile/desktop, the main side effect is the `updateSessionStatusLeave` mutation, which re-checks the leave quota server-side and triggers a refetch on success or a quota/leave error notification on failure.

## Key sources

- `app/(dashboard)/schedule/future/page.tsx` — server page, auth wrapper, metadata
- `frontend/common/views/dashboard/teachers/futureSchedule/FutureScheduleContainer.tsx` — container, lazy mobile/desktop views
- `frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel.ts` — Apollo query, leave/support mutations, notifications
- `backend/graphql/query/classes/class-session.query.ts` — `teacherFutureSchedule` query field
- `backend/graphql/mutation/classes/class-session.mutation.ts` — `updateSessionStatusLeave` mutation
- `backend/services/schedule/schedule.service.ts` — `getTeacherFutureSchedule`, `mapFutureClassItem`, `resolveSupportContact`
- `backend/services/schedule/schedule-query.service.ts` — related permission-gated query service (status tracking, not this flow)
- `backend/services/schedule/__shared__/resolveTeacherId.ts` — admin vs. own-record teacher resolution
- `backend/db/repo/scheduling/scheduling-queries.repository/teacher-schedule.repository.ts` — `getTeacherFutureClasses` (30-day window, state filter)
- `backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts` — leave quota usage and enforcement

```mermaid
%% Future Schedule Projection — teacher upcoming classes over a 30-day horizon
sequenceDiagram
    autonumber
    participant T as Teacher
    participant P as FuturePage
    participant VM as useFutureScheduleViewModel
    participant GQL as teacherFutureScheduleResolver
    participant S as ScheduleService
    participant A as resolveTeacherId
    participant R as SchedulingRepository
    participant M as EffectiveMeetingService
    participant N as TeacherNotesService
    participant DB as Postgres

    T->>P: Open /schedule/future
    P->>P: withPageAuth + requireTeacherIdForPage
    P->>VM: render FutureScheduleContainer
    VM->>GQL: query teacherFutureSchedule(teacherId)
    GQL->>GQL: authScopes loggedIn, throw if no ctx.user
    GQL->>S: getTeacherFutureSchedule(userId, tErrors, teacherId?)
    S->>A: resolveTeacherId(userId, teacherId)
    Note over A: admin permission and teacherId, else own teacher record, else throw unauthorizedAction
    S->>R: getTeacherLeaveQuotaUsage(teacherId, year, month)
    R->>DB: table leaveQuotaUsage
    S->>S: maxLeaves from system settings key teacher_max_leaves
    S->>R: getTeacherFutureClasses(teacherId, fromDate, toDate plus 30 days)
    R->>DB: classInstances join students, classSubjects, recurringSchedules
    Note over R: filter deletedAt is null and executionState in NOT_ACTIVATED, ACTIVATED, order by scheduledStartAt
    DB-->>S: FutureClassRow list
    S->>S: mapFutureClassItem per row, leaveRequestDisabled reason time or quota
    S->>M: resolveForClassInstance per row
    M-->>S: effectiveMeeting and join url
    par Side data in parallel
        S->>N: getActiveNotes, fallback to empty list on failure
    and
        S->>S: resolveSupportContact from system settings and staff profile
    end
    S-->>VM: TeacherFutureScheduleReturnType with classes, quota, notes, contact
    VM-->>T: responsive view grouped by selectedDate
    T->>VM: onRequestLeave(classInstanceId)
    VM->>GQL: mutation updateSessionStatusLeave
    GQL-->>VM: success refetches, quota error shows notification
```

Machine-checkable copy: [future-schedule.mmd](./future-schedule.mmd)
