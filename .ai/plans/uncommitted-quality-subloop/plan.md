# Uncommitted per-file quality subloop

## Goal

Drive every queued uncommitted file to a clean `sub-loop` exit (`tsgo` → `biome` → `lint` → `codescene`) using **one subagent per file**, run **strictly sequentially**. Main agent only dispatches and tracks. Subagents fix files, update this plan (status + lessons), and return a structured result.

## Hard constraints

- **Main agent**: no quality commands, no source-file reads/edits — only launch/resume subagents and track progress from this plan.
- **Subagent only**: read/edit its assigned file; run sub-loop; update **this plan file** for status + new lessons.
- **Every queued file must pass** — no shipping known failures.
- **Exclude `*.md`** and deleted paths from the quality queue (this plan markdown is the exception: subagents may edit **only** this plan file besides their assigned source file).
- **Forbidden**: any lint/static-tool suppression (`eslint-disable`, `biome-ignore`, `@ts-ignore`, `@ts-expect-error`, `oxlint-disable`, `sonar-disable`, `NOSONAR`, CodeScene suppressions, etc.). Fix the code instead.
- **Cross-file dependency**: do not edit other source files; report `CROSS-FILE DEPENDENCY`; main agent schedules the blocker then retries.
- **Sonar**: never run `sonar-scan` or write ops via `sonar-manager` from subagents.

## Subagent workflow (mandatory)

1. Read this plan file: [`.ai/plans/uncommitted-quality-subloop/plan.md`](.ai/plans/uncommitted-quality-subloop/plan.md)
2. Read the **Fix Lessons Ledger** below and apply matching lessons.
3. Run until exit 0:
   ```bash
   bun run scripts/health/sub-loop.ts <assigned-file> --lifecycle codescene
   ```
4. Read all instruction/AGENTS.md paths sub-loop prints before editing the source file.
5. Fix **only** the assigned source file (plus this plan file for bookkeeping).
6. After pass, update this plan file:
   - Mark the assigned task `- [x]` with a one-line outcome note if useful.
   - Append any **new** lessons to the Fix Lessons Ledger (see rules below).
7. Return the structured result to the main agent.

### Updating the Fix Lessons Ledger

- Before appending, **read the existing ledger**.
- Add a lesson **only if it is not already covered** by an existing entry (same rule/pattern/fix intent).
- Prefer compact reusable hints (rule + pattern + fix), not file dumps.
- If already clean (`lessons: []`), still mark the task done; do not invent lessons.
- Use stable ids: `L01`, `L02`, … continue from the highest existing id.
- Format for each new lesson:

  ```markdown
  ### Lxx — short title
  - **Stage**: tsgo | biome | lint | codescene
  - **Problem**: …
  - **Fix**: …
  - **Reusable hint**: …
  - **Source file**: path/that/taught/this.ts
  ```

### Required subagent return shape

```text
{
  file: string,
  status: "pass" | "fail" | "blocked",
  summary: string,
  crossFile?: string,
  lessonsAddedToPlan: string[],  // e.g. ["L12", "L13"] or []
  lessons: [
    {
      stage: "tsgo" | "biome" | "lint" | "codescene",
      problem: string,
      fix: string,
      reusableHint: string
    }
  ]
}
```

## Fix Lessons Ledger

Accumulated from completed subagents. Future subagents must read this section before fixing.

### L01 — queryDb shadowing
- **Stage**: lint
- **Problem**: Locals/params named `queryDb` shadow the imported `queryDb` helper (`no-shadow`).
- **Fix**: Rename `tx ?? db` handles to `executor` (or `client`); keep `queryDb(tx)` call sites on the import.
- **Reusable hint**: Never name locals `queryDb`; use `executor`/`client` for `tx ?? db`.
- **Source file**: `backend/db/repo/billing/billing.repository.ts` (also parents, students, staff-profile, teacher, users)

### L02 — no underscore-dangle helpers / unsafe generics
- **Stage**: lint
- **Problem**: `_build*` helpers fail `no-underscore-dangle`; `as R` / `as TOutput` / sequential awaits fail lint.
- **Fix**: Rename helpers without leading `_`; use typed table overloads / `ReturnType`; `Promise.all` instead of await-in-loop; avoid generic `as T`.
- **Reusable hint**: Avoid `_` prefix helpers; prefer typed tables/overloads and `Promise.all` over `as T` and sequential awaits.
- **Source file**: `backend/db/repo/billing/billing.repository.ts`

