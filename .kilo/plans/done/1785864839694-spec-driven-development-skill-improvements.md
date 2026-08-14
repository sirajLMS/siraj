# Plan: Spec-Driven Development Skill & Guide Improvements

## Executive Summary

Based on retrospectives and outcome observations from four major feature implementations (`auto-meeting-url`, `cron`, `quota`, and `whatsapp`), this plan outlines a comprehensive proposal to upgrade the `spec-driven-development` skill (`.agents/skills/spec-driven-development/SKILL.md`) and its associated guide/template ecosystem (`.agents/spec-process-guide/`).

The goal is to transform the skill from a 3-phase planning tool into a robust, end-to-end development lifecycle methodology that prevents defect propagation, eliminates silent technical debt, catches race conditions and type cascades early, and ensures seamless knowledge propagation.

---

## Key Observation Principles & Proposed Changes

### 1. Pre-Implementation Baseline & Pre-Execution Plan Review (Phase 0 & Phase 1.5)
- **Pre-Implementation Baseline (Task 0)**: Establish baseline error counts (`tsgo`, `biome`, `lint`) prior to starting feature implementation to distinguish pre-existing errors from new ones.
- **Phase 1.5: Plan Review Gate**: Require a parallel subagent plan review (using `/plan-review` or multi-perspective review subagents) after `tasks.md` is drafted and before implementation begins. This catches route errors, permissions gaps, i18n namespace mismatches, and component path bugs in the spec phase rather than during coding.
- **New Template**: Create `.agents/spec-process-guide/templates/plan-review-template.md` for structured plan review reporting.

### 2. Semantic Review & Deferred-Items Ledger in Task Execution (Phase 3)
- **Expanded Per-Task Quality Loop**: Standard quality gates (`tsgo` + `biome` + `lint-queue`) catch syntax and formatting but miss semantic bugs. Expand the per-task loop with a **Semantic Review Checklist** covering:
  - Bounded size on module-level state / caches
  - Atomic read-then-write operations (`SELECT FOR UPDATE`, transactions, advisory locks)
  - Full `env-config-keys.ts` registration for any `resolveEnvConfig` call
  - Complete cache invalidation keys in reset functions
  - Correct enum import syntax (`import { Enum }` for runtime usage vs `import type` for type annotations)
- **Deferred-Items Ledger**: Require a central tracking file (`.ai/plans/<feature>/deferred-items.md`) initialized at plan start. Any task deferring work must log an entry; final quality gates block if any item remains unresolved.
- **New Template**: Create `.agents/spec-process-guide/templates/deferred-items-template.md`.
- **Interleaved Testing**: Mandate that unit and integration tests are authored alongside component/service implementation, rather than serialized at the end of the feature.

### 3. Phase Boundaries & Mid-Point Review Gates
- **Phase-Boundary Type Coherence Gate**: Require a full `bun tsgo` project check at phase boundaries (e.g., between Repository Layer and Service Layer) to catch cross-file type cascades early.
- **Mid-Point Review Gate**: Require an architectural/security check after completing core backend foundations and before frontend/webhook implementation.

### 4. Post-Implementation Review & Fix Cycles (Phase 4)
- **Parallel Review Waves**: Formalize the Review Wave pattern (dispatching specialized verification subagents across orthogonal dimensions like paths, i18n, GraphQL, component props, permissions/enums, architecture, and cross-references).
- **Scope Boundary Enforcement**: Distinguish between in-scope files (created/modified by the feature plan) and pre-existing codebase files during reviews to prevent finding-count scope creep.
- **Dynamic Lint Queue Port & Instruction Directory Resolution**:
  - Dynamically discover lint queue port (`export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)`).
  - Auto-detect instruction file path (`.github/instructions/*.md` or `.agents/instructions/*.md`).

