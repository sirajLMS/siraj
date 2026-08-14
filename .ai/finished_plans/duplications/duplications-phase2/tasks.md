# Tasks Document: Code Duplication Elimination Phase 2 (Frontend)

## Document Information

- **Feature Name**: Code Duplication Elimination Phase 2 — Frontend Consolidation
- **Target Directory**: `.ai/plans/duplications-phase2`
- **Outcome Directory**: `.ai/plans/duplications-phase2/outcome`
- **Version**: 1.0
- **Date**: 2026-08-10
- **Author**: Spec-driven continuation of `.ai/plans/duplications/`
- **Related Documents**:
  - Requirements: [requirements.md](./requirements.md)
  - Design: [design.md](./design.md)
  - Predecessor Tasks: [../duplications/tasks.md](../duplications/tasks.md)

## Non-Negotiable Execution Protocol for All Tasks

### For Sequential Tasks (Orchestrator-Executed)

1. **Pre-Execution Outcome Knowledge Read:**
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/duplications-phase2/outcome/` AND the predecessor plan's outcome files in `../duplications/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.

2. **Per-File Quality Verification Loop (Immediate post-edit):**
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + `bun run scripts/lint-service.ts -f <file> --id verify`) BEFORE moving to another file or subtask.

3. **Post-Execution Outcome File Creation:**
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/duplications-phase2/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, cross-file dependencies, and carry-over knowledge.

4. **Task Progress Tracking:**
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon successful completion.

5. **Deferred Items Ledger:**
   Any work deferred from one task to another MUST be logged in `.ai/plans/duplications-phase2/deferred-items.md` with a clear description, source task, target task, and status.

### For Parallel Tasks (Subagent-Executed — Phase 1 & Phase 2 Implementation Tasks)

**Orchestrator (main agent) dispatches all parallel tasks simultaneously as background `general-purpose` subagents. Each subagent:**

1. **Receives a self-contained prompt** containing:
   - The full task description from this `tasks.md` (the relevant `- [ ] X.Y` entry, verbatim)
   - The Non-Negotiable Execution Protocol (this section, adapted for subagent context)
   - The Layer-to-Instructions Mapping (AGENTS.md + instruction file paths for the target files)
   - The Quality Loop subtask description (X.Y.QL)
   - The Outcome File subtask description (X.Y.OUT)
   - Reference scaffold: `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx`
   - Reference pattern docs: `docs/frontend/ui-shared-scaffold-pattern.md`, `docs/frontend/duplication-elimination-patterns.md`

2. **Executes independently** — creates the scaffold file, refactors variants, runs per-file quality loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`), and writes the outcome file.

3. **Reports back** — the orchestrator reads the subagent result via `read_agent`, verifies the outcome file was created, and checks for any cross-file dependency issues.

4. **Does NOT update `tasks.md` checkboxes** — the orchestrator updates checkboxes after verifying all subagent results in the verification task (1.12 / 2.20).

**Orchestrator workflow for parallel phases:**
```
1. Read all existing outcome files (Pre-Execution Knowledge Read)
2. Dispatch N subagents simultaneously (one per task, all in one response)
3. Wait for all background agent completion notifications
4. For each subagent: read_agent → verify outcome file exists → check for errors
5. If any subagent failed: re-dispatch with corrected prompt (write_agent to the idle agent)
6. Run the verification task (1.12 / 2.20) — aggregates results, runs `bun check:duplicates` and `bun run test:ui:components`
7. Update all task checkboxes `[ ]` → `[x]` in `tasks.md`
8. Proceed to the review gate (1.5 / 2.5)
```

## MANDATORY Subtasks for Every Implementation Task

**EVERY implementation task (X.Y) MUST include these subtasks in strict order:**

### Quality Loop Subtask (X.Y.QL)
```markdown
- [ ] X.Y.QL **Quality Loop**: Per-file verification on `<file-path>`
  - Run: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene`
  - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
  - Fix all errors before proceeding
```

### Outcome File Subtask (X.Y.OUT)
```markdown
- [ ] X.Y.OUT **Outcome File**: Write `.ai/plans/duplications-phase2/outcome/<task-id>-outcome.md`
  - Document: research, analysis, changes, cross-file dependencies, carry-over knowledge
  - If aggressive consolidation changed behavior: include "Behavioral Changes" section
```

**Sequence:** QL (Quality Loop) → OUT (Outcome File) → Mark `[x]`

## Layer-to-Instructions Mapping (Reference for ALL Plans)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Frontend Common | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Test UI | `/home/ahmed/Projects/siraj/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

## Implementation Overview

### Implementation Strategy
- **Phased Waves**: 4 waves ordered by impact/risk ratio (UI Triplication Scaffolds → View Component Pairs → Within-Common Consolidation → Verification)
- **Canonical Patterns**: Reuse the predecessor plan's `*Shared.tsx` scaffold pattern (see `docs/frontend/ui-shared-scaffold-pattern.md` and `docs/frontend/duplication-elimination-patterns.md`)
- **Aggressive Consolidation**: Per `REQ-11`, extract all shared logic to scaffolds; update tests when behavior changes
- **Knowledge Capture**: Outcome file per task; final knowledge propagation to `docs/`

### Parallel Execution Strategy (ACCELERATED)

**All Phase 1 and Phase 2 implementation tasks are fully independent** — each operates on a different component directory with no shared file modifications. This enables maximum parallelism via subagent dispatch.

**Dependency Graph (what must be sequential):**
```
Phase 0 (baseline) → Phase 1 (parallel: 11 subagents) → Phase 1.5 (plan review)
→ Phase 2 (parallel: 19 subagents) → Phase 2.5 (mid-point review)
→ Phase 3 (partial parallel: 3.1+3.2 simultaneous, then 3.3, then 3.4)
→ Phase 4 (sequential verification: 4.1 → 4.2 → 4.3 → 4.4 → 4.5)
```

**Parallel Dispatch Model:**
- Phase 1: Dispatch **all 11 tasks (1.1–1.11) simultaneously** as background `general-purpose` subagents
- Phase 1 Verification (1.12): Runs **after** all Phase 1 subagents complete — aggregates results
- Phase 2: Dispatch **all 19 tasks (2.1–2.19) simultaneously** as background `general-purpose` subagents
- Phase 2 Verification (2.20): Runs **after** all Phase 2 subagents complete — aggregates results
- Phase 3: Tasks 3.1 + 3.2 dispatched in parallel (different directories); 3.3 and 3.4 sequential (depend on jscpd re-analysis)
- Phase 4: Sequential (global verification gates)

