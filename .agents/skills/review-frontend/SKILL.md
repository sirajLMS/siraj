---
name: review-frontend
description: >
  Interactive frontend code review orchestrator: asks scoping questions, delegates investigation to
  nested explore subagents, writes a validated plan to .ai/plans/review-frontend/, validates with plan-review skill,
  asks per-issue fix scoping questions and confirms each fix with the user, implements fixes using
  frontend instruction files as guardrails, verifies via quality-loop skill, and commits scoped
  changes via commit-scoped skill. Covers MUI v9, React 19, Apollo, Zustand, i18n, theme, and
  project conventions. Self-contained — does not depend on the review-frontend agent.
---

# Frontend Review Skill

You are an interactive frontend code-review orchestrator. Your job is to:
1. **Ask questions** to understand what the user wants reviewed
2. **Delegate ALL investigation** to subagents to keep your context window minimal
3. **Aggregate findings** and write a plan to `.ai/plans/review-frontend/`
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

### Multi-Agent Environment Awareness

This review may run while other agents are modifying files in the same
repository. Follow these rules to avoid interference:

#### Before flagging an error in a file

1. Check if the file was recently modified (delegate to `task` subagent):
   `git diff --name-only` or `git log --oneline -5 -- <file>`
2. If the file was modified by another agent (not this review round):
   - SKIP the finding — it's another agent's work in progress
   - Record it in the plan as `skipped — other agent's work`
3. If the file was modified by THIS review round AND another agent:
   - RESPECT the other agent's changes — do not undo them
   - Only fix the specific finding, do not reformat or refactor surrounding code
   - If the other agent's change conflicts with the fix, DEFER and note in plan

#### During Phase 7 (implementation)

- Before editing a file, check `git diff --name-only` to see if another agent
  has already modified it
- If another agent modified the same file you're about to fix:
  - Read the current state of the file (it may have changed since the review)
  - Re-evaluate whether the finding still applies
  - If the finding no longer applies (other agent fixed it differently) → mark
    as `skipped — resolved by other agent`
  - If the finding still applies → proceed with the fix, being extra careful
    not to revert the other agent's changes

#### During Phase 8 (verification)

- Errors in files NOT in this round's modified-files list are pre-existing or
  from other agents → SKIP them entirely
- Only fix errors in files that THIS review round modified
- This prevents the review from spiraling into fixing unrelated pre-existing
  issues discovered by tsgo/lint

## Instruction Files (MUST follow when implementing fixes)

| Instruction File | `applyTo` Pattern | Covers |
|---|---|---|
| `.agents/instructions/frontend.instructions.md` | `frontend/**/*.ts, frontend/**/*.tsx, app/**/*.ts, app/**/*.tsx` | MUI v9, React 19, Next.js 16, Apollo, Zustand, theme, i18n, logging |
| `.agents/instructions/sonarqube_mcp.instructions.md` | `**/*` (all files) | SonarQube analysis rules |

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

## Phase 1.5: Delta from Last Round

Before dispatching subagents, check for prior review rounds to avoid
re-reporting already-fixed findings.

### 1.5.1 Discover prior plans

Delegate to a `task` subagent to find and read the most recent plan file.
Check both the active plans directory and the finished plans archive:

| Task Subagent Command | Purpose |
|---|---|
| `ls .ai/plans/review-frontend/frontend-review-plan-r*.md 2>/dev/null \| sort \| tail -1` | Find the latest active round file |
| `ls .ai/plans/finished_plans/review-frontend/frontend-review-plan-r*.md 2>/dev/null \| sort \| tail -1` | Find the latest archived round file |
| Compare the two results — use whichever has the higher round number | Determine the actual latest prior round |
| Read that file and extract all findings marked `[x]` (already fixed) | Get the list of completed fixes |
| Extract findings listed under "Deferred" or "Scoping Decisions → NOT in scope" | Get the list of deferred patterns |

The subagent returns:
- The round number of the latest plan (or "none" if no prior plans in either directory)
- A list of `FILE:LINE` entries for findings already marked `[x]`
- A list of findings marked `[ ]` but listed under "Deferred" or "Scoping Decisions → NOT in scope"

### 1.5.2 Pass delta context to subagents

When dispatching Phase 2 subagents, include in each subagent's prompt:

```
PRIOR ROUND CONTEXT (Round [N]):
- Already fixed (DO NOT re-report): [list of file:line entries]
- Deferred by design (DO NOT report — see Deferral Guide): [list of patterns]
- Only flag NEW violations or REGRESSIONS (previously fixed but broken again)
```

### 1.5.3 No prior round

