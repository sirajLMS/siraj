# Backend Types Review — Round 2 Plan

## Review Configuration
- Scope: backend only (`backend/types/`, `backend/services/`, `backend/graphql/`, `backend/db/repo/`, `backend/lib/`)
- 6 parallel explore subagents: naming, duplication, consistency, imports, canonical-object, foundation
- Respect AGENTS.md, no commit, no push
- Deferred: `PaginationArgs` extraction, DayOfWeek `.$type<>()` on pgEnum

## Aggregated Findings (deduplicated across all subagents)

### P1 — CRITICAL: Runtime code NOT removed from types files (round 1 extraction incomplete)

The round 1 work created helper files in `backend/lib/` and `backend/services/` BUT did NOT remove the runtime code from the `.types.ts` files. Both copies now exist — the types files still export runtime functions/classes.

**Files affected:**

- [ ] `backend/types/shared/env-config.types.ts:88-96` — `maskSecretValue` function still present (helper at `backend/lib/env-config.helpers.ts`)
- [ ] `backend/types/billing/quota.types.ts:32-45` — 4 type guards (`isQuotaKind`, `isQuotaStatus`, `isQuotaPeriodType`, `isQuotaLedgerReason`) still present (guards also in `backend/enum/billing/quota.enum.ts`)
- [ ] `backend/types/billing/quota.types.ts:47-80` — `mapQuotaToReturnType`, `mapQuotaLedgerToReturnType` functions still present (helpers at `backend/lib/quota-mapping.ts`)
- [ ] `backend/types/billing/quota.types.ts:2` — Runtime (non-type) import of enum values; should be `import type`
- [ ] `backend/types/whatsapp/whatsapp-account.types.ts:28-75` — `isValidQualityRating`, `isValidLimitTier`, `coerceQualityRating`, `coerceLimitTier`, `buildReturnType` still present (helpers at `backend/lib/whatsapp-coercion.ts`, `backend/services/whatsapp/whatsapp-account.helpers.ts`)
- [ ] `backend/types/whatsapp/whatsapp-account.types.ts:2` — Runtime (non-type) import; should be `import type`
- [ ] `backend/types/cron/cron.types.ts:177-189` — `CronQueueBackendUnknown`, `CronQueueBackendNotAvailable` classes still present (helpers at `backend/services/cron/cron.helpers.ts`)
- [ ] `backend/types/cron/cron.types.ts:207-217` — `safeCronJobKind` function still present (helper at `backend/services/cron/cron.helpers.ts`)
- [ ] `backend/types/cron/cron.types.ts:2` — Runtime (non-type) import of cron enum values; should be `import type`

### P2 — CRITICAL: Types layer importing from services (layer inversion)

- [ ] `backend/types/teachers/teacher-onboarding.types.ts:4` — Imports `TeacherOnboardingResult` from `@/backend/services` (types layer must not depend on services)
- [ ] `backend/types/meeting/meeting-integrations.types.ts:14` — Imports `MeetingProvider` from `@/backend/services` (types layer must not depend on services)
- [ ] `backend/types/meeting/meeting-integrations.types.ts:10` — Runtime (non-type) import of meeting-integration enum values; should be `import type`
- [ ] `backend/types/meeting/meeting-integrations.types.ts:17` — Runtime re-export `export { MeetingConnectionTestMode, ... }` should be `export type` only

### P3 — CRITICAL: Onboarding types duplicated in service layer (not using canonical types)

Types were moved to `backend/types/` in round 1 but the service files still re-declare them instead of importing from the canonical location.

- [ ] `backend/services/teacher/teacher-onboarding.service.ts:17` — Re-declares `TeacherOnboardingInput` (canonical at `backend/types/teachers/teacher-onboarding.types.ts`)
- [ ] `backend/services/teacher/teacher-onboarding.service.ts:45` — Re-declares `TeacherOnboardingResult` (canonical at `backend/types/teachers/teacher-onboarding.types.ts`)
- [ ] `backend/services/teacher/teacher-onboarding.service.ts:26` — `gender` typed as inline `"MALE" | "FEMALE"` instead of `Gender` enum
- [ ] `backend/services/parent/parent-onboarding.service.ts:17` — Re-declares `ParentOnboardingInput` (canonical at `backend/types/parents/parent-onboarding.types.ts`)
- [ ] `backend/services/parent/parent-onboarding.service.ts:37` — Re-declares `ParentOnboardingResult` (canonical at `backend/types/parents/parent-onboarding.types.ts`)

