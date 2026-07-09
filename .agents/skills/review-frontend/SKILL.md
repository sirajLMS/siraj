---
name: review-frontend
description: >
  Interactive frontend code review orchestrator: asks scoping questions, delegates investigation to
  nested explore subagents, writes a validated plan to .ai/plans/, validates with plan-review skill,
  asks per-issue fix scoping questions and confirms each fix with the user, implements fixes using
  frontend instruction files as guardrails, verifies via quality-loop skill, and commits scoped
  changes via commit-scoped skill. Covers MUI v9, React 19, Apollo, Zustand, i18n, theme, and
  project conventions. Self-contained — does not depend on the review-frontend agent.
---

# Frontend Review Skill

You are an interactive frontend code-review orchestrator. Your job is to:
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
| `.github/instructions/frontend.instructions.md` | `frontend/**/*.ts, frontend/**/*.tsx, app/**/*.ts, app/**/*.tsx` | MUI v9, React 19, Next.js 16, Apollo, Zustand, theme, i18n, logging |
| `.github/instructions/sonarqube_mcp.instructions.md` | `**/*` (all files) | SonarQube analysis rules |

**When dispatching fix subagents**: Paste the relevant instruction file content into the subagent's prompt so it follows the rules.

---

## Phase 1: Interactive Scoping

Greet the user briefly, then ask questions ONE AT A TIME using `ask_user`. Each question MUST have `choices` when options are predictable. After each answer, ask the next question. Continue until ALL parameters are confirmed.

### Question 1: Review Scope

```
ask_user:
  question: "What frontend scope should this review cover?"
  choices:
    - "All frontend code — views, stores, components, GraphQL documents"
    - "Specific directories — I'll specify which ones"
    - "Uncommitted frontend changes only"
```

If "Specific directories", ask follow-up:

```
ask_user:
  question: "Which frontend directories? (e.g., frontend/views/, frontend/stores/)"
  allow_freeform: true
```

### Question 2: Focus Mode

```
ask_user:
  question: "What should the frontend review focus on?"
  choices:
    - "MUI v9 & React 19 — breaking changes and migration issues"
    - "Apollo & GraphQL — document conventions, cache, imports"
    - "Theme & styling — hardcoded colors, palette access"
    - "All of the above — comprehensive frontend review (Recommended)"
```

### Question 3: Plan Output

