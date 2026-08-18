---
name: review-backend
description: >
  Interactive backend code review orchestrator: asks scoping questions, delegates investigation to
  nested explore subagents, writes a validated plan to .ai/plans/review-backend/, validates with plan-review skill,
  asks per-issue fix scoping questions and confirms each fix with the user, implements fixes using
  backend instruction files as guardrails, verifies via quality-loop skill, and commits scoped
  changes via commit-scoped skill. Covers architecture, type patterns, i18n, logging, repo
  conventions, and test conventions. Self-contained — does not depend on the review-backend agent.
---

# Backend Review Skill

You are an interactive backend code-review orchestrator. Your job is to:
0. **Pre-check environment** for merge conflicts, concurrent agents, and prior findings
1. **Ask questions** to understand what the user wants reviewed
2. **Delegate ALL investigation** to subagents to keep your context window minimal
3. **Aggregate findings** and write a plan to `.ai/plans/review-backend/`, update findings registry
4. **Validate** the plan with the `plan-review` skill
5. **Confirm fix approach** with the user (severity-batch for many findings, per-issue for few)
6. **Implement fixes** using project instruction files as guardrails
7. **Verify** fixes pass quality gates and targeted tests
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

## Phase 0: Environment Pre-Check (CRITICAL — before starting review)

Before dispatching any review subagents, check the environment for issues that could waste effort or cause conflicts.

### 0.1 Detect merge conflicts and concurrent modifications

Dispatch a `task` subagent to run:

```bash
git status --short
```

Check the output for:
- **`UU` files** (unresolved merge conflicts) — if found, warn the user and list them. These files cannot be reviewed or fixed reliably. Ask the user whether to skip them or wait for resolution.
- **`M ` or `A` files** (modified/added by a concurrent agent) — record these as "concurrent agent files." Do NOT revert changes in these files. When dispatching fix subagents, instruct them to preserve existing modifications in these files.

### 0.2 Check for existing findings registry

Dispatch a `task` subagent to check if `.ai/plans/review-backend/findings-registry.md` exists. If it does, read it to identify:
- Findings already FIXED and VERIFIED in prior rounds — skip these during review
- Findings that were FOUND but NOT FIXED — re-verify and include in this round
- Findings that regressed (marked FIXED but now broken again) — flag as regression

### 0.3 Ask about concurrent agent (if modified files detected)

If non-self modifications are detected, ask:

```
ask_user:
  question: "I detected [N] files modified by a concurrent agent. Should I avoid modifying these files and respect their changes?"
  choices:
    - "Yes — respect concurrent agent's changes, don't revert them (Recommended)"
    - "No — I'm the only one working, these are my changes"
    - "Skip review for now — concurrent agent has unresolved merge conflicts"
```

If "Yes": maintain a "do not revert" list. All subagents receive this list and are instructed: "If you find changes in these files that you did NOT make, they were made by a concurrent agent. Preserve them — do not undo, revert, or overwrite them."

If "Skip": end the review with a summary of the conflict state.

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

### Question 1.5: Security Audit (Optional)

```
ask_user:
  question: "Should this review also include security audit checks (auth, injection, secrets, rate limiting)?"
  choices:
    - "Yes — merge security checks into this review (Recommended for comprehensive audits)"
    - "No — architecture review only"
```

If "Yes": append the 7 security check groups (Auth & AuthZ, SQL & LIKE Injection, Input Validation, Secrets & Config, Rate Limiting & DoS, i18n Security Errors, Test Security) to the review subagent prompts. See "Security Audit Checklist" section at the end of Phase 3 for the detailed checks. Each security group maps to an additional subagent or is merged into an existing subagent's scope based on Dynamic Sizing rules.

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
- Hardcoded error strings in services, repositories, or resolvers → must use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql` (for API routes / scripts / tests), `ctx.t("namespace")` (for GraphQL resolvers, already bound to `ctx.locale`), or `getTranslations(locale, "namespace")` from `@/shared/locale/server` (for Server Components)
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

### Findings Registry (MUST create after aggregation)

After aggregating all findings, create or update `.ai/plans/review-backend/findings-registry.md`:

```markdown
# Backend Review Findings Registry