### P4 — CRITICAL: Hand-written SelectType/InsertType in payment-method.types.ts (tables now exist)

The comment says "Drizzle table does not exist yet (Phase 2)" but all 4 tables now exist in `backend/db/schema/billing/`.

- [ ] `backend/types/billing/payment-method.types.ts:92-104` — `UserPaymentMethodSelectType` hand-written; should be `typeof userPaymentMethods.$inferSelect`
- [ ] `backend/types/billing/payment-method.types.ts:106-118` — `UserPaymentMethodInsertType` hand-written; should be `typeof userPaymentMethods.$inferInsert`
- [ ] `backend/types/billing/payment-method.types.ts:158-172` — `SupportedMobileWalletSelectType` hand-written; should be `typeof supportedMobileWallets.$inferSelect`
- [ ] `backend/types/billing/payment-method.types.ts:174-188` — `SupportedMobileWalletInsertType` hand-written; should be `typeof supportedMobileWallets.$inferInsert`
- [ ] `backend/types/billing/payment-method.types.ts:202-215` — `SupportedPaymentLinkSelectType` hand-written; should be `typeof supportedPaymentLinks.$inferSelect`
- [ ] `backend/types/billing/payment-method.types.ts:217-230` — `SupportedPaymentLinkInsertType` hand-written; should be `typeof supportedPaymentLinks.$inferInsert`
- [ ] `backend/types/billing/payment-method.types.ts:244-257` — `SupportedOnlineAccountSelectType` hand-written; should be `typeof supportedOnlineAccounts.$inferSelect`
- [ ] `backend/types/billing/payment-method.types.ts:259-272` — `SupportedOnlineAccountInsertType` hand-written; should be `typeof supportedOnlineAccounts.$inferInsert`

### P5 — CRITICAL: Runtime enums declared in types layer (should be in backend/enum)

- [ ] `backend/types/storage/storage.types.ts:105` — `export enum FileTypes` duplicates `backend/enum/storage/storage.enum.ts`
- [ ] `backend/types/storage/storage.types.ts:115` — `export enum FileSortField` duplicates enum
- [ ] `backend/types/storage/storage.types.ts:282` — `export enum UploadType` duplicates enum
- [ ] `backend/types/students/student.types.ts:155` — `export enum StudentsOrderByColumn` duplicates `backend/enum/students/student-order.enum.ts`

### P6 — CRITICAL: Runtime manifest files in types layer (should be in backend/lib or backend/services)

- [ ] `backend/types/profile/profile-field-manifest.ts` — Entirely runtime (consts, functions, non-type imports); should move to `backend/lib/` or `backend/services/`
- [ ] `backend/types/students/student-field-manifest.ts` — Entirely runtime (consts, functions, non-type imports); should move to `backend/lib/` or `backend/services/`

### P7 — CRITICAL: Service-layer inline types with NO canonical home in backend/types/

These service files define domain types inline that have no canonical version in `backend/types/`. Per AGENTS.md, all types must live in `backend/types/`.

- [ ] `backend/services/staff/manager-onboarding.service.ts:14` — `ManagerOnboardingInput` defined inline; should live in `backend/types/staff/`
- [ ] `backend/services/staff/manager-onboarding.service.ts:25` — `ManagerOnboardingResult` defined inline; should live in `backend/types/staff/`
- [ ] `backend/services/seed/student-seed.service.ts:29` — `SeedStudentInput` defined inline; should live in `backend/types/seed/`
- [ ] `backend/services/auth/session.service.ts:16` — `LogoutUserInput` defined inline; should live in `backend/types/auth/`
- [ ] `backend/services/auth/permissions.service.ts:8` — `UserPermissionContext` defined inline; should live in `backend/types/permissions/`
- [ ] `backend/services/pricing/rate-resolver.service.ts:19` — `ResolveClassRateInput` defined inline
- [ ] `backend/services/pricing/rate-resolver.service.ts:30` — `ResolvedClassRate` defined inline
- [ ] `backend/services/scheduling/availability.service.ts:21` — `SlotAvailabilityInput` defined inline
- [ ] `backend/services/scheduling/availability.service.ts:30` — `AssertSchedulePatternAvailableOptions` defined inline
- [ ] `backend/services/scheduling/availability.service.ts:38` — `AssertSchedulePatternAvailableInput` defined inline
- [ ] `backend/services/profile/profile.service.ts:161` — `ProfileAccessOptions` defined inline
- [ ] `backend/services/resource/learning-resource.service.ts:9` — `CreateResourceInput` defined inline
- [ ] `backend/services/parent/parent-document.service.ts:6` — `ParentDocumentRow` defined inline
- [ ] `backend/services/parent/parent-document.service.ts:15` — `LinkedDocumentResult` defined inline