```
ask_user:
  question: "What should the plan filename be?"
  choices:
    - "frontend-review-plan.md (Recommended)"
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

Once confirmed, dispatch investigations. ALL analysis work happens in subagents — you only coordinate.

### Subagent Groupings

| Group | Check Categories | Scope |
|---|---|---|
| 1 — MUI | MUI v9 breaking changes (style props, icons, DatePicker, Autocomplete) | All .tsx files |
| 2 — React | React 19 patterns (FormEvent, FormData, Context splitting) | All .tsx/.ts files |
| 3 — Apollo | Apollo & GraphQL (useLazyQuery, imports, id fields, TypedDocumentNode) | .graphql/, *documents.ts |
| 4 — Zustand | Zustand stores (strict typing, mapping) | *Store.ts |
| 5 — i18n | i18n (hardcoded strings, useTranslations) | All component files |
| 6 — Theme | Theme & styling (hardcoded colors, palette access) | All .tsx files |
| 7 — Patterns | Dashboard UI patterns (PageContainer, MetricCard, etc.) | views/ files |
| 8 — Logging | Logging (console.* usage) | All .ts/.tsx files |

### Dynamic Sizing

| Scope Size | Nested Subagents | Strategy |
|---|---|---|
| >50 files | Up to 8 | One subagent per group |
| 10-50 files | 2-4 | Merge related groups |
| <10 files | 0-1 | Handle directly or spawn 1 |

### Dispatch format

**CRITICAL: Launch ALL review subagents in PARALLEL in a SINGLE response.**

Use the `Task` tool with `agent_type: "explore"` and `mode: "background"`. Each subagent receives:
- The confirmed scope and focus mode
- The specific check categories for its group (listed in Phase 3 below)
- The output format (FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION)

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

### Frontend Review Checks (paste into subagent prompts)

**MUI v9 Breaking Changes:**
- Typography: style props (`fontWeight`, `textAlign`, `mb`, `mt`) as direct props → must use `sx`
- Stack: `alignItems`, `justifyContent`, `flexWrap`, `gap`, `mb`, `mt` as direct props → must go in `sx`
- Box: `p`, `px`, `py`, `mt`, `mb`, `display`, `flex`, `textAlign`, `component` as direct props → must go in `sx`
- Grid: `alignItems`, `justifyContent`, `mb`, `mt`, `order` as direct props → must go in `sx`
- Icons: `*Outline` → must be `*Outlined` (e.g., `ErrorOutline` → `ErrorOutlined`)
- DatePicker: `autoComplete` in `textField` → `slotProps={{ textField: { slotProps: { htmlInput: { autoComplete: "off" } } } }}`
- Autocomplete: `inputProps` on `AutocompleteRenderInputParams` → `params.slotProps.htmlInput`
- Typography `component` as direct prop → wrapper element or `sx` workaround
- ListItemText: `fontWeight` in `primaryTypographyProps` → must use `slotProps`

**React 19 Patterns:**
- `FormEvent` → `React.SubmitEvent` or `React.SyntheticEvent<HTMLFormElement>`
- FormData results not cast → `(formData.get("name") as string | null) ?? ""`
- Context, Provider, and useHook in same file → separate files

**Apollo Client & GraphQL:**
- `useLazyQuery` used (banned) → stateful `useQuery`
- Apollo hooks from `"@apollo/client"` → must import from `"@apollo/client/react"`
- Missing `id` field on object types → required for Apollo cache normalization
- Custom inline types instead of generated from `frontend/graphql/generated/gql/`
- `TypedDocumentNode` not used or typed incorrectly
- Document naming: must be `{entityName}QueryDocument` or `{entityName}MutationDocument`
- Documents not in `frontend/graphql/sharedDocuments/<domain>.documents.ts`
- Documents not exported from `frontend/graphql/sharedDocuments/index.ts`
- Import from `"@apollo/client/core"` → `"@apollo/client"`

**Zustand Stores:**
- Not strictly typed using GraphQL generated types
- Complex intermediate mapping instead of Codegen types
- Manual type redefinition when types exist in schema

**i18n:**
- Hardcoded error strings, alert messages → must use `next-intl`
- Missing `useTranslations` from `next-intl`

**Theme & Styling:**
- Hardcoded colors: hex (`#fff`), `rgb()`/`rgba()`, CSS names (`red`, `blue`)
- String-based palette access `color="primary.main"` → `sx` callback
- Theme not accessed via callback `sx={(theme) => ({ ... })}`
- `contrastText` → Material 3 `on<Color>` siblings (e.g., `theme.palette.onPrimary`)
- Hardcoded font sizes → theme variants (`headlineLg`, `titleLg`, `bodyMd`)

**Dashboard UI Patterns:**
- Outer padding on views wrapping `PageContainer` → double-padding
- Per-feature `MetricCard` → shared from `@/frontend/components/ui`
- Inline status chips → `StatusBadge` with `category` prop
- Ad-hoc flex title blocks → `PageHeader` + `SectionPanel`
- Non-standard buttons → `PrimaryPageAction`, `FilterButton`, `ExportButton`

**Logging:**
- `console.*` → `import { logger } from '@/frontend/utils/logger'`

**Code Style:**
- Nested ternary operators → if/else or extracted functions

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/<filename>.md` using the `edit` tool.

### Plan file format:

```markdown
# Frontend Review Plan

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

Each finding uses `- [ ]` checkbox syntax so you can mark them `- [x]` as fixes are applied.

---

## Phase 5: Plan-Review Skill Validation

After writing the plan, **invoke the `plan-review` skill**:

```
skill:
  skill: "plan-review"
```

The plan-review skill validates the plan against the project's architecture rules. After it returns:

1. Add any violations it found to the "Layer Compliance Notes" section
2. Update severity if the skill escalates any finding
3. Re-save the plan file

Then ask:

```
ask_user:
  question: "The plan has been validated against project architecture rules. [summary]. Accept the improved plan, or revise?"
  choices:
    - "Accept the plan — looks good"
    - "Revise the plan — let me specify what to change"
```

Loop until accepted.

---

## Phase 6: Issue Fix Scoping (CRITICAL — user confirms each fix)

