# Post-Implementation Review — profit-loss-dashboard

**Date:** 2026-09-17
**Scope:** All files created/modified by the plan (vs Phase 0 baseline)
**Rounds:** 1

## Scope Determined

~30 new files + ~20 modified files across backend (service, repos, GraphQL, types, migration), frontend (views, stores, documents, page-permissions), shared (locale), app (route, CSV exports), scripts (perf), and test/workflows (3 journey tests).

## Review Findings

| # | Severity | File | Finding | Disposition |
|---|---|---|---|---|
| 1 | ⚪ LOW | `frontend/.../GlobalFilterBar.tsx`, `useProfitLossViewModel.ts` | `FxWarning` imported from `@/backend/types` (type-only) | ACCEPTED — established pattern (8 existing frontend files import from `@/backend/types`; type-only imports create no runtime coupling) |
| 2 | ⚪ LOW | `profit-loss.service.test.ts`, `profit-loss-helpers.test.ts` | Module-level `Map`/array mocks | ACCEPTED — bounded test mocks, standard pattern |
| 3 | ⚪ LOW | `ExpensesTab.tsx` | Local `StatusBadge` cells instead of Plan 6's `ExpenseTypeChip`/`ExpenseSourceChip` (which don't exist as standalone components) | ACCEPTED — functional parity; logged in deferred-items (D4) for a future swap |

**Zero CRITICAL / HIGH / MEDIUM findings. Zero new blocking findings.**

## Baseline Comparison

- tsgo: 0 errors (baseline 0) — no new errors.
- biome: 1 broken-symlink warning (baseline 1) — matches baseline.
- ESLint: 1 pre-existing error (`test/security/multi-account-bola.test.ts:613`, baseline) — no new errors.
- Build: compiles successfully (33/33 static pages).

## Semantic Review (spot checks on key new files)

- Zero plan-artifact references (REQ-N / Task N / Phase N / .ai/plans) in code comments or JSDoc.
- Zero `console.*` usage — all logging via the project logger.
- No cross-layer runtime imports (frontend → backend is type-only; shared imports nothing from frontend/backend).
- No unbounded module-level mutable state in runtime code.
- Permission check precedes every read (`requirePermission` before any tab query).
- Month validated (`validateMonth`) before any query; pagination validated (`validatePagination`).
- CSV cells neutralize formula prefixes (tested per route).

## Test-Layer Coverage

| Layer | Result | Command |
|---|---|---|
| Repo/DB logic | ✅ 39 pass / 0 fail (4 repo extension tests + helpers) | `run-test.ts` |
| Service unit | ✅ 12 pass / 0 fail | `run-test.ts` |
| Cross-actor journeys | ✅ 19 pass / 0 fail (TB.1 6, TB.2 5, TB.3 8) | `test:workflows` (185 pass total; 2 pre-existing WhatsApp failures unrelated to this plan) |
| GraphQL integration | ✅ 11 pass / 0 fail | `run-test.ts` |
| CSV export routes | ✅ 68 pass / 0 fail (4 route tests) | `run-test.ts` |

## Performance Rehearsal

- Worst p95: **8.9 ms** (target < 800 ms per NFR-2) — PASS.
- Script: `scripts/perf/profit-loss-rehearsal.ts` (5 000 sessions + 100 expenses + 200 income payments; full FK chain; idempotency-key cleanup verified 0 leftovers).

## Verdict

**PASS** — the implementation is complete, verified, and regression-green.

---

# Post-Implementation Review — Round 2 (Independent Re-Verification)

**Date:** 2026-09-17
**Method:** Fresh automated + semantic review over the plan's actual files (not relying on Round 1).

## Automated Checks (independently re-run)

