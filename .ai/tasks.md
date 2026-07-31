# Task Breakdown: Neon HTTP Single-Fetch Client Rollout

**Target Directory:** `.ai/plans/neon-http-rollout`
**Outcome Directory:** `.ai/plans/neon-http-rollout/outcome`
**Parent Plan:** `.ai/plans/neon/` (Task 1.2 — Neon HTTP Single-Fetch Helper)
**Supersedes:** `.ai/plans/neon/neon_http/tasks_deepseek4pro.md`
**Phase:** 3 — Actionable Task Breakdown
**Related Spec:** [spec.md](spec.md)
**Related Design:** [design.md](design.md)

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**
   Before executing ANY task, the executing agent MUST read ALL existing files in
   `.ai/plans/neon-http-rollout/outcome/` to absorb prior research, search results, docs, and pitfalls
   so analysis is not repeated.

2. **Per-File Quality Verification Loop (Immediate post-edit):**
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint
   queue for target file) BEFORE moving to another file or subtask.

3. **Global Health Check (Completion Gate):**
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`,
   and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.

4. **Post-Execution Outcome File Creation:**
   Upon completing the task implementation and quality checks, write a new outcome document under
   `.ai/plans/neon-http-rollout/outcome/<task-id>-outcome.md` summarizing research, analysis,
   changes, and carry-over knowledge.

5. **Task Progress Tracking:**
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon
   successful completion.

---

## Mandatory Subtasks for Every Implementation Task

**EVERY implementation task (X.Y) MUST include these subtasks:**

### Quality Loop Subtask (X.Y.QL)
```markdown
- [ ] X.Y.QL **Quality Loop**: Per-file verification on `<file-path>`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file
  - Fix all errors before proceeding
```

### Instruction Verification Subtask (X.Y.IV)
```markdown
- [ ] X.Y.IV **Instruction Verification**: Validate `<file-path>` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/<layer>/AGENTS.md`, ...
  - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, ...
  - (Use absolute paths from the Layer-to-Instructions mapping table below)
```

### Layer-to-Instructions Mapping (Reference for ALL Plans)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Schema | `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Repos | `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Types | `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Enums | `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Scripts | `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | (none) |
| App Router | `/home/ahmed/Projects/siraj/app/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Test UI | `/home/ahmed/Projects/siraj/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

### Drizzle Schema Convention (Reference)
- **Schema changes** (new tables, columns, indexes): `bun run db push` — creates schema automatically
- **Custom SQL migrations** (seed data, complex transforms): `bun db migrate` — for non-Drizzle SQL only

---

## Implementation Overview

### Implementation Strategy
- **Foundation-first:** Build the env-gating guard (Task 1.1) before any consumer migration.
- **Pilot-then-batch:** Migrate the single hottest repository (`user.repository.ts`) as a pilot (Task 2.1),
  verify with `me` GraphQL query + repo tests, then roll out the full ~52-file batch in one wave
  (Task 3.1) using a dynamic 16-worker parent orchestrator.
- **Repo-layer seam only:** Per `backend/AGENTS.md`, services delegate to repositories and do not import
  `db` directly. Only `backend/db/repo/**/*.repository.ts` files change.
- **Transaction safety by construction:** Every migrated method uses the ternary
  `tx ? tx : (isNeonHttpEligible() ? getNeonHttpDb() : db)` — the `tx` branch NEVER reaches `httpDb`.
- **Prepared-statement replacement:** Non-tx branches that currently use module-level prepared statements
  are replaced with plain `httpDb.select(...)` queries (the `neon-http` driver does not support
  `.prepare()`).

### Development Approach
- **Testing Strategy:** Unit tests for the guard matrix; pilot repo test + `test:graphql` `me` query;
  full `test:db`, `test:services`, `test:graphql` after batch.
- **Integration Strategy:** Each subagent handles ONE file, restricted to that file's eligible methods.
- **Deployment Strategy:** The kill-switch `DB_NEON_HTTP_ENABLED=false` enables runtime rollback
  without redeploy.

---

## Implementation Plan

### Phase 1: Foundation & Guard