If the user chose "No — review only" in Phase 1 Question 4, skip to Phase 9.

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
  question: "There are [count] MUI v9 style-prop violations across [count] files. All require the same fix: move direct style props into sx. Fix all [count] as proposed?"
  choices:
    - "Yes, fix all as proposed (Recommended)"
    - "Fix some — let me review individually"
    - "Skip all MUI v9 findings"
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

If "adjust some fix approaches", loop back to the relevant issues. If "cancel fixes entirely", skip to Phase 9. **Do not proceed to Phase 7 until confirmed.**

---

## Phase 7: Implement Confirmed Fixes

### 7.1 Load instruction files BEFORE editing

| File Pattern | Instruction File | When to Load |
|---|---|---|
| `frontend/**/*.ts`, `frontend/**/*.tsx`, `app/**/*.ts`, `app/**/*.tsx` | `.github/instructions/frontend.instructions.md` | Before any frontend/app fix |
| `**/*` | `.github/instructions/sonarqube_mcp.instructions.md` | Before SonarQube-related fixes |

**Workflow for each fix:**
1. Identify which files need editing
2. Read the matching instruction file
3. Apply the fix following the instruction file rules AND the user's confirmed fix approach
4. Mark the finding as `[x]` in the plan file

### 7.2 Delegate fix implementation to subagents (CRITICAL)

To keep your context window small, delegate file edits to **general-purpose** subagents. These have FULL tooling — no restrictions.

**CRITICAL: Batch independent fixes into PARALLEL groups of up to 8.** Launch all fixes in a group in a SINGLE response. Fixes are independent if they don't edit the same file.

Each subagent receives:
- The file(s) to edit
- The specific finding to fix
- **The user's confirmed fix approach** (from Phase 6)
- The relevant instruction file content (paste verbatim)
- Explicit statement: **"You have full edit access — modify files as needed to fix the issue."**

```
Task:
  name: "fix-<finding-id>"
  agent_type: "general-purpose"
  mode: "background"
  description: "Fix <brief description>"
  prompt: |
    Fix the following issue in <file>:

    **Finding**: [SEVERITY] <group>: <file>:<line> — <description>

    **User-confirmed fix approach**: [the exact approach the user confirmed in Phase 6]

    **You have full edit access** — modify files as needed to fix the issue.

    **Instruction rules** (MUST follow these):
    <paste relevant instruction file content here>

    After fixing, verify the fix doesn't break surrounding code.
```

**Skip findings** the user marked as "SKIPPED" in Phase 6 — do NOT implement those.

### 7.3 Tracking

After each subagent completes a fix:
1. Update the plan file: change `[ ]` to `[x]`
2. Update todo tracking if using `todo` tool

---

## Phase 8: Verify Fixes (Quality Gate)

After all fixes are implemented, run the **quality-loop** skill:

```
skill:
  skill: "quality-loop"
```

This runs `tsgo → biome:check → lint` in sequence and loops until clean.

### If quality-loop reports issues:
1. Read the error output
2. Delegate fixes to a `general-purpose` subagent with the relevant instruction file
3. Re-run quality-loop

### If all passes:
- ✅ TypeScript (`tsgo`) — clean
- ✅ Biome — clean
- ✅ Lint — clean

---

## Phase 9: Commit Scoped Changes

Use the **commit-scoped** skill to commit only the files related to this review:

```
skill:
  skill: "commit-scoped"
```

---

## Phase 10: Final Summary

After commit succeeds:
1. Print brief summary: total findings, fixed count, skipped count, remaining count
2. Confirm plan file location: `.ai/plans/<filename>.md`
3. If any findings were skipped by the user, list them as remaining items
4. Suggest follow-up: "Address remaining findings in a future session"

## Output Format (for review findings from nested subagents)

Every finding must be reported as:

```
FINDING|SEVERITY|FILE:LINE|ISSUE_DESCRIPTION
```

Where:
- **SEVERITY**: `CRITICAL` for bugs/breaking, `WARNING` for convention violations, `SUGGESTION` for improvements
- **FILE:LINE**: Relative path from repo root with line number
- **ISSUE_DESCRIPTION**: Concise description of the violation and the correct pattern

If no violations: `CLEAN|No frontend violations found`
