---
name: quality-gate
description: >
  Run the project's `bun quality-gate` command and follow its output instructions to resolve
  all reported issues across stages (BASIC_CHECKS, CODESCENE, SONAR_SCAN, SONAR_RESULTS).
  Dispatches parallel subagents (one per file) within each lifecycle stage — no interleaving
  across stages. Each subagent calls `scripts/health/sub-loop.ts` for progressive per-file
  verification (tsgo → biome → lint-queue-client → codescene, in strict order, short-circuiting
  at first failure). Subagents NEVER run sonar-scan (very costly). Use when asked to run quality
  gates, fix quality-gate issues, or resolve CodeScene/SonarQube failures.
---

## Quality Gate Workflow

This skill orchestrates the project's `bun quality-gate` command. It runs the gate, reads its output
to identify which stage failed, dispatches **parallel subagents** (one per file) to fix issues within
that stage, and re-runs the gate until all stages pass.

### Architecture: Parallel Subagents per Lifecycle Stage

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUALITY GATE ORCHESTRATOR                     │
│                                                                   │
│  bun quality-gate → parse failure → dispatch subagents ─────────┐ │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │ │
│  │ Subagent 1  │  │ Subagent 2  │  │ Subagent N  │  (parallel) │ │
│  │ fixes File A│  │ fixes File B│  │ fixes File N│              │ │
│  │ runs sub-   │  │ runs sub-   │  │ runs sub-   │              │ │
│  │ loop.ts     │  │ loop.ts     │  │ loop.ts     │              │ │
│  └─────────────┘  └─────────────┘  └─────────────┘              │ │
│                                                                   │
│  wait for all → verify → re-run bun quality-gate ←──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle**: Subagents run in parallel **within one lifecycle stage only**. No interleaving
across stages — e.g., don't dispatch CODESCENE fix subagents while SONAR fix subagents are still running.

### Critical Rules

1. **`bun run lint` IS the lint queue client.** The `package.json` `lint` script is a thin wrapper around `requestFullRepoLint` from `scripts/lint-queue-client.ts`, so running it directly is safe — requests serialize through the lint queue server. Make sure the server is running first:
   ```bash
   curl -s http://localhost:4777/status  # Check server is running
   ~/.bun/bin/bun run scripts/lint-queue-server.ts &  # Start it if not running
   ```
   For file-scoped lint (faster), call the lint queue client directly:
   ```bash
   curl -s -X POST http://localhost:4777/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"quality-gate","files":["file1.ts","file2.ts"]}'
   ```

2. **Subagents NEVER run `bun sonar-scan` or `bun sonar-manager.ts`.**
   SonarQube scan is VERY COSTLY. Only the orchestrator (this skill) handles sonar stages.
   This is a hard prohibition — no exceptions, no workarounds.

3. **Each subagent calls `scripts/health/sub-loop.ts` for per-file verification:**
   ```bash
   bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>
   ```
   The sub-loop script runs checks in strict order (tsgo → biome → lint → codescene) and
   **short-circuits at the first failure** — it stops and prints errors for the subagent to fix.
   The subagent fixes the errors and re-runs the script until it passes (exit 0).

4. **Progressive loop — no skipping ahead.** The sub-loop always checks in order:
   - If tsgo fails → only fix tsgo. Don't run biome/lint/codescene until tsgo passes.
   - If tsgo passes but biome fails → only fix biome.
   - If tsgo+biome pass but lint fails → only fix lint.
   - If tsgo+biome+lint pass but codescene fails → only fix codescene.

5. **Use the run-test script for test files.** When fixing or refactoring a test file:
   ```bash
   bun run scripts/run-test/run-test.ts <test-path>
   bun run scripts/run-test/run-test.ts --last <test-path>  # View last result
   ```