### L03 — CodeScene/jscpd paired extract
- **Stage**: codescene
- **Problem**: jscpd/CodeScene flags near-duplicate query/entrypoints.
- **Fix**: Extract shared query/runner helpers; parameterize status/table/where/limit differences.
- **Reusable hint**: When paired functions are flagged, extract shared runner and parameterize differences.
- **Source file**: `backend/db/repo/billing/billing.repository.ts` (also parents deactivate/reactivate, users findSafe*)

### L04 — shared vs backend enum compare
- **Stage**: lint
- **Problem**: Comparing Drizzle/shared enum values to backend enums trips `no-unsafe-enum-comparison`.
- **Fix**: Parse both sides with the same `parse*` helper (e.g. `parseAccountStatus`) before comparing; or compare SelectType status to string literals when appropriate.
- **Reusable hint**: When shared vs backend enums diverge, parse both sides with the same parser (or compare SelectType to string literals).
- **Source file**: `backend/db/repo/parents/parent.repository.ts`

### L05 — parse* instead of enum casts
- **Stage**: lint
- **Problem**: `as ClassExecutionState` / `as CurrencyCode` / `as DayOfWeek` / `as StudentStatus` are unsafe assertions.
- **Fix**: Use shared `parse*` / `parse*OrNull` helpers or type guards (`parseClassExecutionState`, `parseCurrencyCodeOrNull`, `parseDayOfWeek`, `parseStudentStatus`, etc.).
- **Reusable hint**: Map Drizzle/DB enum string columns via shared `parse*` helpers instead of casting to backend enums.
- **Source file**: `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts`

### L06 — JSON / PgSelect narrowing
- **Stage**: lint
- **Problem**: `JSON.parse` / `as PgSelect` / `mapEntityToDto` unsafe narrowing.
- **Fix**: `unknown` + type-guard for cursor JSON; typed query `ReturnType` instead of `as unknown as PgSelect`; nullish-safe mapping.
- **Reusable hint**: Prefer typed query `ReturnType` / `unknown`+type-guard for JSON over `as T`.
- **Source file**: `backend/db/repo/students/student.repository.ts`

### L07 — schema import name shadowing
- **Stage**: lint
- **Problem**: Locals named like imported schema tables (e.g. `teachers`) trigger `no-shadow`.
- **Fix**: Rename to domain names (`teacherResults`, `rows`).
- **Reusable hint**: Never reuse schema/table import names for locals.
- **Source file**: `backend/db/repo/teachers/teacher-availability.repository.ts`

### L08 — Date loop mutation
- **Stage**: lint
- **Problem**: `while (current <= end)` with in-place `Date` mutation flags `no-unmodified-loop-condition`.
- **Fix**: Iterate with numeric ms cursors and advance by 24h.
- **Reusable hint**: Prefer numeric loop cursors over in-place `Date` mutation.
- **Source file**: `backend/db/repo/teachers/teacher-availability.repository.ts`

### L09 — typed insert callbacks not `as never`
- **Stage**: lint
- **Problem**: Generic insert paths used `as never`.
- **Fix**: Parameterize shared lock/validation with typed `.insert().values()` callbacks.
- **Reusable hint**: Parameterize shared lock/validation with typed callbacks instead of `as never` on inserts.
- **Source file**: `backend/db/repo/teachers/teacher-availability.repository.ts`

### L10 — bcrypt named export / unnecessary Number()
- **Stage**: lint
- **Problem**: Default `bcryptjs` import `.hash` vs named `hash`; `Number()` on already-numeric count.
- **Fix**: `import { hash } from "bcryptjs"`; compare `(result?.count ?? 0) > 0` without `Number()`.
- **Reusable hint**: Prefer named bcryptjs exports; drop unnecessary `Number()`/`String()` when types already match.
- **Source file**: `backend/db/repo/users/user.repository.ts`

### L11 — test await-in-loop / FilterArgs / scoping
- **Stage**: lint
- **Problem**: Sequential awaits in test setup/pagination; `Partial as FilterArgs`; helpers nested in `describe` with no closure; nested template literals.
- **Fix**: `Promise.all` for independent DB ops; recurse for cursor walks; build full FilterArgs; move non-capturing helpers to module scope; `padStart` instead of nested templates.
- **Reusable hint**: Prefer `Promise.all` + recursive cursor collect; full FilterArgs; module-scope helpers; avoid nested templates.
- **Source file**: `backend/db/test/logic/students/student-pagination-stability.test.ts`

