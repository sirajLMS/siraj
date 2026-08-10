// Parallel test runner for provider integration smokes (one process per *.integration.test.ts file).
// Delegates to the shared runner in scripts/test/run-parallel-tests.ts
import { runParallelTests } from "@/scripts/test/run-parallel-tests";

// Live provider calls — keep concurrency modest to reduce burst rate-limit risk.
await runParallelTests({
  pattern: "**/*.integration.test.ts",
  cwd: "test/integration",
  maxWorkers: 4,
  label: "integration",
  timeoutMs: 120_000,
});