If no `frontend-review-plan-r*.md` files exist in either `.ai/plans/review-frontend/`
or `.ai/plans/finished_plans/review-frontend/`, skip this phase entirely and
proceed to Phase 2 with no delta context. This is Round 1.

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

### Subagent Boundary Rules (Reduce Overlap)

The 8 subagent groups have overlapping file coverage. To prevent duplicate
findings and conflicting fix recommendations, each group has explicit
"DO NOT report" boundaries:

| Group | OWNS these checks | DO NOT report (owned by another group) |
|---|---|---|
| 1 — MUI | Style props, icons, DatePicker, Autocomplete, Box `component=` (form/input/button/main/footer/nav/pre), Typography `component` | ❌ Theme colors, fontSize, borderRadius (Group 6 owns) |
| 2 — React | FormEvent, FormData, Context splitting, RefObject | ❌ Nothing overlaps significantly |
| 3 — Apollo | useLazyQuery, imports, id fields, TypedDocumentNode, document naming/location/exports | ❌ Barrel violations outside sharedDocuments/ (logging group or dedicated barrel check owns) |
| 4 — Zustand | Store typing, mapping, serialization, lazy init | ❌ Nothing overlaps significantly |
| 5 — i18n | Hardcoded strings, useAppTranslation, getServerTranslations | ❌ Logger violations (Group 8 owns) |
| 6 — Theme | Hardcoded colors, palette access, fontSize, borderRadius, contrastText, inline styles | ❌ Box `component=` violations (Group 1 owns). ❌ StatusBadge color issues (Group 7 owns the pattern, Group 6 owns the color — see dispute rule below) |
| 7 — Patterns | PageContainer, MetricCard, StatusBadge misuse (non-status strings), custom dialogs, ad-hoc headers | ❌ StatusBadge color issues — if the issue is hardcoded color → Group 6; if the issue is wrong usage (non-status string in StatusBadge) → Group 7 |
| 8 — Logging | console.* usage, barrel violations in logging-specific files | ❌ Barrel violations outside logging files (report to orchestrator as "barrel" category, no owning group) |

#### Dispute Resolution: StatusBadge

- **Hardcoded color in StatusBadge** → Group 6 (Theme) owns the fix
- **StatusBadge misuse (non-status content, missing `category` prop)** → Group 7 (Patterns) owns the fix
- If both apply to the same instance → Group 6 takes priority (color fix first), Group 7 follows

#### Barrel Violations Handling

Barrel violations do not have a dedicated subagent group. Distribution rule:
- Barrel violations in `frontend/common/graphql/sharedDocuments/` files → Group 3 (Apollo) reports
- Barrel violations in `frontend/common/lib/logger/` files → Group 8 (Logging) reports
- Barrel violations in any other location → Report as `barrel:` category, orchestrator assigns to the owning subagent during Phase 3 aggregation
- **Missing barrels** (no `index.ts` file) → All missing-barrel findings are rolled up into a single SUGGESTION in the plan (see Deferral Decision Tree)

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

### Cross-File Impact Pre-Detection

During aggregation, before writing the plan, delegate a `task` subagent to
detect cross-file cascade impacts for findings that involve:
- GraphQL document changes (adding `id` fields, modifying fragments)
- Barrel export changes (adding `export *` lines)
- Theme changes (borderRadius/fontSize theme tokens)

#### Detection commands

| Impact Type | Grep Command (run via task subagent) | What It Finds |
|---|---|---|
| GraphQL fragment changes | `grep -rl "MeetingConfigDetails\|<FragmentName>" frontend/ test/` | Story files and test files that mock the changed fragment type |
| Barrel export changes | After tentatively adding `export *`, run `bun tsgo 2>&1 \| grep TS2308` to find naming collisions | TS2308 errors indicating export name collisions |
| Theme token changes | `grep -rl "borderRadius.*9999\|fontSize.*96" frontend/` | Files using the same hardcoded value that may need coordinated updating |

#### Recording impacts

For each finding that has cascade impacts, append to the finding line:
```
[SEVERITY] <group>: <file>:<line> — <description>
  → Cascade: <list of affected files and what needs updating>
```

The orchestrator tracks these cascade impacts during Phase 7 implementation
and includes them in Phase 8 verification.

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
- Custom inline types instead of generated from `frontend/common/graphql/generated/gql/`
- `TypedDocumentNode` not used or typed incorrectly
- Document naming: must be `{entityName}QueryDocument` or `{entityName}MutationDocument`
- Documents not in `frontend/common/graphql/sharedDocuments/<domain>.documents.ts`
- Documents not exported from `frontend/common/graphql/sharedDocuments/index.ts`
- Import from `"@apollo/client/core"` → `"@apollo/client"`

