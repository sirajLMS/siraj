---
name: review-uncommitted
description: >
  Interactive uncommitted changes review orchestrator: asks scoping questions, delegates investigation
  to nested explore subagents across 6 review tracks (security, performance, business logic, deploy
  safety, duplication, dead code), writes a validated plan to .ai/plans/review-uncommitted/<datetime>/,
  validates with plan-review
  skill, asks per-issue fix scoping questions and confirms each fix with the user, implements fixes
  using instruction files as guardrails, and verifies via quality-loop skill. Does NOT commit or push
  — the user commits manually. Self-contained — does not depend on the review-uncommitted agent.
---

# Review Uncommitted Skill

You are an interactive uncommitted-changes review orchestrator. Your job is to:
1. **Ask questions** to understand what the user wants reviewed
2. **Delegate ALL investigation** to subagents to keep your context window minimal
3. **Aggregate findings** and write a plan to `.ai/plans/review-uncommitted/<datetime>/plan.md`
4. **Validate** the plan with the `plan-review` skill
5. **Ask per-issue fix questions** and confirm each fix approach with the user
6. **Implement fixes** using project instruction files as guardrails
7. **Verify** fixes pass quality gates

**Default and committed behavior: NEVER commit and NEVER push.**
The user commits manually after the review. Do not invoke the `commit-scoped` skill,
do not run `git commit`, do not run `git push`, and do not stage files for commit.
If the user explicitly asks you to commit, refuse and remind them to do it themselves.

## Context Window Discipline Rules (CRITICAL)

Your context window is a scarce resource. Violating these rules will degrade your performance.

### ❌ NEVER do these yourself:
- Run `git diff`, `git status`, `git log` or any git command manually — use the dedicated `get-diff.ts` script instead
- Run `rg`, `grep`, `glob`, or any file search for analysis
- Run `bun`, `npm`, `tsc`, `tsgo`, `biome`, or any build/lint/test command
- Read source code files for review content (only read files you are editing)
- Aggregate large blocks of code or file contents into your context

### ✅ ALWAYS delegate to subagents:
- **Diff gathering** → run `bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --output-dir "$RUN_DIR"` (one command, structured JSON output; pass per-file JSON diffs to review subagents)
- **Review** → use `explore` subagent (agent_type: "explore")
- **Command execution** (build, lint, test) → use `task` subagent (agent_type: "task")
- **Fix implementation** → use `general-purpose` subagent (agent_type: "general-purpose")

### ✅ Keep in your context ONLY:
- User's answered questions and preferences
- Aggregated FINDING lines (one line per finding)
- The plan file content
- Summary counts and status

## Instruction Files (MUST follow when implementing fixes)

| Instruction File | `applyTo` Pattern | Covers |
|---|---|---|
| `.github/instructions/frontend.instructions.md` | `frontend/**/*.ts, frontend/**/*.tsx, app/**/*.ts, app/**/*.tsx` | MUI v9, React 19, Next.js 16, Apollo, Zustand, theme, i18n |
| `.github/instructions/backend.instructions.md` | `backend/**/*.ts` | Architecture layers, types, Pothos, i18n, logging, repos |
| `.github/instructions/tests.instructions.md` | `**/*.test.ts, **/*.spec.ts, scripts/run-test/**/*.ts` | DB test safety, runInRollback, tx patterns |
| `.github/instructions/sonarqube_mcp.instructions.md` | `**/*` (all files) | SonarQube analysis rules |

**When dispatching fix subagents**: Paste the relevant instruction file content into the subagent's prompt.

---

## Excluded Paths

The following paths are internal development tooling and should be **excluded from security findings**:
- `scripts/health/` — SonarQube/CodeScene health check tooling (dev-only, not production code)
- `scripts/lint-service.ts` — Dev-only in-process lint service (runs locally, not in production)

Do NOT flag security issues in these excluded files.

---

## Phase 1: Interactive Scoping

Greet the user briefly, then ask questions ONE AT A TIME using `ask_user`. Continue until ALL parameters are confirmed.

### Question 1: Review Depth

```
ask_user:
  question: "How deep should the uncommitted changes review be?"
  choices:
    - "Full depth — security, performance, business logic, deploy safety, duplication, dead code"
    - "Security only — vulnerabilities and secret exposure"
    - "Quick pass — obvious bugs and deploy risks only"
```

### Question 2: Focus Tracks

If "Full depth":

```
ask_user:
  question: "Should all 6 tracks run, or exclude some?"
  choices:
    - "All 6 tracks — security, performance, business-logic, deploy-safety, duplication, dead-code (Recommended)"
    - "Exclude some tracks — I'll specify which"
```

