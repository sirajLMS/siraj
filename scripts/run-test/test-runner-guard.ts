/**
 * Test Runner Guard — Preload Script
 *
 * ## Purpose
 * Prevents direct `bun test <file>` invocations from bypassing the project's
 * approved test runners (run-locked-cmd.ts, run-test.ts, run-parallel-tests.ts).
 *
 * When an AI agent (or human) runs `bun test <file>` directly instead of
 * `bun run test:<suite> <file>` or `bun run scripts/run-test/run-test.ts <file>`,
 * Bun's built-in test runner is invoked and skips every safeguard the wrapper
 * scripts provide: log capture, process locking, env-file loading, and timeout
 * enforcement. This preload runs before any test code and exits the process
 * with a clear warning if the invocation did not come from an approved runner.
 *
 * ## How It Works
 * The approved runners set `SIRAJ_TEST_RUNNER_OK=1` in the child process
 * environment before spawning `bun test`. This preload checks for that env var.
 * If absent, it prints a warning to stderr and exits with code 1 before any
 * test runs. If present, the preload is a no-op and tests proceed normally.
 *
 * ## Configuration
 * Registered in `bunfig.toml` as the FIRST preload (so it runs before
 * logger-mock.ts and ensure-env.ts):
 * ```toml
 * [test]
 * preload = ["./scripts/run-test/test-runner-guard.ts", "./backend/db/test/logger-mock.ts", "./backend/db/test/ensure-env.ts"]
 * ```
 *
 * ## Bypass for debugging
 * Set `SIRAJ_TEST_RUNNER_OK=1` manually to bypass the guard when intentionally
 * running `bun test <file>` for quick debugging:
 *   SIRAJ_TEST_RUNNER_OK=1 bun test <file>
 */

const RUNNER_ENV_VAR = "SIRAJ_TEST_RUNNER_OK";

function isApprovedRunner(): boolean {
  return process.env[RUNNER_ENV_VAR] === "1";
}

function printWarning(): void {
  const RESET = "\x1b[0m";
  const BOLD = "\x1b[1m";
  const RED = "\x1b[31m";
  const YELLOW = "\x1b[33m";
  const CYAN = "\x1b[36m";

  const lines = [
    "",
    `${RED}${BOLD}┌──────────────────────────────────────────────────────────────────────┐${RESET}`,
    `${RED}${BOLD}│  ⚠  DIRECT bun test INVOCATION BLOCKED                                 │${RESET}`,
    `${RED}${BOLD}└──────────────────────────────────────────────────────────────────────┘${RESET}`,
    "",
    `${YELLOW}Running ${BOLD}bun test <file>${RESET}${YELLOW} directly bypasses the project's test runners.${RESET}`,
    `${YELLOW}The approved runners provide:${RESET}`,
    `  • Log capture (scripts/run-test/run-test.ts)`,
    `  • Process locking (prevents concurrent DB test deadlocks)`,
    `  • Env-file loading (.env.test) and timeout enforcement`,
    "",
    `${CYAN}Use one of these instead:${RESET}`,
    `  ${BOLD}bun run test:<suite>${RESET}              # e.g. bun run test:db, test:services, test:graphql`,
    `  ${BOLD}bun run scripts/run-test/run-test.ts <file>${RESET}  # single-file with log capture`,
    "",
    `${CYAN}To bypass for quick debugging:${RESET}`,
    `  ${BOLD}SIRAJ_TEST_RUNNER_OK=1 bun test <file>${RESET}`,
    "",
  ];

  process.stderr.write(lines.join("\n") + "\n");
}

if (!isApprovedRunner()) {
  printWarning();
  process.exit(1);
}
