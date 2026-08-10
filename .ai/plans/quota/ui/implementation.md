# Quota UI Production-Readiness Plan — Implementation Guide

**Version**: 2.0
**Date**: 2026-08-10

---

## Parallel Execution Strategy (Subagent Waves)

The plan is organized into **6 execution waves**. Within each wave, tasks are dispatched as **parallel subagents** — one per task (or per file group). No cross-wave interleaving: each wave must fully complete before the next begins.

### Wave 0 — Foundation (Sequential, Blocking)

All i18n keys and schema/type definitions must exist before any tier view work begins. These tasks share locale files and are tightly coupled — dispatch as a single subagent.

| Subagent | Tasks | Files | Lifecycle |
|---|---|---|---|
| `wave0-foundation` | 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2 | `shared/locale/{types,en,ar}/dashboard/billing/quota.ts`, `shared/locale/{types,en,ar}/dashboard/students/quota.ts`, `frontend/common/views/dashboard/billing/quota/schemas/quotaSchema.ts`, `frontend/common/views/dashboard/billing/quota/types/quotaForm.types.ts` | `--lifecycle codescene` |

**Gate**: All i18n keys + schema + types must pass `--lifecycle codescene` before Wave 1 starts.

---

### Wave 1 — Tier Views (4 Parallel Subagents)

Each billing quota view tier (List, Form, Detail, Insights) is independent — they touch separate file sets. Dispatch all 4 in parallel.

| Subagent | Tasks | Files | Lifecycle | Blocked By |
|---|---|---|---|---|
| `wave1-list` | 3.1, 3.2, 3.3, 3.4, 3.5 | `frontend/desktop/views/dashboard/billing/quota/quotaList.desktop.tsx`, `QuotaListDesktopActions.tsx`, `frontend/mobile/views/dashboard/billing/quota/quotaList.mobile.tsx`, `QuotaListItemMobile.tsx`, `QuotaContainer.tsx`, `useQuotaViewModel.ts`, `quotaStore.ts`, `StatusBadge.tsx` | `--lifecycle codescene` | Wave 0 |
| `wave1-form` | 4.1, 4.2, 4.3, 4.4 | `frontend/desktop/views/dashboard/billing/quota/quotaForm.desktop.tsx`, `QuotaFormSectionDesktop.tsx`, `frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile.tsx`, `QuotaFormSectionMobile.tsx`, `QuotaFormContainer.tsx`, `useQuotaFormViewModel.ts` | `--lifecycle codescene` | Wave 0 |
| `wave1-detail` | 5.1, 5.2, 5.3, 5.4 | `frontend/desktop/views/dashboard/billing/quota/quotaDetail.desktop.tsx`, `QuotaDetailSummaryDesktop.tsx`, `frontend/mobile/views/dashboard/billing/quota/quotaDetail.mobile.tsx`, `QuotaDetailSummaryMobile.tsx`, `QuotaDetailContainer.tsx`, `useQuotaDetailViewModel.ts` | `--lifecycle codescene` | Wave 0 |
| `wave1-insights` | 6.1, 6.2, 6.3, 6.4 | `frontend/desktop/views/dashboard/billing/quota/quotaInsights.desktop.tsx`, `QuotaInsightsChartsDesktop.tsx`, `frontend/mobile/views/dashboard/billing/quota/quotaInsights.mobile.tsx`, `QuotaInsightsChartsMobile.tsx`, `QuotaInsightsContainer.tsx`, `useQuotaInsightsViewModel.ts` | `--lifecycle codescene` | Wave 0 |

**Gate**: All 4 billing tier view groups must pass `--lifecycle codescene` before Wave 2.

---

### Wave 2 — Cross-Cutting Features (4 Parallel Subagents)

Navigation, audience views, recurring dialog, and role-based access can all proceed in parallel. They touch different parts of the codebase.

| Subagent | Tasks | Files | Lifecycle | Blocked By |
|---|---|---|---|---|
| `wave2-navigation` | 7.1, 7.2, 7.3, 7.4, 7.5 | Tier view files (breadcrumbs), `navigationConfig.ts`, dashboard components, `app/(dashboard)/quotas/loading.tsx`, `error.tsx`, `[id]/not-found.tsx` | `--lifecycle codescene` | Wave 1 (most), Wave 0 (some) |
| `wave2-audience` | 8.1, 8.2, 8.3, 8.4 | `frontend/common/views/dashboard/students/quota/audience/*.tsx` | `--lifecycle codescene` | Wave 0 (i18n only) |
| `wave2-dialog` | 9.1 | Recurring class dialog component (TBD) | `--lifecycle codescene` | Wave 0 (i18n) |
| `wave2-rbac` | 16.1, 16.2, 16.3 | `QuotaFormAccessProvider.tsx`, audience views, `navigationConfig.ts` | `--lifecycle codescene` | Wave 1 (form), Wave 2-audience |

