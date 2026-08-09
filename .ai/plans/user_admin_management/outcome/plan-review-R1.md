# Plan Review: Super Admin User Entity Management (Status + Password Reset)

## Review Summary
**Status**: ❌ **Plan has violations that must be fixed before implementation**

## Violations Found

### 1. Database Migration Convention Violation
**Layer**: Backend DB/Schema
**File**: Task 1.1 - `backend/db/migration/XX-user-admin-reset-password.sql`
**Rule**: Drizzle schema changes use `bun run db push`; custom SQL migrations use `bun db migrate`
**Issue**: Plan says "Run migration: `bun run db push`" for a custom SQL migration file
**Fix**: Change to "Run migration: `bun db migrate`" or use `bun run db push` if this is a schema change (but it's a data/permission migration, so `bun db migrate` is correct)

### 2. Pothos Enum Registration Check Required
**Layer**: Backend GraphQL/Pothos
**File**: Task 3.1 - `backend/graphql/pothos/profile/profile.pothos.ts`
**Rule**: All GraphQL enums MUST be registered in `backend/graphql/pothos/shared/enum.pothos.ts` first
**Issue**: Plan adds `status` field using `AccountStatusPothosObject` - must verify `AccountStatus` enum is already registered in `shared/enum.pothos.ts`. If not, must register it there first.
**Action**: Verify `AccountStatusPothosEnum` exists in `shared/enum.pothos.ts` before implementing Task 3.1

### 3. GraphQL Resolver Localization Pattern Violation
**Layer**: Backend GraphQL Mutation
**File**: Task 5.1 - `backend/graphql/mutation/auth/admin-password.mutation.ts`
**Rule**: Resolvers must use `ctx.t("namespace")` for localized errors, NOT `getServerTranslations`
**Issue**: Plan shows resolver calling `AuthPasswordService.adminResetPassword()` which uses `getServerTranslations` internally. The resolver itself should extract `ctx.t()` and pass locale, but the service should use `getServerTranslations(locale, "namespace")` which is correct for services. However, the resolver should handle GraphQL-specific errors via `ctx.t()`.
**Clarification**: Services use `getServerTranslations(locale, "namespace")` - this is correct per `backend/services/AGENTS.md`. Resolvers use `ctx.t("namespace")` for errors thrown directly in resolver. The plan is correct here.

### 4. Frontend MUI v9 Compliance
**Layer**: Frontend
**Files**: Task 7.2 (`ResetPasswordDialog.tsx`), Tasks 8.1-8.5 (admin sections)
**Rule**: Style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, etc.) are NOT valid direct props on MUI components - must use `sx` prop
**Issue**: Plan doesn't explicitly mention using `sx` prop for styling
**Fix**: All MUI components in new files must use `sx` for styling (e.g., `<DialogContent sx={{ pt: 0 }}>`, `<TextField sx={{ mb: 2 }}>`)

