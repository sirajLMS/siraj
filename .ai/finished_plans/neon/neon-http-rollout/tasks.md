# Task Breakdown: Neon HTTP Single-Fetch Client Rollout

**Target Directory:** `.ai/plans/neon-http-rollout`
**Outcome Directory:** `.ai/plans/neon-http-rollout/outcome`
**Rollout Tracker:** `.ai/plans/neon-http-rollout/repo-rollout-tracker.json`
**Phase:** 3 — Actionable Task Breakdown
**Related Spec:** [spec.md](spec.md)
**Related Design:** [design.md](design.md)
**Supersedes:** `.ai/plans/neon/neon_http/tasks_deepseek4pro.md`

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**
   Before executing ANY task, the executing agent MUST read ALL existing files in
   `.ai/plans/neon-http-rollout/outcome/` AND `.ai/plans/neon/outcome/` to absorb prior research,
   search results, docs, and pitfalls so analysis is not repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):**
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` +
   lint queue for target file) BEFORE moving to another file or subtask.
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

## Migration Pattern Reference (All Subagents Must Follow)

### Standard non-tx read branch swap

```typescript
// BEFORE
export async function findById(id: string, tx?: DBTransaction) {
  const queryDb = tx ?? db;
  return queryDb.select().from(table).where(eq(table.id, id)).limit(1);
}

// AFTER
import { queryDb } from "@/backend/db";
export async function findById(id: string, tx?: DBTransaction) {
  const q = queryDb(tx);
  return q.select().from(table).where(eq(table.id, id)).limit(1);
}
```

### Prepared-statement non-tx branch replacement

```typescript
// BEFORE (prepared statement on non-tx path)
const findByIdPrepared = db.select().from(users)
  .where(eq(users.id, sql.placeholder("id"))).prepare("findById");
export async function findById(id: string, tx?: DBTransaction) {
  if (tx) return tx.select().from(users).where(eq(users.id, id)).limit(1);
  return findByIdPrepared.execute({ id });
}