> **Note**: `wave2-rbac` has an intra-wave dependency on `wave2-audience` for task 16.2. Dispatch `wave2-audience` first; once 8.1–8.4 are done, dispatch `wave2-rbac` (16.1 + 16.3 can start immediately in parallel with 16.2 waiting for audience).

**Gate**: All Wave 2 tasks must pass `--lifecycle codescene` before Wave 3.

---

### Wave 3 — Quality Compliance (3 Parallel Subagents)

Accessibility, design system, and animation compliance all modify the tier view files created in Wave 1. They are orthogonal focus areas but touch overlapping files — coordinate by assigning each subagent a non-overlapping set of files within its concern.

| Subagent | Tasks | Files | Lifecycle | Blocked By |
|---|---|---|---|---|
| `wave3-a11y` | 10.1–10.5 | All quota tier view files (ARIA, keyboard, contrast) | `--lifecycle codescene` | Wave 1, Wave 2 |
| `wave3-design` | 11.1–11.5 | All quota frontend files (palette, StatusBadge, MetricCardGrid, icons, typography) | `--lifecycle codescene` | Wave 1 |
| `wave3-anim` | 12.1–12.3 | Quota tier files (transitions, reduced-motion, CodeScene LOC check) | `--lifecycle codescene` | Wave 1 |

> **Conflict resolution**: These 3 subagents touch overlapping files. If file conflicts arise, serialize them: run `wave3-design` first, then `wave3-anim`, then `wave3-a11y`. The sub-loop `--lifecycle codescene` will catch any regressions introduced by the previous subagent.

**Gate**: All Wave 3 tasks must pass `--lifecycle codescene` before Wave 4.

---

### Wave 4 — Tests & Storybook (3 Parallel Subagents)

Storybook stories, component tests, and E2E tests all depend on the completed tier views but are independent of each other.

| Subagent | Tasks | Files | Lifecycle | Blocked By |
|---|---|---|---|---|
| `wave4-storybook` | 13.1–13.5 | `frontend/common/views/dashboard/billing/quota/*.stories.tsx`, audience `*.stories.tsx` | `--lifecycle codescene` | Wave 1, Wave 2 |
| `wave4-component` | 14.1–14.5 | `test/ui/components/quota/*.test.tsx` | `--lifecycle codescene` | Wave 1, Wave 2, Wave 3 |
| `wave4-graphql` | 17.1 (→16.1 in tasks) | `useQuotaFormViewModel.ts`, `useQuotaDetailViewModel.ts` (cache update functions) | `--lifecycle codescene` | Wave 1 (form + detail VMs) |

> **E2E Tests (Task 15.1)**: Must be dispatched AFTER Wave 4 (component tests) and requires `bun run build:test` as a prerequisite. Dispatch as a sequential step after Wave 4 completes.

**Gate**: All Wave 4 tasks must pass `--lifecycle codescene`. E2E (15.1) must pass after `build:test`.

---

### Wave 5 — Documentation (1 Subagent)

Documentation wraps up the plan. Dispatch after all code work is verified.

| Subagent | Tasks | Files | Lifecycle | Blocked By |
|---|---|---|---|---|
| `wave5-docs` | 18.1, 18.2 | `docs/frontend/quota-ui-patterns.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `AGENTS.md` | `--lifecycle codescene` | All waves |

---

### Dependency Graph Summary

```
Wave 0 (Foundation)
  │
  ├──► Wave 1a (List)   ──┐
  ├──► Wave 1b (Form)   ──┤
  ├──► Wave 1c (Detail) ──┤──► Wave 2 (Nav, Audience, Dialog, RBAC) ──► Wave 3 (A11y, Design, Anim)
  └──► Wave 1d (Insights)─┘                                              │
                                                                          ├──► Wave 4 (Storybook, Component Tests, GraphQL Cache)
                                                                          │     │
                                                                          │     └──► E2E Tests (15.1)
                                                                          │
                                                                          └──► Wave 5 (Documentation)
```

### Parallel Execution Rules

1. **One subagent per task group** within each wave — maximum parallelism without file conflicts
2. **Each subagent must run** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on every file it creates/modifies BEFORE completing
3. **No cross-wave interleaving** — all subagents in a wave must complete before the next wave begins
4. **Subagent isolation** — each subagent is assigned explicit file boundaries; it must NOT modify files outside its scope (report cross-file dependencies instead)
5. **Conflict detection** — if two subagents in the same wave touch the same file, serialize them within the wave and re-run `--lifecycle codescene` between serial executions
6. **Gate verification** — after each wave, run `bun tsgo` globally to catch any cross-file type regressions before proceeding

---

## Quality Loop Commands

After creating/modifying ANY file, run the sub-loop script with `--lifecycle codescene`. It handles tsgo → biome → oxlint → lint:type-aware → check:duplicates → codescene progressively, short-circuits at the first failing check, and auto-discovers applicable AGENTS.md + instruction files.

```bash
# Run sub-loop on a single file (recommended for all tasks):
bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene
```

Fix ALL errors before proceeding to the next file/subtask.

---

## Instruction File Mapping

### Layer AGENTS.md Files

| File Path Pattern | AGENTS.md Files to Read |
|---|---|
| `frontend/**/*.ts(x)` | `AGENTS.md` (root), `frontend/AGENTS.md` |
| `frontend/views/**/*.ts(x)` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/desktop/**/*.ts(x)` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/mobile/**/*.ts(x)` | `AGENTS.md`, `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| `frontend/common/**/*.ts(x)` | `AGENTS.md`, `frontend/AGENTS.md` |
| `frontend/common/stores/**/*.ts(x)` | `AGENTS.md`, `frontend/AGENTS.md` |
| `shared/**/*.ts` | `AGENTS.md`, `shared/AGENTS.md` |
| `app/**/*.ts(x)` | `AGENTS.md`, `app/AGENTS.md` |
| `test/ui/**/*.ts(x)` | `AGENTS.md`, `test/ui/AGENTS.md` |

