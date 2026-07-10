# FX Rate Ingestion — Tasks

**Spec:** [`./spec.md`](./spec.md) — **Plan:** [`./plan.md`](./plan.md)
**Tracking convention:** checkboxes below map 1:1 to plan.md phases. Mark `[x]` only after the per-file verification loop (`tsgo` → `biome:check` → lint-queue) passes on every file the phase touched.
**Linting:** ALWAYS go through the lint queue server/client — NEVER run `bun lint` directly. Start the server once at the top of execution:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
```

**Rule files per phase (read EVERY listed file before editing that layer — enforced per spec.md §10):**

| Phase | Layer | Mandatory rule files |
|---|---|---|
| 0 | Operator env | `AGENTS.md` (never commit `.env*`) |
| 1 | Permissions / SQL migration | `AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` |
| 2 | Backend enum + types | `AGENTS.md` · `backend/types/AGENTS.md` · `backend/enum/AGENTS.md` · `backend/AGENTS.md` |
| 3 | DB schema + Drizzle | `AGENTS.md` · `backend/db/repo/AGENTS.md` · drizzle skills (`drizzle-migrations`, `drizzle-generate`) |
| 4–5 | Repositories + repo tests | `AGENTS.md` · `backend/db/repo/AGENTS.md` · `tests.instructions.md` · `backend/db/test/AGENTS.md` |
| 6–9 | Provider adapters + factory | `AGENTS.md` · `backend/services/AGENTS.md` · `tests.instructions.md` |
| 10–12 | Services + service/provider tests | `AGENTS.md` · `backend/services/AGENTS.md` · `tests.instructions.md` |
| 13–14 | Pothos + codegen + GraphQL perm test | `AGENTS.md` · `backend/graphql/AGENTS.md` · `frontend/graphql/AGENTS.md` · `tests.instructions.md` |
| 15–18 | Frontend docs + UI + i18n + Storybook | `AGENTS.md` · `frontend/views/AGENTS.md` · `frontend/graphql/sharedDocuments/AGENTS.md` · `frontend/AGENTS.md` · `shared/AGENTS.md` |
| 19 | App route + cron | `app/AGENTS.md` · `backend/AGENTS.md` |
| 20 | Env + docs | `AGENTS.md` |
| 21 | Cross-plan edits | `AGENTS.md` (never create SUMMARY.md; editing existing plan docs is OK) |
| 22 | Quality gate | `AGENTS.md` (Quality Gate Workflow, Sonar-Scan Prohibition, Lint Queue Server) |

---

## Phase 0 — Operator env bootstrap

- [ ] **T0.1** List `ls -la .env*` (exclude `.env.example`).
- [ ] **T0.2** Merge FX env block into `.env`, `.env.vercel`, `.env.test`, `.env.redis`, and any other gitignored `.env*`.
- [ ] **T0.3** Verify Open Exchange Rates: `curl "https://openexchangerates.org/api/latest.json?app_id=$OPENEXCHANGERATES_APP_ID"`.
- [ ] **T0.4** Verify Fixer: `curl "https://api.apilayer.com/fixer/latest?access_key=$FIXER_API_KEY"`.
- [ ] **T0.5** Set Vercel project env: `FX_PROVIDER`, `OPENEXCHANGERATES_APP_ID`, `FIXER_API_KEY`, `CRON_SECRET`.
- [ ] **T0.6** Confirm `git status` shows no staged `.env*` files.

_Rules (read before editing):_ `AGENTS.md` — never commit keys; placeholders only in `.env.example`

---

## Phase 1 — Permissions (enum + seed + incremental migration)

- [ ] **T1.1** `backend/enum/permissions/permission.enum.ts` ~101 — add `BILLING_VIEW_EXCHANGE_RATES`, `BILLING_REFRESH_EXCHANGE_RATES`.
- [ ] **T1.2** `backend/db/migration/3-system_permissions_and_groups.sql` top — `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS` ×2.
- [ ] **T1.3** Same file ~804 — two `INSERT INTO permissions` rows (`is_system = true`, billing category jsonb).
- [ ] **T1.4** Same file super_admin IN ~1230 — add both permission keys.
- [ ] **T1.5** Same file academy_admin IN ~1290 — add both permission keys.
- [ ] **T1.6** **NEW** `backend/db/migration/4-fx_exchange_rate_permissions.sql` — **C1:** DISABLE `trg_protect_system_permissions` → INSERT ON CONFLICT (key) DO UPDATE ×2 → ENABLE trigger → INSERT `group_permissions` for super_admin + academy_admin.
- [ ] **T1.7** Wire `4-fx_exchange_rate_permissions.sql` into drizzle custom migration bundle if required.
- [ ] **T1.8** Apply migration on dev DB; verify permissions visible; trigger re-enabled.
- [ ] **T1.9** Per-file verify: touched enum + SQL files → tsgo (enum only) → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md`

