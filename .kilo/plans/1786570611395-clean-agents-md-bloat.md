# Plan: Clean AGENTS.md Bloat & Update spec-driven-development Propagation Policy

## Context

AGENTS.md files are bloated by non-rules content. Research found 3 categories:

1. **Oxlint Rules block (~180 lines) duplicated across all 29 AGENTS.md files + all 5 `.agents/instructions/*.md` files** (~34 copies). In most layer AGENTS.md files this block is ~60% of total lines. Instructions files use a condensed ~11-line version; AGENTS.md files use the full ~180-line version. The root AGENTS.md also has a separate ESLint/sonarjs block (~100 lines, lines 651-757) not duplicated to layers.
2. **`frontend/AGENTS.md` heavily polluted**: ~8 sections are generic duplicates of root AGENTS.md content (SonarQube workflow, AI Agent Rules, Scripts/Commands, Package Manager Config, Logging, Code Quality Checks, Next.js comment block) plus a verbatim duplicate of `sonarqube_mcp.instructions.md` (lines 69-116), a stray frontmatter leak (`## applyTo: "**/*"`), and a duplicate "Mobile vs Desktop Isolation" section. No other layer AGENTS.md file has these generic duplicates — only `frontend/AGENTS.md`.
3. **`spec-driven-development` skill actively generates future bloat**: its Knowledge Propagation section (SKILL.md lines 513-572) instructs every feature plan's final task to "add new rules, patterns, or references" inline into AGENTS.md files and instructions files.

## Key Findings (from investigation)

- **`sub-loop.ts` does NOT read inline AGENTS.md content** — it hardcodes its own condensed Oxlint cheat sheet (lines 168-181) and only prints *paths* to AGENTS.md/instructions files (lines 144-160). Removing inline Oxlint blocks from AGENTS.md will NOT break the sub-loop workflow. The script's cheat sheet is left as-is (decision: leave as-is — it's a stable quick-reference).
- **No scripts or skills programmatically parse inline Oxlint/ESLint content** from AGENTS.md. The `plan-review` skill doesn't reference lint rules. Safe to remove inline blocks.
- **8 files have stale "See AGENTS.md 'Oxlint Rules' section" references** that must be updated to point to `docs/quality/linting-rules.md`: 5 skill files (`fix-codescene/SUB_AGENT_PROMPT_TEMPLATE.md`, `fix/SKILL.md`, `fix-tests/SKILL.md`, `quality-gate/SKILL.md`, `quality-loop/SKILL.md`), `.github/copilot-instructions.md`, and 2 script files (`sub-loop-types.ts:13` comment, `sub-loop.ts:168` console output). Historical plan files in `.ai/finished_plans/` and `.kilo/plans/done/` also reference these section names but are out of scope (historical artifacts).
- **`docs/quality/` is the established convention** for the "Quality gates / CI" domain — confirmed by the spec-driven-development skill's domain-to-artifacts mapping table (SKILL.md line 559). Root `AGENTS.md` is the AGENTS.md to update for that domain.
- **`sub-loop.ts` has a pre-existing bug**: it references `.github/instructions/` (lines 77, 82, 87) but files live in `.agents/instructions/`. The `existsSync` check prints `⚠` for every instruction file. Out of scope for this plan (pre-existing, separate fix).
- **`sub-loop.ts` does not discover `mobile-desktop.instructions.md`** — no mapping exists. Out of scope.
- **Generic duplicates are isolated to `frontend/AGENTS.md`** — all other 28 layer AGENTS.md files contain only the Oxlint block as bloat; their remaining content is genuine layer-specific rules.

## Decisions (confirmed with user)

