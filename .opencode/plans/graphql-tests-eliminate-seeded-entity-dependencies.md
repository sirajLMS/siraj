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

## Execution Phases

### Phase 1: Backend — Extend `createTestEntities` + Add `cleanupTestManager`

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

4. Run codegen: `bun run generate:gqlSchema && bun codegen`

**Subagent instructions:** Modify all 3 backend/frontend files, then loop quality checks on each. Run codegen after all 3 pass. Then quality-check the generated files.

---

### Phase 2: helpers.ts Cleanup

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

**Subagent instructions:** Modify helpers.ts, run quality loop until clean.

---

### Phase 3: Update `frontend/graphql/test/AGENTS.md` Rule 6

**File modified:** `frontend/graphql/test/AGENTS.md`

Replace Rule 6 with:

> 6. **Use Provisioned Test Entities for Search & Assertions**:
>    - Avoid hardcoding search strings or expected names (e.g., `"Default Teacher"`). Instead, provision test entities via `loginAndProvision()` or `provisionTestEntities()` and use the returned entity names (e.g., `teacherName`, `parentName`, `studentName`) for search parameters and assertions. This ensures tests are self-contained and don't depend on seed data consistency.
>    - Authentication role lookups (e.g., `loginDemoUser("academy_admin")`) are acceptable since they only provide auth tokens, not entity references.
>    - Do not import or reference `@/shared/demo-users` for entity data — demo users are seed data and must not be relied upon in tests.

**Subagent instructions:** Modify AGENTS.md, run quality loop.

---

### Phase 4: teacher.test.ts Refactor

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

**Subagent instructions:** Modify teacher.test.ts, run quality loop, run test with `bun run scripts/run-test/run-test.ts frontend/graphql/test/teacher.test.ts`, check `--last` for pass/fail.

---

### Phase 5: parent.test.ts Refactor

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

**Subagent instructions:** Modify parent.test.ts, run quality loop, run test.

---

### Phase 6: manager-directory-graphql.test.ts Refactor

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

**Subagent instructions:** Modify manager-directory-graphql.test.ts, run quality loop, run test.

---

### Phase 7: billing-management.test.ts Refactor

**File modified:** `frontend/graphql/test/billing-management.test.ts`

**Replace** `loginAndGetParentId()` helper (lines 15-30) with `loginAndProvision()` in each describe block.

Both `describe` blocks:
1. Provision via `loginAndProvision("BillingTest")`
2. Use returned `parentId` for all invoice operations
3. Add `afterAll` with `cleanupTestEntitiesMutationDocument`

**Subagent instructions:** Modify billing-management.test.ts, run quality loop, run test.

---

### Phase 8: report.test.ts Refactor

**File modified:** `frontend/graphql/test/report.test.ts`

In the masking test (lines 47-106):
1. `loginAndProvision("ReportTest")` — get test teacher with `teacherUserId` and `teacherToken`
2. Use `teacherUserId` instead of querying `meQuery` for `teacher_default`'s userId
3. Use `teacherToken` for the report query with masked financials (instead of `teacher_default` token)
4. Assign temp permission group to provisioned `teacherUserId`
5. Keep existing cleanup (revoke + delete permission group)
6. Add `afterAll` with `cleanupTestEntitiesMutationDocument`

The first test (full financial data for admin) doesn't use any seeded entity ID — keep as-is.

**Subagent instructions:** Modify report.test.ts, run quality loop, run test.

---

### Phase 9: schedule.test.ts Refactor (most complex)

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

**Subagent instructions:** Modify schedule.test.ts, run quality loop, run test. This file is the most complex — may need multiple test runs with `--last --focus` to debug.

---

### Phase 10: student-directory-graphql.test.ts Refactor

**File modified:** `frontend/graphql/test/student-directory-graphql.test.ts`

1. Provision via `loginAndProvision("StudentDirTest")` in each describe block
2. For positive assertions: search by `studentName` or `parentName` in directory results, assert the provisioned student appears
3. Auth-denial tests: no change (role-only, no entity dependency)
4. Add `afterAll` cleanup

**Subagent instructions:** Modify student-directory-graphql.test.ts, run quality loop, run test.

---

### Phase 11: Final Verification

After all phases complete:

1. Run full GraphQL test suite: `bun run scripts/run-test/run-test.ts frontend/graphql/test/`
2. Check results: `bun run scripts/run-test/run-test.ts --last frontend/graphql/test/`
3. If failures found, use `--last --focus "<pattern>"` to debug specific tests
4. Run `bun quality-gate:fresh` for comprehensive quality verification
5. All checks must pass: tsgo, biome, lint, codescene, sonar

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

## Dependency Order

```
Phase 1 (backend) → codegen → Phase 2 (helpers) → Phase 3 (AGENTS.md) → Phases 4-10 (tests, can run in parallel after 2+3)
```

Phases 4-10 are independent of each other and can be parallelized across subagents once Phases 1-3 are complete.
