# Backend Database Testing Rules

This directory contains **database-layer** tests (repository coverage, business-logic workflows, RLS, constraints) against the local `siraj_test` PostgreSQL instance. Follow these guidelines to ensure tests remain isolated, clean, performant, and maintainable.

## Provider / external integration tests (NOT here)

**Do NOT add provider or third-party integration tests under `backend/db/test/`** (including subdirectories). Examples that belong elsewhere:

- Neon HTTP / serverless driver smokes
- Redis Cloud / Upstash live connection tests
- Any `*.integration.test.ts` that calls an external SaaS API

Place those in **`test/integration/`** only (e.g. `test/integration/db/neon.integration.test.ts`). Run with `bun run test:integration`. Each provider gets **one** smoke test that confirms the adapter reaches the live API — not full app/service behaviour.

Tests in this directory may still exercise **multiple repositories/services together** inside `runInRollback`; that is in-process DB integration, not external provider integration.

## Core Guidelines

1. **Use Transaction Rollbacks (`runInRollback`)**
   - Every database test MUST run inside the `runInRollback` wrapper imported from `./test-utils`.
   - Never perform database operations outside a rolled-back transaction unless testing explicit non-transactional RLS role creation/session teardown.
   - Always pass the transaction instance (`tx` or `t`) to **ALL** repository methods AND direct Drizzle queries. If you write `await tx.select(...)`, the repo call must also receive `tx`: `await SomeRepository.someMethod(arg1, tx)`. Mixing `tx` queries with `db`-backed repo calls causes deadlocks and state pollution.
   - Use the `DBTransaction` type from `./test-utils` for any helper function parameters that accept a transaction — **NEVER** type transaction parameters as `any`.

2. **Clean Setup Helpers**
   - Utilize existing helper functions in [entity-setup.ts] (e.g., `createTestUser`, `createTestStudent`, `createTestTeacher`, `setupTeacher`, `setupStudent`) to create test entities.
   - If custom setup is required, define clear helper functions at the top of the test file.
   - Generate unique emails, names, and idempotency keys using `randomUUID()` or distinct prefixes (e.g., `prefix: "swapA"`) to avoid unique constraint violations.

3. **Verify Constraints and Errors Cleanly**
   - **NEVER use `expect(...).rejects.toThrow()` inside `runInRollback`** — this causes deadlocks/timeouts because the rejected promise interacts poorly with the transaction rollback mechanism. Instead, use a **try/catch helper** pattern:
     ```typescript
     async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
       let errorCaught: unknown = null;
       try {
         await fn();
       } catch (error) {
         errorCaught = error;
       }
       expect(errorCaught).not.toBeNull();
       return errorCaught as Error;
     }
     ```
   - Assert on the error message using `.toContain()` with a substring from the **translated** message (e.g., `"not found"`, `"Version mismatch"`, `"already deactivated"`), NOT the raw translation key (e.g., `"studentNotFound"`). Repository methods produce human-readable localized messages — the raw key never appears in `error.message`.
   - Do not catch errors manually outside of a reusable helper like the one above.

4. **Code Cleanliness, Strict Linting & Type Checking**
   - Clean up all unused imports and unused variables (especially those destructured from setup helpers).
   - Run `bun tsgo` and lint via the lint queue client after creating or modifying tests. You MUST fix any resulting errors (e.g., TS6133 unused variables).
   - You can run `bun run lint` directly — it IS the lint queue client (calls `requestFullRepoLint` from `scripts/lint-queue-client.ts` and serializes through the queue server). Make sure `bun run lint:server` is running first. For file-scoped lint, use the queue client directly: `curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -H "Content-Type: application/json" -d '{"id":"db-test","files":["<file>"]}'`.
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

14. **Coverage Requirements**
    - All repository tests located in the `repo/` directory MUST achieve **100% code coverage** (lines and functions).
    - After writing or updating a repository test, always verify coverage by running `bun test --coverage <path-to-test-file>` or `bun run test:db:coverage` for the full suite.

15. **Always Create Test Data — Never Query Seed Data**
    - Tests MUST create their own data using entity-setup helpers (`createTestUser`, `createTestParent`, `createTestStudent`, `setupStudent`, etc.) inside the `runInRollback` transaction.
    - **NEVER** query the database for pre-existing seed data (e.g., `db.select().from(parents).limit(1)`) and use it as test input. Seed data is not guaranteed to be present or stable, and queries outside the transaction break isolation.
    - For "not found" / "empty result" tests, use a known non-existent UUID like `"00000000-0000-0000-0000-000000000000"` or generate one with `randomUUID()`.

16. **Always Pass `tx` to Repository Methods**
    - Every repository method accepts an optional `tx` (transaction) parameter. When inside `runInRollback`, you **MUST** pass `tx` as the transaction argument to all repo method calls.
    - Failing to pass `tx` causes the repo method to use the global `db` connection, which is outside the rollback transaction — leading to state pollution, deadlocks, and non-deterministic test results.
    - **Check the actual parameter position** of `tx` in each repo method signature before calling — it varies:
      - `ParentRepository.getParentProfile(parentId, tx?)` — `tx` is 2nd param
      - `StudentRepository.setClassesRemaining(studentId, value, expectedVersion?, tx?)` — `tx` is 4th param
      - `StorageDbRepository.linkFileToParent(parentId, fileId, usageType, tx?)` — `tx` is 4th param

17. **Verify Entity Setup Helper Signatures Before Use**
    - Always read the actual function signature in `entity-setup.ts` before calling a helper. Common mistakes:
      - `setupStudent(tx, userOverrides, parentOverrides, studentOverrides)` — takes 4 args (tx + 3 override objects), NOT `(tx, parentId, overrides)`.
      - `createTestParent(tx, userId, overrides)` — requires a `userId` from a previously created user, NOT a standalone call.
      - `createTestStudent(tx, parentId, overrides)` — requires a `parentId` from a previously created parent.
    - When in doubt, read the helper source in `entity-setup.ts` before writing the test.

18. **Verify Schema Columns Before Writing Test Setup**
    - Before inserting test data into any table (directly or via helpers), **read the schema definition** in `backend/db/schema/` to confirm the actual columns and their types.
    - **NEVER assume** a table has columns like `mimeType`, `size`, `bucket`, `createdAt`, `updatedAt` — many tables (e.g., `storageFiles`) only have minimal columns (`id`, `path`, `isProtected`).
    - This applies to both direct `tx.insert()` calls and when passing `overrides` to entity-setup helpers.

19. **Do Not Call `getServerTranslations` Directly in Tests**
    - Repository methods internally call `getServerTranslations(locale, "<namespace>")` (from `@/shared/locale/server-graphql`) to produce localized error messages. Tests should **NOT** call this function directly to construct expected error strings.
    - Instead, use the `expectRepoError` try/catch pattern (see Rule 3) and assert on substrings of the translated message (e.g., `expect(error.message).toContain("not found")`).
    - This avoids potential hangs from the translation loader in the test environment and keeps tests decoupled from the translation system's internal state. The legacy `getBackendTranslations` helper is deprecated and must not be used.

20. **Type Definition Pattern**: Use types defined in `backend/types/` (e.g., `{Entity}SelectType`, `{Entity}InsertType`) for testing purposes rather than creating test-specific type definitions or directly referencing schema types. Import these types from `@/backend/types` and use them in test assertions and helper functions to maintain consistency with the backend architecture.


## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.
