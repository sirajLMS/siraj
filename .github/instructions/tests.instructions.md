---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Test Rules

## Database Tests (CRITICAL)

- ALWAYS use `runInRollback` wrapper for database tests
- ALWAYS pass `tx` to ALL repository methods inside transactions — mixing `tx` with `db`-backed calls causes deadlocks
- NEVER use `expect(...).rejects.toThrow()` inside `runInRollback` — causes deadlocks. Use try/catch helper pattern
- NEVER query seed data — always create test data using helpers in `entity-setup.ts`
- Verify entity-setup helper signatures before use — they vary significantly

## Running DB Tests

- Use `bun run scripts/run-test/run-test.ts <test-path>` (not raw `bun test`) for log capture
- View last result: `bun run scripts/run-test/run-test.ts --last <path>`
- Filtered view: `bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <path>`

## Logging & Types

- Use `testLogger` — never `console.log` or `console.*`
- All types from `backend/types` — no `any`
