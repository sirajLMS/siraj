# run-test

A test runner wrapper that captures bun test output to structured log files, designed for AI agent workflows.

## Usage

```bash
# Run a test file with log capture
bun run scripts/run-test/run-test.ts <test-path>

# View the last test result (AI-optimized structured output)
bun run scripts/run-test/run-test.ts --last <test-path>

# View last result filtered by test name
bun run scripts/run-test/run-test.ts --last --focus "<pattern>" <test-path>

# Submit feedback about the script
bun run scripts/run-test/run-test.ts --feedback "<text>" --context "<why>"

# List all open feedback items
bun run scripts/run-test/run-test.ts --list-feedback

# Show help
bun run scripts/run-test/run-test.ts --help
```

## Flags

| Flag | Argument | Description |
|------|----------|-------------|
| `-h`, `--help` | none | Print help message and exit |
| `--last` | none | Show the last test result for the given path (structured, AI-optimized) |
| `--focus` | `<str>` | Filter `--last` output to tests matching the string (case-insensitive substring) |
| `--feedback` | `<text>` | Submit feedback about the script (required string argument) |
| `--context` | `<text>` | Optional context for `--feedback`, explaining why the feedback matters |
| `--list-feedback` | none | List all open feedback items in readable format |

## Arguments

- `<test-path>` — Path to a test file or directory, relative to the project root

## Log Structure

When running a test, output is captured to:

```
logs/<timestamp>/<relative-path>.log
```

- `<timestamp>` — ISO format with hyphens instead of colons (e.g., `2026-06-30T08-30-00`)
- `<relative-path>` — The test path relative to the project root

Example: Running `bun run scripts/run-test/run-test.ts backend/db/test/repo/parent.repository.test.ts` saves to:
```
logs/2026-06-30T08-30-00/backend/db/test/repo/parent.repository.test.ts.log
```

## --last Output Format

The `--last` flag produces structured, AI-readable output:

```
=== Last Test Result ===
Test File: <relative-path>
Exit Code: 0 | 1
Pass: <count>
Fail: <count>

Failed Tests:
  - <test-name> [FAIL]
    <error detail line 1>
    <error detail line 2>

Status: ALL PASSED
Log File: <absolute-path-to-log>
```

When no failures are found, the output shows `Status: ALL PASSED` instead of a failed tests section.

## AI Agent Integration

This script is designed for AI agents that need to:

1. **Run tests and capture results** — Output is saved to log files, not just printed to stdout
2. **Retrieve results later** — `--last` reads the most recent log file for a given test path
3. **Focus on specific failures** — `--focus` filters to matching test names for targeted debugging
4. **Avoid re-running tests** — Use `--last` instead of re-running to check prior results

AI agents working on this codebase MUST use this script instead of raw `bun test` for running database tests, so that results are captured and retrievable.

## Feedback Mechanism

AI agents (or developers) can submit feedback about the script:

```bash
# Submit feedback
bun run scripts/run-test/run-test.ts --feedback "The --last output should include test duration" --context "When debugging slow tests, knowing duration helps prioritize"

# List all open feedback
bun run scripts/run-test/run-test.ts --list-feedback
```

Feedback is saved as markdown files in `scripts/run-test/feedback/` with:

- **Timestamp** — ISO 8601 format
- **Status** — Default: `open` (can be updated to `resolved`, `wontfix`, etc.)
- **Feedback text** — The main feedback content
- **Context** — Optional explanation of why the feedback matters

## Examples

### Run a test and view results
```bash
bun run scripts/run-test/run-test.ts backend/db/test/repo/parent.repository.test.ts
bun run scripts/run-test/run-test.ts --last backend/db/test/repo/parent.repository.test.ts
```

### Debug specific failing tests
```bash
bun run scripts/run-test/run-test.ts --last --focus "deactivateParent" backend/db/test/repo/parent.repository.test.ts
```

### Submit and review feedback
```bash
bun run scripts/run-test/run-test.ts --feedback "Add --json flag for machine-readable output" --context "Enables better integration with automated pipelines"
bun run scripts/run-test/run-test.ts --list-feedback
```
