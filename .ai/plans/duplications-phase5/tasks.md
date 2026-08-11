# Tasks: Code Duplication Elimination — Phase 5

**Feature:** Phase 5 — Frontend Triplication & Duplication Focus
**Version:** 1.0
**Date:** 2026-08-11

---

## Task Conventions

| Field | Description |
|-------|-------------|
| **ID** | `<phase>.<seq>` (e.g., 2.3) |
| **Layer** | Always frontend (views, common components, stores) or shared |
| **Sub-tasks** | QL = Quality Loop (sub-loop.ts), SR = Semantic Review, IV = Integration Verification |
| **Parallel** | ✓ = can run in parallel with siblings, ✗ = serial |
| **Effort** | S / M / L / XL (per cluster analysis) |

### Per-Task Verification Protocol

| Sub-task | Command / Action |
|----------|---------------------|
| QL | `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` |
| SR | Manual semantic review: compare desktop vs mobile vs common variant outputs. Verify behavior preserved. |
| IV | `bun check:duplicates` — verify cluster's clone count dropped to 0. Also `bun tsgo` for project-wide type check. |

### ⛔ No-Server-Tests Policy

The following commands are **PROHIBITED** in this plan. They require a Next.js server, GraphQL endpoint, or Playwright browser and exceed the plan's scope:

| Command | Why Prohibited |
|---------|---------------|
| `bun run test:ui:e2e` | Requires production Next.js server + Playwright browser |
| `bun run test:ui:components` | Requires Happy DOM + mocked Apollo (server-adjacent) |
| `bun run test:graphql` | Requires running dev server with GraphQL endpoint |
| `bun run test:ui` | Parent of all UI tests — includes server tests |
| `bun run test` | Parent of ALL tests — includes server tests |
| `bun run test:ui:static` | Requires Next.js build |
| `bun run build:test` | Builds production bundle for UI tests |
| `bun run test:db` | Database tests — not frontend scope |
| `bun run test:db:sequential` | Database tests — not frontend scope |
| `bun run test:services` | Service tests — not frontend scope |
| `bun run test:services:sequential` | Service tests — not frontend scope |
| `bun run test:integration` | Integration tests — not frontend scope |

**Allowed commands:**
- `bun tsgo` — TypeScript type check (read-only, no server)
- `bun run oxlint` — Oxlint linter (static analysis, no server)
- `bun biome:check` — Biome formatter/linter (static analysis, no server)
- `bun run lint` / `bun run scripts/lint-service.ts -f <file> --id verify` — ESLint (static analysis, no server)
- `bun lint:type-aware` — Type-aware ESLint with sonarjs rules (static analysis, no server)
- `bun check:duplicates` — jscpd duplicate scanner (static analysis, no server)
- `bun run codescene --file <path>` — CodeScene health check (static analysis, no server)
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — Full per-file verification loop (static analysis, no server)

### Applicable AGENTS.md Files (Per Task)

All tasks in this plan touch frontend files. The following AGENTS.md files are always applicable:

