# Tasks: Code Duplication Elimination — Phase 7

**Feature:** Phase 7 — Within-File Clones, Cross-Layer Utilities & Residual Sweep
**Version:** 1.0
**Date:** 2026-08-11

---

## Execution Protocol

### ⛔ No-Server-Tests Policy (CRITICAL)

**NEVER run any of these** (any task/subtask that references them is ~~struck through~~ and marked SKIPPED):

| Command | Reason | Status |
|---------|--------|--------|
| `bun run test:graphql` | Requires Next.js dev server | ❌ NEVER |
| `bun run test:ui:components` | UI component tests (Happy DOM) | ❌ NEVER |
| `bun run test:ui:e2e` | E2E — requires Next.js production server | ❌ NEVER |
| `bun run test:ui` | All UI tests | ❌ NEVER |
| `bun run build:test` / `build` | Next.js server build | ❌ NEVER |
| `bun run test:db` / `:sequential` | May require server connection | ❌ NEVER |
| `bun run test:services` / `:sequential` | May require server connection | ❌ NEVER |
| `bun run test:integration` / `:live-fx` / `:live-comm` | Requires external server | ❌ NEVER |
| `bun run test` (meta) | Runs ALL tests — includes server-required | ❌ NEVER |
| `bun run scripts/run-test/run-test.ts <path>` | May touch server-required tests | ❌ NEVER |

**Allowed commands** (read-only / no server):
- `bun tsgo`
- `bun biome:check` / `bun biome:check --write`
- `bun run oxlint`
- `bun run lint` / `bun run scripts/lint-service.ts -f <file> --id verify` / `bun run scripts/lint-service.ts --type-aware --fix`
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
- `bun run scripts/health/sub-loop-uncommitted.ts --lifecycle codescene`
- `bun check:duplicates` (jscpd — read-only)
- `bun quality-gate` / `bun quality-gate:fresh` (read-only)

### Per-File Mandatory Subtasks

Each implementation subtask includes:
- **QL**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
- **SR**: 12-point semantic checklist (atomicity, module-level state, env-config registration, reset invalidation, empty-string credentials, dead branches, cross-layer imports, enum value imports, schema migrations, deferred items, i18n compliance, circular-dep check)
- **IV**: read instruction files + AGENTS.md listed by sub-loop.ts discovery output
- Sequence: QL → SR → IV → orchestrator marks `[x]`

### Layer-to-AGENTS.md / Instruction Mapping

