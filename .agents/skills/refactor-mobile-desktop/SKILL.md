---
name: refactor-mobile-desktop
description: >
  Refactor an existing page to the new Mobile/Desktop isolation architecture.
  Creates a per-page plan (spec.md, plan.md, tasks.md) under .ai/plans/xxx/,
  updates the REFACTOR-TRACKER.md assist file, and guides the migration
  through ViewModel extraction, tier separation, and Zustand state migration.
  No scripts — all LLM-based model editing.
---

# Refactor Page to Mobile/Desktop Architecture

## Overview

This skill refactors ONE page from the legacy architecture (single component with inline `useMediaQuery` or `XxMobileView`/`XxDesktopView` files) to the new strict Mobile/Desktop isolation architecture:

- **New directory structure**: `mobile/`, `desktop/`, `shared/` subdirectories
- **New naming**: `.mobile.tsx`, `.desktop.tsx` suffixes
- **ViewModel hook**: `useXxViewModel.ts` with all business logic
- **Switcher**: `xxView.tsx` as the ONLY viewport consumer
- **Zustand state migration**: All state to stores (survives tier switch)
- **ESLint compliance**: No `useMediaQuery`/`useViewport` in versioned files

## Prerequisites

- `.agents/instructions/mobile-desktop.instructions.md` must exist
- ESLint rules in `eslint.config.mjs` must be active (Phase 0 complete)
- `frontend/components/ui/` shared mobile components must exist (Phase 2 complete)
- Viewport context (`useViewport`, `ViewportProvider`) must be wired (Phase 1 complete)

## Workflow

### Phase 1: Analyze & Plan (Creates per-page plan)

1. **Identify target page** — user provides the page path (e.g., `frontend/views/dashboard/resources/ResourcesView.tsx`)
2. **Analyze existing structure**:
   - Locate Container, View, MobileView, DesktopView files
   - Find all `useMediaQuery` calls in the tree
   - Identify all `useState`/`useReducer` that hold state needing persistence
   - Locate Zustand stores in use
   - Map component tree (what goes mobile vs desktop vs shared)
3. **Create per-page plan** at `.ai/plans/<feature-name>/` with:
   - `spec.md` — specification (problem, scope, acceptance criteria, locked decisions)
   - `plan.md` — implementation phases with exact file paths, line numbers, edits
   - `tasks.md` — checkbox tracking (T{phase}.{n} format, maps 1:1 to plan.md)
4. **Update REFACTOR-TRACKER.md** — mark page as `[~] in progress`

### Phase 2: Execute Migration (Per plan.md)

For each phase in the plan:
1. Read the phase instructions and relevant AGENTS.md/instruction files
2. Execute the edits (model-based, no scripts)
3. Run per-file verification: `bun tsgo` → `bun biome:check` → lint-queue on changed files
4. Update `tasks.md` checkboxes `[x]` after verification passes
5. Commit if requested (via `commit-scoped` skill)

### Phase 3: Verify & Complete

1. Full quality gate on changed files
2. Update REFACTOR-TRACKER.md — mark `[x] done`
3. Report summary

## Per-Page Plan Structure

Each page gets `.ai/plans/<feature-name>/`:

```
.ai/plans/<feature-name>/
  spec.md          # Specification
  plan.md          # Phased implementation with file: Phase 1..N
  tasks.md         # Checkboxes T1.1, T1.2, T2.1... mapping to plan.md
```

**`spec.md` template:**
```markdown
# <Feature> Mobile/Desktop Migration — Spec

**Status**: In Progress
**Target**: <path to target View.tsx>
**Parent**: .ai/plans/mobile-reusable-components.md
**Prerequisite**: Phase 0 (ESLint), Phase 1 (Viewport Context), Phase 2 (Shared Components)

## 1. Problem
Brief: what legacy pattern exists, what breaks

## 2. Scope (IN)
- File tree of what will be created/moved/deleted
- Per-layer table (ViewModel, Mobile, Desktop, Shared, Store, Container)

## 3. Scope (OUT)
- What is NOT touched

## 4. Locked Decisions
- ViewModel hook name
- Zustand store to extend (or new)
- Which shared components to use (MobileCardList, MobilePageHeader, etc.)
- Breakpoint (isMobile = tier mobile|tablet)

## 5. Acceptance Criteria
- tsgo clean on all new/modified files
- biome:check clean
- lint-queue passes
- ESLint: no cross-tier imports, no useMediaQuery in versioned files
- State survives resize (manual test)
- Storybook stories for new mobile/desktop views

## 6. Governing Rules
- AGENTS.md: frontend/, frontend/views/, frontend/stores/, frontend/components/ui/
- Instructions: .agents/instructions/mobile-desktop.instructions.md, frontend.instructions.md
- Lint queue client (NEVER bun lint directly)
```