### 5. Standards & Conventions Hardening Across Templates
- **Compile-Time i18n Property Access**: Standardize `useAppTranslation(Translation.Dashboard.X)` enum property access across all requirements, design, and task templates.
- **Drizzle Anti-Patterns**: Explicitly document Drizzle SQL template rules (e.g., NEVER use inline `--` comments inside `sql`` templates as they shift parameter bindings).
- **Standardized Outcome Naming**: Standardize file naming under `.ai/plans/<feature>/outcome/<task-id>-<slug>-outcome.md`.
- **Knowledge Propagation Protocol**: Mandate an Outcome Synthesis Protocol at plan completion to create/update canonical docs in `docs/<domain>/` and update layer `AGENTS.md` files.

---

## Affected Files & Boundaries

### Skill Files
- `.agents/skills/spec-driven-development/SKILL.md` (Main skill file update)

### Template Files (`.agents/spec-process-guide/templates/`)
- `requirements-template.md` (Updated with i18n enum property access, role matrix standards, pre-implementation checklist)
- `design-template.md` (Updated with UX/Navigation spec enhancements, compile-time i18n, concurrency assessment section)
- `tasks-template.md` (Updated with Phase 0 baseline task, Phase 1.5 plan review, semantic review checklist, Phase-Boundary type coherence gates, deferred-items ledger, knowledge propagation protocol)
- `checklists.md` (Updated with Enum import guidance, Semantic review checklist, Race condition review, Scope boundary rules)
- `plan-review-template.md` (NEW file — Plan Review Report template)
- `deferred-items-template.md` (NEW file — Technical Debt & Deferred Items Ledger template)

### Process & Execution Guides (`.agents/spec-process-guide/`)
- `process/requirements-phase.md` (Updated to cover new i18n & EARS standards)
- `process/design-phase.md` (Updated with Concurrency Assessment & Plan Review Gate)
- `process/tasks-phase.md` (Updated with Phase 0 baseline, Type Coherence Gates, Deferred Items, Test Interleaving)
- `execution/implementation-guide.md` (Updated with expanded Quality Loop & Semantic Review Checklist)
- `execution/quality-assurance.md` (Updated with Review Wave pattern, Scope Boundary enforcement, Outcome Synthesis)
- `NAVIGATION.md` & `README.md` (Updated navigation index to list new templates and process steps)

---

## Action Plan: Execution Tasks

### Task 1: Create New Templates
- [ ] **1.1 Create `plan-review-template.md`**
  - Define structure for Plan Review Reports: round number, date, subagent dispatches, findings by dimension, fix subagent tracking, post-fix verification, and lessons learned.
- [ ] **1.2 Create `deferred-items-template.md`**
  - Define ledger structure for tracking deferred tasks/items: Deferred Item, Origin Task, Target Task, Status, Verified By.

### Task 2: Update Core Skill Definition (`SKILL.md`)
- [ ] **2.1 Update Lifecycle Workflow in `SKILL.md`**
  - Add Phase 0 (Pre-Implementation Baseline), Phase 1.5 (Plan Review Gate), Phase 4 (Post-Implementation Parallel Review Waves), and Phase 5 (Outcome Synthesis & Knowledge Propagation).
- [ ] **2.2 Add Parallel Review Wave Pattern**
  - Include 8-dimension review dispatch model, findings synthesis, single-file fix subagents, and post-fix verification.
- [ ] **2.3 Add Expanded Quality Loop & Semantic Review Checklist**
  - Document `tsgo → biome → lint-queue → semantic-review-checklist` loop.
  - Document dynamic port discovery and instruction path auto-detection.
- [ ] **2.4 Add Outcome Synthesis & Knowledge Propagation Protocol**
  - Detail rules for extracting recurring patterns from outcome files into `docs/<domain>/`, layer `AGENTS.md`, and instruction files.

### Task 3: Update Process Templates (`.agents/spec-process-guide/templates/`)
- [ ] **3.1 Update `requirements-template.md`**
  - Add Requirement 0 enhancements (Deferred items ledger, Baseline check).
  - Update i18n requirements to use `Translation.Dashboard.X` enum property access.
  - Anchor Role-Based Access Matrix to seed file references.
- [ ] **3.2 Update `design-template.md`**
  - Add Concurrency Assessment section (for shared state, `SELECT FOR UPDATE`, atomic transactions).
  - Update UX/Navigation section with strict i18n property access and exact permission strings.
  - Add Drizzle SQL template anti-pattern warnings.
- [ ] **3.3 Update `tasks-template.md`**
  - Add Task 0 (Pre-Implementation Baseline).
  - Add Task 1.5 (Plan Review Gate).
  - Add Phase-Boundary Type Coherence Gates (`bun tsgo` project-wide).
  - Add Deferred-Items Ledger verification task before final sign-off.
  - Update Knowledge Propagation task template.
- [ ] **3.4 Update `checklists.md`**
  - Add Enum Import Checklist (`import { Enum }` value vs `import type`).
  - Add Semantic Review Checklist (mutable state, atomic operations, env-config registration, cache invalidation).
  - Add Race Condition & Dead Code Checklists.
  - Add Scope Boundary Enforcement rules for review waves.

### Task 4: Update Process & Execution Guides
- [ ] **4.1 Update `process/` Guides (`requirements-phase.md`, `design-phase.md`, `tasks-phase.md`)**
  - Align phase guides with new Plan Review phase, Concurrency Assessment, and Type Coherence Gates.
- [ ] **4.2 Update `execution/` Guides (`implementation-guide.md`, `quality-assurance.md`)**
  - Detail the expanded quality loop, dynamic port discovery, test interleaving, parallel review waves, and outcome synthesis.
- [ ] **4.3 Update `NAVIGATION.md` & `README.md`**
  - Update index and navigation paths to include `plan-review-template.md` and `deferred-items-template.md`.

### Task 5: Quality Gate & Consistency Verification
- [ ] **5.1 Verify Markdown Links & Structural Consistency**
  - Ensure all cross-references across templates and guides resolve correctly.
- [ ] **5.2 Validate Skill Compatibility**
  - Verify `.agents/skills/spec-driven-development/SKILL.md` is valid and well-formatted.

---

## Validation Plan

1. **Link & Reference Check**: Verify all relative links between `SKILL.md`, `NAVIGATION.md`, and files under `.agents/spec-process-guide/` exist and are valid.
2. **Template Completeness Audit**: Verify that `requirements-template.md`, `design-template.md`, and `tasks-template.md` contain all new required sections (Task 0 baseline, Task 1.5 plan review, compile-time i18n property access, semantic review checklist, deferred items ledger, phase type coherence gate, knowledge propagation).
3. **i18n Consistency Verification**: Confirm that all code snippets in the guide and templates strictly use `useAppTranslation(Translation.Dashboard.X)` enum property access and forbid legacy string literal call patterns.