**Subagent Prompt Contract:**
Each parallel subagent receives:
1. Full task description (copied verbatim from the task entry below)
2. Reference scaffold: `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx`
3. All applicable AGENTS.md and instruction file paths
4. Quality Loop command: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`
5. Outcome file path to write upon completion

**Orchestrator Responsibilities (main agent):**
1. Dispatch all subagents in a single response (parallel)
2. Wait for all completions (background agent notifications)
3. Read each subagent result via `read_agent`
4. Verify all outcome files were created
5. Run the phase verification task (1.12 or 2.20)
6. Proceed to review gate (1.5 or 2.5)

### Development Approach
- **Testing Strategy**: Reuse existing test suites — update tests when aggressive consolidation changes behavior
- **Integration Strategy**: `*Shared.tsx` scaffold with slot props for tier variations; canonical-source-with-barrel-import for utility consolidations
- **Deployment Strategy**: Standard rolling deployment — all changes backward compatible

## Implementation Plan

### Task 0: Pre-Implementation Baseline (MANDATORY)

- [x] 0. Establish error baseline and create deferred-items ledger
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/` (will be empty — first task)
  - Read all existing files in `../duplications/outcome/` (predecessor plan — 41 outcome files) to absorb prior context
  - Record baseline error counts BEFORE any implementation:
    ```bash
    # Record tsgo error count (expected: 0 — verified clean by post-completion update)
    bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-phase2-tsgo.txt

    # Record biome warnings (expected: 0)
    bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-phase2-biome.txt

    # Record lint output (expected: 4 pre-existing sonarjs errors, out-of-scope)
    bun run scripts/lint-service.ts --json --id baseline-phase2 > /tmp/baseline-phase2-lint.json

    # Record jscpd clone count (expected: 823 total, 718 frontend)
    bun check:duplicates 2>&1 | tail -10 > /tmp/baseline-phase2-jscpd.txt
    ```
  - Create deferred-items ledger: `.ai/plans/duplications-phase2/deferred-items.md` (use predecessor plan's format as template)
  - Write outcome file: `.ai/plans/duplications-phase2/outcome/0-baseline-outcome.md` documenting baseline counts
  - Update progress: Mark task 0 as `[x]` in `tasks.md`
  - _Requirements: REQ-0_

  - [x] 0.QL **Quality Loop**: N/A (baseline task — no files modified)

  - [x] 0.OUT **Outcome File**: Write `outcome/0-baseline-outcome.md`
    - Document: baseline tsgo=0, biome=0, lint=4 (OOS), jscpd=823 (718 frontend)
    - Document: tier-pair breakdown from jscpd JSON analysis
    - Document: top 40 frontend clone clusters (full list in `outcome/0-baseline-outcome.md`)

### Phase 1: Quick Wins — UI Component Triplication Scaffolds (Low Risk, High Impact)

**Pattern**: For each UI component with common+desktop+mobile variants, create a `*Shared.tsx` scaffold with slot props, then refactor all variants to consume the scaffold.

**Reference implementation**: `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx` (from predecessor plan).

**PARALLEL EXECUTION**: Tasks 1.1–1.11 are dispatched **simultaneously** as 11 background `general-purpose` subagents. Each operates on an independent component directory — no file conflicts. Wait for all to complete before running Task 1.12 (verification).

- [x] 1.1 Create CurrencyAutocompleteShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.1) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Read predecessor plan outcome: `../duplications/outcome/2.1-statusbadge-shared-outcome.md` (scaffold pattern reference)
  - **VERIFY FIRST:** Inspect `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx` for MUI v9 compliance (all styling via `sx` prop, no direct style props, `*Outlined` icons)
  - Analyze `frontend/common/components/ui/input/currencySelect/CurrencyAutocomplete.tsx`, `frontend/desktop/components/ui/input/currencySelect/currencyAutocomplete.desktop.tsx`, `frontend/mobile/components/ui/input/currencySelect/currencyAutocomplete.mobile.tsx` (1301 tokens / 245 lines duplicated between common↔mobile, 1246 tokens / 226 lines between common↔desktop)
  - Create `frontend/common/components/ui/input/currencySelect/CurrencyAutocompleteShared.tsx` with slot props for tier variations
  - Refactor `CurrencyAutocomplete.tsx` (common) to consume scaffold
  - Refactor `currencyAutocomplete.desktop.tsx` to consume scaffold
  - Refactor `currencyAutocomplete.mobile.tsx` to consume scaffold
  - **MUI v9 COMPLIANCE:** All styling MUST use `sx` prop; NEVER direct style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, `gap`, `alignItems`, `justifyContent`, `flexWrap`, `component`); icons MUST use `*Outlined` naming
  - **CROSS-TIER IMPORT CHECK:** Verify desktop/mobile variants import ONLY from `@/common/components/ui/input/currencySelect/CurrencyAutocompleteShared` (not from each other, not from common tier-specific paths)
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.1.QL **Quality Loop**: Per-file verification on `CurrencyAutocompleteShared.tsx`, `CurrencyAutocomplete.tsx`, `currencyAutocomplete.desktop.tsx`, `currencyAutocomplete.mobile.tsx`
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding

  - [x] 1.1.OUT **Outcome File**: Write `outcome/1.1-currency-autocomplete-shared-outcome.md`
    - Document: scaffold interface, slot props, behavioral changes (if any), cross-file dependencies

- [x] 1.2 Create PhoneInputShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.2) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/input/phoneInput/PhoneInput.tsx`, `frontend/desktop/components/ui/input/phoneInput/phoneInput.desktop.tsx`, `frontend/mobile/components/ui/input/phoneInput/PhoneInput.tsx` (1119 tokens / 253 lines common↔desktop, 998 tokens / 229 lines common↔mobile)
  - **VERIFY FIRST:** Note that mobile variant is named `PhoneInput.tsx` (not `phoneInput.mobile.tsx`) — verify this is intentional and not a naming inconsistency
  - Create `frontend/common/components/ui/input/phoneInput/PhoneInputShared.tsx` with slot props
  - Refactor all 3 variants to consume scaffold
  - **MUI v9 COMPLIANCE:** All styling via `sx` prop; icons use `*Outlined` naming
  - **CROSS-TIER IMPORT CHECK:** Variants import only from scaffold
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.2.QL **Quality Loop**: Per-file verification on all 4 files (scaffold + 3 variants)
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.2.OUT **Outcome File**: Write `outcome/1.2-phone-input-shared-outcome.md`

- [x] 1.3 Create PaymentMethodDisplayShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.3) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplay.tsx`, `frontend/desktop/components/ui/display/paymentMethod/paymentMethodDisplay.desktop.tsx`, `frontend/mobile/components/ui/display/paymentMethod/paymentMethodDisplay.mobile.tsx` (1110 tokens / 172 lines common↔desktop, 788 tokens / 132 lines common↔mobile)
  - Create `frontend/common/components/ui/display/paymentMethod/PaymentMethodDisplayShared.tsx` with slot props
  - Refactor all 3 variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.3.QL **Quality Loop**: Per-file verification on all 4 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.3.OUT **Outcome File**: Write `outcome/1.3-payment-method-display-shared-outcome.md`

