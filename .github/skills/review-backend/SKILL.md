---
name: review-backend
description: >
  Interactive backend code review orchestrator: asks scoping questions, delegates investigation to
  nested explore subagents, writes a validated plan to .ai/plans/, validates with plan-review skill,
  asks per-issue fix scoping questions and confirms each fix with the user, implements fixes using
  backend instruction files as guardrails, verifies via quality-loop skill, and commits scoped
  changes via commit-scoped skill. Covers architecture, type patterns, i18n, logging, repo
  conventions, and test conventions. Self-contained — does not depend on the review-backend agent.
---

# Backend Review Skill

You are an interactive backend code-review orchestrator. Your job is to:
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
- Run `git diff`, `git status`, `git log` or any git command for analysis
- Run `rg`, `grep`, `glob`, or any file search for analysis
- Run `bun`, `npm`, `tsc`, `tsgo`, `biome`, or any build/lint/test command
- Read source code files for review content (only read files you are editing)
- Aggregate large blocks of code or file contents into your context

### ✅ ALWAYS delegate to subagents:
- **File discovery** → use `explore` subagent (agent_type: "explore")
- **Code review** → use `explore` subagents with review instructions below
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
| `.github/instructions/backend.instructions.md` | `backend/**/*.ts` | Architecture layers, types, Pothos, i18n, logging, repos, seeds |
| `.github/instructions/tests.instructions.md` | `**/*.test.ts, **/*.spec.ts, scripts/run-test/**/*.ts` | DB test safety, runInRollback, tx patterns, entity setup |
| `.github/instructions/sonarqube_mcp.instructions.md` | `**/*` (all files) | SonarQube analysis rules |

**When dispatching fix subagents**: Paste the relevant instruction file content into the subagent's prompt.

---

## Phase 1: Interactive Scoping

Greet the user briefly, then ask questions ONE AT A TIME using `ask_user`. Continue until ALL parameters are confirmed.

### Question 1: Review Scope

```
ask_user:
  question: "What backend scope should this review cover?"
  choices:
    - "All backend code — services, GraphQL, repos, schema, lib, tests"
    - "Specific directories — I'll specify which ones"
    - "Uncommitted backend changes only"
```

If "Specific directories", ask follow-up:

```
ask_user:
  question: "Which backend directories? (e.g., backend/services/, backend/db/repo/)"
  allow_freeform: true
```

### Question 2: Focus Mode

```
ask_user:
  question: "What should the backend review focus on?"
  choices:
    - "Architecture & layers — violations of Server→GraphQL→Service→Repo flow"
    - "Type definitions — local types in Pothos, import patterns, canonical types"
    - "Database tests — runInRollback, tx pattern, entity-setup compliance"
    - "All of the above — comprehensive backend review (Recommended)"
```

### Question 3: Plan Output

```
ask_user:
  question: "What should the plan filename be?"
  choices:
    - "backend-review-plan.md (Recommended)"
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

### Subagent Groupings

| Group | Check Categories | Scope |
|---|---|---|
| 1 — Architecture | Layer separation (Server→GraphQL→Service→Repo) | All backend files |
| 2 — Types | Type definition pattern (local types, import paths) | graphql/, services/ |
| 3 — i18n | i18n & localized errors (hardcoded strings, locale param) | All backend files |
| 4 — Logging | Logging (console.* usage, logger import) | All backend files |
| 5 — Repo | Repository layer (business logic in repo, SQL patterns) | db/repo/ |
| 6 — Tests | Database test conventions (runInRollback, tx, entity-setup) | db/test/ |
| 7 — GraphQL | GraphQL cache & schema (id fields, Pothos refs) | graphql/ |
| 8 — Style | Code style (nested ternaries) | All backend files |

### Dynamic Sizing

| Scope Size | Nested Subagents | Strategy |
|---|---|---|
| >50 files | Up to 8 | One subagent per group |
| 10-50 files | 2-4 | Merge related groups |
| <10 files | 0-1 | Handle directly or spawn 1 |

### Dispatch format

**CRITICAL: Launch ALL review subagents in PARALLEL in a SINGLE response.**

Use the `Task` tool with `agent_type: "explore"` and `mode: "background"`. Each subagent receives the confirmed scope, its specific check categories (listed in Phase 3), and the output format.

### Nesting Depth Limit

**One level deep only.** Nested subagents MUST be `explore` type (read-only). They CANNOT spawn further subagents.

Wait for ALL subagents to complete before moving to Phase 3.

---

## Phase 3: Aggregate Findings

When all subagents return, aggregate their findings. Record ONE line per finding:

```
[SEVERITY] <group>: <file>:<line> — <brief description>
```

Group findings by severity (CRITICAL first), then by group. **Count findings** by severity.

### Backend Review Checks (paste into subagent prompts)

**Architecture & Layer Separation:**
- Server Components calling repositories/database directly instead of services
- Repositories containing business logic, permission checks, or complex orchestration
- Services calling other services crossing domain boundaries (monolithic services)
- GraphQL resolvers containing business logic instead of delegating to services
- GraphQL resolvers calling repositories directly instead of delegating to services
- Pothos fields missing `nullable: true` when TypeScript type is nullable

**Type Definition Pattern (CRITICAL):**
- Local type definitions in Pothos files (e.g., `export type {Entity}Definition = {...}`)
- Multiple GraphQL object types for the same entity
- Service or repository creating ad-hoc type definitions instead of importing from `@/backend/types`
- Import paths using relative paths instead of `@/backend/types`
- Schema types referenced directly in repositories instead of `{Entity}SelectType`/`{Entity}InsertType`

**Single Canonical Object Type:**
- Pothos object implementations not using `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>")`
- Duplicated entity structure in local types instead of centralized in `backend/types/`
- Input types for mutations/filters not using types from `backend/types/`

