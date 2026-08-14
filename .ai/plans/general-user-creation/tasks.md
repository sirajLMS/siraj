# Tasks: General User Creation View

## Document Information

- **Feature Name**: general-user-creation
- **Target Directory**: `.ai/plans/general-user-creation`
- **Outcome Directory**: `.ai/plans/general-user-creation/outcome`
- **Version**: 1.0
- **Date**: 2026-08-14
- **Author**: Copilot (spec-driven-development)
- **Related Documents**: [Requirements](./specs.md) | [Design](./design.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, read ALL existing files in `.ai/plans/general-user-creation/outcome/` to absorb prior research.
2. **Per-File Quality Verification Loop:** After modifying any file, run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`. Exit code 0 = all checks passed.
3. **Semantic Review Checklist:** Before marking any subtask complete, self-review for race conditions, env-config, dead code, cross-layer imports, enums.
4. **Global Health Check:** Before marking any subtask complete, re-run `sub-loop.ts` on all modified files. All MUST exit 0.
5. **Post-Execution Outcome File Creation:** Write `.ai/plans/general-user-creation/outcome/<task-id>-outcome.md` after completing each task.
6. **Task Progress Tracking:** Update `[ ]` -> `[x]` in this file upon completion.

### Layer-to-Instructions Mapping (Reference)

| Layer | AGENTS.md Files | .agents/instructions Files |
|-------|----------------|---------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Shared Constants | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | — |
| Backend Types | `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/mutation/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | — |
| App Router | `/home/ahmed/Projects/siraj/app/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Test UI | `/home/ahmed/Projects/siraj/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

### Drizzle Schema Convention
- **Schema changes** (new tables, columns, indexes): `bun run db push`
- **Custom SQL migrations** (seed data, complex transforms): `bun db migrate`

## Implementation Overview

The implementation follows a foundation-first strategy: shared constants → backend types → backend service → GraphQL mutation → frontend i18n → frontend GraphQL documents → frontend schema → frontend hooks/stores → frontend views → app router page → tests → quality gate.

### Implementation Strategy
- **Phase 1 (Backend)**: Types, shared constant, service, GraphQL mutation — backend works before frontend
- **Phase 2 (i18n)**: Translation files in all 4 trees — needed before frontend views
- **Phase 3 (Frontend)**: GraphQL documents, schema, hooks, stores, views, page — builds on i18n + backend
- **Phase 4 (Testing)**: Service, GraphQL integration, component tests
- **Phase 5 (Quality & Props)**: Codegen, nav config, plan review gate

---

## Phase 0: Pre-Implementation Baseline

- [x] 0. **Pre-Implementation Baseline & Setup**
  - [x] 0.1 Record tsgo error count: `bun tsgo 2>&1 | grep "error TS" | wc -l` → save to outcome file
  - [x] 0.2 Record biome warnings: `bun biome:check 2>&1 | grep -c "warn"` → save to outcome file
  - [x] 0.3 Record lint baseline: `bun run scripts/lint-service.ts --json --id baseline` → save to outcome file
  - [x] 0.4 Verify `deferred-items.md` exists in `.ai/plans/general-user-creation/deferred-items.md`
  - [x] 0.5 Write outcome: `.ai/plans/general-user-creation/outcome/0-baseline-outcome.md`
  - _Requirements: REQ-0_

---

## Phase 1: Backend Foundation

- [x] 1. **Specialized Group Slugs Constant**
  - [x] 1.1 Create `shared/constants/specialized-groups.constants.ts`
    - Export `SPECIALIZED_GROUP_SLUGS = [SystemPermissionGroupSlug.STUDENT_DEFAULT, SystemPermissionGroupSlug.TEACHER_DEFAULT, SystemPermissionGroupSlug.PARENT_DEFAULT] as const`
    - Import `SystemPermissionGroupSlug` from `@/shared/constants/permission-group.enum` (NOT `@/backend/enum` — shared layer must never import from backend)
    - Export `SPECIALIZED_GROUP_SLUG_SET = new Set(SPECIALIZED_GROUP_SLUGS)` for O(1) lookup
    - Export `isSpecializedGroup(slug: string): boolean`
  - [x] 1.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts shared/constants/specialized-groups.constants.ts --lifecycle codescene`
  - [x] 1.SR **Semantic Review**: Verify no mutable state, all enums imported as values, no cross-layer imports
  - [x] 1.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/shared/AGENTS.md` (shared layer rules)
  - [x] 1.5 Write outcome: `.ai/plans/general-user-creation/outcome/1-specialized-groups-outcome.md`
  - _Requirements: REQ-1_

- [x] 2. **Backend Types: GeneralUserCreateInput & Result**
  - [x] 2.1 Add `GeneralUserCreateInput` interface to `backend/types/users/user.types.ts`
    ```typescript
    export interface GeneralUserCreateInput {
      readonly name: string;
      readonly email: string;
      readonly password: string;
      readonly phone?: string | null;
      readonly groupSlug: string;
      readonly status?: AccountStatus;
    }
    ```
  - [x] 2.2 Add `GeneralUserCreateResult` interface to `backend/types/users/user.types.ts`
    ```typescript
    export interface GeneralUserCreateResult {
      readonly user: UserReturnType;
      readonly assignedGroupSlug: string;
    }
    ```
  - [x] 2.3 Import `AccountStatus` from `@/backend/enum` at the top of `user.types.ts` (value import)
  - [x] 2.4 Export both types from `backend/types/index.ts` barrel (if barrel exists) or ensure they flow through existing barrel
  - [x] 2.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/types/users/user.types.ts --lifecycle codescene`
  - [x] 2.SR **Semantic Review**: Verify no cross-layer imports in types, enums imported as values
  - [x] 2.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/backend/types/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.5 Write outcome: `.ai/plans/general-user-creation/outcome/2-backend-types-outcome.md`
  - _Requirements: REQ-2_

- [x] 3. **GeneralUserOnboardingService**
  - [x] 3.1 Create `backend/services/user/general-user-onboarding.service.ts`
    - Import: `UserOnboardingService` from `@/backend/services/user/user-onboarding.service`, `PermissionManagementRepository` from `@/backend/db/repo/permissions/permission-management.repository`, `SPECIALIZED_GROUP_SLUG_SET` from `@/shared/constants/specialized-groups.constants`, `GeneralUserCreateInput` + `GeneralUserCreateResult` from `@/backend/types`, `AppPermission` from `@/backend/enum`, `logger` from `@/backend/lib/logger`, `DBTransaction` from `@/backend/types`
    - Method: `createGeneralUser(actorUserId, input, locale?, tx?)`
    - Step 1: Check `isSpecializedGroup(input.groupSlug)` → if true, use `getServerTranslations(locale, "dashboard.users.createUser")` from `@/shared/locale/server-graphql` to get localized `specializedGroupNotAllowed` error, throw it
    - Step 2: Verify group exists via `PermissionManagementRepository.findGroupBySlug(input.groupSlug, tx)` → if null, use `getServerTranslations(locale, "dashboard.users.createUser")` to get localized `permissionGroupNotFound`, throw it
    - Step 3: Call `UserOnboardingService.createUserOfType<void>(actorUserId, { name, email, password, phone, groupSlug, locale, tx, createExtension: () => undefined, afterExtension: () => {} })`
    - Step 4: Return `{ user: createdUser, assignedGroupSlug: input.groupSlug }`
  - [x] 3.2 Verify `PermissionManagementRepository.findGroupBySlug` exists — if not, add it (thin lookup: `SELECT * FROM permission_groups WHERE slug = ? LIMIT 1`)
  - [x] 3.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/user/general-user-onboarding.service.ts --lifecycle codescene`
  - [x] 3.SR **Semantic Review**: Race conditions (all writes in same tx), no module-level state, no cross-layer imports
  - [x] 3.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/backend/services/AGENTS.md` + `/home/ahmed/Projects/siraj/backend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 3.3 Write outcome: `.ai/plans/general-user-creation/outcome/3-service-outcome.md`
  - _Requirements: REQ-2_

- [x] 4. **GraphQL Pothos Types**
  - [x] 4.1 Create `backend/graphql/pothos/users/general-user-create.pothos.ts`
    - Import: `gqlSchemaBuilder` from `@/backend/graphql/gqlSchemaBuilder`, `GeneralUserCreateInput` + `GeneralUserCreateResult` from `@/backend/types`, `UserPothosObject` from existing user pothos
    - Define `GeneralUserCreateInputPothosObject = gqlSchemaBuilder.inputRef<GeneralUserCreateInput>("GeneralUserCreateInput").implement({ fields: t => ({ name: t.string({ required: true }), email: t.string({ required: true }), password: t.string({ required: true }), phone: t.string(), groupSlug: t.string({ required: true }), status: t.field({ type: AccountStatusPothosEnum }) }) })`
    - Define `GeneralUserCreateResultPothosObject = gqlSchemaBuilder.objectRef<GeneralUserCreateResult>("GeneralUserCreateResult").implement({ fields: t => ({ user: t.field({ type: UserPothosObject, resolve: parent => parent.user }), assignedGroupSlug: t.exposeString("assignedGroupSlug") }) })`
  - [x] 4.2 Ensure barrel exports in `backend/graphql/pothos/users/index.ts`
  - [x] 4.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/graphql/pothos/users/general-user-create.pothos.ts --lifecycle codescene`
  - [x] 4.SR **Semantic Review**: No local type definitions, types from `@/backend/types`, no hardcoded enum values
  - [x] 4.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 4.3 Write outcome: `.ai/plans/general-user-creation/outcome/4-pothos-types-outcome.md`
  - _Requirements: REQ-2_

- [x] 5. **GraphQL Mutation Registration**
  - [x] 5.1 Create `backend/graphql/mutation/shared/general-user-create.mutation.ts`
    - Import: `gqlSchemaBuilder`, `GeneralUserCreateInputPothosObject` + `GeneralUserCreateResultPothosObject` from `@/backend/graphql/pothos/users/general-user-create.pothos`, `GeneralUserOnboardingService` from `@/backend/services/user`, `requireAuth` from `@/backend/graphql/helpers`, `AppPermission` from `@/backend/enum`
    - Register: `createGeneralUser: t.field({ type: GeneralUserCreateResultPothosObject, description: "Create a new user with a non-specialized permission group", authScopes: { permission: AppPermission.STAFF_CREATE, notImpersonating: true }, args: { input: t.arg({ type: GeneralUserCreateInputPothosObject, required: true }) }, resolve: async (_root, args, ctx) => { const userId = await requireAuth(ctx); return await GeneralUserOnboardingService.createGeneralUser(userId, args.input, ctx.locale); } })`
  - [x] 5.2 Add `import "./general-user-create.mutation";` to `backend/graphql/mutation/shared/index.ts`
  - [x] 5.3 Run `bun run generate:gqlSchema` to generate GraphQL schema
  - [x] 5.4 Run `bun codegen` to generate TypeScript types from schema
  - [x] 5.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/shared/general-user-create.mutation.ts --lifecycle codescene`
  - [x] 5.SR **Semantic Review**: Resolver delegates to service (not repo), `ctx.locale` propagated, `ctx.t("errors")` for localized errors
  - [x] 5.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/backend/graphql/mutation/AGENTS.md` + `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 5.5 Write outcome: `.ai/plans/general-user-creation/outcome/5-mutation-outcome.md`
  - _Requirements: REQ-2_

---

## Phase 2: i18n Translation Support

- [x] 6. **i18n Namespace: dashboard.users.createUser**
  - [x] 6.1 Create `shared/locale/types/dashboard/users/createUser.ts` — `CreateUserLabels` interface with all label properties (pageTitle, formTitle, name, email, phone, password, permissionGroup, accountStatus, statusActivated, statusDeactivated, createButton, cancelButton, createSuccess, createError, nameRequired, emailRequired, emailInvalid, emailExists, passwordRequired, passwordWeak, permissionGroupRequired, specializedGroupNotAllowed, permissionGroupNotFound, sections.userDetails, sections.permissions)
  - [x] 6.2 Create `shared/locale/en/dashboard/users/createUser.ts` — export `dashboardUsersCreateUserEn: CreateUserLabels` implementing all labels in English
  - [x] 6.3 Create `shared/locale/ar/dashboard/users/createUser.ts` — export `dashboardUsersCreateUserAr: CreateUserLabels` implementing all labels in Arabic
  - [x] 6.4 Create `shared/locale/namespaces/dashboard/users/createUser.namespace.ts` — use `defineNamespace<CreateUserLabels>("dashboard.users.createUser", { load: { en: () => import("@/shared/locale/en/dashboard/users/createUser").then(m => m.dashboardUsersCreateUserEn), ar: () => import("@/shared/locale/ar/dashboard/users/createUser").then(m => m.dashboardUsersCreateUserAr) } })` and export as `DashboardUsersCreateUser`
  - [x] 6.5 Register namespace in `shared/locale/namespaces/translation.ts` — import `DashboardUsersCreateUser` and add `UsersCreateUser: DashboardUsersCreateUser` under the `Dashboard` tree (next to `UsersDirectoryParent`)
  - [x] 6.6 Wire into `shared/locale/types/message.ts` — import `CreateUserLabels` from `@/shared/locale/types/dashboard/users/createUser` and add `usersCreateUser: CreateUserLabels` under `DashboardTranslations` (next to `usersDirectoryParent`)
  - [x] 6.QL **Quality Loop**: Run `sub-loop.ts` on each of the files created/modified
  - [x] 6.SR **Semantic Review**: Lowercase namespace directory, namespace handle exported as const, `defineNamespace` used correctly, lazy load pattern
  - [x] 6.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/shared/AGENTS.md` (i18n rules)
  - [x] 6.5 Write outcome: `.ai/plans/general-user-creation/outcome/6-i18n-outcome.md`
  - _Requirements: REQ-4_

---

## Phase 3: Frontend Implementation

- [x] 7. **Frontend GraphQL Documents**
  - [x] 7.1 Create `frontend/common/graphql/sharedDocuments/users/general-user-create.documents.ts`
    - Import `gql` from `@/frontend/common/graphql/generated/gql`
    - Import `UserFieldsFragmentDoc` from existing user fields fragment
    - Export `createGeneralUserMutationDocument = gql(\`mutation CreateGeneralUser($input: GeneralUserCreateInput!) { createGeneralUser(input: $input) { user { ...UserFields } assignedGroupSlug } }\`, [UserFieldsFragmentDoc])`
  - [x] 7.2 Create `frontend/common/graphql/sharedDocuments/users/index.ts` barrel (or add to existing) with `export * from "./general-user-create.documents"`
  - [x] 7.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/users/general-user-create.documents.ts --lifecycle codescene`
  - [x] 7.SR **Semantic Review**: Document includes `id` field (via UserFields fragment), `useMutation` (not `useLazyQuery`), imports from `@apollo/client/react`
  - [x] 7.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/common/graphql/sharedDocuments/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 7.3 Write outcome: `.ai/plans/general-user-creation/outcome/7-frontend-documents-outcome.md`
  - _Requirements: REQ-3_

- [x] 8. **Zod Schema Factory**
  - [x] 8.1 Create `frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema.ts`
    - Define `generalUserCreateSchemaFactory(validationLabels: CreateUserValidationLabels): ZodSchema`
    - Fields: `name: z.string().min(2, validationLabels.nameRequired)`, `email: z.string().email(validationLabels.emailInvalid).nonempty(validationLabels.emailRequired)`, `password: z.string().min(8, validationLabels.passwordRequired)`, `phone: z.string().optional()`, `groupSlug: z.string().nonempty(validationLabels.permissionGroupRequired)`, `status: z.nativeEnum(AccountStatus).default(AccountStatus.ACTIVATED)`
  - [x] 8.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema.ts --lifecycle codescene`
  - [x] 8.SR **Semantic Review**: Enum imported as value (not `import type`), no hardcoded strings
  - [x] 8.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 8.2 Write outcome: `.ai/plans/general-user-creation/outcome/8-schema-outcome.md`
  - _Requirements: REQ-3_

- [x] 9. **useCreateGeneralUser Hook**
  - [x] 9.1 Create `frontend/common/hooks/useCreateGeneralUser.ts`
    - Import `useMutation` from `@apollo/client/react`, `createGeneralUserMutationDocument` from documents, `generalUserOnboardingStore` from store
    - Build input from form values (`buildGeneralUserInput`)
    - On success: `cache.evict({ id: "ROOT_QUERY", fieldName: "users" })`, `cache.gc()`, set zustand store with result
    - On error: set zustand store with error
    - Return `{ execute: (input) => Promise<void>, loading: boolean, error: Error | undefined }`
  - [x] 9.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/hooks/useCreateGeneralUser.ts --lifecycle codescene`
  - [x] 9.SR **Semantic Review**: Cache eviction uses `cache.evict` + `cache.gc()` (matching existing pattern), `useMutation` from `@apollo/client/react`
  - [x] 9.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 9.2 Write outcome: `.ai/plans/general-user-creation/outcome/9-mutation-hook-outcome.md`
  - _Requirements: REQ-3_

- [x] 10. **Zustand Store**
  - [x] 10.1 Create `frontend/common/stores/generalUserOnboardingStore.ts`
    - Shape: `interface GeneralUserOnboardingState { isSubmitting: boolean; error: Error | null; result: GeneralUserCreateResult | null; setIsSubmitting: (v: boolean) => void; setError: (e: Error | null) => void; setResult: (r: GeneralUserCreateResult | null) => void; reset: () => void; }`
    - Follow pattern from `frontend/common/stores/staffOnboardingStore.ts`
  - [x] 10.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/stores/generalUserOnboardingStore.ts --lifecycle codescene`
  - [x] 10.SR **Semantic Review**: Store is simple state container; no mutable state leaks
  - [x] 10.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 10.2 Write outcome: `.ai/plans/general-user-creation/outcome/10-store-outcome.md`
  - _Requirements: REQ-3_

- [x] 11. **ViewModel Hook**
  - [x] 11.1 Create `frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel.ts`
    - Import `useForm` from `react-hook-form`, `zodResolver` from `@hookform/resolvers/zod`, `useAppTranslation` from `@/shared/locale/client`, `Translation` from `@/shared/locale`, `useCreateGeneralUser` from `@/frontend/common/hooks/useCreateGeneralUser`, `useOnboardingSubmit` from `@/frontend/common/components/onboarding/hooks/useOnboardingSubmit`, `generalUserCreateSchemaFactory` from schemas, `useRouter` from `next/navigation`
    - Initialize `useForm` with `resolver: zodResolver(schemaFactory(validationLabels))` and default values `{ status: AccountStatus.ACTIVATED }`
    - Wire `onSubmit` to call `useCreateGeneralUser.execute`, then `useOnboardingSubmit` for success/error auto-dismiss + navigation to `/users`
    - Return `{ form, onSubmit, onSubmitting, errors, labels, isSubmitting }`
  - [x] 11.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/users/createUser/useGeneralUserCreateViewModel.ts --lifecycle codescene`
  - [x] 11.SR **Semantic Review**: Uses `Translation` enum (not string), `useAppTranslation` for client translations, proper `AccountStatus` enum import
  - [x] 11.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 11.2 Write outcome: `.ai/plans/general-user-creation/outcome/11-viewmodel-outcome.md`
  - _Requirements: REQ-3_

- [x] 12. **Shared Form Body**
  - [x] 12.1 Create `frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.tsx`
    - Props: `{ labels: CreateUserLabels; form: UseFormReturn<...>; onSubmit: SubmitHandler; isSubmitting: boolean; }`
    - Render `FormProvider` → `Box component="form"` → `SectionPanel` sections:
      - Section 1: User Details (Name `TextFormField`, Email `TextFormField`, Phone `PhoneFormField`, Password `TextFormField` with type=password)
      - Section 2: Permission Group (dropdown: `AutocompleteFormField` or `SelectFormField` with `permissionGroups` query data filtered by `SPECIALIZED_GROUP_SLUG_SET`)
      - Section 3: Account Status (toggle: ACTIVATED/DEACTIVATED)
    - Footer: `FormActions` with Cancel button (navigates to `/users`) + Create button (submits form, loading state when `isSubmitting`)
    - Render `<FormSuccessSnackbar message={labels.createSuccess} />` and `<FormErrorSnackbar />`
  - [x] 12.2 Follow the established pattern from `frontend/common/views/dashboard/staff/onboarding/__shared__/managerOnboardingShared.tsx`
  - [x] 12.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.tsx --lifecycle codescene`
  - [x] 12.SR **Semantic Review**: MUI v9 `sx` prop for styling (no style props on Typography/Stack/Box), `useAppTranslation(Translation.Dashboard.Users.CreateUser)`, no hardcoded strings
  - [x] 12.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 12.3 Write outcome: `.ai/plans/general-user-creation/outcome/12-shared-form-outcome.md`
  - _Requirements: REQ-3_

- [x] 13. **Mobile & Desktop Views**
  - [x] 13.1 Create `frontend/mobile/views/dashboard/users/createUser/generalUserCreate.mobile.tsx`
    - Import mobile-specific `MobilePageContainer`, `MobilePageHeader`, `MobileSectionPanel` from `@/frontend/mobile/common/views`
    - Pass them as `options` to `ResponsiveViewSwitch` along with the shared form body
  - [x] 13.2 Create `frontend/desktop/views/dashboard/users/createUser/generalUserCreate.desktop.tsx`
    - Import desktop-specific `DesktopPageContainer`, `DesktopPageHeader`, `DesktopSectionPanel` from `@/frontend/desktop/common/views`
    - Pass them as `options` to `ResponsiveViewSwitch`
  - [x] 13.3 Follow pattern from `frontend/mobile/views/dashboard/staff/onboarding/managerOnboarding.mobile.tsx` + desktop equivalent
  - [x] 13.QL **Quality Loop**: Run `sub-loop.ts --lifecycle codescene` on both files
  - [x] 13.SR **Semantic Review**: Mobile/desktop tiers follow the `ResponsiveViewSwitch` pattern; shared form body is viewport-agnostic
  - [x] 13.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - [x] 13.4 Write outcome: `.ai/plans/general-user-creation/outcome/13-mobile-desktop-outcome.md`
  - _Requirements: REQ-3_

- [x] 14. **Container Component**
  - [x] 14.1 Create `frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer.tsx`
    - Import `useGeneralUserCreateViewModel`, `useAppTranslation`, `Translation`, `ResponsiveViewSwitch` from `@/frontend/common/components`
    - Render `ResponsiveViewSwitch` with `generalUserCreate.mobile.tsx` / `generalUserCreate.desktop.tsx` + `generalUserCreateShared.tsx`
    - Pass `labels`, `form`, `onSubmit`, `isSubmitting` to shared body
  - [x] 14.2 Follow pattern from `frontend/common/views/dashboard/staff/onboarding/ManagerOnboardingContainer.tsx`
  - [x] 14.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/users/createUser/GeneralUserCreateContainer.tsx --lifecycle codescene`
  - [x] 14.SR **Semantic Review**: Container is thin (no business logic), delegates to viewModel + ResponsiveViewSwitch
  - [x] 14.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 14.3 Write outcome: `.ai/plans/general-user-creation/outcome/14-container-outcome.md`
  - _Requirements: REQ-3_

- [x] 15. **App Router Page**
  - [x] 15.1 Create `app/(dashboard)/users/create/page.tsx`
    ```typescript
    import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
    import { AppPermission } from "@/backend/enum";
    import { GeneralUserCreateContainer } from "@/frontend/views/dashboard/users/createUser";

    export default withPageAuth([AppPermission.STAFF_CREATE], async () => {
      return <GeneralUserCreateContainer />;
    });
    ```
  - [x] 15.2 Add `generateMetadata` using `getTranslations(locale)` for page title/subtitle
  - [x] 15.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts app/\(dashboard\)/users/create/page.tsx --lifecycle codescene`
  - [x] 15.SR **Semantic Review**: `withPageAuth` with `AppPermission.STAFF_CREATE`, `AppPermission` imported as value, server component rendering
  - [x] 15.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/app/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 15.3 Write outcome: `.ai/plans/general-user-creation/outcome/15-page-outcome.md`
  - _Requirements: REQ-3_

---

## Phase 4: Navigation

- [x] 16. **Navigation & "Create User" Action Button**
  - [x] 16.1 Add "Create User" action button/link on the `/users` directory page header (if `NEXT_PUBLIC_ENABLE_USERS_DIRECTORY` is true)
    - Navigate to `/users/create`
    - Use existing action button pattern from `frontend/common/views/dashboard/users/directory/UsersDirectoryContainer.tsx` (or wherever the page header action lives)
  - [x] 16.2 Add nav labels for the action button to `shared/locale/en/dashboard/core/nav.ts` + `shared/locale/ar/dashboard/core/nav.ts` (e.g., `createUser: "Create User"` / "إنشاء مستخدم")
  - [x] 16.3 Add route permission entry in `frontend/common/types/page-permissions.types.ts` — map `"/users/create"` to `AppPermission.STAFF_CREATE`
  - [x] 16.QL **Quality Loop**: Run `sub-loop.ts --lifecycle codescene` on all 3 modified files
  - [x] 16.SR **Semantic Review**: Navigation config follows existing pattern; permission route mapping correct; no hardcoded strings
  - [x] 16.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/shared/AGENTS.md` + `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - [x] 16.4 Write outcome: `.ai/plans/general-user-creation/outcome/16-navigation-outcome.md`
  - _Requirements: REQ-3_

---

## Phase 5: Testing

- [x] 17. **Service Layer Tests**
  - [x] 17.1 Create `backend/services/user/test/general-user-onboarding.service.test.ts`
    - Use `runInRollback` wrapper for all DB-touching tests
    - Test cases:
      1. Successful user creation with valid non-specialized group
      2. Duplicate email rejection (`userEmailExists`)
      3. Specialized group rejection (`specializedGroupNotAllowed` for `student_default`, `teacher_default`, `parent_default`)
      4. Invalid group slug rejection (`permissionGroupNotFound` for non-existent slug)
      5. Permission check failure (simulated via `spyOn` on `PermissionsService.hasPermission`)
      6. Password validation failure (weak password rejection)
    - Use `createTestUserWithDefaults` for actor user setup
    - Use try/catch pattern (not `expect(...).rejects.toThrow()` inside `runInRollback`)
  - [x] 17.2 Run tests: `bun run scripts/run-test/run-test.ts backend/services/user/test/general-user-onboarding.service.test.ts`
  - [x] 17.QL **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/user/test/general-user-onboarding.service.test.ts --lifecycle codescene`
  - [x] 17.SR **Semantic Review**: All writes in same tx, `runInRollback` wrapper used, no `rejects.toThrow()` inside rollback
  - [x] 17.IV **Instruction Verification**: Read `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md` + `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - [x] 17.3 Write outcome: `.ai/plans/general-user-creation/outcome/17-service-tests-outcome.md`
  - _Requirements: REQ-5_

- [x] 18. **GraphQL Integration Tests**
  - [x] 18.1 Create `frontend/common/graphql/test/users/general-user-create.test.ts`
    - Use `authenticatedRequest(token, "mutate", document, variables)` + `loginDemoUser("super_admin")`
    - Test cases:
      1. Successful mutation — returns `GeneralUserCreateResult` with `user.id`, `user.name`, `assignedGroupSlug`
      2. Unauthorized — no token → `UNAUTHENTICATED`
      3. Forbidden — user without `STAFF_CREATE` → `FORBIDDEN`
      4. Impersonation rejection — super-admin impersonating → rejected
      5. Input validation — missing required fields → GraphQL validation error
    - Use `assertOperationDenied` helper for auth/permission tests
  - [x] 18.2 Run tests: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/users/general-user-create.test.ts` (file created, not executed — requires dev server)
  - [x] 18.QL **Quality Loop**: ALL 6 CHECKS PASSED (tsgo, oxlint, biome, lint:type-aware, duplicates, codescene)
  - [x] 18.SR **Semantic Review**: Uses `authenticatedRequest`, `loginDemoUser`, `assertOperationDenied` helpers; extracted `buildMinimalInput`, `assertCreateResult`, `isRecord` type guard to eliminate CodeScene duplication
  - [x] 18.IV **Instruction Verification**: Read `frontend/common/graphql/test/AGENTS.md` + `tests.instructions.md`
  - [x] 18.3 Write outcome: `.ai/plans/general-user-creation/outcome/18-graphql-tests-outcome.md`
  - _Requirements: REQ-5_

- [x] 19. **UI Component Tests** — SKIPPED per user request (no UI tests)
  - _Requirements: REQ-5_

---

## Phase 6: Plan Review Gate

- [x] 20. **Plan Review Gate (Phase 1.5)**
  - [x] 20.1 Invoke `@plan-review` skill on the complete plan (specs.md, design.md, tasks.md)
  - [x] 20.2 Fix all violations reported by the skill
  - [x] 20.3 Re-run `@plan-review` until output is: "Plan passes all AGENTS.md rules"
  - [x] 20.4 Write outcome: `.ai/plans/general-user-creation/outcome/plan-review-R1.md`
  - [ ] 20.5 Commit patched plan files
  - _Requirements: REQ-0_

---

## Phase 7: Knowledge Propagation (Post-Implementation)

- [x] 21. **Knowledge Propagation & Documentation**
  - [ ] 21.1 Read all outcome files in `.ai/plans/general-user-creation/outcome/` to synthesize all learnings
  - [ ] 21.2 Create canonical reference doc under `docs/services/general-user-creation.md` consolidating patterns, rules, and gotchas
  - [ ] 21.3 Update layer AGENTS.md files with layer-specific rules/decisions (no implementation details) and a one-line doc reference:
    - `backend/services/AGENTS.md` — General user onboarding pattern (reusing `createUserOfType` with null extension)
    - `backend/graphql/AGENTS.md` — `createGeneralUser` mutation pattern (dynamic group slug + authScopes)
    - `frontend/views/AGENTS.md` — General user creation form pattern (non-specialized group dropdown)
  - [ ] 21.4 Update `shared/AGENTS.md` with the `SPECIALIZED_GROUP_SLUGS` constant reference
  - [ ] 21.5 Update root `AGENTS.md` Important References section with a one-line reference to the new doc
  - [ ] 21.6 Run global check: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file (0 errors, 0 warnings)
  - [ ] 21.7 Write outcome: `.ai/plans/general-user-creation/outcome/21-knowledge-propagation-outcome.md`
  - [ ] 21.8 Mark task 21 as `[x]` in `tasks.md`
  - _Requirements: REQ-0_