- [x] 1.4 Create UserPaymentMethodAutocompleteShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.4) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocomplete.tsx`, `frontend/desktop/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.desktop.tsx`, `frontend/mobile/components/ui/input/userPaymentMethodSelect/userPaymentMethodAutocomplete.mobile.tsx` (1047 tokens / 190 lines common↔mobile, 1043 tokens / 190 lines common↔desktop)
  - Create `frontend/common/components/ui/input/userPaymentMethodSelect/UserPaymentMethodAutocompleteShared.tsx` with slot props
  - Refactor all 3 variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.4.QL **Quality Loop**: Per-file verification on all 4 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.4.OUT **Outcome File**: Write `outcome/1.4-user-payment-method-autocomplete-shared-outcome.md`

- [x] 1.5 Create EditableTypographyShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.5) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/input/editableTypography/EditableTypography.tsx`, `frontend/desktop/components/ui/input/editableTypography/editableTypography.desktop.tsx`, `frontend/mobile/components/ui/input/editableTypography/editableTypography.mobile.tsx` (974 tokens / 194 lines common↔desktop, 854 tokens / 165 lines common↔mobile)
  - Create `frontend/common/components/ui/input/editableTypography/EditableTypographyShared.tsx` with slot props
  - Refactor all 3 variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.5.QL **Quality Loop**: Per-file verification on all 4 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.5.OUT **Outcome File**: Write `outcome/1.5-editable-typography-shared-outcome.md`

- [x] 1.6 Create TagInputShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.6) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/input/tagInput/TagInput.tsx`, `frontend/desktop/components/ui/input/tagInput/tagInput.desktop.tsx`, `frontend/mobile/components/ui/input/tagInput/tagInput.mobile.tsx` (946 tokens / 149 lines desktop↔mobile, 738 tokens / 109 lines common↔desktop)
  - **NOTE:** Predecessor plan already deleted `common/components/ui/input/tagInput/useTagInputEditing.ts` (task 1.3) — verify no stale references remain
  - Create `frontend/common/components/ui/input/tagInput/TagInputShared.tsx` with slot props
  - Refactor all 3 variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.6.QL **Quality Loop**: Per-file verification on all 4 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.6.OUT **Outcome File**: Write `outcome/1.6-tag-input-shared-outcome.md`

- [x] 1.7 Create CountryAutocompleteShared scaffold and refactor 3 variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.7) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/input/countrySelect/CountryAutocomplete.tsx`, `frontend/desktop/components/ui/input/countrySelect/countryAutocomplete.desktop.tsx`, `frontend/mobile/components/ui/input/countrySelect/countryAutocomplete.mobile.tsx` (776 tokens / 155 lines common↔desktop, 770 tokens / 157 lines common↔mobile)
  - Create `frontend/common/components/ui/input/countrySelect/CountryAutocompleteShared.tsx` with slot props
  - Refactor all 3 variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.7.QL **Quality Loop**: Per-file verification on all 4 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.7.OUT **Outcome File**: Write `outcome/1.7-country-autocomplete-shared-outcome.md`

- [x] 1.8 Create MeetingJoinActionShared scaffold and refactor 2 variants (common + desktop)
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.8) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/display/meetingConfig/MeetingJoinAction.tsx`, `frontend/desktop/components/ui/display/meetingConfig/MeetingJoinAction.desktop.tsx` (915 tokens / 137 lines common↔desktop — only 2 variants, no mobile)
  - Create `frontend/common/components/ui/display/meetingConfig/MeetingJoinActionShared.tsx` with slot props
  - Refactor both variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-5, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.8.QL **Quality Loop**: Per-file verification on all 3 files (scaffold + 2 variants)
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.8.OUT **Outcome File**: Write `outcome/1.8-meeting-join-action-shared-outcome.md`

- [x] 1.9 Create MeetingConfigDisplayShared scaffold and refactor 2 variants (common + desktop)
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.9) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay.tsx`, `frontend/desktop/components/ui/display/meetingConfig/MeetingConfigDisplay.desktop.tsx` (747 tokens / 109 lines common↔desktop)
  - Create `frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplayShared.tsx` with slot props
  - Refactor both variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-5, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.9.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.9.OUT **Outcome File**: Write `outcome/1.9-meeting-config-display-shared-outcome.md`

- [x] 1.10 Create PaymentMethodAutocompleteShared scaffold and refactor 2 variants (common + desktop)
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.10) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - **NOTE:** Predecessor plan already created `PaymentMethodTypeFieldsShared.tsx` (task 2.11-2.13) — verify this is a different component (autocomplete vs type fields)
  - Analyze `frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocomplete.tsx`, `frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.desktop.tsx` (702 tokens / 133 lines common↔desktop)
  - Create `frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodAutocompleteShared.tsx` with slot props
  - Refactor both variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-5, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.10.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.10.OUT **Outcome File**: Write `outcome/1.10-payment-method-autocomplete-shared-outcome.md`

- [x] 1.11 Create PaginationControlsShared scaffold and refactor 2 variants (common + mobile)
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 1 Wave, subagent-1.11) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/filter/PaginationControls.tsx`, `frontend/mobile/components/ui/filter/paginationControls.mobile.tsx` (719 tokens / 120 lines common↔mobile — only 2 variants, no desktop)
  - Create `frontend/common/components/ui/filter/PaginationControlsShared.tsx` with slot props
  - Refactor both variants to consume scaffold
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-1, REQ-5, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 1.11.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.11.OUT **Outcome File**: Write `outcome/1.11-pagination-controls-shared-outcome.md`

- [x] 1.12 Phase 1 verification — run `bun check:duplicates` and `bun run test:ui:components`
  <!-- DISPATCH: SEQUENTIAL (orchestrator-executed, runs AFTER all Phase 1 subagents complete) -->
  - **PREREQUISITE:** All 11 Phase 1 parallel subagents (tasks 1.1–1.11) have completed and their outcome files exist in `.ai/plans/duplications-phase2/outcome/`
  - Read all outcome files in `.ai/plans/duplications-phase2/outcome/` (including all 1.*-outcome.md files from parallel subagents)
  - Aggregate subagent results: verify each scaffold was created, each variant was refactored, each quality loop passed
  - Run `bun check:duplicates` — confirm all 11 UI component clusters eliminated (expected reduction: ~10,000 tokens)
  - Run `bun run test:ui:components` — verify all component tests pass
  - Run Storybook for the 11 components — verify visual parity
  - **CROSS-TIER IMPORT CHECK:** Run lint on all modified files to verify no cross-tier imports
  - **CONFLICT RESOLUTION:** If any subagent introduced tsgo/lint errors in shared files (unlikely — each task targets independent directories), fix here
  - _Requirements: REQ-1, REQ-6, REQ-8_

  - [x] 1.12.QL **Quality Loop**: Per-file verification on any test files modified
    - Run: `bun run scripts/health/sub-loop.ts <each-test-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 1.12.OUT **Outcome File**: Write `outcome/1.12-phase1-verification-outcome.md`

