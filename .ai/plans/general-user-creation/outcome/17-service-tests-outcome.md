# Task 17 Outcome: GeneralUserOnboardingService Service Layer Tests

## Date: 2026-08-14

## Summary

Created `backend/services/user/test/general-user-onboarding.service.test.ts` with 8 test cases covering all 6 required scenarios for `GeneralUserOnboardingService.createGeneralUser()`.

## Files Created

| File | Purpose |
|------|---------|
| `backend/services/user/test/general-user-onboarding.service.test.ts` | Service layer tests for `GeneralUserOnboardingService.createGeneralUser()` |

## Files Modified

None.

## Test Cases Covered

| # | Test Name | Scenario | Key Assertions |
|---|-----------|----------|----------------|
| 1 | creates a general user with a valid non-specialized group | Successful user creation with `staff_default` group | `result.user.id` defined, `result.assignedGroupSlug` matches |
| 2 | rejects duplicate email | `UserRepository.existsByEmail` returns `true` | Error message contains `"email"` |
| 3 | rejects specialized group: student_default | `groupSlug = "student_default"` | Error = `tErrors.specializedGroupNotAllowed` |
| 4 | rejects specialized group: teacher_default | `groupSlug = "teacher_default"` | Error = `tErrors.specializedGroupNotAllowed` |
| 5 | rejects specialized group: parent_default | `groupSlug = "parent_default"` | Error = `tErrors.specializedGroupNotAllowed` |
| 6 | rejects invalid group slug when group does not exist | `findGroupBySlug` returns `null` | Error message contains `"not found"` |
| 7 | rejects when actor lacks STAFF_CREATE permission | `PermissionsService.hasPermission` returns `false` | Error message contains `"permission"` |
| 8 | rejects weak password | Password `"weak"` (< 8 chars) fails `validatePasswordStrength` | Error message contains `"Password"` |

## Testing Patterns Used

### `runInRollback` for DB-touching tests
The successful-creation test (case 1) uses `runInRollback` with `createTestUserWithDefaults(txContext)` for the actor user and passes `txContext` to `createGeneralUser`. All DB writes occur inside the rolled-back transaction.

### `expectRejection` try/catch helper
All rejection tests use a shared `expectRejection()` helper function (try/catch pattern) instead of `expect(...).rejects.toThrow()` — per AGENTS.md database testing rules.

### `testRejection` higher-order wrapper
To eliminate CodeScene duplication warnings, rejection tests that share the same spy-setup + `expectRejection` + assertion pattern use a `testRejection()` higher-order wrapper that compresses boilerplate into 4 lines per test case.

### Specialized group tests via `for...of` loop
The three specialized group rejection tests (student, teacher, parent) are generated via a `for...of` loop over `SPECIALIZED_SLUGS` constant, eliminating structural duplication.

### `setupServiceSpies` helper
A centralized `setupServiceSpies(opts)` function sets up `PermissionsService.hasPermission`, `UserRepository.existsByEmail`, and `PermissionManagementRepository.findGroupBySlug` spies with configurable mock returns — eliminating repeated spy setup blocks.

### spyOn for mocking
- `PermissionsService.hasPermission` — mocked for permission check failure (case 7) and to bypass permission checks in other tests
- `UserRepository.existsByEmail` — mocked for duplicate email (case 2) and as a precondition in other tests
- `PermissionManagementRepository.findGroupBySlug` — mocked for group not found (case 6) and to provide a valid group in other tests

## Test Execution Results

```
bun test v1.3.14

backend/services/user/test/general-user-onboarding.service.test.ts:
(pass) GeneralUserOnboardingService.createGeneralUser > creates a general user with a valid non-specialized group [438.20ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects duplicate email [0.52ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects specialized group: student_default [0.20ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects specialized group: teacher_default [0.05ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects specialized group: parent_default [0.01ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects invalid group slug when group does not exist [300.43ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects when actor lacks STAFF_CREATE permission [0.28ms]
(pass) GeneralUserOnboardingService.createGeneralUser > rejects weak password [0.08ms]

 8 pass
 0 fail
 17 expect() calls
Ran 8 tests across 1 file. [2.04s]
```

## Quality Verification (sub-loop.ts)

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

Exit code: 0 — all 6 quality stages passed.

### CodeScene Iteration

First run of sub-loop flagged 3 CodeScene code duplication warnings at lines 80, 144, 161 (repetitive spy setup + `expectRejection` blocks). Fixed by:
1. Extracting `setupServiceSpies()` helper to centralize spy mock setup
2. Creating `testRejection()` higher-order wrapper for rejection test boilerplate
3. Using `for...of` loop for specialized group tests

After refactoring, CodeScene passed clean.

## Semantic Review Checklist

- [x] All writes in same transaction (pass `tx` to all repo methods) — successful creation test passes `txContext`
- [x] `runInRollback` wrapper used for all DB-touching tests — case 1 (successful creation) uses `runInRollback`
- [x] No `rejects.toThrow()` inside `runInRollback` — all rejection tests use `expectRejection` try/catch pattern
- [x] No seed data queries — uses `createTestUserWithDefaults` entity-setup helper
- [x] Test covers all 6 required test cases (1 successful + 5 rejection scenarios = 8 total tests)
- [x] `bun:test` imports used (`import { describe, test, expect, spyOn, beforeAll } from "bun:test"`)
- [x] No `getServerTranslations` called inside tests for error string construction — `tErrors` loaded once in `beforeAll`
- [x] Error assertions use `.toContain()` on translated message substrings — not raw translation keys (except `toBe(tErrors.specializedGroupNotAllowed)` which compares the full translated message object)

## Environment Issues Encountered

None. All tests executed against the local `siraj_test` PostgreSQL instance without issues.

## Carry-Forward Knowledge for Task 21 (Knowledge Propagation)

1. **Test file location**: `backend/services/user/test/general-user-onboarding.service.test.ts` — service tests live in `test/` subdirectory next to the service
2. **`createTestUserWithDefaults(tx)`** is the canonical actor user setup helper — accepts `tx` (DBTransaction) and optional overrides, returns `UserReturnType`
3. **`setupServiceSpies(opts)` pattern**: A centralized spy setup helper that returns a spy array for easy `restoreSpies(...spies)` cleanup is effective for CodeScene deduplication
4. **`testRejection()` higher-order wrapper**: Compresses rejection test boilerplate (spy setup → expectRejection → assertion → spy restore) into 4 lines per test case — satisfies CodeScene
5. **`for...of` loop for parametric tests**: Using a constant array of `[label, slug]` tuples + `for...of` loop eliminates CodeScene structural duplication for similar test cases (e.g., specialized group rejection)
6. **`tErrors` in `beforeAll`**: Loading `getServerTranslations("en").errorsTranslations` once in `beforeAll` and storing in module-level `let tErrors` is the existing pattern — avoids repeated calls
7. **Specialized group check runs before permission check**: The service checks `isSpecializedGroup` first (before permission), so specialized group rejection tests do NOT need `setupServiceSpies` — they throw before any spy is consulted
8. **`findGroupBySlug` mock returns `{ id, slug, isSystem } | null`**: Mock must return the full object shape for successful path, or `null` for "not found" scenarios
9. **Password validation runs after email check**: The service flow is: permission → specialized group → group exists → email exists → password strength → user creation. So weak-password tests must mock `existsByEmail(false)` to reach the password validation step
10. **`SystemPermissionGroupSlug.STAFF_DEFAULT`** is a valid non-specialized group for general user creation — `staff_default` and `supervisor_default` pass the `isSpecializedGroup` check (only student/teacher/parent are specialized)
