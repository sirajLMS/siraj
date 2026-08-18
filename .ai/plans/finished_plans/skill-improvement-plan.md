# Improvement Plan for `review-frontend` SKILL.md

## Current Phase Structure (for reference)

| Phase | Name | Lines |
|-------|------|-------|
| 1 | Interactive Scoping | 58–127 |
| 2 | Dispatch Review Subagents | 129–168 |
| 3 | Aggregate Findings | 170–239 |
| 4 | Write Plan File | 241–287 |
| 5 | Plan-Review Skill Validation | 289–315 |
| 6 | Issue Fix Scoping (user confirms) | 317–402 |
| 7 | Implement Confirmed Fixes | 405–462 |
| 8 | Verify Fixes (Quality Gate) | 464–485 |
| 9 | Commit Scoped Changes | 487–495 |
| 10 | Final Summary | 499–504 |
| — | Output Format | 506–520 |

---

## Section 1: NEW PHASE — "Phase 1.5: Delta from Last Round Detection"

**Insert location**: After Phase 1 (line 127, after the `---` separator), before Phase 2.

**Phase number**: 1.5 (new phase, no renumbering needed — keeps all existing phase numbers stable)

**What to add**: A complete new phase that detects prior review rounds and prevents re-reporting already-fixed findings.

**Content**:

```markdown
## Phase 1.5: Delta from Last Round

Before dispatching subagents, check for prior review rounds to avoid
re-reporting already-fixed findings.

### 1.5.1 Discover prior plans

Delegate to a `task` subagent to find and read the most recent plan file:

| Task Subagent Command | Purpose |
|---|---|
| `ls .ai/plans/frontend-review-plan-r*.md 2>/dev/null \| sort \| tail -1` | Find the latest round file |
| Read that file and extract all findings marked `[x]` (already fixed) | Get the list of completed fixes |

The subagent returns:
- The round number of the latest plan (or "none" if no prior plans)
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

If no `frontend-review-plan-r*.md` files exist, skip this phase entirely and proceed to Phase 2 with no delta context.
```

**Existing content replaced**: None. This is a pure insertion between Phase 1 and Phase 2.

---

## Section 2: NEW SECTION — "Deferral Decision Tree" (add to Phase 3)

**Insert location**: At the end of Phase 3 (after line 239, before the `---` separator), as a new subsection under "Frontend Review Checks".

**Phase number**: Phase 3 (no renumbering — added as subsection `### Deferral Decision Tree` within existing Phase 3)

**What to add**: An explicit list of patterns that subagents should DEFER (not report as findings) because no clean fix exists per AGENTS.md or the codebase's current state.

**Content**:

```markdown
### Deferral Decision Tree

Subagents MUST NOT report findings for the following patterns. These have
no clean fix under current AGENTS.md rules or would require massive scope.
Record them in the plan's "Deferred" section as a single rolled-up entry,
NOT as individual findings.

#### MUI/Theme Deferrals (no theme token exists)

| Pattern | Reason | Example |
|---|---|---|
| `borderRadius: "9999px"` | Pill/circle shape — no theme token for fully circular | `borderRadius: "9999px"` |
| `borderRadius: 99` | Pill shape — intentional design pattern, no theme token | `borderRadius: 99` |
| `borderRadius: 1.5` or small pixel values (<4) | Indicator dots / DataGrid cell radius — no theme token equivalent | `borderRadius: 1.5` |
| Composite borderRadius (`"4px 4px 0 0"`, `"0 12px 12px 0"`) | Multi-corner shapes — cannot use single `theme.shape.borderRadius` | `borderRadius: "4px 4px 0 0"` |
| Large fontSize values (48, 64, 96, 120, 160) | Display/decorative sizes — no matching `theme.typography` variant | `fontSize: 96` |
| `Stack spacing` prop | AGENTS.md does NOT explicitly list `spacing` in the banned-props list (line 37). Heavily used (~356 instances). High regression risk. | `<Stack spacing={2}>` |

#### MUI/Theme Deferrals (explicitly endorsed by AGENTS.md)

| Pattern | Reason | Reference |
|---|---|---|
| `Box component="output"` | AGENTS.md line 113 explicitly endorses for aria-live regions | `frontend/AGENTS.md` "New MUI v9 Patterns" |
| `Box component="alert"` | AGENTS.md line 113 explicitly endorses for alert semantics | `frontend/AGENTS.md` "New MUI v9 Patterns" |

#### MUI/Theme Deferrals (no clean migration path)

| Pattern | Reason |
|---|---|
| `Box component="span"/"li"/"ul"/"label"/"img"` | Structural HTML elements. sx cannot hold `component`. Migration would change DOM structure. No clean path. |
| `Typography component="span"` | Wrapper element workaround exists but changes DOM structure. Low risk but deferring unless user explicitly requests. |

#### Logger Deferrals

| Pattern | Reason |
|---|---|
| Logger hex colors (`#color` in logger config) | Logger runs server-side with no theme context. No way to use `theme.palette`. |

