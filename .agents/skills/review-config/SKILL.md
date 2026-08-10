---
name: review-config
description: >
  Interactive config review orchestrator: asks scoping questions, delegates investigation to
  nested explore subagents, writes a validated plan to .ai/plans/, validates with plan-review
  skill, asks per-issue fix scoping questions and confirms each fix with the user, implements fixes
  using instruction files as guardrails, verifies via quality-loop skill, and commits scoped changes
  via commit-scoped skill. Covers App Router conventions, i18n routing, build commands, CI/CD,
  env/secrets, script validity, and TS config. Self-contained — does not depend on the
  review-config agent.
---

# Config Review Skill

You are an interactive config review orchestrator. Your job is to:
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
| `.github/instructions/frontend.instructions.md` | `frontend/**/*.ts, frontend/**/*.tsx, app/**/*.ts, app/**/*.tsx` | MUI v9, React 19, Next.js 16, Apollo, Zustand, theme, i18n |
| `.github/instructions/backend.instructions.md` | `backend/**/*.ts` | Architecture, types, Pothos, i18n, logging, repos |
| `.github/instructions/sonarqube_mcp.instructions.md` | `**/*` (all files) | SonarQube analysis rules |

**When dispatching fix subagents**: Paste the relevant instruction file content into the subagent's prompt.

---

## Excluded Paths

The following paths are internal development tooling and should be **excluded from security findings**:
- `scripts/health/` — SonarQube/CodeScene health check tooling (dev-only, not production code)
- `scripts/lint-service.ts` — Dev-only in-process lint service (runs locally, not in production)

Do NOT flag security issues in these files. Convention issues (wrong commands, broken scripts) are still valid findings.

---

## Phase 1: Interactive Scoping

Greet the user briefly, then ask questions ONE AT A TIME using `ask_user`. Continue until ALL parameters are confirmed.

### Question 1: Review Scope

```
ask_user:
  question: "What config scope should this review cover?"
  choices:
    - "All config — app/, scripts/, .github/, package.json, tsconfig, next.config"
    - "App Router only — app/ directory conventions"
    - "CI/CD only — .github/workflows/"
    - "Specific files — I'll specify which ones"
```

If "Specific files":

```
ask_user:
  question: "Which config files or directories? (e.g., app/[locale]/, .github/workflows/ci.yml)"
  allow_freeform: true
```

### Question 2: Focus Mode

```
ask_user:
  question: "What should the config review focus on?"
  choices:
    - "App Router conventions — Server Components, cached wrappers, params"
    - "Security — env variables, secrets exposure, auth patterns"
    - "Build & CI — commands, bun usage, workflow correctness"
    - "All of the above — comprehensive config review (Recommended)"
```

### Question 3: Plan Output

```
ask_user:
  question: "What should the plan filename be?"
  choices:
    - "config-review-plan.md (Recommended)"
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
| 1 — App Router | Next.js 16 App Router conventions | app/ |
| 2 — i18n | i18n routing patterns | app/[locale]/ |
| 3 — Build | Build & quality commands, package.json | package.json, bunfig.toml |
| 4 — CI | CI/CD & GitHub Actions | .github/workflows/ |
| 5 — Env | Environment variables & secrets | All config files |
| 6 — Scripts | Script validity | scripts/ |
| 7 — TS Config | TypeScript & build config | tsconfig*.json, next.config.ts |

### Dynamic Sizing

| Scope Size | Nested Subagents | Strategy |
|---|---|---|
| >50 files | Up to 7 | One subagent per group |
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

### Config Review Checks (paste into subagent prompts)

**Next.js 16 App Router Conventions:**
- Files under `app/` using `"use client"` without necessity
- Server Components using React hooks or browser APIs
- Server Components calling repositories/database directly instead of services
- Server Components calling GraphQL instead of calling services directly
- Layouts not using `getServerUserContext()` for authentication
- Missing `redirect()` for unauthenticated users in layout files
- `React.cache()` not used for shared data between layout and page
- `params` not awaited in Next.js 15+ components (`const { locale } = await params`)

**i18n Routing:**
- Routes not following `/[locale]/...` pattern
- Server Components not using `getTranslations` from `@/shared/locale/server` (synchronous: `const t = getTranslations(locale).<namespace>`)
- Locale not used in redirects

**Build & Quality Commands:**
- `package.json` scripts referencing `npm`/`yarn`/`pnpm` instead of `bun`
- Scripts not using `~/.bun/bin/bun` binary path where required
- `tsgo` not used instead of `tsc`
- Missing or incorrect documented scripts

**CI/CD & GitHub Actions:**
- Workflow files referencing `npm`/`yarn`/`pnpm` instead of `bun`
- Missing required quality gate steps
- Missing `bun install` step before build/test
- Incorrect Node.js version or missing Bun setup step

**Environment Variables & Secrets (non-excluded files only):**
- Hardcoded secrets, API keys, tokens, or passwords
- Environment variables accessed via `process.env` without validation through `env.ts`
- `.env` files committed to the repository
- Sensitive values not using environment variable references

**Script Validity:**
- Scripts not matching documented commands in AGENTS.md
- Database action scripts not matching `bun run db` interface
- Database test runner script not documented properly

**TypeScript & Build Config:**
- `tsconfig.json` path aliases not matching `@/` convention
- `next.config.ts` misconfigured for App Router or i18n
- `bunfig.toml` inconsistent with project runtime

**App Router Layer:**
- Server Components not using cached wrappers where deduplication is needed
- NextAuth handler in `route.ts` not cast as `(req: Request) => Promise<Response>`

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/<filename>.md`.

### Plan file format:

```markdown
# Config Review Plan

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

If there are **more than 10 findings**, group related findings and ask about the group:

```
ask_user:
  question: "There are [count] App Router convention violations across [count] files. All require the same fix: remove 'use client' where unnecessary. Fix all [count] as proposed?"
  choices:
    - "Yes, fix all as proposed (Recommended)"
    - "Fix some — let me review individually"
    - "Skip all App Router findings"
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
| `frontend/**/*.ts`, `frontend/**/*.tsx`, `app/**/*.ts`, `app/**/*.tsx` | `.github/instructions/frontend.instructions.md` | Before frontend/app fixes |
| `backend/**/*.ts` | `.github/instructions/backend.instructions.md` | Before backend fixes |
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
3. If any findings were skipped, list them
4. Suggest follow-up

## Output Format (for review findings)

```
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
```

If no violations: `CLEAN|No config violations found`