### 5. React 19 Event Types
**Layer**: Frontend
**Files**: Task 7.2 (`ResetPasswordDialog.tsx`), Tasks 8.1-8.5
**Rule**: NEVER use `FormEvent` (deprecated/removed in React 19). Use `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
**Issue**: Plan doesn't specify event types for form handlers
**Fix**: Use `React.SubmitEvent<HTMLFormElement>` for form submit handlers

### 6. i18n Translation System Compliance
**Layer**: Shared/Frontend
**Files**: Tasks 9.1, 9.2 (translation files), Tasks 7.2, 8.1-8.5 (components)
**Rule**: Must use compile-time TypeScript i18n system in `shared/locale/` - no hardcoded strings, no `next-intl`
**Issue**: Plan mentions `shared/locale/en/profile/base.json` but the actual structure is `shared/locale/en/profile.ts` (TypeScript files, not JSON)
**Fix**: Translation files are TypeScript modules in `shared/locale/en/profile.ts` and `shared/locale/ar/profile.ts`, not JSON files. Must follow the namespace registration process in `shared/AGENTS.md` lines 224-230.

### 7. Translation Namespace Registration
**Layer**: Shared
**Files**: Tasks 9.1, 9.2
**Rule**: New translation keys require namespace registration (5 steps per `shared/AGENTS.md` lines 224-230)
**Issue**: Plan doesn't include namespace registration steps for new profile keys
**Fix**: Add tasks for:
1. Add interface to `shared/locale/types/profile/index.ts`
2. Add implementations to `shared/locale/en/profile.ts` and `shared/locale/ar/profile.ts`
3. Export in `shared/locale/types/message.ts` (add to `MessageSchema`)
4. Add path mapping in `shared/locale/serverLegacy.ts` (`namespacePaths` map)
5. If used in layout SSR, add to `LocaleProvider` in `app/[locale]/layout.tsx`

### 8. Test Conventions - Database Tests
**Layer**: Backend Tests
**Files**: Tasks 10.1, 10.2
**Rule**: Database tests must use `runInRollback`, pass `tx` to ALL repository methods, no `expect().rejects.toThrow()`
**Issue**: Plan doesn't specify these requirements for unit tests
**Fix**: Add explicit requirements to test tasks:
- Use `runInRollback` wrapper
- Pass `tx` to all repository calls
- Use try/catch helper pattern instead of `expect().rejects.toThrow()`

### 9. Test Conventions - Integration Tests
**Layer**: Frontend GraphQL Tests
**Files**: Tasks 10.3, 10.4
**Rule**: GraphQL integration tests use dev server, `testClient`, not raw fetch
**Issue**: Plan correctly references `setupTestServerLifecycle`, `authenticatedRequest`, `assertOperationDenied` - this is compliant

### 10. Cross-Layer Import Check
**Layer**: All
**Files**: Multiple
**Rule**: Shared layer must NEVER import from `@/frontend/**`, `@/backend/**`, or `@/app/**`
**Issue**: Need to verify new shared files (if any) don't violate this
**Check**: Task 7.3 creates `frontend/common/graphql/sharedDocuments/auth/admin-password.documents.ts` - this is in frontend, not shared, so OK. No new shared files created.

### 11. Type Definition Pattern
**Layer**: Backend Types
**Files**: Tasks 2.1, 2.2
**Rule**: Types must come from `@/backend/types/{entity}.types.ts` - no local type definitions in Pothos
**Issue**: Plan correctly adds types to `backend/types/profile/profile.types.ts` and `backend/types/auth/auth.types.ts` - compliant

### 12. Service Boundaries
**Layer**: Backend Services
**Files**: Tasks 4.1, 4.2
**Rule**: Services delegate to repositories, not direct DB access; no GraphQL context in services
**Issue**: Plan shows services calling `UserRepository` methods and `PermissionsService` - compliant

### 13. Mutation Layer Organization
**Layer**: Backend GraphQL Mutation
**Files**: Tasks 5.1, 5.2
**Rule**: New mutations in matching sub-directory, side-effect imports in barrel
**Issue**: Plan creates `backend/graphql/mutation/auth/admin-password.mutation.ts` and adds import to `backend/graphql/mutation/auth/index.ts` - compliant

### 14. Frontend Component Structure
**Layer**: Frontend Common Views
**Files**: Tasks 7.2, 8.1-8.5
**Rule**: Shared components in `components/` (not `.mobile/.desktop`), tier views import ViewModel type
**Issue**: Plan creates `ResetPasswordDialog.tsx` in `shared/` - compliant. Admin sections modified in existing section files - compliant.

### 15. ViewModel Translation Pattern
**Layer**: Frontend Common Views
**Files**: Tasks 7.1, 8.1-8.5
**Rule**: ViewModel owns translations via `useAppTranslation`; components receive `labels` via props
**Issue**: Plan shows `useProfileFieldAccess` hook returning `canEditStatus`, `canAdminResetPassword` - this is a hook, not a ViewModel, so acceptable. Components use `useAppTranslation` directly - compliant for shared primitives.

---

## Required Fixes Before Implementation

### High Priority (Blocking)
1. **Fix Task 1.1**: Change migration command to `bun db migrate`
2. **Verify Task 3.1**: Confirm `AccountStatusPothosEnum` registered in `shared/enum.pothos.ts`
3. **Add Translation Namespace Registration Tasks**: 5-step process for new profile keys
4. **Fix Translation File Paths**: Change `.json` to `.ts` in Tasks 9.1, 9.2

### Medium Priority (Must Fix in Implementation)
4. **MUI v9 Compliance**: All new components must use `sx` prop
5. **React 19 Events**: Use `React.SubmitEvent<HTMLFormElement>`
6. **Test Conventions**: Add `runInRollback`, `tx` passing, try/catch pattern to test tasks

### Low Priority (Documentation)
7. **Update Plan**: Document the fixes above in tasks.md

---

## Files Requiring Instruction Verification

Each task must verify against these instruction files:

| Task | Layer AGENTS.md | .agents/instructions/*.md |
|------|-----------------|---------------------------|
| 1.1 | `backend/db/schema/AGENTS.md` | `backend.instructions.md` |
| 1.2 | `backend/enum/AGENTS.md` | `backend.instructions.md` |
| 2.1 | `backend/types/AGENTS.md` | `backend.instructions.md` |
| 2.2 | `backend/types/AGENTS.md` | `backend.instructions.md` |
| 3.1 | `backend/graphql/pothos/AGENTS.md` | `backend.instructions.md` |
| 3.2 | `backend/graphql/pothos/AGENTS.md` | `backend.instructions.md` |
| 4.1 | `backend/services/AGENTS.md` | `backend.instructions.md` |
| 4.2 | `backend/services/AGENTS.md` | `backend.instructions.md` |
| 5.1 | `backend/graphql/mutation/AGENTS.md` | `backend.instructions.md` |
| 5.2 | `backend/graphql/mutation/AGENTS.md` | `backend.instructions.md` |
| 6.1 | `backend/graphql/AGENTS.md` | `backend.instructions.md` |
| 7.1 | `frontend/common/views/AGENTS.md` | `frontend.instructions.md` |
| 7.2 | `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| 7.3 | `frontend/common/graphql/sharedDocuments/AGENTS.md` | `frontend.instructions.md` |
| 8.1-8.5 | `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| 9.1-9.2 | `shared/AGENTS.md` | `frontend.instructions.md` |
| 10.1-10.6 | `backend/services/AGENTS.md` or `test/ui/AGENTS.md` | `tests.instructions.md` |

---

## Outcome
**Plan does NOT pass all AGENTS.md rules**. The violations above must be fixed in the plan before implementation begins.

**Next Steps**:
1. Update `tasks.md` with the fixes listed above
2. Re-run plan review
3. Proceed to implementation only after "Plan passes all AGENTS.md rules"