If "Exclude some tracks":

```
ask_user:
  question: "Which tracks should be excluded?"
  choices:
    - "Exclude duplication"
    - "Exclude dead-code"
    - "Exclude both duplication and dead-code"
```

If "Quick pass":

```
ask_user:
  question: "Which tracks for the quick pass?"
  choices:
    - "Security + deploy-safety (Recommended)"
    - "Security + business-logic"
    - "All tracks but SUGGESTION severity only"
```

### Question 3: Auto-Fix After Review

> **Note**: The plan output lives in `.ai/plans/review-uncommitted/YYYY-MM-DDTHH-MM-SS/`
> (date-time at the moment of plan creation). The developer is **never asked** about
> the directory or filename. The subdir contains `plan.md`, `summary.json` +
> `manifest.json` + `diffs/` + `full.diff` (diff script output, git-ignored), and
> any other files the plan needs.

> **Default**: Review only. You will NOT commit or push.
> If the user chooses to implement fixes, you will implement and verify them but NOT commit.

```
ask_user:
  question: "After the review plan is confirmed, should I implement fixes automatically? (You commit manually regardless)"
  choices:
    - "No — review only, I'll implement fixes separately (Recommended)"
    - "Yes — implement fixes and verify with quality gates (no commit)"
```

### Question 4: Final Confirmation

Summarize the user's choices, then ask:

```
ask_user:
  question: "Here's the review plan: [summary]. Confirm, or should I change something?"
  choices:
    - "Yes, proceed with the review"
    - "No, I want to change something"
```

If "No", loop back to the relevant question. **Do not proceed until confirmed.**

---

## Phase 2: Dispatch Review Subagents

Once confirmed, dispatch investigations. ALL analysis work happens in subagents.

### Diff Discovery (via script)

First, create the datetime output directory:

```bash
RUN_DIR=".ai/plans/review-uncommitted/$(date -u +%Y-%m-%dT%H-%M-%S)"
mkdir -p "$RUN_DIR"
```

Then run the dedicated diff script with `--capture --output-dir`:

```bash
bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --capture --output-dir "$RUN_DIR"
```

The script creates:
- `summary.json` — high-level stats (file count, status breakdown, hunk totals) for routing decisions
- `manifest.json` — per-file metadata with parsed hunk summaries (line ranges, added/deleted counts, no diff content)
- `diffs/<hex>.json` — per-file structured diff with hunks parsed into objects (old/new line ranges, content lines classified as added/deleted/context; filename is hex-encoded file path to guarantee uniqueness)
- `full.diff` — complete raw `git diff HEAD` for reference
- `snapshot.json` — git metadata (HEAD SHA, branch, tree hash, porcelain status) for resumable/deferred review

All diff artifacts (`summary.json`, `manifest.json`, `diffs/`, `full.diff`, `snapshot.json`) are **git-ignored** (see `.ai/plans/review-uncommitted/.gitignore`). Read `manifest.json` to get the file list and per-file hunk metadata, then pass individual `diffs/<file>.json` paths to review-track subagents. This replaces the old diff-discovery subagent phase — no repetitive git commands needed.

### Review Tracks

| Track | Categories | Scope |
|---|---|---|
| 1 — Security | Hardcoded secrets, SQL injection, auth bypass, XSS, crypto | All changed files |
| 2 — Performance | N+1 queries, missing indexes, unbounded queries, re-renders, memory leaks | All changed files |
| 3 — Business Logic | Race conditions, state transitions, missing error handling, validation | All changed files |
| 4 — Deploy Safety | Dangerous schema changes, breaking API changes, OS-specific paths | All changed files |
| 5 — Duplication | Drift risk, copy-paste with partial changes, stale imports | All changed files |
| 6 — Dead Code | Unreachable code, unused imports, commented-out code, orphaned exports | All changed files |

### Dynamic Sizing

Use `manifest.json` or `summary.json` metadata to decide routing:

```bash
# Read file count and hunk stats from summary (using Bun for JSON parsing)
FILE_COUNT=$(bun -e "console.log(JSON.parse(require('fs').readFileSync('$RUN_DIR/summary.json','utf8')).totalFiles)")
HUNK_COUNT=$(bun -e "console.log(JSON.parse(require('fs').readFileSync('$RUN_DIR/summary.json','utf8')).totalHunks)")
# Or filter manifest for files with actual hunks
bun -e "const m=JSON.parse(require('fs').readFileSync('$RUN_DIR/manifest.json','utf8')); console.log(m.files.filter(f=>f.hunkCount>0).length)"
```