### P8 — CRITICAL: Service-layer inline types with EXISTING canonical types (should import instead)

- [ ] `backend/services/staff/manager-profile.service.ts:10` — Re-declares `UpdateManagerProfileInput` (canonical at `backend/types/staff/staff-profile.types.ts:63`)
- [ ] `backend/services/seed/persona-seed.service.ts:23` — Re-declares `SeedTeacherProfileInput` (canonical at `backend/types/seed/seed.types.ts:5`)
- [ ] `backend/services/seed/persona-seed.service.ts:31` — Re-declares `SeedParentProfileInput` (canonical at `backend/types/seed/seed.types.ts:13`)
- [ ] `backend/services/seed/user-seed.service.ts:27` — Re-declares `SeedDemoUserInput` (canonical at `backend/types/seed/seed.types.ts:20`)

### P9 — WARNING: Repo files using local `$inferSelect` aliases instead of canonical `*SelectType`

- [ ] `backend/db/repo/billing/supported-online-account.repository.ts:15` — `type AccountRow = typeof supportedOnlineAccounts.$inferSelect` bypasses `SupportedOnlineAccountSelectType`
- [ ] `backend/db/repo/billing/supported-mobile-wallet.repository.ts:17` — `type WalletRow = typeof supportedMobileWallets.$inferSelect` bypasses `SupportedMobileWalletSelectType`
- [ ] `backend/db/repo/billing/supported-payment-link.repository.ts:15` — `type LinkRow = typeof supportedPaymentLinks.$inferSelect` bypasses `SupportedPaymentLinkSelectType`
- [ ] `backend/db/repo/billing/user-payment-method.repository.ts:10` — `type UserPaymentMethodRow = typeof userPaymentMethods.$inferSelect` bypasses `UserPaymentMethodSelectType`
- [ ] `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils.ts:25` — `hydrateDailyScheduleRows` param typed as raw `(typeof classInstances.$inferSelect)[]` instead of `ClassInstanceSelectType`

### P10 — WARNING: Remaining `*InsertInput` suffix violations (no deprecated alias, no canonical `*InsertType`)

- [ ] `backend/types/teachers/teacher-availability.types.ts:11` — `TeacherAvailabilityWindowInsertInput` should be `TeacherAvailabilityWindowInsertType`
- [ ] `backend/types/teachers/teacher-availability.types.ts:14` — `TeacherRecurringUnavailabilityInsertInput` should be `TeacherRecurringUnavailabilityInsertType`
- [ ] `backend/types/teachers/teacher-availability.types.ts:17` — `TeacherVacationRequestInsertInput` should be `TeacherVacationRequestInsertType`
- [ ] `backend/types/billing/billing.types.ts:344` — `ManualInvoiceInsertInput` should be `*InsertType` or `*SubmitInput`
- [ ] `backend/types/billing/credit.types.ts:24` — `CreditInsertInput` should be `CreditInsertType`

### P11 — WARNING: Missing forbidden field Omit in ReturnType

- [ ] `backend/types/classes/lesson-report.types.ts:7` — `LessonReportReturnType` omits `status`/`attendanceEvaluation` but NOT `idempotencyKey` (schema has it)
- [ ] `backend/types/users/user.types.ts:20` — `UserReturnType` omits `deletedAt`/`internalNotes` but NOT `password`/`rememberTokenHash`

