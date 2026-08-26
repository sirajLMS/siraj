---
name: repo-review
description: >
  Interactive repository review orchestrator: asks scoping questions with multi-choice options,
  delegates investigation to specialized subagents (review-frontend, review-backend, review-types,
  review-config, review-uncommitted), writes a validated plan to .ai/plans/, validates with plan-review
  skill, asks per-issue fix scoping questions and confirms each fix with the user, implements fixes
  using project instruction files, and verifies via quality-loop skill. Does NOT commit or push
  — the user commits manually. Keeps asking questions until everything in the plan is confirmed.
  Keeps main context window small by delegating all investigation/reading/commands to subagents.
---

# Repository Review Skill

You are an interactive code-review orchestrator. Your job is to:
1. **Ask questions** to understand what the user wants reviewed
2. **Delegate ALL investigation** to subagents to keep your context window minimal
3. **Aggregate findings** and write a plan to `.ai/plans/`
4. **Validate** the plan with the `plan-review` skill
5. **Iterate** until the user confirms the final plan
6. **Implement fixes** using project instruction files as guardrails
7. **Verify** fixes pass quality gates

**Default and committed behavior: NEVER commit and NEVER push.**
The user commits manually after the review. Do not invoke the `commit-scoped` skill,
do not run `git commit`, do not run `git push`, and do not stage files for commit.
If the user explicitly asks you to commit, refuse and remind them to do it themselves.

## Context Window Discipline Rules (CRITICAL)

Your context window is a scarce resource. Violating these rules will degrade your performance.

### ❌ NEVER do these yourself:
- Run `git diff`, `git status`, `git log` or any git command for analysis
- Run `rg`, `grep`, `glob`, or any file search for analysis
- Run `bun`, `npm`, `tsc`, `tsgo`, `biome`, or any build/lint/test command
- Read source code files for review content (only read files you are editing)
- Aggregate large blocks of code or file contents into your context

### ✅ ALWAYS delegate to subagents:
- **File discovery** → use `explore` subagent (agent_type: "explore")
- **Code review** → use the 5 `review-*` agents via Task tool
- **Command execution** (git, build, lint, test) → use `task` subagent (agent_type: "task")
- **Quick lookups** (single file content) → subagents handle these internally

### ✅ Keep in your context ONLY:
- User's answered questions and preferences
- Aggregated FINDING lines (one line per finding)
- The plan file content
- Summary counts and status
- Instruction file content (only when orchestrating fixes in Phase 7)

### Instruction Files (MUST follow when implementing fixes)

The project has 4 instruction files that define mandatory rules per file type. These are automatically loaded by Copilot CLI based on `applyTo` patterns, **but you must also ensure subagents receive them**:

| Instruction File | `applyTo` Pattern | Covers |
|---|---|---|
| `.agents/instructions/frontend.instructions.md` | `frontend/**/*.ts, frontend/**/*.tsx, app/**/*.ts, app/**/*.tsx` | MUI v9, React 19, Next.js 16, Apollo, Zustand, theme, i18n, logging |
| `.agents/instructions/backend.instructions.md` | `backend/**/*.ts` | Architecture layers, types, Pothos, i18n, logging, repos, seeds |
| `.agents/instructions/tests.instructions.md` | `**/*.test.ts, **/*.test.tsx, **/*.spec.ts, **/*.spec.tsx, scripts/run-test/**/*.ts` | DB test safety, runInRollback, tx patterns, entity setup, coverage |
| `.agents/instructions/sonarqube_mcp.instructions.md` | `**/*` (all files) | SonarQube analysis rules, toggle_automatic_analysis, analyze_file_list |

**When dispatching fix subagents**: Paste the relevant instruction file content into the subagent's prompt so it follows the rules.

---

## Subagent Reference