**`plan.md` template:**
```markdown
# <Feature> Mobile/Desktop Migration — Plan

**Spec**: ./spec.md
**Strategy**: Extract ViewModel → Split tiers → Migrate state → Wire switcher
**Sequence**: Phase 1..N (strict order, no interleaving)

## Phase 1 — ViewModel Hook Extraction
**Goal**: Create useXxViewModel.ts with all business logic

### Files
| File | Action | Lines | Description |
|------|--------|-------|-------------|
| useXxViewModel.ts | CREATE | - | New hook extracting all logic from current View/Container |
| XxContainer.tsx | EDIT | <line> | Replace inline logic with hook call, pass viewModel to XxView |

### Edits
- <exact edit table with Old/New per file>

### Verify
- tsgo on useXxViewModel.ts
- biome:check
- lint-queue

## Phase 2 — Mobile View Creation
**Goal**: Create mobile/ directory with .mobile.tsx files using shared components

### Files
| File | Action | Lines | Description |
|------|--------|-------|-------------|
| mobile/xx.mobile.tsx | CREATE | - | Pure mobile presentation, uses MobilePageHeader, MobileContentStack, MobileCardList... |
| mobile/components/xxCard.mobile.tsx | CREATE | - | Domain-specific card content (from old MobileView/CardList) |

### Edits
- <exact edit table>

### Verify
- tsgo, biome, lint-queue

## Phase 3 — Desktop View Creation/Refactor
**Goal**: Create desktop/ directory, ensure no useMediaQuery, uses Grid/SectionPanel/AppDataGrid

...

## Phase 4 — Shared Components Extraction
**Goal**: Move truly viewport-agnostic primitives to shared/

...

## Phase 5 — Switcher & Container Wiring
**Goal**: xxView.tsx becomes thin switcher using ResponsiveViewSwitch; Container passes viewModel

...

## Phase 6 — Zustand State Migration
**Goal**: Move all useState from View/Container to Zustand store; File -> useRef in hook

...

## Phase 7 — Cleanup & ESLint Verification
**Goal**: Remove old *MobileView.tsx/*DesktopView.tsx files (rename to .bak), verify ESLint clean

...

## Phase 8 — Storybook & Tests
**Goal**: Add stories for mobile/desktop views; update test wrapper if needed
```

**`tasks.md` template:**
```markdown
# <Feature> Mobile/Desktop Migration — Tasks

**Spec**: ./spec.md — **Plan**: ./plan.md
**Tracking**: checkboxes map 1:1 to plan.md phases. Mark `[x]` only after per-file verification (tsgo → biome → lint-queue) passes.

**Lint queue**: ALWAYS go through lint queue server/client — NEVER `bun lint` directly.
```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
```

**Rule files per phase** (read ALL before editing):
| Phase | Layer | Mandatory rule files |
|-------|-------|---------------------|
| 1 | Hook/ViewModel | `AGENTS.md` `frontend/views/AGENTS.md` `.agents/instructions/mobile-desktop.instructions.md` `frontend.instructions.md` (Apollo & GraphQL) |
| 2 | Mobile View | `AGENTS.md` `frontend/components/ui/AGENTS.md` `frontend/views/AGENTS.md` `.agents/instructions/mobile-desktop.instructions.md` |
| 3 | Desktop View | `AGENTS.md` `frontend/views/AGENTS.md` `.agents/instructions/mobile-desktop.instructions.md` |
| 4 | Shared | `AGENTS.md` `frontend/components/ui/AGENTS.md` |
| 5 | Switcher/Container | `AGENTS.md` `frontend/views/AGENTS.md` |
| 6 | Store | `AGENTS.md` `frontend/stores/AGENTS.md` `.agents/instructions/mobile-desktop.instructions.md` |
| 7 | Cleanup | `AGENTS.md` `eslint.config.mjs` (verify rules) |
| 8 | Storybook | `AGENTS.md` `frontend/views/AGENTS.md` (Storybook Best Practices) |

---

## Phase 1 — ViewModel Hook Extraction
- [ ] **T1.1** Create useXxViewModel.ts with <specific items>
- [ ] **T1.2** Edit XxContainer.tsx to call hook and pass to XxView
- [ ] **T1.3** Verify: tsgo + biome + lint-queue on touched files

## Phase 2 — Mobile View Creation
- [ ] **T2.1** Create mobile/xx.mobile.tsx
- [ ] **T2.2** Create mobile/components/xxCard.mobile.tsx
- [ ] **T2.3** Verify...

...

## Phase N — ...
```

