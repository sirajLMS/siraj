# Plan: GraphQL Tests — Eliminate Seeded Entity Dependencies

## Goal

Refactor all GraphQL integration tests under `frontend/graphql/test/` to create their own test entities instead of depending on seeded/demo data. Only auth helpers (`loginDemoUser`, `assertOperationDenied`) remain as the sole way to reference demo users — purely for obtaining auth tokens by role, not for entity data.

## User Decisions

All decisions were collected via interactive Q&A:

| Area | Decision |
|---|---|
| teacher.test.ts mutations | Use `loginAndProvision()` to create test teacher |
| parent.test.ts deactivate | Use `loginAndProvision()` to create test parent |
| parent.test.ts read queries | Use `loginAndProvision()` for all parentId references |
| manager-directory test | Provision test managers via `createManagerMutation` |
| billing-management test | Use `loginAndProvision()` for parentId |
| report.test.ts permission test | Use `loginAndProvision()` teacher instead of seeded `teacher_default` |
| schedule.test.ts queries | Provision test teacher entities |
| schedule.test.ts deletion | Provision test entities + create class instance |
| student-directory test | Provision test student, assert in directory |
| demo-users search refs | Search by provisioned entity name, not demo-users |
| manager IDOR test | Provision test managers with admin type for IDOR |
| helpers.ts cleanup | Remove unused helpers, refactor remaining, add new |
| AGENTS.md Rule 6 | Update to match new pattern (use provisioned entity names) |
| Entity names for search | Extend `createTestEntities` to return name fields |
| Manager test cleanup | Add `cleanupTestManager` mutation |

## AGENTS.md Rules Applied

| Rule | Impact |
|---|---|
| `test/AGENTS.md` Rule 6 | Rewrite: use provisioned entity names instead of demo-users |
| `test/AGENTS.md` Rule 8 | Centralize new helpers (provisionTestManager) in helpers.ts |
| `test/AGENTS.md` Rule 9 | Keep new helpers under ~70-80 lines |
| `test/AGENTS.md` Rule 10 | All provisioning via GraphQL API only |
| Main `AGENTS.md` — "NEVER query seed data" | Now applies to GraphQL tests too |
| Main `AGENTS.md` — "No comments unless asked" | No explanatory comments in code |
| Main `AGENTS.md` — lint queue server | Subagents must use `http://localhost:4777/lint` |

## Subagent Quality Loop

Every subagent MUST run this loop on each file it modifies, fixing all issues before moving to the next file:

```
for each modified file:
  while True:
    1. bun tsgo <file>
    2. bun biome:check <file>
    3. Submit to lint queue: POST http://localhost:4777/lint with { id: "<phase>-<file>", files: ["<file>"] }
    If all 3 pass → break (move to next file)
    If any fail → fix issues, retry the loop
```

The lint queue server must already be running (`bun run scripts/lint-queue-server.ts`) before dispatching subagents.

For running GraphQL tests, subagents MUST use the run-test wrapper (not raw `bun test`):

```bash
bun run scripts/run-test/run-test.ts frontend/graphql/test/<test-file>
bun run scripts/run-test/run-test.ts --last frontend/graphql/test/<test-file>
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" frontend/graphql/test/<test-file>
```

---

## Mandatory Commands per Change Type

Before implementing any phase, the subagent MUST run the required post-change commands based on what was modified. **Skipping any of these causes cascading type/codegen errors that break all downstream phases.**

| Change Type | Required Commands (in order) | When Required |
|---|---|---|
| Database schema change (drizzle schema files) | `bun db` → select option `8` (cleanGenerate = Reset → Gen → Migrate → Seed) | Adding/modifying columns, tables, indexes |
| Backend GraphQL/Pothos schema change | `bun run generate:gqlSchema && bun codegen` | Adding/modifying mutations, queries, types, fields |
| Frontend GraphQL document change | `bun codegen` | Adding/modifying `*.documents.ts` files |
| Any code change | Quality loop (tsgo → biome → lint queue) | Every modified file |

**Critical sequencing rule:** If a phase modifies both backend Pothos schema AND frontend documents, run `bun run generate:gqlSchema && bun codegen` AFTER both are changed, then quality-check the generated files before proceeding. If a phase also touches DB schema, `bun db` cleanGenerate must run FIRST (before codegen) since codegen depends on the running DB having the new schema.

