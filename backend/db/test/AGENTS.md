# Backend Database Testing Rules

This directory contains database integration tests. Follow these guidelines to ensure tests remain isolated, clean, performant, and maintainable.

## Core Guidelines

1. **Use Transaction Rollbacks (`runInRollback`)**
   - Every database test MUST run inside the `runInRollback` wrapper imported from `./test-utils`.
   - Never perform database operations outside a rolled-back transaction unless testing explicit non-transactional RLS role creation/session teardown.
   - Always pass the transaction instance (`tx` or `t`) to all repository methods and queries to execute operations within the transaction scope.

2. **Clean Setup Helpers**
   - Utilize existing helper functions in [entity-setup.ts] (e.g., `createTestUser`, `createTestTeacher`, `createTestStudent`, `setupTeacher`, `setupStudent`) to create test entities.
   - If custom setup is required, define clear helper functions at the top of the test file.
   - Generate unique emails, names, and idempotency keys using `randomUUID()` or distinct prefixes (e.g., `prefix: "swapA"`) to avoid unique constraint violations.

3. **Verify Constraints and Errors Cleanly**
   - Use `expect(...).rejects.toThrow()` or write custom assertion helpers (like `expectConstraintViolation`) to assert that operations fail with specific constraint names or error messages.
   - Do not catch errors manually unless performing specific conditional assertions, and always re-throw unexpected errors.

4. **Code Cleanliness, Strict Linting & Type Checking**
   - Clean up all unused imports and unused variables (especially those destructured from setup helpers).
   - Run `bun tsgo` and `bun lint` after creating or modifying tests. You MUST fix any resulting errors (e.g., TS6133 unused variables).
   - Follow standard Biome/ESLint formatting and linting rules. Do not use `console.log` directly; prefer `testLogger` or no logging if not needed.
   - Make sure all TypeScript types are fully resolved. **NEVER use `any` type overrides** (e.g., `as any`) to bypass validation. Use proper `Partial<...>` or specific object typing instead.

5. **Entity Relationships Mapping**
   - Remember database schema relations:
     - `students.id` is a primary key that points to the parent student record. It does NOT have a `userId` field.
     - `teachers.id` references `teachers.userId` which points to `users.id`.
     - In `classInstances`, `studentId` references `students.id` (not `users.id`), and `teacherId` references `teachers.id` (not `users.id`).
     - Always insert `teacherAssignments` between the student and teacher before booking a class, as the scheduling repository validates this assignment.

6. **Test Framework & Assertions**
   - Use `bun:test` for all test utilities (`describe`, `test`, `it`, `beforeAll`, `afterAll`, `expect`). Do not use Jest or Vitest imports.

7. **Timestamp Consistency**
   - Create a shared timestamp (e.g., `const now = new Date();`) at the start of your test or setup function and use it for all `createdAt` and `updatedAt` fields within that test to ensure consistency.

8. **RLS Testing**
   - When testing Row Level Security, use `setupRlsRole()` in `beforeAll` and `teardownRlsRole()` in `afterAll`.
   - Switch roles within the transaction using `await tx.execute(sql`SET LOCAL ROLE test_rls_user`)`.

9. **Handling Global Setup Cleanup**
   - If you must insert records outside of `runInRollback` (e.g., inside `beforeAll` for shared static data), ensure you provide an `afterAll` hook to hard-delete (`await db.delete(...)`) those specific records so they don't leak into other tests.

10. **Small Methods & Zero Duplication**
   - Tests must aggressively avoid code duplication. Extract shared setup, common actions, and repetitive assertions into small, focused helper functions (e.g., `setupBaseTest`, `expectConstraintViolation`).
   - Keep test cases themselves small, readable, and non-complex. If a test case or setup sequence is becoming too long or complex, split the logic into smaller, reusable functions within the file, or move them to `test-utils.ts` / `entity-setup.ts` if they apply globally.

11. **Directory Structure (`logic` vs `repo`)**
    - `logic/`: Contains tests focusing on business logic workflows, constraints, triggers, and complex multi-entity transactions.
    - `repo/`: Contains tests specifically dedicated to achieving 100% coverage of individual repository methods in isolation.

12. **Accounting for Pre-existing Data**
    - Tests must not assume a database table or even a specific relationship is completely empty prior to test execution.
    - When asserting counts, always fetch the initial count *before* executing your test operations, and then assert against `initialCount + newItemsCount` to avoid failures from pre-existing data or query bleed.
    - **Example**:
      ```typescript
      const existingCount = await db.$count(students, eq(students.parentId, testParent.id));
      // ... perform inserts (e.g., add 20 students) ...
      const allStudentsCount = await db.$count(students, eq(students.parentId, testParent.id));
      expect(allStudentsCount).toBe(existingCount + 20);
      ```

13. **Strict CodeScene Duplication Elimination**
    - CodeScene often flags repetitive structural patterns as code duplication, particularly when identical setup/execution sequences (e.g., `test`, `runInRollback`, `createMock`, `expectError`) are repeated for multiple error cases.
    - **Do NOT** try to blindly dump all this logic into `test-utils.ts` if the domain constraints are highly specific to the repository being tested.
    - Instead, **aggressively build custom higher-order test wrappers within the test file itself** (e.g., `function testRepoError(name, logic)`) that compress the repetitive boilerplate into 1-2 lines per test. This perfectly satisfies CodeScene while keeping the domain-specific logic isolated to the file.