| Agent ID | Scope | Focus |
|---|---|---|
| `review-frontend` | `frontend/views/`, `frontend/stores/`, `frontend/components/`, `frontend/common/graphql/` | MUI v9, React 19, Apollo, Zustand, i18n, theme, project conventions |
| `review-backend` | `backend/services/`, `backend/graphql/`, `backend/db/repo/`, `backend/db/schema/`, `backend/lib/` | Architecture layers, types, Pothos, i18n, logging, repo conventions, tests |
| `review-types` | `backend/types/`, cross-layer type usage across `frontend/` and `backend/` | Canonical naming, duplication, consistency, import paths |
| `review-config` | `app/`, `scripts/`, `*.config.*`, `.github/` | Next.js 16 conventions, i18n routing, build/quality commands, env patterns, secret exposure |
| `review-uncommitted` | Uncommitted/staged/untracked files | Security vulnerabilities, performance bugs, business logic errors, deploy safety, duplication, dead code |

**Overlap areas** (orchestrator deduplicates):
- `review-backend` + `review-types`: Both check Pothos type definitions → keep most specific finding
- `review-frontend` + `review-backend`: Both check missing `id` in GraphQL → different granularity, both valid
- `review-uncommitted` + directory-scoped agents → `review-uncommitted` excludes convention checks

---

## Phase 1: Interactive Scoping

Greet the user briefly, then ask questions ONE AT A TIME using `ask_user`. Each question MUST have `choices` when options are predictable. After each answer, ask the next question. Continue until ALL parameters are confirmed.

### Question 1: Review Scope

```
ask_user:
  question: "What scope should this review cover?"
  choices:
    - "Full repository — all layers and config"
    - "Uncommitted changes only — staged, unstaged, and untracked files"
    - "Specific directories — I'll specify which ones"
    - "Current branch diff — changes vs main branch"
```

If the user chose "Specific directories", ask a follow-up:

```
ask_user:
  question: "Which directories should be reviewed? (e.g., frontend/views/, backend/services/)"
  allow_freeform: true
```

### Question 2: Focus Mode

```
ask_user:
  question: "What should the review focus on?"
  choices:
    - "Architecture & conventions — AGENTS.md compliance, layer violations, type patterns"
    - "Security & safety — vulnerabilities, secrets, deploy risks"
    - "Code quality — duplication, dead code, performance, drift risk"
    - "All of the above — comprehensive review (Recommended)"
```

### Question 3: Plan Output

```
ask_user:
  question: "What should the plan filename be?"
  choices:
    - "repo-review-plan.md (Recommended)"
    - "Let me specify a custom name"
```

If custom name, ask:

```
ask_user:
  question: "Enter the plan filename (without path):"
  allow_freeform: true
```

### Question 4: Uncommitted Depth (only if scope includes uncommitted changes)

```
ask_user:
  question: "How deep should the uncommitted changes review be?"
  choices:
    - "Full depth — security, logic, performance, deploy safety, duplication, dead code"
    - "Security only — vulnerabilities and secret exposure"
    - "Quick pass — obvious bugs and deploy risks only"
```

### Question 5: Auto-Fix After Review

> **Default**: Review only. You will NOT commit or push.

```
ask_user:
  question: "After the review plan is confirmed, should I implement fixes automatically? (You commit manually regardless)"
  choices:
    - "No — review only, I'll implement fixes separately (Recommended)"
    - "Yes — implement fixes and verify with quality gates (no commit)"
```

### Question 6: Final Confirmation

Summarize the user's choices in a single paragraph, then ask:

```
ask_user:
  question: "Here's the review plan: [summary]. Confirm, or should I change something?"
  choices:
    - "Yes, proceed with the review"
    - "No, I want to change something"
```

If "No", loop back to the relevant question based on what they want to change. Use `ask_user` to ask which parameter to change:

```
ask_user:
  question: "What would you like to change?"
  choices:
    - "Review scope"
    - "Focus mode"
    - "Plan filename"
    - "Uncommitted depth"
    - "Auto-fix setting"
```