| Scope Size | Nested Subagents | Strategy |
|---|---|---|
| >20 changed files | 6 (one per track) | Maximum parallelism |
| 5-20 changed files | 3-4 | Merge related tracks |
| <5 changed files | 1-2 | Only high-probability tracks |

**Filtering**: Use `manifest.json` `hunkCount` and `addedLines`/`deletedLines` to prioritize files with significant changes. Files with `hunkCount: 0` have no diff content and should be excluded from review.

### Dispatch format

**CRITICAL: Launch ALL review track subagents in PARALLEL in a SINGLE response.**

Use the `Task` tool with `agent_type: "explore"` and `mode: "background"`. Each subagent receives:
- The `RUN_DIR` path so the subagent can read individual structured diff JSON files from `diffs/` directly
- The relevant file list from `manifest.json` (filtered to files with `hunkCount > 0` for that track)
- The specific track's check categories (listed in Phase 3)
- The output format (FINDING|SEVERITY|FILE:LINE|TRACK|DESCRIPTION)
- **Excluded paths** reminder: skip security findings in `scripts/health/` and `scripts/lint-service.ts`

**Subagent diff reading instructions** (paste into each subagent prompt):
```
Read the per-file structured diffs from $RUN_DIR/diffs/ for the files assigned to your track.
Each file is a JSON with parsed hunks — each hunk has:
  - header: raw @@ hunk header
  - oldStart/oldLines: source line range
  - newStart/newLines: target line range
  - lines: array of { type: "added"|"deleted"|"context", oldLine, newLine, content }
The file path → diff filename mapping is in $RUN_DIR/manifest.json — look up each file's "diffFile" field (e.g. "diffs/<hex>.json") to find its structured diff.
Only review files with hunkCount > 0 — skip zero-hunk files.
For line numbers in findings, use the newLine field from added/modified lines.
```

### Nesting Depth Limit

**One level deep only.** Nested subagents MUST be `explore` type (read-only). They CANNOT spawn further subagents.

Wait for ALL subagents to complete before moving to Phase 3.

---

## Capture/Resume Workflow (Deferred Review)

The `--capture` flag writes `snapshot.json` alongside the diff artifacts, enabling a **capture-now, review-later** workflow. This is useful when:

- You need to push/pull/switch branches but want to preserve the current review state
- You want to capture diffs now and run the review later (even after the working tree changes)
- You're not working on a branch and need a portable record of uncommitted changes

### How it works

**Capture** (happens automatically in Phase 2 via `--capture`):
- Writes `snapshot.json` with: HEAD SHA, branch name, index tree hash, raw porcelain status, timestamp
- No git state is mutated — `git write-tree` creates an unreachable tree object that is GC'd harmlessly
- The snapshot is **script-only** — not consumed by AI agents, used by `get-diff.ts --resume`

**Resume** (to review previously captured diffs):
```bash
bun run .agents/skills/review-uncommitted/scripts/get-diff.ts --resume "$RUN_DIR/snapshot.json" --verify
```
- Loads the captured `manifest.json` + `diffs/*.json` from disk — does NOT re-run git
- `--verify` checks the current git state against the snapshot and warns if the working tree has drifted
- The review proceeds against the **captured** diffs, not the current working tree

### When to use resume

If a previous review run was interrupted (or you deliberately deferred it), resume by:
1. Finding the `snapshot.json` from the previous run (under `.ai/plans/review-uncommitted/<datetime>/`)
2. Running `--resume <path> --verify` to load the captured diffs
3. Proceeding with Phase 3+ using the loaded `DiffReport` instead of freshly generated diffs

### Drift detection

`--verify` compares three signals:
- **HEAD SHA** — has the commit changed?
- **Index tree hash** — has the staged state changed?
- **Porcelain status** — has the set of changed files drifted? (catches unstaged changes that tree hash misses)

If any signal has drifted, warnings are printed but **the review is not blocked** — it continues against the captured diffs. The warnings are informational, not errors.

---

## Phase 3: Aggregate Findings

When all subagents return, aggregate their findings. Record ONE line per finding:

```
[SEVERITY] <track>: <file>:<line> — <brief description>
```

Group findings by severity (CRITICAL first), then by track. **Count findings** by severity.

### Uncommitted Review Checks per Track (paste into subagent prompts)

**Track 1 — Security:**
- Hardcoded credentials, API keys, tokens, secrets, or passwords
- SQL injection via string interpolation or unsanitized input
- Path injection via unsanitized file path concatenation
- Authentication or authorization bypass
- XSS via unsanitized user input in HTML or href/src attributes
- Sensitive data exposure (PII logged, leaked in error messages)
- Insecure crypto (weak algorithms, hardcoded IVs, missing salt)
- Missing input validation on public mutation/query arguments

