# Plan Review Round 1: Login Cold Start Fix

## Date
2026-08-19

## Methodology
Read all affected layer AGENTS.md files (`backend/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/db/repo/AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`) and verified plan against rules on type imports, service boundaries, MUI v9, i18n, logging, test conventions, GraphQL documents, and file path accuracy.

## Findings

### Finding 1: Phase 3 Already Implemented (FIXED)
- **Layer**: backend/db/repo
- **File**: `backend/db/repo/users/user.repository.ts` line 158-162
- **Issue**: Plan tasked modifying `findByEmail` to use `queryDb()`, but the method already uses `queryDb()` (line 159: `const q = queryDb();`)
- **Action**: Updated tasks.md Phase 3 to verification-only, marked 3.1 as `[x]`. Updated design.md Component 3 to note existing implementation.
- **Status**: ✅ Fixed in plan

### Finding 2: Frontend Retry Error Code Access (FIXED)
- **Layer**: frontend/views
- **File**: `frontend/views/auth/login/useLoginViewModel.ts`
- **Issue**: Plan task 4.1 said to check `extensions.code === "SERVICE_UNAVAILABLE"` but `useAuth().login()` returns `boolean` success and `authError` as a string — the raw GraphQL error code is not directly accessible. The plan didn't include a step to investigate the `useAuth` interface.
- **Action**: Added new task 4.1 to investigate `useAuth().login()` error code propagation before implementing retry logic. Renumbered subsequent tasks (4.2-4.5). Added three options (modify useAuth, parse message, use Apollo directly).
- **Status**: ✅ Fixed in plan

### Finding 3: i18n Key for "Retrying" (ACKNOWLEDGED)
- **Layer**: frontend/views + shared/locale
- **Files**: `shared/locale/types/auth/index.ts`, `shared/locale/en/auth/login.ts`, `shared/locale/ar/auth/login.ts`
- **Issue**: Plan correctly identified the need for a new `retrying` i18n key across all three compile-time i18n files (type schema, en locale, ar locale).
- **Action**: No fix needed — plan task 4.4 (renumbered from 4.3) already covers this correctly. Updated to specify exact file paths and Arabic translation.
- **Status**: ✅ Already compliant

### Finding 4: GraphQL Error Messages Use i18n Correctly (NO VIOLATION)
- **Layer**: backend/graphql
- **File**: `backend/graphql/mutation/auth/auth.mutation.ts`
- **Issue**: All user-facing errors in the login resolver use `tErrors.auth.*` from `ctx.t().errorsTranslations`
- **Action**: No fix needed.
- **Status**: ✅ Already compliant

## Rules Verified

| Rule | Dimension | Status |
|------|-----------|--------|
| Type imports from `@/backend/types` | backend/graphql, backend/db/repo | ✅ |
| Service boundaries (Server vs Client) | frontend/views | ✅ |
| MUI v9 style props (`sx` only) | frontend/views | ✅ N/A |
| i18n compile-time pattern | shared/locale | ✅ |
| Logging via `logger` not `console` | all layers | ✅ |
| Test conventions (runInRollback, tx) | backend/db/test | ✅ N/A |
| GraphQL document naming | frontend/common/graphql | ✅ N/A |
| `queryDb()` for repository bare reads | backend/db/repo | ✅ Already done |
| AGENTS.md references in tasks | all tasks | ✅ |

## Conclusion
Plan passes all AGENTS.md rules for affected layers after R1 fixes. Ready for implementation.
