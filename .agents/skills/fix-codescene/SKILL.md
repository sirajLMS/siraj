---
name: fix-codescene
description: >
  Fix CodeScene health warnings only via wave-based parallel executor subagents and per-file
  sub-loop verification (tsgo → biome → oxlint → lint → duplicates → codescene). Orchestrator runs codescene --scan,
  asks wave size, dispatches one subagent per flagged file. Use when asked to fix CodeScene issues,
  codescene warnings, Large Method, Code Duplication, or code health scan failures — without
  running full quality-gate or sonar-scan.
allowed-tools: shell
---

# Fix CodeScene Issues

CodeScene-only workflow: scan → optional wave-size question → parallel executor subagents (one file each) → final scan. Standalone from `quality-gate` and `quality-loop`.

**Executor template (mandatory):** [.agents/skills/fix-codescene/SUB_AGENT_PROMPT_TEMPLATE.md](SUB_AGENT_PROMPT_TEMPLATE.md)

## When to use

- User asks to fix CodeScene / codescene warnings only
- `bun run codescene --scan` reports warnings or errors
- Quality gate failed at CODESCENE but user wants CodeScene-only fix

**Do not use** for full quality gate, sonar, or tsgo-only fixes — use `quality-gate` or `quality-loop`.

## Hard prohibitions

| Never run | Why |
|-----------|-----|
| `bun codescene --reset` / `--reset --scan` | Incremental CodeScene cache must stay intact |
| `bun codescene --scan --full` | Bypasses incremental cache |
| `bun quality-gate` / `bun quality-gate:fresh` | Out of scope |

**Orchestrator allowed commands:** `bun run codescene --scan`, `bun run lint` (in-process lint service — no HTTP server).

**Executor allowed commands:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (runs `codescene --file` internally, plus tsgo → biome → oxlint → lint → duplicates → codescene).

## Orchestrator: no repo file reads (one exception)

Never open repository source or tooling files during orchestration:

- No flagged source files, no `scripts/**/*.ts`, no `package.json`, no configs or plans
- No `Grep`, `Glob`, or `Task(explore)` for codebase discovery

**Single allowed Read** — once before first executor dispatch:

```
.agents/skills/fix-codescene/SUB_AGENT_PROMPT_TEMPLATE.md
```

Every executor `Task` prompt must be built from that file with substitutions. Do not use ad-hoc prompts, SKILL.md prose, or quality-gate templates.

Orchestrator otherwise uses only: scan/curl shell output, template content, AskQuestion (wave size), executor completion messages.

**Executors** read their one assigned file plus rule files from sub-loop.

## Lint service (in-process, no HTTP server)

The former HTTP-based lint queue (`lint-queue-server.ts`, `lint-queue-client.ts`, `LINT_QUEUE_PORT`)
has been replaced by `scripts/lint-service.ts` — a purely in-process TypeScript service with an
in-memory FIFO queue. No server to start, no port to check, no curl.

- **Full-repo lint:** `bun run lint` (calls `requestFullRepoLint` from `scripts/lint-service.ts`)
- **File-scoped lint:** `bun run scripts/lint-service.ts -f <file> --id fix-codescene`
- **JSON output:** `bun run scripts/lint-service.ts -f <file> --json --id fix-codescene`

Subagents should NOT run `bun run lint` directly — they use `sub-loop.ts` which calls the in-process
lint service internally via `requestLint("sub-loop", [relPath], { typeAware: true, maxWarnings: 0 })`.

## Workflow

1. Check lint server (above).
2. Initial scan:
   ```bash
   bun run codescene --scan
   ```
3. Parse flagged files from **stdout only** (do not open checker source):
   - Per-file lines: `warn: <path>:<line>: ...` or `error: ...`
   - Summary: `Files with warnings:` / `Files with errors:` → lines `  - <path>`
   - Counts: `With warnings: N files`, `With errors: N files`
   - Keep per-file warning text for template substitution.
4. If **0 flagged** → report clean; done.
5. **Wave size** — if more than one file flagged and user did not already specify a number, use **AskQuestion**: "How many parallel subagents per wave?" Options: `4`, `8` (Recommended), `16`, or Other. Clamp custom values to **1–16**. Store as `waveSize` for all waves.
6. **Read** [SUB_AGENT_PROMPT_TEMPLATE.md](SUB_AGENT_PROMPT_TEMPLATE.md) once (mandatory).
7. Batch flagged files into waves of `waveSize`. For each wave **sequentially**:
   - Dispatch up to `waveSize` executors **in parallel** (`generalPurpose`, `run_in_background: true`).
   - Build each `Task` prompt: full template + substitute `<file-path>` and `<paste warning lines>`.
   - Wait for all executors in the wave.
   - Collect `CROSS-FILE DEPENDENCY:` reports; deduplicate blocked files; schedule follow-up wave for blockers only.
   - Relaunch failed executors (no cross-file report) in a later wave with guidance from their output.
8. Do **not** re-run `--scan` between waves.
9. Final scan:
   ```bash
   bun run codescene --scan
   ```
   Expect exit 0, `With warnings: 0 files`, `With errors: 0 files`.

## Single-file case

If exactly one file is flagged (or user names one file), still dispatch **one executor** — orchestrator does not run sub-loop or edit files. Optional final `--scan` after executor reports sub-loop exit 0.

## Executor dispatch rules

- One executor = one file; may only read/edit that file (+ rule files from sub-loop)
- **Forbidden:** partial templates, link-only prompts, or prompts not sourced from SUB_AGENT_PROMPT_TEMPLATE.md

## Cross-file dependencies

After each wave, collect reports in this format:

```
CROSS-FILE DEPENDENCY:
  Target file: <assigned file>
  Blocked by: <other file>
  Rule violated: <rule>
  Required fix: <description>
```

Dispatch follow-up wave for `Blocked by` files only. Executors never edit files they were not assigned.

## Final report

Include:

- `waveSize` chosen
- Files flagged at start / fixed / still failing
- Wave count and executor count
- Cross-file dependencies encountered
- Final scan summary (`Perfect health` / `With warnings` / `With errors` counts)

## Relationship to quality-gate

This skill does not run `bun quality-gate`. After a clean final scan, CodeScene may transfer ownership back to quality-gate in `.quality-gate-state.json` automatically. User can run `bun quality-gate` separately if needed.
