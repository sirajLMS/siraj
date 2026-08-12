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

- [x] 0.1 Establish error baseline
  - Run `bun tsgo 2>&1 | tee /tmp/phase7-baseline-tsgo.txt`
  - Run `bun biome:check 2>&1 | tee /tmp/phase7-baseline-biome.txt`
  - Run `bun run scripts/lint-service.ts --json --id phase7-baseline 2>&1 | tee /tmp/phase7-baseline-lint.json`
  - Run `bun check:duplicates 2>&1 | tee /tmp/phase7-baseline-jscpd.txt`
  - Run `bun run scripts/health/sub-loop-uncommitted.ts --lifecycle codescene 2>&1 | tee /tmp/phase7-baseline-subloop.txt`
  - Confirm: jscpd reports 504 clones, 68,194 tokens
  - Write outcome: `.ai/plans/duplications-phase7/outcome/0-baseline-outcome.md`

- [x] 0.2 Verify shared/locale duplicate status
  - Check `.jscpd.json` for `shared/locale/**` in ignore patterns
  - Confirmed: `.jscpd.json` does NOT include `shared/locale/**` in ignore patterns
  - All 7 shared/locale within-file pairs need individual fixing in Phase 3
  - Write outcome: `.ai/plans/duplications-phase7/outcome/0.2-locale-ignore-status.md`

---

## Phase 1: Backend Within-File Clones (3 pairs, 232 tokens)

**Goal:** Extract local helper functions for repeating field blocks in backend GraphQL files.
**Approach:** Each file gets a local `_*Fields(t, ...)` or `_<action>Fields(t, ...)` helper function at module scope.
**Risk:** Low — same-file extraction, no import changes.

- [x] 1.1 Fix `backend/graphql/mutation/billing/payment-method.mutation.ts` (75 tokens)
  - Read lines 150-160 and 165-175 — identify the repeating mutation field block
  - Extract local helper function `makePaymentMethodMutationFields(t, ...)` or inline builder at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Evaluate if existing `__shared__/` field factory pattern (per `backend/graphql/AGENTS.md` "Pothos Field Factories") is more appropriate; if so, extend the shared factory instead
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts backend/graphql/mutation/billing/payment-method.mutation.ts --lifecycle codescene`
  - SR / IV as per backend/graphql layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/1.1-payment-method-mutation-outcome.md`
  - _Requirements: AC-2, AC-5_

- [x] 1.2 Fix `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts` (77 tokens)
  - Read lines 26-35 and 44-53 — identify the repeating Pothos field block
  - Extract local helper `makeRecurringScheduleFields(t, ...)` at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Evaluate if `__shared__/` field factory pattern is more appropriate
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts --lifecycle codescene`
  - SR / IV as per backend/graphql layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/1.2-recurring-schedule-pothos-outcome.md`
  - _Requirements: AC-2, AC-5_

- [x] 1.3 Fix `backend/graphql/query/scheduling/schedule.query.ts` (80 tokens)
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

- [x] 2.1 Fix `frontend/common/views/dashboard/config/navigationConfig.ts` (342 tokens — 2 clone pairs)
  - Read lines 157-185 ↔ 578-606 (102 tokens) and 253-318 ↔ 727-792 (240 tokens)
  - Identify repeating nav config blocks
  - Extract `makeNavConfig(params)` factory that generates each nav section from parameters (icon, labelKey, href, children)
  - Both/nav sections use the factory
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/config/navigationConfig.ts --lifecycle codescene`
  - SR: Verify no visual change to navigation rendering (parametric factory must produce identical configs)
  - IV: Read `frontend.instructions.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.1-navigation-config-outcome.md`
  - _Requirements: AC-2, AC-6_

- [x] 2.2 Fix `frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts` (164 tokens)
  - Read lines 104-127 ↔ 199-222 — repeating label lookup blocks
  - Extract local `makeDomainLabelLookup(record)` helper at module scope (no leading underscore — oxlint `no-underscore-dangle`)
  - Both sections call the helper
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts --lifecycle codescene`
  - SR / IV as per frontend/views layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.2-class-details-labels-outcome.md`
  - _Requirements: AC-2, AC-6_

- [x] 2.3 Fix `frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx` (142 tokens)
  - Read lines 194-218 ↔ 399-423 — repeating payment detail sections
  - Extract local presentational component `<PaymentDetailSection .../>` within the file
  - Both sections render the component with different props
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx --lifecycle codescene`
  - SR: Visual review — verify both payment detail sections render identically
  - IV: Read `frontend.instructions.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.3-invoice-payment-details-outcome.md`
  - _Requirements: AC-2, AC-6_