- [ ] 1.1 **Env-Gating Guard (`isNeonHttpEligible()` + internal helper guards)**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` AND `.ai/plans/neon/outcome/`.
  - Add `isNeonHttpEligible(): boolean` to `backend/db/connection-strategy.ts` (alongside
    `resolveConnectionStrategy`). Logic:
    1. `DB_NEON_HTTP_ENABLED === "false"` → `false` (kill-switch).
    2. `getStringEnv("DB_PROVIDER", "neon").toLowerCase() !== "neon"` → `false`.
    3. `getConnectionMode() === "pg"` → `false` (explicit pg-pooled override wins).
    4. `new URL(getEnvironmentConfig().databaseUrl).hostname` does not match `/\.neon\.tech$/` → `false`.
    5. Otherwise → `true`.
  - Re-export `isNeonHttpEligible` from `backend/db/drizzleDb.ts` next to the existing
    `getNeonHttpDb` re-export (`drizzleDb.ts:71`).
  - Modify `getNeonHttpClient()` (`backend/db/http-client.ts:47-52`) and `getNeonHttpDb()` (`:60-65`)
    to throw a clear `Error("Neon HTTP client is not eligible for the current environment: …")`
    when `!isNeonHttpEligible()` BEFORE singleton initialization.
  - Extend `backend/db/test/connection-strategy.test.ts` with `isNeonHttpEligible()` matrix tests
    (returns `true` for Neon host + provider; `false` for `postgres` provider; `false` for
    `DB_CONNECTION_MODE=pg`; `false` for `localhost`/non-Neon hostname; `false` for
    `DB_NEON_HTTP_ENABLED=false`). Add `DB_NEON_HTTP_ENABLED` to the `ENV_KEYS` snapshot list.
  - Create NEW `backend/db/test/http-client.test.ts` asserting `getNeonHttpDb()`/`getNeonHttpClient()`
    throw `Error` matching `/Neon HTTP client is not eligible/` when fed a non-Neon `DATABASE_URL`
    even with `DB_PROVIDER=neon`.
  - Run per-file quality verification on `connection-strategy.ts`, `http-client.ts`, `drizzleDb.ts`,
    `connection-strategy.test.ts`, `http-client.test.ts`.
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/1.1-env-gating-guard-outcome.md`.
  - Update progress: Mark task 1.1 as `[x]` in `tasks.md`.
  - _Requirements: Spec R1_

### Phase 2: Repository Pilot

- [ ] 2.1 **Pilot: `backend/db/repo/users/user.repository.ts` (6 non-tx read methods)**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` AND `.ai/plans/neon/outcome/`.
  - Migrate the **non-tx branches** of these 6 methods to use the ternary
    `tx ? tx : (isNeonHttpEligible() ? getNeonHttpDb() : db)`:
    1. `findById(id)` — line ~107 (currently uses `findByIdPrepared.execute` on non-tx)
    2. `findSafeById(id, tx?)` — line ~112 (prepared `findSafeByIdPrepared` on non-tx)
    3. `findByEmail(email)` — line ~167 (prepared `findByEmailPrepared.execute` on non-tx)
    4. `loadByIds(ids, locale)` — line ~223 (plain `db.select().from(users).where(inArray(...))`)
    5. `findDisplayCurrenciesByIds(ids)` — line ~150 (plain `db.select().from(users)...`)
    6. `existsByEmail(email, tx?)` — line ~88 (prepared `existsByEmailPrepared.execute` on non-tx)
  - For methods 1, 2, 3, 6: replace the non-tx prepared-statement branch with a plain
    `httpDb.select(...).from(users).where(eq(...)).limit(1)` (or `.where(inArray(...))` for
    `loadByIds`). The prepared-statement modules (`findByIdPrepared`, `findSafeByIdPrepared`,
    `findByEmailPrepared`, `existsByEmailPrepared`) remain in the file ONLY if they are still used
    inside `tx` branches; if they were used only on the non-tx branch and are now unused, remove
    them (dead code).
  - For methods 4, 5: already plain queries — just swap the `tx ?? db` fallback to the ternary.
  - Preserve the `tx` branch exactly (when `tx` is passed, use `tx` — NEVER `httpDb`).
  - Run per-file quality verification on `user.repository.ts`.
  - Run targeted unit test: `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts`.
  - Run GraphQL integration test exercising the `me` query: `bun run test:graphql` (or targeted
    `bun run test frontend/common/graphql/sharedDocuments/users/`).
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/2.1-user-repository-pilot-outcome.md`.
  - Update progress: Mark task 2.1 as `[x]` in `tasks.md`.
  - _Requirements: Spec R2, R4, R5_

### Phase 3: Repository Batch Rollout (Dynamic 16-Worker Pool Watcher)

