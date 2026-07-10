# FX Rate Ingestion — Implementation Plan

**Spec:** [`./spec.md`](./spec.md)
**Prerequisite for:** [`.ai/plans/currency/plan.md`](../currency/plan.md) Phase 15
**Strategy:** Incremental migrations (NOT clean-slate)
**Sequence:** strict top-to-bottom phases; each phase completes before the next.
**Verification loop:** per-file `tsgo` → `biome:check` → lint-queue-client BEFORE importing elsewhere. Lint via **lint queue server** (`~/.bun/bin/bun run scripts/lint-queue-server.ts`; submit via `curl http://localhost:4777/lint`).

---

## Existing foundation (already landed — do NOT re-create)

| File | Status |
|------|--------|
| `backend/db/schema/billing.ts` — `currencyExchangeRates`, audit logs | ✓ |
| `backend/db/repo/billing/billing.repository.ts` — `getLatestExchangeRate`, `updateExchangeRate` | ✓ (wire callers) |
| `backend/enum/shared/currency.enum.ts` — 32 `CurrencyCode` values | ✓ |
| `frontend/lib/currency.ts`, `CurrencyDisplay`, `CurrencySelect` | ✓ |
| `environment.d.ts` — `CRON_SECRET` | ✓ |

---

## Phase 0 — Operator env bootstrap (human/orchestrator)

**Goal:** Provider API keys in gitignored env files only; verify connectivity.

**Steps:**
1. List `ls -la .env*` (exclude `.env.example`).
2. Merge FX block into `.env`, `.env.vercel`, `.env.test`, `.env.redis`, any other `.env*`.
3. Verify provider HTTP with curl (placeholders in spec §9).
4. Set Vercel project env: `FX_PROVIDER`, `OPENEXCHANGERATES_APP_ID`, `FIXER_API_KEY`, `CRON_SECRET`.
5. Confirm `git status` shows no staged `.env*` files.

**Verify:** curl returns JSON success from both providers.

_Rules:_ Never commit keys; purge plaintext from operator notes after verify.

---

## Phase 1 — Permissions (enum + seed + incremental migration)

**Goal:** `billing.view_exchange_rates` and `billing.refresh_exchange_rates` on enum, DB, and admin groups.

| # | File | Change |
|---|------|--------|
| 1.1 | `backend/enum/permissions/permission.enum.ts` ~101 | Add `BILLING_VIEW_EXCHANGE_RATES`, `BILLING_REFRESH_EXCHANGE_RATES` |
| 1.2 | `backend/db/migration/3-system_permissions_and_groups.sql` top | `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS` ×2 |
| 1.3 | Same file ~804 | Two `INSERT INTO permissions` rows (`is_system = true`, billing category jsonb) |
| 1.4 | Same file super_admin IN ~1230 | Add both keys |
| 1.5 | Same file academy_admin IN ~1290 | Add both keys |
| 1.6 | **NEW** `backend/db/migration/4-fx_exchange_rate_permissions.sql` | **C1:** DISABLE `trg_protect_system_permissions` → INSERT ON CONFLICT (key) DO UPDATE ×2 → ENABLE trigger → INSERT `group_permissions` for super_admin + academy_admin (mirror [`combined_custom_logic/migration.sql:1759–1803`](../../backend/drizzle/20260709164610_combined_custom_logic/migration.sql)) |
| 1.7 | Wire `4-fx_exchange_rate_permissions.sql` into drizzle custom migration bundle if required by project convention | Verify against existing `3-system_permissions_and_groups.sql` inclusion pattern |

**Verify:** `bun db` migrate/push on dev DB; permissions visible; trigger re-enabled.

_Rules:_ `AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md`

---

## Phase 2 — Backend enum + types

**Goal:** `FxProvider` enum and canonical FX types.