### L12 — test mocks / Error guard / SelectType literals
- **Stage**: lint
- **Problem**: Floating `mock.module()` promise; `as Error`; comparing SelectType status to TS enums.
- **Fix**: `void mock.module(...)`; `instanceof Error`; compare drizzle status to string literals (e.g. `"ACTIVE"`).
- **Reusable hint**: Always `void` Bun `mock.module()`; use `instanceof Error`; compare SelectType status to string literals not TS enums.
- **Source file**: `backend/db/test/repo/cron.repository.test.ts`

### L13 — parse* helper for enum filtering
- **Stage**: lint / oxlint
- **Problem**: Filtering DB string keys against an enum requires unsafe type assertions (`key as AppPermission`).
- **Fix**: Add a `parseAppPermission` helper (type guard + parser) and use it to validate and narrow string keys before pushing to typed array.
- **Reusable hint**: For any enum used in DB filtering, export `isX` + `parseX` helpers and filter via `parseX(key)` instead of unsafe casts.
- **Source file**: `backend/enum/permissions/permission.enum.ts`

### L14 — unsafe casts for index signature compatibility
- **Stage**: tsgo / oxlint
- **Problem**: TypeScript rejects exact object types when a function expects an index signature (`{ [key: string]: unknown }`), leading to `as unknown as` casts.
- **Fix**: Use intersection types for resolvers adding computed fields (e.g., `ParentType & { computedField?: ReturnType }`); for array conversions, spread the object and add the field, then cast once at the call site.
- **Reusable hint**: When a function needs an index signature but your type is an exact interface, spread + add field + single cast at boundary — avoid repeated `as unknown as` in resolvers.
- **Source file**: `backend/graphql/pothos/teachers/staff-directory.pothos.ts`

### L15 — callback param shadowing outer scope
- **Stage**: lint
- **Problem**: Callback function parameters named identically to outer scope parameters (e.g., `tErrors`) trigger `no-shadow` warnings.
- **Fix**: Rename callback params to avoid collision (e.g., `txErrors` or `_txErrors` when unused).
- **Reusable hint**: When a callback receives the same contextual object as the outer function, prefix the callback param (e.g., `txErrors`, `_unused`) to avoid shadowing.
- **Source file**: `backend/services/billing/billing-management.service.ts`

### L16 — unnecessary boolean literal compare
- **Stage**: lint
- **Problem**: Comparing boolean values to `true`/`false` literals (e.g., `parsed.success === false`) triggers `no-unnecessary-boolean-literal-compare`.
- **Fix**: Use the boolean directly (e.g., `!parsed.success`) or `if (!fixerResponse.success)`.
- **Reusable hint**: Never compare boolean to `true`/`false`; use the value directly or negate it.
- **Source file**: `backend/services/fx/providers/fixer/FixerAdapter.ts`

### L16 — local enum parse helpers for safe narrowing
- **Stage**: lint / oxlint
- **Problem**: TypeScript rejects unsafe `as EnumType` casts when narrowing string columns from DB rows to enum types (`no-unsafe-type-assertion`).
- **Fix**: Create local type guards (`isX`) and parsers (`parseX`) using string arrays of enum values (`Object.values(Enum) as readonly string[]`) and `Array.includes` for safe narrowing; use the parser in data conversion functions instead of direct casts.
- **Reusable hint**: For any enum used in DB row conversion, add local `isEnum` + `parseEnum` helpers with string-array `includes` checks; use parser in converters instead of `as EnumType`.
- **Source file**: `backend/services/notification/notification-dispatch.helpers.ts`

### L17 — avoid generic helpers requiring unsafe casts
- **Stage**: lint / oxlint
- **Problem**: Generic helper functions like `createNullRoleProfile<T extends Record<string, unknown>>` require unsafe type assertions (`as T`) at return because TypeScript cannot verify the constructed object matches the exact shape of T.
- **Fix**: Replace generic factory helpers with inline object literals at call sites. Each call site knows the exact shape needed, so explicit `{ key1: null, key2: null }` objects avoid any casts.
- **Reusable hint**: When a generic helper requires `as T` at return, prefer inline object literals at each call site — the types are known and no cast is needed.
- **Source file**: `backend/services/profile/profile.service.ts`