1. **Oxlint + ESLint/sonarjs rules home**: Move BOTH to a single canonical doc `docs/quality/linting-rules.md`. Root AGENTS.md and all layer AGENTS.md files get a one-line reference. Instructions files get a one-line reference.
2. **Propagation policy**: AGENTS.md and instructions files contain ONLY (a) layer-specific architectural rules, (b) decisions, (c) one-line references to docs/. NO implementation details (code examples, fix recipes, step-by-step patterns). Implementation details live exclusively in `docs/`.
3. **`frontend/AGENTS.md` scope**: Full cleanup — remove ALL generic duplicates (SonarQube Issue Management, AI Agent Communication Rules, Next.js comment, Scripts and Commands, Package Manager Configuration, Logging, SonarQube MCP duplicate, Code Quality Checks) + merge duplicate Mobile/Desktop sections + remove Oxlint block. Keep only genuine frontend rules.
4. **`sub-loop.ts` cheat sheet**: Leave as-is (lines 168-181). It's a stable quick-reference independent of AGENTS.md content.

## What stays in AGENTS.md (genuine layer rules — not touched)

Layer-specific architectural rules remain inline. Examples:
- `backend/db/repo/AGENTS.md`: append-only ledger pattern, FIFO selection, billing repo factory
- `shared/AGENTS.md`: layer isolation, import convention, i18n translation system rules
- `backend/graphql/AGENTS.md`: Pothos enum registration, single canonical object type
- `app/AGENTS.md`: server components, auth guards, cached request pattern
- `backend/types/AGENTS.md`: single canonical object type, types location rules
- `frontend/AGENTS.md` (after cleanup): Theme and Styling, Code Style, Commit Message, React & Next.js Patterns, MUI Breaking Changes, Dashboard UI Patterns, Mobile vs Desktop Isolation (merged), Duplication Elimination

## Tasks

### Phase 1: Create canonical linting rules doc

- [ ] 1.1 Create `docs/quality/` directory
- [ ] 1.2 Create `docs/quality/linting-rules.md` consolidating:
  - **Oxlint Rules section** (from root AGENTS.md lines 435-649): all rules with code examples — no-unsafe-type-assertion, no-await-in-loop, consistent-function-scoping, no-object-type-as-default-prop, no-underscore-dangle, no-unsafe-enum-comparison, no-shadow, consistent-return, no-map-spread, no-unnecessary-type-assertion, config overrides
  - **ESLint/sonarjs Rules section** (from root AGENTS.md lines 651-757): no-hardcoded-passwords, cognitive-complexity, no-nested-functions, void-use, different-types-comparison, no-new
  - Structure: `# Linting Rules` → intro paragraph (oxlint type-aware mode, NEVER oxlint-disable) → `## Oxlint Rules` (with `###` per rule) → `## ESLint/sonarjs Rules` (with `###` per rule) → `## Config Overrides`
  - This is the single source of truth for all lint fix recipes and code examples

### Phase 2: Replace Oxlint + ESLint blocks in root AGENTS.md

- [ ] 2.1 Delete the full "## Oxlint Rules (CRITICAL...)" section (lines 435-649) and "## ESLint/sonarjs Rules" section (lines 651-757) from root `AGENTS.md`
- [ ] 2.2 Replace with a new "## Linting Rules" section (placed where the Oxlint block was, after Important References):
  ```
  ## Linting Rules

  - **Oxlint & ESLint/sonarjs fix recipes**: See `docs/quality/linting-rules.md` for all lint rule patterns, code examples, and config overrides. NEVER add `oxlint-disable` comments — fix the root cause.
  ```
- [ ] 2.3 Add `docs/quality/linting-rules.md` to the "## Important References" section (after line 432, before the Oxlint block was):
  ```
  - `docs/quality/linting-rules.md` - Oxlint & ESLint/sonarjs lint rule fix recipes and config overrides
  ```

### Phase 3: Replace Oxlint block in all 28 layer AGENTS.md files

For each file, delete the "## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)" section (the full ~180-line block, from the `## Oxlint Rules` header through `### Config Overrides` and its content) and replace with:

```
## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.
```

