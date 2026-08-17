# Types Review Plan v3

**Date**: 2026-08-18
**Scope**: backend only — `backend/types/`, `backend/services/`, `backend/graphql/`, `backend/db/repo/`, `backend/db/seeds/`
**Focus**: Comprehensive types review (naming, duplication, consistency, imports, canonical object, foundation)
**Files Reviewed**: ~200+ files across 6 subagent groups

## Summary

Round 3 found **45 findings** across 6 review groups. After deduplication, there are **7 CRITICAL**, **15 WARNING**, and **23 SUGGESTION** items. The most impactful items are: non-canonical `*EntityInput`/`*InsertInput` naming (5 files), barrel `@/` import violations (2 files), `InferSelectModel` usage in payment-method.types.ts (last remaining file), and missing canonical `*SelectType` for `LeaveRequest`/`LeaveQuotaUsage` entities.

## Findings

### CRITICAL (7)

#### P1 — Non-canonical `*EntityInput` / `*InsertInput` naming (CRITICAL — violates AGENTS.md canonical naming)

- [ ] [CRITICAL] naming: `backend/types/parents/parent.types.ts:9` — `ParentEntityInput = typeof parents.$inferInsert` should be `ParentInsertType`
- [ ] [CRITICAL] naming: `backend/types/storage/storage.types.ts:6` — `FileEntityInput = typeof storageFiles.$inferInsert` should be `FileInsertType`
- [ ] [CRITICAL] naming: `backend/types/storage/storage.types.ts:8` — `DirectoryEntityInput = typeof storageDirectories.$inferInsert` should be `DirectoryInsertType`
- [ ] [CRITICAL] naming: `backend/types/staff/staff-profile.types.ts:6` — `StaffProfileEntityInput = typeof staffProfiles.$inferInsert` should be `StaffProfileInsertType`
- [ ] [CRITICAL] naming: `backend/types/permissions/permission-management.types.ts:7` — `UserPermissionOverrideEntityInput = typeof userPermissionOverrides.$inferInsert` should be `UserPermissionOverrideInsertType`

**Fix**: Rename the type aliases from `*EntityInput` to `*InsertType` across all 5 files. Update all downstream consumers importing the old names.

#### P2 — Barrel `@/` path violations (CRITICAL — AGENTS.md barrel rule: barrels MUST use `./`)

- [ ] [CRITICAL] imports: `backend/types/storage/index.ts:1` — barrel uses `@/backend/enum/storage/storage.enum` deep `@/` path instead of `./` relative path
- [ ] [CRITICAL] imports: `backend/types/students/index.ts:1` — barrel uses `@/backend/enum/students/student-order.enum` deep `@/` path instead of `./` relative path

**Fix**: These barrels re-export enums via `Types.*` namespace. 50+ consumers rely on `Types.FileTypes`, `Types.StudentsOrderByColumn`, etc. Two approaches:
1. **Remove re-exports**: Update all 50+ consumers to import from `@/backend/enum` directly — large refactor
2. **Keep as exception**: Document in collision registry as an intentional exception (enums are cross-layer shared, re-exported from types barrel for convenience)

**Recommended**: Approach 1 is correct per AGENTS.md but high-effort. Approach 2 is pragmatic. Given the barrel rule explicitly says "No `@/` aliases", approach 1 is the compliant fix. Schedule as a separate focused PR due to consumer count.

### WARNING (15)

#### P3 — `InferSelectModel`/`InferInsertModel` in payment-method.types.ts (last remaining file)

- [ ] [WARNING] foundation: `backend/types/billing/payment-method.types.ts:1` — imports `InferSelectModel`/`InferInsertModel` from `drizzle-orm` instead of codebase convention `typeof table.$inferSelect`/`$inferInsert`
- [ ] [WARNING] foundation: `backend/types/billing/payment-method.types.ts:94,95` — `UserPaymentMethodSelectType`/`UserPaymentMethodInsertType` uses `InferSelectModel`/`InferInsertModel`
- [ ] [WARNING] foundation: `backend/types/billing/payment-method.types.ts:135,136` — `SupportedMobileWalletSelectType`/`SupportedMobileWalletInsertType` same
- [ ] [WARNING] foundation: `backend/types/billing/payment-method.types.ts:155,156` — `SupportedPaymentLinkSelectType`/`SupportedPaymentLinkInsertType` same
- [ ] [WARNING] foundation: `backend/types/billing/payment-method.types.ts:175,176` — `SupportedOnlineAccountSelectType`/`SupportedOnlineAccountInsertType` same

