// Parallel test runner for the cron suite. Cron route tests and service tests rely on
// bun:test mock.module, which is process-wide and cannot be restored — so each test
// file runs in its own bun process to prevent mock leakage across files.
import { runParallelTests } from "@/test/scripts/run-parallel-tests";

await runParallelTests({
  groups: [
    { pattern: "**/*.test.ts", cwd: "backend/services/cron/test" },
    { pattern: "cron.repository.test.ts", cwd: "backend/db/test/repo" },
    { pattern: "cron-auth.test.ts", cwd: "backend/lib" },
    { pattern: "**/route.test.ts", cwd: "app/api/cron" },
  ],
  maxWorkers: 8,
  label: "cron",
  timeoutMs: 60_000,
});