| # | File | Change |
|---|------|--------|
| 2.1 | **NEW** `backend/enum/fx/fx-provider.enum.ts` | `FxProvider { OpenExchangeRates = "openexchangerates", Fixer = "fixer" }` |
| 2.2 | `backend/enum/index.ts` | Re-export |
| 2.3 | `backend/types/billing/billing.types.ts` | `ExchangeRateReturnType`, `FxSyncRunSelectType/InsertType/ReturnType`, `FxProviderFetchResult`, `RefreshExchangeRatesResult` |
| 2.4 | `backend/types/index.ts` | Barrel exports |

**Verify:** `bun tsgo` on touched type/enum files.

_Rules:_ `backend/types/AGENTS.md` · `backend/enum/AGENTS.md` · `backend/AGENTS.md`

---

## Phase 3 — DB schema `fx_sync_runs` + migration

**Goal:** Observability table for sync runs + raw provider payload.

| # | File | Change |
|---|------|--------|
| 3.1 | **NEW** `backend/db/schema/fx-sync.ts` | Table: `id`, `provider`, `status` (enum: running/success/partial/failed), `pairsWritten`, `pairsFailed`, `errorMessage`, `providerResponse` jsonb, `startedAt`, `finishedAt`, `triggeredByUserId` nullable FK users |
| 3.2 | `backend/db/schema/index.ts` | Export |
| 3.3 | Run `bun db generate` (incremental) | New migration SQL |

**Verify:** Migration applies; table exists.

_Rules:_ `backend/db/repo/AGENTS.md` · drizzle-migrations skill

---

## Phase 4 — Repository layer (C2, C3, P2)

**Goal:** Data access for sync + rates; fix `updateExchangeRate` for cron.

| # | File | Change |
|---|------|--------|
| 4.1 | `backend/db/repo/billing/billing.repository.ts:139` | `changedByUserId: string \| null` (C2) |
| 4.2 | Same file | NEW `updateExchangeRateInTx(input, changedByUserId, tx)` — requires `tx`; no nested `db.transaction` when `tx` provided |
| 4.3 | Same file | NEW `listLatestExchangeRates(pagination, tx?)` — `DISTINCT ON (from_currency, to_currency)` ordered by `effective_date DESC` (P2) |
| 4.4 | Same file | NEW `listExchangeRateHistory(from, to, pagination, maxDays=90, tx?)` (S5) |
| 4.5 | **NEW** `backend/db/repo/fx-sync.repository.ts` | `createSyncRun`, `completeSyncRun`, `getLatestSyncRun`, `getRunningSyncRun`, `isRecentSuccess(withinMinutes=30)` |
| 4.6 | `backend/db/repo/index.ts` | Export |

**Verify:** `bun tsgo` per file.

_Rules:_ `backend/db/repo/AGENTS.md` — repo-only data access; pass `tx`; localized errors via `getBackendTranslations`

---

## Phase 5 — Repository tests

| File | Coverage |
|------|----------|
| `backend/db/test/repo/billing.repository.test.ts` | `updateExchangeRate` with `changedByUserId: null`; list latest/history |
| **NEW** `backend/db/test/repo/fx-sync.repository.test.ts` | Sync run CRUD; running lock |

**Run:** `bun run scripts/run-test/run-test.ts <path>`

_Rules:_ `tests.instructions.md` · `backend/db/test/AGENTS.md` — `runInRollback`; pass `tx`; no `rejects.toThrow` inside rollback

---

## Phase 6–7 — Provider interface + Open Exchange Rates adapter

| # | File | Change |
|---|------|--------|
| 6.1 | **NEW** `backend/services/fx/providers/IFxRateProvider.ts` | Interface + normalized types |
| 6.2 | **NEW** `backend/services/fx/providers/FxRateProviderFactory.ts` | Singleton; `FX_PROVIDER` env; dynamic import |
| 6.3 | **NEW** `backend/services/fx/providers/openexchangerates/OpenExchangeRatesAdapter.ts` | USD-base fetch; 10s timeout; `validateConfig` |
| 6.4 | **NEW** `backend/services/fx/providers/openexchangerates/openexchangerates.types.ts` | API response types |
| 6.5 | **NEW** `backend/services/fx/providers/openexchangerates/index.ts` | Barrel |

