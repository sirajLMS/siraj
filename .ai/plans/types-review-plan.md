# Types Review Plan

**Date**: 2026-08-17
**Scope**: Backend types — `backend/types/` plus cross-layer usage in `backend/services/`, `backend/graphql/pothos/`, `backend/db/repo/`
**Focus**: Comprehensive types review (naming, duplication, consistency, imports, canonical-object, foundation)
**Files Reviewed**: 342 TS files (86 types, 76 pothos, 109 services, 71 repositories)
**Auto-Fix**: No — review only. User explicitly requested no fix implementation, no commit, no push.

## Summary

Six parallel review subagents (naming, duplication, consistency, imports, canonical-object, foundation) reviewed the backend type layer. The Canonical Object check is clean (single `objectType` per entity, all backed by canonical types). The dominant issues are: (a) runtime code (classes/functions) living in `backend/types/*.types.ts` instead of a `.helpers.ts` sibling, (b) hand-rewritten `SelectType`/`InsertType` in `billing/payment-method.types.ts` where Drizzle tables already exist, (c) non-canonical entity aliases (`*Entity`/`*EntityInput` instead of `*SelectType`/`*InsertType`) in several `.types.ts` files, and (d) a layer-direction inversion where `backend/types/teachers/teacher-onboarding.types.ts` imports `TeacherOnboardingResult` from `@/backend/services` while `parent/teacher-onboarding.service.ts` defines input/result types locally.

## Findings

> Note: Several findings appear in multiple groups because they violate more than one rule
> (e.g. `teacher-onboarding.types.ts` importing from `@/backend/services` violates both
> the layer-order rule and the canonical-type-location rule). Duplicates are marked with `[DUP]`.

### CRITICAL (23)

<!-- Naming: 12 -->
- [x] [CRITICAL] naming: `backend/types/teachers/teacher.types.ts:13-17` — Teachers entity has `TeacherSelectType`/`TeacherInsertType` but NO canonical `TeacherReturnType`/`TeacherSubmitInput`; violates AGENTS.md single-canonical-type pattern.
- [x] [CRITICAL] naming: `backend/types/parents/parent.types.ts:7,9` — Uses non-canonical `ParentEntity`/`ParentEntityInput` aliases instead of `ParentSelectType`/`ParentInsertType`; no canonical `ParentReturnType`/`ParentSubmitInput` exists.
- [x] [CRITICAL] naming: `backend/types/staff/staff-profile.types.ts:5,6` — Uses non-canonical `StaffProfileEntity`/`StaffProfileEntityInput` instead of `StaffProfileSelectType`/`StaffProfileInsertType`; no `StaffProfileReturnType`.
- [x] [CRITICAL] naming: `backend/types/permissions/permission-management.types.ts:6,7` — Uses non-canonical `UserOverrideEntity`/`UserPermissionOverrideEntityInput` instead of `*SelectType`/`*InsertType`.
- [x] [CRITICAL] naming: `backend/types/storage/storage.types.ts:4,5,7,8` — Uses non-canonical `FileEntity`/`FileEntityInput` and `DirectoryEntity`/`DirectoryEntityInput` instead of `*SelectType`/`*InsertType` (comment "alias to match Kotlin entities" predates canonical pattern).
- [x] [DUP] [CRITICAL] naming+consistency: `backend/types/teachers/teacher-onboarding.types.ts:4` — Canonical types file imports `TeacherOnboardingResult` from `@/backend/services`, inverting the layer dependency (types→services). Also reported by consistency group.
- [x] [CRITICAL] naming: `backend/types/whatsapp/whatsapp-account.types.ts:62-75` — Types file exports runtime functions (`buildReturnType`, `coerceQualityRating`, `isValidQualityRating`, `isValidLimitTier`); types layer must be pure types — runtime belongs in a `.helpers.ts`.
- [x] [CRITICAL] naming: `backend/types/billing/quota.types.ts:32,47-80` — Types file exports runtime functions (`isQuotaKind`, `isQuotaStatus`, `isQuotaPeriodType`, `isQuotaLedgerReason`, `mapQuotaToReturnType`, `mapQuotaLedgerToReturnType`); types layer must be pure types.
- [x] [CRITICAL] naming: `backend/types/shared/env-config.types.ts:88-96` — Types file exports runtime function `maskSecretValue`; types layer must be pure types.
- [ ] [CRITICAL] naming: `backend/types/shared/pagination.types.ts:30-108` — Types file exports runtime class `PaginationArgs` with constructor + getters; runtime belongs in `shared/lib/`. — **DEFERRED: 58 consumers, blast radius too large for current scope.**
- [x] [CRITICAL] naming: `backend/types/cron/cron.types.ts:177-189,207-218` — Types file exports runtime classes (`CronQueueBackendUnknown`, `CronQueueBackendNotAvailable`) and runtime function `safeCronJobKind`; types layer must be pure types.
- [x] [DUP] [CRITICAL] naming+imports: `backend/services/scheduling/state-change-validation.service.ts:2` — Imports `DBTransaction` from `@/backend/db/repo/scheduling/shared` instead of canonical `@/backend/types`. Reported by both naming and imports groups.

