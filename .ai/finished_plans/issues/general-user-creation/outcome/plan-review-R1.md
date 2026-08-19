# Plan Review Round 1 — General User Creation

## Date: 2026-08-14
## Reviewer: Copilot (plan-review skill)

## Violations Found: 5 (2 HIGH, 3 LOW)

### 1. [HIGH] Shared layer import violation
- **File**: `shared/constants/specialized-groups.constants.ts` (Task 1.1)
- **Rule**: `shared/AGENTS.md` — shared layer MUST NEVER import from `@/backend/**`
- **Plan had**: `import { SystemPermissionGroupSlug } from "@/backend/enum"`
- **Fix**: Import from `@/shared/constants/permission-group.enum` (same file already exists in shared layer)
- **Status**: FIXED in tasks.md

### 2. [HIGH] withPageAuth signature mismatch
- **File**: `app/(dashboard)/users/create/page.tsx` (Task 15.1)
- **Rule**: `withPageAuth` signature is `(permissions, handler)` where handler receives `(auth, props)` — NOT `({ locale })`
- **Plan had**: `withPageAuth([AppPermission.STAFF_CREATE], async ({ locale }) => { ... })`
- **Fix**: `withPageAuth([AppPermission.STAFF_CREATE], async () => { return <GeneralUserCreateContainer />; })`
- **Status**: FIXED in tasks.md

### 3. [MEDIUM] Service i18n pattern
- **File**: `backend/services/user/general-user-onboarding.service.ts` (Task 3.1)
- **Rule**: Services must use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql`
- **Plan had**: Method receiving `tErrors` as parameter from resolver
- **Fix**: Service calls `getServerTranslations(locale, "dashboard.users.createUser")` directly for localized errors
- **Status**: FIXED in tasks.md

### 4. [MEDIUM] i18n namespace registration steps
- **File**: Multiple i18n files (Task 6)
- **Rule**: `shared/AGENTS.md` requires namespace registration via `defineNamespace` pattern with lazy imports
- **Plan had**: Referenced `lazyload()` helper and `shared/locale/en/messages.ts` which don't exist
- **Fix**: Updated to use `defineNamespace<CreateUserLabels>("dashboard.users.createUser", { load: { en: ..., ar: ... } })` pattern matching existing `directory.namespace.ts`
- **Status**: FIXED in tasks.md

### 5. [LOW] Enum value usage in shared constants
- **File**: `shared/constants/specialized-groups.constants.ts` (Task 1.1)
- **Rule**: Use enum members, not raw string literals
- **Plan had**: `["student_default", "teacher_default", "parent_default"]`
- **Fix**: `[SystemPermissionGroupSlug.STUDENT_DEFAULT, ...]` from `@/shared/constants/permission-group.enum`
- **Status**: FIXED in tasks.md

## Verdict: Plan PASSES after fixes (all 5 violations resolved)