**Verify:** unit tests with mocked `fetch`.

_Rules:_ `backend/services/AGENTS.md`

---

## Phase 8–9 — Fixer adapter + factory wiring

| # | File | Change |
|---|------|--------|
| 8.1 | **NEW** `backend/services/fx/providers/fixer/FixerAdapter.ts` | EUR-base → normalize to USD hub (B1) |
| 8.2 | **NEW** `backend/services/fx/providers/fixer/fixer.types.ts` | |
| 8.3 | `FxRateProviderFactory.ts` | Wire `fixer` branch |
| 8.4 | **NEW** `backend/services/fx/index.ts` | `getFxRateProvider`, facades |

**Verify:** unit tests for EUR→USD hub math with decimal-safe library.

---

## Phase 10 — Ingestion + query services

| # | File | Change |
|---|------|--------|
| 10.1 | **NEW** `backend/services/fx/fx-ingestion.service.ts` | `refreshRates({ triggeredByUserId, trigger, locale?, force? })` — running lock (B3) → fetch → expand pairs (B2 skip identity) → **single tx** loop `updateExchangeRateInTx` → `completeSyncRun`; store raw JSON on sync run only (S6) |
| 10.2 | **NEW** `backend/services/fx/fx-rate-query.service.ts` | Read paths for GraphQL |
| 10.3 | **NEW** `backend/services/fx/fx-rate-limit.service.ts` | 3 refreshes/hour/user for GraphQL path (S2) |
| 10.4 | `backend/services/index.ts` or billing barrel | Export |

**Verify:** service unit tests with mocked provider + tx.

_Rules:_ `backend/services/AGENTS.md` — `requirePermission` on manual path only

---

## Phase 11 — Service tests

| File | Cases |
|------|-------|
| **NEW** `backend/services/fx/fx-ingestion.service.test.ts` | success; partial failure rollback; concurrent reject; idempotency skip |
| **NEW** `backend/services/fx/fx-rate-limit.service.test.ts` | rate limit exceeded |

---

## Phase 12 — Provider integration tests (`@live-fx`)

| File | Policy |
|------|--------|
| **NEW** `backend/services/fx/providers/openexchangerates/openexchangerates.integration.test.ts` | Skip if no `OPENEXCHANGERATES_APP_ID`; 1 live call max |
| **NEW** `backend/services/fx/providers/fixer/fixer.integration.test.ts` | Skip if no `FIXER_API_KEY`; 1 live call max |

**CI default:** exclude `@live-fx` tag.

---

## Phase 13 — Pothos GraphQL