**Do NOT mark a phase as complete until ALL of its required commands have passed.** A phase that modifies backend GraphQL but skips codegen will produce stale types that cause every downstream phase to fail.

---

## Execution Phases

### Phase 1: Backend — Extend `createTestEntities` + Add `cleanupTestManager`

**Depends on:** Nothing (root phase)

**Files modified:**
- `backend/services/system/test-helper.service.ts`
- `backend/graphql/mutation/test-helper.mutation.ts`
- `frontend/graphql/sharedDocuments/test-helper.documents.ts`

**Changes:**

1. `backend/services/system/test-helper.service.ts`:
   - Add `teacherName`, `parentName`, `studentName` string fields to `TestEntitiesResult` (line 19-29)
   - Populate in return object (line 198-208): `teacherName: teacherUserRow.name`, `parentName: parentUserRow.name`, `studentName: `${prefix} Student``
   - Add `cleanupTestManager(userId: string): Promise<boolean>` method — deletes user permission groups, staff profile, user record (in correct FK order)

2. `backend/graphql/mutation/test-helper.mutation.ts`:
   - Add `teacherName`, `parentName`, `studentName` String fields to `createTestEntities` return type
   - Add `cleanupTestManager` mutation field — accepts `userId: String!`, delegates to `TestHelperService.cleanupTestManager`

3. `frontend/graphql/sharedDocuments/test-helper.documents.ts`:
   - Add `teacherName`, `parentName`, `studentName` to `createTestEntitiesMutationDocument` selection set
   - Add `cleanupTestManagerMutationDocument` — mutation with `$userId: String!` arg, returns Boolean

**Mandatory post-change commands (ALL must pass before marking complete):**
1. If any DB schema was touched: `bun db` → option `8` (cleanGenerate)
2. `bun run generate:gqlSchema && bun codegen` (Pothos schema changed + frontend document changed)
3. Quality loop on ALL modified files AND generated files under `frontend/graphql/generated/`

**Subagent instructions:** Modify all 3 backend/frontend files, then run the mandatory commands in order (codegen after both Pothos + document changes). Then quality-check the generated files. **Do NOT proceed to Phase 2 until codegen succeeds and generated files pass quality checks.**

**Completion criteria:**
- [ ] All 3 files modified
- [ ] `bun run generate:gqlSchema` passes
- [ ] `bun codegen` passes
- [ ] Quality loop passes on all modified + generated files
- [ ] Test smoke: `bun run scripts/run-test/run-test.ts frontend/graphql/test/` — existing tests still pass

---

### Phase 2: helpers.ts Cleanup

