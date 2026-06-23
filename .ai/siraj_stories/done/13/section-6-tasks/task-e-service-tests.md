### Task E — Service Tests: Verify User Provisioning Service Test Coverage

**Objective:** Verify and achieve comprehensive test coverage on all new service methods implemented in Task D, including permission gating, transaction orchestration, and error handling.

**Dependencies:** Task D — service methods are implemented with initial test cases.

**Layer-Specific Rules (Service Tests - Flattened from backend/services/*/test/ patterns):**
- All tests use `bun:test` framework exclusively.
- Service tests use `spyOn()` to mock dependencies — NOT manual mock objects or DI containers.
- Every spy is explicitly restored after each test using `spy.mockRestore()`.
- Error testing pattern: use try/catch, NEVER use `expect(...).rejects.toThrow()`.
- Permission testing: mock `PermissionsService.hasPermission` to return `false` for unauthorized path, `true` for authorized path.
- Two service test styles: Pure mock (no DB) for most tests, Integration (real DB with `runInRollback`) for transaction verification.
- Storage service mocking: use `spyOn` on the service module instance.
- Cause chain verification: `expect(errorCaught.cause).toBe(repoError)`.

**Target Files:**
- `backend/services/teacher/test/teacher-onboarding.service.test.ts` — Verify tests (already written in Task D)
- `backend/services/parent/test/parent-onboarding.service.test.ts` — Verify tests (already written in Task D)
- `backend/services/staff/test/manager-onboarding.service.test.ts` — Verify tests (already written in Task D)

**Detailed Implementation Steps:**

*Step 1: Run teacher onboarding service tests*

```bash
bun test backend/services/teacher/test/teacher-onboarding.service.test.ts
```

Verify all tests pass:
- Unauthorized user rejection
- Successful teacher creation with full data
- Email collision detection
- Transaction rollback on failure

*Step 2: Run parent onboarding service tests*

```bash
bun test backend/services/parent/test/parent-onboarding.service.test.ts
```

Verify all tests pass:
- Unauthorized user rejection
- Successful parent creation with billing configuration
- Email collision detection

*Step 3: Run manager onboarding service tests*

```bash
bun test backend/services/staff/test/manager-onboarding.service.test.ts
```

Verify all tests pass:
- Non-super-admin rejection
- Manager creation with admin account type (assigned to academy_admin)
- Manager creation with manager account type (assigned to staff_default)
- Email collision detection



*Step 5: Add transaction rollback integration tests*

Add integration tests that verify transaction rollback behavior using real database operations:

```typescript
test("teacher onboarding rolls back on banking failure", async () => {
  await runInRollback(async tx => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const existsByEmailSpy = spyOn(UserRepository, "existsByEmail").mockResolvedValue(false);
    
    // Mock banking repository to throw an error
    const bankingSpy = spyOn(TeacherBankingRepository, "submitBankingDetails").mockRejectedValue(
      new Error("Banking service unavailable")
    );

    let error: unknown = null;
    try {
      await TeacherOnboardingService.createTeacher(
        "actor-id",
        {
          name: "Rollback Teacher",
          email: "rollback@test.com",
          password: "password123",
          timezone: "UTC",
          beneficiaryName: "John Doe",
          bankName: "Test Bank",
          accountNumber: "123456789",
          iban: "US123456789",
        },
        "en"
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect((error as Error).message).toContain("Banking");

    // Verify no user was created (rolled back)
    // (runInRollback handles this automatically)

    hasPermissionSpy.mockRestore();
    existsByEmailSpy.mockRestore();
    bankingSpy.mockRestore();
  });
});
```

*Step 6: Add permission escalation prevention tests*

Add tests that verify Academy Admins cannot create managers:

```typescript
test("academy admin cannot create manager", async () => {
  const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);
  const getUserContextSpy = spyOn(PermissionsService, "getUserContext").mockResolvedValue({
    permissions: [AppPermission.STAFF_CREATE_TEACHER, AppPermission.PARENT_CREATE_ACCOUNT],
    permissionGroups: [SystemPermissionGroupSlug.ACADEMY_ADMIN],
    isSuperAdmin: false,
    role: "Academy Admin",
  });

  let error: unknown = null;
  try {
    await ManagerOnboardingService.createManager(
      "academy-admin-id",
      {
        name: "Should Fail",
        email: "fail@test.com",
        password: "password123",
        accountType: "manager",
      },
      "en"
    );
  } catch (e) {
    error = e;
  }

  expect(error).not.toBeNull();
  expect((error as Error).message).toContain("permission");

  hasPermissionSpy.mockRestore();
  getUserContextSpy.mockRestore();
});
```

*Step 7: Run full test suite*

After all individual service tests pass, run the full database test suite:

```bash
bun run test:db
```

Verify no regressions in existing tests.

**Test Execution Requirements:**
- Run all service tests:
  ```bash
  bun test backend/services/teacher/test/teacher-onboarding.service.test.ts
  bun test backend/services/parent/test/parent-onboarding.service.test.ts
  bun test backend/services/staff/test/manager-onboarding.service.test.ts
  bun test backend/services/auth/test/auth-validation.service.test.ts
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
- [ ] All teacher onboarding service tests pass (unauthorized, success, email collision, rollback)
- [ ] All parent onboarding service tests pass (unauthorized, success, email collision)
- [ ] All manager onboarding service tests pass (non-super-admin, admin type, manager type, email collision)
- [ ] All spies are properly restored after each test
- [ ] No `expect(...).rejects.toThrow()` patterns used
- [ ] `bun run test:db` passes with zero failures
- [ ] `bun tsgo` passes with zero TypeScript errors

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
