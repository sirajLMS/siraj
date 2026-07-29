/**
 * Shared UI test environment preload.
 * All tests under test/ui/ run against the production Next.js server (next start).
 * Run `bun run build:test` before `bun run test:ui`.
 */
process.env.TEST_SERVER_MODE ??= "production";
