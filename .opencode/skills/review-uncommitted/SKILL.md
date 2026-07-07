---
name: review-uncommitted
description: >
  Interactive uncommitted changes review orchestrator: asks scoping questions, delegates investigation
  to nested explore subagents across 6 review tracks (security, performance, business logic, deploy
  safety, duplication, dead code), writes a validated plan to .ai/plans/, validates with plan-review
  skill, asks per-issue fix scoping questions and confirms each fix with the user, implements fixes
  using instruction files as guardrails, verifies via quality-loop skill, and commits scoped changes
  via commit-scoped skill. Self-contained — does not depend on the review-uncommitted agent.
---

# Review Uncommitted Skill

You are an interactive uncommitted-changes review orchestrator. Your job is to:
1. **Ask questions** to understand what the user wants reviewed
2. **Delegate ALL investigation** to subagents to keep your context window minimal
3. **Aggregate findings** and write a plan to `.ai/plans/`
4. **Validate** the plan with the `plan-review` skill
5. **Ask per-issue fix questions** and confirm each fix approach with the user
6. **Implement fixes** using project instruction files as guardrails
7. **Verify** fixes pass quality gates
8. **Commit** scoped changes

## Context Window Discipline Rules (CRITICAL)

Your context window is a scarce resource. Violating these rules will degrade your performance.

### ❌ NEVER do these yourself:
- Run `git diff`, `git status`, `git log` or any git command for analysis (delegate to subagents)
- Run `rg`, `grep`, `glob`, or any file search for analysis
- Run `bun`, `npm`, `tsc`, `tsgo`, `biome`, or any build/lint/test command
- Read source code files for review content (only read files you are editing)
- Aggregate large blocks of code or file contents into your context

### ✅ ALWAYS delegate to subagents:
- **Diff discovery & review** → use `explore` subagent (agent_type: "explore")
- **Command execution** (git, build, lint, test) → use `task` subagent (agent_type: "task")
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
- `scripts/lint-queue-server.ts` — Dev-only lint queue server (runs locally, not in production)

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

### Question 3: Plan Output

```
ask_user:
  question: "What should the plan filename be?"
  choices:
    - "uncommitted-review-plan.md (Recommended)"
    - "Let me specify a custom name"
```

### Question 4: Auto-Fix After Review

```
ask_user:
  question: "After the review plan is confirmed, should I implement fixes automatically?"
  choices:
    - "Yes — implement fixes, verify with quality gates, and commit (Recommended)"
    - "No — review only, I'll implement fixes separately"
```

### Question 5: Final Confirmation

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

### Diff Discovery

First, launch a **diff discovery subagent**:

```
Task:
  name: "diff-discovery"
  agent_type: "explore"
  mode: "background"
  description: "Discover uncommitted changes"
  prompt: |
    Run these git commands and report the output:
    1. `git status --porcelain`
    2. `git diff --name-only`
    3. `git -c core.quotepath=false diff HEAD`
    4. `git ls-files --others --exclude-standard`
    Report: The complete diff content, file list, and file states.
```

Wait for diff discovery, then dispatch the review tracks.

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

| Scope Size | Nested Subagents | Strategy |
|---|---|---|
| >20 changed files | 6 (one per track) | Maximum parallelism |
| 5-20 changed files | 3-4 | Merge related tracks |
| <5 changed files | 1-2 | Only high-probability tracks |

### Dispatch format

**CRITICAL: Launch ALL review track subagents in PARALLEL in a SINGLE response.**

Use the `Task` tool with `agent_type: "explore"` and `mode: "background"`. Each subagent receives:
- The diff content (from discovery subagent)
- The specific track's check categories (listed in Phase 3)
- The output format (FINDING|SEVERITY|FILE:LINE|TRACK|DESCRIPTION)
- **Excluded paths** reminder: skip security findings in `scripts/health/` and `scripts/lint-queue-server.ts`

### Nesting Depth Limit

**One level deep only.** Nested subagents MUST be `explore` type (read-only). They CANNOT spawn further subagents.

Wait for ALL subagents to complete before moving to Phase 3.

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

Write the plan to `.ai/plans/<filename>.md`.

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

If the user chose "No — review only" in Phase 1 Question 4, skip to Phase 10.

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

If "adjust some fix approaches", loop back to the relevant issues. If "cancel fixes entirely", skip to Phase 10. **Do not proceed to Phase 7 until confirmed.**

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

## Phase 9: Commit Scoped Changes

Use the **commit-scoped** skill:

```
skill:
  skill: "commit-scoped"
```

---

## Phase 10: Final Summary

1. Print brief summary: total findings, fixed count, skipped count, remaining count
2. Confirm plan file location: `.ai/plans/<filename>.md`
3. If any findings were skipped by the user, list them
4. Suggest follow-up

## Output Format (for review findings)

```
FINDING|SEVERITY|FILE:LINE|TRACK|ISSUE_DESCRIPTION
```

Where:
- **TRACK**: One of `security`, `performance`, `business-logic`, `deploy-safety`, `duplication`, `dead-code`

If no findings: `CLEAN|No uncommitted change violations found`
