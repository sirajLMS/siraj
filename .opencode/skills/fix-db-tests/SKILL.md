---
name: fix-db-tests
description: Use ONLY when fixing failing database repository tests. Triggers on db test failures, runInRollback issues, tx deadlocks, entity-setup errors.
---

# Fix DB Tests Skill

Run DB tests with log capture, analyze failures, apply common fixes, and re-run until green.

## Workflow

1. Run the failing test with log capture:
   ```bash
   bun run scripts/run-test/run-test.ts <test-path>
   ```
2. View the captured result for analysis:
   ```bash
   bun run scripts/run-test/run-test.ts --last <test-path>
   ```
3. Optionally filter to specific patterns:
   ```bash
   bun run scripts/run-test/run-test.ts --last --focus "error" <test-path>
   ```
4. Analyze the failure output and apply the appropriate fix.

## Common Fixes

### Missing `runInRollback` wrapper
All database tests MUST be wrapped in `runInRollback`. If a test directly calls repository methods without wrapping, add:
```typescript
it("should ...", () => runInRollback(async (tx) => {
  // test body using tx
}));
```

### Using `db` instead of `tx` inside transactions
ALL repository methods inside a `runInRollback` callback must receive `tx` as their database parameter. Using the global `db` causes deadlocks:
```typescript
// WRONG
runInRollback(async (tx) => {
  await repo.findById(1); // uses global db — DEADLOCK
});

// CORRECT
runInRollback(async (tx) => {
  await repo.findById(1, tx); // passes tx — safe
});
```

### `expect().rejects.toThrow()` inside `runInRollback`
This pattern causes deadlocks. Use a try/catch helper instead:
```typescript
// WRONG
runInRollback(async (tx) => {
  await expect(repo.create(invalidInput, tx)).rejects.toThrow();
});

// CORRECT
runInRollback(async (tx) => {
  let error: Error | undefined;
  try {
    await repo.create(invalidInput, tx);
  } catch (e) {
    error = e as Error;
  }
  expect(error).toBeDefined();
  expect(error!.message).toContain("expected error text");
});
```

### Using seed data instead of entity-setup helpers
Tests MUST NOT query seed data. Always create test data using helpers in `entity-setup.ts`:
```typescript
// WRONG — relying on seed data
const user = await db.select().from(users).where(eq(users.email, "seed@example.com"));

// CORRECT — using entity-setup helper
const { userId } = await setupTestUser(tx);
```
**Important**: Verify entity-setup helper signatures before use — they vary significantly between entities.

5. After fixing, re-run the test with log capture to verify:
   ```bash
   bun run scripts/run-test/run-test.ts <test-path>
   ```
6. Once tests pass, verify with `bun tsgo` to ensure no type errors were introduced.