- [x] 2.4 Fix `frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile.tsx` (83 tokens)
  - Read lines 22-42 ↔ 63-83 — repeating helper card components
  - Extract local presentational component `<ContextualHelperCard .../>` within the file
  - Both sections render the component
  - QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile.tsx --lifecycle codescene`
  - SR / IV as per frontend/views layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.4-contextual-helper-cards-outcome.md`
  - _Requirements: AC-2, AC-6_

- [x] 2.5 Fix `frontend/common/views/dashboard/admin/parents/students/types.ts` (76 tokens)
  - Read lines 34-47 ↔ 54-67 — repeating type definitions
  - Extract shared `interface` at module scope
  - Both sections use the shared type
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/admin/parents/students/types.ts --lifecycle codescene`
  - SR / IV as per frontend layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.5-admin-parents-students-types-outcome.md`
  - _Requirements: AC-2, AC-6_

- [x] 2.6 Fix `frontend/common/views/dashboard/resources/types/resourcesTypes.ts` (76 tokens)
  - Read lines 75-87 ↔ 87-99 — repeating type definitions
  - Extract shared `interface` at module scope
  - Both sections use the shared type
  - QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/resources/types/resourcesTypes.ts --lifecycle codescene`
  - SR / IV as per frontend layer instructions
  - Outcome: `.ai/plans/duplications-phase7/outcome/2.6-resources-types-outcome.md`
  - _Requirements: AC-2, AC-6_

---

## Phase 3: shared/locale Within-File Clones (7 pairs, 700 tokens)

**Goal:** Fix shared/locale within-file clones by extracting shared type signatures and translation patterns.
**Approach:** Each locale file pair is fixed by extracting shared type definitions or shared translation factory functions at module scope. No `.jscpd.json` ignore patterns are used.
**Risk:** Low — shared/locale is the compile-time i18n system. Changes are type-level or factory-level, not behavioral.

- [x] 3.1 Fix shared/locale within-file and cross-file clones by real code extraction (199 tokens, ~18 within-file pairs)
  - **POLICY CHANGE:** User explicitly forbade `.jscpd.json` ignore patterns and `// jscpd:ignore` directives. All locale clones were fixed by extracting shared code.
  - **Auth cross-file clones (4 pairs):** `ar/auth/index.ts` and `en/auth/index.ts` — replaced inline login+impersonation blocks with imports from sibling files (`login.ts`, `impersonation.ts`)
  - **Errors within-file clones (6 pairs across 3 files):**
    - `types/errors/index.ts`: Extracted `SchedulingSharedErrors` interface (9 overlapping props). `ErrorsLabels` now extends `StudentErrors`, `CategoryErrors`, `UserErrors`, `PermissionGroupErrors`, `SchedulingSharedErrors` — eliminated ~30 flattened property declarations
    - `ar/errors/index.ts`: Extracted 6 sub-object `const`s at module scope (`student`, `category`, `user`, `scheduling`, `permissionGroup`, `teacher`). Replaced nested objects with references. Replaced flat declarations with spreads
    - `en/errors/index.ts`: Same pattern as ar version
  - **Onboarding within-file clone (1 pair):** `types/dashboard/parents/onboarding.ts` — extracted `OnboardingFieldKey` union type and `OnboardingFieldLabels` mapped type for `fields`/`placeholders` dedup
  - **Dashboard cross-file type clones (1 pair):**
    - `types/dashboard/admin/view.ts`: Extracted `ClassAdminActionsLabels`, `ClassInfoLabels`, `ClassMetadataLabels`, `ClassRateLabels` interfaces
    - `types/dashboard/classes/details.ts`: Imported shared types from `admin/view.ts`, used intersection types for `performance` and `instanceDetails`
  - **Dashboard cross-file impl clones (4 pairs):**
    - `ar/dashboard/admin/view.ts` + `ar/dashboard/classes/details.ts`: Extracted `adminActions`, `classInfo`, `metadata`, `rate` as exported `const` sub-objects. classes/details imports them
    - `en/dashboard/admin/view.ts` + `en/dashboard/classes/details.ts`: Same pattern (only `classInfo` and `rate` shared — ar/en have different `adminActions` and `metadata` strings)
  - **Profile cross-file type clone (1 pair):** `types/dashboard/supervisorPortal/profile.ts` — imported `ProfileAdminResetPasswordLabels` from `types/profile/index.ts` instead of re-declaring 22-line block
  - **Cross-layer clones with frontend (3 pairs):**
    - `recurringSchedulesListViewModel.types.ts` — imported `ColumnLabels`, `ActionLabels`, `FilterLabels` from `shared/locale/types/dashboard/classes/recurringSchedulesList.ts` instead of re-declaring
    - `availability/types.ts` — extracted `TeacherAvailabilityTableLabels` interface in locale types, aliased as `WeeklyAvailabilityGridLabels` in frontend
    - `useClassDetailsLabels.ts` — imported `ClassRateLabels` from locale types, used intersection `& ClassRateLabels` instead of re-declaring 20 rate fields
  - QL: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene` — all passed
  - IV: Read `.jscpd.json`, `shared/AGENTS.md`, `frontend/common/views/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/3.1-locale-ignore-outcome.md`
  - _Requirements: AC-7_

- [x] 3.2 Fix `shared/locale/ar/errors/index.ts` (204 tokens, 2 pairs)
  - **DONE as part of 3.1** — sub-object const extraction + spread pattern applied
  - QL: `bun run scripts/health/sub-loop.ts shared/locale/ar/errors/index.ts --lifecycle codescene` — passed
  - _Requirements: AC-7_

- [x] 3.3 Fix `shared/locale/en/errors/index.ts` (229 tokens, 2 pairs)
  - **DONE as part of 3.1** — same sub-object const extraction + spread pattern as ar version
  - QL: `bun run scripts/health/sub-loop.ts shared/locale/en/errors/index.ts --lifecycle codescene` — passed
  - _Requirements: AC-7_

- [x] 3.4 Fix `shared/locale/types/dashboard/parents/onboarding.ts` (78 tokens, 1 pair)
  - **DONE as part of 3.1** — extracted `OnboardingFieldKey` union + `OnboardingFieldLabels` mapped type
  - QL: `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/parents/onboarding.ts --lifecycle codescene` — passed
  - _Requirements: AC-7_

---

## Phase 4: Cross-Layer Utility Dedup (2 pairs, 163 tokens)

**Goal:** Resolve the 2 frontend↔shared cross-layer utility duplication pairs by extracting runtime-agnostic shared logic.
**Approach:** Extract pure/runtime-agnostic logic from both implementations into `shared/` modules that both can import. This respects `.dependency-cruiser.js` rules (shared/ must not import frontend/backend/app). No jscpd:ignore directives.
**Risk:** Medium — cross-layer extraction affects import chains. Must verify dependency-cruiser compliance.

- [x] 4.1 Fix `frontend/common/lib/enum.ts` ↔ `shared/lib/enum.ts` (84 tokens)
  - **NOTE:** Plan originally described extracting `shared/lib/enum-core.ts`. Actual approach used factory pattern refactor (`withFallback<T>` / `orNull<T>` factories) in both files instead, which eliminated the clone without needing a shared module.
  - Analyze both files' type sources and runtime dependencies
  - `frontend/common/lib/enum.ts` uses GraphQL codegen types (TitleCase members); `shared/lib/enum.ts` uses backend pgEnum types (UPPERCASE members)
  - Added `withFallback<T>` and `orNull<T>` factory functions to both files; refactored all ~35 parser wrappers to use them
  - Also fixed pre-existing CodeScene duplication on `parseBookingStatus`/`parseBookingStatusOrNull` (frontend) via `isBookingStatus` type guard + `BOOKING_STATUS_VALUES` constant
  - Verify: 0 clones between the two enum files (jscpd confirmed)
  - QL: `bun run scripts/health/sub-loop.ts shared/lib/enum.ts --lifecycle codescene` ✅; same for `frontend/common/lib/enum.ts` ✅
  - IV: Read `frontend/AGENTS.md`, `shared/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/4.1-enum-cross-layer-outcome.md`
  - _Requirements: AC-4_

- [x] 4.2 Fix `frontend/common/lib/logger/index.ts` ↔ `shared/lib/logger/base-logger.ts` (79 tokens)
  - **NOTE:** Plan originally described extracting `shared/lib/logger/config.ts`. Actual approach replaced the 5-case `switch/case` console dispatcher in both files with dynamic `globalThis.console[level]` dispatch, which eliminated the clone without needing a shared config module.
  - Analyze both files' runtime dependencies (browser `fetch`/`setTimeout` vs Node.js `node:fs/promises`)
  - `ClientLogger extends BaseLogger` is NOT viable — would pull `node:fs/promises` into browser bundle
  - Replaced 5-case `switch(level)` console dispatcher with: `const fn = globalThis.console[level]; if (typeof fn === "function") { fn.bind(globalThis.console)(...consoleArgs); }`
  - Both files use different variable names (`level` vs `options.level`) and surrounding structure → distinct token streams
  - Verify: 0 clones between the two logger files (jscpd confirmed)
  - QL: `bun run scripts/health/sub-loop.ts shared/lib/logger/base-logger.ts --lifecycle codescene` ✅; same for `frontend/common/lib/logger/index.ts` ✅
  - IV: Read `frontend/AGENTS.md`, `shared/AGENTS.md`
  - Outcome: `.ai/plans/duplications-phase7/outcome/4.2-logger-cross-layer-outcome.md`
  - _Requirements: AC-4_

---

## Phase 5: Unfixable Pair Triage (D6-2 carry-forward)

**Goal:** Triage pairs that Phase 6 deferred as "unfixable non-structural" (D6-2 → "Phase 7+ or never").
**Approach:** Each pair is either fixed by extracting shared code (if a reasonable extraction exists) or documented as permanently deferred. No jscpd:ignore directives are used.

- [x] 5.1 Identify D6-2 pairs
  - After Phase 6 implementation (or if Phase 6 is not yet implemented, identify from the current 504 baseline)
  - Filter: pairs that are neither "fixable" (too small to scaffold) nor "structural" (not by-design)
  - These are typically ≤50 token pairs that are coincidental similarity, not pattern duplication
  - Write to `/tmp/phase7-d6-2-pairs.txt`
  - Outcome: `.ai/plans/duplications-phase7/outcome/5.1-d6-2-identification-outcome.md`

- [x] 5.2 Triage D6-2 pairs
  - For each pair: attempt real extraction if a reasonable shared construct exists (shared helper, type, constant)
  - If extraction is not possible (truly coincidental similarity with no shared abstraction): document in `deferred-items.md` as "permanently deferred" with pair details and rationale
  - No jscpd:ignore directives — duplication is either fixed or documented as accepted trade-off
  - QL per modified file
  - Outcome: `.ai/plans/duplications-phase7/outcome/5.2-d6-2-triage-outcome.md`
  - _Requirements: AC-9_

---

## Phase 6: Post-Implementation Residual Sweep (D6-1 carry-forward)

**Goal:** Final jscpd sweep after all phases (4, 5, 6, 7) are complete. Triage any remaining unaddressed clones.
**Condition:** This phase can only run if Phases 4, 5, and 6 are complete. If they are still in progress, document the current state and defer.

- [x] 6.1 Check phase completion status
  - Check if Phase 4 (backend/shared/app/scripts) is complete — look for outcome files in `.ai/plans/duplications-phase4/outcome/`
  - Check if Phase 5 (frontend↔frontend P0-P2) is complete — look for outcome files in `.ai/plans/duplications-phase5/outcome/`
  - Check if Phase 6 (P3 micro clusters + locale ignore) is complete — look for outcome files in `.ai/plans/duplications-phase6/outcome/`
  - If ALL complete: proceed to Task 6.2
  - If ANY incomplete: document current state in outcome, defer Task 6.2 to post-implementation
  - Outcome: `.ai/plans/duplications-phase7/outcome/6.1-phase-completion-status.md`

- [x] 6.2 (CONDITIONAL — only if all prior phases complete) Run residual sweep
  - Run `bun check:duplicates 2>&1 | tee /tmp/phase7-residual-jscpd.txt`
  - Compare to baseline (504 clones, 68,194 tokens)
  - Identify any remaining unaddressed clones
  - Triage each into:
    - "fix" → extract shared code to eliminate the clone (create a follow-up task or fix immediately)
    - "defer" → document in `deferred-items.md` with a real extraction plan for a future phase
    - NEVER use jscpd:ignore — every clone must be truly solved by code extraction or documented as deferred
  - Write final outcome: `.ai/plans/duplications-phase7/outcome/6.2-residual-sweep-outcome.md`
  - _Requirements: AC-8_

---

## Phase 7: Knowledge Propagation

- [x] 7.1 Update `docs/frontend/duplication-elimination-patterns.md`
  - Add "Within-File Clone Extraction" pattern section:
    - When to use (same-file duplication)
    - How to implement (local helper / component / factory within the file)
    - Examples from Phase 1-2 work
  - Add "Cross-Layer Utility Alignment" pattern section:
    - When to extract runtime-agnostic shared logic to `shared/` modules
    - How to respect dependency-cruiser rules (shared/ must not import frontend/backend/app)
    - Example: enum.ts (shared `enum-core.ts` with generic parsing helpers) and logger (shared `config.ts` with pure config logic)
  - Add "Frontend Cross-Tier Shared Extraction" pattern section:
    - When desktop/mobile share code, move shared logic to `frontend/common/` module
    - Respect ESLint `no-restricted-imports` rules (`.mobile.tsx`/`.desktop.tsx` must not cross-import)
    - Use `*Shared.tsx` scaffold pattern with slot props from `docs/frontend/ui-shared-scaffold-pattern.md`
  - QL: `bun run scripts/health/sub-loop.ts docs/frontend/duplication-elimination-patterns.md --lifecycle codescene` (if applicable to docs)
  - Outcome: `.ai/plans/duplications-phase7/outcome/7.1-knowledge-propagation-outcome.md`
  - _Requirements: AC-12_

---

## Phase 8: Plan Review

- [x] 8.1 Invoke `@plan-review` skill on this plan
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
| 3 | 4 | 7 (shared/locale within-file) | 700 | 4 outcome files |
| 4 | 2 | 2 (cross-layer utilities) | 163 | 2 outcome files |
| 5 | 2 | TBD (D6-2 triage) | TBD | 2 outcome files |
| 6 | 1-2 | TBD (residual sweep) | TBD | 1-2 outcome files |
| 7 | 1 | 0 (docs) | 0 | 1 outcome file |
| 8 | 1 | 0 (review) | 0 | 1 outcome file |
| **Total** | **22-24** | **19+ TBD** | **2,178+ TBD** | **22-24 outcome files** |