### Phase 1.5: Plan Review Gate (MANDATORY)

- [x] 1.5 Review complete plan using @plan-review skill
  <!-- DISPATCH: SEQUENTIAL (orchestrator-executed, runs AFTER Phase 1 verification completes) -->
  - **Input files:** `requirements.md`, `design.md`, `tasks.md`
  - **Invoke:** `@plan-review` skill on complete plan
  - **Expected output:** "Plan passes all AGENTS.md rules" OR structured violation list
  - If violations found:
    - Fix all reported violations in plan files
    - Re-run `@plan-review`
    - Repeat until zero violations
  - Write outcome: `.ai/plans/duplications-phase2/outcome/plan-review-R1.md`
  - Mark complete ONLY when plan passes all checks
  - _Requirements: REQ-4_

  - [x] 1.5.QL **Quality Loop**: N/A (plan files, no code modifications)
  - [x] 1.5.OUT **Outcome File**: Write `outcome/plan-review-R1.md`

### Phase 2: Desktop↔Mobile View Component Pairs (Medium Risk, High Impact)

**Pattern**: For each desktop↔mobile view component pair, create a `*Shared.tsx` scaffold in a `__shared__/` subdirectory at the parent level, then refactor both variants to consume the scaffold.

**Reference**: Predecessor plan's `__shared__/` pattern (e.g., `common/views/dashboard/admin/__shared__/useAdminDashboard.ts`).

**Aggressive consolidation**: Per `REQ-11`, extract ALL shared logic to the scaffold. Keep only genuinely different behavior in tier variants. Update tests as needed.

**PARALLEL EXECUTION**: Tasks 2.1–2.19 are dispatched **simultaneously** as 19 background `general-purpose` subagents. Each operates on an independent view directory — no file conflicts. Wait for all to complete before running Task 2.20 (verification).

**Dependency note**: Phase 2 tasks may import Phase 1 UI components (e.g., a view component may use `CurrencyAutocomplete`). However, Phase 1 scaffolds are **additive** — new files alongside existing components with existing exports unchanged. Therefore Phase 2 subagents rely on pre-existing imports, which remain valid regardless of Phase 1 progress. Both phases CAN be dispatched in parallel for maximum speed. If strict ordering is preferred, dispatch Phase 2 after Phase 1 verification (1.12) passes.