### Instruction Files

| File Path Pattern | Instruction File |
|---|---|
| `frontend/**/*.ts(x)`, `app/**/*.ts(x)` | `.agents/instructions/frontend.instructions.md` |
| `frontend/desktop/**`, `frontend/mobile/**` | `.agents/instructions/mobile-desktop.instructions.md` |
| `**/*.test.ts(x)`, `**/*.spec.ts(x)` | `.agents/instructions/tests.instructions.md` |

### Task-to-Instructions Mapping

| Task Group | AGENTS.md Files | Instruction Files |
|---|---|---|
| 1 (i18n) | `shared/AGENTS.md` | `frontend.instructions.md` |
| 2 (Schema) | `frontend/AGENTS.md` | `frontend.instructions.md` |
| 3 (List Tier) | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| 4 (Form Tier) | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| 5 (Detail Tier) | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| 6 (Insights Tier) | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md`, `mobile-desktop.instructions.md` |
| 7 (Navigation) | `frontend/AGENTS.md`, `app/AGENTS.md` | `frontend.instructions.md` |
| 8 (Audience) | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| 9 (Dialog) | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | `frontend.instructions.md` |
| 10 (Accessibility) | `frontend/AGENTS.md` | `frontend.instructions.md` |
| 11 (Design System) | `frontend/AGENTS.md` | `frontend.instructions.md` |
| 12 (Animation) | `frontend/AGENTS.md` | `frontend.instructions.md` |
| 13 (Storybook) | `frontend/AGENTS.md` | `frontend.instructions.md` |
| 14 (Component Tests) | `test/ui/AGENTS.md` | `tests.instructions.md` |
| 15 (E2E Tests) | `test/ui/AGENTS.md` | `tests.instructions.md` |
| 16 (Role-Based Access) | `frontend/AGENTS.md` | `frontend.instructions.md` |
| 17 (GraphQL Cache) | `frontend/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | `frontend.instructions.md` |
| 18 (Knowledge Propagation) | `AGENTS.md` (root) | — |

---

## Key Patterns Reference

### Container → ViewModel → Switcher → Tier

```
Container (common)
  ├── useXxxViewModel (common) — hooks, state, GraphQL
  ├── ResponsiveViewSwitch — tier selection
  │   ├── createLazyView(desktop) — desktop tier
  │   └── createLazyView(mobile) — mobile tier
```

### File Tree Structure

```
frontend/
├── common/views/dashboard/billing/quota/
│   ├── QuotaContainer.tsx          # Switcher + VM
│   ├── QuotaFormContainer.tsx
│   ├── QuotaDetailContainer.tsx
│   ├── QuotaInsightsContainer.tsx
│   ├── useQuotaViewModel.ts
│   ├── useQuotaFormViewModel.ts
│   ├── useQuotaDetailViewModel.ts
│   ├── useQuotaInsightsViewModel.ts
│   ├── schemas/quotaSchema.ts
│   └── types/quotaForm.types.ts
├── desktop/views/dashboard/billing/quota/
│   ├── quotaList.desktop.tsx
│   ├── quotaForm.desktop.tsx
│   ├── quotaDetail.desktop.tsx
│   ├── quotaInsights.desktop.tsx
│   └── components/
├── mobile/views/dashboard/billing/quota/
│   ├── quotaList.mobile.tsx
│   ├── quotaForm.mobile.tsx
│   ├── quotaDetail.mobile.tsx
│   ├── quotaInsights.mobile.tsx
│   └── components/
└── common/stores/
    └── quotaStore.ts
```

### Drizzle Schema Convention

- **No database schema changes in this plan** — UI-only
- If backend gaps are discovered (e.g., `PERIODIC` kind already exists — do NOT use `ON_DEMAND`; `PENDING` enum needs backend addition), document as backend backlog
- If schema changes ARE needed later: use `bun run db push` (not `migrate`)

---

## Outcome Knowledge Base

- **BEFORE** any task: Read ALL files in `.ai/plans/quota/ui/outcome/`
- **AFTER** any task: Create `.ai/plans/quota/ui/outcome/<task-id>-outcome.md`
- **PROGRESS**: Update task checkbox `[ ]` → `[x]` in `tasks.md`
