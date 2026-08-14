# General User Creation Pattern

This document describes the "General User Creation" feature — a flow that allows staff to create users without assigning them to specialized groups (teacher, parent, student, manager). It covers the full stack from backend service through GraphQL mutation to frontend views.

## Overview

General user creation reuses the existing `createUserOfType` onboarding pipeline with a **null extension** pattern. The user is created with a permission group that is NOT one of the three specialized groups (student, teacher, parent). No extension row (teacher/parent/student profile) is created.

### Key Files

| Layer | File | Purpose |
|-------|------|---------|
| Shared | `shared/constants/specialized-groups.constants.ts` | `SPECIALIZED_GROUP_SLUGS`, `SPECIALIZED_GROUP_SLUG_SET`, `isSpecializedGroup()` |
| Backend Types | `backend/types/users/user.types.ts` | `GeneralUserCreateInput`, `GeneralUserCreateResult` |
| Backend Service | `backend/services/user/general-user-onboarding.service.ts` | `GeneralUserOnboardingService.createGeneralUser()` |
| Backend GraphQL | `backend/graphql/pothos/users/general-user-create.pothos.ts` | Pothos input + result types |
| Backend GraphQL | `backend/graphql/mutation/shared/general-user-create.mutation.ts` | `createGeneralUser` mutation |
| Frontend GraphQL | `frontend/common/graphql/sharedDocuments/users/general-user-create.documents.ts` | `createGeneralUserMutationDocument` |
| Frontend Schema | `frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema.ts` | Zod v4 schema factory |
| Frontend Hook | `frontend/common/hooks/useCreateGeneralUser.ts` | `useCreateGeneralUser` hook with cache eviction |
| Frontend Store | `frontend/common/stores/generalUserOnboardingStore.ts` | Simplified Zustand store (result only) |
| Frontend ViewModel | `frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel.ts` | ViewModel with react-hook-form + zodResolver |
| Frontend Shared | `frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.tsx` | Shared form body (tier-agnostic) |
| App Router | `app/(dashboard)/users/create/page.tsx` | Server component page |

## Backend: `createUserOfType` Null-Extension Pattern

`GeneralUserOnboardingService.createGeneralUser()` wraps `UserOnboardingService.createUserOfType<void>` — the generic parameter is `void` because no extension row is created.

```typescript
const result = await createUserOfType<void>({
  actorUserId,
  permission: AppPermission.STAFF_CREATE,
  coreInput: { name, email, password, avatarUrl: null },
  profileFields: { phone: input.phone },
  groupSlug: input.groupSlug,
  validatePassword: true,
  createExtension: async () => null,
  afterExtension: undefined,
  locale,
  tErrors: getServerTranslations(locale ?? "ar").errorsTranslations,
  logTag: "GeneralUser",
}, tx);
```

### Key points:
- **`createExtension: async () => null`** — returns `null` for `void` TExtension (no profile extension row)
- **`afterExtension: undefined`** — no post-extension callback needed
- **`groupSlug` type was widened** from `SystemPermissionGroupSlug` to `string` in `CreateUserOfTypeOptions` to support custom (non-system) group slugs. This is backward-compatible: `SystemPermissionGroupSlug` is a string enum.
- **`input.status` is honored** — after `createUserOfType` resolves, the service calls `UserRepository.updateStatus` if a non-default status was specified
- **`getServerTranslations(locale)` is synchronous** — returns `{ errorsTranslations: ErrorsLabels }` with no namespace parameter

## Specialized Group Filtering (`SPECIALIZED_GROUP_SLUGS`)

Defined in `shared/constants/specialized-groups.constants.ts` — available to both frontend and backend:

```typescript
export const SPECIALIZED_GROUP_SLUGS = [
  SystemPermissionGroupSlug.STUDENT_DEFAULT,
  SystemPermissionGroupSlug.TEACHER_DEFAULT,
  SystemPermissionGroupSlug.PARENT_DEFAULT,
] as const;

export const SPECIALIZED_GROUP_SLUG_SET: Set<string> = new Set(SPECIALIZED_GROUP_SLUGS);

export function isSpecializedGroup(slug: string): boolean {
  return SPECIALIZED_GROUP_SLUG_SET.has(slug);
}
```

### Usage:
- **Backend service**: `GeneralUserOnboardingService.createGeneralUser()` rejects specialized groups with a localized `specializedGroupNotAllowed` error before calling `createUserOfType`
- **Frontend**: The shared form component (`GeneralUserCreateShared`) filters the permission group dropdown using `SPECIALIZED_GROUP_SLUG_SET.has(slug)` to exclude specialized groups from the autocomplete options

The three specialized groups are student, teacher, parent — NOT staff or supervisor. Those are valid for general user creation.

## GraphQL Mutation Pattern

The `createGeneralUser` mutation uses:
- **`authScopes: { permission: AppPermission.STAFF_CREATE, notImpersonating: true }`** — requires staff create permission AND prevents creation while impersonating
- **Dynamic group slug** — `groupSlug` is a plain `String!` in GraphQL (not an enum), allowing any permission group slug
- **`requireAuth(ctx)`** for authentication, `ctx.locale` propagated to service for localized errors
- **Result type** includes `id` (resolved from `parent.user.id`) for Apollo cache normalization

```graphql
mutation CreateGeneralUser($input: GeneralUserCreateInput!) {
  createGeneralUser(input: $input) {
    id
    user { ...UserFields }
    assignedGroupSlug
  }
}
```

## Cache Eviction Pattern (Directory Queries)

