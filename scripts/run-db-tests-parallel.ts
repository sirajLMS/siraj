// Parallel test runner for database repository tests.
// Delegates to the shared runner in scripts/test/run-parallel-tests.ts
import { runParallelTests } from "@/scripts/test/run-parallel-tests";

// Each worker creates a pg pool (max: 3 in test env via factory.ts).
// Cap workers so total connections stay well within PostgreSQL's max_connections.
// With max 3 per pool: 8 workers x 3 = 24 connections (leaves headroom for other clients).
await runParallelTests({
  pattern: "**/*.test.ts",
  cwd: "backend/db/test",
  maxWorkers: 8,
  label: "database",
  timeoutMs: 60_000,
});
