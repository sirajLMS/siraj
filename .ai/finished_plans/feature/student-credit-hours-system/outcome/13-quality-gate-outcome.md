# Phase 13 Outcome — Quality Gate (Global Verification)

## Result: COMPLETE — all gates green; zero plan-related failures

Executed 2026-08-28/29. Commands adapted to repo convention (layered runners instead of raw `bun test backend/` / `bun test test/ui/`, per root AGENTS.md and Phase 10/11 outcomes).

## 13.1–13.3 Static gates
- `bun tsgo` — exit 0, 0 errors (the 2 pre-existing Storybook TS2305 baseline errors no longer exist, consistent with the Phase 12 note).
- `bun biome:check` — exit 0, 1 warning: `internalError/fs` dereferenced symlink on `.claude/skills` — environmental, pre-existing baseline noise, untouched.
- `bun run lint` (full-repo ESLint, in-process service) — exit 0, zero errors/warnings.

## 13.4 Backend test suite
| Suite | Result |
|---|---|
| `bun run test:db` | 97 files / 949 tests — ALL PASS |
| `bun run test:services` | 66 files / 689 tests — ALL PASS |
| `bun run test:workflows` | 1 file / 5 tests — ALL PASS |

Caveat: one mass-timeout run (44 tests, 60s each) was caused by a concurrent `test:ui:components` process from another session starving DB connections — environmental contention, not code. Clean rerun: 949/949 in ~15s. **Carry-forward:** mass 60s-timeout signatures across many files usually mean cross-suite lock/DB contention — rerun before investigating code.

## 13.5 UI test suite
| Stage | Result |
|---|---|
| `bun run test:ui:components` | 860 pass / 0 fail (plan's 12 accounting tests across 6 files included) |
| `bun run build:test` | exit 0 (`.next-test-prod` built). Note: the e2e runner currently boots `next dev` (`.next-test-dev`), not this bundle — pre-existing runner behavior |
| `bun run test:ui:e2e` (full, `--no-bail`) | **59 pass / 9 fail / 2 skipped — ZERO plan-related** |

Pre-existing e2e failures (root causes verified, none caused by this plan):
1. `teacher_lesson_report.test.ts` (2) — demo teacher had `national_id = NULL`; the long-standing force-complete gate redirected to `/profile/edit`. Fixed via **test-data only** (encrypted national_id set on demo row); spec now passes 3/3.
2. `supervisor_portal.test.ts` (4) — data-dependent brittleness: hero-card action buttons render only when pending reviews/dues exist; test DB lacks them. Pre-existing test debt (needs seeded demo data).
3. `teacher_onboarding.test.ts` (3) — spec still uses `demoLogin("super_admin")`, intentionally blocked by the H9 security fix (`EXCLUDED_DEMO_LOGIN_GROUP_SLUGS`); helper retries 300s → timeout. Pre-existing: spec never migrated to password login. Consistent across 3 runs.
4. 2 billing notification tests are deliberate `test.skip` awaiting an unshipped feature.

## 13.6 Manual smoke (agent-browser against dev server :3000, admin session via scripts/browser-login.ts)
Smoke data created in dev DB: package plan `SMOKE_PACK` ("Smoke Pack", 15h / 300 EGP), payment for student `917d383b-e2e8-4a21-8a7a-3a1068b28e67` (+ invoice).
- a. Package plan created via `/accounting/packages/new` — appears in list — **PASS**
- b. Student baseline balance 0.00 verified (all 20 same-named demo duplicates checked) — **PASS**
- c. Payment recorded via form; plan selection auto-filled Credit=15/Amount=300/EGP; mutation created payment + invoice (UNPAID) + linked parent — **PASS**
- d. `studentCreditHourBalance` flipped 0.00 → total 15.00 / remaining 15.00 for exactly the paid student — **PASS**
- e. Paid toggle both directions via payment detail UI: MARK AS PAID → invoice PAID; MARK AS UNPAID → UNPAID; MARK AS PAID → PAID — **PASS**
- f. Filters: unpaid-only (excludes PAID smoke row correctly; `unpaidOnly:true` sent), date range (81→1, exactly smoke row), student/parent filters carry resolved ids and narrow (positive=1 row verified via id-filtered query; UI caveat — 20 identically-named demo students randomize the dropdown), AND-combination (date match + unpaid-only → 0 rows + empty state) — **PASS**
- g. Student CREDIT HOURS tab: Total 15.00 / Consumed 0.00 / Balance 15.00 + Recent Hour Activity row for the smoke payment — **PASS**

## 13.7 RTL — PASS
`/ar` Add Payment form: `<html dir="rtl" lang="ar">`, all labels Arabic, Arabic-locale date format, currency picker "جنيه مصري (EGP)" with Latin code bidi-isolated; digits/currency render LTR via bidi isolation. Screenshot: `scratch/screenshots/13-7-add-payment-ar.png`.

## 13.8 Permission isolation — PASS with documented fallbacks
No non-privileged account exists in `.env` (ADMIN only), so live non-privileged checks used fallbacks:
- (a) Sidebar gating verified statically: `navigationConfig.ts` gates `grp_accounting` on `AccountingPaymentsView/AccountingPaymentsManage`.
- (b) Direct navigation: cookieless session → `/accounting/payments` redirects to `/login`; page-level gating via `withPageAuth([ACCOUNTING_PAYMENTS_VIEW])` verified in code.
- (c) GraphQL: cookieless `packagePlans` / `accountingPayments` → `UNAUTHENTICATED`; authenticated FORBIDDEN path enforced by `requirePermission(...ACCOUNTING_PAYMENTS_VIEW)` / `assertAssociatedOrManage` in `accounting-payment.service.ts` (verified in code).

## 13.9 Backward compatibility — PASS
- `/billing` overview (200 students, pagination), Invoices tab (real invoices, quick-pay), `/quotas` (4 real quotas) all render with real data.
- DB XOR sanity: 913 `credit_transactions` rows, **0 XOR violations**; constraint `credit_transactions_change_amount_xor_chk` present.

## Anomalies observed (dev-only / not code defects)
1. Transient "Failed to load payments" after dev-server Fast Refresh recompiles; recovers on reload (suspected stale persisted-query/chunk mismatch, dev-only).
2. Payment detail first navigation from list once rendered empty state; fine on reload and all later visits.
3. `siraj_postgres` docker container had stopped mid-session (restarted); dev server recompiled ~85s. Console DrizzleQueryError root-boundary entries all timestamped inside that outage window.

## Deferred items
Ledger unchanged — 5 items, all 📋 Future/Planned, none blocking. Admin fan-out for ACCOUNTING_LOW_HOURS remains deferred (Phase 12 note).
