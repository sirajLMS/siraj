# Parent Onboarding

Staff (admin or manager) with the `PARENTS_CREATE` permission create a new parent account from the dashboard page at `app/(dashboard)/parents/onboarding`, whose `withPageAuth` wrapper enforces the permission server-side. The page renders a mobile-or-desktop form (via `ParentOnboardingContainer` and `useParentOnboardingViewModel`) backed by react-hook-form and a Zod schema, capturing identity fields, contact info (phone, address, WhatsApp/Facebook/Twitter socials), billing configuration (invoice type, fee amount, currency), timezone, an optional avatar, and an optional initial payin payment method. On submit, `useCreateParentOnboarding` maps the form to a `ParentOnboardingInput` and calls the `createParent` GraphQL mutation (`backend/graphql/mutation/shared/onboarding.mutation.ts`), which applies auth + rate limiting and delegates to `ParentOnboardingService.createParent`. That service rides the shared `UserOnboardingService.createUserOfType` skeleton: a permission check and email-uniqueness pre-check, bcrypt password hashing, then a single DB transaction that inserts the `users` row, writes timezone (defaulting to UTC) / phone / display currency profile fields, inserts the `parents` extension row via `buildParentInsertPayload`, assigns the `PARENT_DEFAULT` permission group, and — when an initial payin method was provided — creates it inside the same transaction through `PaymentMethodService.createUserPaymentMethodInternal`. The whole flow is atomic: insufficient permission, a duplicate email, or any payment-method failure rolls everything back with a localized error surfaced in the form. After success the frontend evicts the `parentDirectory` Apollo cache entry, optionally persists a meeting config for the new user, and redirects to the new parent's profile.

The parents row created here is the linkage anchor for student onboarding: students are attached afterwards through the separate `createStudent` mutation / `StudentOnboardingService`, which takes a `parentId` and validates the parent exists before inserting the student row.

## Key sources

- `app/(dashboard)/parents/onboarding/page.tsx` — route entry; `withPageAuth([AppPermission.PARENTS_CREATE])`
- `frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer.tsx` — container with responsive view switch
- `frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel.ts` — form state, Zod schema, submit/success UX
- `frontend/common/hooks/useCreateParentOnboarding.ts` — mutation hook, input mapping, cache eviction, meeting config persist
- `backend/graphql/mutation/shared/onboarding.mutation.ts` — `createParent` GraphQL field
- `backend/services/parent/parent-onboarding.service.ts` — domain service orchestrating the shared skeleton
- `backend/services/user/user-onboarding.service.ts` — `createUserOfType` shared onboarding transaction skeleton
- `backend/services/parent/__shared__/buildParentInsertPayload.ts` — parents-row insert payload builder
- `backend/services/payment-method/payment-method.service.ts` — `createUserPaymentMethodInternal` for the initial payin method
- `backend/services/student/student-onboarding.service.ts` — later student ↔ parent linkage via `parentId`

## Diagram

```mermaid
%% Parent Onboarding — staff-driven parent creation: user + parents rows, PARENT_DEFAULT group, initial payin method
sequenceDiagram
    actor Staff
    participant Page as App Router page
    participant VM as useParentOnboardingViewModel
    participant Hook as useCreateParentOnboarding
    participant GQL as createParent mutation
    participant POS as ParentOnboardingService
    participant UOS as UserOnboardingService
    participant UR as UserRepository
    participant PR as ParentRepository
    participant PMR as PermissionManagementRepository
    participant PMS as PaymentMethodService
    participant DB as PostgreSQL

    Staff->>Page: GET /parents/onboarding
    Page->>Page: withPageAuth enforces PARENTS_CREATE
    Page-->>Staff: ParentOnboardingContainer renders mobile or desktop form
    Staff->>VM: Fill identity, contact, social, billing, initial payin method
    VM->>VM: Zod validation parentOnboardingSchema
    VM->>Hook: onSubmit formData
    Hook->>Hook: buildParentInput, reset parentOnboardingStore
    Hook->>GQL: createParent mutation ParentOnboardingInput
    GQL->>GQL: requireAuthWithRateLimit
    GQL->>POS: createParent(actorUserId, input, tErrors)
    POS->>UOS: createUserOfType shared onboarding skeleton
    UOS->>UOS: PermissionsService.hasPermission PARENTS_CREATE
    alt permission denied
        UOS-->>GQL: throw insufficientPermissions
    end
    UOS->>UR: existsByEmail pre-check
    UOS->>UOS: validateUserName + hashPassword bcrypt
    alt email already exists
        UOS-->>GQL: throw userEmailExists
    end
    UOS->>DB: begin transaction
    UOS->>UR: create users row
    UR->>DB: INSERT users with passwordHash
    UOS->>UR: updateTimezone given value or UTC, updateProfileFields phone + displayCurrency
    POS->>PR: createExtension via buildParentInsertPayload
    PR->>DB: INSERT parents status, nationality, address, socials, invoiceType, feeAmount, currency
    UOS->>PMR: bulkAssignUsersToGroup PARENT_DEFAULT
    PMR->>DB: permission group assignment rows
    alt initialPayinMethod present
        POS->>PMS: afterExtension createUserPaymentMethodInternal
        PMS->>DB: INSERT user_payment_methods + dispatch notification
    end
    UOS->>DB: commit transaction
    UOS-->>GQL: userId, parentId, status, invoiceType, currency
    GQL-->>Hook: CreateParentMutation result
    Hook->>Hook: evict parentDirectory cache, persistMeetingConfig, store result
    Hook-->>Staff: success toast then redirect via profileHrefForParent
    Note over PR,Staff: Students attach later via createStudent mutation with parentId — the parents row is the linkage anchor
```

Machine-checkable copy: [onboarding.mmd](./onboarding.mmd)