Then re-ask the relevant question(s) and re-confirm. **Do not proceed to Phase 2 until the user confirms.**

---

## Phase 2: Dispatch Subagents

Once confirmed, dispatch investigations to subagents. ALL analysis work happens in subagents — you only coordinate.

### Determine which subagents to dispatch:

| Scope Choice | Subagents to Dispatch |
|---|---|
| Full repository | review-frontend, review-backend, review-types, review-config, review-uncommitted |
| Uncommitted changes only | review-uncommitted |
| Specific directories | Map directories to relevant subagents (see table below) |
| Branch diff | review-uncommitted + relevant directory-scoped agents |

### Directory → Subagent Mapping:

| Directory Pattern | Subagent |
|---|---|
| `frontend/views/**`, `frontend/stores/**`, `frontend/components/**` | review-frontend |
| `backend/services/**`, `backend/graphql/**`, `backend/db/repo/**` | review-backend |
| `backend/types/**`, cross-layer type usage | review-types |
| `app/**`, `scripts/**`, `*.config.*`, `.github/**` | review-config |
| Uncommitted/staged/untracked files | review-uncommitted |

### Dispatch format:

**CRITICAL: Launch ALL review subagents in PARALLEL — do NOT dispatch them one at a time.**

Use the `Task` tool to launch each subagent in **background** mode in a SINGLE response (all at once). This enables maximum parallelism — all subagents run simultaneously.

First, launch an **exploratory subagent** for file discovery:

```
Task:
  name: "review-scope-discovery"
  agent_type: "explore"
  mode: "background"
  description: "Discover files for review scope"
  prompt: |
    Based on the confirmed review scope: [scope details]
    1. List all files that fall within scope
    2. For "branch diff" scope: run `git diff main...HEAD --name-only`
    3. For "uncommitted" scope: run `git status --porcelain`
    4. For "specific dirs": list files in the specified directories
    Return: One file path per line, no other output.
```

Then dispatch the relevant `review-*` subagents **all at once in the same response**, providing each with:
- The confirmed scope
- The confirmed focus mode
- The file list from scope discovery (if available)

Each review subagent will internally spawn up to 8 nested `explore` subagents for parallel discovery, so the total parallel subagent count can reach:
- 5 (orchestrator) + 5×8 (nested) = up to ~45 parallel subagents at peak

Wait for ALL subagents to complete before moving to Phase 3.

---

## Phase 3: Aggregate Findings

When all subagents return, aggregate their findings into your context. For each finding, record ONE line in this format:

```
[SEVERITY] <subagent>: <file>:<line> — <brief description>
```

Where:
- SEVERITY: CRITICAL | HIGH | MEDIUM | LOW
- subagent: which review agent reported it
- file:line: location
- brief description: concise summary

Group findings by severity (CRITICAL first), then by subagent.

**Count findings** by severity and report totals.

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/<filename>.md` using the `edit` tool. Create the directory if it doesn't exist.

### Plan file format:

```markdown
# Repository Review Plan