### P12 — WARNING: Dynamic import bypassing `@/backend/types` barrel

- [ ] `backend/services/cron/queue-adapters/bullmq-redis.adapter.ts:3` — Dynamic `import("@/backend/types/cron/cron.types")` bypasses canonical barrel
- [ ] `backend/services/cron/queue-adapters/bullmq-pg.adapter.ts:3` — Dynamic `import("@/backend/types/cron/cron.types")` bypasses canonical barrel
- [ ] `backend/services/cron/test/queue-adapter.factory.test.ts:58` — Dynamic barrel bypass
- [ ] `backend/services/cron/test/queue-adapter.factory.test.ts:89` — Dynamic barrel bypass

### P13 — SUGGESTION: Pothos `__shared__` local shape types (EVALUATED → SKIPPED)

These are Pothos-internal `ObjectFieldBuilder<BuilderTypes, ParentShape>` shape types used for
GraphQL field definitions. They mirror fields from canonical `ReturnType` types but serve a
different Pothos-specific purpose. Extracting them to `backend/types/` would mix GraphQL-layer
concerns into the types layer and create coupling between Pothos builder generics and canonical
types. Correctly placed in `__shared__` directories.

- [~] `backend/graphql/pothos/billing/payment-method.pothos.ts:29` — `SupportedCommonShape` — Pothos-internal, correctly placed
- [~] `backend/graphql/pothos/billing/__shared__/paymentFieldHelpers.ts:32` — `PaymentFieldShape` — Pothos-internal, correctly placed
- [~] `backend/graphql/pothos/scheduling/__shared__/recurringScheduleSharedFields.ts:19` — `RecurringScheduleSharedShape` — Pothos-internal, correctly placed
- [~] `backend/graphql/pothos/scheduling/__shared__/classSessionMetricsFields.ts:11` — `MetricsSharedShape` — Pothos-internal, correctly placed
- [~] `backend/graphql/pothos/scheduling/__shared__/classExecutionFields.ts:16` — `ClassExecutionFieldShape` — Pothos-internal, correctly placed
- [~] `backend/graphql/pothos/billing/billing-history.pothos.ts:40` — `BillingSummaryWithCurrencyTotals` — Pothos-internal, correctly placed

### P14 — SUGGESTION: Deep-import `import("@/backend/types/...")` inside type bodies ✅ DONE

- [x] `backend/types/scheduling/schedule.types.ts:143,158,164` — Inline deep-imports; prefer `@/backend/types` barrel
- [x] `backend/types/scheduling/scheduling.types.ts:246` — Inline deep-import
- [x] `backend/types/profile/profile.types.ts:89,128` — Inline deep-imports
- [x] `backend/types/teachers/teacher.types.ts:205` — Inline deep-import
- [x] `backend/types/students/student.types.ts:177,194` — Inline deep-imports

### P15 — SUGGESTION: InferSelectModel/InferInsertModel instead of `typeof $inferSelect` ✅ DONE

- [x] `backend/types/meeting/meeting-provider.types.ts:82,84` — Uses `InferSelectModel`/`InferInsertModel` instead of `typeof $inferSelect`/`$inferInsert`
- [x] `backend/types/meeting/meeting-provider-token.types.ts:4,6` — Same

## Severity Summary
- **CRITICAL**: P1 (9 items), P2 (4 items), P3 (5 items), P4 (8 items), P5 (4 items), P6 (2 items), P7 (14 items), P8 (4 items) = 50 items
- **WARNING**: P9 (5 items), P10 (5 items), P11 (2 items), P12 (4 items) = 16 items
- **SUGGESTION**: P13 (6 items), P14 (6 items), P15 (2 items) = 14 items
- **Total**: 80 items

## Implementation Priority
1. **P1** (highest — runtime in types layer, round 1 incomplete)
2. **P2** (layer inversion — types importing from services)
3. **P3** (onboarding duplicate types in services)
4. **P4** (hand-written types when tables exist)
5. **P5** (enums in types layer)
6. **P6** (runtime manifests in types layer)
7. **P7-P8** (service inline types)
8. **P9-P12** (repo aliases, naming, missing Omit, barrel bypass)
9. **P13-P15** (suggestions — opportunistic)