| File Path Pattern | AGENTS.md Files to Read |
|-------------------|------------------------|
| `frontend/views/**` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/common/components/**` | `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/common/views/**` | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/desktop/**` | `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/mobile/**` | `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/common/lib/**` (cross-layer) | `frontend/AGENTS.md`, `shared/AGENTS.md`, root `AGENTS.md` |
| `shared/lib/**` (cross-layer) | `shared/AGENTS.md`, root `AGENTS.md` |
| `shared/locale/**` (cross-layer) | `shared/AGENTS.md`, root `AGENTS.md` |

### Applicable Instruction Files (Per Task)

| File Path Pattern | Instruction File |
|-------------------|------------------|
| `frontend/**/*.ts(x)` | `.github/instructions/frontend.instructions.md` |
| `shared/**/*.ts` | (no instruction file — shared layer rules in `shared/AGENTS.md`) |

---

## Phase 0: Baseline & Plan Review (Serial)

### Task 0.1: Capture Baseline
**ID:** 0.1 | **Effort:** S | **Parallel:** ✗

Capture the current state of the codebase before any Phase 5 work.

**Steps:**
1. Run `bun tsgo` — save output to `/tmp/phase5-baseline-tsgo.txt`
2. Run `bun check:duplicates` — save output to `/tmp/phase5-baseline-jscpd.txt`
3. Run `bun biome:check` — save output to `/tmp/phase5-baseline-biome.txt`
4. Parse jscpd output to record: total clone count, frontend clone count, total duplicated tokens
5. Write outcome to `.ai/plans/duplications-phase5/outcome/0-baseline-outcome.md`

**Verification:**
- Baseline files exist in `/tmp/phase5-baseline-*.txt`
- Outcome file written with baseline metrics

---

### Task 0.2: Plan Review Gate
**ID:** 0.2 | **Effort:** S | **Parallel:** ✗

Invoke the `plan-review` skill on the Phase 5 plan.

**Steps:**
1. Invoke `/plan-review` skill targeting `.ai/plans/duplications-phase5/`
2. Address any violations found
3. Write review outcome to `.ai/plans/duplications-phase5/outcome/plan-review-R1.md`

**Verification:**
- Plan review passes (0 critical violations)
- Outcome file written

---

## Phase 1: Cross-Layer Consolidation (Serial)

These tasks consolidate cross-layer pairs where frontend duplicates shared-layer utilities. Per AGENTS.md, `shared/` is the canonical location for cross-layer utilities.

### Task 1.1: Consolidate `enum.ts` (Cross-Layer)
**ID:** 1.1 | **Effort:** M | **Parallel:** ✗

Consolidate `frontend/common/lib/enum.ts` (84 tokens duplicate) with `shared/lib/enum.ts`.

**Steps:**
1. Read both files. Determine if frontend version is a subset, superset, or divergent copy of shared version.
2. If frontend uses GraphQL codegen enum types: define equivalent native TypeScript enums in `shared/constants/{domain}.enum.ts` (per `shared/AGENTS.md` Shared Enums pattern) with matching string values. Do NOT import codegen types into `shared/` — `shared/` MUST NOT import from `@/frontend/**`. Then update frontend to import from `@/shared/constants/` for shared logic, keeping codegen enums for API-facing types only.
3. If frontend is a pure copy: delete `frontend/common/lib/enum.ts`, update all imports to use `@/shared/lib/enum`.
4. Find all imports of `frontend/common/lib/enum` — update to `@/shared/lib/enum`.
5. **QL:** `bun run scripts/health/sub-loop.ts shared/lib/enum.ts --lifecycle codescene`
6. **QL:** `bun run scripts/health/sub-loop.ts frontend/common/lib/enum.ts --lifecycle codescene` (if file still exists)
7. **IV:** `bun tsgo` — verify project-wide type check passes.
8. **IV:** `bun check:duplicates` — verify cross-layer pair eliminated.

**AGENTS.md to read:** `shared/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`
**Instruction file:** `.github/instructions/frontend.instructions.md` (if touching frontend files)

---

### Task 1.2: Consolidate `logger` (Cross-Layer)
**ID:** 1.2 | **Effort:** S | **Parallel:** ✗

Consolidate `frontend/common/lib/logger/index.ts` (79 tokens) with `shared/lib/logger/base-logger.ts`.

**Steps:**
1. Read both files. `shared/lib/logger/base-logger.ts` should be the canonical base. Frontend logger may add frontend-specific formatting or transports.
2. If frontend logger is a thin wrapper: ensure it imports from `@/shared/lib/logger/base-logger` and only adds frontend-specific concerns.
3. If frontend logger duplicates base logic: extract shared logic to `base-logger.ts`, update frontend to import and extend.
4. **QL:** `bun run scripts/health/sub-loop.ts shared/lib/logger/base-logger.ts --lifecycle codescene`
5. **QL:** `bun run scripts/health/sub-loop.ts frontend/common/lib/logger/index.ts --lifecycle codescene`
6. **IV:** `bun tsgo`
7. **IV:** `bun check:duplicates` — verify pair eliminated.

**AGENTS.md to read:** `shared/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md`

---

### Task 1.3: Evaluate Locale Type Pairs (Cross-Layer)
**ID:** 1.3 | **Effort:** S | **Parallel:** ✗

Evaluate the 4 locale type pairs (331 + 79 tokens) between `frontend` and `shared/locale/types/`.

**Steps:**
1. Run `bun check:duplicates` and identify the specific frontend↔shared locale pairs.
2. For each pair, determine if it's structural (by-design from i18n compile-time pattern) or accidental duplication.
3. If structural: document in `deferred-items.md` and add to jscpd ignore if needed.
4. If accidental: consolidate to `shared/locale/types/` and update frontend imports.
5. **IV:** `bun tsgo`
6. **IV:** `bun check:duplicates` — verify or document.

**AGENTS.md to read:** `shared/AGENTS.md`, root `AGENTS.md`

---

## Phase 2: P0 — Top 10 Clusters (Parallel Subagents)

Each task is dispatched as a background subagent (general-purpose). All 10 can run in parallel (pool size 16 max). Each subagent:
1. Reads applicable AGENTS.md + instruction files (listed in sub-loop output)
2. Creates `__shared__/` scaffolds or extends existing scaffolds
3. Converts desktop/mobile variants to thin wrappers
4. Runs `sub-loop.ts --lifecycle codescene` on every modified file
5. Reports results + any cross-file dependencies

### Task 2.1: permissions/components (45 pairs, 6,833 tokens, L)
**ID:** 2.1 | **Effort:** L | **Parallel:** ✓

**Target:** `frontend/common/views/dashboard/permissions/components/`
**Existing scaffolds:** `assignedUsersTabShared.tsx`, `assignGroupDialogShared.tsx` (in `components/`, not `__shared__/`)
**Action:** Create `__shared__/` directory. Migrate existing scaffolds to `__shared__/`. Create ~15 new `__shared__/` scaffolds for remaining duplicated components. Convert all desktop/mobile variants to thin wrappers importing from `__shared__/`.

**Key duplicated components (from cluster analysis):**
- Assigned users tab (extend existing `assignedUsersTabShared`)
- Assign group dialog (extend existing `assignGroupDialogShared`)
- Permission checkbox groups
- Role assignment forms
- Permission matrix table

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 45 pairs eliminated.
**SR:** Verify permission assignment behavior preserved across desktop and mobile.

---

### Task 2.2: classes/recurring/components (14 pairs, 2,064 tokens, M)
**ID:** 2.2 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/classes/recurring/components/`
**Existing scaffolds:** None
**Action:** Create `__shared__/` directory. Create ~6 scaffolds:
- `daysScheduleSectionShared.tsx`
- `dayScheduleRowShared.tsx`
- `durationInputShared.tsx`
- `recurringClassFormFieldsShared.tsx`
- `recurringClassFormShared.tsx`
- `recurringClassDialogShared.tsx`

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 14 pairs eliminated.
**SR:** Verify recurring class form behavior (day selection, time slots, duration) preserved.

---

### Task 2.3: ui/input/localizedString (13 pairs, 2,045 tokens, M)
**ID:** 2.3 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/components/ui/input/localizedString/`
**Existing scaffolds:** `localizedStringDrawerShared.tsx` (drawer only)
**Action:** Extend existing scaffold pattern. Create new scaffolds:
- `localizedStringInputShared.tsx` (input field component)
- `localizedStringFormFieldShared.tsx` (form field wrapper)

Convert all desktop/mobile/localizedString variants to thin wrappers.

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 13 pairs eliminated.
**SR:** Verify localized string input (multi-locale edit, drawer open/close, form submit) preserved.

---

### Task 2.4: reschedule/home/components (12 pairs, 1,726 tokens, M)
**ID:** 2.4 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/reschedule/home/components/`
**Existing scaffolds:** None
**Action:**
1. Identify byte-identical desktop/mobile pairs → delete one, re-export from other or move to common.
2. Create `__shared__/` scaffolds for structural-diff pairs (slot selection, time display, etc.).
3. Convert remaining desktop/mobile variants to thin wrappers.

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 12 pairs eliminated.
**SR:** Verify reschedule slot selection behavior preserved.

---

### Task 2.5: dashboard/resources/components (10 pairs, 1,670 tokens, M)
**ID:** 2.5 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/dashboard/resources/components/`
**Existing scaffolds:** None
**Action:** Create `__shared__/` directory. These pairs primarily differ in config objects (fontSize, padding). Use config-object slot pattern: `DESKTOP_OPTIONS` / `MOBILE_OPTIONS` consts passed to shared scaffold.

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 10 pairs eliminated.
**SR:** Verify resource display behavior preserved across breakpoints.

---

### Task 2.6: teachers/dashboard/components (8 pairs, 1,651 tokens, M)
**ID:** 2.6 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/teachers/dashboard/components/`
**Existing scaffolds:** `activationPolicyPanelShared.tsx` (exists but D/M variants are COPIES, not thin wrappers)
**Action:**
1. Convert `activationPolicyPanel` desktop/mobile variants to thin wrappers importing from existing `activationPolicyPanelShared`.
2. Create `__shared__/` directory (if scaffold isn't already there).
3. Create scaffolds for remaining 7 duplicated components.
4. Converting `activationPolicyPanel` to proper wrappers = ~704 token reduction alone.

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 8 pairs eliminated.
**SR:** Verify teacher activation policy panel behavior preserved.

---

### Task 2.7: dashboard/search-schedule/components (8 pairs, 1,584 tokens, M)
**ID:** 2.7 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/dashboard/search-schedule/components/`
**Existing scaffolds:** `teacherAvailabilityMonthDrawerShared.tsx`, `CalendarGridShared.tsx`
**Action:**
1. Extend `CalendarGridShared` to absorb nearly-identical calendar grid pairs.
2. Extend `teacherAvailabilityMonthDrawerShared` if needed.
3. Create new scaffolds for remaining duplicated components.
4. Convert desktop/mobile variants to thin wrappers.

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 8 pairs eliminated.
**SR:** Verify calendar grid display and teacher availability drawer behavior preserved.

---

### Task 2.8: dashboard/reports/components (11 pairs, 1,465 tokens, M)
**ID:** 2.8 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/dashboard/reports/components/`
**Existing scaffolds:** None
**Action:** Create `__shared__/` directory. Create ~4 scaffolds for the 11 duplicated components. Determine scaffold boundaries by grouping related components (report filters, report table, report summary, etc.).

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 11 pairs eliminated.
**SR:** Verify report display and filtering behavior preserved.

---

### Task 2.9: subjects/home/components (10 pairs, 1,545 tokens, M)
**ID:** 2.9 | **Effort:** M | **Parallel:** ✓

**Target:** `frontend/common/views/subjects/home/components/`
**Existing scaffolds:** `__shared__/` directory already exists with `subjectFormDialogShared`, `editCategoryDialogShared`, and form sub-components (`LabeledTextField.tsx`, `ActiveToggleField.tsx`, `CategorySelectField.tsx`, `EntityFormDialogActions.tsx`). This is the MODEL directory.
**Action:** Extend existing `__shared__/` scaffolds to cover create + edit × desktop + mobile variants. The existing scaffolds handle form dialogs — ensure all subject-related desktop/mobile pairs import from `__shared__/`.

**Per-file QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
**IV:** `bun check:duplicates` — verify cluster's 10 pairs eliminated.
**SR:** Verify subject form dialog (create, edit, delete) behavior preserved.

---

### Task 2.10: Verify Deprecated `frontend/views/dashboard` Path
**ID:** 2.10 | **Effort:** S | **Parallel:** ✓

**Target:** `frontend/views/dashboard/` (deprecated path)
**Action:** Verify this directory is empty or contains no active code. If jscpd reports 0 actual pairs from this path, mark as resolved in the outcome file. If files exist, determine if they're deprecated and can be deleted. **Note:** Per `frontend/views/AGENTS.md`, `frontend/views/dashboard/config/` (navigationConfig) is a known residual — do NOT delete it.

**IV:** `bun check:duplicates` — verify 0 pairs from this path.
**Outcome:** Document findings in `.ai/plans/duplications-phase5/outcome/2.10-deprecated-path-verification.md`

---

## Phase 3: P1 — Medium 20 Clusters (Parallel Subagents, 5 Waves)

Each task is a background subagent. Dispatch in waves of 3-4 (pool size 16 max).

### Task 3.1: ui/display/meetingConfig (9 pairs, 1,258 tokens, M)
Create/extend `MeetingConfigDisplayShared.tsx`. Approach depends on existing scaffolds — check if `__shared__/` exists.

### Task 3.2: ui/input/paymentMethodDefaultsEditor (8 pairs, 1,216 tokens, M)
Create new UI scaffold `PaymentMethodDefaultsEditorShared.tsx` with slot props for variant differences.

### Task 3.3: ui/input/timezoneSelect (5 pairs, 1,029 tokens, M)
Create new UI scaffold `TimezoneSelectShared.tsx`. Likely a simple select component with MUI Autocomplete.

### Task 3.4: dashboard/complaints/components (7 pairs, 995 tokens, M)
Create `__shared__/` directory with scaffolds for complaint list, complaint detail, complaint form components.

### Task 3.5: card/MetricCard/styled.tsx (4 pairs, 953 tokens, M)

Consolidate `styled.tsx` (styled components). These are MUI `styled()` factory calls — consolidate to single canonical styled component with config-object slots for visual diffs. **Verify MUI v9 `styled()` API — no direct style props, use `sx` in styled overrides per `frontend/AGENTS.md`.**

### Task 3.6: ui/input/meetingConfigTypeFields (7 pairs, 940 tokens, M)
Create new UI scaffold `MeetingConfigTypeFieldsShared.tsx` for form fields.

### Task 3.7: ui/input/meetingConfigSelect (5 pairs, 871 tokens, M)
Create new UI scaffold `MeetingConfigSelectShared.tsx`. Similar to `TimezoneSelectShared` — select component.

### Task 3.8: parent/dashboard/components (5 pairs, 819 tokens, M)
Create `__shared__/` directory with scaffolds for parent dashboard components.

### Task 3.9: ui/input/genderSelector (2 pairs, 808 tokens, S)
Create new UI scaffold `GenderSelectorShared.tsx`. Small component — likely a radio group or segmented control.

### Task 3.10: dashboard/suggestions/components (7 pairs, 777 tokens, M)
Create `__shared__/` directory with scaffolds for suggestion list, suggestion card, suggestion form.

### Task 3.11: ui/display/paymentMethod (3 pairs, 749 tokens, S)
Check if `PaymentMethodDisplayShared` exists. If yes, extend it. If no, create new scaffold.

### Task 3.12: dashboard/students/quota (8 pairs, 695 tokens, M)
Create `__shared__/` directory with scaffolds for quota display, quota edit, quota history.

### Task 3.13: teachers/reassignment/components (4 pairs, 691 tokens, M)
Create `__shared__/` directory with scaffolds for reassignment form, reassignment dialog.

### Task 3.14: billing/manual/components (5 pairs, 631 tokens, M)
Create `__shared__/` directory with scaffolds for manual billing form, manual billing list.

### Task 3.15: ui/input/languageSelector (3 pairs, 631 tokens, S)
Create new UI scaffold `LanguageSelectorShared.tsx`. Similar to timezone select.

### Task 3.16: ui/input/paymentMethodSelect (4 pairs, 630 tokens, S)
Create new UI scaffold `PaymentMethodSelectShared.tsx`. Similar to meeting config select.

### Task 3.17: input/currencySelect/currencyAutocompletePopper.ts (3 pairs, 638 tokens, S)
Consolidate `currencyAutocompletePopper.ts` — Autocomplete popper component. Move to common or create scaffold.

### Task 3.18: components/ui/input (7 pairs, 807 tokens, M)
Batch of misc UI input components. Create scaffolds for each duplicated component pair.

### Task 3.19: ui/input/paymentMethodTypeFields (2 pairs, 800 tokens, S)
Create new UI scaffold `PaymentMethodTypeFieldsShared.tsx` for form fields.

### Task 3.20: frontend root (7 pairs, 688 tokens, M)
Frontend root-level component pairs. Investigate and consolidate.

**Per-task verification (all Phase 3 tasks):**
- **QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
- **IV:** `bun check:duplicates` — verify cluster's pairs eliminated.

---

## Phase 4: P2 — Single-Pair Clusters (Parallel Subagents, Batched by Domain)

49 clusters with 1 pair each (6,242 tokens total). Batch by parent domain to amortize context-switch cost. Each batch is a single subagent that handles ~15 pairs.

### Task 4.1: UI Component Single-Pair Batch (~15 pairs)
**ID:** 4.1 | **Effort:** M | **Parallel:** ✓

Handle all single-pair clusters in `frontend/common/components/ui/` directory. For each pair:
1. Determine if byte-identical (delete one, re-export) or structural (create scaffold).
2. Apply appropriate pattern.
3. Run sub-loop on each modified file.

### Task 4.2: Dashboard View Single-Pair Batch (~20 pairs)
**ID:** 4.2 | **Effort:** M | **Parallel:** ✓

Handle all single-pair clusters in `frontend/common/views/dashboard/` (and sub-domains). Same approach as 4.1.

### Task 4.3: Remaining Single-Pair Batch (~14 pairs)
**ID:** 4.3 | **Effort:** M | **Parallel:** ✓

Handle all remaining single-pair clusters not covered by 4.1 or 4.2. Same approach.

**Per-batch verification:**
- **QL:** `bun run scripts/health/sub-loop.ts <each-modified-file> --lifecycle codescene`
- **IV:** `bun check:duplicates` — verify batch's pairs eliminated.

---

## Phase 5: Review Gates (Serial)

### Task 5.1: Mid-Point Review
**ID:** 5.1 | **Effort:** S | **Parallel:** ✗

After Phase 2 (P0 clusters) completes, perform mid-point review.

**Steps:**
1. Run `bun check:duplicates` — compare against baseline. Verify ≥10,000 tokens eliminated (P0 target = ~22,648 tokens).
2. Run `bun tsgo` — verify project-wide type check passes.
3. Run `bun run oxlint` — verify no new oxlint violations.
4. Invoke `/plan-review` skill targeting `.ai/plans/duplications-phase5/` — verify no plan violations from implementation.
5. Write outcome to `.ai/plans/duplications-phase5/outcome/5.1-midpoint-review.md`

**Verification:**
- jscpd count dropped significantly from baseline
- tsgo clean
- oxlint clean

---

### Task 5.2: Post-Implementation Review
**ID:** 5.2 | **Effort:** S | **Parallel:** ✗

After all Phases 1-4 complete, perform comprehensive post-implementation review.

**Steps:**
1. Run `bun check:duplicates` — verify ≥250 of 470 frontend pairs eliminated (Goal G1).
2. Run `bun tsgo` — verify project-wide type check passes.
3. Run `bun run oxlint` — verify clean.
4. Run `bun biome:check` — verify clean.
5. Run `bun run lint` — verify clean.
6. Run `bun run scripts/lint-service.ts -f <changed-file> --id verify` on a sample of changed files.
7. Invoke `/plan-review` skill — final review of plan compliance.
8. Write outcome to `.ai/plans/duplications-phase5/outcome/5.2-post-implementation-review.md`

**Verification:**
- Goal G1: ≥250 frontend pairs eliminated
- Goal G2: ≤300 total clones project-wide
- All quality gates pass

---

### Task 5.3: Final Quality Gate
**ID:** 5.3 | **Effort:** M | **Parallel:** ✗

Run `bun quality-gate:fresh` and resolve any issues.

**Steps:**
1. Run `bun quality-gate:fresh`
2. If any stage fails, follow the quality-gate skill's remediation workflow (dispatch parallel subagents per failing file).
3. Re-run until all stages pass.
4. Write final outcome to `.ai/plans/duplications-phase5/outcome/5.3-final-quality-gate.md`

**Verification:**
- `✨✨ ALL QUALITY GATES PASSED! ✨✨`
- jscpd count ≤ 300 total clones

---

## Phase 6: Knowledge Propagation (Serial)

### Task 6.1: Update Scaffold Pattern Documentation
**ID:** 6.1 | **Effort:** S | **Parallel:** ✗

Update `docs/frontend/ui-shared-scaffold-pattern.md` with Phase 5 rollout summary.

**Steps:**
1. Add a "Phase 5 Rollout" section documenting:
   - Number of new scaffolds created
   - Number of existing scaffolds extended
   - Total tokens eliminated
   - Total clone pairs eliminated
   - Notable patterns discovered (config-object slots, render function slots, etc.)
2. Update the scaffold inventory table if one exists.

---

### Task 6.2: Update AGENTS.md (If Needed)
**ID:** 6.2 | **Effort:** S | **Parallel:** ✗

Update `frontend/AGENTS.md` if any new conventions were established during Phase 5.

**Steps:**
1. Review all new `__shared__/` directories created.
2. If new placement conventions were established (e.g., a new pattern for edge cases), document them.
3. If no new conventions: mark as done, no update needed.

---

### Task 6.3: Resolve Deferred Items
**ID:** 6.3 | **Effort:** S | **Parallel:** ✗

Finalize `deferred-items.md` with any items that could not be resolved during Phase 5.

**Steps:**
1. Review all deferred items. Update status (resolved, still deferred, or promoted to future phase).
2. For any single-pair clusters not addressed in Phase 4: add to deferred items with rationale (token count too low, structural duplication, etc.).
3. If remaining jscpd count ≤ 300, document success. If > 300, recommend Phase 6 extension.

---

## Summary

| Phase | Tasks | Effort | Parallelism |
|-------|-------|--------|-------------|
| Phase 0: Baseline & Review | 2 | S | Serial |
| Phase 1: Cross-Layer | 3 | S-M | Serial |
| Phase 2: P0 Top 10 | 10 | M-L | 10 parallel subagents |
| Phase 3: P1 Medium 20 | 20 | M | 5 waves × 4 subagents |
| Phase 4: P2 Single-Pair | 3 batches | M | 3 parallel subagents |
| Phase 5: Review Gates | 3 | S-M | Serial |
| Phase 6: Knowledge Propagation | 3 | S | Serial |
| **Total** | **44 tasks** | | |

### Expected Outcome

| Metric | Baseline | Target | Reduction |
|--------|----------|--------|-----------|
| Frontend clone pairs | 470 | ≤170 | ≥64% |
| Total project clones | ~522 | ≤300 | ≥43% |
| Frontend duplicated tokens | ~64,932 | ~20,000 | ~69% |
| Cross-layer pairs | 6 | 0-3 | ≥50% |