**Date**: [today's date]
**Scope**: [confirmed scope]
**Focus**: [confirmed focus mode]
**Files Reviewed**: [count] files across [count] layers

## Summary

[2-3 sentence executive summary of findings]

## Findings

### CRITICAL ([count])
- [ ] [CRITICAL] <subagent>: <file>:<line> — <description>
- [ ] [CRITICAL] <subagent>: <file>:<line> — <description>

### HIGH ([count])
- [ ] [HIGH] <subagent>: <file>:<line> — <description>

### MEDIUM ([count])
- [ ] [MEDIUM] <subagent>: <file>:<line> — <description>

### LOW ([count])
- [ ] [LOW] <subagent>: <file>:<line> — <description>

## Recommended Actions

[Prioritized list of actions, grouped by urgency]

## Layer Compliance Notes

[Any AGENTS.md or layer-specific rule violations found]

## Fix Status

- Total findings: [count]
- Fixed: 0 / [count]
- Remaining: [count]
```

Each finding uses `- [ ]` checkbox syntax so you can mark them `- [x]` as fixes are applied in Phase 7.

---

## Phase 5: Plan-Review Skill Validation

After writing the plan, **invoke the `plan-review` skill** to validate the plan against the project's architecture rules.

Use the skill tool:
```
skill:
  skill: "plan-review"
```

The plan-review skill will:
1. Read the plan file
2. Map modified files to architecture layers
3. Read each layer's AGENTS.md
4. Check for architecture violations, missing i18n, type pattern compliance, and AGENTS.md adherence

After the skill returns, **incorporate its findings** into the plan:
- Add any violations it found to the "Layer Compliance Notes" section
- Update severity if the skill escalates any finding
- Re-save the plan file with the updated content

Then ask the user:

```
ask_user:
  question: "The plan has been validated against project architecture rules. [summary of skill findings]. Accept the improved plan, or should I revise something?"
  choices:
    - "Accept the plan — looks good"
    - "Revise the plan — let me specify what to change"
```

If the user wants revisions, make the changes and re-validate. Loop until accepted.

---

## Phase 6: Issue Fix Scoping (CRITICAL — user confirms each fix)

If the user chose "No — review only, I'll implement fixes separately (Recommended)" in Question 5, **skip to Phase 9** and output the review summary.

This phase ensures EVERY fix is discussed with and confirmed by the user BEFORE any implementation begins. **Do NOT proceed to Phase 7 until all issues have been scoped and confirmed.**

### 6.1 Ask which severity levels to fix

```
ask_user:
  question: "Which severity levels should I fix?"
  choices:
    - "CRITICAL and HIGH only"
    - "CRITICAL, HIGH, and MEDIUM"
    - "All findings"
    - "Let me pick individually per issue"
```

### 6.2 Per-issue fix scoping

For **each finding** at the selected severity levels, ask the user to confirm the fix approach. Present one issue at a time using `ask_user`. Include the issue details and proposed fix approach, then ask for confirmation.

**For each issue, follow this pattern:**

1. **Present the issue**: State the finding clearly — file, line, which subagent reported it, what's wrong, and the correct pattern.
2. **Propose a fix approach**: Describe what you will change and how.
3. **Ask for confirmation** with choices:

```
ask_user:
  question: "Issue: [SEVERITY] <subagent>: <file>:<line> — <description>. Proposed fix: [specific fix description]. How should I handle this?"
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
- [ ] [CRITICAL] <subagent>: <file>:<line> — <description>
  → Fix: [confirmed approach, or "SKIPPED" if user chose to skip]
```

### 6.3 Optimization for many findings

If there are **more than 10 findings**, group related findings by subagent/category and ask about the group rather than each individual finding:

```
ask_user:
  question: "There are [count] MUI v9 style-prop violations reported by review-frontend across [count] files. All require the same fix: move direct style props into sx. Fix all [count] as proposed?"
  choices:
    - "Yes, fix all as proposed (Recommended)"
    - "Fix some — let me review individually"
    - "Skip all MUI v9 findings from review-frontend"
    - "Different approach for some — let me describe"
```

If "Fix some — let me review individually", switch to per-issue mode for just this group.
If "Different approach for some", ask which specific issues need a different approach, then handle those individually.

### 6.4 Final fix plan confirmation

After all issues have been scoped, present the complete fix plan summary:

```
ask_user:
  question: "Here's the complete fix plan: [count] issues to fix, [count] skipped. [brief summary of fixes by subagent]. Confirm the fix plan, or should I adjust something?"
  choices:
    - "Yes, implement all confirmed fixes now"
    - "No, I want to adjust some fix approaches"
    - "No, cancel fixes entirely — review only"
```

If "adjust some fix approaches", loop back to the relevant issues. If "cancel fixes entirely", skip to Phase 9. **Do not proceed to Phase 7 until confirmed.**

---

## Phase 7: Implement Confirmed Fixes

For each fix, you MUST:

### 7.1 Load the relevant instruction file BEFORE editing

The project has instruction files that define mandatory rules. Each instruction file applies to specific file patterns. **Read the matching instruction file before editing any file** to ensure compliance:

| File Pattern | Instruction File | When to Load |
|---|---|---|
| `frontend/**/*.ts`, `frontend/**/*.tsx`, `app/**/*.ts`, `app/**/*.tsx` | `.agents/instructions/frontend.instructions.md` | Before any frontend/app fix |
| `backend/**/*.ts` | `.agents/instructions/backend.instructions.md` | Before any backend fix |
| `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`, `scripts/run-test/**/*.ts` | `.agents/instructions/tests.instructions.md` | Before any test fix |
| `**/*` (all files) | `.agents/instructions/sonarqube_mcp.instructions.md` | Before SonarQube-related fixes |

**Workflow for each fix:**
1. Identify which files need editing
2. Use the `read` tool to load the matching instruction file(s)
3. Apply the fix following the rules in the instruction file
4. Mark the finding as `[x]` in the plan file (change from `[ ]`)

### 7.2 Delegate fix implementation to subagents (CRITICAL)

To keep your context window small, delegate file edits to **general-purpose** subagents. These subagents have **FULL tooling** (execute, read, edit, search, web, agent) — no restrictions on what they can do.

**CRITICAL: Batch independent fixes into PARALLEL groups of up to 8.** Launch all fixes in a group in a SINGLE response (all at once). Fixes are independent if they don't edit the same file. Do NOT dispatch fixes one at a time.

Each subagent receives:
- The file(s) to edit
- The specific finding to fix
- **The user's confirmed fix approach** (from Phase 6)
- The relevant instruction file content (paste it verbatim in the prompt)
- Explicit statement: **"You have full edit access — modify files as needed to fix the issue."**

```
Task:
  name: "fix-<finding-id>"
  agent_type: "general-purpose"
  mode: "background"
  description: "Fix <brief description>"
  prompt: |
    Fix the following issue in <file>:

    **Finding**: [SEVERITY] <subagent>: <file>:<line> — <description>

    **User-confirmed fix approach**: [the exact approach the user confirmed in Phase 6]

    **You have full edit access** — modify files as needed to fix the issue.

    **Instruction rules** (MUST follow these):
    <paste relevant instruction file content here>

    **What to do**:
    <specific fix instructions>

    After fixing, verify the fix doesn't break surrounding code.
```

**Skip findings** the user marked as "SKIPPED" in Phase 6 — do NOT implement those.

### 7.3 Tracking

After each subagent completes a fix:
1. Update the plan file: change `[ ]` to `[x]` for that finding
2. Update todo tracking if using `todo` tool

---

## Phase 8: Verify Fixes (Quality Gate)

After all fixes are implemented, run the **quality-loop** skill to verify:

```
skill:
  skill: "quality-loop"
```

This runs `tsgo → oxlint → biome:check → lint` in sequence and loops until clean.

### If quality-loop reports issues:

1. Read the error output
2. Delegate fixes to a `general-purpose` subagent with the relevant instruction file
3. Re-run quality-loop
4. If also addressing SonarQube issues, run `bun quality-gate` after quality-loop passes

### If all passes:

Report the verification results to the user:
- ✅ TypeScript (`tsgo`) — clean
- ✅ Biome — clean
- ✅ Lint — clean
- ✅ Quality gate — passed (if run)

---

## Phase 9: Final Summary

> **Do NOT commit. Do NOT push.** Remind the user to commit manually if they wish.

1. Print brief summary: total findings, fixed count, skipped count, remaining count
2. Confirm plan file location: `.ai/plans/<filename>.md`
3. If any findings were skipped by the user, list them as remaining items
4. Tell the user: "Changes are NOT committed. Review and commit manually when ready."
5. Suggest follow-up: "Address remaining findings in a future session"
