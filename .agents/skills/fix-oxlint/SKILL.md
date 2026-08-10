---
name: fix-oxlint
description: >
  Fix all oxlint issues across the codebase via pool-based parallel executor subagents.
  Orchestrator runs scripts/oxlint-categorize.ts, reads .oxlint/by-file-*.json files,
  maintains a pool of 36 concurrent subagents (one per file), dispatches each with the
  file's JSON and the mandatory SUB_AGENT_PROMPT_TEMPLATE. Each executor fixes issues,
  runs sub-loop (--lifecycle codescene), and stages the file. Use when asked to fix all
  oxlint issues, run oxlint categorization, or clean up all oxlint warnings/errors.
allowed-tools: shell
---

# Fix Oxlint Issues

Oxlint-only workflow: run `scripts/oxlint-categorize.ts` → parse `.oxlint/by-file-*.json` →
maintain a **pool of 36 concurrent executor subagents** (one per file) → each fixes its file,
runs sub-loop, stages it → final re-run of categorization to verify 0 issues.

**Executor template (mandatory):** [.agents/skills/fix-oxlint/SUB_AGENT_PROMPT_TEMPLATE.md](SUB_AGENT_PROMPT_TEMPLATE.md)

**Prompt generator script:** [.agents/skills/fix-oxlint/generate-subagent-prompts.ts](generate-subagent-prompts.ts)

## When to use

- User asks to fix all oxlint issues across the codebase
- User asks to run `scripts/oxlint-categorize.ts` and fix all flagged files
- Quality gate or CI reports oxlint failures and the user wants a full sweep
- User says "fix oxlint", "clean up oxlint", "resolve all oxlint warnings"

**Do not use** for CodeScene-only fixes (use `fix-codescene`), full quality-gate runs
(use `quality-gate`), or lint-only fixes (use `quality-loop` or `fix`).

## Hard prohibitions

| Never run | Why |
|-----------|-----|
| `bun quality-gate` / `bun quality-gate:fresh` | Out of scope — orchestrator only runs categorize |
| `bun oxlint` directly (outside categorize script) | Use `scripts/oxlint-categorize.ts` which wraps it |
| `bun codescene --reset` / `--scan --full` | Destructive to incremental cache |

**Orchestrator allowed commands:**
- `bun run scripts/oxlint-categorize.ts` — runs oxlint, categorizes results into `.oxlint/`
- `bun run .agents/skills/fix-oxlint/generate-subagent-prompts.ts` — generates per-file prompt files
- `git add` (via executor subagents only)

**Executor allowed commands:**
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (runs tsgo → biome → oxlint → lint → duplicates → codescene)
- `git add <file>` (ONLY after sub-loop exits 0)
- Read commands (`view`, `cat`, `grep`, `glob`) for understanding code

## Orchestrator: never read prompt content — pass the path only

Never open repository source, tooling files, or generated prompt files during orchestration:

- No flagged source files, no `scripts/**/*.ts`, no `package.json`, no configs
- No `Grep`, `Glob`, or `Task(explore)` for codebase discovery
- **NEVER read `.oxlint/prompts/*.prompt.md` files** — the orchestrator must NOT load prompt content into its context

The prompt generator script creates one fully-substituted prompt file per source file in
`.oxlint/prompts/`. The orchestrator dispatches each executor by passing ONLY the prompt file
path — the subagent reads the file itself.

**Executor dispatch format (mandatory):**

Every `Task` call uses exactly this prompt structure (no variations, no ad-hoc content):

```
Read the file at <prompt-file-path> and follow ALL instructions in it exactly.

That file contains your complete assignment: the file to fix, the oxlint issues with line numbers,
the fix patterns for each rule, the step-by-step workflow, and the strict prohibitions.

Do NOT begin working until you have read the full prompt file.
```

Replace `<prompt-file-path>` with the actual path from the manifest (e.g.,
`.oxlint/prompts/000-backend-db-repo-books-book.repository.prompt.md`).

**Forbidden:** passing prompt content inline, partial templates, link-only prompts, or any prompt
not following the format above.

Orchestrator otherwise uses only: categorize script output, the manifest JSON, executor
completion messages.

**Executors** read their prompt file, then their one assigned source file, plus rule files from
sub-loop's "Applicable Rule Files" output.

## Lint service (in-process, no HTTP server)

The project uses `scripts/lint-service.ts` — a purely in-process TypeScript service with an
in-memory FIFO queue. No server to start, no port to check.

- **Full-repo lint:** `bun run lint` (calls `requestFullRepoLint`)
- **File-scoped lint:** `bun run scripts/lint-service.ts -f <file> --id fix-oxlint`

Subagents should NOT run lint directly — they use `sub-loop.ts` which calls the in-process
lint service internally via `requestLint("sub-loop", [relPath], { typeAware: true, maxWarnings: 0 })`.

## Workflow

### Step 1: Run categorization

```bash
bun run scripts/oxlint-categorize.ts
```

This produces:
- `.oxlint/oxlint-results.json` — raw oxlint JSON output
- `.oxlint/summary.json` — total issues, by severity, top rules, top files
- `.oxlint/by-severity-*.json` — issues grouped by severity
- `.oxlint/by-rule-*.json` — issues grouped by rule code (top 50)
- `.oxlint/by-file-*.json` — **issues grouped by file (top 50)** — one JSON per file

### Step 2: Check for files beyond top 50

The categorize script caps `by-file` output at 50 files. If the summary shows more unique files:

