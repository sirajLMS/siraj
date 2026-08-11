# Tasks: Code Duplication Elimination — Phase 4

**Feature:** Phase 4 — Backend / Shared / App / Scripts Focus
**Version:** 1.0
**Date:** 2026-08-11

---

## Execution Protocol

### ⛔ No-Server-Tests Policy (CRITICAL)

**NEVER run any of these** (any task/subtask that references them is ~~struck through~~ and marked SKIPPED):

| Command | Reason | Status |
|---------|--------|--------|
| `bun run test:graphql` | Requires Next.js dev server | ❌ NEVER |
| `bun run test:ui:components` | UI component tests (Happy DOM) | ❌ NEVER |
| `bun run test:ui:e2e` | E2E — requires Next.js production server | ❌ NEVER |
| `bun run test:ui` | All UI tests | ❌ NEVER |
| `bun run build:test` / `build` | Next.js server build | ❌ NEVER |
| `bun run test:db` / `:sequential` | May require server connection | ❌ NEVER |
| `bun run test:services` / `:sequential` | May require server connection | ❌ NEVER |
| `bun run test:integration` / `:live-fx` / `:live-comm` | Requires external server | ❌ NEVER |
| `bun run test` (meta) | Runs ALL tests — includes server-required | ❌ NEVER |
| `bun run scripts/run-test/run-test.ts <path>` | May touch server-required tests | ❌ NEVER |

**Allowed commands** (read-only / no server):
- `bun tsgo`
- `bun biome:check` / `bun biome:check --write`
- `bun run oxlint`
- `bun run lint` / `bun run scripts/lint-service.ts -f <file> --id verify` / `bun run scripts/lint-service.ts --type-aware --fix`
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
- `bun run scripts/health/sub-loop-uncommitted.ts --lifecycle codescene`
- `bun check:duplicates` (jscpd — read-only)
- `bun run db generate` (no server)
- `bun run generate:gqlSchema` / `bun codegen` (no server)
- `bun quality-gate` / `bun quality-gate:fresh` (read-only)

### Sequential vs Parallel
- Tasks 1.1-1.3 are **sequential** (barrel churn risk).
- Tasks in Phases 2-6 are **parallel** subagent-dispatched (one cluster per subagent).
- Orchestrator marks `[x]` after subagent verifies via sub-loop.ts and commits.

### Per-File Mandatory Subtasks
Each implementation subtask includes:
- **QL**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
- **SR**: 12-point semantic checklist (atomicity, module-level state, env-config registration, reset invalidation, empty-string credentials, dead branches, cross-layer imports, enum value imports, schema migrations, deferred items, i18n compliance, circular-dep check)
- **IV**: read instruction files + AGENTS.md listed by sub-loop.ts discovery output
- Sequence: QL → SR → IV → orchestrator marks `[x]`

### Layer-to-AGENTS.md / Instruction Mapping