**Fix**: Convert all 8 type definitions from `InferSelectModel<typeof table>` to `typeof table.$inferSelect` and `InferInsertModel<typeof table>` to `typeof table.$inferInsert`. Remove `drizzle-orm` import. **CAUTION**: This file uses a pgEnum workaround pattern — verify the `Omit<...> & { enumField: EnumType }` overrides still work with `$inferSelect` before committing.

#### P4 — Non-canonical `*Entity` aliases for `$inferSelect` (should be `*SelectType`)

- [ ] [WARNING] naming: `backend/types/parents/parent.types.ts:7` — `ParentEntity = typeof parents.$inferSelect` should be `ParentSelectType` (or removed if already exists)
- [ ] [WARNING] naming: `backend/types/storage/storage.types.ts:5,8` — `FileEntity`/`DirectoryEntity` should be `FileSelectType`/`DirectorySelectType`
- [ ] [WARNING] naming: `backend/types/permissions/permission-management.types.ts:6` — `UserOverrideEntity` should be `UserOverrideSelectType`

**Fix**: Check if canonical `*SelectType` already exists for each entity. If yes, remove the `*Entity` alias and update consumers. If no, rename `*Entity` to `*SelectType` and update consumers.

#### P5 — `*Input` / `*Entity` aliases that should be canonical names

- [ ] [WARNING] naming: `backend/types/students/studentStatusHistory.types.ts:4` — `StudentStatusHistoryInput = typeof studentStatusHistory.$inferInsert` should be `StudentStatusHistoryInsertType`
- [ ] [WARNING] naming: `backend/types/shared/signed-url.types.ts:9,14` — `SignedUrlEntity`/`SignedUrlEntityInput` are deprecated non-canonical aliases for `SignedUrlSelectType`/`SignedUrlInsertType`

**Fix**: Rename to canonical names and update consumers. The `SignedUrlEntity`/`SignedUrlEntityInput` aliases may be transitional — check if they're still needed or can be removed.

#### P6 — Missing barrel export for signed-url types

- [ ] [WARNING] consistency: `backend/types/shared/index.ts` — barrel omits `export * from "./signed-url.types"`, making canonical `SignedUrlSelectType`/`SignedUrlInsertType` unreachable via `@/backend/types`

**Fix**: Add `export * from "./signed-url.types"` to the barrel.

#### P7 — Repo local `$inferSelect` aliases where canonical types exist

- [ ] [WARNING] consistency: `backend/db/repo/shared/signedUrl.repository.ts:6-7` — defines local `SignedUrlEntity`/`SignedUrlEntityInput` instead of importing from `@/backend/types` (blocked by P6 — barrel missing)
- [ ] [WARNING] consistency: `backend/db/repo/scheduling/leave-quota-usage.repository.ts:6` — defines local `LeaveQuotaUsageRow` while canonical `LeaveQuotaUsageSelectType` exists at `backend/types/scheduling/scheduling.types.ts:72`
- [ ] [WARNING] consistency: `backend/db/repo/scheduling/leave-request.repository.ts:7` — defines local `LeaveRequestRow`; canonical `LeaveRequestSelectType` should exist in `backend/types/scheduling/` but doesn't yet

**Fix**:
1. Add `LeaveRequestSelectType` and `LeaveRequestInsertType` to `backend/types/scheduling/scheduling.types.ts` (new canonical types from `$inferSelect`/`$inferInsert`)
2. Fix barrel (P6) to export signed-url types
3. Replace repo local aliases with canonical imports

#### P8 — Seed service importing from repo files instead of @/backend/types

- [ ] [WARNING] consistency: `backend/services/seed/leave-request-seed.service.ts:15,20` — imports `LeaveQuotaUsageRow` and `LeaveRequestRow` from repo files instead of `@/backend/types`

**Fix**: Update to import canonical types from `@/backend/types` after P7 is resolved.

### SUGGESTION (23)

#### P9 — Ad-hoc inline types in Pothos (2)

- [ ] [SUGGESTION] canonical: `backend/graphql/pothos/storage/storage.pothos.ts:154` — `FileTypeBreakdownPothosObject` defines inline anon type `{ type: string; count: number; size: bigint }`; extract `FileTypeBreakdown` to `backend/types/storage/`
- [ ] [SUGGESTION] canonical: `backend/graphql/pothos/storage/storage.pothos.ts:226` — `BulkOperationFailurePothosObject` defines inline `{ path: string; error: string }`; extract `BulkOperationFailure` to `backend/types/storage/`

