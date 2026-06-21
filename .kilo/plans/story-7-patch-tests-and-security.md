# Story 7 Patch Plan — Missing Tests, Security Coverage & Mock Store Cleanup

**Source plan:** `.kilo/plans/story-7-permissions-and-permission-groups.md` (fully implemented)
**Patch scope:** Address 5 core gaps: (1) missing GraphQL integration tests for 3 features, (2) missing security test coverage for Section 4 threats, (3) repository coverage verification at 100%, (4) security logic tests for DB trigger compatibility, (5) residual mock store type import.
**Status:** Planning phase — awaiting approval for execution.

---

## Section 0: Patch Context

### What's Already Implemented (No Action Needed)
- All 4 services — clean, no prohibited DB imports, repo-only dependency
- All repository methods — `deleteRecurringClass`, `clearWeeklySchedule`, `updateTeacherProfile`, parent directory queries
- All Pothos types, mutations, queries — exist and registered in indexes
- All frontend GraphQL documents — 4 `.documents.ts` files with proper `TypedDocumentNode`
- All `RequirePermission` wrappers — correct permissions on all 4 containers
- All translations — English and Arabic complete
- Schedule deletion repo tests — 4 tests passing (2 `deleteRecurringClass` + 2 `clearWeeklySchedule`)
- Schedule deletion GraphQL tests — exist in `frontend/graphql/test/schedule.test.ts`

### What This Patch Addresses

| Gap | Severity | Description |
|---|---|---|
| Missing GraphQL integration tests | **HIGH** | Staff profile, DST migration, parent directory have zero frontend integration tests |
| Missing security test coverage | **HIGH** | Section 4 threats 2-4 have no test cases verifying permission denial |
| Missing repository coverage verification | **HIGH** | `scheduling.repository.ts` new methods (`deleteRecurringClass`, `clearWeeklySchedule`) need 100% coverage verification via `bun run test:coverage` |
| Missing security logic tests | **MEDIUM** | Schedule deletion uses soft delete — need to verify no DB trigger conflicts in `backend/db/test/logic/` |
| Residual mock store type import | **LOW** | `ParentsContainer.tsx` imports `ParentAccountStatus` type from `mockParentsStore` |

---

## Section 1: Core Principles (Patch-Specific)

- [ ] **Tests verify both success AND denial** — Every GraphQL operation must have at least one test for authorized success and one test for unauthorized denial.
- [ ] **Security threats map 1:1 to test cases** — Each threat from Section 4 of the original plan must have a corresponding test case.
- [ ] **No mock data in test assertions** — Tests use real seeded database data via the existing test lifecycle helpers.
- [ ] **Test placement follows AGENTS.md rules** — GraphQL tests go in `frontend/graphql/test/`, immediately after the features they verify.
- [ ] **100% repository coverage** — All new/modified repository methods must achieve 100% line + function coverage. Run `bun run test:coverage backend/db/test/repo/<domain>.repository.test.ts` to verify.
- [ ] **Security logic tests** — Verify DB triggers don't conflict with soft delete operations. Run tests in `backend/db/test/logic/` to confirm.
- [ ] **IDOR protection** — Repository tests verify cross-user access denial; service layer tests verify admin override. GraphQL tests verify the full IDOR chain end-to-end.

---

## Section 5: Prerequisites Verification (BLOCKING)

### 5.0 Security Artifact Verification (Story 7 extends scheduling repository from prior sprints)

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Permission catalog | `backend/db/migration/3-system_permissions_and_groups.sql` | Check new Story 7 permissions exist | `schedule.delete_class`, `schedule.clear_weekly`, `staff.edit_profile`, `system.bulk_update_dst`, `parent.view_directory` seeded ✅ |
| Scheduling repo tests | `backend/db/test/repo/scheduling.repository.test.ts` | `bun run test:coverage` | 100% coverage on `deleteRecurringClass` + `clearWeeklySchedule` |
| State trigger (if applicable) | `backend/db/migration/*_state_transition_trigger.sql` | Verify soft delete doesn't conflict with state machine trigger | Trigger allows `deleted_at` updates without blocking |
| Security tests (prior sprints) | `backend/db/test/logic/*_security.test.ts` | `bun test` | All pass ✅ |
| PermissionsService | `backend/services/auth/permissions.service.ts` | Verify `hasPermission()` and `hasAnyPermission()` exist | ✅ (verified) |

### 5.1 Test Suite Verification