## REFACTOR-TRACKER.md Assist File

Located at `.agents/skills/refactor-mobile-desktop/REFACTOR-TRACKER.md`

Format:
```markdown
# Mobile/Desktop Refactor Tracker

| Page | Status | Plan Dir | Started | Completed |
|------|--------|----------|---------|-----------|
| Resources | [ ] not started | .ai/plans/resources/ | - | - |
| Reports | [ ] not started | .ai/plans/reports/ | - | - |
| Students | [ ] not started | .ai/plans/students/ | - | - |
| AdminComplaints | [ ] not started | .ai/plans/admin-complaints/ | - | - |
| ParentComplaints | [ ] not started | .ai/plans/parent-complaints/ | - | - |
| AdminBilling | [ ] not started | .ai/plans/admin-billing/ | - | - |
| UserBillingProfile | [ ] not started | .ai/plans/user-billing-profile/ | - | - |
| ParentBilling | [ ] not started | .ai/plans/parent-billing/ | - | - |
| ManualInvoice | [ ] not started | .ai/plans/manual-invoice/ | - | - |
| AdminSuggestions | [ ] not started | .ai/plans/admin-suggestions/ | - | - |
| ParentSuggestions | [ ] not started | .ai/plans/parent-suggestions/ | - | - |
| ScheduleOverview (Admin Dashboard) | [ ] not started | .ai/plans/schedule-overview/ | - | - |
| TeacherDashboard | [ ] not started | .ai/plans/teacher-dashboard/ | - | - |
| ParentDashboard | [ ] not started | .ai/plans/parent-dashboard/ | - | - |
| ScheduleOverviewSection | [ ] not started | .ai/plans/schedule-overview-section/ | - | - |
| DateNavigator | [ ] not started | .ai/plans/date-navigator/ | - | - |
| LocalizedStringDrawer | [ ] not started | .ai/plans/localized-string-drawer/ | - | - |
| SearchScheduleFilterDrawer | [ ] not started | .ai/plans/search-schedule-filter-drawer/ | - | - |
| ParentsView | [ ] not started | .ai/plans/parents-view/ | - | - |
| ScheduleAlertsView | [ ] not started | .ai/plans/schedule-alerts/ | - | - |
| ScheduleAlertBanners | [ ] not started | .ai/plans/schedule-alert-banners/ | - | - |
| InstitutionalReportCard | [ ] not started | .ai/plans/institutional-report-card/ | - | - |
| DstMigrationView | [ ] not started | .ai/plans/dst-migration/ | - | - |
| UpdatedSessionsSection | [ ] not started | .ai/plans/updated-sessions/ | - | - |
| FutureScheduleView | [ ] not started | .ai/plans/future-schedule/ | - | - |
| JumpToDateHeader | [ ] not started | .ai/plans/jump-to-date-header/ | - | - |
| FutureClassCard | [ ] not started | .ai/plans/future-class-card/ | - | - |
| CreateRecurringClassView | [ ] not started | .ai/plans/create-recurring-class/ | - | - |
| UpcomingClassesTable | [ ] not started | .ai/plans/upcoming-classes-table/ | - | - |
| StudentStatusHeader | [ ] not started | .ai/plans/student-status-header/ | - | - |
| OnlineMeetingCard | [ ] not started | .ai/plans/online-meeting-card/ | - | - |
| CommunicationLogCard | [ ] not started | .ai/plans/communication-log-card/ | - | - |
| ClassAuditView | [ ] not started | .ai/plans/class-audit/ | - | - |
| AdminNoteCard | [ ] not started | .ai/plans/admin-note-card/ | - | - |
| RescheduleTrackingView | [ ] not started | .ai/plans/reschedule-tracking/ | - | - |
| TeacherAvailabilityView | [ ] not started | .ai/plans/teacher-availability/ | - | - |
| PermissionManagementView | [ ] not started | .ai/plans/permission-management/ | - | - |
| PermissionCatalogSection | [ ] not started | .ai/plans/permission-catalog/ | - | - |
| NotificationPreferencesTab | [ ] not started | .ai/plans/notification-preferences/ | - | - |
| RescheduleView | [ ] not started | .ai/plans/reschedule/ | - | - |
| TeacherReassignmentView | [ ] not started | .ai/plans/teacher-reassignment/ | - | - |
| ManagersView | [ ] not started | .ai/plans/managers/ | - | - |
| TeacherWeeklyScheduleView | [ ] not started | .ai/plans/teacher-weekly-schedule/ | - | - |
| ClassDetailsContainer | [ ] not started | .ai/plans/class-details-container/ | - | - |
| SubjectsView | [ ] not started | .ai/plans/subjects/ | - | - |
| LocaleAdornmentSwitch | [ ] not started | .ai/plans/locale-adornment-switch/ | - | - |
| StatusTrackingDataGrid | [ ] not started | .ai/plans/status-tracking-datagrid/ | - | - |
```