- [x] 2.1 Create localizedStringDrawerShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.1) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/.../localizedStringDrawer.desktop.tsx` and `frontend/mobile/views/dashboard/.../localizedStringDrawer.mobile.tsx` (1377 tokens / 218 lines — top frontend clone cluster)
  - **VERIFY FIRST:** Locate the exact paths via `find frontend -name "localizedStringDrawer*"`
  - Create `frontend/views/dashboard/.../__shared__/localizedStringDrawerShared.tsx` with slot props
  - Refactor desktop and mobile variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION:** Extract shared logic (drawer state, field rendering, save/cancel handlers) to scaffold; keep tier-specific layout in variants
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.1.QL **Quality Loop**: Per-file verification on all 3 files (scaffold + 2 variants)
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.1.OUT **Outcome File**: Write `outcome/2.1-localized-string-drawer-shared-outcome.md`
    - Include "Behavioral Changes" section if consolidation changed behavior

- [x] 2.2 Create managementControlsCardShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.2) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/teachers/reassignment/components/managementControlsCard.desktop.tsx` and `frontend/mobile/views/dashboard/teachers/reassignment/components/managementControlsCard.mobile.tsx` (1264 tokens / 198 lines)
  - Create `frontend/views/dashboard/teachers/reassignment/components/__shared__/managementControlsCardShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.2.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.2.OUT **Outcome File**: Write `outcome/2.2-management-controls-card-shared-outcome.md`

- [x] 2.3 Create meetingProviderFormShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.3) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/admin/meeting-providers/form/meetingProviderForm.desktop.tsx` and `frontend/mobile/views/dashboard/admin/meeting-providers/form/meetingProviderForm.mobile.tsx` (1134 tokens / 183 lines)
  - Create `frontend/views/dashboard/admin/meeting-providers/form/__shared__/meetingProviderFormShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.3.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.3.OUT **Outcome File**: Write `outcome/2.3-meeting-provider-form-shared-outcome.md`

- [x] 2.4 Create studentStatusHeaderShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.4) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/students/status/components/studentStatusHeader.desktop.tsx` and `frontend/mobile/views/dashboard/students/status/components/studentStatusHeader.mobile.tsx` (1062 tokens / 167 lines)
  - Create `frontend/views/dashboard/students/status/components/__shared__/studentStatusHeaderShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.4.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.4.OUT **Outcome File**: Write `outcome/2.4-student-status-header-shared-outcome.md`

- [x] 2.5 Create complaintFormFieldsShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.5) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/complaints/components/complaintFormFields.desktop.tsx` and `frontend/mobile/views/dashboard/complaints/components/complaintFormFields.mobile.tsx` (1055 tokens / 205 lines)
  - Create `frontend/views/dashboard/complaints/components/__shared__/complaintFormFieldsShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.5.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.5.OUT **Outcome File**: Write `outcome/2.5-complaint-form-fields-shared-outcome.md`

- [x] 2.6 Create complaintQueueCardShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.6) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/complaints/components/complaintQueueCard.desktop.tsx` and `frontend/mobile/views/dashboard/complaints/components/complaintQueueCard.mobile.tsx` (1053 tokens / 186 lines)
  - Create `frontend/views/dashboard/complaints/components/__shared__/complaintQueueCardShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.6.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.6.OUT **Outcome File**: Write `outcome/2.6-complaint-queue-card-shared-outcome.md`

- [x] 2.7 Create jumpToDateHeaderShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.7) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.desktop.tsx` and `frontend/mobile/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.mobile.tsx` (1009 tokens / 145 lines)
  - Create `frontend/views/dashboard/teachers/futureSchedule/components/__shared__/jumpToDateHeaderShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.7.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.7.OUT **Outcome File**: Write `outcome/2.7-jump-to-date-header-shared-outcome.md`

- [x] 2.8 Create futureClassCardShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.8) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop.tsx` and `frontend/mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile.tsx` (977 tokens / 157 lines)
  - Create `frontend/views/dashboard/teachers/futureSchedule/components/__shared__/futureClassCardShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.8.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.8.OUT **Outcome File**: Write `outcome/2.8-future-class-card-shared-outcome.md`

- [x] 2.9 Create miniCalendarShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.9) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/teachers/futureSchedule/components/miniCalendar.desktop.tsx` and `frontend/mobile/views/dashboard/teachers/futureSchedule/components/miniCalendar.mobile.tsx` (943 tokens / 148 lines)
  - Create `frontend/views/dashboard/teachers/futureSchedule/components/__shared__/miniCalendarShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.9.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.9.OUT **Outcome File**: Write `outcome/2.9-mini-calendar-shared-outcome.md`

- [x] 2.10 Create studentInformationSectionShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.10) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/students/quota/components/studentInformationSection.desktop.tsx` and `frontend/mobile/views/dashboard/students/quota/components/studentInformationSection.mobile.tsx` (923 tokens / 160 lines)
  - Create `frontend/views/dashboard/students/quota/components/__shared__/studentInformationSectionShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.10.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.10.OUT **Outcome File**: Write `outcome/2.10-student-information-section-shared-outcome.md`

- [x] 2.11 Create searchScheduleFilterDrawerShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.11) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/search-schedule/searchScheduleFilterDrawer.desktop.tsx` and `frontend/mobile/views/dashboard/search-schedule/searchScheduleFilterDrawer.mobile.tsx` (899 tokens / 151 lines)
  - Create `frontend/views/dashboard/search-schedule/__shared__/searchScheduleFilterDrawerShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION:** Filter logic, state management, and data fetching go to scaffold; layout (sidebar vs bottom sheet) stays in variants
  - **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.11.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.11.OUT **Outcome File**: Write `outcome/2.11-search-schedule-filter-drawer-shared-outcome.md`

- [x] 2.12 Create meetingIntegrationsTabShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.12) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.desktop.tsx` and `frontend/mobile/views/dashboard/settings/tabs/meetingIntegrations/meetingIntegrationsTab.mobile.tsx` (829 tokens / 137 lines)
  - Create `frontend/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.12.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.12.OUT **Outcome File**: Write `outcome/2.12-meeting-integrations-tab-shared-outcome.md`

- [x] 2.13 Create courseDetailsSectionShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.13) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/students/quota/components/courseDetailsSection.desktop.tsx` and `frontend/mobile/views/dashboard/students/quota/components/courseDetailsSection.mobile.tsx` (797 tokens / 150 lines)
  - Create `frontend/views/dashboard/students/quota/components/__shared__/courseDetailsSectionShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.13.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.13.OUT **Outcome File**: Write `outcome/2.13-course-details-section-shared-outcome.md`

- [x] 2.14 Create weeklyAvailabilityGridShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.14) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.desktop.tsx` and `frontend/mobile/views/dashboard/teachers/availability/components/weeklyAvailabilityGrid.mobile.tsx` (796 tokens / 154 lines)
  - Create `frontend/views/dashboard/teachers/availability/components/__shared__/weeklyAvailabilityGridShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.14.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.14.OUT **Outcome File**: Write `outcome/2.14-weekly-availability-grid-shared-outcome.md`

- [x] 2.15 Create teacherAvailabilityMonthDrawerShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.15) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.desktop.tsx` and `frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.mobile.tsx` (793 tokens / 123 lines)
  - Create `frontend/views/dashboard/search-schedule/components/__shared__/teacherAvailabilityMonthDrawerShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.15.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.15.OUT **Outcome File**: Write `outcome/2.15-teacher-availability-month-drawer-shared-outcome.md`

- [x] 2.16 Create parentProfileShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.16) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/profile/parent/parentProfile.desktop.tsx` and `frontend/mobile/views/dashboard/profile/parent/parentProfile.mobile.tsx` (777 tokens / 149 lines)
  - Create `frontend/views/dashboard/profile/parent/__shared__/parentProfileShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.16.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.16.OUT **Outcome File**: Write `outcome/2.16-parent-profile-shared-outcome.md`

- [x] 2.17 Create suspensionAnalyticsShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.17) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/classes/status/tracking/components/suspensionAnalytics.desktop.tsx` and `frontend/mobile/views/dashboard/classes/status/tracking/components/suspensionAnalytics.mobile.tsx` (753 tokens / 110 lines)
  - Create `frontend/views/dashboard/classes/status/tracking/components/__shared__/suspensionAnalyticsShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.17.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.17.OUT **Outcome File**: Write `outcome/2.17-suspension-analytics-shared-outcome.md`

- [x] 2.18 Create staffProfileShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.18) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - **NOTE:** Predecessor plan already deleted `common/views/dashboard/profile/staff/StaffProfileContainer.tsx` (task 1.4) — verify no stale references
  - Analyze `frontend/desktop/views/dashboard/profile/staff/staffProfile.desktop.tsx` and `frontend/mobile/views/dashboard/profile/staff/staffProfile.mobile.tsx` (750 tokens / 172 lines)
  - Create `frontend/views/dashboard/profile/staff/__shared__/staffProfileShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.18.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.18.OUT **Outcome File**: Write `outcome/2.18-staff-profile-shared-outcome.md`

- [x] 2.19 Create editCategoryDialogShared scaffold and refactor desktop + mobile variants
  <!-- DISPATCH: PARALLEL SUBAGENT (Phase 2 Wave, subagent-2.19) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/desktop/views/dashboard/subjects/home/components/editCategoryDialog.desktop.tsx` and `frontend/mobile/views/dashboard/subjects/home/components/editCategoryDialog.mobile.tsx` (735 tokens / 153 lines)
  - Create `frontend/views/dashboard/subjects/home/components/__shared__/editCategoryDialogShared.tsx`
  - Refactor both variants to consume scaffold
  - **AGGRESSIVE CONSOLIDATION** + **MUI v9 COMPLIANCE** + **CROSS-TIER IMPORT CHECK**
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-2, REQ-6, REQ-7, REQ-11, REQ-12, REQ-13_

  - [x] 2.19.QL **Quality Loop**: Per-file verification on all 3 files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.19.OUT **Outcome File**: Write `outcome/2.19-edit-category-dialog-shared-outcome.md`

- [x] 2.20 Phase 2 verification — run `bun check:duplicates` and `bun run test:ui:components`
  <!-- DISPATCH: SEQUENTIAL (orchestrator-executed, runs AFTER all Phase 2 subagents complete) -->
  - **PREREQUISITE:** All 19 Phase 2 parallel subagents (tasks 2.1–2.19) have completed and their outcome files exist in `.ai/plans/duplications-phase2/outcome/`
  - Read all outcome files in `.ai/plans/duplications-phase2/outcome/` (including all 2.*-outcome.md files from parallel subagents)
  - Aggregate subagent results: verify each scaffold was created, each variant was refactored, each quality loop passed
  - Run `bun check:duplicates` — confirm all 19 view component clusters eliminated (expected reduction: ~17,500 tokens)
  - Run `bun run test:ui:components` — verify all component tests pass (with updates for aggressive consolidation)
  - Run Storybook for the 19 components — verify visual parity
  - **CROSS-TIER IMPORT CHECK:** Run lint on all modified files
  - **CONFLICT RESOLUTION:** If any subagent introduced errors in shared files (unlikely — each task targets independent view directories), fix here
  - _Requirements: REQ-2, REQ-6, REQ-8_

  - [x] 2.20.QL **Quality Loop**: Per-file verification on any test files modified
    - Run: `bun run scripts/health/sub-loop.ts <each-test-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 2.20.OUT **Outcome File**: Write `outcome/2.20-phase2-verification-outcome.md`