- [ ] Run `bun run test:db` — all existing database tests pass (0 failures). ✅ (verified)
- [ ] Run `bun run test:graphql` — all existing GraphQL tests pass (0 failures).
- [ ] Run `bun tsgo` — TypeScript compilation passes with zero errors.
- [ ] Run `bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts` — verify 100% coverage on Story 7 methods.

### 5.2 Test Infrastructure Verification

- [ ] Verify test helpers exist: `frontend/graphql/test/helpers.ts` ✅ (verified)
- [ ] Verify test lifecycle setup: `frontend/graphql/test/lifecycle.ts` ✅ (verified)
- [ ] Verify seeded test data includes: admin user, teacher user, parent user, teacher profiles, parents, recurring schedules ✅ (verified — existing seed data covers these)

---

## Section 6: Granular Task Breakdown

### Task A — GraphQL Integration Tests: Staff Profile, DST Migration, Parent Directory

**Objective:** Add frontend GraphQL integration tests for the 3 untested features, covering both authorized success and unauthorized denial scenarios.

**Dependencies:** None — depends only on current project state (all GraphQL operations are implemented and registered).

**Layer-Specific Rules (GraphQL Tests — Flattened from `frontend/graphql/test/AGENTS.md`):**
- Tests go in `frontend/graphql/test/` directory.
- Use existing test helpers from `frontend/graphql/test/helpers.ts` and lifecycle from `frontend/graphql/test/lifecycle.ts`.
- Each test must verify: (1) authorized user succeeds, (2) unauthorized user is denied with proper error.
- Use seeded database data — no mock data or manual inserts.

**Target Files:**
- `frontend/graphql/test/teacher.test.ts` — Add staff profile tests
- `frontend/graphql/test/schedule.test.ts` — Add DST migration tests (or new `frontend/graphql/test/dst-migration.test.ts`)
- `frontend/graphql/test/parent.test.ts` — New file for parent directory tests

**Detailed Implementation Steps:**

*Step 1: Add staff profile tests to `frontend/graphql/test/teacher.test.ts`*

Test cases:
1. **`teacherProfileForEdit` — admin can read teacher profile**
   - Login as academy admin
   - Query `teacherProfileForEdit(teacherId: <seeded_teacher_id>)`
   - Assert response contains `id`, `name`, `email`, `phone`, `nationalId`, `timezone`, `hourlyRate`, `status`
   - Assert no errors

2. **`teacherProfileForEdit` — teacher denied**
   - Login as teacher
   - Query `teacherProfileForEdit(teacherId: <own_teacher_id>)`
   - Assert error: `insufficientPermissions` or authorization error

3. **`updateTeacherProfile` — admin can update**
   - Login as academy admin
   - Mutate `updateTeacherProfile(teacherId: <seeded_teacher_id>, input: { phone: "+1234567890", timezone: "America/New_York" })`
   - Assert response contains updated values
   - Assert no errors

4. **`updateTeacherProfile` — teacher denied**
   - Login as teacher
   - Mutate `updateTeacherProfile(teacherId: <own_teacher_id>, input: { phone: "+9999999999" })`
   - Assert error: `insufficientPermissions`

5. **`updateTeacherProfile` — non-existent teacher**
   - Login as academy admin
   - Mutate `updateTeacherProfile(teacherId: <random_uuid>, input: { phone: "+1111111111" })`
   - Assert error: `teacherNotFound`

*Step 2: Add DST migration tests*

Test cases:
1. **`executeDstBulkUpdate` — system admin succeeds**
   - Login as system admin (super_admin)
   - Mutate `executeDstBulkUpdate(offsetMinutes: 60, description: "Test DST adjustment")`
   - Assert response contains `id`, `runId`, `updated` (number ≥ 0), `conflicts` (number ≥ 0), `unchanged` (number ≥ 0), `total` (number ≥ 0)
   - Assert `total = updated + conflicts + unchanged`

2. **`executeDstBulkUpdate` — academy admin denied**
   - Login as academy admin
   - Mutate `executeDstBulkUpdate(offsetMinutes: 60, description: "Should fail")`
   - Assert error: `insufficientPermissions`

3. **`executeDstBulkUpdate` — teacher denied**
   - Login as teacher
   - Mutate `executeDstBulkUpdate(offsetMinutes: 60, description: "Should fail")`
   - Assert error: `insufficientPermissions`

*Step 3: Create `frontend/graphql/test/parent.test.ts`*

Test cases:
1. **`parentDirectory` — admin sees data with metrics**
   - Login as academy admin
   - Query `parentDirectory(search: null, limit: 50, offset: 0)`
   - Assert response contains `id`, `metrics` (with `activated`, `deactivated`, `regular`, `onLeave`, `suspended`, `onTrial`), `rows` (array), `totalParents` (number ≥ 0)
   - Assert each row contains `id`, `name`, `email`, `accountStatus`, `unpaidInvoices`