```bash
# Generate by-file JSONs for ALL files (not just top 50)
bun run .agents/skills/fix-oxlint/generate-subagent-prompts.ts --generate-missing
```

The generator script will create by-file JSONs for any files missing them (using `oxlint-results.json`).

### Step 3: Check if any issues exist

If `.oxlint/summary.json` shows `totalIssues: 0` → report clean; done.

### Step 4: Generate subagent prompts

```bash
bun run .agents/skills/fix-oxlint/generate-subagent-prompts.ts
```

This reads ALL `by-file-*.json` files, applies the `SUB_AGENT_PROMPT_TEMPLATE.md` template
with substitutions, and writes one prompt file per source file to `.oxlint/prompts/`:

- `.oxlint/prompts/<index>-<safe-filename>.prompt.md` — the full prompt for the executor
- `.oxlint/prompts/_manifest.json` — manifest of all generated prompts with metadata

The script also prints a summary: total files, total issues, pool size (default 36).

### Step 5: Pool dispatch (36 concurrent subagents)

Maintain a **pool of 36 concurrent executor subagents** at all times. **NOT** waves — a pool
means you immediately fill any vacancy when a subagent completes.

**Parsing the manifest:**

Read `.oxlint/prompts/_manifest.json` to get the list of all entries. Each entry has:
- `file_path` — the source file to fix
- `prompt_file` — the generated prompt file path (e.g., `.oxlint/prompts/000-...prompt.md`)
- `issue_count` — number of oxlint issues
- `issue_rules` — list of rule codes

**Do NOT read the `prompt_file` contents** — just pass the path to the subagent.

**Pool loop:**

```
pool_size = 36
pending = [all entries from manifest]
active = {}  # agent_id → manifest entry

while pending is not empty OR active is not empty:
    # Fill pool to capacity
    while active.size < pool_size AND pending is not empty:
        entry = pending.shift()
        # Dispatch with ONLY the prompt file path — subagent reads it itself
        agent = dispatch Task(
          prompt = "Read the file at <entry.prompt_file> and follow ALL instructions in it exactly.\n\nThat file contains your complete assignment: the file to fix, the oxlint issues with line numbers, the fix patterns for each rule, the step-by-step workflow, and the strict prohibitions.\n\nDo NOT begin working until you have read the full prompt file.",
          agent_type = "general-purpose",
          mode = "background"
        )
        active[agent.id] = entry
    
    # Wait for any agent to complete
    # When an agent completes:
    result = read_agent(agent.id)
    entry = active[agent.id]
    delete active[agent.id]
    
    if result reports success (sub-loop exit 0, file staged):
        mark file as done
    elif result reports CROSS-FILE DEPENDENCY:
        record dependency, mark file as blocked
    elif result reports failure:
        re-queue file at end of pending (with failure note for retry)
    
    # Immediately fill the vacancy (loop continues)
```

**Key pool rules:**
- Never let the pool sit idle with pending files available
- Dispatch the next pending file immediately when a slot frees up
- Track completion via background agent notifications
- Use `read_agent(agent_id, wait=true)` to retrieve results after notification
- **Never read prompt file contents into orchestrator context** — pass the path only

### Step 6: Handle cross-file dependencies

After each completion, check for `CROSS-FILE DEPENDENCY:` reports:

```
CROSS-FILE DEPENDENCY:
  Target file: <assigned file>
  Blocked by: <other file that needs changes>
  Rule violated: <which rule>
  Required fix: <description>
```

- Mark the blocked file as `blocked` (not `done`)
- After the pool drains, dispatch a follow-up wave for `Blocked by` files
- Once blocker files are fixed, re-dispatch the blocked files

### Step 7: Handle failures

If an executor fails (sub-loop never passes, or it hit an unexpected error):

- Re-queue the file at the end of the pending list
- On retry, include failure context in the prompt (previous attempt's error output)
- Max 2 retries per file; if still failing after 2 retries, mark as `failed` and report

### Step 8: Final verification

After all files are done (or blocked/failed):

```bash
bun run scripts/oxlint-categorize.ts
```

Expect `totalIssues: 0` (or remaining issues only in `blocked` or `failed` files).

## Single-file case

If only one file has oxlint issues (or user names a specific file), still dispatch one executor
using the same template-based prompt. The orchestrator does not run sub-loop or edit files directly.

## Executor dispatch rules

- One executor = one file; may only read/edit that file (+ rule files from sub-loop)
- Orchestrator passes ONLY the prompt file path — the subagent reads the prompt file itself
- **Forbidden:** orchestrator reading prompt file contents into its context
- **Forbidden:** partial templates, inline prompt content, link-only prompts
- **Forbidden:** running any command other than `sub-loop.ts` and `git add` (and read commands for understanding)

## Cross-file dependencies

Executors never edit files they were not assigned to. When a fix requires changing another file,
the executor reports a `CROSS-FILE DEPENDENCY:` and the orchestrator schedules a follow-up dispatch.

## Final report

Include:

- Pool size used (default 36)
- Files flagged at start / fixed / blocked / failed
- Total executor dispatches (including retries)
- Cross-file dependencies encountered
- Final categorization summary (`totalIssues`)
- Any `blocked` or `failed` files with reasons

## Relationship to quality-gate

This skill does not run `bun quality-gate`. After a clean final categorization, the user can run
`bun quality-gate` separately if needed. This skill only addresses oxlint issues.