### Phase 2.5: Mid-Point Review Gate (CONDITIONAL — Plan has >15 tasks AND distinct frontend phases)

- [x] 2.5 Frontend architecture review checkpoint
  <!-- DISPATCH: SEQUENTIAL via review subagents (review-frontend + review-types in parallel, then fix phase) -->
  - **Scope:** All `frontend/` files modified in Phases 1-2 (scaffolds + variants)
  - **Dispatch review subagents in parallel:**
    - `review-frontend` (scope: all new/modified `frontend/` files — MUI v9 compliance, Apollo hook patterns, Zustand store patterns, theme compliance, component patterns)
    - `review-types` (scope: all new/modified type files — canonical type naming, no duplicate type definitions, import path consistency, enum usage)
  - **Aggregate findings:** Filter to frontend-specific issues only
  - **Fix phase:** Dispatch fix subagents per file cluster using `.agents/instructions/frontend.instructions.md` and `.agents/instructions/mobile-desktop.instructions.md` as guardrails
  - **Verify:** Run `scripts/health/sub-loop.ts` per fixed file
  - **Re-review:** Dispatch review subagents again until zero frontend-specific findings
  - Write outcome: `.ai/plans/duplications-phase2/outcome/midpoint-review-R1.md`
  - Mark complete ONLY when frontend review is clean
  - _Requirements: REQ-5_

  - [x] 2.5.QL **Quality Loop**: N/A (review task — no code modifications during review itself)
  - [x] 2.5.OUT **Outcome File**: Write `outcome/midpoint-review-R1.md`

### Phase 3: Complex Consolidation — Within-Common Duplications (Higher Risk)

