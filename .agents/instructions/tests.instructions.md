---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,scripts/run-test/**/*.ts"
---

# Test Rules

### Database Tests - Transaction Safety (CRITICAL)

- ALWAYS use `runInRollback` wrapper for DB tests - never perform DB ops outside rollback unless testing RLS roles
- ALWAYS pass `tx` to ALL repo methods inside transactions - mixing `tx` and `db` causes deadlocks and state pollution
  ```ts
  // WRONG - db-backed call inside tx transaction
  await tx.select(...);
  await SomeRepository.someMethod(arg1); // uses global db - DEADLOCK

  // CORRECT - all calls use tx
  await tx.select(...);
  await SomeRepository.someMethod(arg1, tx);
  ```
- NEVER `expect(...).rejects.toThrow()` inside `runInRollback` - causes deadlocks. Use try/catch pattern:
  ```ts
  async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
    let errorCaught: unknown = null;
    try { await fn(); } catch (error) { errorCaught = error; }
    expect(errorCaught).not.toBeNull();
    return errorCaught as Error;
  }
  ```
- NEVER call `getServerTranslations` from `@/shared/locale/server-graphql` directly in tests - causes the i18n loader to hang. Use the `expectRepoError` pattern above
- `DBTransaction` type from `./test-utils` for tx params - NEVER type as `any`

### Database Tests - Helper & Schema Signatures

- `tx` position VARIES per repo method - check the method signature before calling; never assume tx position
- Helper signatures in `entity-setup.ts` VARY - read the source before calling
- NEVER assume table columns or relations - read schema in `backend/db/schema/` first; many tables lack `createdAt`/`updatedAt`

### Database Tests - Data Setup

- NEVER query seed data - always create test data using `entity-setup.ts` helpers inside `runInRollback`
- Pre-existing data: fetch initial count BEFORE operations, assert `initialCount + newItemsCount`:
  ```ts
  const existingCount = await db.$count(someTable, eq(someTable.someFk, foreignKey.id));
  // ... perform inserts ...
  expect(await db.$count(someTable, eq(someTable.someFk, foreignKey.id))).toBe(existingCount + newItems);
  ```
- Non-existent UUID: `randomUUID()`
- Unique emails/names: use `randomUUID()` to avoid constraint violations
- Shared timestamp: `const now = new Date();` for all `createdAt`/`updatedAt` in a test

### Database Tests - Error Assertions

- Assert `.toContain()` on translated message substring (e.g., `"not found"`) - NOT the raw translation key
- Repository methods produce localized messages - raw keys like `"entityNotFound"` never appear in `error.message`
- Do NOT catch errors manually outside of a reusable `expectRepoError` helper

### Database Tests - Coverage & Structure

- 100% code coverage required for `repo/` tests - verify with `bun test --coverage <path>` or `bun run test:db:coverage`
- `logic/` vs `repo/`: logic = workflows/constraints/triggers, repo = 100% coverage of isolated methods
- Aggressively extract helpers (e.g., `testRepoError`, `expectConstraintViolation`) to reduce duplication
- Build custom higher-order test wrappers within the test file for domain-specific patterns (e.g., `function testRepoError(name, logic)`)
- Keep helpers under ~70-80 lines - extract distinct steps into smaller functions
- Do NOT dump domain-specific logic into `test-utils.ts` - keep it in the test file unless globally applicable

### Database Tests - RLS & Cleanup

- RLS testing: `setupRlsRole()` in `beforeAll`, `teardownRlsRole()` in `afterAll`
- Switch roles within tx: `await tx.execute(sql\`SET LOCAL ROLE test_rls_user\`)`
- Non-rollback data (e.g., in `beforeAll` for shared static data) needs `afterAll` cleanup:
  ```ts
  afterAll(async () => {
    await db.delete(someTable).where(eq(someTable.id, testRecord.id));
  });
  ```
- Tests that hard-delete rows referenced by immutable-trigger tables must: disable the trigger, delete ONLY the run's rows (scoped to the test's actors), re-enable the trigger in `finally`

### Database Tests - Quality

- Use `bun:test` for test utilities (`describe`, `test`, `it`, `beforeAll`, `afterAll`, `expect`) - NOT Jest or Vitest imports
- Never use `any` - use `Partial<...>` or specific types
- Types from `@/backend/types` for consistency with backend architecture
- Clean up unused imports/variables - run `bun tsgo` and `bun run lint` (which IS the lint queue client) after changes
- Use `testLogger` (never `console.log` or `console.*`) - prefer `testLogger` or no logging if not needed

### Run-Test Script