| ID | Round | File:Line | Severity | Finding | Status | Fixed Round |
|----|-------|-----------|----------|---------|--------|-------------|
| F1 | [R#]  | [file]:[line] | [SEVERITY] | [description] | FOUND/FIXED/VERIFIED/REGRESSED | [R# or —] |
```

**Purpose**: Prevents re-discovering already-fixed issues across review rounds. In Phase 0, this file is read to skip verified findings. In Phase 7, status is updated to FIXED as subagents complete.

**Rules**:
- If a finding was previously marked VERIFIED but is found again, mark as REGRESSED
- If a finding was previously marked FIXED but the fix is no longer present, mark as REGRESSED
- New findings get sequential IDs (F1, F2, ...) continuing from the last ID in the registry

### Security Audit Checklist (only when Phase 1 Question 1.5 = "Yes")

When the user opts into security checks, append these check groups to the subagent prompts. These are ADDITIONAL checks — all existing Phase 3 checks remain.

**Group S1 — Auth & AuthZ:**
- Every `queryField` has `authScopes` — no unauthenticated data access
- Every `mutationField` has `authScopes` — no unauthenticated mutations
- API routes verify authentication before processing (cookie check or session verify)
- Authorization uses `PermissionsService.getUserContext()` for `isSuperAdmin` — NOT `user.isSuperAdmin`
- No email-comparison auth checks (`user.email === adminEmail`)
- No IDOR — verify resource ownership before returning/modifying

**Group S2 — SQL & LIKE Injection:**
- Every `ilike(column, pattern)` wraps user input with `escapeLikeWildcards()`
- Every `sql\`${column} ILIKE ${pattern}\`` wraps user input with `escapeLikeWildcards()`
- Every `sql.raw()` uses hardcoded string or validated allowlist — never raw user input
- Dynamic table names in `sql.raw()` validated against known set
- Prefer `sql.identifier()` over `sql.raw()` for dynamic identifiers

**Group S3 — Input Validation:**
- `t.arg.stringList()` inputs have `maxItems` constraint
- `stringList` inputs have per-item `maxLength`
- `t.arg.string()` inputs have `maxLength` where appropriate
- File uploads: MIME type validated server-side (not trusted from client)
- File uploads: SVG NOT in allowlist (XSS vector)
- Non-image files served with `Content-Disposition: attachment`

**Group S4 — Secrets & Config:**
- No hardcoded API keys, passwords, or tokens in source code
- `DEFAULT_*_PASSWORD` constants guarded by `IS_DEMO` or `TEST_SERVER`
- `resolveAdminPassword()` throws if `IS_DEMO`/`TEST_SERVER` set without explicit `ADMIN_PASSWORD`
- `shared/` files do NOT import from `@/backend/**` (ESLint enforced) — use raw `process.env`
- No secrets in `shared/` — secrets belong in `backend/lib/`

**Group S5 — Rate Limiting & DoS:**
- `login` and `demoLogin` mutations have `checkRateLimit(ipAddress, authRateLimiter)`
- IPv6 addresses handled correctly (not collapsed to shared fallback)
- Rate limiter uses `ctx.ipAddress` from GraphQL context
- GraphQL queries have `maxItems`/pagination limits — no unbounded `findMany`
- Nested resolvers don't create N+1 query bombs (DataLoader batching)

**Group S6 — i18n Security Errors:**
- All user-facing error messages use compile-time i18n system (`shared/locale/`)
- No hardcoded error strings (e.g., `throw new Error("Unauthorized")`)
- GraphQL resolvers use `ctx.t()` (already bound to `ctx.locale`)
- API routes use `getServerTranslations(locale, "namespace")` from `@/shared/locale/server-graphql`
- Verify i18n keys exist in BOTH `en` and `ar` locale files before proposing them

**Group S7 — Test Security:**
- Test passwords meet complexity rules if password validation is enforced
- No bare `randomUUID()` as password (all-lowercase hex, no uppercase/special char)
- Use `generateTestPassword()` helper or `"TestPass-${randomUUID().slice(0,8)}!"` pattern
- Test server (`testServer.ts`) sets `ADMIN_PASSWORD` if `IS_DEMO` is true
- Test server sets `TEST_SERVER: "1"` and `DISABLE_RATE_LIMITING: "true"` for test env

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/review-backend/<filename>.md`.

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

## Phase 6: Issue Fix Scoping (CRITICAL — user confirms fixes)

If the user chose "No — review only" in Phase 1 Question 4, skip to Phase 10.

This phase ensures fixes are discussed with and confirmed by the user BEFORE any implementation begins. **Do NOT proceed to Phase 7 until all issues have been scoped and confirmed.**

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

### 6.2 Fix confirmation mode (severity-batch vs per-issue)

Determine confirmation mode based on finding count:

- **≤ 10 findings at selected severity levels**: Use **per-issue confirmation** (6.3a)
- **> 10 findings at selected severity levels**: Use **severity-batch confirmation** (6.3b)

### 6.3a Per-issue confirmation (≤ 10 findings)

For **each finding** at the selected severity levels, present one issue at a time using `ask_user`. Include the issue details and proposed fix approach, then ask for confirmation.

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

### 6.3b Severity-batch confirmation (> 10 findings)

Group findings by severity level. Ask ONE `ask_user` per severity level with a summary table of all findings and proposed fixes.

**For each severity batch, present:**

1. **Summary table**: List all findings at this severity with file, line, description, and proposed fix
2. **Ask for confirmation**:

```
ask_user:
  question: "[SEVERITY] batch: [N] findings across [M] files. See summary below. Fix all as proposed?
    
    | # | File:Line | Description | Proposed Fix |
    |---|-----------|-------------|--------------|
    | 1 | [file]:[line] | [desc] | [fix] |
    | 2 | [file]:[line] | [desc] | [fix] |
    | ... | ... | ... | ... |
    
    How should I handle this batch?"
  choices:
    - "Yes, fix all as proposed (Recommended)"
    - "Review individually — let me approve/skip each one"
    - "Skip this entire severity batch"
    - "Different approach for some — let me describe"
```

If "Review individually": switch to per-issue mode (6.3a) for just this severity batch.

If "Different approach for some": ask which specific issue numbers need a different approach, then handle those individually. Remaining issues in the batch are auto-approved.

3. **Record decisions** for the entire batch in the plan file.

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

#### File Ownership Map (MUST build before dispatching)

Before dispatching any fix subagents, build a file ownership map to prevent file collisions:

1. List ALL files touched by confirmed fixes
2. If two or more findings touch the SAME file, merge them into the SAME subagent (a subagent may fix multiple findings in one file)
3. Assign each file to exactly ONE subagent — no file may be edited by two subagents in the same wave
4. **Locale files exception**: `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts` are shared across many i18n fixes. Assign ALL locale file edits to a SINGLE "i18n keys" subagent that collects all new keys from all other subagents and applies them in one pass. Other subagents that need new i18n keys should outputs the required keys in their completion report instead of editing locale files directly.
5. Print the ownership map to the plan file:

```markdown
### File Ownership Map
| Subagent | Files | Findings |
|----------|-------|----------|
| fix-likescape | repo-a.ts, repo-b.ts | F1, F2, F3 |
| fix-auth | auth.pothos.ts | F4, F5 |
| fix-i18n-keys | locale/types, locale/en, locale/ar | (keys from F1-F5) |
```

Each subagent receives:
- The file(s) to edit (from the ownership map — ONLY these files)
- The specific finding(s) to fix
- **The user's confirmed fix approach** (from Phase 6)
- The relevant instruction file content (paste verbatim)
- Explicit statement: **"You have full edit access — modify ONLY the files listed above. Do NOT edit any other files."**
- If Phase 0 detected concurrent agent files: **"These files have changes from a concurrent agent: [list]. If you find changes you did NOT make, preserve them — do not revert, undo, or overwrite them."**

**Skip findings** the user marked as "SKIPPED" in Phase 6 — do NOT implement those.

### 7.3 Tracking & Scope-Drift Detection

After each subagent completes a fix:

1. **Update the plan file**: change `[ ]` to `[x]`
2. **Update the findings registry**: change status to FIXED
3. **Scope-drift check**: Dispatch a `task` subagent to run `git diff --name-only` and compare against the subagent's assigned file list
   - If the subagent modified files NOT in its assignment:
     1. Check if those files were also modified by another subagent (collision)
     2. If collision or out-of-scope: revert the out-of-scope changes using `git checkout -- <file>`
     3. Report the scope drift to the orchestrator
   - This catches subagents that make unnecessary refactors, add unrequested imports, or "fix" code beyond their assigned scope
4. **Concurrent agent file check**: For files in the "do not revert" list (from Phase 0), verify the subagent did not modify them. If it did, revert to preserve the concurrent agent's work.

**Subagent prompt safeguard**: All fix subagents MUST receive this instruction:
> "ONLY make the listed changes — do not add other modifications, imports, refactors, or 'improvements' not specified in your assignment."

---

## Phase 8: Verify Fixes (Quality Gate & Targeted Tests)

### 8.1 Run quality-loop skill

Run the **quality-loop** skill:

```
skill:
  skill: "quality-loop"
```

### If quality-loop issues:
1. Delegate fixes to a `general-purpose` subagent
2. Re-run quality-loop

### 8.2 Targeted test verification (CRITICAL for multi-file reviews)

After quality-loop passes, dispatch a `task` subagent to run **targeted tests** — only tests for files the fix subagents modified, NOT the full test suite. This distinguishes fix-caused failures from environment-caused failures.

**Workflow**:
1. For each modified file, identify the corresponding test file(s)
2. Run only those test files:
   - Modified `backend/db/repo/**/*.ts` → run `bun run test:db -- <corresponding test path>`
   - Modified `backend/services/**/*.ts` → run `bun run test:services -- <corresponding test path>`
3. If targeted tests **PASS** but the full suite would fail:
   - Report: "Targeted tests pass — full suite failures are from environment (concurrent agent modifications, merge conflicts, pre-existing issues in files we did NOT touch). These are NOT caused by our fixes."
   - Do NOT block on full-suite failures caused by files we didn't modify
4. If targeted tests **FAIL**:
   - The fix caused a regression — dispatch a `general-purpose` subagent to fix the failure
   - Re-run targeted tests, loop until pass
5. Update findings registry: mark finding status as VERIFIED after targeted tests pass

### If all passes:
- ✅ TypeScript (`tsgo`) — clean
- ✅ Biome — clean
- ✅ Lint — clean
- ✅ Targeted tests — pass

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
2. **Archive the plan file**: Move the completed plan from `.ai/plans/review-backend/<filename>.md` to `.ai/plans/finished_plans/review-backend/<filename>.md`. Dispatch a `task` subagent to run:
   ```bash
   mkdir -p .ai/plans/finished_plans/review-backend
   mv .ai/plans/review-backend/<filename>.md .ai/plans/finished_plans/review-backend/
   ```
   Also move the findings registry if all findings are resolved:
   ```bash
   mv .ai/plans/review-backend/findings-registry.md .ai/plans/finished_plans/review-backend/
   ```
   If some findings are still OPEN (skipped or remaining), keep the findings registry in `.ai/plans/review-backend/` for the next round.
3. Confirm archived plan file location: `.ai/plans/finished_plans/review-backend/<filename>.md`
4. If any findings were skipped by the user, list them as remaining items
5. Suggest follow-up

## Output Format (for review findings)

```
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
```

If no violations: `CLEAN|No backend violations found`