| File Path Prefix | AGENTS.md | Instruction Files |
|---|---|---|
| Root | `AGENTS.md` | — |
| `frontend/` | `AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `frontend/views/` | `AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | `frontend.instructions.md` |
| `backend/` | `AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `backend/graphql/` | `AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/AGENTS.md` | `backend.instructions.md` |
| `shared/` | `AGENTS.md`, `shared/AGENTS.md` | — |
| `shared/locale/` | `AGENTS.md`, `shared/AGENTS.md` | — |

---

## Phase 0: Baseline & Triage

- [ ] 0.1 Establish error baseline
  - Run `bun tsgo 2>&1 | tee /tmp/phase7-baseline-tsgo.txt`
  - Run `bun biome:check 2>&1 | tee /tmp/phase7-baseline-biome.txt`
  - Run `bun run scripts/lint-service.ts --json --id phase7-baseline 2>&1 | tee /tmp/phase7-baseline-lint.json`
  - Run `bun check:duplicates 2>&1 | tee /tmp/phase7-baseline-jscpd.txt`
  - Run `bun run scripts/health/sub-loop-uncommitted.ts --lifecycle codescene 2>&1 | tee /tmp/phase7-baseline-subloop.txt`
  - Confirm: jscpd reports 504 clones, 68,194 tokens
  - Write outcome: `.ai/plans/duplications-phase7/outcome/0-baseline-outcome.md`

- [ ] 0.2 Verify shared/locale jscpd-ignore status
  - Check `.jscpd.json` for `shared/locale/**` in ignore patterns
  - If present: 7 shared/locale within-file pairs are auto-suppressed → document in outcome
  - If absent: these pairs need individual evaluation in Phase 3
  - Write outcome: `.ai/plans/duplications-phase7/outcome/0.2-locale-ignore-status.md`

---

## Phase 1: Backend Within-File Clones (3 pairs, 232 tokens)

**Goal:** Extract local helper functions for repeating field blocks in backend GraphQL files.
**Approach:** Each file gets a local `_*Fields(t, ...)` or `_<action>Fields(t, ...)` helper function at module scope.
**Risk:** Low — same-file extraction, no import changes.

- [ ] 1.1 Fix `backend/graphql/mutation/billing/payment-method.mutation.ts` (75 tokens)
  - Read lines 150-160 and 165-175 — identify the repeating mutation field block
  - Extract local helper function `makePaymentMethodMutationFields(t, ...)` or inline builder at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Evaluate if existing `__shared__/` field factory pattern (per `backend/graphql/AGENTS.md` "Pothos Field Factories") is more appropriate; if so, extend the shared factory instead
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/billing/payment-method.mutation.ts --lifecycle codescene`
  - SR / IV as per backend/graphql layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/1.1-payment-method-mutation-outcome.md`
  - _Requirements: AC-2, AC-5_

- [ ] 1.2 Fix `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts` (77 tokens)
  - Read lines 26-35 and 44-53 — identify the repeating Pothos field block
  - Extract local helper `makeRecurringScheduleFields(t, ...)` at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Evaluate if `__shared__/` field factory pattern is more appropriate
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts --lifecycle codescene`
  - SR / IV as per backend/graphql layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/1.2-recurring-schedule-pothos-outcome.md`
  - _Requirements: AC-2, AC-5_

- [ ] 1.3 Fix `backend/graphql/query/scheduling/schedule.query.ts` (80 tokens)
  - Read lines 162-171 and 193-202 — identify the repeating query resolver block
  - Extract local helper `makeScheduleQueryFields(t, ...)` at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Evaluate if `__shared__/` field factory pattern is more appropriate
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts backend/graphql/query/scheduling/schedule.query.ts --lifecycle codescene`
  - SR / IV as per backend/graphql layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/1.3-schedule-query-outcome.md`
  - _Requirements: AC-2, AC-5_

---

## Phase 2: Frontend Within-File Clones (7 pairs, 1,083 tokens)

**Goal:** Extract local helpers, components, or config factories for within-file frontend duplication.
**Approach:** Varies by file — local component extraction for `.tsx`, factory function for config, shared interface for types.
**Risk:** Medium — some files are large (navigationConfig.ts: 1,108 lines, InvoicePaymentDetailsDialog.tsx: 893 lines). Visual review required.

- [ ] 2.1 Fix `frontend/common/views/dashboard/config/navigationConfig.ts` (342 tokens — 2 clone pairs)
  - Read lines 157-185 ↔ 578-606 (102 tokens) and 253-318 ↔ 727-792 (240 tokens)
  - Identify repeating nav config blocks
  - Extract `makeNavConfig(params)` factory that generates each nav section from parameters (icon, labelKey, href, children)
  - Both/nav sections use the factory
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
  - SR: Verify no visual change to navigation rendering (parametric factory must produce identical configs)
  - IV: Read `frontend.instructions.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.1-navigation-config-outcome.md`
  - _Requirements: AC-2, AC-6_

- [ ] 2.2 Fix `frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts` (164 tokens)
  - Read lines 104-127 ↔ 199-222 — repeating label lookup blocks
  - Extract local `makeDomainLabelLookup(record)` helper at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts --lifecycle codescene`
  - SR / IV as per frontend/views layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.2-class-details-labels-outcome.md`
  - _Requirements: AC-2, AC-6_

- [ ] 2.3 Fix `frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx` (142 tokens)
  - Read lines 194-218 ↔ 399-423 — repeating payment detail sections
  - Extract local presentational component `<PaymentDetailSection .../>` within the file
  - Both sections render the component with different props
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx --lifecycle codescene`
  - SR: Visual review — verify both payment detail sections render identically
  - IV: Read `frontend.instructions.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.3-invoice-payment-details-outcome.md`
  - _Requirements: AC-2, AC-6_

- [ ] 2.4 Fix `frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile.tsx` (83 tokens)
  - Read lines 22-42 ↔ 63-83 — repeating helper card components
  - Extract local presentational component `<ContextualHelperCard .../>` within the file
  - Both sections render the component
  - QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile.tsx --lifecycle codescene`
  - SR / IV as per frontend/views layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.4-contextual-helper-cards-outcome.md`
  - _Requirements: AC-2, AC-6_

- [ ] 2.5 Fix `frontend/common/views/dashboard/admin/parents/students/types.ts` (76 tokens)
  - Read lines 34-47 ↔ 54-67 — repeating type definitions
  - Extract shared `interface` at module scope
  - Both sections use the shared type
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/admin/parents/students/types.ts --lifecycle codescene`
  - SR / IV as per frontend layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.5-admin-parents-students-types-outcome.md`
  - _Requirements: AC-2, AC-6_

- [ ] 2.6 Fix `frontend/common/views/dashboard/resources/types/resourcesTypes.ts` (76 tokens)
  - Read lines 75-87 ↔ 87-99 — repeating type definitions
  - Extract shared `interface` at module scope
  - Both sections use the shared type
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/resources/types/resourcesTypes.ts --lifecycle codescene`
  - SR / IV as per frontend layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.6-resources-types-outcome.md`
  - _Requirements: AC-2, AC-6_

---

## Phase 3: shared/locale Within-File Clones (7 pairs, 700 tokens)

**Goal:** Determine if shared/locale within-file clones are auto-suppressed by Phase 6's `.jscpd.json` ignore or need individual evaluation.
**Approach:** Verify Phase 6 Task 1.1 status first. If already suppressed, document and close. If not, evaluate each pair.
**Risk:** Low — shared/locale is the compile-time i18n system. No code changes unless a pair is clearly fixable.

- [ ] 3.1 Verify and document shared/locale jscpd-ignore status
  - Check if `.jscpd.json` includes `shared/locale/**` in ignore patterns (Phase 6 Task 1.1)
  - If YES: Run `bun check:duplicates` and verify 0 clones from `shared/locale/**` — document in outcome
  - If NO: Add `shared/locale/**` to `.jscpd.json` ignore patterns (implements Phase 6 Task 1.1 if not done)
  - QL: `bun check:duplicates` (verify locale clones = 0)
  - Outcome: `.ai/plans/duplications-phase7/outcome/3.1-locale-ignore-outcome.md`
  - _Requirements: AC-7_

- [ ] 3.2 (CONDITIONAL — only if Task 3.1 shows shared/locale NOT ignored and individual evaluation needed)
  - Evaluate each of 7 shared/locale within-file pairs:
    - `shared/locale/types/errors/index.ts` (189 tokens, 2 pairs) — repeating error type signatures
    - `shared/locale/ar/errors/index.ts` (204 tokens, 2 pairs) — repeating Arabic error translations
    - `shared/locale/en/errors/index.ts` (229 tokens, 2 pairs) — repeating English error translations
    - `shared/locale/types/dashboard/parents/onboarding.ts` (78 tokens, 1 pair) — repeating onboarding type signatures
  - For each: "fix" (local extraction) or "ignore" (jscpd:ignore directive)
  - QL per modified file
  - Outcome: `.ai/plans/duplications-phase7/outcome/3.2-locale-within-file-outcome.md`
  - _Requirements: AC-7_

---

## Phase 4: Cross-Layer Utility Dedup (2 pairs, 163 tokens)

**Goal:** Evaluate and resolve the 2 frontend↔shared cross-layer utility duplication pairs.
**Approach:** Architectural evaluation — determine if consolidation is possible or if jscpd-ignore is the correct approach.
**Risk:** Medium — cross-layer consolidation affects import chains. Prefer jscpd-ignore for architecturally intentional duplication.

- [ ] 4.1 Evaluate `frontend/common/lib/enum.ts` ↔ `shared/lib/enum.ts` (84 tokens)
  - Analyze both files' type sources and runtime dependencies
  - Determine: Can frontend import from `shared/lib/enum` without creating a `shared → frontend/common/graphql/generated` dependency?
  - If YES: Consolidate — repoint frontend-specific enums, keep shared canonical
  - If NO: Add `// jscpd:ignore-start` / `// jscpd:ignore-end` around duplicated parsing functions with architectural rationale comment
  - Update `deferred-items.md` with the decision
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/lib/enum.ts --lifecycle codescene` and same for `shared/lib/enum.ts`
  - IV: Read `frontend/AGENTS.md`, `shared/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/4.1-enum-cross-layer-outcome.md`
  - _Requirements: AC-4_

- [ ] 4.2 Evaluate `frontend/common/lib/logger/index.ts` ↔ `shared/lib/logger/base-logger.ts` (79 tokens)
  - Analyze both files' runtime dependencies (browser vs Node.js `fs/promises`)
  - Determine: Can `ClientLogger extends BaseLogger`? (likely NO due to `node:fs/promises` import in `BaseLogger`)
  - If YES: Inheritance refactor
  - If NO: Evaluate if the overlap is only in pure config logic (e.g., `isLoggingEnabled(env, flag)`) → extract to `shared/lib/logger/config.ts`
  - If neither works: Add `// jscpd:ignore` directive with architectural rationale (browser vs Node.js runtime)
  - Update `deferred-items.md` with the decision
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/lib/logger/index.ts --lifecycle codescene` and same for `shared/lib/logger/base-logger.ts`
  - IV: Read `frontend/AGENTS.md`, `shared/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/4.2-logger-cross-layer-outcome.md`
  - _Requirements: AC-4_

---

## Phase 5: Unfixable Pair Triage (D6-2 carry-forward)

**Goal:** Triage pairs that Phase 6 deferred as "unfixable non-structural" (D6-2 → "Phase 7+ or never").
**Approach:** Each pair gets either a `// jscpd:ignore` directive with "low-value" rationale or a permanent deferral entry in `deferred-items.md`.

- [ ] 5.1 Identify D6-2 pairs
  - After Phase 6 implementation (or if Phase 6 is not yet implemented, identify from the current 504 baseline)
  - Filter: pairs that are neither "fixable" (too small to scaffold) nor "structural" (not by-design)
  - These are typically ≤50 token pairs that are coincidental similarity, not pattern duplication
  - Write to `/tmp/phase7-d6-2-pairs.txt`
  - Outcome: `.ai/plans/duplications-phase7/outcome/5.1-d6-2-identification-outcome.md`

- [ ] 5.2 Triage D6-2 pairs
  - For each pair: add `// jscpd:ignore` directive with comment "Low-value duplication — coincidental similarity, not pattern duplication. jscpd:ignore per Phase 7 triage."
  - OR: document in `deferred-items.md` as "permanently deferred" with pair details
  - QL per modified file
  - Outcome: `.ai/plans/duplications-phase7/outcome/5.2-d6-2-triage-outcome.md`
  - _Requirements: AC-9_

---

## Phase 6: Post-Implementation Residual Sweep (D6-1 carry-forward)

**Goal:** Final jscpd sweep after all phases (4, 5, 6, 7) are complete. Triage any remaining unaddressed clones.
**Condition:** This phase can only run if Phases 4, 5, and 6 are complete. If they are still in progress, document the current state and defer.

- [ ] 6.1 Check phase completion status
  - Check if Phase 4 (backend/shared/app/scripts) is complete — look for outcome files in `.ai/plans/duplications-phase4/outcome/`
  - Check if Phase 5 (frontend↔frontend P0-P2) is complete — look for outcome files in `.ai/plans/duplications-phase5/outcome/`
  - Check if Phase 6 (P3 micro clusters + locale ignore) is complete — look for outcome files in `.ai/plans/duplications-phase6/outcome/`
  - If ALL complete: proceed to Task 6.2
  - If ANY incomplete: document current state in outcome, defer Task 6.2 to post-implementation
  - Outcome: `.ai/plans/duplications-phase7/outcome/6.1-phase-completion-status.md`

- [ ] 6.2 (CONDITIONAL — only if all prior phases complete) Run residual sweep
  - Run `bun check:duplicates 2>&1 | tee /tmp/phase7-residual-jscpd.txt`
  - Compare to baseline (504 clones, 68,194 tokens)
  - Identify any remaining unaddressed clones
  - Triage each into:
    - "fix" → create a follow-up task in this phase or defer to Phase 8
    - "ignore" → add jscpd:ignore directive
    - "defer" → document in `deferred-items.md`
  - Write final outcome: `.ai/plans/duplications-phase7/outcome/6.2-residual-sweep-outcome.md`
  - _Requirements: AC-8_

---

## Phase 7: Knowledge Propagation

- [ ] 7.1 Update `docs/frontend/duplication-elimination-patterns.md`
  - Add "Within-File Clone Extraction" pattern section:
    - When to use (same-file duplication)
    - How to implement (local helper / component / factory within the file)
    - When to use jscpd:ignore instead (structural duplication within a file)
  - Add "Cross-Layer Utility Alignment" pattern section:
    - When consolidation is possible (same runtime, aligned types)
    - When jscpd-ignore is the correct approach (different runtimes, browser vs Node.js)
    - Example: logger (browser ClientLogger vs Node.js BaseLogger)
  - QL: `bun run scripts/health/sub-loop.ts docs/frontend/duplication-elimination-patterns.md --lifecycle codescene` (if applicable to docs)
  - Outcome: `.ai/plans/duplications-phase7/outcome/7.1-knowledge-propagation-outcome.md`
  - _Requirements: AC-12_

---

## Phase 8: Plan Review

- [ ] 8.1 Invoke `@plan-review` skill on this plan
  - Read the plan
  - Map file paths to AGENTS.md layers
  - Check compliance (type imports, service boundaries, MUI v9, i18n, logging, test conventions, GraphQL documents)
  - Fix any violations
  - Outcome: `.ai/plans/duplications-phase7/outcome/8.1-plan-review-outcome.md`
  - _Requirements: AC-11_

---

## Summary

| Phase | Tasks | Pairs Addressed | Tokens | New Files |
|-------|-------|----------------|--------|-----------|
| 0 | 2 | 0 (triage) | 0 | 2 outcome files |
| 1 | 3 | 3 (backend within-file) | 232 | 3 outcome files |
| 2 | 6 | 7 (frontend within-file) | 1,083 | 6 outcome files |
| 3 | 1-2 | 7 (shared/locale within-file) | 700 | 1-2 outcome files |
| 4 | 2 | 2 (cross-layer utilities) | 163 | 2 outcome files |
| 5 | 2 | TBD (D6-2 triage) | TBD | 2 outcome files |
| 6 | 1-2 | TBD (residual sweep) | TBD | 1-2 outcome files |
| 7 | 1 | 0 (docs) | 0 | 1 outcome file |
| 8 | 1 | 0 (review) | 0 | 1 outcome file |
| **Total** | **19-21** | **19+ TBD** | **2,178+ TBD** | **19-21 outcome files** |
