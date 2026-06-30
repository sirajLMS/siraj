---
name: fix-db-tests
description: >
  Fix failing database tests by running them with log capture, analyzing failures,
  and applying fixes with proper transaction wrapping and tx propagation.
  Use when database tests fail or when asked to fix repo tests.
allowed-tools: shell
---

## Fix Database Tests Workflow

### Step 1: Run the test with log capture

```bash
bun run scripts/run-test/run-test.ts <test-path>
```

### Step 2: Review the result

```bash
bun run scripts/run-test/run-test.ts --last <path>
```

For focused output on specific failures:

```bash
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <path>
```

### Step 3: Apply common fixes

Based on the failure output, check for these frequent issues:

- **Missing `runInRollback`**: Wrap test bodies in `runInRollback(async (tx) => { ... })`
- **`tx` not propagated**: Every repo method call inside a transaction MUST receive `tx` — mixing `tx` and `db` causes deadlocks
- **`expect().rejects.toThrow()` inside `runInRollback`**: Replace with try/catch pattern that sets a boolean/asserts after the transaction
- **Querying seed data**: Never query seed data — create test data using helpers from `entity-setup.ts`
- **Wrong entity-setup signature**: Verify helper signatures before use, they vary significantly

### Step 4: Re-run and verify

```bash
bun run scripts/run-test/run-test.ts <test-path>
```

Look for a "wall of green" — all tests passing.

### Step 5: Type-check after fixes

```bash
bun tsgo
```

This ensures fixes didn't introduce type errors.