**Depends on:** Phase 1 (needs generated types from Phase 1's codegen)

**File modified:** `frontend/graphql/test/helpers.ts`

**Remove:**
- `fetchDemoTeacherId()` (lines 191-204)
- `fetchNonDefaultTeacherId()` (lines 206-218)
- `fetchFirstStudentTeacherPair()` (lines 158-189)
- Import: `teachers as demoTeachers` from `@/shared/demo-users` (line 3)
- Import: `teachersQueryDocument` from `../sharedDocuments/teacher.documents` (line 8)
- Import: `dailyScheduleListQueryDocument` from `../sharedDocuments/schedule.documents` (line 7) — verify still needed after `fetchFirstClassInstanceId` refactor

**Refactor:**
- `fetchFirstClassInstanceId()` (lines 220-261): Remove the "try existing data first" path (lines 223-229). Always provision via `provisionTestEntities` + `mutateCreateRecurringClass` + query grid. Simplify the function.
- `provisionTestEntities()` (lines 71-94): Add `teacherName`, `parentName`, `studentName` to return (now available from Phase 1)
- `loginAndProvision()` (lines 106-122): Add `teacherName`, `parentName`, `studentName` to return object

**Add:**
- Import `createManagerMutationDocument` from `../sharedDocuments/manager-onboarding.documents`
- Import `cleanupTestManagerMutationDocument` from `../sharedDocuments/test-helper.documents`
- `provisionTestManager(superAdminToken, prefix, accountType)` — Calls `createManagerMutationDocument`, returns `{ userId, staffProfileId, name, assignedGroupSlug }`. Keep under 70-80 lines per Rule 9.

**Mandatory post-change commands:**
1. Quality loop on `helpers.ts`
2. No codegen needed (no schema/document changes, only test helper code)

**Completion criteria:**
- [ ] All removals and additions done
- [ ] Quality loop passes on helpers.ts
- [ ] No import errors (verify generated types exist from Phase 1)

---

### Phase 3: Update `frontend/graphql/test/AGENTS.md` Rule 6

**Depends on:** Phase 2 (AGENTS.md rules must reflect the actual helper API after Phase 2 refactors)

**File modified:** `frontend/graphql/test/AGENTS.md`

Replace Rule 6 with:

> 6. **Use Provisioned Test Entities for Search & Assertions**:
>    - Avoid hardcoding search strings or expected names (e.g., `"Default Teacher"`). Instead, provision test entities via `loginAndProvision()` or `provisionTestEntities()` and use the returned entity names (e.g., `teacherName`, `parentName`, `studentName`) for search parameters and assertions. This ensures tests are self-contained and don't depend on seed data consistency.
>    - Authentication role lookups (e.g., `loginDemoUser("academy_admin")`) are acceptable since they only provide auth tokens, not entity references.
>    - Do not import or reference `@/shared/demo-users` for entity data — demo users are seed data and must not be relied upon in tests.

**Completion criteria:**
- [ ] Rule 6 replaced
- [ ] Content accurately reflects the new helper API from Phase 2

---

### Phase 4: teacher.test.ts Refactor

**Depends on:** Phase 2 (needs `loginAndProvision` returning `teacherName`, `cleanupTestEntitiesMutationDocument`)

**File modified:** `frontend/graphql/test/teacher.test.ts`

**Remove:**
- `getSeededTeacherId()` function (lines 69-83)
- `import { teachers as demoTeachers } from "@/shared/demo-users"` (line 4)
- `const expectedTeacher = demoTeachers[0]` (lines 85-86)

**Add:**
- Import `loginAndProvision`, `cleanupTestEntitiesMutationDocument` from helpers
- Provision at suite start via `loginAndProvision("TeacherTest")`, store all IDs + names
- Add `afterAll` with `cleanupTestEntitiesMutationDocument`

**Test changes:**

| Test | Change |
|---|---|
| Login test (line 100-102) | Replace with `loginAndProvision("TeacherTest")` — store `adminToken`, `teacherId`, `teacherName`, `teacherToken`, etc. |
| "returns list of teachers" (lines 104-120) | Assert `teachersList.some(t => t.name === r.teacherName)` |
| "filters list by search query" (lines 122-132) | Search by `teacherName`, assert match |
| "teacherProfileForEdit — admin read" (lines 174-187) | Use `teacherId` from provision |
| "teacherProfileForEdit — teacher denied" (lines 189-192) | Use `teacherId` from provision (just for variable, auth uses `teacher_default` role) |
| "updateTeacherProfile — teacher denied" (lines 194-200) | Use `teacherId` from provision |
| "updateTeacherProfile — non-existent" (lines 202-234) | No change (uses NIL_UUID) |
| "updateTeacherProfile — admin can update" (lines 236-263) | Use `teacherId` — now mutates provisioned teacher |
| "updateTeacherProfile — admin can edit any" (lines 265-291) | Use `teacherId` — now mutates provisioned teacher |

**Mandatory post-change commands:**
1. Quality loop on `teacher.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/teacher.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/teacher.test.ts`
4. All tests must pass before marking complete

**Completion criteria:**
- [ ] All test changes implemented
- [ ] Quality loop passes
- [ ] All tests pass (green)
- [ ] No references to `demoTeachers` or `getSeededTeacherId` remain

---

### Phase 5: parent.test.ts Refactor

**Depends on:** Phase 2 (needs `loginAndProvision` returning `parentId`/`parentName`/`studentName`, `cleanupTestEntitiesMutationDocument`)

**File modified:** `frontend/graphql/test/parent.test.ts`

All 7 `describe` blocks. Each one that needs entity IDs provisions its own test entities.

| Describe Block | Change |
|---|---|
| parentDirectory (lines 15-89) | Provision via `loginAndProvision("ParentDirTest")`, search by `parentName` instead of `"Default Parent"`, add afterAll cleanup |
| parentProfile (lines 92-152) | Provision via `loginAndProvision("ParentProfTest")`, use `parentId` — remove directory lookup at lines 107-114, add afterAll |
| parentAssociatedStudents (lines 154-195) | Provision via `loginAndProvision("ParentAssocTest")`, use `parentId`, add afterAll |
| deactivateParent (lines 197-247) | Provision via `loginAndProvision("ParentDeactTest")`, use `parentId` — remove seeded-parent lookup, add afterAll |
| updateStudentQuota (lines 249-282) | Provision via `loginAndProvision("StudentQuotaTest")`, use `studentId`, add afterAll |
| parentInvoiceHistory (lines 284-327) | Provision via `loginAndProvision("ParentInvTest")`, use `parentId`, add afterAll |
| parentDocuments (lines 329-361) | Provision via `loginAndProvision("ParentDocTest")`, use `parentId`, add afterAll |

**Mandatory post-change commands:**
1. Quality loop on `parent.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/parent.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/parent.test.ts`
4. All tests must pass before marking complete

**Completion criteria:**
- [ ] All 7 describe blocks refactored
- [ ] Quality loop passes
- [ ] All tests pass (green)
- [ ] No references to seeded parent data remain

---

### Phase 6: manager-directory-graphql.test.ts Refactor

**Depends on:** Phase 2 (needs `provisionTestManager`, `cleanupTestManagerMutationDocument`)

**File modified:** `frontend/graphql/test/manager-directory-graphql.test.ts`

**Add at suite start:**
1. Login as `super_admin`
2. Provision two test managers via `provisionTestManager()`:
   - Admin type: `provisionTestManager(superAdminToken, "MgrIDORTest", "admin")` — gets `super_admin` group, for IDOR target
   - Manager type: `provisionTestManager(superAdminToken, "MgrUpdateTest", "manager")` — gets `staff_default` group, for update tests

**Replace:**
- `testUpdateManagerProfile()` helper: target the provisioned manager's `staffProfileId` instead of finding `staff_default`
- IDOR test (lines 111-147): attempt to update the provisioned admin-type manager as `academy_admin`
- Directory query tests: keep read-only (results now include provisioned managers)
- "non-existent profile" test: no change (uses NIL_UUID)

**Cleanup:** Add `afterAll` calling `cleanupTestManagerMutationDocument` for both provisioned managers (by `userId`).

**Mandatory post-change commands:**
1. Quality loop on `manager-directory-graphql.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/manager-directory-graphql.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/manager-directory-graphql.test.ts`
4. All tests must pass before marking complete

**Completion criteria:**
- [ ] Both test managers provisioned at suite start
- [ ] IDOR + update tests use provisioned managers
- [ ] afterAll cleanup added for both managers
- [ ] Quality loop passes
- [ ] All tests pass (green)

---

### Phase 7: billing-management.test.ts Refactor

**Depends on:** Phase 2 (needs `loginAndProvision` returning `parentId`, `cleanupTestEntitiesMutationDocument`)

**File modified:** `frontend/graphql/test/billing-management.test.ts`

**Replace** `loginAndGetParentId()` helper (lines 15-30) with `loginAndProvision()` in each describe block.

Both `describe` blocks:
1. Provision via `loginAndProvision("BillingTest")`
2. Use returned `parentId` for all invoice operations
3. Add `afterAll` with `cleanupTestEntitiesMutationDocument`

**Mandatory post-change commands:**
1. Quality loop on `billing-management.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/billing-management.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/billing-management.test.ts`
4. All tests must pass before marking complete

**Completion criteria:**
- [ ] `loginAndGetParentId()` removed
- [ ] Both describe blocks use `loginAndProvision`
- [ ] afterAll cleanup added
- [ ] Quality loop passes
- [ ] All tests pass (green)

---

### Phase 8: report.test.ts Refactor

**Depends on:** Phase 2 (needs `loginAndProvision` returning `teacherUserId`/`teacherToken`, `cleanupTestEntitiesMutationDocument`)

**File modified:** `frontend/graphql/test/report.test.ts`

In the masking test (lines 47-106):
1. `loginAndProvision("ReportTest")` — get test teacher with `teacherUserId` and `teacherToken`
2. Use `teacherUserId` instead of querying `meQuery` for `teacher_default`'s userId
3. Use `teacherToken` for the report query with masked financials (instead of `teacher_default` token)
4. Assign temp permission group to provisioned `teacherUserId`
5. Keep existing cleanup (revoke + delete permission group)
6. Add `afterAll` with `cleanupTestEntitiesMutationDocument`

The first test (full financial data for admin) doesn't use any seeded entity ID — keep as-is.

**Mandatory post-change commands:**
1. Quality loop on `report.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/report.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/report.test.ts`
4. All tests must pass before marking complete

**Completion criteria:**
- [ ] Masking test uses provisioned teacher
- [ ] No seeded entity references in masking test
- [ ] afterAll cleanup added
- [ ] Quality loop passes
- [ ] All tests pass (green)

---

### Phase 9: schedule.test.ts Refactor (most complex)

**Depends on:** Phase 2 (needs `loginAndProvision`, `provisionTestEntities`, `cleanupTestEntitiesMutationDocument`), Phase 2 (needs refactored `fetchFirstClassInstanceId` that uses provisioning)

**File modified:** `frontend/graphql/test/schedule.test.ts`

**Remove imports:** `fetchDemoTeacherId`, `fetchNonDefaultTeacherId`, `fetchFirstClassInstanceId`

**At suite start:**
1. `loginAndProvision("SchedTest")` → `teacherId`, `studentId`, `teacherName`, `teacherToken`, `adminToken`
2. `provisionTestEntities(adminToken, "SchedTest2")` → `secondTeacherId` for cross-teacher access test

**Test changes:**

| Test | Change |
|---|---|
| "returns daily schedule metrics" | No entity dependency — keep |
| "returns daily schedule list" | No entity dependency — keep |
| "dailyScheduleList with search param" | Search by `teacherName` instead of `demoTeachers[0].name` |
| "dailyScheduleList with metricFilter" | No change |
| "adminDashboardSchedule" | No change |
| "teacher denied with search arg" | Search by `teacherName` instead of `demoTeachers[0].name` |
| "teacherWeeklyScheduleGrid for admin" | Use provisioned `teacherId` instead of `fetchDemoTeacherId()` |
| "teacherWeeklyScheduleGrid own schedule" | Keep (uses `teacher_default` login, `teacherId: null`) |
| "teacherWeeklyScheduleGrid cross-teacher" | Use `secondTeacherId` instead of `fetchNonDefaultTeacherId()` |
| "teacherWorkloadMetrics for admin" | Use provisioned `teacherId` |
| "teacherWorkloadMetrics own metrics" | Keep (uses `teacher_default` login) |
| "createRecurringClass denied" | Keep (uses fake IDs) |
| "DST bulk update" | No change |
| "deleteRecurringClass — teacher denied" | Create class instance for provisioned teacher/student, use that `classInstanceId` |
| "clearWeeklySchedule — teacher denied" | Use provisioned `teacherId` |
| "deleteRecurringClass — admin succeeds" | Use provisioned class instance |

**Add** `afterAll` cleanup for both provisioned entity sets via `cleanupTestEntitiesMutationDocument`.

**Mandatory post-change commands:**
1. Quality loop on `schedule.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/schedule.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/schedule.test.ts`
4. May need multiple test runs with `--last --focus "<pattern>"` to debug — this file is the most complex
5. All tests must pass before marking complete

**Completion criteria:**
- [ ] All demo-user imports removed
- [ ] All `fetchDemoTeacherId`/`fetchNonDefaultTeacherId`/`fetchFirstClassInstanceId` usages replaced
- [ ] afterAll cleanup for both entity sets
- [ ] Quality loop passes
- [ ] All tests pass (green)
- [ ] Search params use `teacherName` from provisioning, not hardcoded demo name

---

### Phase 10: student-directory-graphql.test.ts Refactor

**Depends on:** Phase 2 (needs `loginAndProvision` returning `studentName`/`parentName`, `cleanupTestEntitiesMutationDocument`)

**File modified:** `frontend/graphql/test/student-directory-graphql.test.ts`

1. Provision via `loginAndProvision("StudentDirTest")` in each describe block
2. For positive assertions: search by `studentName` or `parentName` in directory results, assert the provisioned student appears
3. Auth-denial tests: no change (role-only, no entity dependency)
4. Add `afterAll` cleanup

**Mandatory post-change commands:**
1. Quality loop on `student-directory-graphql.test.ts`
2. Run test: `bun run scripts/run-test/run-test.ts frontend/graphql/test/student-directory-graphql.test.ts`
3. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/student-directory-graphql.test.ts`
4. All tests must pass before marking complete

**Completion criteria:**
- [ ] All describe blocks use provisioned entities
- [ ] Search assertions use `studentName`/`parentName`
- [ ] afterAll cleanup added
- [ ] Quality loop passes
- [ ] All tests pass (green)

---

### Phase 11: Final Verification

**Depends on:** All phases 1-10 must be FULLY complete (all their completion criteria met)

After all phases complete:

1. Run full GraphQL test suite: `bun run scripts/run-test/run-test.ts frontend/graphql/test/`
2. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/`
3. If failures found, use `--last --focus "<pattern>"` to debug specific tests
4. Run `bun quality-gate:fresh` for comprehensive quality verification
5. All checks must pass: tsgo, biome, lint, codescene, sonar

**Completion criteria:**
- [ ] Full GraphQL test suite passes (green)
- [ ] `bun quality-gate:fresh` passes all stages
- [ ] No file has references to `demo-users` for entity data (auth-only is OK)

---

## File Change Summary

| File | Phase | Change Type |
|---|---|---|
| `backend/services/system/test-helper.service.ts` | 1 | Add name fields to result, add cleanupTestManager |
| `backend/graphql/mutation/test-helper.mutation.ts` | 1 | Add name fields + cleanupTestManager mutation |
| `frontend/graphql/sharedDocuments/test-helper.documents.ts` | 1 | Add name fields + cleanupTestManager document |
| `frontend/graphql/test/helpers.ts` | 2 | Remove 3 helpers, refactor 1, add provisionTestManager |
| `frontend/graphql/test/AGENTS.md` | 3 | Update Rule 6 |
| `frontend/graphql/test/teacher.test.ts` | 4 | Replace seeded teacher with provisioned |
| `frontend/graphql/test/parent.test.ts` | 5 | Replace all seeded parent refs with provisioned |
| `frontend/graphql/test/manager-directory-graphql.test.ts` | 6 | Provision test managers |
| `frontend/graphql/test/billing-management.test.ts` | 7 | Replace loginAndGetParentId with loginAndProvision |
| `frontend/graphql/test/report.test.ts` | 8 | Use provisioned teacher for permission testing |
| `frontend/graphql/test/schedule.test.ts` | 9 | Full refactor, all entity refs use provisioned |
| `frontend/graphql/test/student-directory-graphql.test.ts` | 10 | Provision test student |

## Dependency Graph

```
Phase 1 (backend + codegen)
  └─→ Phase 2 (helpers.ts)
        ├─→ Phase 3 (AGENTS.md)
        ├─→ Phase 4 (teacher.test.ts)
        ├─→ Phase 5 (parent.test.ts)
        ├─→ Phase 6 (manager-directory.test.ts)
        ├─→ Phase 7 (billing-management.test.ts)
        ├─→ Phase 8 (report.test.ts)
        ├─→ Phase 9 (schedule.test.ts)
        └─→ Phase 10 (student-directory.test.ts)
              └─→ Phase 11 (final verification, depends on ALL 1-10)
```

**Strict rules:**
- Phase 1 MUST complete (including `bun run generate:gqlSchema && bun codegen`) before Phase 2 starts — otherwise helpers.ts will have missing/stale types
- Phase 2 MUST complete before Phases 3-10 start — otherwise tests will import helpers that don't exist yet
- Phases 4-10 CAN run in parallel (they are independent of each other)
- Phase 11 MUST NOT start until ALL of Phases 1-10 have met their completion criteria
- If Phase 1 fails (e.g., codegen errors), STOP. Do not proceed to Phase 2 — it will cascade errors.
- If any Phase 4-10 test fails after implementation, fix that phase independently before reporting completion — do not rely on Phase 11 to catch bugs