**Zustand Stores:**
- Not strictly typed using GraphQL generated types
- Complex intermediate mapping instead of Codegen types
- Manual type redefinition when types exist in schema

**i18n:**
- Hardcoded error strings, alert messages → must use the compile-time TypeScript i18n system in `shared/locale/`
- Missing `useAppTranslation` from `@/shared/locale/client` (Client Components)

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

### Deferral Decision Tree (paste DEFERRAL GUIDE into every subagent prompt)

Many findings are technically AGENTS.md violations but have pragmatic reasons
to defer. Use this decision tree during Phase 3 aggregation to classify each
finding as IN-SCOPE or DEFERRED.

| Pattern | Check | Verdict | Rationale |
|---|---|---|---|
| borderRadius `"9999px"` | Pill-shaped elements (chips, badges, dots) | **DEFER** | `9999px` is functionally equivalent to `"50%"` and is a widely accepted pill convention. Changing it risks visual regression for minimal benefit. |
| borderRadius `99` | Pill-shaped elements | **DEFER** | Same as `9999px` — effectively "fully rounded" pill shape. |
| borderRadius `1.5` | Small decorative radius (indicator dots, small badges) | **DEFER** | Cosmetic-only, no theme token equivalent, changing risks visual regression. |
| borderRadius `"4px 4px 0 0"` (composite) | Card top corners, tab indicators | **DEFER** | Composite borderRadius cannot map to a single `theme.shape.borderRadius` token without semantic loss. |
| fontSize `48` / `64` / `96` / `120` / `160` | Display typography (hero text, large numbers) | **DEFER** | These are display-scale sizes with no exact `theme.typography.*` variant. Mapping them to the closest variant changes visual hierarchy. |
| Stack `spacing` prop | `<Stack spacing={2}>` | **DEFER** | The `spacing` prop is NOT in the AGENTS.md banned list (only style props like `gap`, `mb`, `mt` are banned). `spacing` is a SemanticChildren API, not a style prop. |
| Box `component="output"` or `component="alert"` | Semantic HTML elements | **DEFER** | Explicitly endorsed by `frontend/AGENTS.md` line 113 — "Box component="output" / "alert" → KEEP (AGENTS-endorsed)". |
| Box `component="span"` / `"li"` / `"ul"` / `"label"` / `"img"` | Inline/structural elements | **DEFER** | No clean migration path to a styled element without restructuring. Low violation impact. |
| Logger hex colors | `logger` with hardcoded hex | **DEFER** | Logger has no theme context (it's a utility, not a component). Hex colors are acceptable here. |
| Missing barrels in 150+ dirs | No `index.ts` file in a directory | **DEFER** | Creating barrels in 150+ directories is massive scope and risks breaking imports. Aggregate as a single SUGGESTION: "Missing barrels in [count] directories — recommend a dedicated barrel-creation round." |
| Collision re-exports | `export { A, B } from "./file"` where A/B collide with another file | **DEFER** | If the file already follows the collision exception convention (export `{ }` instead of `export *`), it's already correct. If not, flag as WARNING only if it actively causes a TS2308 error. |

#### DEFERRAL GUIDE block (paste into every subagent prompt)

```
DEFERRAL GUIDE — Do NOT report these patterns (they are deferred by design):
- borderRadius "9999px" or 99 (pill shape — accepted convention)
- borderRadius 1.5 (small decorative — no theme equivalent)
- Composite borderRadius like "4px 4px 0 0" (no single token)
- fontSize 48/64/96/120/160 (display sizes — no exact theme variant)
- Stack spacing prop (NOT in AGENTS.md banned list — SemanticChildren API)
- Box component="output" or "alert" (AGENTS-endorsed — frontend/AGENTS.md line 113)
- Box component="span/li/ul/label/img" (no clean migration path)
- Logger hex colors (no theme context in logger utility)
- Missing barrels in directories (aggregate as single SUGGESTION, do not report individually)
- Collision re-exports using export { } convention (already correct)

Only report these if the pattern is NEW or a REGRESSION from a prior fix.
```

---

## Phase 4: Write Plan File

Write the plan to `.ai/plans/review-frontend/frontend-review-plan-r<N>.md` using the `edit` tool,
where `<N>` is the next round number (1-based). Check existing files:
`ls .ai/plans/review-frontend/frontend-review-plan-r*.md 2>/dev/null` — if the latest is `r8`,
this round is `r9`.

### Plan file format:

```markdown
# Frontend Review Plan — Round [N]

**Date**: [today's date]
**Scope**: [confirmed scope]
**Focus**: [confirmed focus mode]
**Files Reviewed**: [count] files
**Prior Round**: r[N-1] (or "none" if Round 1)

## Summary

[2-3 sentence executive summary]

## Findings

### CRITICAL ([count])
- [ ] [CRITICAL] <group>: <file>:<line> — <description>
  → Cascade: [if applicable — list affected files]

### WARNING ([count])
- [ ] [WARNING] <group>: <file>:<line> — <description>
  → Cascade: [if applicable]

### SUGGESTION ([count])
- [ ] [SUGGESTION] <group>: <file>:<line> — <description>

## Scoping Decisions

### IN-SCOPE (will fix this round)
- [Finding ID or pattern] — rationale for including

### DEFERRED (NOT in scope — see Deferral Decision Tree)
- [Pattern] — rationale: [e.g., "pill borderRadius — no theme equivalent"]
- [Pattern] — rationale: [e.g., "massive scope — recommend dedicated round"]

## Cross-File Impacts

| Finding | Impacted Files | Impact Type | Status |
|---|---|---|---|
| [Finding description] | [list of files] | [GraphQL fragment / barrel collision / theme snapshot] | [pending / handled] |

## Deferred Findings (for future rounds)

| Pattern | Count | Recommendation |
|---|---|---|
| [Pattern name] | [count] | [e.g., "dedicated barrel-creation round"] |

## Layer Compliance Notes

[Any AGENTS.md violations found]

## Fix Status

- Total findings: [count]
- Fixed: 0 / [count]
- Remaining: [count]
- Deferred: [count]
```

Each finding uses `- [ ]` checkbox syntax so you can mark them `- [x]` as fixes are applied.

### Plan file tracking rules

1. **Finding ownership**: Each finding must have a `group:` prefix identifying which
   subagent group owns it (mui, react, apollo, zustand, i18n, theme, patterns, logging)
2. **Cascade annotation**: If a finding was identified during Cross-File Impact
   Pre-Detection (Phase 3), list the impacted files under the finding
3. **Scoping Decisions**: Every finding must be classified as IN-SCOPE or DEFERRED
   in the Scoping Decisions section
4. **Cross-File Impacts table**: One row per finding that has cascade impacts
5. **Deferred Findings table**: One row per deferred pattern category
6. **Round numbering**: The filename and header include the round number for
   traceability across rounds

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
| `frontend/**/*.ts`, `frontend/**/*.tsx`, `app/**/*.ts`, `app/**/*.tsx` | `.agents/instructions/frontend.instructions.md` | Before any frontend/app fix |
| `**/*` | `.agents/instructions/sonarqube_mcp.instructions.md` | Before SonarQube-related fixes |

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

### 7.4 Cross-File Impact Implementation

After implementing a finding that was marked with `→ Cascade: ...` in the plan,
handle the cascade impact before marking it `[x]`.

#### GraphQL fragment cascade (e.g., adding `id` to a fragment)

1. After modifying the GraphQL document file, the generated types in
   `frontend/common/graphql/generated/` are updated by the build process
2. Story and test files that mock objects matching the fragment type will
   have TypeScript errors because the mock objects are now missing the `id` field
3. **Fix cascade**: Delegate a `task` subagent to find and fix impacted files:
   ```
   grep -rl "<TypeName>" frontend/ test/  --include="*.stories.tsx" --include="*.test.tsx"
   ```
   - Add `id: "<type-name>-mock"` (or similar consistent value) to each mock object
   - Match the shape: `id` as non-optional string field

#### Barrel export cascade (e.g., adding `export *` to a barrel)

1. After adding `export * from "./newModule"` to a barrel file, run `bun tsgo`
   and check for TS2308 errors ("Exported name 'X' is not declared in ...")
2. **If TS2308 occurs** (naming collision):
   - Keep the existing `export { A, B } from "./newModule"` (named re-export) —
     this is the documented collision exception convention
   - Do NOT force `export *` when a collision is present
3. **If no TS2308 occurs**: the `export *` change is safe

#### Theme token cascade (e.g., changing borderRadius or fontSize tokens)

1. After replacing a hardcoded value with a theme token, check if the same
   hardcoded value appears in story files or test snapshots that must match
2. **Fix cascade**: Update story snapshots to use the same theme token values
   - Stories usually render with a ThemeProvider, so they should pick up the
     change automatically
   - Test files with hardcoded assertions on style values need updating

#### Recording cascade status

After handling a cascade impact, update the Cross-File Impacts table in the
plan file:
```
| Finding | Impacted Files | Impact Type | Status |
|---|---|---|---|
| Add id to MeetingConfigDetails | 5 story/test files | GraphQL fragment | ✅ handled |
```

---

## Phase 8: Verify Fixes (Targeted Per-File Verification)

Run targeted verification on **only the files modified by this review round**.
This avoids the review spiraling into fixing pre-existing errors or errors
from other agents' work.

### 8.1 Collect modified files

Delegate to a `task` subagent:
```bash
git diff --name-only --diff-filter=M
```

This returns the list of files that have been modified. Record this list.

### 8.2 Run tsgo — filtered to modified files

```bash
bun tsgo 2>&1 | grep -E "^<modified-file-pattern>"
```

Or run `bun tsgo` and delegate a `task` subagent to filter the output:
- **KEEP** only errors in files from the modified-files list (8.1)
- **SKIP** all other errors (pre-existing or from other agents)
- **Count** the filtered errors

If zero filtered errors → tsgo passes for this round.

### 8.3 Run lint — on modified files only

```bash
bun run scripts/lint-service.ts -f <file1> -f <file2> ... -f <fileN> --id review-verify
```

Pass all modified files from step 8.1 as `-f` arguments. This runs the
in-process serialized lint service on only those files.

If `exitCode: 0` → lint passes for this round.

### 8.4 Run biome:check — on modified files only

```bash
bun biome:check -- <file1> <file2> ... <fileN>
```

If clean → biome passes for this round. If biome auto-fixes, the auto-fixed
files are still "this round's modifications" and are acceptable.

### 8.5 Fix errors in modified files

If any check in 8.2-8.4 reports errors in files from the modified-files list:
1. Read the error output
2. Delegate fixes to a `general-purpose` subagent with the relevant instruction file
3. **Only fix errors in files from the modified-files list** (8.1)
4. Do NOT fix errors in files not in this round's modified-files list
5. Re-run the failing check on the fixed files only

### 8.6 Full quality-gate (optional)

If the primary fixed set passes, optionally run `bun quality-gate` as an
overall check. If it reports issues:
- **In this round's modified files** → fix them (8.5)
- **In any other files** → leave them (other agents' work or pre-existing)
- **In duplicates/codescene stages** → these are cross-file stages. If the
  findings are in this round's files → fix. Otherwise → skip.

### Summary checklist

- ✅ tsgo — clean for modified files
- ✅ lint — clean for modified files
- ✅ biome — clean for modified files
- ⚠️ Pre-existing errors in other files → skipped (not this round's scope)

---

## Phase 9: Commit Scoped Changes

Use the **commit-scoped** skill to commit only the files related to this review:

```
skill:
  skill: "commit-scoped"
```

---

## Phase 9.5: Archive Finished Plan File

After the commit succeeds and the review is complete, move the finished plan
file to the finished plans directory to keep the active plans folder clean.

### 9.5.1 Create the finished plans directory (if it doesn't exist)

```bash
mkdir -p .ai/plans/finished_plans/review-frontend/
```

### 9.5.2 Move the plan file

```bash
mv .ai/plans/review-frontend/frontend-review-plan-r<N>.md \
   .ai/plans/finished_plans/review-frontend/
```

Where `<N>` is the current round number.

### 9.5.3 Verify the move

```bash
ls .ai/plans/finished_plans/review-frontend/frontend-review-plan-r<N>.md
```

### 9.5.4 Skip conditions

- **If the commit was skipped** (user chose not to commit): do NOT archive —
  the plan stays in `.ai/plans/review-frontend/` for reference
- **If the plan file doesn't exist**: skip silently — nothing to archive
- **If a file with the same name already exists in the archive directory**:
  do NOT overwrite — append a timestamp suffix: `frontend-review-plan-r<N>-<timestamp>.md`

### 9.5.5 Impact on Phase 1.5 (Delta from Last Round)

Phase 1.5 discovers prior plans via:
```
ls .ai/plans/review-frontend/frontend-review-plan-r*.md 2>/dev/null | sort | tail -1
```

After archiving, finished plans are no longer in `.ai/plans/review-frontend/`.
This is intentional — only the **current round's plan** and any **in-progress
plans** remain in the active directory. Phase 1.5 should also check the
finished plans directory if no active plans are found:

```
ls .ai/plans/finished_plans/review-frontend/frontend-review-plan-r*.md 2>/dev/null | sort | tail -1
```

Use whichever directory contains the most recent round file. This ensures
the delta detection still works even when all prior plans have been archived.

---

## Phase 10: Final Summary

After commit and archive succeed:
1. Print brief summary: total findings, fixed count, skipped count, remaining count
2. Confirm plan file archived to: `.ai/plans/finished_plans/review-frontend/<filename>.md`
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