| # | File | Change |
|---|------|--------|
| 13.1 | **NEW** `backend/graphql/pothos/billing/fx-ingestion.pothos.ts` | `ExchangeRate`, `FxSyncRun`, `ExchangeRateHistoryConnection`; queries with `BILLING_VIEW_EXCHANGE_RATES`; mutation `refreshExchangeRates` with `BILLING_REFRESH_EXCHANGE_RATES` |
| 13.2 | Register in billing pothos index | |
| 13.3 | **NEW** `frontend/graphql/test/fx-ingestion.test.ts` | User without permission → forbidden; `academy_admin` with grant → view + refresh (spec §6 #7) |

**Verify:** `bun run generate:gqlSchema`; GraphQL permission test passes

_Rules:_ `backend/graphql/AGENTS.md` — resolvers delegate to services; `id` on every object

---

## Phase 14 — Codegen

```bash
bun run generate:gqlSchema && bun codegen
```

**Verify:** Generated types include new operations + permissions.

---

## Phase 15 — Frontend GraphQL documents

| # | File | Change |
|---|------|--------|
| 15.1 | **NEW** `frontend/graphql/sharedDocuments/fx-ingestion.documents.ts` | Query + mutation documents with `id` fields |

_Rules:_ `frontend/graphql/sharedDocuments/AGENTS.md`

---

## Phase 16 — Admin UI

| # | File | Change |
|---|------|--------|
| 16.1 | **NEW** `frontend/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer.tsx` | Apollo queries + mutation |
| 16.2 | **NEW** `ExchangeRatesDataGrid.tsx` | Latest rates table |
| 16.3 | **NEW** `ExchangeRateSyncStatusCard.tsx` | Status + refresh button |
| 16.4 | **NEW** `app/[locale]/(dashboard)/billing/exchange-rates/page.tsx` | Page route |
| 16.5 | Wrap with `<RequirePermission permissions={[AppPermission.BillingViewExchangeRates]}>` | Refresh button: `BillingRefreshExchangeRates` |

_Rules:_ `frontend/views/AGENTS.md` · MUI v9 `sx` only

---

## Phase 17 — i18n

| # | File | Change |
|---|------|--------|
| 17.1 | `shared/messages/types/dashboard/billing.ts` | Exchange rates labels |
| 17.2 | `shared/messages/en.ts` + `shared/messages/ar/` | AR/EN strings |
| 17.3 | Nav link in admin billing (if applicable) | |

---

## Phase 18 — Storybook

| File | Stories |
|------|---------|
| `ExchangeRatesContainer.stories.tsx` | Loaded; stale sync; forbidden (mock store without perm) |

---

## Phase 19 — Cron auth + route + vercel.json

| # | File | Change |
|---|------|--------|
| 19.1 | **NEW** `backend/lib/cron-auth.ts` | `verifyCronSecretAuth` — R1–R11, S1 hash compare, S7 |
| 19.2 | **NEW** `app/api/fx/refresh/route.ts` | GET only → auth → idempotency → `FxIngestionService.refreshRates({ triggeredByUserId: null, trigger: "cron" })` |
| 19.3 | **NEW** `vercel.json` | Cron schedule |
| 19.4 | **NEW** `app/api/fx/refresh/route.test.ts` | R11 cases |

_Rules:_ `app/AGENTS.md`

---

## Phase 20 — Env + documentation

| # | File | Change |
|---|------|--------|
| 20.1 | `environment.d.ts` | `FX_PROVIDER`, `OPENEXCHANGERATES_APP_ID`, `FIXER_API_KEY` |
| 20.2 | `backend/lib/env.ts` | Map vars; add keys to `validateNoPlaceholderSecrets`; `CRON_SECRET` required in prod |
| 20.3 | `.env.example` | Placeholder block (via shell — cursorignored) |
| 20.4 | `APPS.md` | FX env table + cron row |
| 20.5 | **NEW** `backend/services/fx/README.md` | Providers, cron, ops runbook, staleness alert |

---

## Phase 21 — Update currency plan + ANALYSIS

Edits per spec §7.

---

## Phase 22 — Quality gate

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
bun quality-gate
```

---

## Cross-file dependencies

1. Phase 1 before Phase 13 (authScopes enum values)
2. Phase 3 before Phase 4 (`fx_sync_runs` repo)
3. Phase 4 before Phase 10 (`updateExchangeRateInTx`)
4. Phase 10 before Phase 13 (service resolvers)
5. Phase 14 before Phase 15–16 (codegen types)
6. Phase 19 can parallel Phase 16 after Phase 10

## Risk register (orchestrator)

| Risk | Owner |
|---|---|
| C1 permission trigger on existing DB | Phase 1 migration file |
| C3 single transaction | Phase 10 |
| C4 staleness alert | Phase 20 README |
| Reports/latest query performance | Phase 4 DISTINCT ON |
| Fixer quota in CI | Phase 12 `@live-fx` exclude |