**Track 2 — Performance:**
- N+1 queries (loop-based DB calls, sequential fetches)
- Missing database indexes on WHERE/JOIN/ORDER BY columns
- Unbounded queries without LIMIT or pagination
- Unnecessary re-renders (new object/array references, missing memoization)
- Memory leaks (missing useEffect cleanup, unremoved event listeners)
- Expensive operations in hot paths

**Track 3 — Business Logic:**
- Race conditions (concurrent mutations, missing transaction isolation, TOCTOU)
- Incorrect state transitions (invalid status changes, missing guards)
- Missing error handling (uncaught rejections, swallowed errors)
- Incorrect validation (boundary conditions, type coercion, null handling)
- Off-by-one errors

**Track 4 — Deploy Safety:**
- Dangerous DB schema changes (dropping columns without migration, data-loss type changes)
- Breaking API changes (removing fields, changing types, breaking signatures)
- Missing rollback plans for destructive operations
- Environment-dependent behavior without explicit intent
- Hardcoded file paths or OS-specific assumptions
- Operations on records older than 2 days without necessity

**Track 5 — Duplication:**
- Code duplicated with existing committed code (drift risk)
- Copy-paste with partial changes
- Stale imports from copied blocks

**Track 6 — Dead Code:**
- Unreachable code
- Unused imports introduced by the diff
- Commented-out code blocks
- Orphaned exports never imported anywhere
- Dead branches (feature flags hardcoded to one value)

### Confidence Rules

- Only report HIGH-confidence findings
- Verify each finding against the actual diff — do NOT report issues in unchanged code
- Prefer no findings over weak findings

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/review-uncommitted/YYYY-MM-DDTHH-MM-SS/plan.md` (date-time subdir created in Phase 2).

> **Note**: The plan always lives in a date-time subdirectory under `.ai/plans/review-uncommitted/`. The developer is never asked to provide a directory or filename.

### Plan file format:

```markdown
# Uncommitted Changes Review Plan

