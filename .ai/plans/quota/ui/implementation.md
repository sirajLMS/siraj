# Quota UI Production-Readiness Plan — Implementation Guide

**Version**: 1.0
**Date**: 2025-01-20

---

## Quality Loop Commands

After creating/modifying ANY file, run:

```bash
# Type check (safe to run concurrently)
bun tsgo

# Biome format + lint (safe to run concurrently)
bun biome:check

# ESLint via lint queue (requires lint queue server running)
# Start server first (if not running):
#   ~/.bun/bin/bun run scripts/lint-queue-server.ts
# Get the port:
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
# Submit lint request for specific files:
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<file-path>"]}'
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