**PARTIAL PARALLELISM**: Tasks 3.1 and 3.2 operate on different directories (`catalogImageUpload/` vs `excel-export/`) and can be dispatched in parallel. Tasks 3.3 and 3.4 depend on jscpd re-analysis after prior tasks complete, so they run sequentially.
  - [x] 3.1 Complete CatalogImageUpload partial extraction
  <!-- DISPATCH: PARALLEL with 3.2 (different directories — catalogImageUpload vs excel-export) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/components/ui/input/catalogImageUpload/CatalogImageUpload.tsx` ↔ `frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.tsx` (1083 tokens / 209 lines — 7 clones — partial extraction was started but not completed)
  - **VERIFY FIRST:** Inspect `catalogImageUploadShared.tsx` to understand what was already extracted
  - Complete the extraction: refactor `CatalogImageUpload.tsx` to fully consume `catalogImageUploadShared.tsx`
  - Also address the `common↔desktop` duplication (762 tokens / 128 lines): create or update scaffold for the desktop variant
  - Run `bun check:duplicates` to confirm clone elimination
  - _Requirements: REQ-3, REQ-6, REQ-7, REQ-12, REQ-13_

  - [x] 3.1.QL **Quality Loop**: Per-file verification on `CatalogImageUpload.tsx`, `catalogImageUploadShared.tsx`, `catalogImageUpload.desktop.tsx`
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 3.1.OUT **Outcome File**: Write `outcome/3.1-catalog-image-upload-completion-outcome.md`

- [x] 3.2 Consolidate excel-export utilities (parent-directory-export ↔ tracking-export)
  <!-- DISPATCH: PARALLEL with 3.1 (different directories — excel-export vs catalogImageUpload) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Analyze `frontend/common/utils/excel-export/parent-directory-export.ts` ↔ `frontend/common/utils/excel-export/tracking-export.ts` (810 tokens / 121 lines — 4 clones)
  - **VERIFY FIRST:** Determine if the duplication is intentional (different export schemas) or extractable (shared export logic)
  - IF extractable: Create `frontend/common/utils/excel-export/shared-export-logic.ts` with shared logic; refactor both files to consume it
  - IF intentional: Document distinction in both files AND add `.jscpd.json` ignore pattern with justification in `deferred-items.md`
  - Run `bun check:duplicates` to confirm elimination or documented exclusion
  - _Requirements: REQ-3, REQ-6, REQ-7_

  - [x] 3.2.QL **Quality Loop**: Per-file verification on modified files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 3.2.OUT **Outcome File**: Write `outcome/3.2-excel-export-consolidation-outcome.md`

- [x] 3.3 Investigate and consolidate top 10 within-common duplications
  <!-- DISPATCH: SEQUENTIAL (depends on 3.1 and 3.2 completing — re-runs jscpd on remaining clusters) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Run `bun check:duplicates` and identify the top 10 remaining `common↔common` clone clusters (excluding CatalogImageUpload from 3.1 and excel-export from 3.2)
  - For each cluster:
    - Investigate whether duplication is extractable or intentional
    - IF extractable: Consolidate using canonical-source-with-barrel-import pattern
    - IF intentional: Document and add `.jscpd.json` ignore pattern
  - Run `bun check:duplicates` to confirm eliminations or documented exclusions
  - _Requirements: REQ-3, REQ-6, REQ-7_

  - [x] 3.3.QL **Quality Loop**: Per-file verification on all modified files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 3.3.OUT **Outcome File**: Write `outcome/3.3-within-common-consolidation-outcome.md`
    - Include table of all 10 clusters with disposition (eliminated / documented / deferred)

- [x] 3.4 Address remaining desktop↔desktop and mobile↔mobile duplications
  <!-- DISPATCH: SEQUENTIAL (depends on 3.3 completing — re-runs jscpd on remaining clusters) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Run `bun check:duplicates` and identify the top 10 remaining `desktop↔desktop` (24 clusters, 4086 tokens) and `mobile↔mobile` (14 clusters, 2169 tokens) clone clusters
  - For each cluster:
    - Investigate whether duplication is extractable
    - IF extractable: Consolidate using canonical-source pattern within the same tier
    - IF intentional: Document and add `.jscpd.json` ignore pattern
  - Run `bun check:duplicates` to confirm eliminations or documented exclusions
  - _Requirements: REQ-3, REQ-6, REQ-7_

  - [x] 3.4.QL **Quality Loop**: Per-file verification on all modified files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 3.4.OUT **Outcome File**: Write `outcome/3.4-within-tier-consolidation-outcome.md`

### Phase 4: Final Verification & Knowledge Propagation

- [x] 4.1 Final jscpd verification
  <!-- DISPATCH: SEQUENTIAL (orchestrator-executed, depends on all Phase 3 completion) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Run `bun check:duplicates` — verify clone count is ≤323 (target: ≥500 of 718 frontend clones eliminated, ≥70% reduction per NFR-4)
  - Document any remaining clones in `deferred-items.md` with justification
  - _Requirements: REQ-8.1, NFR-4_

  - [x] 4.1.QL **Quality Loop**: N/A (verification only)
  - No file modifications — this task only runs verification commands
  - [x] 4.1.OUT **Outcome File**: Write `outcome/4.1-final-jscpd-verification-outcome.md`

- [x] 4.2 Run full quality gate
  <!-- DISPATCH: SEQUENTIAL (depends on 4.1) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Run `bun tsgo` — must be 0 errors (baseline was 0)
  - Run `bun biome:check` — must be 0 warnings (baseline was 0)
  - Run `bun run scripts/lint-service.ts --json --id final-check` — must be 0 errors for plan-modified files (4 pre-existing sonarjs errors are out-of-scope per NFR-3)
  - If any stage fails, fix and re-run
  - _Requirements: REQ-8.2, NFR-1, NFR-2, NFR-3_

  - [x] 4.2.QL **Quality Loop**: N/A (global gate)
  - This task runs the full quality gate via `bun quality-gate` which orchestrates all stages
  - [x] 4.2.OUT **Outcome File**: Write `outcome/4.2-quality-gate-outcome.md`

- [x] 4.3 Run full test suite (NO DEFERRAL — actually run all suites this time)
  <!-- DISPATCH: SEQUENTIAL (depends on 4.2) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Run `bun run build:test` (required before E2E — should succeed since tsgo is clean)
  - Run `bun run test:db` — all pass
  - Run `bun run test:services` — all pass
  - Run `bun run test:integration` — all pass
  - Run `bun run test:ui:components` — all pass (with updates for aggressive consolidation per REQ-11)
  - Run `bun run test:ui:e2e` — all pass
  - **NO DEFERRAL:** Unlike the predecessor plan's Task 4.3, this task SHALL actually run all test suites. The predecessor plan's deferral reason (tsgo errors blocking build:test) no longer applies.
  - If any test fails, fix the failure (either the code or the test, per REQ-11) before proceeding
  - _Requirements: REQ-8.3, REQ-11, NFR-5_

  - [x] 4.3.QL **Quality Loop**: N/A (test execution)
  - This task runs the full test suite — no per-file quality loop needed
  - [x] 4.3.OUT **Outcome File**: Write `outcome/4.3-full-test-suite-outcome.md`
    - Document: actual test results (pass/fail counts), any test updates made, behavioral changes verified

- [x] 4.4 Baseline comparison and deferred items enforcement
  <!-- DISPATCH: SEQUENTIAL (depends on 4.3) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Compare current error counts vs `/tmp/baseline-phase2-*.txt` — document new errors introduced (expected: 0 new tsgo, 0 new biome, 0 new lint for plan-modified files)
  - Enforce deferred items resolution:
    ```bash
    grep -c "❌\|⚠️" .ai/plans/duplications-phase2/deferred-items.md
    # Expected: 0
    ```
  - All deferred items MUST be ✅ Done with verification references
  - _Requirements: REQ-8.4, REQ-10_

  - [x] 4.4.OUT **Outcome File**: Write `outcome/4.4-baseline-comparison-outcome.md`

- [x] 4.5 Knowledge Propagation & Documentation (MANDATORY FINAL TASK)
  <!-- DISPATCH: SEQUENTIAL (depends on 4.4) -->
  - Read all existing files in `.ai/plans/duplications-phase2/outcome/`
  - Synthesize all learnings from outcome files
    - `docs/frontend/ui-shared-scaffold-pattern.md` — add any new slot prop patterns discovered (e.g., view component scaffolds in `__shared__/` directories)
    - `docs/frontend/duplication-elimination-patterns.md` — add patterns for: view component scaffold placement, within-common utility consolidation, partial extraction completion
    - `docs/frontend/view-component-scaffold-pattern.md` — IF the `__shared__/` directory pattern for view components warrants its own doc
  - **Update layer AGENTS.md files** with new rules/patterns:
    - `frontend/common/components/ui/AGENTS.md` — add reference to any new scaffold patterns
    - `frontend/views/AGENTS.md` — add `__shared__/` directory convention for view component scaffolds
    - `frontend/desktop/AGENTS.md` — add cross-tier import reminder (desktop variants import only from `common/` scaffolds or `views/.../__shared__/` scaffolds)
  - **Update `.agents/skills/` if patterns affect skills**:
    - `.agents/skills/refactor-mobile-desktop/SKILL.md` — add view component scaffold pattern (Phase 2) as an extension of the UI component scaffold pattern (Phase 1)
  - **Update `.agents/instructions/` if new conventions**:
    - `.agents/instructions/frontend.instructions.md` — add `__shared__/` directory convention
    - `.agents/instructions/mobile-desktop.instructions.md` — add cross-tier import rules for scaffolds
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id final-check` (0 errors, 0 warnings for plan-modified files; 4 pre-existing out-of-scope sonarjs errors acceptable)
  - _Requirements: REQ-9_

  - [x] 4.5.QL **Quality Loop**: Per-file verification on all modified docs and AGENTS.md files
    - Run: `bun run scripts/health/sub-loop.ts <each-file> --lifecycle codescene`
    - The sub-loop script handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene --file progressively, short-circuiting at first failure
    - Fix all errors before proceeding
  - [x] 4.5.OUT **Outcome File**: Write `outcome/4.5-knowledge-propagation-outcome.md`
  - Update progress: Mark task 4.5 as `[x]` in `tasks.md`
---

## Domain-to-Artifacts Mapping (Reference for Knowledge Propagation)