#### Barrel Deferrals (massive scope)

| Pattern | Reason |
|---|---|
| Missing `index.ts` barrel files in 150+ view feature directories | Massive scope (~150+ dirs), high risk of import breakage, marginal value. Roll up as a single SUGGESTION. |
| Missing `index.ts` in `common/hooks/`, `common/stores/`, `common/types/`, `common/utils/`, `common/providers/` | Large directories where consumers already use deep paths. Adding barrels would require updating all import sites. Roll up as a single SUGGESTION. |
| Named re-exports (`export { }`) where a collision exists | AGENTS.md barrel conventions explicitly allow named re-exports when `export *` causes TS2308 collision. Check `collisions-registry.md` before flagging. DEFER if collision is documented. |
| Missing barrels in `__shared__/` directories (~70 dirs) | Large scope, low value, deferred per prior rounds. Roll up as single SUGGESTION. |

#### Deferral notation in subagent prompts

Add this block to EVERY subagent prompt in Phase 2:

```
DEFERRAL GUIDE — DO NOT report these patterns as findings:
- borderRadius: "9999px" or 99 — pill/circle, no theme token
- borderRadius: 1.5 or small px — indicator dots, no token
- Composite borderRadius (multi-corner) — can't use single token
- fontSize: 48/64/96/120/160 — display sizes, no typography variant
- Stack spacing prop — not in AGENTS.md banned list, 356 instances
- Box component="output"/"alert" — explicitly endorsed by AGENTS.md
- Box component="span"/"li"/"ul"/"label"/"img" — no clean migration
- Logger hex colors — no theme context
- Missing barrel files in 150+ dirs — massive scope, roll up as one SUGGESTION
- Named re-exports where collision is documented in collisions-registry.md
```
```

**Existing content replaced**: None. This is added as a new subsection within Phase 3, after the existing "Code Style" check list (line 238).

---

## Section 3: MODIFY — Subagent Boundary Clarifications (Phase 2)

**Insert location**: Phase 2, "Subagent Groupings" table (lines 135–145) and the "Dispatch format" section (lines 156–167).

**Phase number**: Phase 2 (modified in place, no renumbering)

**What to change**: Add a new subsection `### Subagent Boundary Rules (Reduce Overlap)` after the Dynamic Sizing table (after line 152, before the Dispatch format section).

**Content**:

```markdown
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
```

**Existing content replaced**: None. Added as a new subsection within Phase 2, between the Dynamic Sizing table and the Dispatch format section.

---

## Section 4: MODIFY — Phase 3 Aggregate Findings (Add Cross-File Impact Detection)

**Insert location**: After Phase 3's existing aggregation block (after line 179), before the "Frontend Review Checks" subsection.

**Phase number**: Phase 3 (modified in place)

**What to add**: A new subsection `### Cross-File Impact Pre-Detection` that runs during aggregation (before writing the plan) to identify cascade impacts.

**Content**:

```markdown
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
```

**Existing content replaced**: None. Added as a new subsection within Phase 3, after the aggregation instructions and before the Frontend Review Checks block.

---

## Section 5: MODIFY — Phase 4 Plan File Format (Enhanced Tracking)