| Check | Result | vs Baseline |
|---|---|---|
| `bun tsgo` (filtered to plan files) | 0 errors | baseline 0 — no new errors |
| ESLint (lint-service) on 13 core plan files (service, helpers, CSV serializer, pothos, query, types, 4 export routes, documents, ViewModel, dashboard) | exit 0, clean | no new errors |
| ESLint (lint-service) on 11 remaining plan files (4 tabs, 3 chips, EmptyMonthState, filter store, desktop/mobile tier views, `app/(dashboard)/accounting/profits/page.tsx`) | exit 0, clean | no new errors |
| Grep `console.*` in all plan files | 0 matches | pass |
| Grep hex/rgb/rgba colors in all plan view/store files | 0 matches | pass |
| Grep plan tags (`REQ-N`/`Task N`/`Phase N`/`.ai/plans`) in code | 0 matches | pass |
| Grep fixture data (fake names/sample/lorem/example.com) in views + stores | 0 matches | pass — no hardcoded fixture rows |

## Semantic Review Findings

| # | Severity | File:line | Finding | Disposition |
|---|---|---|---|---|
| 1 | ⚪ LOW | `frontend/.../GlobalFilterBar.tsx:8`, `useProfitLossViewModel.ts:6` | `FxWarning` type-only import from `@/backend/types` | ACCEPTED — established cross-layer type pattern (Round 1 finding #1; type-only, no runtime coupling) |
| 2 | ⚪ LOW | `backend/.../profit-loss.pothos.ts` — synthetic `id` fields on aggregates/pages | Synthetic constant IDs (e.g. `profit-loss-payments-page`) for Apollo cache normalization | ACCEPTED — intentional per GraphQL conventions; rows use real entity IDs |

**Zero CRITICAL / HIGH / MEDIUM findings in Round 2. No fixes required.**

## Rule-By-Rule Verification (Round 2)

- **Architecture / layer separation**: Service→repo only; repos use `queryDb(tx)`; GraphQL objects reference `@/backend/types` only (no local type definitions in the Pothos file — generics + `objectRef` over backend types). ✅
- **Barrel rules**: all imports via highest barrel with `@/` aliases; `backend/db/migration/50-accounting-profits-permissions.sql` present. ✅
- **Permission gating**: `profitLossReport` query has `authScopes: { permission: AppPermission.ACCOUNTING_PROFITS_VIEW }` + `requireAuth` (`profit-loss.query.ts:15,30`); `ProfitLossService.getReport` re-enforces `requirePermission` (`profit-loss.service.ts:215`) before any read — so all 4 CSV export routes are gated transitively; page gated via `withPageAuth([ACCOUNTING_PROFITS_VIEW], ...)` (`app/(dashboard)/accounting/profits/page.tsx:16`). ✅
- **Migration**: `accounting.profits_view` added idempotently (ADD VALUE IF NOT EXISTS + ON CONFLICT), granted to super_admin + academy_admin, system-trigger guarded. ✅
- **Enum value imports**: backend imports `AppPermission` from `@/backend/enum`; frontend uses GraphQL codegen enums via Pothos (no `@/backend/enum` in shared/frontend). ✅
- **i18n**: all user-facing strings via `useAppTranslation`/ViewModel label types (`ProfitLossTabLabels = ProfitLossViewModel["labels"]`)/`getTranslations`/`getServerTranslations` — no hardcoded strings found in views/stores/routes. ✅
- **Theme**: zero hardcoded colors; theme-callback pattern used (`theme.palette.text.disabled` etc.). ✅
- **Race conditions**: report path is read-only (no read-then-write); permission precedes every read; month + pagination validated (`validateMonth`/`validatePagination`) before queries. ✅
- **Dead code**: lint exit 0 on every plan file; prior-round knip (UNUSED) stage green. ✅
- **Pothos input nullability**: pagination args optional with `defaultValue`; resolver uses `?? DEFAULT_PAGE_LIMIT` fallbacks — no `T | null | undefined` hazards; nullable exposed fields (`convertedAmount`, `teacherName`, etc.) explicitly marked `nullable: true`. ✅
- **Fixture data**: none — no fake names/rows/amounts hardcoded in any component or store. ✅
- **Task 8.1**: Playwright spec NOT created (user forbade UI/e2e tests) — confirmed, `e2e/` untouched by this plan. ✅

## Round 2 Verdict

**PASS** — independently re-verified; zero new findings requiring fixes. The only unresolved deferred items are the user-instructed UI/e2e test skips (D1, D2), the pre-existing WhatsApp journey failures (D4), and the documented chip-parity note (D4) — none block completion.