**Status codes**: `[ ]` not started, `[~]` in progress, `[x]` done

**Skill updates this file** after each page:
- On start: change `[ ]` → `[~]`, fill Started date
- On complete: change `[~]` → `[x]`, fill Completed date

## ESLint Verification Checklist (per page)

After migration, verify:
- [ ] No `useMediaQuery` imports in any `.mobile.tsx`/`.desktop.tsx`
- [ ] No `useViewport`/`ViewportContext` imports in any `.mobile.tsx`/`.desktop.tsx`
- [ ] No cross-tier imports (`.mobile` importing `.desktop` or vice versa)
- [ ] `ResponsiveViewSwitch` is the ONLY shared component importing `useViewport`
- [ ] `View.tsx` switcher is the ONLY page-level file importing `useViewport`
- [ ] All `File`/`Blob` state in `useRef` in ViewModel hook, not Zustand

## Quality Gates (per page)

- [ ] `bun tsgo` clean on all new/modified files
- [ ] `bun biome:check` clean
- [ ] Lint queue passes on all new/modified files
- [ ] `bun quality-gate` passes (or at least BASIC_CHECKS)
- [ ] Manual resize test: state survives desktop→mobile→desktop
- [ ] Storybook stories render in all 3 viewport globals
```

## Interactive Questions

Before starting, ask the user:

1. **Target page**: "Which page/view to refactor? (e.g., `frontend/views/dashboard/resources/ResourcesView.tsx`)"
2. **Scope**: "Full migration (all phases) or partial (e.g., only ViewModel + Mobile)?"
3. **Zustand store**: "Which store to extend? (e.g., `useResourcesStore`) or create new?"
4. **Shared components**: "Which shared mobile components to use? (MobileCardList, MobilePageHeader, MobileContentStack, MobileMetricCardGrid, MobileFab, MobileEmptyState)"
5. **Bak retention**: "Confirm: old *MobileView.tsx/*DesktopView.tsx renamed to .bak, NOT deleted?"

Then proceed to Phase 1 (plan creation).

## Output

- Per-page plan directory under `.ai/plans/<feature-name>/` with `spec.md`, `plan.md`, `tasks.md`
- Updated `REFACTOR-TRACKER.md` with `[~]` status
- Verification reports for each phase
- Final summary with all quality gate results