// AFTER (plain query on non-tx path; prepared stmt removed if now unused)
import { queryDb } from "@/backend/db";
export async function findById(id: string, tx?: DBTransaction) {
  const q = queryDb(tx);
  return q.select().from(users).where(eq(users.id, id)).limit(1);
}
```

### Key rules (MUST NOT violate)

- `queryDb(tx)` — `tx` wins first, ALWAYS.
- NEVER call `.transaction(...)` on HTTP drivers — `queryDb(tx)` avoids this by prioritizing `tx`.
- NEVER migrate write methods (`create*`, `update*`, `delete*`, `upsert*`).
- NEVER migrate multi-query pipelines (`Promise.all` data+count, sequential dependent sub-queries).
- NEVER migrate methods that always wrap in `db.transaction()` when `!tx`.
- ONLY migrate the methods listed in the Phase 3 table for the assigned file.
- Remove a prepared-statement module ONLY if it is now unused (was only used on the non-tx branch).

---

## Layer-to-Instructions Mapping (All Subagents Must Read)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Repos | `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Backend DB (connection-strategy, http-client) | `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |

---

## Task List

### Phase 1: Foundation & Guard

- [x] 1.1 **Add `isNeonHttpEligible()`, `getActiveHttpProvider()`, `getStatelessHttpDb()`, and `queryDb(tx)` factory handle**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/`.
  - Read AGENTS.md files: `/home/ahmed/Projects/siraj/backend/AGENTS.md`,
    `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`.
  - Read instruction file: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`.
  - **Edit `backend/db/connection-strategy.ts`:**
    - Add `export function isNeonHttpEligible(): boolean` implementing the 5-gate logic:
      1. `DB_NEON_HTTP_ENABLED === "false"` → `false`
      2. `getStringEnv("DB_PROVIDER", "neon").toLowerCase() !== "neon"` → `false`
      3. `getConnectionMode() === "pg"` → `false`
      4. `new URL(getEnvironmentConfig().databaseUrl).hostname` does not match `/\.neon\.tech$/` → `false`
      5. Otherwise → `true`
    - Add `export function getActiveHttpProvider(): "neon" | "supabase" | "none"`:
      - Returns `"neon"` if `isNeonHttpEligible()`, else `"none"`.
    - Reuse existing `getStringEnv`, `getConnectionMode`, `getEnvironmentConfig` — no new imports.
  - **Edit `backend/db/http-client.ts`:**
    - Import `isNeonHttpEligible` from `@/backend/db/connection-strategy`.
    - In `getNeonHttpClient()` (before singleton init): throw `Error("Neon HTTP client is not eligible…")` when `!isNeonHttpEligible()`.
    - In `getNeonHttpDb()` (before singleton init): same guard.
  - **Edit `backend/db/drizzleDb.ts`:**
    - Implement `getStatelessHttpDb()` using `getGlobalSingleton(Symbol.for("siraj.httpDb"), ...)`.
    - Implement and export `queryDb(tx?: DBTransaction)`:
      - Returns `tx` if present; otherwise `getStatelessHttpDb() ?? db`.
    - Re-export `isNeonHttpEligible` and `getActiveHttpProvider`.
  - **Edit `backend/db/test/connection-strategy.test.ts`:**
    - Add `isNeonHttpEligible` and `getActiveHttpProvider` to imports.
    - Add `"DB_NEON_HTTP_ENABLED"` to the `ENV_KEYS` snapshot list.
    - Add test matrix: eligible (neon provider + neon.tech host + no pg mode + no kill-switch);
      not eligible for each failing gate (postgres provider, pg mode, localhost host, kill-switch false).
  - **Create `backend/db/test/http-client.test.ts`:**
    - Assert `queryDb()` returns `db` on non-eligible envs and returns `httpDb` on eligible envs.
    - Assert `queryDb(tx)` always returns `tx` regardless of eligibility.
    - Assert `getNeonHttpDb()` and `getNeonHttpClient()` throw `Error` matching
      `/Neon HTTP client is not eligible/` when `DATABASE_URL` is a non-Neon host even with `DB_PROVIDER=neon`.
  - Run per-file quality verification on each modified/created file.
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/1.1-env-gating-guard-outcome.md`.
  - Update progress: Mark task 1.1 as `[x]` in `tasks.md`.
  - _Requirements: R1, R0_

- [x] 1.2 **Create `test/integration/db/query-db.integration.test.ts` (Provider Integration Smoke)**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/`.
  - Read AGENTS.md file: `/home/ahmed/Projects/siraj/test/integration/AGENTS.md`.
  - Read instruction file: `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`.
  - **Create `test/integration/db/query-db.integration.test.ts`:**
    - Import `describeLiveWhen` from `@/test/integration/helpers/describe-live`.
    - Import `queryDb`, `getNeonHttpDb` from `@/backend/db`.
    - Import `testLogger` from `@/shared/lib/logger/testlogger`.
    - Import `sql` from `drizzle-orm`.
    - Set up gating condition:
      `const neonUrl = process.env.NEON_TEST_DATABASE_URL;`
      `const hasNeonTestUrl = Boolean(neonUrl && !neonUrl.includes("ep-example"));`
    - Use `const describeLive = describeLiveWhen(hasNeonTestUrl, "queryDb HTTP integration @db");`.
    - Inside `describeLive`, add test: `"queryDb executes live HTTP SELECT 1 query against NEON_TEST_DATABASE_URL"`:
      - When `NEON_TEST_DATABASE_URL` is set, execute live HTTP POST query using `queryDb().execute(sql`SELECT 1 as test`)` (or direct `getNeonHttpDb()`).
      - Assert `result.rows[0].test === 1`.
      - Log success with `testLogger.info("queryDb live HTTP integration smoke passed")` (NEVER `console.log`).
  - Run per-file quality verification (`bun tsgo` + `bun biome:check` + lint queue) on `test/integration/db/query-db.integration.test.ts`.
  - Run provider integration suite: `bun --env-file=.env.test test test/integration/db/query-db.integration.test.ts`.
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/1.2-query-db-integration-test-outcome.md`.
  - Update progress: Mark task 1.2 as `[x]` in `tasks.md`.
  - _Requirements: R1.1, R0_