When a general user is created, the Apollo cache must evict all directory queries so the new user appears in the correct directory tab. The `useCreateGeneralUser` hook evicts:

1. `cache.evict({ id: "ROOT_QUERY", fieldName: "users" })` — root users query
2. `cache.evict({ id: "ROOT_QUERY", fieldName: "teacherDirectory" })` — teacher directory
3. `cache.evict({ id: "ROOT_QUERY", fieldName: "managerDirectory" })` — manager directory
4. `cache.evict({ id: "ROOT_QUERY", fieldName: "parentDirectory" })` — parent directory
5. `cache.evict({ id: "ROOT_QUERY", fieldName: "studentDirectory" })` — student directory
6. `cache.gc()` — garbage collect orphaned entries

This ensures the new user appears in whichever directory tab is active, regardless of which group was assigned.

## Store Simplification Rationale

The Zustand store (`generalUserOnboardingStore`) was simplified during post-implementation review to only hold `result` — the submission state (`isSubmitting`, `error`) was removed because:

- **`useOnboardingSubmit`** (used by the ViewModel) tracks submission state independently
- **Apollo `loading`** from `useMutation` provides the same information
- Duplicating submission state in the store created drift risk — the store could desync from Apollo's actual loading state
- The `result` field is retained for potential post-create navigation

## Zod v4 Patterns

The Zod validation schema (`generalUserCreateSchema.ts`) uses Zod v4 patterns:

- **`z.enum(AccountStatus)`** — NOT `z.nativeEnum()`. Zod v4 accepts TypeScript enums directly. This matches the codebase convention across all schema files.
- **`z.email()` via pipe** — Zod v4 removed `z.string().email()`. Use the pipe pattern to separate empty-vs-format validation:
  ```typescript
  email: z.string().min(1, validationLabels.emailRequired)
    .pipe(z.email({ message: validationLabels.emailInvalid }))
  ```
- **`AccountStatus` from codegen** — imported from `@/frontend/common/graphql/generated/gql/graphql-types` (NOT `@/backend/enum`) for frontend schemas
- **Factory function pattern** — `generalUserCreateSchemaFactory(validationLabels)` accepts typed validation labels; the full `CreateUserLabels` i18n object is structurally compatible (supertype)

## Frontend View Architecture

The general user creation form follows the standard ViewModel + Shared scaffold pattern:

```
frontend/common/views/dashboard/users/createUser/
  useGeneralUserCreateViewModel.ts    # ViewModel hook
  GeneralUserCreateContainer.tsx       # Container (createLazyView + ResponsiveViewSwitch)
  __shared__/
    generalUserCreateShared.tsx        # Shared form body (tier-agnostic)
  schemas/
    generalUserCreateSchema.ts         # Zod schema factory
```

- **Mobile view**: `frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile.tsx`
- **Desktop view**: `frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop.tsx`
- Both tier views call `useGeneralUserCreateViewModel()` internally and pass tier-specific `options` to `GeneralUserCreateShared`
- The container does NOT call the ViewModel — it passes empty props `{}` to `ResponsiveViewSwitch`

## i18n Namespace

Translation namespace: `Translation.Dashboard.UsersCreateUser`

- **Type**: `CreateUserLabels` interface in `shared/locale/types/dashboard/users/createUser.ts` (23 string properties + nested `sections` object)
- **Client hook**: `useAppTranslation("Dashboard.UsersCreateUser")`
- **Server component**: `getTranslations(locale).dashboardTranslations.usersCreateUser`
- **All 4 registration files required**: `translation.ts`, `types/message.ts`, `en/messages.ts`, `ar/messages.ts`

## Testing Patterns

### Service Tests (`backend/services/user/test/general-user-onboarding.service.test.ts`)

8 test cases cover:
1. Successful creation with valid non-specialized group
2. Duplicate email rejection
3. Specialized group rejection (student, teacher, parent — via `for...of` loop)
4. Invalid group slug (group not found)
5. Permission check failure (lacks `STAFF_CREATE`)
6. Weak password rejection

**Key patterns**:
- `runInRollback` wrapper for DB-touching tests (successful creation only)
- `expectRejection` try/catch helper (NOT `rejects.toThrow()` — causes deadlocks in `runInRollback`)
- `setupServiceSpies()` centralized helper for spy mock setup (CodeScene dedup)
- `testRejection()` higher-order wrapper for rejection boilerplate (CodeScene dedup)
- `for...of` loop over `SPECIALIZED_SLUGS` array for parametric specialized group tests
- `tErrors` loaded once in `beforeAll` via `getServerTranslations("en").errorsTranslations`

### GraphQL Integration Tests (`frontend/common/graphql/test/users/general-user-create.test.ts`)

10 test cases cover:
1. Successful mutation with all fields
2. Successful mutation with minimal fields (optionals null)
3. Unauthorized (no token)
4. Forbidden (teacher without `STAFF_CREATE`)
5. Forbidden (parent without `STAFF_CREATE`)
6. Impersonation rejection
7-10. Missing required fields (name, email, password, groupSlug)

**Key patterns**:
- `setupTestServerLifecycle()` for dev server spawn/kill
- `provisionTestSuperAdmin` + `loginDemoUser("super_admin")` for auth setup
- `authenticatedRequest(token, "mutate", document, variables)` for authenticated calls
- `assertOperationDenied(roleGroup, "mutate", document, variables)` for auth tests
- `buildGeneralUserInput(overrides)` / `buildMinimalInput(name)` typed builders
- `isRecord(value)` type guard to satisfy `no-unsafe-type-assertion` lint rule
- `assertCreateResult()` shared assertions helper for dedup
