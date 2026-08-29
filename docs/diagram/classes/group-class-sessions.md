# Group Class Session Management

Group class sessions let one class instance serve many enrolled students at once. A super admin reviews a session from the audit page (`classes/[id]/audit`), which fires the Pothos `groupClassAudit` query into `GroupClassService.getGroupClassAudit`. The service checks the `SESSION_VIEW_DETAILS` permission, loads the `groupClasses` row and its `classInstances` parent (throwing a localized `notFound` error if either is missing), then assembles the multi-student roster from `groupClassEnrollments` joined to `students`, the communication log from `classCommunications`, and the shared meeting link from `EffectiveMeetingService.resolveForClassInstance`, which falls back class-level config → recurring-schedule default → teacher default so every student in the group shares one join URL. Roster writes are idempotent rather than capacity-capped: `findEnrollmentKeys` / `findEnrollmentsByKeys` detect existing `(groupClassId, studentId)` pairs and `createManyEnrollments` uses `bulkInsertOnConflictDoNothing`, so duplicate enrollments never inflate the roster. From the same UI an admin can persist an admin note (`updateClassAdminNote`, gated by `SESSION_OVERRIDE_ACTIONS`, writing `classInstances.adminNotes`) and resend class-reminder emails (`resendClassNotifications`, rate-limited and gated by `SYSTEM_DISPATCH_EMAIL`), which fans out to parent users — resolved from enrollments through `students` → `parents` → `users` — via `NotificationRepository.createDeliveriesBatch` and records an email entry in `classCommunications`.

## Key sources

- `app/(dashboard)/classes/[id]/page.tsx` — class details page entry point
- `app/(dashboard)/classes/[id]/audit/page.tsx` — audit page rendering `ClassAuditContainer`
- `backend/graphql/query/classes/group-class.query.ts` — `groupClassAudit` query field
- `backend/graphql/mutation/classes/group-class.mutation.ts` — `updateClassAdminNote` and `resendClassNotifications` mutations
- `backend/services/group-class/group-class.service.ts` — `GroupClassService` permission checks, audit assembly, roster fetch, notification resend
- `backend/db/repo/classes/group-class.repository.ts` — `GroupClassRepository` queries/writes against `groupClasses`, `groupClassEnrollments`, `classCommunications`, `classInstances`, `students`, `parents`, `users`
- `backend/services/meeting/class-meeting-config.service.ts` — `EffectiveMeetingService.resolveForClassInstance` shared-meeting-link fallback chain

```mermaid
%% Group Class Session Management — audit view, roster + admin note updates, notification resend, shared meeting link resolution
sequenceDiagram
    actor Admin as SuperAdmin
    participant Page as ClassAuditPage
    participant GQL as PothosGroupClassFields
    participant Svc as GroupClassService
    participant Meet as EffectiveMeetingService
    participant Repo as GroupClassRepository
    participant Notif as NotificationRepository
    participant DB as PostgreSQL

    Admin->>Page: "open classes/[id]/audit"
    Page->>GQL: "query groupClassAudit(classInstanceId)"
    GQL->>Svc: getGroupClassAudit
    Svc->>Svc: assert permission SESSION_VIEW_DETAILS
    Svc->>Repo: getByClassInstanceId + instance lookup
    Repo->>DB: "select groupClasses, classInstances"
    alt class or instance missing
        DB-->>Svc: null
        Svc-->>GQL: throw notFound
    end
    Svc->>Repo: getEnrollmentsWithStudentDetails
    Repo->>DB: "join groupClassEnrollments + students (multi-student roster)"
    Svc->>Repo: getCommunications
    Repo->>DB: select classCommunications
    Svc->>Meet: resolveForClassInstance
    Meet->>DB: "class config else recurring default else teacher default"
    Meet-->>Svc: shared joinUrl / meetingId / provider
    Svc-->>GQL: audit payload with roster counts and meetingInfo
    GQL-->>Page: GroupClassAudit

    Admin->>Page: save admin note
    Page->>GQL: "mutation updateClassAdminNote"
    GQL->>Svc: "updateAdminNote (SESSION_OVERRIDE_ACTIONS)"
    Svc->>Repo: updateAdminNote
    Repo->>DB: "update classInstances.adminNotes"
    Svc-->>GQL: refreshed GroupClassAudit

    Admin->>Page: resend notifications
    Page->>GQL: "mutation resendClassNotifications (rate limited)"
    GQL->>Svc: "resendNotifications (SYSTEM_DISPATCH_EMAIL)"
    Svc->>Repo: getParentUserIdsForGroupClass
    Repo->>DB: "enrollments join students -> parents -> users"
    Svc->>Notif: "createDeliveriesBatch EMAIL CLASS_REMINDER"
    Notif->>DB: insert notificationDeliveries
    Svc->>Repo: "createCommunication email log entry"
    Repo->>DB: insert classCommunications

    Note over Svc,Repo: Roster writes are idempotent: findEnrollmentKeys / findEnrollmentsByKeys then createManyEnrollments via bulkInsertOnConflictDoNothing, so duplicate enrollments are skipped and roster sizes grow only with new students.
```

[Machine-checkable diagram](./group-class-sessions.mmd)