- [ ] 3.1 **Full Clean-Repo Batch Rollout (~52 files, one subagent per file)**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` AND `.ai/plans/neon/outcome/`.
  - Gather context from `backend/db/repo/AGENTS.md`, `backend/AGENTS.md`, and
    `.agents/instructions/backend.instructions.md`.
  - Spawn **Parent Orchestration Subagent** to manage the rollout across the 52 target files.
  - Parent Orchestrator creates and manages tracking state file
    `.ai/plans/neon-http-rollout/repo-rollout-tracker.json` (schema below).
  - Parent Orchestrator maintains a **continuous watcher loop** to maximize concurrency at
    **exactly 16 running subagents**:
    - Monitors running subagent status and immediately spawns a new subagent whenever a worker
      completes or a slot opens up.
    - Each nested subagent is assigned a **single repository file** from the target list below.
    - Each nested subagent receives full absolute plan file paths (`spec.md`, `design.md`,
      `tasks.md`), parent task context, and relevant `AGENTS.md` / instruction rules.
    - Each nested subagent is strictly restricted to its assigned single repository file (MUST NOT
      modify any other file).
    - Each nested subagent reads all existing files in `.ai/plans/neon-http-rollout/outcome/` AND
      `.ai/plans/neon/outcome/` before starting.
    - Each nested subagent applies the migration pattern to **every eligible method** of its
      assigned file (see the per-file method list in the table below):
      - For each read method whose non-tx branch currently runs against `db` (or a prepared
        statement against `db`): replace the non-tx branch with
        `tx ? tx : (isNeonHttpEligible() ? getNeonHttpDb() : db)`.
      - For non-tx prepared-statement branches: replace with plain `httpDb.select(...)` query.
      - Leave writes, multi-query pipelines, always-tx-wrapped reads, and the session repository
        entirely untouched.
    - Each nested subagent runs per-file quality verification (`tsgo` + `biome` + `lint-queue`)
      on its assigned file.
    - Each nested subagent writes its file outcome document
      `.ai/plans/neon-http-rollout/outcome/3.1-<repo-slug>-outcome.md`.
    - Parent Orchestrator updates `.ai/plans/neon-http-rollout/repo-rollout-tracker.json` with
      completed file status and subagent IDs.
  - **Target Files (52 files, ordered by impact — each subagent handles ONE file):**

| # | File (absolute) | Methods to Migrate (non-tx reads) | Methods Left Untouched (writes / multi-query / always-tx / session) | Top Hot-Path Callers |
|---|-----------------|-----------------------------------|---------------------------------------------------------------------|----------------------|
| 1 | `/home/ahmed/Projects/siraj/backend/db/repo/shared/system-settings.repository.ts` | `getByKey`, `getIntValue`, `getStringValue`, `getBooleanValue`, `getJsonValue` | — | `fx-provider-config.service.ts`, `environment-config.service.ts`, `system-settings.service.ts`, `system-rules.service.ts`, `class-instance-expiry.service.ts`, `complaint.service.ts`, `schedule.service.ts` |
| 2 | `/home/ahmed/Projects/siraj/backend/db/repo/shared/timezone.repository.ts` | `listAll`, `findByIanaIds` | — | `resolve-viewer-timezone.ts`, `scheduling-queries/daily-schedule.repository.ts` |
| 3 | `/home/ahmed/Projects/siraj/backend/db/repo/shared/ratelimit.repository.ts` | `isLocked` | `recordAttempt` (stored-proc write), `resetAttempts`, `cleanupExpired` | `auth-input-validation`, login guard |
| 4 | `/home/ahmed/Projects/siraj/backend/db/repo/shared/cache.repository.ts` | `get`, `countByKeyPrefix`, `ttl` | `set`, `incr`, `updateExpiryByPrefix`, `deleteByPrefixAndScore`, `del`, `insertIfNotExists`, `deleteExpired`, `ping` (2 queries) | `PostgresCacheAdapter` (rate-limit/session cache fallback) |
| 5 | `/home/ahmed/Projects/siraj/backend/db/repo/users/session-config.repository.ts` | `listAll`, `findByRoleName`, `findById`, `listByRoleNames` | — | settings/admin listing |
| 6 | `/home/ahmed/Projects/siraj/backend/db/repo/teachers/teacher.repository.ts` | `findByUserId`, `findById`, `findByUserIds`, `searchTeachers`, `getTeacherDirectoryMetrics`, `getTeacherProfileForEdit` | `create`, `updateTeacherProfile`, `upsertByUserId`, `getTeacherDirectory` (paginated: 2 queries) | teacher-portal resolvers, `teacher-dashboard.service.ts`, `billing-management.service.ts`, `parent-portal.service.ts` |
| 7 | `/home/ahmed/Projects/siraj/backend/db/repo/teachers/teacher-due.repository.ts` | `getPendingDues`, `getPendingDuesSummary` | `create`, `markAsPaid`, `findByClassInstanceId`, `findByTeacherAndPeriod`, `getMonthlyReport` (3 dependent queries) | teacher-due dashboard resolver |
| 8 | `/home/ahmed/Projects/siraj/backend/db/repo/teachers/teacher-notes.repository.ts` | `getActiveNotes`, `listAllNotes`, `findByTitles` | `createNote`, `updateNote`, `deleteNote`, `createMany` (all `db.transaction`) | teacher-notes feed resolver, admin notes management |
| 9 | `/home/ahmed/Projects/siraj/backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts` | `findWindowByTeacherAndDay`, `findRecurringByTeacherAndDay`, `findVacationByTeacherId` | `upsertAvailabilityWindow`, `createRecurringIfMissing`, `createVacationIfMissing` (read-then-write) | availability bootstrap/seeder |
| 10 | `/home/ahmed/Projects/siraj/backend/db/repo/teachers/teacher-payment.repository.ts` | `findByTeacherAndPaymentDates` | — | payment idempotency |
| 11 | `/home/ahmed/Projects/siraj/backend/db/repo/students/student.repository.ts` | `findById`, `findProfileById`, `getStudentIdByUserId`, `fetchWithFilters`, `listByIds`, `count*` (all prepared/no-tx reads) | `createStudent`, `partiallyUpdate`, `changeStatus`, `deleteById`, `addClasses`, `deductClasses`, `upsertMany` | `students/*.query.ts`, `credit.service.ts`, `billing-management.service.ts`, `student-history.service.ts` |
| 12 | `/home/ahmed/Projects/siraj/backend/db/repo/students/student-history.repository.ts` | `getMonthlyMetrics`, `getMonthlyCalendar`, `getSessionDetail` | — | `student-history.service.ts` |
| 13 | `/home/ahmed/Projects/siraj/backend/db/repo/students/student-progress.repository.ts` | (read methods per pattern) | — | progress resolvers |
| 14 | `/home/ahmed/Projects/siraj/backend/db/repo/students/student-status-history.repository.ts` | `getByStudentId`, `listBy*` | — | status-history resolvers |
| 15 | `/home/ahmed/Projects/siraj/backend/db/repo/classes/class-category.repository.ts` | `listCategories`, `loadByIds`, `getCategoryById`, `findBySlugs` | `createCategory`, `updateCategory`, `deleteCategory`, `upsertMany` | class-category query resolvers, seeders |
| 16 | `/home/ahmed/Projects/siraj/backend/db/repo/classes/class-subject.repository.ts` | `listSubjects`, `getSubjectById`, `getSubjectBySlug`, `findBySlugs` | `createSubject`, `updateSubject`, `deleteSubject`, `upsertMany` | subject query resolvers, onboarding |
| 17 | `/home/ahmed/Projects/siraj/backend/db/repo/classes/class-performance.repository.ts` | `getByClassInstanceId`, `listByClassInstanceIds` | `upsertForClassInstance`, `upsertMany` (writes + `db.transaction`) | lesson-report/class-instance resolvers, DataLoader batch |
| 18 | `/home/ahmed/Projects/siraj/backend/db/repo/classes/group-class.repository.ts` | `getByClassInstanceId`, `getById`, `getEnrollments`, `getCommunications`, `getEnrollmentsWithStudentDetails`, `listByClassInstanceIds`, `findEnrollmentKeys`, `findEnrollmentsByKeys`, `listGroupClassIdsWithCommunications` | `create`, `createEnrollments`, `createCommunication`, `updateAdminNote`, `createMany`, `createManyEnrollments`, `createManyCommunications` (writes/tx) | group-class field resolvers, DataLoader batch |
| 19 | `/home/ahmed/Projects/siraj/backend/db/repo/classes/lesson-report.repository.ts` | `findByClassInstanceId`, `findById`, `findPendingReviews`, `findRecentApproved`, `findForStudent`, `countRecentApproved`, `countForStudent`, `countPendingReviews`, `findByIdempotencyKeys` | `create`, `updateStatus`, `updateReviewedBy`, `updateStudentNotes` (writes) | lesson-report query resolvers, admin dashboard |
| 20 | `/home/ahmed/Projects/siraj/backend/db/repo/classes/subject-resource.repository.ts` | `listResourcesForSubject`, `loadResourcesBySubjectIds` | `attachResource`, `detachResource`, `reorderResource`, `createMany` (writes, `runInTx`) | subject-resources field resolver, DataLoader batch |
| 21 | `/home/ahmed/Projects/siraj/backend/db/repo/books/book.repository.ts` | `findMany`, `findById`, `findByNames` | `deleteBook` (soft-delete), `upsertMany` (tx) | book query resolver, `BooksAndBagsPage` Server Component |
| 22 | `/home/ahmed/Projects/siraj/backend/db/repo/fx-sync.repository.ts` | `getLatestSyncRun`, `getRunningSyncRun`, `isRecentSuccess` | — | FX admin UI / sync-status, FX ingestion guard |
| 23 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/billing.repository.ts` | `getLatestExchangeRateForDisplay`, `listLatestExchangeRates`, `getPaymentsByInvoiceId`, `getRoundingRules`, `getStudentsWithCreditStatus`, `getInvoiceById`, `findInvoicesByIdempotencyKeys`, `findPaymentsByIdempotencyKeys`, `findInvoiceCoverageMonthsByInvoiceIds` | `getLatestExchangeRate` (throws on staleness, called inside tx), `listExchangeRateHistory` (paginated: 2 queries), `getUnpaidInvoicesSummary` (4+ queries), `getInvoicesForParent` (paginated: 2), `getAllInvoices` (paginated: 2), `getAdminBillingSummary` (5 queries), `getParentBillingSummary` (4+ queries), all `create*`/`update*`/`upsert*`/`markInvoiceAsPaid`/`recordPayment`/`setInvoicePaymentPending`/`updateInvoiceStatus`/`deleteInvoice` | `fx-display.service.ts`, `fx-rate-query.service.ts`, `billing-payment-proof.helpers.ts`, `billing-history.service.ts`, `billing-management.service.ts` |
| 24 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/credit.repository.ts` | `getBalance` (bare-db path), `getTransactions` (bare-db path), `countTransactions` (bare-db path), `findByIdempotencyKeys`, `findByClassInstanceId` (bare-db path), `aggregateBalanceFromLedger` (bare-db path) | `create`, `markAsPaid`, `upsertMany` (writes/tx) | `credit.service.ts` (passes `db` for bare paths) |
| 25 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/currency.repository.ts` | `listAll`, `listActive`, `getByCode`, `isCurrencyInUse` | `upsertMany`, `deactivateByCode` (writes) | `currency.service.ts` (bare calls) |
| 26 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/currency-hedge.repository.ts` | `listAll`, `getById`, `findByCurrencies` | `create`, `update`, `deleteById`, `createMany` (writes) | `currency-hedge.service.ts` (bare calls) |
| 27 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/invoice-payment-submission.repository.ts` | `getPendingByInvoiceId`, `getLatestByInvoiceId`, `findByInvoiceIds` | `createMany`, `createManyIfMissing` (writes) | `billing-payment-proof.helpers.ts`, `billing-management.service.ts` |
| 28 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/user-payment-method.repository.ts` | `listByUserId`, `getById`, `listDefaultsByUserId`, `findDefaultForSlot` | `create`, `update`, `deleteById`, `clearDefaultsInSlot`, `setVerified` (writes) | `payment-method.service.ts` |
| 29 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/supported-mobile-wallet.repository.ts` | `listAll`, `listActive`, `getById`, `getBySlug`, `listByIds` | `create`, `update`, `deleteById`, `createMany` (writes) | payment-method/checkout services |
| 30 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/supported-online-account.repository.ts` | `listAll`, `listActive`, `getById`, `getBySlug`, `listByIds` | `create`, `update`, `deleteById`, `createMany` (writes) | payment-method/checkout services |
| 31 | `/home/ahmed/Projects/siraj/backend/db/repo/billing/supported-payment-link.repository.ts` | `listAll`, `listActive`, `getById`, `getBySlug`, `listByIds` | `create`, `update`, `deleteById`, `createMany` (writes) | payment-method/checkout services |
| 32 | `/home/ahmed/Projects/siraj/backend/db/repo/complaints/complaint.repository.ts` | `getComplaintById`, `getComplaintsByParent`, `getComplaintMetrics`, `getComplaintFiles`, `findComplaintsByIdempotencyKeys` | `getComplaintQueuePaginated` (paginated: 2 queries), `submitComplaint`, `insertComplaint`, `createResponse`, `updateResponderUserId`, `updateSubmissionStatus`, `rejectPendingForInvoice` (writes) | `complaint.service.ts`, `complaintResponses.service.ts` |
| 33 | `/home/ahmed/Projects/siraj/backend/db/repo/complaints/complaint-response.repository.ts` | `getResponsesByComplaints`, `findByComplaintId` | `createResponse`, `updateResponderUserId`, `updateSubmissionStatus` (writes) | `complaint.service.ts`, `complaintResponses.service.ts` |
| 34 | `/home/ahmed/Projects/siraj/backend/db/repo/meeting/class-meeting-config.repository.ts` | `getById`, `getByUserId`, `getByClassInstanceId`, `listByUserId`, `listActive`, `getBySlug`, `listByIds` | `upsertMeetingConfig`, `upsertMany` (4 `db.transaction` uses) | meeting-config resolvers |
| 35 | `/home/ahmed/Projects/siraj/backend/db/repo/meeting/meeting-provider.repository.ts` | `getById`, `listAll`, `listActive`, `getBySlug`, `listByIds` | `upsertMeetingProvider`, `upsertMany` (writes) | meeting-provider resolvers |
| 36 | `/home/ahmed/Projects/siraj/backend/db/repo/meeting/user-meeting-config.repository.ts` | `getById`, `getByUserId`, `getByClassInstanceId`, `listByUserId`, `listActive`, `getBySlug`, `listByIds` | `upsertUserMeetingConfig`, `upsertMany` (writes) | user-meeting-config resolvers |
| 37 | `/home/ahmed/Projects/siraj/backend/db/repo/notifications/notification-preferences.repository.ts` | `getByUserId` | `batchUpsert` (write) | `notification-dispatch.helpers.ts`, `notification-preferences.service.ts` |
| 38 | `/home/ahmed/Projects/siraj/backend/db/repo/notifications/notification.repository.ts` | `getActiveDeviceTokensForUser`, `getSmsCountInLastHour`, `getDeliveriesForUser`, `getDeliveryById`, (read methods per pattern) | `registerDeviceToken`, `createDelivery`, `createDeliveriesBatch`, `updateDeliveryStatus`, `recordDeliveryOpened`, `deactivateDeviceToken`, `createManyDeliveries`, `batchUpsert` (writes) | `channels/{sms,push,fcm}`, `communication.service.ts`, `notification-alerts.service.ts` |
| 39 | `/home/ahmed/Projects/siraj/backend/db/repo/parents/parent.repository.ts` | `findByUserId`, `findByUserIds`, `getParentProfile`, `getAssociatedStudents`, `listByIds`, (read methods per pattern) | `changeLifecycleStatus`, `updateProfile`, `create`, `update`, `delete` (writes) | `parent-portal.service.ts`, `billing-payment-proof.helpers.ts`, `billing-history.service.ts`, `billing-management.service.ts`, `complaintResponses.service.ts`, `complaint.service.ts` |
| 40 | `/home/ahmed/Projects/siraj/backend/db/repo/parents/suggestion.repository.ts` | `getById`, `getByParentId`, `findBy*`, `listByStatus` | `create`, `update`, `upsertMany` (writes) | `suggestion.service.ts` |
| 41 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/class-status-events.repository.ts` | `findFirstByClassInstanceIds`, `listClassInstanceIdsWithEvents` | `createMany`, `insertManyOnConflictDoNothing` (writes, `runInTransaction`) | `class-session.service.ts`, DataLoader |
| 42 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/leave-quota-usage.repository.ts` | `findStudentPeriodQuota` | `upsertStudentPeriodQuota` (read-then-write) | `leave-request-seed.service.ts` |
| 43 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/leave-request.repository.ts` | `findByClassInstanceIds`, `findByClassInstanceId` | `createManyIfMissing` (read-then-loop-insert) | `leave-request-seed.service.ts`, `class-session.service.ts` |
| 44 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/recurring-schedule.repository.ts` | `findById`, `findDaysByScheduleId`, `listByStudentIds`, `findDaysByKeys` | `upsertMany`, `upsertManyDays`, `updateRate` (writes) | `recurring-schedule-detail.service.ts`, `teacher-due.service.ts`, `recurring-class.service.ts` |
| 45 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/scheduling-queries.repository/class-status-events.repository.ts` | `getClassStatusEvents`, `getTeacherProgressFeed` | — | class-session/timeline resolver, teacher dashboard feed |
| 46 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/scheduling-queries.repository/expired-instances.repository.ts` | `findExpiredPendingInstances` | — | `class-instance-expiry.service.ts` |
| 47 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts` | `getTeacherLeaveQuotaUsage`, `getTeacherByUserId` | `incrementTeacherLeaveQuota` (write + settings read + possibly insert) | `class-session.service.ts`, `system-rules.service.ts` |
| 48 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/scheduling-queries.repository/student-classes.repository.ts` | `getStudentFutureClasses`, `getUpcomingClassesForStudent` | `bulkFreezeStudentClasses`, `bulkUnfreezeStudentClasses`, `setStudentClassesFrozenState` (always-tx writes) | student dashboard resolver |
| 49 | `/home/ahmed/Projects/siraj/backend/db/repo/scheduling/scheduling-queries.repository/teacher-schedule.repository.ts` | `getTeacherFutureClasses`, `getWeeklyScheduleGrid`, `getWeeklyWorkloadMetrics`, `getTeacherAssignedClasses` | — | teacher schedule/dashboard resolvers (very hot) |
| 50 | `/home/ahmed/Projects/siraj/backend/db/repo/storage/learning-resource.repository.ts` | `getById`, `getByIds`, `findBy*`, `listBy*` | `upsert*`, `createSnapshot` (writes) | subject-resource + storage resolvers |
| 51 | `/home/ahmed/Projects/siraj/backend/db/repo/storage/site-content.repository.ts` | (content lookups per pattern) | `upsert*` (writes) | site-content resolvers |
| 52 | `/home/ahmed/Projects/siraj/backend/db/repo/storage/storage.repository.ts` | (asset/snapshot read methods per pattern) | `upsert*`, `createSnapshot` (writes) | storage resolvers |

  - **Explicitly EXCLUDED files (do NOT assign to subagents):**
    - `audit/audit.repository.ts` — `queryAuditLogs` 2-query pipeline; `getAuditStatistics` always-tx
    - `auth/impersonation.repository.ts` — session/auth path deferred
    - `books/report.repository.ts` — `generateAttendanceReport` 2-dependent-query pipeline
    - `classes/dst-migration.repository.ts` — admin tooling, low hotness, deferred
    - `permissions/permission-management.repository.ts` — writes/DDL; service-layer reads go through services
    - `scheduling/scheduling-queries.repository/daily-schedule.repository.ts` — always-tx + side-effect write
    - `scheduling/scheduling-queries.repository/reschedule-tracking.repository.ts` — always-tx
    - `scheduling/scheduling-queries.repository/status-tracking.repository.ts` — always-tx
    - `shared/session.repository.ts` — **DEFER entire file** (session path)
    - `shared/signedUrl.repository.ts` — `claimSignedUrl` is `SELECT FOR UPDATE` + write
    - `shared/soft-delete.repository.ts` — all use advisory locks + tx
    - `teachers/staff-profile.repository.ts` — `getManagerDirectory` 3-query `Promise.all`; `getOnboardingMetrics`/`findBy*`/`getStaffDirectoryLite` clean reads but file has multi-query + writes — **exclude entire file** (deferred)
    - `teachers/teacher-availability.repository.ts` — `validateBookingAvailability` (3 dependent), `searchCrossStaffAvailability` (4+ dependent), all write mutators — exclude entire file
    - `teachers/teacher-notes.repository.ts` — writes use `db.transaction` (already listed as untouched methods)
    - `teachers/teacher-due.repository.ts` — `getMonthlyReport` 3 dependent queries (already listed as untouched)
    - `billing/billing.repository.ts` — multi-query methods excluded (already listed as untouched)
    - `teachers/teacher.repository.ts` — `getTeacherDirectory` paginated (2 queries) excluded (already listed as untouched)

  - Upon completion of all nested worker subagents, run full test suites:
    - `bun test:db` (Database repository tests)
    - `bun test:services` (Backend services integration tests)
    - `bun test:graphql` (GraphQL integration tests)
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write rollout summary outcome file: `.ai/plans/neon-http-rollout/outcome/3.1-repository-batch-rollout-outcome.md`.
  - Update progress: Mark task 3.1 as `[x]` in `tasks.md`.
  - _Requirements: Spec R3, R4, R5_

### Phase 4: Final Verification

- [ ] 4.1 **Full Suite Execution & Final Outcome Documentation**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` AND `.ai/plans/neon/outcome/`.
  - Execute `bun test:db`
  - Execute `bun test:services`
  - Execute `bun test:graphql`
  - Execute global health checks: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings across full repository).
  - Write comprehensive final outcome summary: `.ai/plans/neon-http-rollout/outcome/4.1-final-verification-outcome.md`.
  - Update progress: Mark task 4.1 as `[x]` in `tasks.md`.
  - _Requirements: Spec R0, R6_

### Phase 5: Knowledge Propagation (MANDATORY Final Task)

- [ ] 5.1 **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/neon-http-rollout/outcome/` AND `.ai/plans/neon/outcome/` to synthesize all learnings.
  - Create canonical reference doc `docs/drizzle/neon-http-client.md` following the docs file structure:
    - **Why**: Motivation — zero WebSocket overhead, fast cold starts, connection limit protection
    - **The Pattern**: Code examples for `isNeonHttpEligible()`, `getNeonHttpClient()`, `getNeonHttpDb()`, the `tx ? tx : (eligible ? httpDb : db)` ternary, prepared-statement replacement
    - **Rules / Conventions**: When to use HTTP vs WebSocket pool, transaction prohibition, kill-switch
    - **What NOT to Do**: Anti-patterns (transactions, multi-statement writes, sequential pipelines, unguarded `getNeonHttpDb()` calls)
    - **Rollout Summary**: Table of files modified, methods refactored, test results
    - **Related Documents**: Links to `backend/db/http-client.ts`, `backend/db/connection-strategy.ts`, `.ai/plans/neon-http-rollout/`, `docs/drizzle/prepared-statements.md`
  - If `docs/drizzle/` does not exist, create it: `mkdir -p docs/drizzle/`
  - Update layer AGENTS.md files with new rules/patterns discovered during implementation:
    - `backend/db/repo/AGENTS.md` — Add "Neon HTTP Client for Bare Reads" rule referencing `docs/drizzle/neon-http-client.md`
    - `backend/db/schema/AGENTS.md` — Note that HTTP client is orthogonal to schema (no action needed for schema files, but listed for completeness)
    - `backend/AGENTS.md` — Add HTTP client bullet to Repository Layer section
  - Update `.agents/instructions/backend.instructions.md` — Add `docs/drizzle/neon-http-client.md` as required reading for backend files
  - Update root `AGENTS.md` Important References section with `docs/drizzle/neon-http-client.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/5.1-knowledge-propagation-outcome.md`
  - Update progress: Mark task 5.1 as `[x]` in `tasks.md`
  - _Requirements: Knowledge propagation protocol (Spec-Driven Development SKILL.md § Knowledge Propagation from Plan Outcomes)_

---

## Rollout Tracker Schema

```json
{
  "totalFiles": 52,
  "maxConcurrency": 16,
  "completedFiles": [],
  "activeSubagents": {},
  "failedFiles": [],
  "pendingFiles": [
    "backend/db/repo/shared/system-settings.repository.ts",
    "backend/db/repo/shared/timezone.repository.ts",
    "backend/db/repo/shared/ratelimit.repository.ts",
    "backend/db/repo/shared/cache.repository.ts",
    "backend/db/repo/users/session-config.repository.ts",
    "backend/db/repo/teachers/teacher.repository.ts",
    "backend/db/repo/teachers/teacher-due.repository.ts",
    "backend/db/repo/teachers/teacher-notes.repository.ts",
    "backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts",
    "backend/db/repo/teachers/teacher-payment.repository.ts",
    "backend/db/repo/students/student.repository.ts",
    "backend/db/repo/students/student-history.repository.ts",
    "backend/db/repo/students/student-progress.repository.ts",
    "backend/db/repo/students/student-status-history.repository.ts",
    "backend/db/repo/classes/class-category.repository.ts",
    "backend/db/repo/classes/class-subject.repository.ts",
    "backend/db/repo/classes/class-performance.repository.ts",
    "backend/db/repo/classes/group-class.repository.ts",
    "backend/db/repo/classes/lesson-report.repository.ts",
    "backend/db/repo/classes/subject-resource.repository.ts",
    "backend/db/repo/books/book.repository.ts",
    "backend/db/repo/fx-sync.repository.ts",
    "backend/db/repo/billing/billing.repository.ts",
    "backend/db/repo/billing/credit.repository.ts",
    "backend/db/repo/billing/currency.repository.ts",
    "backend/db/repo/billing/currency-hedge.repository.ts",
    "backend/db/repo/billing/invoice-payment-submission.repository.ts",
    "backend/db/repo/billing/user-payment-method.repository.ts",
    "backend/db/repo/billing/supported-mobile-wallet.repository.ts",
    "backend/db/repo/billing/supported-online-account.repository.ts",
    "backend/db/repo/billing/supported-payment-link.repository.ts",
    "backend/db/repo/complaints/complaint.repository.ts",
    "backend/db/repo/complaints/complaint-response.repository.ts",
    "backend/db/repo/meeting/class-meeting-config.repository.ts",
    "backend/db/repo/meeting/meeting-provider.repository.ts",
    "backend/db/repo/meeting/user-meeting-config.repository.ts",
    "backend/db/repo/notifications/notification-preferences.repository.ts",
    "backend/db/repo/notifications/notification.repository.ts",
    "backend/db/repo/parents/parent.repository.ts",
    "backend/db/repo/parents/suggestion.repository.ts",
    "backend/db/repo/scheduling/class-status-events.repository.ts",
    "backend/db/repo/scheduling/leave-quota-usage.repository.ts",
    "backend/db/repo/scheduling/leave-request.repository.ts",
    "backend/db/repo/scheduling/recurring-schedule.repository.ts",
    "backend/db/repo/scheduling/scheduling-queries.repository/class-status-events.repository.ts",
    "backend/db/repo/scheduling/scheduling-queries.repository/expired-instances.repository.ts",
    "backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts",
    "backend/db/repo/scheduling/scheduling-queries.repository/student-classes.repository.ts",
    "backend/db/repo/scheduling/scheduling-queries.repository/teacher-schedule.repository.ts",
    "backend/db/repo/storage/learning-resource.repository.ts",
    "backend/db/repo/storage/site-content.repository.ts",
    "backend/db/repo/storage/storage.repository.ts"
  ]
}
```

---

## Testing & Verification Suite

| Layer | Test Command | Purpose |
|-------|-------------|---------|
| Database Repos | `bun test:db` | Verify repository tests still pass with HTTP client |
| Backend Services | `bun test:services` | Verify service integration tests still pass |
| GraphQL | `bun test:graphql` | Verify GraphQL integration tests still pass |
| Type Check | `bun tsgo` | Zero type errors |
| Format/Lint | `bun biome:check` | Zero biome errors |
| ESLint | `bun run lint` | Zero errors, zero warnings |

---

## Domain-to-Artifacts Mapping (Knowledge Propagation)

| Plan Domain | Docs Subdir | AGENTS.md to Update | Skills to Update | Instructions to Update |
|---|---|---|---|---|
| Drizzle / DB patterns | `docs/drizzle/` | `backend/db/repo/AGENTS.md`, `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` | `.agents/skills/drizzle/SKILL.md` (if exists) | `.agents/instructions/backend.instructions.md` |