**Insert location**: Replace the plan file format block (lines 246–285) with an enhanced version.

**Phase number**: Phase 4 (modified in place)

**What to change**: Replace the entire `### Plan file format:` block with an expanded format that includes:
- A "Scoping Decisions" section (formalized from r8/r9 patterns)
- Per-finding ownership and status
- A "Deferred" section
- A "Cross-File Impacts" section

**New content**:

```markdown
### Plan file format:

```markdown
# Frontend Review Plan — Round [N]

**Date**: [today's date]
**Scope**: [confirmed scope]
**Focus**: [confirmed focus mode]
**Files Reviewed**: [count] files
**Prior Round**: Round [N-1] (or "none")
**Delta**: [count] new findings, [count] regressions, [count] carried-over

## Summary

[2-3 sentence executive summary]

## Findings

### CRITICAL ([count])
- [ ] [CRITICAL] <group>: <file>:<line> — <description>
  → Fix: [confirmed approach, or "PENDING" if not yet scoped]
  → Owner: <subagent group or "orchestrator">
  → Status: pending | in_progress | done | deferred | skipped
  → Cascade: [affected files, if any]

### WARNING ([count])
- [ ] [WARNING] <group>: <file>:<line> — <description>
  → Fix: [confirmed approach]
  → Owner: <subagent group>
  → Status: pending

### SUGGESTION ([count])
- [ ] [SUGGESTION] <group>: <file>:<line> — <description>
  → Fix: [confirmed approach]
  → Owner: <subagent group>
  → Status: pending

## Scoping Decisions

### In Scope — Will Fix
1. [Category] — [count] instances across [count] files → [fix approach]
2. ...

### Deferred — NOT in scope
1. [Pattern] — [reason for deferral]
2. ...
(See Deferral Decision Tree in SKILL.md for canonical deferral patterns)

## Cross-File Impacts

| Finding | Cascade Files | Impact Type | Status |
|---|---|---|---|
| [finding ref] | [list of files] | Story snapshot / Test mock / TS2308 collision | pending |

## Recommended Actions

[Prioritized actions grouped by urgency, with parallel batch groupings]

## Layer Compliance Notes

[Any AGENTS.md violations found by plan-review skill]

## Deferred Findings

| Pattern | Count | Reason | Reference |
|---|---|---|---|
| borderRadius: "9999px" | [count] | No theme token for pill shapes | Deferral Decision Tree |
| Stack spacing prop | [count] | Not in AGENTS.md banned list, 356 instances | Deferral Decision Tree |
| Missing barrels (150+ dirs) | [count] | Massive scope, high risk | Deferral Decision Tree |
| ... | ... | ... | ... |

## Fix Status

- Total findings: [count]
- Fixed: 0 / [count]
- Deferred: [count]
- Skipped: [count]
- Remaining: [count]
```

Each finding uses `- [ ]` checkbox syntax so you can mark them `- [x]` as
fixes are applied. Update `→ Status:` in place as fixes progress.

### Plan file naming convention for multi-round reviews

When this is not the first review round, name the file
`frontend-review-plan-r<N>.md` where N is the round number. Read Phase 1.5
output to determine N.
```

**Existing content replaced**: The entire `### Plan file format:` block (lines 246–285) is replaced with the expanded format above. The line about "Each finding uses `- [ ]` checkbox syntax" (line 285) is retained but moved into the format block.

---

## Section 6: MODIFY — Phase 7 (Add Cross-File Impact Implementation Step)

**Insert location**: After Phase 7.3 "Tracking" (line 461), before the `---` separator at line 462.

**Phase number**: Phase 7 (new subsection 7.4 added, no renumbering)

**What to add**: A new subsection `### 7.4 Cross-File Impact Implementation` that handles cascade impacts detected in Phase 3.

**Content**:

```markdown
### 7.4 Cross-File Impact Implementation

After implementing primary fixes, address cascade impacts identified in Phase 3.

#### GraphQL fragment changes

If a fix added `id` fields or modified fragment selections:
1. Delegate a `task` subagent to find files referencing the changed fragment:
   `grep -rl "MeetingConfigDetails\|<FragmentName>" frontend/ test/`
2. For each story file found: update the mock/stub to include the new `id` field
3. For each test file found: update the test fixture to include the new `id` field
4. Track each cascade file in the plan's "Cross-File Impacts" table

#### Barrel export changes

If a fix added `export *` lines to a barrel:
1. Delegate a `task` subagent to run `bun tsgo 2>&1 | grep TS2308`
2. If TS2308 errors appear (naming collision):
   - DO NOT convert to `export *` — revert to named re-export
   - Document the collision in `collisions-registry.md`
   - Mark the finding as `deferred` with reason "collision"
3. If no TS2308 errors: proceed normally

#### Theme token changes

If a fix changed borderRadius/fontSize from hardcoded to theme token:
1. Check if any `.stories.tsx` files snapshot the changed component
2. If stories exist: verify they still render correctly (the change is cosmetic,
   but snapshots may differ)
3. Track in the "Cross-File Impacts" table

#### Tracking cascade files

Update the plan file's "Cross-File Impacts" table:
```markdown
| [finding ref] | [list of files] | Story snapshot | done |
```

Mark cascade impacts as `done` only after the cascade file has been verified
in Phase 8.
```

**Existing content replaced**: None. Added as subsection 7.4 within existing Phase 7, after the Tracking subsection.

---

## Section 7: MODIFY — Phase 8 (Mandatory Per-File Verification)

**Insert location**: Replace the entire Phase 8 content (lines 464–485) with an expanded version.

**Phase number**: Phase 8 (modified in place, no renumbering)

**What to change**: Replace the generic "run quality-loop" with a specific per-file verification workflow that:
- Tracks exact modified files
- Runs targeted checks only on modified files
- Skips errors in files NOT modified by this round (pre-existing from other agents)
- Dispatches fix subagents for modified-file errors only

**New content**:

```markdown
## Phase 8: Verify Fixes (Targeted Per-File Verification)

### 8.1 Collect modified files

Before verification, compile the EXACT list of files modified during this
review round. Sources:
- Files edited by Phase 7 fix subagents (tracked in plan file checkboxes)
- Cascade files updated in Phase 7.4
- **NOT** files modified by other agents running in parallel

Delegate a `task` subagent to run:
```bash
git diff --name-only
```
Cross-reference with the plan file's `[x]`-marked findings to identify which
modified files belong to THIS review round.

### 8.2 Run targeted verification (delegate to task subagent)

For each modified file, run these checks IN ORDER:

| Step | Command | What it catches |
|---|---|---|
| 1 | `bun tsgo 2>&1 | grep -A2 "<modified-file>"` | TypeScript errors in modified files |
| 2 | `bun run scripts/lint-service.ts -f <file> --id verify` | ESLint errors in the specific file |
| 3 | `bun biome:check -- <file>` | Biome formatting/lint errors |

**Filter rule (CRITICAL)**: Only report errors for files in the modified-files
list. Errors in files NOT modified by this round are pre-existing (from other
agents or prior state) — SKIP them. Do not attempt to fix them.

### 8.3 Handle errors in modified files

If any modified file has an error:

1. Identify the error and the modified file
2. Check if the error was INTRODUCED by this round's fix (regression) or
   pre-existing in the file
3. If introduced by this round:
   - Dispatch a `general-purpose` fix subagent with:
     - The file path
     - The error message
     - The instruction file content (from Phase 7.1)
     - The original fix approach from the plan
4. If pre-existing (not introduced by this round):
   - SKIP — do not fix, do not touch the file
5. Re-run 8.2 for the fixed file only

### 8.4 Full quality-loop (optional)

After all modified-file checks pass:
- If ALL modified files are clean → proceed to Phase 9
- Optionally run `bun quality-gate` for full-repo verification
  - If quality-gate reports errors ONLY in unmodified files → SKIP them
  - If quality-gate reports errors in modified files → go back to 8.3

### 8.5 Verification checklist

Before proceeding to Phase 9, confirm:
- [ ] All modified files pass `tsgo` (no TS errors)
- [ ] All modified files pass `lint-service.ts` (no ESLint errors)
- [ ] All modified files pass `biome:check` (no Biome errors)
- [ ] Cross-File Impacts table shows all cascade files as `done`
- [ ] No errors in unmodified files were touched (leave for other agents)
```

**Existing content replaced**: The entire Phase 8 block (lines 464–485) is replaced with the expanded version above. The reference to "quality-loop" skill (lines 467–477) is retained as an optional step (8.4) but the primary workflow is now per-file targeted verification.

---

## Section 8: MODIFY — Add "Other Agents' Work" Awareness (Multi-Agent Rules)

**Insert location**: After the "Context Window Discipline Rules" section (after line 55, before the "Instruction Files" table at line 47).

**Phase number**: Not phase-specific — this is a global rule added to the skill's preamble section.

**What to add**: A new subsection `### Multi-Agent Environment Awareness` in the Context Window Discipline Rules section.

**Content**:

```markdown
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
```

**Existing content replaced**: None. Added as a new subsection within the "Context Window Discipline Rules" section, after the "✅ Keep in your context ONLY" block and before the "Instruction Files" table.

---

## Summary of All Changes

| # | Section Name | Phase | Action | Lines Affected |
|---|---|---|---|---|
| 1 | Delta from Last Round Detection | NEW Phase 1.5 | INSERT after Phase 1 | After line 127 |
| 2 | Deferral Decision Tree | Phase 3 | INSERT subsection | After line 239 |
| 3 | Subagent Boundary Rules | Phase 2 | INSERT subsection | After line 152 |
| 4 | Cross-File Impact Pre-Detection | Phase 3 | INSERT subsection | After line 179 |
| 5 | Enhanced Plan File Format | Phase 4 | REPLACE plan format block | Lines 246–285 |
| 6 | Cross-File Impact Implementation | Phase 7 | INSERT subsection 7.4 | After line 461 |
| 7 | Targeted Per-File Verification | Phase 8 | REPLACE entire phase | Lines 464–485 |
| 8 | Multi-Agent Environment Awareness | Preamble | INSERT subsection | After line 55 |

### Phase Renumbering

**No phase renumbering needed.** The only structural changes are:
- Phase 1.5 (new, between Phase 1 and Phase 2) — uses fractional numbering
- Phase 7 gets a new subsection 7.4 (existing subsections 7.1–7.3 unchanged)
- Phase 8 gets subsections 8.1–8.5 (replacing the previous content of Phase 8)

All existing phase numbers 1–10 remain the same.

### New Subagent Prompts Needed

1. **Phase 1.5 delta subagent**: `task` agent that discovers and reads prior plan files
2. **Phase 3 cross-file impact subagent**: `task` agent that runs grep commands for cascade detection
3. **Phase 8.1 modified-files subagent**: `task` agent that runs `git diff --name-only` and cross-references with plan file
4. **Phase 8.2 verification subagent**: `task` agent that runs tsgo/lint/biome on specific files and filters output

No new `explore` or `general-purpose` subagent prompt types are needed — the existing Phase 2 review subagent prompts and Phase 7 fix subagent prompts are enhanced in-place (with the Deferral Guide and Boundary Rules blocks appended).

### What Is NOT Changed

- Phase 1 (Interactive Scoping) — unchanged
- Phase 2 subagent groupings table — unchanged (Boundary Rules added as separate subsection)
- Phase 3 "Frontend Review Checks" detection lists — all existing items retained, no removal
- Phase 5 (Plan-Review Skill Validation) — unchanged
- Phase 6 (Issue Fix Scoping) — unchanged
- Phase 9 (Commit Scoped Changes) — unchanged
- Phase 10 (Final Summary) — unchanged
- Output Format section — unchanged

### Detection Capabilities Preserved

Every existing check in the "Frontend Review Checks" block (lines 183–238) is retained without modification. The changes only ADD:
- New deferral guidance (telling subagents what NOT to report)
- New boundary rules (telling subagents which group owns what)
- New cross-file detection (finding cascade impacts)
- New plan file fields (ownership, status, deferred section)
- New verification specificity (per-file targeted checks)
- New multi-agent awareness (skip other agents' files)
