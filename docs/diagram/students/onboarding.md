# Student Onboarding

Staff members with the `STUDENTS_CREATE` permission onboard new students from the dashboard page `/(dashboard)/students/onboarding`, which is gated by `withPageAuth`. The page renders a form with three sections — parent assignment, student info, and teacher assignment — managed by `useStudentOnboardingViewModel` with a Zod schema; a `?parentId=` query param pre-fills and locks the parent picker when the flow is launched from a parent's profile. On submit, `useCreateStudentOnboarding` sends the Apollo `createStudent` mutation to the Pothos resolver in `onboarding.mutation.ts`, which enforces auth and rate limiting before delegating to `StudentOnboardingService.createStudent`. That service requires an email and password (every student gets a login account), then runs the shared `UserOnboardingService.createUserOfType` pipeline: permission check, pre-checks that the referenced parent and teacher exist (`ParentRepository.getParentProfile`, `TeacherRepository.findById`), email-uniqueness and name validation, and bcrypt password hashing. Inside a single DB transaction it creates the `users` row (plus timezone, phone, and display-currency profile fields), creates the `students` extension row with status defaulting to `ON_TRIAL` and the `classesTotal` / `classesRemaining` quota fields defaulted to 0, assigns the `STUDENT_DEFAULT` permission group, and finally records a teacher assignment row when a primary teacher was selected. Any domain error — missing email/password, parent or teacher not found, duplicate email, insufficient permissions, or a missing permission group — rolls back the whole transaction and surfaces as a localized GraphQL error shown in the form's error banner. On success the UI shows a snackbar and redirects to the new student's profile page.

## Key sources

- `app/(dashboard)/students/onboarding/page.tsx` — page entry, `withPageAuth` permission gate
- `frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel.ts` — form state, Zod validation, submit wiring
- `frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema.ts` — form schema
- `frontend/common/hooks/useCreateStudentOnboarding.ts` — Apollo mutation hook
- `backend/graphql/mutation/shared/onboarding.mutation.ts` — `createStudent` Pothos resolver
- `backend/services/student/student-onboarding.service.ts` — student-specific orchestration
- `backend/services/user/user-onboarding.service.ts` — shared `createUserOfType` provisioning pipeline

## Diagram

```mermaid
%% Student Onboarding — staff-driven student account + profile creation
sequenceDiagram
    actor Staff as Staff User
    participant Page as OnboardingPage
    participant VM as useStudentOnboardingViewModel
    participant Hook as useCreateStudentOnboarding
    participant GQL as createStudent Resolver
    participant SVC as StudentOnboardingService
    participant UOS as UserOnboardingService
    participant PR as ParentRepository
    participant TR as TeacherRepository
    participant UR as UserRepository
    participant SR as StudentRepository
    participant PMR as PermissionManagementRepository

    Staff->>Page: Open /students/onboarding
    Page->>Page: withPageAuth STUDENTS_CREATE
    Note over Page,VM: Optional parentId query param pre-fills and locks parent field
    Staff->>VM: Fill parent, identity, status, teacher sections
    VM->>VM: Zod schema validation
    VM->>Hook: onSubmit form data
    Hook->>GQL: createStudent mutation
    GQL->>GQL: requireAuthWithRateLimit
    GQL->>SVC: createStudent actorUserId input
    SVC->>SVC: Require email and password
    SVC->>UOS: createUserOfType STUDENTS_CREATE
    UOS->>UOS: Check actor permission
    UOS->>PR: Verify parent exists preChecks
    UOS->>TR: Verify teacher exists preChecks
    UOS->>UR: existsByEmail uniqueness check
    UOS->>UOS: Validate name and hash password
    Note over UOS,PMR: All writes run inside one DB transaction
    UOS->>UR: create users row with passwordHash
    UOS->>UR: updateTimezone and updateProfileFields
    UOS->>SR: create students row status ON_TRIAL, classesTotal and classesRemaining quota defaults, idempotencyKey
    UOS->>PMR: bulkAssignUsersToGroup STUDENT_DEFAULT
    UOS->>SR: createTeacherAssignment afterExtension
    SVC-->>GQL: StudentOnboardingResult with studentId
    GQL-->>Hook: createStudent data
    Hook-->>VM: Result
    VM-->>Staff: Success snackbar, redirect to student profile
    Note over SVC,UOS: Error paths translate to localized GraphQL errors and the transaction rolls back — missing email or password, parent or teacher not found, email exists, insufficient permissions, permission group missing
```

Machine-checkable copy: [onboarding.mmd](onboarding.mmd)