2. **`parentDirectory` — admin search filter works**
   - Login as academy admin
   - Query `parentDirectory(search: "<partial_name>", limit: 50, offset: 0)`
   - Assert returned rows match the search term

3. **`parentDirectory` — teacher denied**
   - Login as teacher
   - Query `parentDirectory(search: null, limit: 50, offset: 0)`
   - Assert error: `insufficientPermissions`

4. **`parentDirectory` — parent denied**
   - Login as parent
   - Query `parentDirectory(search: null, limit: 50, offset: 0)`
   - Assert error: `insufficientPermissions`

**Test Execution Requirements:**
```bash
bun run test:graphql
```

**Success Criteria / Check Progress Points:**
- [ ] 5 staff profile tests pass (2 success + 3 denial)
- [ ] 3 DST migration tests pass (1 success + 2 denial)
- [ ] 4 parent directory tests pass (2 success + 2 denial)
- [ ] `bun run test:graphql` passes with 0 failures (all existing + new tests)
- [ ] All tests use seeded data — no manual inserts or mock data

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps

---

### Task B — Security Test Coverage: Section 4 Threat Validation

**Objective:** Add explicit security test cases that map 1:1 to each threat identified in Section 4 of the original plan. These overlap with Task A's denial tests but add edge cases specific to IDOR and cross-user access.

**Dependencies:** Depends on Task A — test infrastructure and base denial tests are in place.

**Target Files:**
- `frontend/graphql/test/schedule.test.ts` — Add IDOR edge cases for schedule deletion
- `frontend/graphql/test/teacher.test.ts` — Add IDOR edge case for staff profile

**Detailed Implementation Steps:**

*Step 1: Add schedule deletion IDOR tests to `schedule.test.ts`*

These tests verify Threat 1 from Section 4 (IDOR on Schedule Deletion):

1. **`deleteRecurringClass` — teacher cannot delete another teacher's class**
   - Login as teacher A
   - Mutate `deleteRecurringClass(classInstanceId: <teacher_B_class_id>)`
   - Assert error: `insufficientPermissions`
   - This verifies that even if teacher A knows teacher B's class instance ID, they cannot delete it

2. **`clearWeeklySchedule` — teacher cannot clear another teacher's schedule**
   - Login as teacher A
   - Mutate `clearWeeklySchedule(teacherId: <teacher_B_id>)`
   - Assert error: `insufficientPermissions`

3. **`deleteRecurringClass` — admin can delete any teacher's class**
   - Login as academy admin
   - Mutate `deleteRecurringClass(classInstanceId: <any_teacher_class_id>)`
   - Assert success: returns `true`

*Step 2: Add staff profile IDOR test to `teacher.test.ts`*

This test verifies Threat 2 from Section 4 (IDOR on Teacher Profile):

1. **`updateTeacherProfile` — admin can edit any teacher (no IDOR for admins)**
   - Login as academy admin
   - Mutate `updateTeacherProfile(teacherId: <any_teacher_id>, input: { address: "Updated by admin" })`
   - Assert success: response contains updated `address`
   - This verifies admins have unrestricted access (no teacher-specific scoping needed per Section 4)

**Test Execution Requirements:**
```bash
bun run test:graphql
```

**Success Criteria / Check Progress Points:**
- [ ] Section 4 Threat 1 covered: teacher cannot delete another teacher's class (IDOR denied)
- [ ] Section 4 Threat 1 covered: teacher cannot clear another teacher's schedule (IDOR denied)
- [ ] Section 4 Threat 1 covered: admin can delete any teacher's class (admin override works)
- [ ] Section 4 Threat 2 covered: admin can edit any teacher's profile (no IDOR restriction for admins)
- [ ] Section 4 Threat 3 covered: academy admin denied `executeDstBulkUpdate` (system admin only — from Task A)
- [ ] Section 4 Threat 4 covered: teacher and parent denied `parentDirectory` (from Task A)
- [ ] `bun run test:graphql` passes with 0 failures

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps

---

### Task C — Mock Store Type Cleanup

**Objective:** Remove the residual type-only import from `mockParentsStore` in `ParentsContainer.tsx` and replace it with the proper generated GraphQL type.

**Dependencies:** None — depends only on current project state.

**Target Files:**
- `frontend/views/dashboard/parents/home/ParentsContainer.tsx` — Replace mock store type import

**Detailed Implementation Steps:**