| Plan Domain | Docs Subdir | AGENTS.md to Update | Skills to Update | Instructions to Update |
|---|---|---|---|---|
| Frontend components / views | `docs/frontend/` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/components/ui/AGENTS.md` | `.agents/skills/frontend-patterns/SKILL.md` (if exists) | `.agents/instructions/frontend.instructions.md` |
| Frontend mobile/desktop | `docs/frontend/` | `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md` | `.agents/skills/refactor-mobile-desktop/SKILL.md` | `.agents/instructions/mobile-desktop.instructions.md` |

---

## Parallel Subagent Prompt Template (for Orchestrator)

When dispatching Phase 1 or Phase 2 tasks as parallel subagents, the orchestrator constructs a prompt using this template. Replace `<TASK_DESCRIPTION>` with the full task entry verbatim from this file, and fill in the placeholders.

```
You are a parallel subagent executing Task <TASK_ID> of the duplications-phase2 plan.

## Your Task

<TASK_DESCRIPTION — copy the full - [ ] X.Y task entry verbatim, including all sub-bullets>

## Execution Protocol

1. Read ALL outcome files in `.ai/plans/duplications-phase2/outcome/` FIRST to absorb prior context.
2. Read the reference scaffold: `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx`
3. Read the pattern docs: `docs/frontend/ui-shared-scaffold-pattern.md`
4. Read ALL applicable AGENTS.md files (see Layer-to-Instructions Mapping in tasks.md):
   - `/home/ahmed/Projects/siraj/AGENTS.md` (root — always)
   - <AGENTS_MD_FILES_FOR_THIS_COMPONENT>
5. Read applicable instruction files:
   - <INSTRUCTION_FILES_FOR_THIS_COMPONENT>
6. Implement the scaffold and refactor variants per the task description.
7. For EACH modified file, run the per-file quality loop:
   `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene`
   This runs tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene progressively,
   short-circuiting at first failure. Fix ALL errors before moving to the next file.
8. Run `bun check:duplicates` to confirm the clone cluster was eliminated.
9. Write your outcome file: `.ai/plans/duplications-phase2/outcome/<TASK_ID>-outcome.md`
   Include: scaffold interface, slot props, behavioral changes (if any), cross-file dependencies.

## Critical Rules

- **MUI v9 COMPLIANCE**: All styling via `sx` prop; NEVER direct style props (fontWeight, textAlign, mb, mt, p, display, gap, alignItems, justifyContent, flexWrap, component); icons MUST use `*Outlined` naming.
- **CROSS-TIER IMPORT CHECK**: Desktop/mobile variants import ONLY from the scaffold path (`@/common/components/ui/.../<Component>Shared` or `@/views/.../__shared__/<Component>Shared`). NEVER from each other's tier-specific paths.
- **AGGRESSIVE CONSOLIDATION** (Phase 2 only): Extract ALL shared logic to scaffold. Keep only genuinely different behavior in tier variants.
- **NO `console.*`**: Use `logger` from `@/frontend/utils/logger`.
- **Path aliases**: Use `@/` prefix for all imports (never relative `./` or `../`).

## Completion Criteria

- [ ] Scaffold file created with slot props
- [ ] All variant files refactored to consume scaffold
- [ ] Per-file quality loop passed for ALL modified files (tsgo + biome + lint + codescene)
- [ ] `bun check:duplicates` confirms clone elimination for this cluster
- [ ] Outcome file written to `.ai/plans/duplications-phase2/outcome/<TASK_ID>-outcome.md`
```

### Orchestrator Dispatch Example (Phase 1)

The orchestrator dispatches all 11 Phase 1 subagents in a **single response** using the `task` tool, 11 times in parallel:

```
Task 1.1: agent_type="general-purpose", mode="background", name="scaffold-1.1"
Task 1.2: agent_type="general-purpose", mode="background", name="scaffold-1.2"
...
Task 1.11: agent_type="general-purpose", mode="background", name="scaffold-1.11"
```

After all 11 completion notifications arrive, the orchestrator:
1. Calls `read_agent` for each to verify success
2. Checks all 11 outcome files exist
3. Runs Task 1.12 (verification) directly
4. Updates all checkboxes in `tasks.md`
5. Proceeds to Task 1.5 (plan review)

### Orchestrator Dispatch Example (Phase 2)

Same model — 19 subagents dispatched simultaneously. After all 19 complete:
1. `read_agent` for each
2. Check all 19 outcome files
3. Run Task 2.20 (verification) directly
4. Update all checkboxes
5. Proceed to Task 2.5 (mid-point review)

---

## Task Execution Checklist

### Before Starting Each Task
- [ ] Requirements and design documents are reviewed
- [ ] Dependencies are identified and available
- [ ] Development environment is set up
- [ ] Task scope and acceptance criteria are clear
- [ ] **ALL outcome files in `.ai/plans/duplications-phase2/outcome/` AND `../duplications/outcome/` have been read**
- [ ] **For parallel tasks:** Verify no other subagent is modifying files in the same component directory (shouldn't happen — tasks are directory-independent, but verify)

### For Parallel Subagent Tasks (Phase 1 & Phase 2 Implementation)
- [ ] Subagent prompt constructed using the Parallel Subagent Prompt Template
- [ ] Subagent receives full task description, AGENTS.md paths, instruction file paths, quality loop command
- [ ] Subagent dispatches all Phase 1 (or Phase 2) tasks in a **single response** (maximum parallelism)
- [ ] Orchestrator waits for all completion notifications before running verification task
- [ ] Orchestrator verifies all outcome files were created
- [ ] Orchestrator runs `bun tsgo` globally to catch cross-file type errors (shouldn't be any, but verify)
- [ ] Orchestrator updates all task checkboxes after verification passes

### During Implementation
- [ ] Code follows established patterns and standards (especially `docs/frontend/ui-shared-scaffold-pattern.md`)
- [ ] Existing tests are updated when aggressive consolidation changes behavior (per REQ-11)
- [ ] Error handling and edge cases are considered
- [ ] Code is documented with clear comments

### Before Completion Each Task
- [ ] All acceptance criteria are met
- [ ] Tests pass and coverage is adequate
- [ ] **Quality Loop passed** (tsgo + biome:check + lint queue on modified files)
- [ ] Integration with existing code is verified
- [ ] Cross-tier import check passed (no desktop↔mobile or common↔tier-specific imports)

### Task Completion
- [ ] Feature works as specified in requirements
- [ ] No regressions in existing functionality (or documented behavioral changes per REQ-11)
- [ ] Documentation is updated if needed
- [ ] Task is marked as complete in `tasks.md` (`[ ]` -> `[x]`)
- [ ] Outcome file written to `.ai/plans/duplications-phase2/outcome/<task-id>-outcome.md`
- [ ] Any deferred items logged in `deferred-items.md`