---

## Phase 2 — Backend enum + types

- [ ] **T2.1** **NEW** `backend/enum/fx/fx-provider.enum.ts` — `FxProvider { OpenExchangeRates, Fixer }`.
- [ ] **T2.2** `backend/enum/index.ts` — re-export `FxProvider`.
- [ ] **T2.3** `backend/types/billing/billing.types.ts` — add FX sync + exchange rate types per plan 2.3.
- [ ] **T2.4** `backend/types/index.ts` — barrel exports.
- [ ] **T2.5** Per-file `tsgo` → biome → lint-queue.

_Rules (read before editing):_ `backend/types/AGENTS.md` · `backend/enum/AGENTS.md` · `backend/AGENTS.md`

---

## Phase 3 — DB schema `fx_sync_runs` + migration

- [ ] **T3.1** **NEW** `backend/db/schema/fx-sync.ts` — sync run table per plan 3.1.
- [ ] **T3.2** `backend/db/schema/index.ts` — export.
- [ ] **T3.3** Run `bun db generate` (incremental).
- [ ] **T3.4** Apply migration; verify table exists.
- [ ] **T3.5** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `backend/db/repo/AGENTS.md` · drizzle-migrations skill

---

## Phase 4 — Repository layer (C2, C3, P2)

- [ ] **T4.1** `billing.repository.ts:139` — `changedByUserId: string | null` (C2).
- [ ] **T4.2** NEW `updateExchangeRateInTx(input, changedByUserId, tx)`.
- [ ] **T4.3** NEW `listLatestExchangeRates(pagination, tx?)` — DISTINCT ON (P2).
- [ ] **T4.4** NEW `listExchangeRateHistory(from, to, pagination, maxDays=90, tx?)` (S5).
- [ ] **T4.5** **NEW** `backend/db/repo/fx-sync.repository.ts` — sync run CRUD + running lock.
- [ ] **T4.6** `backend/db/repo/index.ts` — export.
- [ ] **T4.7** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `backend/db/repo/AGENTS.md`

---

## Phase 5 — Repository tests

- [ ] **T5.1** Extend `billing.repository.test.ts` — `changedByUserId: null`; list latest/history.
- [ ] **T5.2** **NEW** `fx-sync.repository.test.ts` — sync run CRUD; running lock.
- [ ] **T5.3** Run both via `bun run scripts/run-test/run-test.ts`.

_Rules (read before editing):_ `tests.instructions.md` · `backend/db/test/AGENTS.md`

---

## Phase 6–7 — Provider interface + Open Exchange Rates adapter

- [ ] **T6.1** **NEW** `IFxRateProvider.ts` — interface + normalized types.
- [ ] **T6.2** **NEW** `FxRateProviderFactory.ts` — singleton; `FX_PROVIDER` env.
- [ ] **T6.3** **NEW** `OpenExchangeRatesAdapter.ts` — USD-base; 10s timeout; `validateConfig`.
- [ ] **T6.4** **NEW** `openexchangerates.types.ts` + barrel `index.ts`.
- [ ] **T6.5** Unit tests with mocked `fetch`.
- [ ] **T6.6** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `backend/services/AGENTS.md`