*Step 1: Replace `ParentAccountStatus` type import*

Current (line 17):
```typescript
import type { ParentAccountStatus } from "@/frontend/stores/mockParentsStore";
```

Replace with the generated GraphQL type:
```typescript
import type { ParentDirectoryQuery } from "@/frontend/graphql/generated/gql/operations";

// Derive the account status type from the GraphQL response
type ParentAccountStatus = NonNullable<ParentDirectoryQuery["parentDirectory"]>["rows"][number]["accountStatus"];
```

Or if a shared enum exists in `shared/lib/enum.ts` for `ParentStatus`, use that instead:
```typescript
import { ParentStatus } from "@/shared/lib/enum";
```

*Step 2: Verify no other mock store imports remain*

Run:
```bash
rg "mockParentsStore|mockDstMigrationStore" frontend/views --glob "!**/*.stories.tsx"
```
Output MUST be empty.

**Test Execution Requirements:**
```bash
bun tsgo
bun run test:ui:components
```

**Success Criteria / Check Progress Points:**
- [x] `ParentsContainer.tsx` no longer imports from `mockParentsStore`
- [x] Type comes from generated GraphQL types or shared enum
- [x] `rg "mockParentsStore|mockDstMigrationStore" frontend/views --glob "!**/*.stories.tsx"` returns empty
- [x] `bun tsgo` passes with 0 errors
- [x] `bun run test:ui:components` passes

**Quality Gate — Per-File Validation:**
- [x] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [x] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [x] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [x] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [x] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [x] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [x] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [x] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [x] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [x] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps

---

### Task D — Repository Coverage Verification & Security Logic Tests

**Objective:** Verify 100% line + function coverage on all Story 7 repository methods, and confirm no DB trigger conflicts with soft delete operations.

**Dependencies:** None — depends only on current project state (repository methods and tests already implemented).

**Layer-Specific Rules (per AGENTS.md Section 1.7):**
- 100% line + function coverage on all new/modified repository methods.
- Security logic tests in `backend/db/test/logic/` must verify DB triggers don't block soft delete operations.
- IDOR protection tests must verify cross-user access denial and admin override.

**Target Files:**
- `backend/db/test/repo/scheduling.repository.test.ts` — Verify/add tests for 100% coverage
- `backend/db/test/repo/teacher.repository.test.ts` — Verify/add tests for `updateTeacherProfile` coverage
- `backend/db/test/logic/scheduling_security.test.ts` — Add soft delete trigger compatibility test (if not already covered)

**Detailed Implementation Steps:**

*Step 1: Run coverage verification on scheduling repository*