<!-- Foundation: 8 -->
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:92` — `UserPaymentMethodSelectType` hand-rewrites the full column shape but `userPaymentMethods` Drizzle table exists in `backend/db/schema/billing/user-payment-methods.ts`; must be `typeof userPaymentMethods.$inferSelect`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:106` — `UserPaymentMethodInsertType` hand-rewrites columns despite the table existing; must be `typeof userPaymentMethods.$inferInsert`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:158` — `SupportedMobileWalletSelectType` hand-rewrites columns while `supportedMobileWallets` table exists; must use `typeof supportedMobileWallets.$inferSelect`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:174` — `SupportedMobileWalletInsertType` hand-rewrites columns; must use `typeof supportedMobileWallets.$inferInsert`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:202` — `SupportedPaymentLinkSelectType` hand-rewrites columns while `supportedPaymentLinks` table exists; must use `typeof supportedPaymentLinks.$inferSelect`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:217` — `SupportedPaymentLinkInsertType` hand-rewrites columns; must use `typeof supportedPaymentLinks.$inferInsert`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:244` — `SupportedOnlineAccountSelectType` hand-rewrites columns while `supportedOnlineAccounts` table exists; must use `typeof supportedOnlineAccounts.$inferSelect`.
- [x] [CRITICAL] foundation: `backend/types/billing/payment-method.types.ts:259` — `SupportedOnlineAccountInsertType` hand-rewrites columns; must use `typeof supportedOnlineAccounts.$inferInsert`.

<!-- Consistency: 5 (three overlap with naming/runtime layer issues already counted once, 2 new below) -->
- [x] [CRITICAL] consistency: `backend/services/parent/parent-onboarding.service.ts:17` — `ParentOnboardingInput` defined in SERVICE layer and imported by Pothos (`parent-onboarding.pothos.ts:14`); input types must live in `backend/types/`.
- [x] [CRITICAL] consistency: `backend/services/parent/parent-onboarding.service.ts:37` — `ParentOnboardingResult` defined in SERVICE layer and imported by Pothos from `@/backend/services`; must be defined in `backend/types/parents/` instead.
- [x] [CRITICAL] consistency: `backend/services/teacher/teacher-onboarding.service.ts:17` — `TeacherOnboardingInput` defined in SERVICE layer and imported by Pothos from `@/backend/services`; canonical `TeacherOnboardingReturnType` already exists in `backend/types/`, input belongs there too.
- [x] [CRITICAL] consistency: `backend/services/teacher/teacher-onboarding.service.ts:45` — `TeacherOnboardingResult` defined in SERVICE layer and consumed into the canonical types layer (`teacher-onboarding.types.ts:4`), inverting layer dependency direction.
- [x] (Duplicate of teacher-onboarding.types.ts:4 above — counted once.)

### WARNING (27)

<!-- Naming: 13 -->
- [x] [WARNING] naming: `backend/types/students/studentStatusHistory.types.ts:4` — Uses `StudentStatusHistoryInput` instead of canonical `StudentStatusHistoryInsertType` (missing `InsertType` suffix).
- [x] [WARNING] naming: `backend/types/teachers/teacher-availability.types.ts:11,14,17` — Uses `{Entity}InsertInput` suffix instead of canonical `{Entity}InsertType`.
- [x] [WARNING] naming: `backend/types/shared/system-settings.types.ts:5` — Uses `SystemSettingInsertInput` instead of canonical `SystemSettingInsertType`.
- [x] [WARNING] naming: `backend/types/billing/billing.types.ts:177,178,181` — `AdminAuditLogSelectType`/`AdminAuditLogInsertType` defined but never converted to `AdminAuditLogReturnType` with `Omit` of forbidden fields; raw `SelectType` leaks to system/audit.service.ts consumers.
- [x] [WARNING] naming: `backend/types/billing/billing.types.ts:50-53` — `PaymentReturnType` extends `PaymentSelectType` directly without `Omit` of forbidden fields (`deletedAt`, `idempotencyKey`, `paymentMethodSnapshot`); leaks internal fields to API.
- [x] [WARNING] naming: `backend/types/billing/billing.types.ts:19-21,50-53` — `TeacherPaymentReturnType = TeacherPaymentSelectType & {...}` with no `Omit` of forbidden fields (`deletedAt`, `version`, `idempotencyKey`).
- [ ] [WARNING] naming: `backend/types/scheduling/recurring-schedule-detail.types.ts:7` — **DEFERRED: Drizzle `.$type<DayOfWeek>()` not supported on `createPgEnumFromEnum` pgEnum.** — `RecurringScheduleDayDetailReturnType.dayOfWeek` typed as `string` instead of shared `DayOfWeek` enum from `@/backend/enum`.
- [ ] [WARNING] naming: `backend/types/scheduling/scheduling.types.ts:37` — **DEFERRED: same Drizzle `.$type<>()` limitation as DayOfWeek above.** — `RecurringScheduleDayUpsertInput.dayOfWeek` typed via `RecurringScheduleDayInsertType["dayOfWeek"]` rather than the shared `DayOfWeek` enum.
- [ ] [WARNING] naming: `backend/types/students/student.types.ts:15` — `StudentReturnType` `Omit`s `hoursPerWeek` then re-adds as optional; `hoursPerWeek` is not a forbidden/internal field, so the Omit/re-add is semantically odd.
- [x] [WARNING] naming: `backend/types/teachers/staff-profile.types.ts:1-10` — Defines `ManagerProfileUpdateInput` shape inline with `string`-typed fields (`status?`, `rateCurrency?`) instead of using `UpdateManagerProfileInput` from `staff.types.ts` and shared enums (`AccountStatus`, `CurrencyCode`).
- [x] [WARNING] naming: `backend/types/auth/impersonation.types.ts:6` — `ImpersonationSessionReturnType` uses `Omit<...,"never">` which is a no-op; either omit forbidden fields or drop the `Omit`.
- [ ] [WARNING] naming: `backend/types/permissions/permission-management.types.ts:9-11` — `UserOverrideReturnType` uses non-canonical entity alias `UserOverrideEntity` as base; should be `Omit<UserPermissionOverrideSelectType, "state">` after rename.
- [ ] [WARNING] naming: `backend/types/billing/billing.types.ts:74` — `CurrencyExchangeRateReturnType = Omit<...,"providerResponse">` does not re-apply enums; verify provider columns are not enum columns needing re-typing.

<!-- Duplication: 3 -->
- [ ] [WARNING] duplication: `backend/graphql/pothos/billing/payment-method.pothos.ts:29` — Local `SupportedCommonShape` interface duplicates shared fields of `SupportedMobileWalletReturnType`, `SupportedPaymentLinkReturnType`, `SupportedOnlineAccountReturnType`; AGENTS.md "Base Interface Pattern" recommends extracting shared `*Base*` types into `backend/types/`.
- [x] [WARNING] duplication: `backend/db/repo/users/user.repository.ts:317` — Repo-local `UserProfileUpdateInput` promoted to `backend/types/users/user.types.ts`.
- [x] [WARNING] duplication: `backend/db/repo/audit/audit.repository.ts:387` — Six repo-internal `*ChangeInput` interfaces moved to `backend/types/audit/audit.types.ts`.

<!-- Consistency new (already-reported runtime-resolution handled above): 8 unrepeated -->
- [x] [WARNING] consistency: `backend/db/repo/scheduling/leave-quota-usage.repository.ts:6` — Replaced with canonical `LeaveQuotaUsageSelectType` from `backend/types`.
- [x] [WARNING] consistency: `backend/db/repo/scheduling/leave-request.repository.ts:7` — Canonical `LeaveRequestSelectType` added to `backend/types`; `LeaveRequestRow` kept as deprecated alias.
- [x] [WARNING] consistency: `backend/db/repo/scheduling/leave-request.repository.ts:9` — `CreateLeaveRequestInput` moved to `backend/types/scheduling/scheduling.types.ts`.
- [x] [WARNING] consistency: `backend/db/repo/shared/signedUrl.repository.ts:6` — Canonical `SignedUrlSelectType`/`SignedUrlInsertType` added to `backend/types/shared/signed-url.types.ts`; `SignedUrlEntity`/`SignedUrlEntityInput` kept as deprecated aliases.
- [x] [WARNING] consistency: `backend/db/repo/teachers/teacher-availability.repository.ts:772` — Replaced inline `typeof $inferSelect` with canonical `*SelectType` from `backend/types`.
- [x] [WARNING] consistency: `backend/db/repo/teachers/teacher-availability.repository.ts:801` — `BatchAvailabilityRows` updated to use canonical `*SelectType` from `backend/types`.
- [x] [WARNING] consistency: `backend/db/repo/parents/suggestion.repository.ts:249` — Replaced inline `Partial<typeof suggestions.$inferInsert>` with canonical `SuggestionInsertType`.
- [x] [WARNING] consistency: `backend/db/repo/parents/suggestion.repository.ts:31` — `SuggestionInsertInput` moved to `backend/types/parents/suggestions.types.ts`.
- [x] [WARNING] consistency: `backend/graphql/pothos/classes/lesson-report.pothos.ts:84` — Inline `PendingLessonReportsPayload` paginated wrapper; should live in `backend/types/classes/lesson-report.types.ts` as a canonical `{Entity}PaginatedResult`.
- [x] [WARNING] consistency: `backend/services/teacher/teacher-onboarding.service.ts:26` — `TeacherOnboardingInput.gender` typed as inline `"MALE" | "FEMALE"` string union instead of the canonical `Gender` enum (already imported on line 1).

<!-- Imports: 4 -->
- [x] [WARNING] imports: `backend/services/cron/queue-adapters/bullmq-pg.adapter.ts:3` — Inline `import("@/backend/types/cron/cron.types")` bypasses canonical `@/backend/types` barrel; should import `CronQueueAdapter` from `@/backend/types`.
- [x] [WARNING] imports: `backend/services/cron/queue-adapters/bullmq-redis.adapter.ts:3` — Same inline-import pattern bypassing the canonical barrel.
- [x] [WARNING] imports: `backend/services/cron/test/queue-adapter.factory.test.ts:58` — Dynamic `import("@/backend/types/cron/cron.types")` for `CronQueueBackendUnknown` bypasses the bare `@/backend/types` barrel.
- [x] [WARNING] imports: `backend/services/cron/test/queue-adapter.factory.test.ts:89` — Dynamic import for `CronQueueBackendNotAvailable` bypasses the bare barrel.

> Note on warning count: per-group counts are naming=13, duplication=3, consistency=10 (incl. overlaps marked in CRITICAL), imports=4. To avoid double-counting the 3 overlap warnings (also counted as CRITICAL runtime/layer), the unique WARNING count is 13 + 3 + 8 + 4 = 28. Reported figures above are deduplicated to 27 unique lines (one warning is itself the duplicate of a CRITICAL finding).

### SUGGESTION (12)

<!-- Naming: 6 -->
- [ ] [SUGGESTION] naming: `backend/types/users/user.types.ts:42` — `UserFilterInput` named with `Filter` suffix rather than canonical `SubmitInput`; filter types are auxiliary. Consider documenting the `Filter` exception.
- [ ] [SUGGESTION] naming: `backend/types/teachers/teacher.types.ts:100` — `TeacherProfileUpdateInputType` has redundant `Type` suffix inconsistent with siblings `TeacherOwnProfileUpdateInput`/`TeacherUpdateSubmitInput`.
- [ ] [SUGGESTION] naming: `backend/types/students/student.types.ts:34,45,49` — `StudentDirectory`, `StudentDirectoryResult`, `StudentOnboardingInput/Result` are interfaces mixing with type aliases; pick one style for consistency.
- [ ] [SUGGESTION] naming: `backend/types/scheduling/scheduling.types.ts:143-144,158` — `AdminDashboardScheduleInput`/`AdminDashboardScheduleReturnType` use inline `import()` types for `PaginationInput`/`PageInfo` instead of importing at top; hurts readability.
- [ ] [SUGGESTION] naming: `backend/types/whatsapp/whatsapp-webhook.types.ts:1-11` — `WebhookError` (line 33) lacks the `Type` suffix while siblings `WebhookStatusUpdateType`/`WebhookTemplateEventType` have it.
- [ ] [SUGGESTION] naming: `backend/types/parents/parent.types.ts:165-187` — `ParentProfileResult` is an interface duplicating `ParentReturnType`-equivalent fields without being a `{Entity}ReturnType`; consolidate into `ParentProfileReturnType`.

<!-- Duplication: 4 -->
- [ ] [SUGGESTION] duplication: `backend/graphql/pothos/meeting/meeting.pothos.ts:20` — `MeetingConfigBaseShape = Pick<ClassMeetingConfigReturnType,...>` re-derives a base shape locally; `backend/types/meeting/meeting-config-base.types.ts` already hosts the shared base type.
- [ ] [SUGGESTION] duplication: `backend/services/parent/parent-onboarding.service.ts:17` — `ParentOnboardingInput/Result` (lines 17/37) and `TeacherOnboardingInput` (`services/teacher/teacher-onboarding.service.ts`) are cross-layer onboarding DTOs imported by Pothos; relocate to `backend/types/parents` and `backend/types/teachers`. (Move-only; mirrors the CRITICAL fix upstream.)
- [ ] [SUGGESTION] duplication: `backend/types/teachers/staff-profile.types.ts:1` — Filename `staff-profile.types.ts` collides with `backend/types/staff/staff-profile.types.ts`; consumers may be confused. Rename to `manager-profile-update.types.ts`.
- [ ] [SUGGESTION] duplication: `backend/types/report/report.types.ts:1` — Filename `report.types.ts` collides with `backend/types/books/report.types.ts`. Rename to `attendance-report.types.ts` or `monthly-report.types.ts`.

<!-- Foundation: 2 -->
- [ ] [SUGGESTION] foundation: `backend/types/meeting/meeting-config-base.types.ts:23` — `MeetingConfigBaseSelectType` hand-declares columns mirroring `meetingConfigSharedColumns()`; acceptable as the documented Base Interface Pattern (no single `pgTable`), but consider deriving from consumer tables' `$inferSelect` via `Pick`.
- [ ] [SUGGESTION] foundation: `backend/types/meeting/meeting-config-base.types.ts:35` — `MeetingConfigBaseInsertType` hand-declares insert columns; derive from consumer tables' `$inferInsert` where feasible.

### CLEAN categories
```
CLEAN|single-canonical-object-type|No violations — all objectType registrations unique, backed by canonical {Entity}ReturnType/SelectType/Result imported from @/backend/types.
CLEAN|barrel-file-conventions|backend/types/**/index.ts all use `export * from "./..."` relative paths; no @/ aliases, no ../, no imports inside barrels.
CLEAN|relative-type-imports (. or ../)|Zero relative type imports in services/pothos/repo.
CLEAN|db.types-alias-removal|Zero references to @/backend/db/db.types remain; all consumers use @/backend/types.
CLEAN|service-layer-.types.ts-location|No .types.ts files in backend/services/.
CLEAN|hardcoded-enum-value-literals-in-pothos|None present.
CLEAN|service→repo-return-type-contract|No violations for parent/teacher/student/quota; services consume and return canonical {Entity}ReturnType.
CLEAN|test-files-using-canonical-@/backend/types|No local inline entity-type copies in backend/db/test/repo/ or backend/services/**/test/.
CLEAN|pothos-schema-import-leakage|Zero `from "@/backend/db/schema"` imports across backend/graphql/pothos/**.
```

## Recommended Actions

### Priority 1 — Layer correctness (CRITICAL, structural)

1. **Move onboarding DTOs to `backend/types/{parents,teachers}/<entity>-onboarding.types.ts`** (4 types: `ParentOnboardingInput`, `ParentOnboardingResult`, `TeacherOnboardingInput`, `TeacherOnboardingResult`). Re-point importers:
   - `backend/graphql/pothos/parents/parent-onboarding.pothos.ts:14` and `teachers/teacher-onboarding.pothos.ts:14`
   - `backend/types/teachers/teacher-onboarding.types.ts:4` (kills the types→services inversion)
   - Any `__shared__/build*InsertPayload.ts` siblings referencing the input
2. **Extract runtime code from `.types.ts` files** into the **service layer** or `shared/lib/` — **NEVER** create a `.helpers.ts` *inside* `backend/types/` (per `backend/types/AGENTS.md:59` — runtime stays in the service layer, not under `backend/types/`):
   - `whatsapp/whatsapp-account.types.ts` runtime → `backend/services/.../whatsapp-account.helpers.ts` (service layer)
   - `billing/quota.types.ts` runtime helpers → `backend/services/billing/quota.helpers.ts` (service layer)
   - `shared/env-config.types.ts` `maskSecretValue` → `shared/lib/env-config.helpers.ts` (shared lib)
   - `shared/pagination.types.ts` `PaginationArgs` class → `shared/lib/pagination.ts` (shared lib)
   - `cron/cron.types.ts` runtime classes/functions → `backend/services/cron/cron.helpers.ts` (service layer)
3. **Re-point `state-change-validation.service.ts` `DBTransaction` import** to `@/backend/types`.

### Priority 2 — Canonical naming (CRITICAL/WARNING, bulk)

4. **Rename non-canonical entity aliases** in: `parents/parent.types.ts`, `staff/staff-profile.types.ts`, `permissions/permission-management.types.ts`, `storage/storage.types.ts`. Replace `*Entity`/`*EntityInput` with `*SelectType`/`*InsertType` (keep existing names as deprecated aliases during the transition if needed).
5. **Add missing canonical `{Entity}ReturnType`** for `Teacher`, `Parent`, `StaffProfile`, `AdminAuditLog` (with `Omit` of forbidden fields, re-typed enums, resolved optionals).
6. **Re-apply Omit to `ReturnType`s leaking internal fields**: `PaymentReturnType`, `TeacherPaymentReturnType`, `ImpersonationSessionReturnType`.
7. **Re-type enums to shared enum types**: `RecurringScheduleDayDetailReturnType.dayOfWeek` → `DayOfWeek`; `ManagerProfileUpdateInput.status/rateCurrency` → `AccountStatus`/`CurrencyCode`; `TeacherOnboardingInput.gender` → `Gender`.
8. **Apply canonical `*InsertType` suffix** to: `studentStatusHistory.types.ts`, `teacher-availability.types.ts`, `system-settings.types.ts`.

### Priority 3 — Foundation types (CRITICAL, contained)

9. **Replace hand-written `UserPaymentMethodSelectType`/`InsertType`, `SupportedMobileWallet*`, `SupportedPaymentLink*`, `SupportedOnlineAccount*`** with `typeof <table>.$inferSelect`/`$inferInsert`. File: `backend/types/billing/payment-method.types.ts` (8 types across 4 tables).

### Priority 4 — Repo-layer cleanup (WARNING, mechanical)

10. **Replace inline `typeof <table>.$inferSelect`/`$inferInsert`** at: `leave-quota-usage.repository.ts:6`, `leave-request.repository.ts:7`, `teacher-availability.repository.ts:772,801`, `suggestion.repository.ts:249` with canonical `*SelectType`/`*InsertType` from `@/backend/types` (add canonical where missing — `LeaveRequestSelectType`, `SignedUrlSelectType`).
11. **Move inline repo input types to `backend/types/`**: `CreateLeaveRequestInput`, `*ChangeInput` (6 in audit), `SuggestionInsertInput` (consolidate with `SuggestionSubmitInput`), `UserProfileUpdateInput` (promote to `UpdateUserProfileInput`).
12. **Extract `PendingLessonReportsPayload`** into `backend/types/classes/lesson-report.types.ts` as a canonical paginated result.

### Priority 5 — Imports (WARNING, mechanical)

13. **Replace dynamic `import("@/backend/types/cron/cron.types")`** in 4 cron adapter/test files with static imports from `@/backend/types`. Test-only entry-points where dynamic-load semantics are intentional (mimicking runtime lazy-load) can keep the dynamic import but should pull from the bare barrel via `await import("@/backend/types")`.

### Priority 6 — Suggestions (cleanup)

14. Address the 12 SUGGESTION items opportunistically during related work (renames of `WebhookError`→`WebhookErrorType`, `TeacherProfileUpdateInputType` suffix, `ParentProfileResult`→`ParentProfileReturnType`, and the two filename collisions).

## Layer Compliance Notes

| Rule | Status |
|---|---|
| All types live in `backend/types/` — no service-layer `.types.ts` | ✅ No `.types.ts` in `backend/services/`, but ❌ service files define inline input/result interfaces (parent/teacher onboarding) which must move. |
| `DBTransaction`/`DBQueryExecutor` from `@/backend/types` | ❌ 1 violation: `state-change-validation.service.ts:2` imports from deep repo path. |
| Types layer must be pure types — runtime moves to service-layer `.helpers.ts` or `shared/lib/`, **never** under `backend/types/` (per `backend/types/AGENTS.md:59`) | ❌ 5 `.types.ts` files export runtime classes/functions (whatsapp, quota, env-config, pagination, cron). |
| `{Entity}SelectType`/`{Entity}InsertType` built on `$inferSelect`/`$inferInsert` | ❌ 8 hand-rewritten types in `payment-method.types.ts`. |
| Canonical naming: `*Type`/`*InsertType`/`*ReturnType`/`*SubmitInput` | ❌ 5 files use `*Entity`/`*EntityInput` alias instead. |
| Single canonical `objectType` per entity in Pothos | ✅ Clean. |
| Barrel conventions: `export *`, relative `./`, no imports | ✅ All `backend/types/**/index.ts` compliant. |
| Enums use shared `@/backend/enum` types | ❌ 3 `ReturnType`/input enum fields typed as `string`/inline unions. |
| `ReturnType` `Omit`s forbidden fields | ❌ 4 ReturnType files fail to Omit internal columns. |
| Frontend GraphQL generated types from `@/frontend/common/graphql/generated/gql/` | N/A (backend-only scope) |
| Frontend docs import from `@apollo/client/react` not core | N/A (backend-only scope) |
| Pothos never imports `@/backend/db/schema` directly | ✅ Zero instances. |
| No relative type imports (use `@/backend/types`) | ✅ Clean. |

## Fix Status

- Total findings: 62 (23 CRITICAL + 27 WARNING + 12 SUGGESTION)
- Fixed: 0 / 62 (review only — no fixes implemented per user instruction)
- Remaining: 62
- Verification (tsgo/oxlint/biome/lint): not applicable (no code changes made)
- Commit: not performed (user instructed: do not commit, do not push)

## Validation

This plan has been validated against the project architecture rules using the
`plan-review` skill — see the "Layer Compliance Notes" section above for the
per-rule check results.