| File Path Prefix | AGENTS.md | Instruction Files |
|---|---|---|
| Root | `AGENTS.md` | — |
| `app/` | `AGENTS.md`, `app/AGENTS.md` | `frontend.instructions.md` |
| `shared/` | `AGENTS.md`, `shared/AGENTS.md` | — |
| `backend/services/` | `AGENTS.md`, `backend/services/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/db/repo/` | `AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/db/schema/` | `AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/types/` | `AGENTS.md`, `backend/types/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/enum/` | `AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/graphql/` | `AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/lib/` | `AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `scripts/` | `AGENTS.md`, `scripts/AGENTS.md` (if exists) | `tests.instructions.md` |
| `codegen.ts` | `AGENTS.md` | — |

---

## Phase 0: Baseline

- [ ] 0.1 Establish error baseline
  - Run `bun tsgo 2>&1 | tee /tmp/phase4-baseline-tsgo.txt`
  - Run `bun biome:check 2>&1 | tee /tmp/phase4-baseline-biome.txt`
  - Run `bun run scripts/lint-service.ts --json --id phase4-baseline 2>&1 | tee /tmp/phase4-baseline-lint.json`
  - Run `bun check:duplicates 2>&1 | tee /tmp/phase4-baseline-jscpd.txt`
  - Run `bun run scripts/health/sub-loop-uncommitted.ts --lifecycle codescene 2>&1 | tee /tmp/phase4-baseline-subloop.txt`
  - Confirm: tsgo 0 errors at baseline; jscpd reports 528 clones
  - Write outcome: `.ai/plans/duplications-phase4/outcome/0-baseline-outcome.md`

---

## Phase 1: Cross-Layer Enum Cleanup (Sequential)

**Goal:** eliminate 3 cross-layer enum duplicates (78 lines / 1,989 tokens).
**Risk:** Task 1.3 codemod touches 57 files — requires careful verification.

- [ ] 1.1 Delete `backend/enum/shared/currency.enum.ts`
  - Verify no direct importers: `grep -rl "@/backend/enum/shared/currency" . --include='*.ts' --include='*.tsx' -- . --exclude-dir=node_modules --exclude-dir=.next`
  - Check barrel re-exports in `backend/enum/index.ts`, `backend/enum/shared/index.ts` — remove dead entries
  - Add `.jscpd.json` ignore NOT required (file deleted)
  - Delete the file
  - QL: sub-loop on `backend/enum/shared/index.ts` and `backend/enum/index.ts` (codescene lifecycle)
  - SR / IV as per L2 instructions
  - Outcome: `.ai/plans/duplications-phase4/outcome/1.1-currency-delete-outcome.md`
  - _Requirements: AC-1_

- [ ] 1.2 Delete `backend/enum/classes/class-instance-detail.enum.ts`
  - Verify no direct importers: `grep -rIl "@/backend/enum/classes/class-instance-detail" .`
  - Check barrel re-exports in `backend/enum/index.ts`, `backend/enum/classes/index.ts`
  - If any importers exist, repoint them to `@/shared/constants/class-instance-detail`
  - Delete the file
  - QL: sub-loop on each modified file (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/1.2-class-instance-detail-delete-outcome.md`
  - _Requirements: AC-1_

- [ ] 1.3 Codemod repoint timezone imports + delete `backend/enum/shared/timezone.enum.ts`
  - Pre-step: enumerate importers via `grep -rIl "@/backend/enum/shared/timezone" . --include='*.ts' --include='*.tsx'` — verify 57 files
  - Pre-step: confirm `shared/constants/iana-timezone.enum.ts` exports the same symbols (`IANATimezone`, `TIMEZONE_LABELS`, etc.); confirm `scripts/generate-iana-timezone-enum.ts` regenerates only the shared copy
  - Codemod (mechanical) — replace `@/backend/enum/shared/timezone` import specifiers → `@/shared/constants/iana-timezone` across all importers via `sed -i`
  - Verify: `grep -rIl "@/backend/enum/shared/timezone" .` returns 0 hits
  - Check barrel re-exports in `backend/enum/index.ts`, `backend/enum/shared/index.ts`
  - Delete `backend/enum/shared/timezone.enum.ts`
  - QL: project-wide `bun tsgo` first (catches all mismatched imports); then sub-loop on each modified file to codescene lifecycle
  - SR: pay special attention to `backend/lib/timezone.ts` (probe flagged it as a heavy consumer); confirm all consumers are repointed
  - IV: backend.instructions.md + backend/AGENTS.md
  - Outcome: `.ai/plans/duplications-phase4/outcome/1.3-timezone-codemod-outcome.md`
  - _Requirements: AC-1_ _Resolves deferred item D4-remaining (Phase 1 D4 → Phase 2 OOS → Phase 3 untouched)_

---

## Phase 2: Service-Layer Extraction (Parallel)

**Goal:** eliminate 5 service-layer pairs (74 lines / 505 tokens).
**Pattern:** extract shared helper in `__shared__/` subdirectory; both consumers import directly from `__shared__/` (NOT through barrel `index.ts`).