Files to update (28 layer AGENTS.md files — `frontend/AGENTS.md` is handled in Phase 5 which includes this replacement):
- [ ] 3.1 `app/AGENTS.md`
- [ ] 3.2 `backend/AGENTS.md`
- [ ] 3.3 `backend/db/repo/AGENTS.md`
- [ ] 3.4 `backend/db/schema/AGENTS.md`
- [ ] 3.5 `backend/db/seeds/AGENTS.md`
- [ ] 3.6 `backend/db/test/AGENTS.md`
- [ ] 3.7 `backend/db/test/logic/AGENTS.md`
- [ ] 3.8 `backend/enum/AGENTS.md`
- [ ] 3.9 `backend/graphql/AGENTS.md`
- [ ] 3.10 `backend/graphql/mutation/AGENTS.md`
- [ ] 3.11 `backend/graphql/pothos/AGENTS.md`
- [ ] 3.12 `backend/graphql/query/AGENTS.md`
- [ ] 3.13 `backend/services/AGENTS.md`
- [ ] 3.14 `backend/types/AGENTS.md`
- [ ] 3.15 `frontend/common/components/ui/AGENTS.md`
- [ ] 3.16 `frontend/common/graphql/AGENTS.md`
- [ ] 3.17 `frontend/common/graphql/sharedDocuments/AGENTS.md`
- [ ] 3.18 `frontend/common/graphql/test/AGENTS.md`
- [ ] 3.19 `frontend/common/stores/AGENTS.md`
- [ ] 3.20 `frontend/common/views/AGENTS.md`
- [ ] 3.21 `frontend/desktop/AGENTS.md`
- [ ] 3.22 `frontend/mobile/AGENTS.md`
- [ ] 3.23 `frontend/views/AGENTS.md`
- [ ] 3.24 `scripts/run-test/AGENTS.md`
- [ ] 3.25 `shared/AGENTS.md`
- [ ] 3.26 `test/integration/AGENTS.md`
- [ ] 3.27 `test/ui/AGENTS.md`

### Phase 4: Replace Oxlint block in all 5 instructions files

For each instructions file, delete the "### Oxlint Rules (CRITICAL — NO `oxlint-disable` comments)" section (condensed ~11-line version) and replace with:

```
### Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.
```

- [ ] 4.1 `.agents/instructions/backend.instructions.md` (lines 196-206)
- [ ] 4.2 `.agents/instructions/frontend.instructions.md` (last section)
- [ ] 4.3 `.agents/instructions/tests.instructions.md` (lines 207-end)
- [ ] 4.4 `.agents/instructions/mobile-desktop.instructions.md` (lines 203-end)
- [ ] 4.5 `.agents/instructions/sonarqube_mcp.instructions.md` (lines 53-63)

### Phase 5: Full cleanup of `frontend/AGENTS.md`

This file has the most bloat. Remove generic duplicates and merge duplicate sections. The file currently has 455 lines; after cleanup it should be ~150-170 lines.

**Remove generic duplicates (not frontend-specific — already in root AGENTS.md or other files):**

⚠ **Order matters**: Deletions in this phase must be performed bottom-up (highest line number first) to avoid line-number drift, OR performed in a single editing pass. The line numbers below are from the original file and will shift as earlier sections are deleted.

- [ ] 5.1 Delete "## SonarQube Issue Management" section (lines 1-16) — generic quality workflow, duplicated from root
- [ ] 5.2 Delete "## AI Agent Communication Rules" section (lines 18-23) — verbatim duplicate of root AGENTS.md lines 370-375
- [ ] 5.3 Delete the `<!-- BEGIN:nextjs-agent-rules -->` comment block (lines 25-31) — duplicate of root lines 101-103
- [ ] 5.4 Delete "## Scripts and Commands" section (lines 33-48) — duplicates root "Essential Commands"
- [ ] 5.5 Delete "## Package Manager Configuration" section (lines 50-58) — generic Bun config
- [ ] 5.6 Delete "## Logging" section (lines 60-65) — duplicates root lines 104-108
- [ ] 5.7 Delete lines 67-116: the `---` separator, `## applyTo: "**/*"` frontmatter leak, and the entire SonarQube MCP duplicate block (Basic usage through Code Analysis Issues) — verbatim duplicate of `sonarqube_mcp.instructions.md:5-50`
- [ ] 5.8 Delete "## Code Quality Checks" section (lines 129-151) — duplicates root "Code Quality Workflow" (lines 181-188)