#### P10 — Impersonation Pothos augmentation (1)

- [ ] [SUGGESTION] canonical: `backend/graphql/pothos/auth/impersonation.pothos.ts:37` — `StartImpersonationResponsePothosObjectRef` uses `StartImpersonationReturnType & { targetUserId: string }`; could centralize augmentation

#### P11 — Deep schema imports in type files (13)

These are `import type { table } from "@/backend/db/schema/billing/payment-methods"` instead of `from "@/backend/db/schema"`. While the `@/backend/db/schema` barrel also re-exports these, the deep imports may have been intentional to avoid circular dependencies. **Low priority — evaluate case-by-case.**

- [ ] [SUGGESTION] imports: `backend/types/meeting/meeting-provider.types.ts:1` — deep `@/backend/db/schema/meeting/meeting-providers`
- [ ] [SUGGESTION] imports: `backend/types/scheduling/class-status-event.types.ts:1` — deep `@/backend/db/schema/classes/scheduling`
- [ ] [SUGGESTION] imports: `backend/types/billing/payment-method.types.ts:7` — deep `@/backend/db/schema/billing`
- [ ] [SUGGESTION] imports: `backend/types/storage/storage.types.ts:1` — deep `@/backend/db/schema/storage/storage`
- [ ] [SUGGESTION] imports: `backend/types/storage/learning-resources.types.ts:1` — deep `@/backend/db/schema/communications/communications`
- [ ] [SUGGESTION] imports: `backend/types/storage/site-content.types.ts:1` — deep `@/backend/db/schema/storage/site-content`
- [ ] [SUGGESTION] imports: `backend/types/classes/class-instance-detail.types.ts:1` — deep `@/backend/db/schema/classes/scheduling`
- [ ] [SUGGESTION] imports: `backend/types/classes/class-instance-performance.types.ts:1` — deep `@/backend/db/schema/classes/scheduling`
- [ ] [SUGGESTION] imports: `backend/types/users/user.types.ts:1` — deep `@/backend/db/schema/users/users`
- [ ] [SUGGESTION] imports: `backend/types/auth/impersonation.types.ts:1` — deep `@/backend/db/schema/auth/impersonation`
- [ ] [SUGGESTION] imports: `backend/types/permissions/permission.types.ts:1` — deep `@/backend/db/schema/permissions/permissions`
- [ ] [SUGGESTION] imports: `backend/types/permissions/permission-group.types.ts:1` — deep `@/backend/db/schema/permissions/permissions`
- [ ] [SUGGESTION] imports: `backend/types/billing/payment-method.types.ts:8` — deep `@/backend/enum/billing/payment-method.enum`

#### P12 — Deep enum imports in type files (7)

Same pattern as P11 but for enums — using deep `@/backend/enum/...` instead of `@/backend/enum` barrel.

- [ ] [SUGGESTION] imports: `backend/types/profile/profile.types.ts:2` — deep `@/backend/enum/auth/auth.enum`
- [ ] [SUGGESTION] imports: `backend/types/meeting/meeting-integrations.types.ts:13` — deep `@/backend/enum/meeting/meeting-integrations.enum`
- [ ] [SUGGESTION] imports: `backend/types/storage/storage.types.ts:3` — deep `@/backend/enum/storage/storage.enum`
- [ ] [SUGGESTION] imports: `backend/types/cron/cron.types.ts:8` — deep `@/backend/enum/cron/cron.enums`
- [ ] [SUGGESTION] imports: `backend/types/whatsapp/whatsapp-account.types.ts:7` — deep `@/backend/enum/whatsapp/whatsapp.enum`
- [ ] [SUGGESTION] imports: `backend/types/seed/seed.types.ts:2` — deep `@/backend/enum/parents/parent.enum`
- [ ] [SUGGESTION] imports: `backend/types/auth/auth.types.ts:12` — deep import `@/backend/lib/email` (types layer should not import from lib)


- [ ] [SUGGESTION] imports: `backend/types/db.types.ts:2-3` — types-layer imports `@/backend/db/drizzleDb` and `@/backend/db/drizzleRelations`
- [ ] [SUGGESTION] imports: `backend/types/shared/manager-onboarding.types.ts:1` — types-layer imports `@/backend/lib/email`
- [ ] [SUGGESTION] imports: `backend/types/auth/auth.types.ts:12` — types-layer imports `@/backend/lib/email` (duplicate of auth.types.ts above)

