# run-test Script Rules

## Overview

`scripts/run-test/run-test.ts` is a test runner wrapper that captures `bun test` output to structured log files, designed for AI agent workflows.

## Rules for Modifying This Script

1. **Preserve backward compatibility** — Existing flags and their behavior must not change. Add new functionality via new flags only.
2. **Keep the log format stable** — The `logs/<timestamp>/<relative-path>.log` structure is relied upon by `--last`. Any changes to log structure must also update the parser.
3. **Use `process.stderr.write` for script messages** — Script infrastructure messages (prefixed with `[run-test]`) go to stderr so they don't pollute test output on stdout. Never use `console.*` — it will fail ESLint.
4. **Update `--help` output** — Any new flag must be documented in the `printHelp()` function.
5. **Update `parseArgs()`** — New flags must be added to the argument parser and the `ParsedArgs` interface.
6. **Maintain `--last` parser accuracy** — The `parseTestLog()` function must correctly handle all bun test output formats. If bun changes its output format, update the parser and the indicator constants (`FAIL_INDICATORS`, `BOX_DRAW_CHARS`, etc.).
7. **Feedback files are markdown** — Feedback entries in `scripts/run-test/feedback/` must follow the established markdown format (Timestamp, Status, Feedback, Context sections).
8. **No external dependencies** — This script must remain self-contained, using only Node.js built-in modules and Bun APIs. Do not add npm dependencies.
9. **Test changes with the test suite** — After modifying the script, run: `bun run scripts/run-test/run-test.ts scripts/run-test/tests/smoke.test.ts` and verify all smoke tests pass.
10. **Run quality checks** — Always run `bun tsgo`, `bun biome:check scripts/run-test/`, and lint after changes.

## File Structure

```
scripts/run-test/
  run-test.ts        — Main script
  README.md          — Documentation
  AGENTS.md          — This file
  feedback/           — Feedback entries (markdown files)
    .gitkeep
  tests/              — Test files for the script itself
    smoke.test.ts     — Basic smoke tests
    monkey.test.ts    — Chaos/edge case tests
    bun-features.test.ts — Bun test feature coverage
    failing-examples.test.ts — Intentional failures for parser verification
```

## Shared Parallel Test Runner

Parallel test execution logic is consolidated in `scripts/test/run-parallel-tests.ts` with configurable `RunParallelTestsConfig`. Suite-specific runners (`run-db-tests-parallel.ts`, `run-services-tests-parallel.ts`, `run-integration-tests-parallel.ts`) are thin configuration wrappers. See `docs/testing/shared-test-runner.md` for the pattern.