```bash
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

Check output for 100% line + function coverage on:
- `deleteRecurringClass` — success path (soft delete sets `deletedAt`), failure path (non-existent ID returns `false`)
- `clearWeeklySchedule` — success path (bulk soft delete in transaction), failure path (teacher with no schedules returns `false`)

If coverage is below 100%, add missing test cases:
- Transaction rollback behavior
- Edge case: deleting already-deleted instance (idempotent)
- Edge case: clearing schedule for deactivated teacher

*Step 2: Run coverage verification on teacher repository*

```bash
bun run test:coverage backend/db/test/repo/teacher.repository.test.ts
```

Check output for 100% line + function coverage on:
- `updateTeacherProfile` — success path (updates teacher row), failure path (non-existent teacher ID)

If coverage is below 100%, add missing test cases.

*Step 3: Verify security logic tests cover soft delete compatibility*

Verify that existing security logic tests in `backend/db/test/logic/` don't conflict with Story 7's soft delete approach:
- State machine trigger (`fn_enforce_class_instance_transition`) should NOT block `deleted_at` updates
- Soft delete bypasses state machine validation (it's a deletion, not a state transition)
- If the trigger blocks soft deletes, a fix is needed in the trigger function

Run:
```bash
bun run test:db
```

All tests must pass, including any security logic tests.

*Step 4: Verify IDOR protection in repository tests*

Confirm existing repo tests cover:
- Teacher cannot call `deleteRecurringClass` on another teacher's class → returns `false` or is blocked by permission check in service layer
- Teacher cannot call `clearWeeklySchedule` on another teacher's ID → returns `false` or is blocked by permission check in service layer
- Admin CAN call both methods on any teacher → succeeds

Note: IDOR enforcement happens at the **service layer** (permission check), not the repository layer. Repository methods are role-agnostic. The GraphQL integration tests in Tasks A and B verify the full IDOR chain.

**Test Execution Requirements:**
```bash
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
bun run test:coverage backend/db/test/repo/teacher.repository.test.ts
bun run test:db
```

**Success Criteria / Check Progress Points:**
- [x] `bun run test:coverage` on `scheduling.repository.test.ts` shows 100% line + function coverage on `deleteRecurringClass` and `clearWeeklySchedule`
- [x] `bun run test:coverage` on `teacher.repository.test.ts` shows 100% line + function coverage on `updateTeacherProfile`
- [x] Security logic tests pass — no DB trigger conflicts with soft delete
- [x] `bun run test:db` passes with 0 failures (all existing + new tests)
- [x] IDOR enforcement verified at service layer (verified in scheduling_security.test.ts, timezone_dst.test.ts, teacher_profile.test.ts, parent_directory.test.ts)

**Quality Gate — Per-File Validation:**
- [x] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [x] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [x] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [x] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [x] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [x] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [x] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [x] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [x] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [x] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps

---

## Section 7: Final Verification & Integrity Protocol

Execute the following commands in order:

### 7.1 TypeScript Compilation
```bash
bun tsgo
```

### 7.2 Database Tests
```bash
bun run test:db
```

### 7.2b Repository Coverage Verification
```bash
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
bun run test:coverage backend/db/test/repo/teacher.repository.test.ts
```
Output must show 100% line + function coverage on all Story 7 repository methods (`deleteRecurringClass`, `clearWeeklySchedule`, `updateTeacherProfile`).

### 7.3 GraphQL Integration Tests
```bash
bun run test:graphql
```

### 7.4 UI Component Tests
```bash
bun run test:ui:components
```

### 7.5 Full Test Suite
```bash
bun run test
```

### 7.6 Quality Gate
```bash
bun quality-gate
```

### 7.7 Prohibited Pattern Check
```bash
rg -i "TODO|FIXME|not implemented|placeholder|for now" backend frontend shared --glob "!**/*.md" --glob "!**/generated/**"
```
Output MUST be empty.

### 7.8 Mock Data Leak Check
```bash
rg "mockParentsStore|mockDstMigrationStore" frontend/views --glob "!**/*.stories.tsx"
```
Output MUST be empty.

---

## Test Case Summary

| # | Test Case | File | Task | Type |
|---|---|---|---|---|
| 1 | `teacherProfileForEdit` — admin succeeds | `teacher.test.ts` | A | Success |
| 2 | `teacherProfileForEdit` — teacher denied | `teacher.test.ts` | A | Denial |
| 3 | `updateTeacherProfile` — admin succeeds | `teacher.test.ts` | A | Success |
| 4 | `updateTeacherProfile` — teacher denied | `teacher.test.ts` | A | Denial |
| 5 | `updateTeacherProfile` — non-existent teacher | `teacher.test.ts` | A | Edge case |
| 6 | `updateTeacherProfile` — admin edits any teacher | `teacher.test.ts` | B | IDOR |
| 7 | `executeDstBulkUpdate` — system admin succeeds | `schedule.test.ts` | A | Success |
| 8 | `executeDstBulkUpdate` — academy admin denied | `schedule.test.ts` | A | Denial |
| 9 | `executeDstBulkUpdate` — teacher denied | `schedule.test.ts` | A | Denial |
| 10 | `parentDirectory` — admin sees data with metrics | `parent.test.ts` | A | Success |
| 11 | `parentDirectory` — admin search filter | `parent.test.ts` | A | Success |
| 12 | `parentDirectory` — teacher denied | `parent.test.ts` | A | Denial |
| 13 | `parentDirectory` — parent denied | `parent.test.ts` | A | Denial |
| 14 | `deleteRecurringClass` — teacher denied (other's class) | `schedule.test.ts` | B | IDOR |
| 15 | `clearWeeklySchedule` — teacher denied (other's schedule) | `schedule.test.ts` | B | IDOR |
| 16 | `deleteRecurringClass` — admin succeeds (any class) | `schedule.test.ts` | B | Admin override |
| 17 | `deleteRecurringClass` — 100% coverage verified | `scheduling.repository.test.ts` | D | Coverage |
| 18 | `clearWeeklySchedule` — 100% coverage verified | `scheduling.repository.test.ts` | D | Coverage |
| 19 | `updateTeacherProfile` — 100% coverage verified | `teacher.repository.test.ts` | D | Coverage |
| 20 | Soft delete doesn't conflict with state trigger | `scheduling_security.test.ts` | D | Security logic |

**Total: 16 new GraphQL test cases** (Tasks A+B) covering all 4 threats from Section 4.
**Plus: 4 repository coverage/security logic verifications** (Task D) ensuring 100% coverage and trigger compatibility.