**Merge duplicate Mobile/Desktop sections:**
- [ ] 5.9 Merge the two "## Mobile vs Desktop Isolation" sections (lines 201-226 and 228-257) into one. The second (228-257) is more complete (has serialization safety, ESLint enforcement, cross-references). Merge unique content from the first (201-226) into the second: `createLazyView()` mention, `ResponsiveViewSwitch` wraps in `Suspense` + `ErrorBoundary`, "Metric cards are not imported by views" detail. Delete the first section, keep the merged second.

**Replace Oxlint block:**
- [ ] 5.10 Delete the "## Oxlint Rules (CRITICAL...)" section (lines 270-455) and replace with the one-line reference (same as Phase 3):
  ```
  ## Linting Rules

  - See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.
  ```

**Verify remaining content is genuine frontend rules:**
- [ ] 5.11 Confirm the file now contains only: Theme and Styling Rules, Code Style Rules, Commit Message Rules, React & Next.js Patterns, MUI Breaking Changes (v9+), Dashboard UI Patterns, Mobile vs Desktop Isolation (merged), Duplication Elimination via Scaffold Extraction, Linting Rules (reference)

### Phase 6: Update stale "Oxlint Rules" / "ESLint/sonarjs Rules" references across skills, scripts, and copilot-instructions

After removing the "Oxlint Rules" and "ESLint/sonarjs Rules" sections from AGENTS.md, all references telling agents to "See AGENTS.md 'Oxlint Rules' section" become stale — agents would look for a section that no longer exists. Update each to point to `docs/quality/linting-rules.md` instead.

**Skill files (5 files, 8 reference lines):**
- [ ] 6.1 `.agents/skills/fix-codescene/SUB_AGENT_PROMPT_TEMPLATE.md:64` — change `See AGENTS.md "Oxlint Rules" section for fix patterns per rule.` to `See \`docs/quality/linting-rules.md\` for fix patterns per rule.`
- [ ] 6.2 `.agents/skills/fix-codescene/SUB_AGENT_PROMPT_TEMPLATE.md:73` — change `See AGENTS.md "ESLint/sonarjs Rules" section for full patterns.` to `See \`docs/quality/linting-rules.md\` (ESLint/sonarjs section) for full patterns.`
- [ ] 6.3 `.agents/skills/fix/SKILL.md:55` — change `See AGENTS.md "Oxlint Rules" section.` to `See \`docs/quality/linting-rules.md\`.`
- [ ] 6.4 `.agents/skills/fix/SKILL.md:64` — change `See AGENTS.md "Oxlint Rules" section for per-rule fix patterns` to `See \`docs/quality/linting-rules.md\` for per-rule fix patterns`
- [ ] 6.5 `.agents/skills/fix-tests/SKILL.md:141` — change `See AGENTS.md "Oxlint Rules" section.` to `See \`docs/quality/linting-rules.md\`.`
- [ ] 6.6 `.agents/skills/quality-gate/SKILL.md:412` — change `See AGENTS.md "Oxlint Rules" section for fix patterns.` to `See \`docs/quality/linting-rules.md\` for fix patterns.`
- [ ] 6.7 `.agents/skills/quality-gate/SKILL.md:420` — change `refer them to the "Oxlint Rules" section in \`AGENTS.md\`` to `refer them to \`docs/quality/linting-rules.md\``
- [ ] 6.8 `.agents/skills/quality-loop/SKILL.md:36` — change `See the "Oxlint Rules" section in \`AGENTS.md\` for fix patterns per rule.` to `See \`docs/quality/linting-rules.md\` for fix patterns per rule.`