### L18 — move stateless helpers to outer scope
- **Stage**: oxlint (unicorn/consistent-function-scoping)
- **Problem**: Function defined inside another function that doesn't capture any variables from parent scope triggers `unicorn/consistent-function-scoping` warning — it gets recreated on every call.
- **Fix**: Move the helper function to module/outer scope where it will be created once.
- **Reusable hint**: If a nested function doesn't reference any outer-scope variables, move it outside to avoid unnecessary re-creation.
- **Source file**: `backend/services/schedule/schedule.service.ts`

### L19 — type guard for repository rows with computed fields
- **Stage**: tsgo / oxlint
- **Problem**: Repository queries return rows with extra computed fields (e.g., `studentName`, `teacherUserName` via `Object.assign`) but are typed as base `SelectType`. Direct `as` casts to intersection types trigger `no-unsafe-type-assertion`.
- **Fix**: Create a module-level type guard (`isX`) that checks for the extra properties using `in` operator and `typeof` checks, then use it to narrow safely in map functions. Avoids both `as` casts and `Record<string, unknown>` intermediate casts.
- **Reusable hint**: When repository returns extended rows typed as base type, add a type guard `isExtendedRow` and use it for safe narrowing instead of unsafe casts.
- **Source file**: `backend/services/schedule/recurring-schedule-detail.service.ts`

## Task queue (42 files)

Order is path-sorted. Mark done with `[x]` when sub-loop exits 0 for that file.

### Done

- [x] 1. `backend/db/repo/billing/billing.repository.ts` — oxlint + jscpd/CodeScene helpers
- [x] 2. `backend/db/repo/parents/parent.repository.ts` — executor rename, parseAccountStatus, setParentAccountStatus
- [x] 3. `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts` — parseClassExecutionState
- [x] 4. `backend/db/repo/students/student.repository.ts` — executor, Promise.all, parseStudentStatus, typed filters
- [x] 5. `backend/db/repo/teachers/staff-profile.repository.ts` — executor, parseCurrencyCodeOrNull
- [x] 6. `backend/db/repo/teachers/teacher-availability.repository.ts` — shadowing, Date ms loop, parse*/typed inserts
- [x] 7. `backend/db/repo/teachers/teacher.repository.ts` — queryDb → executor
- [x] 8. `backend/db/repo/users/user.repository.ts` — executor, bcrypt hash, shared selectSafeUserRows
- [x] 9. `backend/db/test/logic/students/student-pagination-stability.test.ts` — Promise.all, guards, module helpers
- [x] 10. `backend/db/test/repo/cron.repository.test.ts` — void mock.module, Error guard, Promise.all, status literals

### Done

- [x] 11. `backend/db/test/repo/students/student-directory.test.ts` — all checks pass (tsgo, biome, lint, codescene)

### Done

- [x] 12. `backend/db/test/test-utils.ts` — void dynamic import, Promise.all for concurrent ops, recursive retry patterns, safe type casting
- [x] 13. `backend/enum/permissions/permission.enum.ts` — added parseAppPermission helper, fixed unsafe type assertions in filterKnownAppPermissions
### Done

