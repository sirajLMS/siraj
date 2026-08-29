# Teacher Onboarding

An admin or manager user opens `/teachers/onboarding`, a page gated by `withPageAuth(AppPermission.TEACHERS_CREATE)`, and fills a Zod-validated form covering the teacher's core profile (name, email, password, nationality, phone, address), salary configuration (`hourlyRate` / `rateCurrency`), and an optional initial payout method. Submitting runs the `useCreateTeacherOnboarding` hook, which maps the form into a `TeacherOnboardingInput` and calls the `createTeacher` GraphQL mutation. The resolver rate-limits and authenticates the caller, then delegates to `TeacherOnboardingService.createTeacher`, which drives the shared `UserOnboardingService.createUserOfType` skeleton: pre-transaction checks (permission, email uniqueness, password strength, name validation, bcrypt hashing) followed by a single DB transaction that inserts the `users` row, writes timezone/display currency, inserts the `teachers` extension row via `TeacherRepository.create`, assigns the `TEACHER_DEFAULT` permission group, and optionally creates the initial payout payment method. Any failure inside the transaction rolls the whole provisioning back; pre-check failures return localized errors (`insufficientPermissions`, `userEmailExists`, `permissionGroupNotFound`). After a successful commit the client evicts the `teacherDirectory` Apollo cache, persists the meeting-platform config for the new teacher (a failure here only raises a warning — the teacher still exists), stores the result in the onboarding Zustand store, shows a success snackbar, and navigates to the new teacher's profile page. Availability is not seeded by this flow; it is configured afterwards on the teacher's separate availability page.

## Key sources

- `app/(dashboard)/teachers/onboarding/page.tsx` — server page, `withPageAuth` permission gate
- `frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel.ts` — form, validation, submission view model
- `frontend/common/hooks/useCreateTeacherOnboarding.ts` — mutation execution, cache eviction, meeting-config persistence, store updates
- `backend/graphql/mutation/shared/onboarding.mutation.ts` — `createTeacher` mutation field
- `backend/services/teacher/teacher-onboarding.service.ts` — domain orchestration over the shared onboarding helper
- `backend/services/user/user-onboarding.service.ts` — `createUserOfType` permission check, pre-checks, transaction, group assignment
- `backend/services/teacher/__shared__/buildTeacherInsertPayload.ts` — teacher extension row payload (profile + salary fields)

## Diagram

```mermaid
sequenceDiagram
    actor ADM as "Admin / Manager"
    participant PG as "Onboarding page"
    participant VM as "useTeacherOnboardingViewModel"
    participant HK as "useCreateTeacherOnboarding"
    participant GQL as "createTeacher mutation"
    participant TOS as "TeacherOnboardingService"
    participant UOS as "UserOnboardingService.createUserOfType"
    participant DB as "PostgreSQL"

    ADM->>PG: open /teachers/onboarding
    PG->>PG: withPageAuth requires TEACHERS_CREATE
    ADM->>VM: submit form, Zod-validated
    VM->>HK: execute(formData)
    HK->>GQL: Apollo createTeacherMutation
    GQL->>GQL: requireAuthWithRateLimit
    GQL->>TOS: createTeacher(actorUserId, input)
    TOS->>UOS: createUserOfType(TEACHERS_CREATE, TEACHER_DEFAULT)

    Note over UOS: Pre-transaction checks
    UOS->>UOS: hasPermission, email uniqueness, password strength, name validation, hashPassword
    alt pre-check failed
        UOS-->>GQL: insufficientPermissions / userEmailExists
        GQL-->>VM: error snackbar
    end

    UOS->>DB: begin transaction
    UOS->>DB: UserRepository.create users row
    UOS->>DB: updateTimezone + updateProfileFields displayCurrency
    TOS->>DB: TeacherRepository.create with hourlyRate and rateCurrency
    UOS->>DB: bulkAssignUsersToGroup TEACHER_DEFAULT
    opt initialPayoutMethod provided
        TOS->>DB: PaymentMethodService.createUserPaymentMethodInternal
    end
    alt any in-transaction step fails
        UOS-->>DB: rollback, permissionGroupNotFound or repo error
        GQL-->>VM: error snackbar
    else commit
        GQL-->>HK: TeacherOnboardingResult
        HK->>HK: evict teacherDirectory cache, persist meeting config
        Note over HK: meeting-config failure only raises a warning, teacher stays created
        HK-->>VM: store result, success snackbar
        VM-->>ADM: navigate to teacher profile, meeting tab href
    end
```

Machine-checkable copy: [onboarding.mmd](./onboarding.mmd)