---

## Phase 8–9 — Fixer adapter + factory wiring

- [ ] **T8.1** **NEW** `FixerAdapter.ts` — EUR-base → USD hub (B1).
- [ ] **T8.2** **NEW** `fixer.types.ts` + barrel.
- [ ] **T8.3** Wire `fixer` branch in `FxRateProviderFactory.ts`.
- [ ] **T8.4** **NEW** `backend/services/fx/index.ts` — facades.
- [ ] **T8.5** Unit tests for EUR→USD hub math.
- [ ] **T8.6** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `backend/services/AGENTS.md`

---

## Phase 10 — Ingestion + query services

- [ ] **T10.1** **NEW** `fx-ingestion.service.ts` — single-tx refresh (C3); running lock (B3); raw JSON on sync run only (S6).
- [ ] **T10.2** **NEW** `fx-rate-query.service.ts`.
- [ ] **T10.3** **NEW** `fx-rate-limit.service.ts` — 3/hour/user (S2).
- [ ] **T10.4** Export from services barrel.
- [ ] **T10.5** Service unit tests with mocked provider + tx.
- [ ] **T10.6** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `backend/services/AGENTS.md`

---

## Phase 11 — Service tests

- [ ] **T11.1** **NEW** `fx-ingestion.service.test.ts` — success; rollback; concurrent reject; idempotency.
- [ ] **T11.2** **NEW** `fx-rate-limit.service.test.ts` — rate limit exceeded.
- [ ] **T11.3** All service tests pass.

_Rules (read before editing):_ `tests.instructions.md`

---

## Phase 12 — Provider integration tests (`@live-fx`)

- [ ] **T12.1** **NEW** `openexchangerates.integration.test.ts` — tag `@live-fx`; skip without key.
- [ ] **T12.2** **NEW** `fixer.integration.test.ts` — tag `@live-fx`; skip without key.
- [ ] **T12.3** Confirm default CI excludes `@live-fx` (B5).

_Rules (read before editing):_ `tests.instructions.md`

---

## Phase 13 — Pothos GraphQL + permission test