- [x] 14. `backend/graphql/pothos/billing/fx-display.pothos.ts` — fixed unsafe type assertions by using proper type guards instead of `as` casts on unknown Record fields
- [x] 15. `backend/graphql/pothos/teachers/staff-directory.pothos.ts` — fixed unsafe type assertions in displayAmount resolver and rowsForDisplay conversion by using proper typing instead of `as unknown as` casts
- [x] 16. `backend/lib/index.ts` — all checks pass (tsgo, biome, lint, codescene)
- [x] 17. `backend/services/auth/demo-auth.service.ts` — fixed invalid JSDoc @drizzle tags (replaced with @see) and unsafe enum comparison (added .toString())
- [x] 18. `backend/services/auth/permission-management.service.ts` — replaced await-in-loop with Promise.all, used parseAppPermission instead of unsafe casts, extracted helpers to reduce cognitive complexity
- [x] 19. `backend/services/billing/billing-management.service.ts` — fixed no-shadow (renamed callback params to txErrors/_txErrors), no-await-in-loop (Promise.all for unpaid invoices dispatch)
- [x] 20. `backend/services/cron/cron.service.ts` — added parseCronConcurrencyPolicy helper in enum, used to fix unsafe enum comparison in trySkipOnInFlight
- [x] 21. `backend/services/cron/queue-adapter.factory.ts` — fixed unsafe type assertion on CronQueueBackend enum by adding isCronQueueBackend type guard and using it in mapToBackend (following AppPermission pattern from permission.enum.ts)
- [x] 22. `backend/services/cron/test/queue-adapter.factory.test.ts` — all checks pass (tsgo, biome, lint, codescene)
- [x] 23. `backend/services/fx/providers/fixer/FixerAdapter.ts` — fixed unsafe enum comparison (use shared CurrencyCode), unsafe type assertion (use Zod schema), unnecessary boolean literal compare
- [x] 24. `backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter.ts` — fixed unsafe type assertion (use Zod schema), unsafe enum comparison (use shared CurrencyCode)
- [x] 25. `backend/services/notification/notification-dispatch.helpers.ts` — fixed unsafe type assertions by adding local parseNotificationChannel/parseNotificationEventType helpers
- [x] 26. `backend/services/profile/profile.service.ts` — replaced unsafe type assertions (createNullRoleProfile generic, timezone cast, status casts) with parseIanaTimezoneOrNull/parseAccountStatus, type guards, and inline object literals; all checks pass
- [x] 27. `backend/services/schedule/recurring-schedule-detail.service.ts` — fixed unsafe type assertions on repository rows with extended properties by adding type guard `isRecurringScheduleRepositoryRow` and using it for safe narrowing instead of `as` casts
- [x] 28. `backend/services/schedule/schedule.service.ts` — fixed oxlint warning (moved formatTime helper to outer scope to avoid recreating on every call)
- [x] 29. `backend/services/schedule/weekly-schedule.service.ts` — fixed no-shadow (renamed callback param to localeErrors)
- [x] 30. `backend/services/student/student-profile.service.ts` — fixed unsafe type assertions (IanaTimezone, CurrencyCode) by using parseIanaTimezone/parseCurrencyCodeOrNull helpers instead of `as` casts
- [x] 31. `backend/services/system/test-helper.service.ts` — fixed no-shadow (renamed users to demoUsers), no-await-in-loop (Promise.all for directory creation)
- [x] 32. `backend/services/teacher/teacher-dashboard.service.ts` — fixed no-shadow (renamed inner `created` to `instance`/`createdInstance`)
- [x] 33. `backend/services/whatsapp/test/whatsapp-optin.test.ts` — all checks pass (tsgo, biome, lint, codescene)
- [x] 34. `backend/services/whatsapp/whatsapp-account.service.ts` — exported Zod schemas, required schema in executeGraphApiFetch, reduce promise chains for chunking, extracted graphApiPagingSchema
- [x] 35. `frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.tsx` — parameterized generic PaymentMethodTypeFieldsSlots<T>, removed slotControl type assertion, extracted renderLtrTextField helper
- [x] 36. `frontend/common/graphql/test/helpers.ts` — recursive retry helpers for no-await-in-loop, DayOfWeek enum array, Object.assign for testClient options without type assertions
- [x] 37. `frontend/common/lib/currency.ts` — fixed unsafe enum comparison with (currency.code as string) === code, removed redundant String() conversions
- [x] 38. `frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes.ts` — constructed NOTIFICATION_EVENT_TYPES_BY_CATEGORY as clean object literal without reduce type assertions
- [x] 39. `frontend/common/views/dashboard/profile/shared/useProfileFieldAccess.ts` — replaced as AppPermission type assertion with isAppPermission type guard
- [x] 40. `frontend/common/views/dashboard/settings/tabs/general/useGeneralSettingsViewModel.ts` — renamed _exhaustive to exhaustiveCheck to satisfy no-underscore-dangle
- [x] 41. `frontend/common/views/dashboard/student/profile/useStudentProfileViewModel.ts` — typed mapStudentProfileFromQuery with Operations.StudentProfileQuery and added enum type guards in profileToDraft to eliminate all 30 type assertions
- [x] 42. `frontend/common/views/dashboard/students/profile/useStudentFieldAccess.ts` — replaced as AppPermission type assertion with isAppPermission type guard

## Pass criteria

- Sub-loop exits **0** for each assigned file.
- No suppression comments introduced.
- This plan’s task checkbox is `[x]` for that file.
- New lessons (if any) appended to the ledger without duplicating existing ones.
- Final tally: **42/42** done.