- Run with log capture: `bun run scripts/run-test/run-test.ts <test-path>` (not raw `bun test`)
- View last result: `bun run scripts/run-test/run-test.ts --last <path>`
- Filtered view: `bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <path>`
- AI agents MUST use this script instead of raw `bun test` for database tests

### Run-Test Script Modification Rules

When modifying `scripts/run-test/run-test.ts`:
- Preserve backward compatibility - existing flags and their behavior must not change
- Keep the log format stable (`logs/<timestamp>/<relative-path>.log`)
- Use `process.stderr.write` for script messages (prefixed with `[run-test]`) - never `console.*`
- Update `--help` output and `parseArgs()` for any new flags
- No external dependencies - script must remain self-contained
- Test changes: `bun run scripts/run-test/run-test.ts scripts/run-test/tests/smoke.test.ts`
- Run quality: `bun tsgo`, `bun biome:check scripts/run-test/`, and lint after changes

### GraphQL Integration Tests (`frontend/common/graphql/test/`)

- Use `testClient.query()`, NEVER raw `fetch` or string queries
- Define queries as `TypedDocumentNode`, pass document node to testClient:
  ```ts
  const result = await testClient.query({ query: {entityName}QueryDocument });
  ```
- `setupTestServerLifecycle` from `./lifecycle` at root of `describe` block:
  ```ts
  describe("My GraphQL Tests", () => {
    setupTestServerLifecycle();
    // ...
  });
  ```
- NEVER import backend repos, Drizzle schemas, or services - interact via GraphQL API only
- Test client has `errorPolicy: "all"` - GraphQL errors do NOT throw. Assert `result.error` (type `ApolloError | undefined`), NOT `result.errors`
- Use `authenticatedRequest` helper from `helpers.ts` for authenticated queries/mutations
- Import shared demo users from `@/shared/demo-users` - avoid hardcoded search strings
- Prefer optional chaining (`?.`) - complies with `@typescript-eslint/prefer-optional-chain`
- Null guard before assertions on query results:
  ```ts
  const result = result.data?.entities;
  if (!result) throw new Error("entities should be defined");
  ```
- Dynamic headers per-query via Apollo request context:
  ```ts
  const result = await testClient.query({
    query: {entityName}QueryDocument,
    context: {
      headers: { "Accept-Language": "en", "Cookie": "NEXT_LOCALE=en" },
    },
  });
  ```
- Keep helpers under ~70-80 lines - extract distinct steps when exceeding
- Never duplicate standard test setup (login mutations, entity extraction) - centralize in `helpers.ts`
- Type annotations from `@/backend/types` for consistency

### Test Execution Commands

- `bun run test:db` - database repo tests (parallel)
- `bun run test:db:sequential` - sequential DB tests (debugging)
- `bun run test:db:coverage` - database tests with coverage report
- `bun run test:services` - backend services tests (parallel)
- `bun run test:services:sequential` - sequential services tests (debugging)
- `bun run test:graphql` - GraphQL integration tests (dev server)
- `bun run test:workflows` - cross-actor journey tests (real services, real DB)
- `bun run test` - all tests across all layers

### Quality

- Always use `~/.bun/bin/bun` - never npm/yarn/pnpm
- Run `bun tsgo` and `bun run lint` (which IS the lint queue client) after creating or modifying tests - fix all errors
- Follow Biome/ESLint formatting and linting rules

### GraphQL Mutation Argument Coverage (CRITICAL)

- Every mutation call in integration tests MUST pass ALL available input arguments (required AND optional) as `variables`
- Look up mutation variable types in `frontend/common/graphql/generated/gql/graphql.ts` (search for `{MutationName}MutationVariables`)
- Required fields (no `InputMaybe`): always pass a value
- Optional fields (`InputMaybe`): test BOTH a meaningful non-null value AND `null` in separate test cases
- For `input` object mutations: include ALL fields of the input type, including nested input types
- Use valid enum values from generated types (e.g., `CurrencyCode.Usd`) — never hardcode strings

### Linting

- NEVER use `oxlint-disable` comments — fix the root cause.


### Async Assertion Style (lint-enforced)

- `await expect(...)` trips the `typescript(await-thenable)` lint because `expect()` is not Promise-typed. Assert resolution via `const result = await promise; expect(result)...` and rejection via `return expect(promise).rejects.toThrow(...)` (return, not await).

### Bun `mock.module` Partial Factories (CRITICAL)

- A `mock.module` factory MUST enumerate the mocked module's real export surface (spread the actual exports) — partial factories break unrelated suites at import time the moment the mocked module gains a new export.
- When adding an export to any mocked module, update every partial mock factory of that module in the same change.