- [ ] 2.1 `ParentServiceBase` — parent-portal ↔ parent-social service
  - Create `backend/services/parent/__shared__/parentServiceBase.ts`
  - Export `ParentServiceBase` class (or namespace mixin) with `assertPermission(userId, permission, locale)` and `resolveParentForUser(userId, locale)` private helpers — both ported from `parent-portal.service.ts[7:38-25:24]` and `parent-social.service.ts[7:38-25:24]`
  - Update `parent-portal.service.ts` and `parent-social.service.ts`: remove duplicated private helpers; delegate to `ParentServiceBase`
  - QL: sub-loop on all 3 files (codescene)
  - SR: confirm no circular imports (both already import `PermissionsService` + `ParentRepository`)
  - Outcome: `.ai/plans/duplications-phase4/outcome/2.1-parent-service-base-outcome.md`
  - _Requirements: AC-2_

- [ ] 2.2 `resolveTeacherId` — schedule.service ↔ weekly-schedule.service
  - Create `backend/services/schedule/__shared__/resolveTeacherId.ts`
  - Export `resolveTeacherId(userId, requestedTeacherId: string | null | undefined, tErrors)` (widen union per decision #5)
  - Update `backend/services/schedule/schedule.service.ts[251:50-269:4]` and `backend/services/schedule/weekly-schedule.service.ts[31:38-49:4]` to import + delegate
  - QL: sub-loop on all 3 files (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/2.2-resolve-teacher-id-outcome.md`
  - _Requirements: AC-2_

- [ ] 2.3 `prepareMeetingConfigUpsert` — meeting-config.service intra-file
  - Create `backend/services/meeting/__shared__/prepareMeetingConfigUpsert.ts`
  - Export generic `prepareMeetingConfigUpsert<TPayload>(inputs, options: { topicDefault: string; buildPayload: (input, ctx) => TPayload })` capturing shared provider-fetch + validate + prepare-details pipeline (porting from `meeting-config.service.ts[245:41-267:42]` and `[303:42-325:42]`)
  - Update `upsertManyUserMeetingConfigs` and `upsertManyClassMeetingConfigs` to delegate; each provides its own `topicDefault` + `buildPayload`
  - QL: sub-loop on all 3 files (codescene)
  - SR: enum value imports (enum classes if any), no module-level mutable state
  - Outcome: `.ai/plans/duplications-phase4/outcome/2.3-prepare-meeting-config-upsert-outcome.md`
  - _Requirements: AC-2_

- [ ] 2.4 `createAuthSession` — auth.mutation ↔ demo-auth.service
  - Create `backend/lib/auth/createAuthSession.ts`
  - Export `createAuthSession(user, options?: { skipComments?: boolean })` capturing token generation + `SessionRepository.create({ hashedId: sessionId, userId, payload: JSON.stringify({ createdAt: new Date().toISOString() }) })`
  - Update `backend/graphql/mutation/auth/auth.mutation.ts[252:7-264:10]` and `backend/services/auth/demo-auth.service.ts[128:5-138:8]` to delegate
  - Preserve the in-place comment `// Store session metadata only, not sensitive tokens` only on the auth mutation side (option `skipComments: true` for demo-auth)
  - QL: sub-loop on all 3 files (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/2.4-create-auth-session-outcome.md`
  - _Requirements: AC-2_

- [ ] 2.5 `build*InsertPayload` + soft-fail permission resolve — repo↔service pairs

  **Placement decision (plan-review R1 finding):** `build*InsertPayload` helpers belong in the **service layer** (`backend/services/{parent,teacher}/__shared__/`), NOT the repo layer. Per `backend/db/repo/AGENTS.md`, repositories are strictly for data access — payload assembly (timestamp defaults, identifier-to-label mapping) is service-layer business logic. This mirrors the existing `backend/services/meeting/__shared__/meetingConfigHelpers.ts` precedent. The `prepareInsert` hook in `billingRepoFactory.ts` is a different pattern — a hook *inside* a repo factory, not a standalone helper file. Helpers must accept input types from `@/backend/types/{entity}.types.ts` (`{Entity}SubmitInput`) and return `{Entity}InsertType`.

  - Subtask 2.5a: `buildParentInsertPayload(input)` in `backend/services/parent/__shared__/buildParentInsertPayload.ts` (NEW directory — same `__shared__/` pattern as `backend/services/meeting/__shared__/`); update `backend/services/parent/parent-onboarding.service.ts[74:48-85:14]` to use it (constructor timestamp defaults)
  - Subtask 2.5b: `buildTeacherInsertPayload(input)` in `backend/services/teacher/__shared__/buildTeacherInsertPayload.ts` (NEW directory); update `backend/services/teacher/teacher-onboarding.service.ts[80:37-93:14]` to use it
  - Subtask 2.5c: `backend/services/billing/billing-management.service.ts[140:7-149:18]` — `listUserIdsWithPermission`: replace pasted query body with `PermissionsRepository.listUserIdsWithPermission(key)` call; PRESERVE soft-fail try/catch (repo throws, service swallows + returns `[]`)
  - Sub-task enforced: verify the repo throws vs service swallows behavioral difference is preserved (manual semantic review check)
  - QL: sub-loop on all 5 files (codescene)
  - SR: behavior preservation — the service MUST catch repo errors and return `[]`; the repo MUST continue to throw
  - Outcome: `.ai/plans/duplications-phase4/outcome/2.5-insert-payload-and-soft-fail-outcome.md`
  - _Requirements: AC-2_

---

## Phase 3: GraphQL (Pothos + Query) Helpers (Parallel)

**Goal:** eliminate 13 GraphQL-layer pairs (133 lines / 1,170 tokens).
**Pattern:** Pothos `_*Fields(t, opts)` helper functions returning field-builder objects; `make*QueryField(name, typeRef, serviceMethod)` factories; `resolveStudentIdFromArgsOrUser(args, ctx, tErrors)` cross-file prelude.

- [ ] 3.1 Pothos field-object helper extracts
  - Subtask 3.1a: `backend/graphql/pothos/billing/__shared__/paymentFields.ts` — `paymentFields(t, { snapshotPredicate })` (parameterized nullable predicate) · Pair 11 (`billing-payments.pothos.ts[23:42-39:47]` ↔ `[57:42-73:47]`)
  - Subtask 3.1b: `backend/graphql/pothos/billing/__shared__/creditFields.ts` — `creditFields(t)` (both `CreditTransactionPothosObject` and `CreditPurchaseResultPothosObject` delegate) · Pair 12
  - Subtask 3.1c: `backend/graphql/pothos/scheduling/__shared__/classSessionMetricsFields.ts` — parameterize `id: t.exposeString(...)` presence · Pair 15
  - Subtask 3.1d: `backend/graphql/pothos/scheduling/__shared__/classExecutionFields.ts` — shared tail fields; each `.implement` prepends own head · Pair 16
  - Subtask 3.1e: `backend/graphql/pothos/scheduling/__shared__/recurringScheduleSharedFields.ts` — shared core; detail adds `timezone` enum + extras · Pair 14
  - QL: sub-loop on each implemented file + each new helper
  - SR: Pothos `.implement({ fields: helper })` pattern — confirm Pothos `Builder` types flow through
  - IV: `backend.instructions.md`, `backend/graphql/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase4/outcome/3.1-pothos-field-helpers-outcome.md`
  - _Requirements: AC-3_

- [ ] 3.2 Pothos create-vs-update input helpers
  - Subtask 3.2a: `classSubjectFields(t, required)` in `backend/graphql/pothos/classes/__shared__/classSubjectFields.ts` · Pair 13 (`class-subject.pothos.ts[53:43-63:13]` ↔ `[67:44-77:13]`)
  - Subtask 3.2b: `teacherNoteFields(t, required)` in `backend/graphql/pothos/teachers/__shared__/teacherNoteFields.ts` · Pair 17 (`teacher-notes.pothos.ts[33:37-42:7]` ↔ `[44:38-51:4]`)
  - Subtask 3.2c: `whatsappAccountFields(t, { includeIdentity })` in `backend/graphql/pothos/whatsapp/__shared__/whatsappAccountFields.ts` (parameterize `wabaId`/`phoneNumberId` only in create) · Pair 18
  - QL: sub-loop on each implemented file + each new helper
  - Outcome: `.ai/plans/duplications-phase4/outcome/3.2-pothos-input-helpers-outcome.md`
  - _Requirements: AC-3_

- [ ] 3.3 Query-resolver factories
  - Subtask 3.3a: `makeSupportedPaymentListQueryField(name, typeRef, serviceMethod)` in `backend/graphql/query/billing/__shared__/makeSupportedPaymentListQueryField.ts` — updates `payment-method.query.ts[71:44-80:36]` and `[90:46-99:36]` · Pair 19
  - Subtask 3.3b: `makeMonthlyReportQueryField({ name, typeRef, idArgName, serviceMethod })` in `backend/graphql/query/reports/__shared__/makeMonthlyReportQueryField.ts` — updates `monthly-report.query.ts[12:16-20:13]` and `[37:16-45:13]` · Pair 20
  - Subtask 3.3c: `makeWeeklyScheduleQueryField(name, typeRef, serviceMethod)` in `backend/graphql/query/scheduling/__shared__/makeWeeklyScheduleQueryField.ts` — updates `schedule.query.ts[162:41-171:42]` and `[193:44-202:42]` · Pair 21
  - Subtask 3.3d: `makePaymentMethodListMutationField(name, serviceMethod)` in `backend/graphql/mutation/billing/__shared__/makePaymentMethodListMutationField.ts` — updates `payment-method.mutation.ts[150:61-160:35]` and `[165:65-175:35]` · Pair 10
  - QL: sub-loop on each implemented file + each new helper
  - Outcome: `.ai/plans/duplications-phase4/outcome/3.3-query-resolver-factories-outcome.md`
  - _Requirements: AC-3_

- [ ] 3.4 Cross-file student query prelude
  - Create `backend/graphql/__shared__/studentQueryHelpers.ts`
  - Export `resolveStudentIdFromArgsOrUser(args, ctx, tErrors)` — used by `student-history.query.ts[15:41-30:13]` and `student-profile.query.ts[13:63-28:13]`
  - Update both query files to delegate; preserve the throw `tErrors.studentNotFound(ctx.user.id)` semantics
  - QL: sub-loop on all 3 files (codescene)
  - SR: args shape consistency
  - Outcome: `.ai/plans/duplications-phase4/outcome/3.4-student-query-prelude-outcome.md`
  - _Requirements: AC-3_

---

## Phase 4: Repository / Schema Helpers (Parallel)

**Goal:** eliminate 2 repo/schema pairs (37 lines / 207 tokens).

- [ ] 4.1 Extend `billingRepoFactory.ts` with `makeBillingUpsertMany`
  - Modify `backend/db/repo/billing/__shared__/billingRepoFactory.ts`
  - Export `makeBillingUpsertMany<TSelect, TInsert>(table, slugCol, valueAdapter, toSelectType)` — covers the missing `upsertMany` body (insert/onConflictDoUpdate/values)
  - Update `backend/db/repo/billing/supported-mobile-wallet.repository.ts[113:46-137:2]` and `backend/db/repo/billing/supported-payment-link.repository.ts[103:44-127:2]` to use the new factory (parameters: per-table column set — `countryCode/currencyCode/phoneRegion` for wallet; absent for link)
  - QL: sub-loop on all 3 files (codescene)
  - SR: generic type-safety preserved (TSelect/TInsert flow through toSelectType + valuesAdapter)
  - IV: `backend.instructions.md`, `backend/db/repo/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase4/outcome/4.1-billing-upsert-many-outcome.md`
  - _Requirements: AC-4_

- [ ] 4.2 `coreScheduleColumns` Drizzle helper for scheduling.ts

  **Placement decision (plan-review R1 finding):** Colocate with existing schema helpers at `backend/db/schema/__shared__/coreScheduleColumns.ts` — NOT a new `classes/__shared__/` subdirectory. Precedent: `backend/db/schema/__shared__/columnHelpers.ts` (exports `timestampColumns`, `primaryKeyColumn`) and `backend/db/schema/__shared__/junctionTableHelper.ts` (per `backend/db/repo/AGENTS.md` § Schema Helpers). Keeping all schema helpers in one `__shared__/` directory avoids fragmentation.

  - Create `backend/db/schema/__shared__/coreScheduleColumns.ts`
  - Export `coreScheduleColumns(students, teachers, classSubjects)` returning plain column-bag (id/studentId/teacherId/subjectId FK shape from `classes/scheduling.ts[57:24-68:69]` and `[148:20-159:69]`)
  - Update `recurringSchedules` (around line 57) and `classInstances` (around line 148) to spread `coreScheduleColumns(...)` then add their own extra columns
  - QL: sub-loop on all files (codescene)
  - SR: no circular import risk (helper imports only the three table refs via factory args)
  - Outcome: `.ai/plans/duplications-phase4/outcome/4.2-core-schedule-columns-outcome.md`
  - _Requirements: AC-4_

---

## Phase 5: Scripts & Codegen (Parallel)

**Goal:** eliminate 5 scripts/codegen pairs (84 lines / 443 tokens).

- [ ] 5.1 `scripts/health/__shared__/log.ts` — COLORS + logFn quartet · Pair 34
  - Create module exporting `COLORS` const + `logInfo`, `logSuccess`, `logWarning`, `logError` functions
  - Update `scripts/health/codescene/config.ts[85-110]` and `scripts/health/sonar/ts/config.ts[45-69]` to import
  - QL: sub-loop on all 3 files (codescene)
  - SR: these are isolated build-time Node scripts; AGENTS.md `no-console` rule may apply — verify `eslint.config.mjs` ignores `scripts/**` (if not, use existing logger pattern)
  - Outcome: `.ai/plans/duplications-phase4/outcome/5.1-scripts-log-outcome.md`

- [ ] 5.2 `scripts/health/__shared__/bin-resolver.ts` — cross-platform PATH resolver · Pair 33
  - Export `resolveBinOnPATH(binName, options: { cache?: boolean })` using `spawnSync('which'/'where.exe')` pattern
  - Update `scripts/health/codescene/config.ts[46-79]` (`resolveCodesceneBin`) and `scripts/health/sonar/ts/docker.ts[8-34]` (`resolveDockerBin`) to delegate
  - QL: sub-loop on all 3 files (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/5.2-bin-resolver-outcome.md`

- [ ] 5.3 `scripts/health/__shared__/sub-loop-types.ts` — `CheckResult`, `runCommand`, `exitCodePassed`, `Lifecycle` · Pair 35
  - Extract from `scripts/health/sub-loop.ts` (lines 48-122 per probe)
  - Update `scripts/health/sub-loop.ts` and `scripts/health/sub-loop-uncommitted.ts` to import
  - QL: sub-loop on both files (codescene)
  - SR: low risk — pure types and tiny command-runner helpers; no behavioral change
  - Outcome: `.ai/plans/duplications-phase4/outcome/5.3-sub-loop-types-outcome.md`

- [ ] 5.4 `scripts/unused/__shared__/types.ts` — `Summary`, `TypeFile`, `LayerFile` interfaces · Pair 36
  - Extract from `scripts/unused/knip-categorize.ts[24-37]` (canonical) — `knip-analyze.ts` re-declares the same signatures
  - Update `scripts/unused/knip-analyze.ts[24-37]` to import from the new shared module
  - QL: sub-loop on all 3 files (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/5.4-unused-types-outcome.md`

- [ ] 5.5 `codegen.ts` `sharedGqlConfig` const · Pair 32
  - Hoist a `const sharedGqlConfig = { useTypeImports: true, ..., scalars: {...} }` const in `codegen.ts`
  - Spread into the two output `config` blocks (`codegen.ts[47:30-69:7]` and `[76:8-98:7]`)
  - QL: sub-loop on `codegen.ts` (codescene)
  - SR: pure config object dedupe; no runtime impact
  - Outcome: `.ai/plans/duplications-phase4/outcome/5.5-codegen-shared-config-outcome.md`

---

## Phase 6: App Router (Parallel)

**Goal:** eliminate 3 app/ route-shim pairs (39 lines / 263 tokens). Low ROI — each task starts with helper extract; if extract proves fragile (Next.js route constraint), add `.jscpd.json` ignore with justification in deferred-items.

- [ ] 6.1 `buildMeetingProviderPageMetadata(mode)` helper OR ignore · Pair 29
  - Create `app/(dashboard)/meeting-providers/__shared__/buildMeetingProviderPageMetadata.ts`
  - Export `buildMeetingProviderPageMetadata(mode: 'create' | 'edit')` returning `generateMetadata` fn
  - Update `app/(dashboard)/meeting-providers/create/page.tsx[1:1-11]` and `edit/page.tsx[1:1-11]` to use it
  - If extract doesn't fit Next.js route constraint → add to `.jscpd.json` ignore with justification in deferred-items (path: `app/(dashboard)/meeting-providers/**/page.tsx`)
  - QL: sub-loop on each file (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/6.1-meeting-providers-metadata-outcome.md`
  - _Requirements: AC-7_

- [ ] 6.2 `makeParentProfileRedirectPage(target)` helper OR ignore · Pair 30
  - At `app/(dashboard)/parents/[id]/profile/__shared__/makeParentProfileRedirectPage.tsx`
  - Try factory; fallback to jscpd-ignore pattern + justification in deferred-items if fragile
  - QL: sub-loop on each file (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/6.2-parent-profile-redirect-outcome.md`
  - _Requirements: AC-7_

- [ ] 6.3 `makeUserProfilePage(mode)` helper OR ignore · Pair 31
  - At `app/(dashboard)/users/[id]/profile/__shared__/makeUserProfilePage.tsx`
  - Factory shareable by `users/[id]/profile/page.tsx[1:1-11:37]` and `users/[id]/profile/edit/page.tsx[1:1-11:37]`
  - Fallback: jscpd-ignore `**/users/[id]/profile/**/page.tsx` with justification
  - QL: sub-loop on each file (codescene)
  - Outcome: `.ai/plans/duplications-phase4/outcome/6.3-user-profile-page-outcome.md`
  - _Requirements: AC-7_

---

## Phase 7: Review Gates & Final Verification

- [ ] 7.1 Plan review gate (run BEFORE Phase 1)
  - Invoke the `plan-review` skill on the Phase 4 plan (requirements/design/tasks)
  - Fix all violations; re-run until skill reports "Plan passes all AGENTS.md rules"
  - Write outcome: `.ai/plans/duplications-phase4/outcome/plan-review-R1.md`

- [ ] 7.2 Mid-point review gate (after Phase 4 backend tasks complete, before Phase 5)
  - Dispatch scoped review subagents in parallel:
    - `review-types` (scope: all new `__shared__/` type files)
    - `review-backend` (scope: all `backend/` files modified in Phases 1-4)
    - `review-config` (scope: env-config, drizzle, codegen, jscpd) — only if Phase 4 touched config
  - Filter: backend-specific findings only
  - Dispatch fix subagents per file using `backend.instructions.md` as guardrail; each runs `sub-loop.ts --lifecycle codescene`
  - Re-run until zero backend-specific findings
  - Write outcome: `.ai/plans/duplications-phase4/outcome/midpoint-review-R1.md`

- [ ] 7.3 Post-implementation review (after all Phase 1-6 tasks complete)
  - Dispatch scoped review subagents in parallel (same as 7.2, expanded to include all modified files)
  - Severity-aggregate findings; deduplicate
  - Filter to new code only (`git diff --name-only` vs. baseline)
  - Dispatch fix subagents per file cluster (1 per 3-5 files) — each runs `sub-loop.ts --lifecycle codescene`
  - Re-run until zero feature-specific findings
  - Write outcome: `.ai/plans/duplications-phase4/outcome/post-implementation-review-R1.md`

- [ ] 7.4 Final jscpd + quality gate verification
  - Re-run `bun check:duplicates 2>&1 | tee /tmp/phase4-final-jscpd.txt`
  - Verify in-scope pairs (app/shared/backend/scripts/codegen) reduced by ≥31 vs Phase 3 baseline (528 → target 525-28-2=...calculate via diff vs `/tmp/phase4-baseline-jscpd.txt`)
  - Run `bun quality-gate:fresh` (tsgo + oxlint + biome + lint + codescene)
  - ~~Run focused test suite — SKIPPED per No-Server-Tests Policy~~
  - Verify all deferred items resolved: `grep -c "❌\|⚠️" .ai/plans/duplications-phase4/deferred-items.md` returns 0 (excluding template/doc text)
  - Write outcome: `.ai/plans/duplications-phase4/outcome/7.4-final-verification-outcome.md`
  - _Requirements: AC-8_

---

## Phase 8: Knowledge Propagation

- [ ] 8.1 Resolve deferred items ledger
  - Verify `.ai/plans/duplications-phase4/deferred-items.md` has no ❌/⚠️ rows
  - Carry-forward any pending items to a future phase (e.g. jscpd-ignore entries with a dedicated audit task)
  - Outcome: `.ai/plans/duplications-phase4/outcome/8.1-deferred-items-resolution-outcome.md`

- [ ] 8.2 Knowledge propagation (✅ after everything else)
  - Read all outcome files in `.ai/plans/duplications-phase4/outcome/`
  - Create docs:
    - `docs/i18n/cross-layer-enum-migration.md` — cross-layer enum delete/codemod pattern (currency/timezone/class-instance-detail workflow)
    - `docs/backend/service-base-pattern.md` — `ParentServiceBase`, `resolveTeacherId`, `prepareMeetingConfigUpsert`, `build*InsertPayload`, `createAuthSession` patterns
    - `docs/graphql/pothos-field-factories.md` — `_*Fields(t,…)` + `make*QueryField` idioms
  - Update existing doc:
    - `docs/backend/billing-repo-factory.md` — add `makeBillingUpsertMany` section
  - Update AGENTS.md files:
    - Root `AGENTS.md` Important References — add new docs
    - `backend/services/AGENTS.md` — reference `service-base-pattern.md`
    - `backend/graphql/AGENTS.md` — reference `pothos-field-factories.md`
    - `backend/db/repo/AGENTS.md` — reference updated `billing-repo-factory.md`
    - `backend/types/AGENTS.md` — cross-layer enum migration note
    - `shared/AGENTS.md` — confirm `shared/constants/` as canonical cross-layer enum home
  - Update instructions:
    - `.agents/instructions/backend.instructions.md` — add cross-layer enum rule (delete backend copy) + Pothos field factory rule
  - Update skills:
    - `.agents/skills/spec-driven-development/SKILL.md` — no change (skill already covers domain artifact updates)
  - QL: sub-loop on each modified doc/AGENTS.md/instruction file (codescene — docs may not run codescene; biome:check is sufficient for `.md`)
  - SR: confirm root `AGENTS.md` Important References section lists the new docs
  - Outcome: `.ai/plans/duplications-phase4/outcome/8.2-knowledge-propagation-outcome.md`
  - _Requirements: AC-9_

---

## Summary

- **528 clones** at start → target **≤497 clones** project-wide (528 minus ~31 in-scope eliminated; remaining ~5 → jscpd-ignore + frontend phase)
- **Phases 1-6** parallel subagent-dispatched within each phase; Phase 1 sequential (enum cleanup); Phase 4 sequential (schema helper depends on Phase 4.1)
- **Phases 7-8** orchestrator-only (reviews + propagation)
- ⛔ No server tests. ⛔ No UI tests. ⛔ No GraphQL tests. ⛔ No Next.js build.
- ✅ Quality loop is sole verification.
