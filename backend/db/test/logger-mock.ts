/**
 * Logger Mock Preload Script
 *
 * ## Purpose
 * Suppresses expected error output from repository catch blocks during database tests.
 * When tests intentionally trigger error paths (e.g., mock database failures), the
 * repository's catch blocks call `logger.error()`, which would otherwise pollute test
 * output with stack traces for errors that are actually expected and correctly handled.
 *
 * ## How It Works
 * Uses Bun's `mock.module()` to replace `@/backend/lib/logger` with no-op functions.
 * Because `mock.module()` is hoisted, it intercepts the module before any repository
 * code imports it, ensuring all logger calls become silent.
 *
 * ## Why It's Global (Not Conditional)
 * This preload runs once before all tests via `bunfig.toml`. We cannot conditionally
 * mock based on test file path because `import.meta.path` in a preload refers to the
 * preload file itself, not the test file about to run. The unconditional mock is safe
 * because:
 * - Only backend code imports `@/backend/lib/logger`
 * - Frontend/UI tests don't transitively import this module, so the mock has no effect
 * - `testLogger` (from `@/shared/lib/testlogger`) is a separate module and remains
 *   unaffected — intentional test logging still works
 *
 * ## Configuration
 * Registered in `bunfig.toml`:
 * ```toml
 * [test]
 * preload = ["./backend/db/test/logger-mock.ts"]
 * ```
 *
 * ## Impact
 * - Before: Tests pass but output is cluttered with expected error stack traces
 * - After: Clean test output showing only pass/fail status and intentional testLogger messages
 */

import { mock } from "bun:test";

const noop = () => {};

mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: noop,
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
  },
  default: {
    log: noop,
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
  },
}));