**Copilot instructions (1 file, 1 reference line):**
- [ ] 6.9 `.github/copilot-instructions.md:11` — change `See \`AGENTS.md\` "Oxlint Rules" and "ESLint/sonarjs Rules" sections for fix patterns.` to `See \`docs/quality/linting-rules.md\` for fix patterns.`

**Script files (2 files, 2 reference lines):**
- [ ] 6.10 `scripts/health/__shared__/sub-loop-types.ts:13` — change comment `(see AGENTS.md "Oxlint Rules")` to `(see \`docs/quality/linting-rules.md\`)`
- [ ] 6.11 `scripts/health/sub-loop.ts:168` — change console output `Oxlint Fix Patterns (see AGENTS.md for full details):` to `Oxlint Fix Patterns (see \`docs/quality/linting-rules.md\` for full details):`

### Phase 7: Update `spec-driven-development` skill propagation policy

- [ ] 7.1 In `.agents/skills/spec-driven-development/SKILL.md`, update the "### What Gets Updated" section (lines 513-522):
  - Change bullet 2 from "Update layer AGENTS.md files — add new rules, patterns, or references to the new doc using the pattern shown above" to: "Update layer AGENTS.md files — add ONLY layer-specific architectural rules and decisions (1-2 lines, no code). Add a one-line reference to the new doc. NEVER add implementation details, code examples, or fix recipes."
  - Change bullet 4 from "Update `.agents/instructions/<layer>.instructions.md` if the plan changed conventions that instruction files should enforce" to: "Update `.agents/instructions/<layer>.instructions.md` — add ONLY rules and decisions, never implementation details. Add a one-line reference to the new doc."
  - Change bullet 5 from "Update root `AGENTS.md` Important References section with the new doc" to: "Update root `AGENTS.md` Important References section with a one-line reference to the new doc only."