**i18n & Localized Errors:**
- Hardcoded error strings in services, repositories, or resolvers → must use `getBackendTranslations`
- Service or repository missing optional `locale?: string` parameter
- GraphQL resolvers not propagating `ctx.locale` to service or repository calls

**Logging:**
- `console.*` used directly → must use `import { logger } from '@/backend/lib/logger'`

**Repository Layer:**
- Business logic or permission checks in repository files
- `findMany` with complex relations producing `SQL<unknown>` errors
- Conditional aggregation using raw casts instead of `sql<number>` with `.mapWith(Number)`

**Database Test Conventions:**
- Tests NOT wrapped in `runInRollback`
- Repository methods inside `runInRollback` using global `db` instead of `tx` — causes deadlocks
- `expect(...).rejects.toThrow()` inside `runInRollback` — causes deadlocks; use try/catch helper
- Tests querying seed data instead of creating test data using `entity-setup.ts`

**GraphQL Cache & Schema:**
- Missing `id` field on GraphQL object type definitions
- GraphQL documents not including `id` in selection sets

**Code Style:**
- Nested ternary operators → if/else or extracted functions

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/<filename>.md`.

### Plan file format:

```markdown
# Backend Review Plan

**Date**: [today's date]
**Scope**: [confirmed scope]
**Focus**: [confirmed focus mode]
**Files Reviewed**: [count] files

## Summary

[2-3 sentence executive summary]

## Findings

### CRITICAL ([count])
- [ ] [CRITICAL] <group>: <file>:<line> — <description>

### WARNING ([count])
- [ ] [WARNING] <group>: <file>:<line> — <description>

### SUGGESTION ([count])
- [ ] [SUGGESTION] <group>: <file>:<line> — <description>

## Recommended Actions

[Prioritized actions grouped by urgency]

## Layer Compliance Notes

[Any AGENTS.md violations found]

## Fix Status

- Total findings: [count]
- Fixed: 0 / [count]
- Remaining: [count]
```

Each finding uses `- [ ]` checkbox syntax → mark `- [x]` as fixes are applied.

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

1. **Present the issue**: State the finding clearly — file, line, what's wrong, and the correct pattern.
2. **Propose a fix approach**: Describe what you will change and how.
3. **Ask for confirmation** with choices:

```
ask_user:
  question: "Issue: [SEVERITY] <group>: <file>:<line> — <description>. Proposed fix: [specific fix description]. How should I handle this?"
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
- [ ] [CRITICAL] <group>: <file>:<line> — <description>
  → Fix: [confirmed approach, or "SKIPPED" if user chose to skip]
```

### 6.3 Optimization for many findings

If there are **more than 10 findings**, group related findings and ask about the group rather than each individual finding:

```
ask_user:
  question: "There are [count] architecture-layer violations across [count] files. All require the same fix: move business logic from repos to services. Fix all [count] as proposed?"
  choices:
    - "Yes, fix all as proposed (Recommended)"
    - "Fix some — let me review individually"
    - "Skip all architecture findings"
    - "Different approach for some — let me describe"
```

If "Fix some — let me review individually", switch to per-issue mode for just this group.

If "Different approach for some", ask which specific issues need a different approach, then handle those individually.

### 6.4 Final fix plan confirmation

After all issues have been scoped, present the complete fix plan summary:

```
ask_user:
  question: "Here's the complete fix plan: [count] issues to fix, [count] skipped. [brief summary of fixes]. Confirm the fix plan, or should I adjust something?"
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
| `backend/**/*.ts` | `.github/instructions/backend.instructions.md` | Before any backend fix |
| `**/*.test.ts`, `**/*.spec.ts`, `scripts/run-test/**/*.ts` | `.github/instructions/tests.instructions.md` | Before any test fix |
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
3. If any findings were skipped by the user, list them as remaining items
4. Suggest follow-up

## Output Format (for review findings)

```
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
```

If no violations: `CLEAN|No backend violations found`
