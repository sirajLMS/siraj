### Task C — Repository Tests: Verify User Provisioning Test Coverage

**Objective:** Verify and achieve 100% line and function coverage on all new repository create methods implemented in Task B.

**Dependencies:** Task B — repository create methods are implemented with initial test cases.

**Layer-Specific Rules (Repository Tests - Flattened from backend/db/test/ patterns):**
- All tests use `bun:test` framework exclusively.
- All database tests wrap operations in `runInRollback()` from `backend/db/test/test-utils.ts` to ensure no data persists.
- NEVER use `expect(...).rejects.toThrow()` inside `runInRollback` — causes deadlocks. Use try/catch pattern instead.
- Always pass `tx` parameter to all repository method calls inside rollback transactions.
- Use `createTestUser`, `setupTeacher`, `setupStudent` helpers from `backend/db/test/entity-setup.ts` for test data creation.
- Assert on translated error message substrings, not raw translation keys.
- Use higher-order test wrappers to prevent CodeScene duplication flags.
- Coverage target: 100% line and function coverage for all new repository methods.

**Target Files:**
- `backend/db/test/repo/teacher.repository.test.ts` — Verify create method tests (already written in Task B)
- `backend/db/test/repo/parent.repository.test.ts` — Verify create method tests (already written in Task B)
- `backend/db/test/repo/staff-profile.test.ts` — Verify create method tests (already written in Task B)

**Detailed Implementation Steps:**

*Step 1: Run coverage on teacher repository tests*

Execute the coverage command for the teacher repository test file:

```bash
bun run test:coverage backend/db/test/repo/teacher.repository.test.ts
```

Expected output must show:
```
% Coverage for teacher.repository.ts
  Lines: 100.00%
  Functions: 100.00%
  Branches: 100.00%
```

If coverage is below 100%, identify uncovered lines and add test cases. Common gaps:
- Error handling branches (duplicate check, invalid timezone)
- Null/undefined field handling
- Edge cases in timezone validation

*Step 2: Run coverage on parent repository tests*

Execute the coverage command for the parent repository test file:

```bash
bun run test:coverage backend/db/test/repo/parent.repository.test.ts
```

Expected output must show 100% coverage. If below 100%, add missing test cases for:
- Billing field combinations (invoiceType + feeAmount + paymentMethod + currency)
- Social communication fields (facebook, whatsapp, twitter, skype, defaultZoomLink)
- All parent status enum values (ACTIVATED, DEACTIVATED, REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL)

*Step 3: Run coverage on staff profile repository tests*

Execute the coverage command for the staff profile test file:

```bash
bun run test:coverage backend/db/test/repo/staff-profile.test.ts
```

Expected output must show 100% coverage. If below 100%, add missing test cases for:
- Both status values (ACTIVATED, DEACTIVATED)
- Null phone and skypeId fields
- Empty string vs null handling

*Step 4: Run full database test suite*

After achieving 100% coverage on individual files, run the full database test suite to ensure no regressions:

```bash
bun run test:db
```

Expected output: All tests pass with 0 failures. If any existing tests fail:
1. Identify the failing test
2. Determine if the failure is caused by the new repository methods
3. Fix the issue (likely a missing `tx` parameter or transaction conflict)
4. Re-run the full suite

*Step 5: Verify transaction rollback behavior*

Add additional tests to verify that repository methods properly participate in transaction rollbacks. These tests verify that when a subsequent operation fails, the create method's changes are rolled back:

```typescript
test("teacher create rolls back on subsequent failure", async () => {
  await runInRollback(async tx => {
    const user = await createTestUser(tx, { name: "Rollback Teacher" });
    
    await TeacherRepository.create(
      { userId: user.id, status: "ACTIVATED", timezone: "UTC" },
      tx
    );

    // Simulate a subsequent failure
    throw new Error("Simulated failure");
  });

  // After rollback, verify the teacher doesn't exist
  // (runInRollback handles this automatically)
});
```

*Step 6: Run full test suite*

After all tests pass and coverage is at 100%, document the results:

| Repository Method | Lines | Functions | Branches | Status |
|---|---|---|---|---|
| `TeacherRepository.create()` | 100% | 100% | 100% | ✅ |
| `ParentRepository.create()` | 100% | 100% | 100% | ✅ |
| `StaffProfileRepository.create()` | 100% | 100% | 100% | ✅ |

**Test Execution Requirements:**
- Run coverage on all modified test files:
  ```bash
  bun run test:coverage backend/db/test/repo/teacher.repository.test.ts
  bun run test:coverage backend/db/test/repo/parent.repository.test.ts
  bun run test:coverage backend/db/test/repo/staff-profile.test.ts
  ```
- Run full database test suite:
  ```bash
  bun run test:db
  ```
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] `TeacherRepository.create()` has 100% line, function, and branch coverage
- [ ] `ParentRepository.create()` has 100% line, function, and branch coverage
- [ ] `StaffProfileRepository.create()` has 100% line, function, and branch coverage
- [ ] All test cases pass for success paths (valid input creates records)
- [ ] All test cases pass for failure paths (duplicate, invalid timezone, cross-role rejection)
- [ ] All test cases pass for edge cases (minimal fields, null values, default values)
- [ ] Transaction rollback behavior verified (no orphaned records on failure)
- [ ] `bun run test:db` passes with zero failures across all test files
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] No `expect(...).rejects.toThrow()` patterns used inside `runInRollback`
- [ ] All `tx` parameters properly passed to repository methods inside transactions

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