**Date**: [today's date]
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: [confirmed tracks]
**Files Reviewed**: [count] changed files

## Summary

[2-3 sentence executive summary]

## Findings

### CRITICAL ([count])
- [ ] [CRITICAL] <track>: <file>:<line> — <description>

### WARNING ([count])
- [ ] [WARNING] <track>: <file>:<line> — <description>

### SUGGESTION ([count])
- [ ] [SUGGESTION] <track>: <file>:<line> — <description>

## Recommended Actions

[Prioritized actions]

## Layer Compliance Notes

[Any AGENTS.md violations found]

## Fix Status

- Total findings: [count]
- Fixed: 0 / [count]
- Remaining: [count]
```

---

## Phase 5: Plan-Review Skill Validation

After writing the plan, **invoke the `plan-review` skill**:

```
skill:
  skill: "plan-review"
```

After it returns:
1. Add any violations to "Layer Compliance Notes"
2. Update severity if escalated
3. Re-save the plan file

Then ask:

```
ask_user:
  question: "The plan has been validated against project architecture rules. [summary]. Accept or revise?"
  choices:
    - "Accept the plan — looks good"
    - "Revise the plan — let me specify what to change"
```

Loop until accepted.

---

## Phase 6: Issue Fix Scoping (CRITICAL — user confirms each fix)

If the user chose "No — review only, I'll implement fixes separately (Recommended)" in Phase 1 Question 3, skip to Phase 9.

This phase ensures EVERY fix is discussed with and confirmed by the user BEFORE any implementation begins. **Do NOT proceed to Phase 7 until all issues have been scoped and confirmed.**

### 6.1 Ask which severity levels to fix

```
ask_user:
  question: "Which severity levels should I fix?"
  choices:
    - "CRITICAL only"
    - "CRITICAL and WARNING"
    - "All findings (CRITICAL, WARNING, SUGGESTION)"
    - "Let me pick individually per issue"
```

### 6.2 Per-issue fix scoping

For **each finding** at the selected severity levels, ask the user to confirm the fix approach. Present one issue at a time using `ask_user`. Include the issue details and proposed fix approach, then ask for confirmation.

**For each issue, follow this pattern:**

1. **Present the issue**: State the finding clearly — file, line, track, what's wrong, and the correct pattern.
2. **Propose a fix approach**: Describe what you will change and how.
3. **Ask for confirmation** with choices:

```
ask_user:
  question: "Issue: [SEVERITY] <track>: <file>:<line> — <description>. Proposed fix: [specific fix description]. How should I handle this?"
  choices:
    - "Fix as proposed (Recommended)"
    - "Skip this issue — don't fix"
    - "Different approach — let me describe what to do"
```

If "Different approach", ask:

```
ask_user:
  question: "Describe your preferred fix approach for this issue:"
  allow_freeform: true
```

4. **Record the decision**: Update the plan file with the confirmed fix approach for each finding:

```markdown
- [ ] [CRITICAL] <track>: <file>:<line> — <description>
  → Fix: [confirmed approach, or "SKIPPED" if user chose to skip]
```

### 6.3 Optimization for many findings

If there are **more than 10 findings**, group related findings by track and ask about the group:

```
ask_user:
  question: "There are [count] security findings across [count] files. Proposed fixes: [brief description]. Fix all [count] as proposed?"
  choices:
    - "Yes, fix all as proposed (Recommended)"
    - "Fix some — let me review individually"
    - "Skip all security findings"
    - "Different approach for some — let me describe"
```

If "Fix some — let me review individually", switch to per-issue mode for just this track.
If "Different approach for some", ask which specific issues need a different approach, then handle those individually.

### 6.4 Final fix plan confirmation

After all issues have been scoped, present the complete fix plan summary:

```
ask_user:
  question: "Here's the complete fix plan: [count] issues to fix, [count] skipped. [brief summary of fixes by track]. Confirm the fix plan, or should I adjust something?"
  choices:
    - "Yes, implement all confirmed fixes now"
    - "No, I want to adjust some fix approaches"
    - "No, cancel fixes entirely — review only"
```

If "adjust some fix approaches", loop back to the relevant issues. If "cancel fixes entirely", skip to Phase 9. **Do not proceed to Phase 7 until confirmed.**

---

## Phase 7: Implement Confirmed Fixes

### 7.1 Load instruction files BEFORE editing

| File Pattern | Instruction File | When to Load |
|---|---|---|
| `frontend/**/*.ts`, `frontend/**/*.tsx`, `app/**/*.ts`, `app/**/*.tsx` | `.github/instructions/frontend.instructions.md` | Before frontend/app fixes |
| `backend/**/*.ts` | `.github/instructions/backend.instructions.md` | Before backend fixes |
| `**/*.test.ts`, `**/*.spec.ts` | `.github/instructions/tests.instructions.md` | Before test fixes |
| `**/*` | `.github/instructions/sonarqube_mcp.instructions.md` | Before SonarQube-related fixes |

**Workflow for each fix:**
1. Identify which files need editing
2. Read the matching instruction file
3. Apply the fix following the instruction file rules AND the user's confirmed fix approach
4. Mark the finding as `[x]` in the plan file

### 7.2 Delegate fix implementation to subagents (CRITICAL)

Delegate file edits to **general-purpose** subagents with FULL tooling.

**CRITICAL: Batch independent fixes into PARALLEL groups of up to 8.** Launch all fixes in a group in a SINGLE response. Fixes are independent if they don't edit the same file.

Each subagent receives:
- The file(s) to edit
- The specific finding to fix
- **The user's confirmed fix approach** (from Phase 6)
- The relevant instruction file content (paste verbatim)
- Explicit statement: **"You have full edit access — modify files as needed to fix the issue."**

**Skip findings** the user marked as "SKIPPED" in Phase 6 — do NOT implement those.

### 7.3 Tracking

After each subagent completes a fix:
1. Update the plan file: change `[ ]` to `[x]`
2. Update todo tracking if using `todo` tool

---

## Phase 8: Verify Fixes (Quality Gate)

Run the **quality-loop** skill:

```
skill:
  skill: "quality-loop"
```

### If issues:
1. Delegate fixes to a `general-purpose` subagent
2. Re-run quality-loop

### If all passes:
- ✅ TypeScript (`tsgo`) — clean
- ✅ Biome — clean
- ✅ Lint — clean

---

## Phase 9: Final Summary

> **Do NOT commit. Do NOT push.** Remind the user to commit manually if they wish.

1. Print brief summary: total findings, fixed count, skipped count, remaining count
2. Confirm plan file location: `.ai/plans/review-uncommitted/YYYY-MM-DDTHH-MM-SS/plan.md`
3. If any findings were skipped by the user, list them
4. Tell the user: "Changes are NOT committed. Review and commit manually when ready."
5. Suggest follow-up

## Output Format (for review findings)

```
FINDING|SEVERITY|FILE:LINE|TRACK|ISSUE_DESCRIPTION
```

Where:
- **TRACK**: One of `security`, `performance`, `business-logic`, `deploy-safety`, `duplication`, `dead-code`

If no findings: `CLEAN|No uncommitted change violations found`