---

### Phase 2: Repository Pilot

- [x] 2.1 **Migrate `user.repository.ts` non-tx read paths (pilot)**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/`.
  - Read AGENTS.md files: `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`,
    `/home/ahmed/Projects/siraj/backend/AGENTS.md`.
  - Read instruction file: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`.
  - Read `docs/drizzle/prepared-statements.md` (prepared-statement pattern reference).
  - **Edit `backend/db/repo/users/user.repository.ts`:**
    - Add import: `import { queryDb } from "@/backend/db";`
    - Migrate these 6 methods' non-tx branches (replace `tx ?? db` and prepared-stmt non-tx branches):
      1. `findById(id)` — replace `findByIdPrepared.execute({id})` with plain `queryDb(tx).select()…`.
      2. `findSafeById(id, tx?)` — `!tx` branch: replace prepared stmt with plain query over `queryDb(tx)`.
      3. `findByEmail(email)` — replace `findByEmailPrepared.execute({email})` with plain query over `queryDb(tx)`.
      4. `loadByIds(ids, locale)` — replace `db.select(…)` with `queryDb(tx)`.
      5. `findDisplayCurrenciesByIds(ids)` — replace `db.select(…)` with `queryDb(tx)`.
      6. `existsByEmail(email, tx?)` — `!tx` branch: replace prepared stmt with plain query over `queryDb(tx)`.
    - Remove prepared-statement module-level declarations ONLY if now unused (verify no remaining `tx`-branch usage before removing).
    - Leave ALL write methods, `findUsers`, `findUsersPaginated`, `usersTotalCount`, `findAll` untouched.
  - Run per-file quality verification on `backend/db/repo/users/user.repository.ts`.
  - Run targeted test: `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts`
  - Run `bun test:graphql` to verify the `me` query still works.
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/2.1-user-repository-pilot-outcome.md`.
  - Update progress: Mark task 2.1 as `[x]` in `tasks.md`.
  - _Requirements: R2, R4, R5, R0_

---

### Phase 3: Repository Batch Rollout (Dynamic 16-Worker Pool Watcher)

- [x] 3.1 **Full repository batch rollout**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/`.
  - Gather context from `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`,
    `/home/ahmed/Projects/siraj/backend/AGENTS.md`, and
    `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`.
  - Spawn **Parent Orchestration Subagent** to manage the rollout across the 52 target files below.
  - Parent Orchestrator creates and manages tracking state file
    `.ai/plans/neon-http-rollout/repo-rollout-tracker.json` (schema at bottom of this file).
  - Parent Orchestrator maintains a **continuous watcher loop** to maximize concurrency at **exactly
    16 running subagents**:
    - Monitors running subagent status and immediately spawns a new subagent whenever a worker
      completes or a slot opens up.
    - Each nested subagent is assigned a **single file** from the target list below.
    - Each nested subagent receives:
      - Full absolute plan file paths (`spec.md`, `design.md`, `tasks.md`).
      - The migration pattern reference from this file (§ Migration Pattern Reference above).
      - The eligible-methods list for its assigned file (from the table below).
      - Absolute paths to all applicable AGENTS.md and instruction files (from Layer-to-Instructions mapping above).
    - Each nested subagent is strictly restricted to its assigned single file (MUST NOT modify any other file).
    - Each nested subagent reads all existing files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/` before starting.
    - Each nested subagent migrates ONLY the eligible methods listed for its file.
    - Each nested subagent runs per-file quality verification (`tsgo` + `biome` + `lint-queue`) on its assigned file.
    - Each nested subagent writes its file outcome document `.ai/plans/neon-http-rollout/outcome/3.1-<file-slug>-outcome.md`.
    - Parent Orchestrator updates `.ai/plans/neon-http-rollout/repo-rollout-tracker.json` with completed file status and subagent IDs.
  - Upon completion of all nested worker subagents, run full test suites:
    - `bun test:db`
    - `bun test:services`
    - `bun test:graphql`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write rollout summary outcome file: `.ai/plans/neon-http-rollout/outcome/3.1-repository-batch-rollout-outcome.md`.
  - Update progress: Mark task 3.1 as `[x]` in `tasks.md`.
  - _Requirements: R3, R4, R5, R0_

#### Phase 3 Target Files (52 files)

> **Legend:** "Eligible methods" = the non-tx read methods to migrate. "Leave untouched" = writes, multi-query pipelines, always-tx reads, or tx-branch of eligible methods.

| # | File (relative to project root) | Eligible methods to migrate | Leave untouched |
|---|---|---|---|
| 1 | `backend/db/repo/shared/system-settings.repository.ts` | `getByKey`, `getIntValue`, `getStringValue`, `getBooleanValue`, `getJsonValue` | — |
| 2 | `backend/db/repo/shared/timezone.repository.ts` | `listAll` (!tx — replace prepared stmt), `findByIanaIds` | — |
| 3 | `backend/db/repo/shared/ratelimit.repository.ts` | `isLocked` | `recordAttempt` (stored-proc write), `resetAttempts`, `cleanupExpired` |
| 4 | `backend/db/repo/shared/cache.repository.ts` | `get`, `countByKeyPrefix`, `ttl`, `ping` | `set`, `incr`, `del`, `insertIfNotExists`, `updateExpiryByPrefix`, `deleteByPrefixAndScore`, `deleteExpired` |
| 5 | `backend/db/repo/users/session-config.repository.ts` | `listAll` (!tx — replace prepared stmt), `findByRoleName` (!tx — replace prepared stmt), `findById` (!tx — replace prepared stmt), `listByRoleNames` | — |
| 6 | `backend/db/repo/teachers/teacher.repository.ts` | `findByUserId` (!tx — replace prepared stmt), `findById` (!tx — replace prepared stmt), `findByUserIds`, `searchTeachers`, `getTeacherDirectoryMetrics`, `getTeacherProfileForEdit` | `getTeacherDirectory` (2-query Promise.all), `create`, `updateTeacherProfile`, `upsertByUserId` |
| 7 | `backend/db/repo/teachers/teacher-due.repository.ts` | `findByClassInstanceId`, `findByTeacherAndPeriod`, `getPendingDues`, `getPendingDuesSummary` | `getMonthlyReport` (3-query pipeline), `create`, `markAsPaid` |
| 8 | `backend/db/repo/teachers/teacher-notes.repository.ts` | `getActiveNotes`, `listAllNotes`, `findByTitles` | `createNote`, `updateNote`, `deleteNote`, `createMany` (all use `db.transaction`) |
| 9 | `backend/db/repo/teachers/teacher-availability-bootstrap.repository.ts` | `findWindowByTeacherAndDay`, `findRecurringByTeacherAndDay`, `findVacationByTeacherId` | `upsertAvailabilityWindow`, `createRecurringIfMissing`, `createVacationIfMissing` |
| 10 | `backend/db/repo/teachers/teacher-payment.repository.ts` | `findByTeacherAndPaymentDates` | `createManyIfMissing` |
| 11 | `backend/db/repo/teachers/staff-profile.repository.ts` | `getStaffDirectoryLite`, `getOnboardingMetrics`, `findByUserId`, `findByStaffProfileId`, `getUserPermissionGroupSlugs`, `getUserPermissionGroups`, `getUserPermissionOverrides` | `getManagerDirectory` (3-query Promise.all), `create`, `ensureForUser`, `updateManagerProfile` |
| 12 | `backend/db/repo/students/student.repository.ts` | `findById`, `findProfileById`, `getStudentIdByUserId`, `fetchWithFilters`, `listByIds`, `loadByIds`, `countStudents` and any other single-read methods | `createStudent`, `partiallyUpdate`, `changeStatus`, `deleteById`, `addClasses`, `deductClasses`, `upsertMany` |
| 13 | `backend/db/repo/students/student-history.repository.ts` | `getMonthlyMetrics`, `getMonthlyCalendar`, `getSessionDetail` | — |
| 14 | `backend/db/repo/students/student-progress.repository.ts` | all read methods | any write methods |
| 15 | `backend/db/repo/students/student-status-history.repository.ts` | `getByStudentId` and any other single-read methods | any write methods |
| 16 | `backend/db/repo/classes/class-category.repository.ts` | `listCategories`, `loadByIds`, `getCategoryById`, `findBySlugs` | `createCategory`, `updateCategory`, `deleteCategory`, `upsertMany` |
| 17 | `backend/db/repo/classes/class-subject.repository.ts` | `listSubjects`, `getSubjectById`, `getSubjectBySlug`, `findBySlugs` | `createSubject`, `updateSubject`, `deleteSubject`, `upsertMany` |
| 18 | `backend/db/repo/classes/class-performance.repository.ts` | `getByClassInstanceId`, `listByClassInstanceIds` | `upsertForClassInstance`, `upsertMany` |
| 19 | `backend/db/repo/classes/group-class.repository.ts` | `getByClassInstanceId`, `getById`, `getEnrollments`, `getCommunications`, `getEnrollmentsWithStudentDetails`, `listByClassInstanceIds`, `findEnrollmentKeys`, `findEnrollmentsByKeys`, `listGroupClassIdsWithCommunications` | `create`, `createEnrollments`, `createCommunication`, `updateAdminNote`, `createMany`, `createManyEnrollments`, `createManyCommunications` |
| 20 | `backend/db/repo/classes/lesson-report.repository.ts` | `findByClassInstanceId`, `findById`, `findPendingReviews`, `findRecentApproved`, `findForStudent`, `countRecentApproved`, `countForStudent`, `countPendingReviews`, `findByIdempotencyKeys` | `create`, `updateStatus`, `updateReviewedBy`, `updateStudentNotes` |
| 21 | `backend/db/repo/classes/subject-resource.repository.ts` | `listResourcesForSubject`, `loadResourcesBySubjectIds` | `attachResource`, `detachResource`, `reorderResource`, `createMany` |
| 22 | `backend/db/repo/books/book.repository.ts` | `findMany`, `findById` (!tx — replace prepared stmt), `findByNames` | `deleteBook`, `upsertMany` |
| 23 | `backend/db/repo/books/report.repository.ts` | `calculateEngagementGrowth` | `generateAttendanceReport` (2-query pipeline) |
| 24 | `backend/db/repo/fx-sync.repository.ts` | `getLatestSyncRun` (!tx — replace prepared stmt), `getRunningSyncRun` (!tx — replace prepared stmt), `isRecentSuccess` | write methods |
| 25 | `backend/db/repo/billing/billing.repository.ts` | `getLatestExchangeRateForDisplay`, `getPaymentsByInvoiceId`, `getRoundingRules`, `getStudentsWithCreditStatus`, `getInvoiceById`, `findInvoicesByIdempotencyKeys`, `findPaymentsByIdempotencyKeys`, `findInvoiceCoverageMonthsByInvoiceIds`, `listLatestExchangeRates` | `getUnpaidInvoicesSummary` (multi-query), `listExchangeRateHistory` (paginated 2-query), `getInvoicesForParent` (paginated), `getAllInvoices` (paginated), `getAdminBillingSummary` (5-query), `getParentBillingSummary` (4-query), all write methods |
| 26 | `backend/db/repo/billing/credit.repository.ts` | `getBalance`, `getTransactions`, `countTransactions`, `findByIdempotencyKeys`, `aggregateBalanceFromLedger` (bare-db callers only — see note below table) | `findByClassInstanceId` (always called inside tx), write methods |
| 27 | `backend/db/repo/billing/currency.repository.ts` | `listAll`, `listActive`, `getByCode`, `isCurrencyInUse` | `upsertMany`, `deactivateByCode` |
| 28 | `backend/db/repo/billing/currency-hedge.repository.ts` | `listAll`, `getById`, `findByCurrencies` | `create`, `update`, `deleteById`, `createMany` |
| 29 | `backend/db/repo/billing/invoice-payment-submission.repository.ts` | `getPendingByInvoiceId`, `getLatestByInvoiceId`, `findByInvoiceIds` | `create`, `updateStatus`, `createMany` |
| 30 | `backend/db/repo/billing/user-payment-method.repository.ts` | `listByUserId`, `getById`, `listDefaultsByUserId`, `findDefaultForSlot` | `create`, `update`, `deleteById`, `clearDefaultsInSlot`, `setVerified` |
| 31 | `backend/db/repo/billing/supported-mobile-wallet.repository.ts` | `listAll`, `listActive`, `getById`, `getBySlug`, `listByIds` | `upsertMany` |
| 32 | `backend/db/repo/billing/supported-online-account.repository.ts` | `listAll`, `listActive`, `getById`, `getBySlug`, `listByIds` | `upsertMany` |
| 33 | `backend/db/repo/billing/supported-payment-link.repository.ts` | `listAll`, `listActive`, `getById`, `getBySlug`, `listByIds` | `upsertMany` |
| 34 | `backend/db/repo/complaints/complaint.repository.ts` | `getComplaintById`, `getComplaintsByParent`, `getComplaintMetrics`, `getComplaintFiles`, `findComplaintsByIdempotencyKeys` | `getComplaintQueuePaginated` (2-query paginated), write methods |
| 35 | `backend/db/repo/complaints/complaint-response.repository.ts` | `getResponsesByComplaints`, `findByComplaintId` | `createResponse`, `updateResponderUserId` |
| 36 | `backend/db/repo/meeting/class-meeting-config.repository.ts` | all read methods | `upsertMany`, `create`, `update` |
| 37 | `backend/db/repo/meeting/meeting-provider.repository.ts` | all read methods | `upsertMany`, `create`, `update` |
| 38 | `backend/db/repo/meeting/user-meeting-config.repository.ts` | all read methods | `upsertMany`, `create`, `update` |
| 39 | `backend/db/repo/notifications/notification-preferences.repository.ts` | `getByUserId` | `batchUpsert` |
| 40 | `backend/db/repo/notifications/notification.repository.ts` | `getActiveDeviceTokensForUser`, `getSmsCountInLastHour`, `getDeliveriesForUser`, `getDeliveryById` and any other single-read methods | `registerDeviceToken`, `createDelivery`, `createManyDeliveries`, `createDeliveriesBatch`, `updateDeliveryStatus`, `recordDeliveryOpened`, `deactivateDeviceToken` |
| 41 | `backend/db/repo/parents/parent.repository.ts` | `findByUserId`, `findByUserIds`, `getParentProfile`, `getAssociatedStudents`, `listByIds` and any other single-read methods | `changeLifecycleStatus`, `updateProfile`, `create`, `upsertMany` |
| 42 | `backend/db/repo/parents/suggestion.repository.ts` | `getById`, `getByParentId`, `listByStatus` and any other single-read methods | `create`, `update`, `upsertMany` |
| 43 | `backend/db/repo/scheduling/class-status-events.repository.ts` | `findFirstByClassInstanceIds`, `listClassInstanceIdsWithEvents` | `createMany`, `insertManyOnConflictDoNothing` |
| 44 | `backend/db/repo/scheduling/leave-quota-usage.repository.ts` | `findStudentPeriodQuota` | `upsertStudentPeriodQuota` |
| 45 | `backend/db/repo/scheduling/leave-request.repository.ts` | `findByClassInstanceIds`, `findByClassInstanceId` | `createManyIfMissing` |
| 46 | `backend/db/repo/scheduling/recurring-schedule.repository.ts` | `findById`, `findDaysByScheduleId`, `listByStudentIds`, `findDaysByKeys` | `upsertMany`, `upsertManyDays`, `updateRate` |
| 47 | `backend/db/repo/scheduling/scheduling-queries.repository/class-status-events.repository.ts` | `getClassStatusEvents`, `getTeacherProgressFeed` | — |
| 48 | `backend/db/repo/scheduling/scheduling-queries.repository/expired-instances.repository.ts` | `findExpiredPendingInstances` | — |
| 49 | `backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts` | `getTeacherLeaveQuotaUsage`, `getTeacherByUserId` | `incrementTeacherLeaveQuota` (write) |
| 50 | `backend/db/repo/scheduling/scheduling-queries.repository/teacher-schedule.repository.ts` | `getTeacherFutureClasses`, `getWeeklyScheduleGrid`, `getWeeklyWorkloadMetrics`, `getTeacherAssignedClasses` | — |
| 51 | `backend/db/repo/scheduling/scheduling-queries.repository/student-classes.repository.ts` | `getStudentFutureClasses`, `getUpcomingClassesForStudent` | `bulkFreezeStudentClasses`, `bulkUnfreezeStudentClasses`, `setStudentClassesFrozenState` (always-tx writes) |
| 52 | `backend/db/repo/storage/learning-resource.repository.ts` | all read methods | any write methods |
| 53 | `backend/db/repo/storage/site-content.repository.ts` | all read methods | any write methods |
| 54 | `backend/db/repo/storage/storage.repository.ts` | all single-read methods | any write methods, multi-query pipelines |

> **Note on `credit.repository.ts` (row 26):** `getBalance`, `getTransactions`, `countTransactions`,
> `aggregateBalanceFromLedger` use a mandatory first `tx` parameter typed as `ReadExecutor` (not
> optional `DBTransaction`). Callers in `credit.service.ts` pass either the module-level `db` or a
> real `tx`. The subagent MUST read the actual method signatures and caller sites before migrating.
> If changing the signature to `tx?: DBTransaction` breaks callers, leave `credit.repository.ts`
> untouched and note it in the outcome file as deferred.

#### EXCLUDED files (do NOT assign to subagents)

| File | Reason |
|------|--------|
| `backend/db/repo/users/user.repository.ts` | Pilot — done in Phase 2 |
| `backend/db/repo/shared/session.repository.ts` | Session/auth path deferred (multi-roundtrip + conditional writes) |
| `backend/db/repo/shared/signedUrl.repository.ts` | `claimSignedUrl` uses `SELECT FOR UPDATE SKIP LOCKED` + write; no clean read-only path |
| `backend/db/repo/shared/soft-delete.repository.ts` | All methods use advisory locks + `db.transaction` |
| `backend/db/repo/audit/audit.repository.ts` | `queryAuditLogs` 2-query pipeline; `getAuditStatistics` always-tx; write methods |
| `backend/db/repo/auth/impersonation.repository.ts` | Session/auth path deferred |
| `backend/db/repo/permissions/permission-management.repository.ts` | Write/DDL methods; reads go through services |
| `backend/db/repo/teachers/teacher-availability.repository.ts` | `validateBookingAvailability` 3-query pipeline; `searchCrossStaffAvailability` 4+-query; all write mutators use advisory locks |
| `backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.repository.ts` | Always-tx + side-effect write via `ClassInstanceExpiryService` |
| `backend/db/repo/scheduling/scheduling-queries.repository/reschedule-tracking.repository.ts` | Always-tx (both methods) |
| `backend/db/repo/scheduling/scheduling-queries.repository/status-tracking.repository.ts` | Always-tx |

---

### Phase 4: Final Verification

- [ ] 4.1 **Full suite execution & final outcome documentation**
  - Read all existing files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/`.
  - Execute `bun test:db` — MUST exit 0 failures.
  - Execute `bun test:services` — MUST exit 0 failures.
  - Execute `bun test:graphql` — MUST exit 0 failures.
  - Execute global health checks: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write comprehensive final outcome summary: `.ai/plans/neon-http-rollout/outcome/4.1-final-verification-outcome.md`.
  - Update progress: Mark task 4.1 as `[x]` in `tasks.md`.
  - _Requirements: R3, R6, R0_