6. **Read instruction files before fixing.** The `sub-loop.ts` script prints which instruction
   files apply to the target file. Subagents MUST read them before fixing. The mapping is:
   - `frontend/**/*.ts(x)` or `app/**/*.ts(x)` → `.github/instructions/frontend.instructions.md`
   - `backend/**/*.ts` → `.github/instructions/backend.instructions.md`
   - `**/*.test.ts(x)`, `**/*.spec.ts(x)`, or `scripts/run-test/**/*.ts` → `.github/instructions/tests.instructions.md`
   - A file may match **multiple** instruction files (e.g., `backend/db/test/*.test.ts` matches
     both `backend.instructions.md` and `tests.instructions.md`). Read ALL matching files.

7. **Read AGENTS.md per layer.** The `sub-loop.ts` script prints which AGENTS.md files apply.
   Subagents MUST read them before fixing. The mapping is:
   | File Path Prefix | AGENTS.md Files to Read (in addition to root `AGENTS.md`) |
   |---|---|
   | `app/` | `app/AGENTS.md` |
   | `frontend/views/` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` |
   | `frontend/stores/` | `frontend/stores/AGENTS.md`, `frontend/AGENTS.md` |
   | `frontend/common/graphql/sharedDocuments/` | `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` |
   | `frontend/common/graphql/` | `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` |
   | `backend/services/` | `backend/services/AGENTS.md`, `backend/AGENTS.md` |
   | `backend/graphql/` | `backend/graphql/AGENTS.md`, `backend/AGENTS.md` |
   | `backend/db/repo/` | `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` |
   | `backend/db/seeds/` | `backend/db/seeds/AGENTS.md`, `backend/AGENTS.md` |
   | `backend/db/test/` | `backend/db/test/AGENTS.md`, `backend/AGENTS.md` |
   | `backend/types/` | `backend/types/AGENTS.md`, `backend/AGENTS.md` |
   | `scripts/run-test/` | `scripts/run-test/AGENTS.md` |
   Root `AGENTS.md` is always applicable.

8. **Fix-or-Report for cross-file violations.** After reading the instruction files and AGENTS.md
   for the target file, the subagent checks for rule violations:
   - **If the violation can be fixed within the SAME file**: fix it directly.
   - **If fixing the violation requires modifying ANOTHER file**: do NOT modify that file.
     Instead, the subagent **reports** the cross-file dependency to the orchestrator in its
     completion message using this format:
     ```
     CROSS-FILE DEPENDENCY:
       Target file: <this file>
       Blocked by: <other file that needs changes>
       Rule violated: <which rule from instruction file or AGENTS.md>
       Required fix: <description of what the other file needs>
     ```
   The orchestrator collects all cross-file reports and handles them in a dedicated follow-up
   wave (dispatching a new subagent for the dependency file, or fixing it directly if it's a
   shared type/interface change).
   **Never modify a file you were not assigned to.** Only the orchestrator coordinates
   multi-file changes.

---

### Phase 1: Start Quality Gate

Run the quality gate command and capture its output.

**ALWAYS use `bun quality-gate:fresh` on the FIRST invocation of a session.** A fresh run discards
any stale state in `.quality-gate-state.json` (which may reference issues from a previous session
that have since been fixed, or vice versa) and starts cleanly from the first stage. This avoids
acting on outdated state and ensures the gate reflects the current working tree.

```bash
bun quality-gate:fresh   # FIRST run of a session — always fresh
```

On subsequent invocations within the SAME session (e.g., resuming after a fix wave), use the
regular command so the state machine resumes from the stage that was just fixed:

```bash
bun quality-gate         # subsequent runs — resume from last failed stage
```

Only run `bun quality-gate` (without `:fresh`) on the first invocation if the user explicitly
asks to resume from existing state, or if you are certain the persisted state is still accurate
(e.g., you just ran `:fresh` moments ago and only made targeted fixes since).

Read the output carefully. It will indicate:
- Which stage failed (`BASIC_CHECKS`, `CODESCENE`, `SONAR_SCAN`, or `SONAR_RESULTS`)
- The owner of the failure (`quality-gate`, `codescene`, or `sonar-manager`)
- Specific remediation instructions (printed in colored text)

State is persisted in `.quality-gate-state.json`. Re-running `bun quality-gate` resumes from the
last failed stage once its issues are resolved.

---

### Phase 2: Parse Stage Failure & Instructions

Map the failed stage to the correct remediation workflow:

| Failed Stage | Owner | What to Do |
|---|---|---|
| `BASIC_CHECKS` | `quality-gate` | Fix tsgo (grouped parallel) → biome (parallel) → lint (parallel) |
| `CODESCENE` | `codescene` | Fix CodeScene warnings — dispatch parallel subagents per file |
| `SONAR_SCAN` | `sonar-manager` | **Orchestrator only** — no subagents. Check connectivity/config. |
| `SONAR_RESULTS` | `sonar-manager` | Fix duplications first (parallel per group), then issues (parallel per file) |

If the owner is NOT `quality-gate`, the recovery check runs automatically on the next `bun quality-gate`
invocation. Fix the underlying issues first, then re-run `bun quality-gate`.

---

### Phase 3: Fix BASIC_CHECKS — tsgo (Grouped Parallel)

**Strategy**: tsgo errors are grouped by dependency — files sharing imports, type references, or
function signatures are bundled into the same group. This prevents conflicts where a type change
in one file breaks another file.

1. Run `bun tsgo` to get all type errors.

2. **Group errors by dependency**:
   - If File A imports from File B, they're in the same group.
   - If File A and File C share a type from File D, they're in the same group.
   - Files with no dependency overlap go in separate groups.
   - If unsure, group by directory (files in the same directory likely share types).

3. For each group **(sequentially — one group at a time)**:
   a. **Dispatch one subagent per file** in the group — launch all subagents in a SINGLE response
      (parallel within the group). Use `agent_type: "general-purpose"` with `mode: "background"`.
   b. Each subagent receives the subagent prompt template (see below) with:
      - `lifecycle: tsgo`
      - The specific type errors for that file
   c. Each subagent: reads instruction file + AGENTS.md, fixes type errors, then runs:
      ```bash
      bun run scripts/health/sub-loop.ts <file> --lifecycle tsgo
      ```
   d. **Wait for all subagents in the group to complete.**
   e. Verify the whole group: `bun tsgo` — if new errors appeared (cascading type changes from
      the fixes), add the newly-affected files to the next group.

4. After all groups are done: re-run `bun tsgo` to verify project-wide clean.

---

### Phase 4: Fix BASIC_CHECKS — biome (Parallel)

1. Run `bun biome:check` to get all biome issues.

2. Get the list of files with biome issues from the output.

3. **Dispatch one subagent per file** — launch all subagents in a SINGLE response (parallel).
   Each subagent receives:
   - `lifecycle: biome`
   - The biome issues for that file

4. Each subagent: fixes biome issues, then runs:
   ```bash
   bun run scripts/health/sub-loop.ts <file> --lifecycle biome
   ```
   (This runs tsgo → biome in order, short-circuiting if tsgo fails.)

5. **Wait for all subagents to complete.**

6. Re-run `bun biome:check` to verify clean.

---

### Phase 5: Fix BASIC_CHECKS — lint (Parallel, via Queue Client)

1. Submit all files to lint queue to get the list of files with lint errors:
   ```bash
   curl -s -X POST http://localhost:4777/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"quality-gate-discover","files":["<all-affected-files>"]}'
   ```

2. **Dispatch one subagent per file** with lint errors — launch all in a SINGLE response (parallel).
   Each subagent receives:
   - `lifecycle: lint`
   - The lint errors for that file

3. Each subagent: reads instruction file, fixes lint errors, then runs:
   ```bash
   bun run scripts/health/sub-loop.ts <file> --lifecycle lint
   ```
   (This runs tsgo → biome → lint in order, short-circuiting if an earlier check fails.)

4. **Wait for all subagents to complete.**

5. Re-submit all fixed files to lint queue to verify clean.

6. Resume: re-run `bun quality-gate` — it advances to CODESCENE stage.

---

### Phase 6: Fix CODESCENE (Parallel)

1. Run `bun run codescene --scan` to get the list of flagged files.

2. **Dispatch one subagent per flagged file** — launch all in a SINGLE response (parallel).
   Each subagent receives:
   - `lifecycle: codescene`
   - The CodeScene warnings for that file

3. Each subagent: reads instruction file + AGENTS.md, fixes CodeScene health warnings, then runs:
   ```bash
   bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
   ```
   (This runs tsgo → biome → lint → codescene --file in order, short-circuiting at any failure.)

4. **Wait for all subagents to complete.**

5. Re-run `bun run codescene --scan` to verify all warnings are resolved.

6. Re-run `bun quality-gate` — it recovers ownership from `codescene` and advances to SONAR_SCAN.

---

### Phase 7: Fix SONAR_SCAN (Orchestrator Only — NO Subagents)

**⚠️ CRITICAL: SonarQube scan is VERY COSTLY. Subagents NEVER run sonar-scan.**

1. The orchestrator runs `bun quality-gate` which executes `bun sonar-scan` internally.
2. If sonar-scan fails: check connectivity, token, and configuration at the orchestrator level.
3. **No subagents are dispatched for this stage.** This is orchestrator-only.
4. Once sonar-scan passes, the quality gate advances to SONAR_RESULTS.

---

### Phase 8: Fix SONAR_RESULTS (Parallel, No sonar-scan)

**Mandatory priority: Duplications first, then Issues.**

#### 8a. Duplications (Parallel per Group)

1. Run `bun scripts/sonar-manager.ts list-duplicates` to get duplication groups.
2. For each duplication group **(sequentially — one group at a time)**:
   a. **Dispatch one subagent per file** in the group — launch all in a SINGLE response (parallel
      within the group). Each subagent receives:
      - `lifecycle: sonar-results`
      - The duplication details and the other files in the group
   b. Each subagent: reads instruction file + AGENTS.md, refactors to eliminate duplication, then runs:
      ```bash
      bun run scripts/health/sub-loop.ts <file> --lifecycle sonar-results
      ```
      (This runs tsgo → biome → lint → codescene — NO sonar-scan, NO sonar-manager.)
   c. **Wait for all subagents in the group to complete.**
   d. Clear resolved duplications:
      ```bash
      bun scripts/sonar-manager.ts delete --file <path>
      # Or clear all at once:
      bun scripts/sonar-manager.ts --all-duplicates
      ```
3. Re-run `bun scripts/sonar-manager.ts list-duplicates` — must return empty.

#### 8b. Issues (Parallel per File)

1. Run `bun scripts/sonar-manager.ts list-files` to get files with issues.
2. **Dispatch one subagent per file** — launch all in a SINGLE response (parallel).
   Each subagent receives:
   - `lifecycle: sonar-results`
   - The sonar issues for that file (subagent gets them via `bun scripts/sonar-manager.ts list-issues --file <path>`)
3. Each subagent: fixes each issue (code smells, bugs, vulnerabilities), then runs:
   ```bash
   bun run scripts/health/sub-loop.ts <file> --lifecycle sonar-results
   ```
4. **Wait for all subagents to complete.**
5. Clear resolved issues: `bun scripts/sonar-manager.ts delete --file <path>`
6. Re-run `bun scripts/sonar-manager.ts list-files` — must return empty.

#### 8c. Final Verification

Both `list-duplicates` and `list-files` must return empty before proceeding.

Re-run `bun quality-gate` — it recovers ownership and verifies all stages pass.

---

### Phase 9: Resume / Loop

Re-run `bun quality-gate` until all stages pass.

The state machine behavior:
- If the previous owner was `codescene` or `sonar-manager`, the script runs a recovery check first.
- If the recovery check passes, ownership returns to `quality-gate` and stages continue.
- If the recovery check fails, the script exits — fix remaining issues and re-run.
- When all 4 stages pass: `✨✨ ALL QUALITY GATES PASSED! ✨✨` and lifecycle = DONE.

If the same stage fails again after fixes, repeat the relevant fix phase (3–8).
Continue the loop until the quality gate passes completely.

---

### Handling Cross-File Dependency Reports

When subagents report a `CROSS-FILE DEPENDENCY` (a rule violation requiring modification of a
file other than the one they were assigned), the orchestrator:

1. **Collects** all cross-file reports from the current wave of subagents.
2. **Deduplicates** by target file — if multiple subagents report the same file needs changes,
   merge the required fixes.
3. **Dispatches a new subagent wave** for the dependency files, one subagent per file, using the
   same subagent prompt template with `lifecycle: <current stage>`.
4. Each new subagent repeats the discovery + fix-or-report cycle for ITS file.
5. If the new wave produces further cross-file reports, repeat.
6. Once no more cross-file dependencies are reported, proceed to the verification step for the
   current stage.

This ensures **no subagent ever modifies a file it wasn't assigned to**, preventing conflicts
in parallel execution.

---

### Subagent Prompt Template

When dispatching subagents, provide this prompt (substitute `<file-path>`, `<lifecycle>`, and
paste the specific errors):

```
You are fixing quality issues in: <file-path>
Current quality gate lifecycle stage: <lifecycle>