- [ ] **T13.1** **NEW** `fx-ingestion.pothos.ts` — types, queries, mutation with authScopes.
- [ ] **T13.2** Register in billing pothos index.
- [ ] **T13.3** **NEW** `frontend/graphql/test/fx-ingestion.test.ts` — forbidden without perm; academy_admin succeeds (spec §6 #7).
- [ ] **T13.4** Run `bun run generate:gqlSchema`.
- [ ] **T13.5** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `backend/graphql/AGENTS.md`

---

## Phase 14 — Codegen

- [ ] **T14.1** Run `bun run generate:gqlSchema && bun codegen`.
- [ ] **T14.2** Verify generated types include new operations + permissions.

_Rules (read before editing):_ `frontend/graphql/AGENTS.md`

---

## Phase 15 — Frontend GraphQL documents

- [ ] **T15.1** **NEW** `frontend/graphql/sharedDocuments/fx-ingestion.documents.ts` — query + mutation with `id` fields.
- [ ] **T15.2** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `frontend/graphql/sharedDocuments/AGENTS.md`

---

## Phase 16 — Admin UI

- [ ] **T16.1** **NEW** `ExchangeRatesContainer.tsx`.
- [ ] **T16.2** **NEW** `ExchangeRatesDataGrid.tsx`.
- [ ] **T16.3** **NEW** `ExchangeRateSyncStatusCard.tsx`.
- [ ] **T16.4** **NEW** `app/[locale]/(dashboard)/billing/exchange-rates/page.tsx`.
- [ ] **T16.5** `<RequirePermission>` for view; refresh uses `BillingRefreshExchangeRates`.
- [ ] **T16.6** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `frontend/views/AGENTS.md` · MUI v9 `sx` only

---

## Phase 17 — i18n

- [ ] **T17.1** `shared/messages/types/dashboard/billing.ts` — labels.
- [ ] **T17.2** `shared/messages/en.ts` + AR — strings.
- [ ] **T17.3** Nav link in admin billing (if applicable).
- [ ] **T17.4** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `shared/AGENTS.md`

---

## Phase 18 — Storybook

- [ ] **T18.1** **NEW** `ExchangeRatesContainer.stories.tsx` — Loaded; stale sync; forbidden.
- [ ] **T18.2** Storybook build passes.

_Rules (read before editing):_ `frontend/views/AGENTS.md`

---

## Phase 19 — Cron auth + route + vercel.json

- [ ] **T19.1** **NEW** `backend/lib/cron-auth.ts` — R1–R11, S1, S7.
- [ ] **T19.2** **NEW** `app/api/fx/refresh/route.ts` — GET only; cron trigger.
- [ ] **T19.3** **NEW** `vercel.json` — schedule `0 6 * * *` UTC.
- [ ] **T19.4** **NEW** `app/api/fx/refresh/route.test.ts` — R11 security cases.
- [ ] **T19.5** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `app/AGENTS.md`

---

## Phase 20 — Env + documentation

- [ ] **T20.1** `environment.d.ts` — FX env vars.
- [ ] **T20.2** `backend/lib/env.ts` — map vars; `validateNoPlaceholderSecrets`; prod `CRON_SECRET` (R9).
- [ ] **T20.3** `.env.example` — placeholder block.
- [ ] **T20.4** `APPS.md` — FX env table + cron row.
- [ ] **T20.5** **NEW** `backend/services/fx/README.md` — ops runbook; >20h staleness alert (C4).
- [ ] **T20.6** Per-file verify → tsgo → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md`

---

## Phase 21 — Update currency plan + ANALYSIS

- [ ] **T21.1** [`.ai/plans/currency/spec.md`](../currency/spec.md) — remove FX ingestion from OUT; add prerequisite; §6 fresh FX note.
- [ ] **T21.2** [`.ai/plans/currency/plan.md`](../currency/plan.md) — Prerequisites section; Phase 15.16 ingestion preference.
- [ ] **T21.3** [`.ai/plans/currency/tasks.md`](../currency/tasks.md) — prerequisite checkbox at top.
- [ ] **T21.4** [`.ai/plans/user-entity-enhancement/ANALYSIS.md`](../user-entity-enhancement/ANALYSIS.md) — FX ingestion link.

_Rules (read before editing):_ `AGENTS.md`

---

## Phase 22 — Quality gate

- [ ] **T22.1** Lint queue server running.
- [ ] **T22.2** `bun quality-gate` — all stages pass.
- [ ] **T22.3** Fix CODESCENE/SONAR per `AGENTS.md` if needed.

_Rules (read before editing):_ `AGENTS.md` (Quality Gate Workflow)

---

## Summary

| Metric | Count |
|---|---|
| Phases | 23 (0–22) |
| New files (approx.) | ~35 |
| Modified files (approx.) | ~20 |
| Cross-plan updates | 4 files (currency spec/plan/tasks + ANALYSIS) |
| Critical review fixes baked in | C1, C2, C3, C4, S1, S2, S5, S6, S7, B1, B3, B5, R1–R11 |

**Prerequisite chain:** fx-ingestion (this plan) → [currency plan Phase 15](../currency/plan.md) (display conversion)

**Execution order:** Phase 0 → 1 (permissions) → 2–5 (types/schema/repo) → 6–12 (providers/services/tests) → 13–18 (GraphQL/UI) → 19 (cron) → 20 (docs) → 21 (currency cross-updates) → 22 (quality gate)

**Blocked until fx-ingestion lands:**
- [ ] Currency plan Phase 15 (FX-convert-on-render) — requires fresh rates from ingestion cron