- [ ] 7.2 Update the "### Knowledge Propagation Task Template" (lines 525-536): replace "Update layer AGENTS.md files with new rules/patterns and reference to the new doc" with "Update layer AGENTS.md files with layer-specific rules/decisions (no implementation details) and a one-line doc reference"
- [ ] 7.3 Add a new "### AGENTS.md & Instructions Content Policy (CRITICAL)" block after the "### What Gets Updated" section:
  ```markdown
  ### AGENTS.md & Instructions Content Policy (CRITICAL)

  AGENTS.md files and `.agents/instructions/*.md` files MUST contain ONLY:
  1. **Layer-specific architectural rules** — constraints unique to that layer (e.g., "shared/ must never import from frontend/backend")
  2. **Decisions** — architectural choices and their rationale (1-2 lines, no code)
  3. **References** — one-line pointers to `docs/` for detailed patterns, code examples, and fix recipes

  AGENTS.md and instructions files MUST NOT contain:
  - Implementation details (code examples, fix recipes, step-by-step patterns)
  - Tool usage guides (e.g., SonarQube MCP server docs)
  - Duplicated content from other AGENTS.md files or instructions files
  - Command references (those live in root AGENTS.md "Essential Commands" only)
  - Generic workflow documentation (e.g., quality-gate lifecycle, SonarQube issue management)

  When propagating learnings from a plan:
  - Full patterns, code examples, and implementation details → `docs/<domain>/<topic>.md`
  - Layer rules and decisions → AGENTS.md / instructions (1-2 lines + doc reference)
  ```

### Phase 8: Verification

- [ ] 8.1 Verify no AGENTS.md file still contains the full Oxlint block: `grep -rl "no-unsafe-type-assertion (STRICT" AGENTS.md **/AGENTS.md` should return empty
- [ ] 8.2 Verify no instructions file still contains the Oxlint block: `grep -rl "no-unsafe-type-assertion" .agents/instructions/*.md` should return empty
- [ ] 8.3 Verify `docs/quality/linting-rules.md` exists and contains both `## Oxlint Rules` and `## ESLint/sonarjs Rules` sections
- [ ] 8.4 Verify `frontend/AGENTS.md` no longer contains: SonarQube MCP content, `applyTo` frontmatter leak, AI Agent Communication Rules, Scripts and Commands, Package Manager Configuration, Logging section, Code Quality Checks, Next.js comment block, duplicate Mobile/Desktop section
- [ ] 8.5 Verify `frontend/AGENTS.md` has exactly one "## Mobile vs Desktop Isolation" section (merged)
- [ ] 8.6 Verify `spec-driven-development/SKILL.md` contains the new "AGENTS.md & Instructions Content Policy (CRITICAL)" block
- [ ] 8.7 Line count check: `frontend/AGENTS.md` should be ~150-170 lines (down from 455). Each layer AGENTS.md file with Oxlint block should be ~180 lines smaller.
- [ ] 8.8 Verify root `AGENTS.md` "Important References" section includes `docs/quality/linting-rules.md`
- [ ] 8.9 Verify no stale "See AGENTS.md 'Oxlint Rules' section" references remain: `grep -rn "AGENTS.md.*Oxlint Rules\|\"Oxlint Rules\" section" .agents/skills/ .github/copilot-instructions.md scripts/health/` should return empty
- [ ] 8.10 Run `bun tsgo` to confirm no type errors (markdown + comment changes, but verifies nothing in TS code breaks)

## Risks

- **Agents lose inline lint rules in AGENTS.md**: Mitigated. `sub-loop.ts` carries its own hardcoded cheat sheet (lines 168-181) independent of AGENTS.md content. The canonical doc `docs/quality/linting-rules.md` is the full source of truth. Agents reading AGENTS.md see a one-line reference to the doc.
- **Stale "See AGENTS.md 'Oxlint Rules' section" references in skills/scripts**: 5 skill files, 1 copilot-instructions file, and 2 script files explicitly tell agents to read the "Oxlint Rules" / "ESLint/sonarjs Rules" sections in AGENTS.md. After cleanup those sections won't exist. Phase 6 updates all 8 files to point to `docs/quality/linting-rules.md` instead. If any reference is missed, agents following those skills will look for a non-existent section — verification step 8.9 catches this.
- **`sub-loop.ts` cheat sheet drift**: The script's hardcoded cheat sheet (lines 168-181) is now a third copy that could drift from `docs/quality/linting-rules.md`. Decision: leave as-is — it's a stable quick-reference, rarely changes, and the canonical doc is the authoritative source. The reference text on line 168 is updated to point to the canonical doc (task 6.11).
- **Existing plans in `.ai/plans/` and `.ai/finished_plans/` reference old inline Oxlint blocks**: Not blocking — plans are historical artifacts. New plans follow the updated skill.
- **`sonarqube_mcp.instructions.md` loses its Oxlint block**: This file is about SonarQube MCP tooling; the Oxlint block was always misplaced there. Replacing with a reference is correct.
- **`sub-loop.ts` pre-existing bug** (`.github/instructions/` vs `.agents/instructions/`): Out of scope. The instruction-file discovery is already broken; this plan doesn't make it worse.

## Out of Scope

- Fixing `sub-loop.ts` `.github/instructions/` → `.agents/instructions/` path bug (pre-existing, separate fix)
- Adding `mobile-desktop.instructions.md` discovery to `sub-loop.ts` (pre-existing gap)
- Refactoring `sub-loop.ts` to auto-discover `docs/` references (future enhancement)
- Cleaning bloat in other layer AGENTS.md files beyond the Oxlint block (none found — only `frontend/AGENTS.md` has generic duplicates)
- Updating existing `.ai/plans/` outcome files that reference old inline rules
- Condensing the merged Mobile/Desktop section in `frontend/AGENTS.md` to rules-only (it contains directory layout code blocks — a deeper cleanup for a future pass; this plan merges the duplicates but keeps the content as-is)