## STEP 1: Discover Applicable Rule Files (run this first)

Run the sub-loop script to see which instruction files and AGENTS.md files apply:
 bun run scripts/health/sub-loop.ts <file-path> --lifecycle <lifecycle>

The script will print an "Applicable Rule Files" section listing:
 - Instruction files (.github/instructions/*.instructions.md) that apply to this file
 - AGENTS.md files (root + layer-specific) that apply to this file

## STEP 2: Read ALL Listed Rule Files

Read EVERY file the script listed:
 1. Read each instruction file listed (e.g., backend.instructions.md, tests.instructions.md)
 2. Read each AGENTS.md file listed (root AGENTS.md + layer-specific ones)
 3. Keep these rules in mind while fixing — your fixes MUST comply with them

## STEP 3: Read the Target File & Understand the Errors

Read <file-path> and review the errors printed below. Understand what caused each error.

## STEP 4: Fix Issues Following the Instruction File Rules

Fix the issues in <file-path>. Your fixes MUST comply with the rules in the instruction files
and AGENTS.md you read in Step 2.

FIX-OR-REPORT RULE:
 • If a rule violation (from the instruction files or AGENTS.md) can be fixed within
   THIS file (<file-path>): fix it directly.
 • If fixing a violation requires modifying ANOTHER file: DO NOT modify that file.
   Instead, STOP and report the cross-file dependency using this format:

   CROSS-FILE DEPENDENCY:
     Target file: <file-path>
     Blocked by: <other file that needs changes>
     Rule violated: <which rule from instruction file or AGENTS.md>
     Required fix: <description of what the other file needs>

   Then continue fixing any remaining in-file issues in <file-path>.

 NEVER modify a file you were not assigned to. Only the orchestrator coordinates
 multi-file changes.

## STEP 5: Verify Your Fix

 bun run scripts/health/sub-loop.ts <file-path> --lifecycle <lifecycle>

If the script reports errors, fix them and re-run until it passes (exit 0).

## STEP 6: Report Completion

Report your results to the orchestrator:
 - What was fixed in this file
 - Any CROSS-FILE DEPENDENCY reports (if violations required modifying other files)
 - Final sub-loop exit status (0 = passed)

## PROHIBITIONS
 - `bun run lint` IS the lint queue client — safe to run directly (it serializes through the queue server). However, subagents should prefer the per-file `sub-loop.ts` script for file-scoped verification.
 - NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts` — those are orchestrator-only
 - NEVER modify files other than <file-path>

ERRORS TO FIX:
<paste errors from tsgo/biome/lint/codescene output for this file>
```

### Final Report

When all quality gates pass, report:
- Which stages required fixes
- How many subagents were dispatched per stage
- What files were modified
- How many iterations were needed
- Any issues that required manual intervention
