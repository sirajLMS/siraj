// Parallel test runner for cross-actor journey/workflow tests (one process per *.test.ts file).
import { runParallelTests } from "@/test/scripts/run-parallel-tests";

// Journey suites commit fixtures with per-run UUID prefixes (test/workflows/AGENTS.md rule 3),
// so parallel files never collide by design. Audit-log cleanup goes through the
// transaction-scoped maintenance window (helpers/audit-log-cleanup.ts), which is
// concurrency-safe — no global trigger toggling. Same worker cap as the db suite:
// each worker holds its own pg pool (max: 3 in test env via factory.ts).
await runParallelTests({
  pattern: "**/*.test.ts",
  cwd: "test/workflows",
  maxWorkers: 8,
  label: "workflows",
  timeoutMs: 120_000,
});