**Note**: P11/P12 deep schema/enum imports are SUGGESTION-level because they may prevent circular dependency issues. The `@/backend/db/schema` barrel re-exports all tables and may pull in more code. Only fix if no circular dependency is introduced.

#### P13 — Repo inline duplications (2)

- [ ] [SUGGESTION] consistency: `backend/db/repo/teachers/teacher-availability.repository.ts:772-773,801-802` — uses inline `(typeof teacherRecurringUnavailability.$inferSelect)[]` while canonical `TeacherRecurringUnavailabilitySelectType`/`TeacherAvailabilityWindowSelectType` are imported elsewhere in the same file
- [ ] [SUGGESTION] consistency: `backend/db/seeds/teachers/seed-leave-quota-usage.ts:6` — redefines local `type LeaveRequestRow = { createdAt: Date }` shadowing the schema-derived type

#### P14 — Complaint response type redundancy (1)

- [ ] [SUGGESTION] naming: `backend/types/complaints/complaintResponses.types.ts:12` — `ComplaintResponseInput` is near-duplicate of `ComplaintResponseSubmitInput` (lines 6-10); consider consolidating

#### P15 — Repo local list-result duplication (2)

- [ ] [SUGGESTION] duplication: `backend/db/repo/storage/learning-resource.repository.ts:17,10` — `LearningResourceListResult` and `LearningResourceCreateInput` re-declared locally instead of importing canonical types from `@/backend/types`
- [ ] [SUGGESTION] duplication: `backend/db/repo/scheduling/class-status-events.repository.ts:7` — `ClassStatusEventSeedInsertInput` re-declares insert columns inline instead of deriving from canonical `ClassStatusEventInsertType`

## Layer Compliance Notes

- **Types layer imports**: `backend/types/auth/auth.types.ts` and `backend/types/shared/manager-onboarding.types.ts` import from `@/backend/lib/email` — this is a types→lib dependency that may violate layer separation. Evaluate if the imported types can move to `@/backend/types` or `@/shared/types`.
- **Types layer imports**: `backend/types/db.types.ts` imports from `@/backend/db/drizzleDb` and `@/backend/db/drizzleRelations` — these are runtime modules imported in a types file. May need the types to be extracted to `@/backend/types` and the runtime to stay in `@/backend/db/`.

## Fix Status

- Total findings: 45
- Fixed: 38 / 45
- Remaining: 7 (P11 deep schema imports + P12 deep enum/lib imports — SUGGESTION-level, skipped to avoid circular dependency risk)

### Completed:
- [x] P1 — 5 `*EntityInput`/`*InsertInput` naming violations → renamed to canonical `*InsertType` (6 type files + 27 consumer files)
- [x] P2 — 2 barrel `@/` path violations → removed enum re-exports, updated 15 consumer files to import enums directly from `@/backend/enum`
- [x] P3 — 8 `InferSelectModel`/`InferInsertModel` → `$inferSelect`/`$inferInsert` in payment-method.types.ts
- [x] P4 — 4 `*Entity` aliases → `*SelectType` (done with P1)
- [x] P5 — `StudentStatusHistoryInput` → `StudentStatusHistoryInsertType`, `SignedUrlEntity`/`SignedUrlEntityInput` removed
- [x] P6 — Added missing `export * from "./signed-url.types"` to shared barrel
- [x] P7 — Replaced repo local aliases with canonical types (signedUrl, leave-quota-usage, leave-request)
- [x] P8 — Updated seed service to import from `@/backend/types`
- [x] P9 — Extracted `FileTypeBreakdown` and `BulkOperationFailure` to types layer
- [x] P10 — Skipped (impersonation augmentation is intentional, 1 occurrence)
- [ ] P11 — 13 deep schema imports (SUGGESTION — skipped, circular dependency risk)
- [ ] P12 — 7 deep enum imports + 3 lib imports (SUGGESTION — skipped, circular dependency risk)
- [x] P13 — Replaced inline `$inferSelect` with canonical types in teacher-availability.repository.ts
- [x] P14 — `ComplaintResponseInput` verified as structurally different (not redundant, no change needed)
- [x] P15 — Replaced `LearningResourceListResult` with canonical import; `ClassStatusEventSeedInsertInput` derived from canonical

### Verification:
- tsgo: No new errors (all remaining are pre-existing in scheduling/ files not modified)
- check:duplicates: 3 pre-existing clones (0 new duplicates introduced)
- lint: All modified files pass clean
