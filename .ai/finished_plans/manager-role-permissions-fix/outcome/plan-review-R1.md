# Plan Review R1 — Manager Role Mapping & Permissions Fix

## Review Date
2026-08-15

## Review Method
Invoked `@plan-review` skill. Dispatched `explore` subagent to read all applicable AGENTS.md files and verify plan against actual codebase.

## Input Files
- `specs.md`
- `design.md`
- `tasks.md`
- `deferred-items.md`

## Affected Architecture Layers
| Layer | AGENTS.md | Files Touched |
|-------|-----------|---------------|
| Backend Enums | `backend/enum/AGENTS.md`, `backend/AGENTS.md` | `account-type.enum.ts` |
| Backend Services | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `manager-onboarding.service.ts` |
| Backend Repos | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `staff-profile.repository.ts` |
| Shared Locale | `shared/AGENTS.md` | 6 locale/type files |
| Frontend Common Views | `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` | `SystemAccessSection.tsx` |
| Frontend GraphQL Tests | `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` | 2 test files |
| Backend Tests | `backend/db/test/AGENTS.md`, `backend/AGENTS.md` | 2 test files |

## Source File Verification (16 files)

All 16 source files verified to exist with correct paths and line numbers:

| # | File | Path Verified | Lines Verified |
|---|------|---------------|----------------|
| 1 | `backend/enum/users/account-type.enum.ts` | ✅ | ✅ admin@20, manager@21, supervisor@22, array@30-34 |
| 2 | `backend/services/staff/manager-onboarding.service.ts` | ✅ | ✅ resolveTargetGroupSlug@35-43 |
| 3 | `backend/db/repo/teachers/staff-profile.repository.ts` | ✅ | ✅ resolveRoleCondition@155-173, metrics@289-318 |
| 4 | `backend/db/migration/3-system_permissions_and_groups.sql` | ✅ | ✅ INSERT@1023-1031, UPSERT@1067-1073 |
| 5 | `backend/drizzle/.../migration.sql` | ✅ | ✅ INSERT@1057-1065, UPSERT@1101-1107 |
| 6 | `shared/locale/types/dashboard/staff/onboarding.ts` | ✅ | ✅ admin key@27, admin desc@32 |
| 7 | `shared/locale/ar/dashboard/staff/onboarding.ts` | ✅ | ✅ manager@28, admin@29, desc@34 |
| 8 | `shared/locale/en/dashboard/staff/onboarding.ts` | ✅ | ✅ admin@29 |
| 9 | `shared/locale/ar/dashboard/staff/directory.ts` | ✅ | ✅ roles.admin@54 |
| 10 | `shared/locale/en/dashboard/staff/directory.ts` | ✅ | ✅ roles.admin@54 |
| 11 | `frontend/common/views/.../SystemAccessSection.tsx` | ✅ | ✅ ACCOUNT_TYPES@11-15, label keys@17-21, branches@93-101 |
| 12 | `frontend/common/views/.../useManagersContainerViewModel.ts` | ✅ | ✅ mapManagerRole@19-24 |
| 13 | `backend/services/staff/test/manager-onboarding.service.test.ts` | ✅ | ✅ admin test@152-165, manager test@167-177 |
| 14 | `backend/db/test/repo/teachers/staff-profile.test.ts` | ✅ | ✅ manager filter test@216-222, uses runInRollback@43-52 |
| 15 | `frontend/common/graphql/test/teachers/manager-onboarding.test.ts` | ✅ | ✅ admin test@68-85, manager test@87-102 |
| 16 | `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts` | ✅ | ✅ Admin@58, roleSlug assertion@138 |

## AGENTS.md Rule Compliance (12 checks)

| # | Rule | Status |
|---|------|--------|
| 1 | Type imports from `@/backend/types/{entity}.types.ts` — no local type definitions | ✅ PASS |
| 2 | Service boundaries (Server→services, Client→Apollo hooks) | ✅ PASS |
| 3 | MUI v9 (style props NOT valid — use `sx` prop) | ✅ PASS |
| 4 | i18n (compile-time TS system in `shared/locale/`, no hardcoded text) | ✅ PASS |
| 5 | Logging (never `console.*` — use `logger`) | ✅ PASS |
| 6 | Test conventions (DB tests: `runInRollback`, pass `tx`, no `expect().rejects.toThrow()`) | ✅ PASS |
| 7 | GraphQL documents (`{Entity}QueryDocument`/`{Entity}MutationDocument`, include `id`, `@apollo/client/react`) | ✅ PASS |
| 8 | Path aliases (all imports use `@/*`) | ✅ PASS |
| 9 | No `next-intl` imports (legacy package removed) | ✅ PASS |
| 10 | Barrel file conventions (i18n changes need `index.ts` barrels) | ✅ PASS |
| 11 | No `.types.ts` files in service layer | ✅ PASS |
| 12 | Cross-layer import rule (`shared/` never imports frontend/backend) | ✅ PASS |

## Minor Non-Blocking Discrepancies

1. **Task 16 line reference**: Plan cites "assertions around line ~145 check `roleSlug === "staff_default"`" — actual location is **line 138** within `find()` at lines 137-139. Off by ~7 lines. Non-blocking — implementer can locate easily.
2. **UPSERT line references**: All other line citations (1067-1073, 1101-1107) are correct.

## Observations (Not Violations)

1. Task 9 keeps `roles.manager` key in AR directory locale even though `mapManagerRole` maps `%admin%` slugs to the `"admin"` bucket. Plan acknowledges this and correctly keeps it since the type schema (`StaffDirectoryLabels.roles`) still declares `manager: string`. Removing it would break the type contract. Correct decision.
2. Plan correctly identifies that `manager_onboarding.service.ts` has inline `ManagerOnboardingInput`/`result` interfaces (pre-existing, lines 14-33) but does NOT add new type definitions. Compliant with the "no `.types.ts` in service layer" rule.

## Review Outcome

**Plan passes all AGENTS.md rules for affected layers.**

- ✅ Zero blocking violations found
- ✅ All 16 source files verified against actual codebase
- ✅ All 12 AGENTS.md rule checks passed
- 2 minor cosmetic line number discrepancies (non-blocking)
- No plan file modifications required

The plan is ready for implementation.
