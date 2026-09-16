# Phase 0 Baseline — Pre-Implementation Capture

**Captured:** 2026-09-04 (before any source modification; read-only)

## Scope

Read-only baseline. **Zero source files created or modified.** The only files
written were plan artifacts: `deferred-items.md` and the two files in
`outcome/`.

## Git baseline

- `git status --short` → empty. **Tree is clean** (0 modified, 0 staged, no
  untracked files listed).
- `git diff --name-only > /tmp/baseline-files.txt` (plus `--cached`) → **0
  lines**. Any file appearing in a later diff is plan-introduced.

## Quality-tool baselines

| Tool | Invocation | Result | Meaning |
|---|---|---|---|
| tsgo | `bun tsgo 2>&1 \| grep -c 'error TS'` | **0 errors** | The wrapper pipeline exited 1 only because `grep -c` exits 1 on zero matches — that is the *clean* signal, not a failure |
| biome | `bun biome:check 2>&1 \| grep -c warn` | **1 matching line** | The single matching line is the summary `Found 1 warning.` |
| lint | `bun run scripts/lint-service.ts --json --id baseline-audit` | **`success: true`, `exitCode: 0`** | Full-repo, `durationMs: 98280`, empty `output` |

Artifacts: `/tmp/baseline-lint.json` (full JSON), `/tmp/baseline-files.txt`
(empty), `/tmp/baseline-tsgo-errors.txt` (`0`),
`/tmp/baseline-biome-warns.txt` (`1`).

## Pre-existing warning to IGNORE later

The one biome warning is **not code**: biome checks 5960 files and reports a
broken symbolic link at `.claude/skills`:

```
.claude/skills internalError/fs
  ! Dereferenced symlink.
  i Biome encountered a file system entry that is a broken symbolic link.
```

This is a pre-existing repo-hygiene artifact unrelated to this plan. Later
sub-loops comparing against baseline should treat `1 warn` (the `.claude/skills`
symlink) as neutral — the plan must not raise it above 1, and is not expected
to fix it.

## Notes for later phases

- Lint ran through the in-process serialized lint service (process lock
  acquired/released cleanly, `queueDepthAtEnqueue: 0`) — safe to re-run from
  parallel subagents.
- **Parallel agents:** immediately after this baseline was captured, sibling
  Phase-0 agents began modifying the tree (permission enum, shared constants,
  migration dirs now appear in `git status`). Later comparisons MUST diff
  against `/tmp/baseline-files.txt` (empty) rather than assuming a clean tree.
- No caches were cleared, per AGENTS.md cache-preservation policy.
- Test-policy reminder (user constraint for this run): UI component tests and
  E2E specs are to be **written but NOT executed**; backend/shared tests must
  be written and run green via `bun run test/scripts/run-test.ts <path>`.