---

### Phase 5: Knowledge Propagation (MANDATORY Final Task)

- [ ] 5.1 **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/neon-http-rollout/outcome/` and `.ai/plans/neon/outcome/` to synthesize all learnings.
  - **Create `docs/drizzle/neon-http-client.md`** (create `docs/drizzle/` if it does not exist):
    - **Why:** Zero WebSocket overhead, fast cold starts (~15-30 ms saved), connection-limit protection.
    - **The Pattern:** Code examples for `isNeonHttpEligible()`, `getNeonHttpDb()`, the `tx ?? (eligible ? httpDb : db)` ternary, and the prepared-statement replacement.
    - **Rules / Conventions:** When to use HTTP vs WebSocket pool; transaction prohibition; single-roundtrip only; no multi-query pipelines; `DB_NEON_HTTP_ENABLED` kill-switch.
    - **What NOT to Do:** Anti-patterns (calling `httpDb.transaction()`, using on non-Neon hosts, migrating multi-query pipelines, migrating always-tx reads, migrating write methods).
    - **Rollout Summary:** Table of all 53 files migrated (pilot + 52 batch), methods migrated per file, test results.
    - **Related Documents:** `backend/db/http-client.ts`, `backend/db/connection-strategy.ts`, `docs/drizzle/prepared-statements.md`, `.ai/plans/neon-http-rollout/`, `.ai/plans/neon/`.
  - **Update `backend/db/repo/AGENTS.md`:** Add "Neon HTTP Client for Bare Reads (CRITICAL)" rule referencing `docs/drizzle/neon-http-client.md`.
  - **Update `backend/AGENTS.md`:** Add HTTP-client bullet to the Repository Layer section.
  - **Update `.agents/instructions/backend.instructions.md`:** Add `docs/drizzle/neon-http-client.md` as required reading for backend repository files.
  - **Update root `AGENTS.md` Important References:** Add `docs/drizzle/neon-http-client.md`.
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon-http-rollout/outcome/5.1-knowledge-propagation-outcome.md`.
  - Update progress: Mark task 5.1 as `[x]` in `tasks.md`.
  - _Requirements: R6, R0_

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
    "backend/db/repo/teachers/staff-profile.repository.ts",
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
    "backend/db/repo/books/report.repository.ts",
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
    "backend/db/repo/scheduling/scheduling-queries.repository/teacher-schedule.repository.ts",
    "backend/db/repo/scheduling/scheduling-queries.repository/student-classes.repository.ts",
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
| Guard unit tests | `bun run scripts/run-test/run-test.ts backend/db/test/connection-strategy.test.ts` | Verify `isNeonHttpEligible()` matrix |
| HTTP-client unit tests | `bun run scripts/run-test/run-test.ts backend/db/test/http-client.test.ts` | Verify helpers throw on ineligible env |
| Pilot repo | `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts` | Verify pilot migration |
| GraphQL me query | `bun test:graphql` | Verify `me` query still works after pilot |
| Full DB repos | `bun test:db` | Verify all repo tests pass after batch |
| Backend services | `bun test:services` | Verify service integration tests pass |
| GraphQL integration | `bun test:graphql` | Verify GraphQL integration tests pass |
| Type check | `bun tsgo` | Zero type errors |
| Format/Lint | `bun biome:check` | Zero biome errors |
| ESLint | `bun run lint` | Zero errors, zero warnings |
