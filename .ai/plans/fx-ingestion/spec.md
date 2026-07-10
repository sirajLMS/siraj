# FX Rate Ingestion — Specification

**Status:** Planning
**Prerequisite for:** [`.ai/plans/currency/spec.md`](../currency/spec.md) Phase 15 (display conversion) and live invoice FX snapshots
**Implements:** Decision 3A live FX catalog (ingestion slice only — not display conversion)
**Updates:** [`.ai/plans/currency/spec.md`](../currency/spec.md) §4/§7, [`.ai/plans/user-entity-enhancement/ANALYSIS.md`](../user-entity-enhancement/ANALYSIS.md)
**Migration strategy:** Incremental Drizzle migration for `fx_sync_runs` + permission enum values; **no** clean-slate

---

## 1. Problem

Siraj has FX **storage** and **read** repo methods but no **ingestion path**:

| Exists today | Missing |
|---|---|
| [`currency_exchange_rates`](../../backend/db/schema/billing.ts) + audit logs | No caller for [`updateExchangeRate`](../../backend/db/repo/billing/billing.repository.ts) |
| [`getLatestExchangeRate`](../../backend/db/repo/billing/billing.repository.ts) (throws if stale >24h) | No service, GraphQL, Vercel Cron, or admin UI |
| Invoice auto-snapshot via `resolveExchangeRateSnapshot` | No automated refresh from external APIs |

Without ingestion, [`.ai/plans/currency`](../currency/) Phase 15 and invoice creation fail on stale/missing rates in non-dev environments.

---

## 2. Locked product rules

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INGESTION (this plan)                                        │
│    Pull rates from external provider → store in                 │
│    currency_exchange_rates (relational rows, one per pair/sync) │
├─────────────────────────────────────────────────────────────────┤
│ 2. FINANCIAL READ (existing — unchanged behavior)               │
│    getLatestExchangeRate THROWS if missing/stale >24h on        │
│    invoice/payment insert                                       │
├─────────────────────────────────────────────────────────────────┤
│ 3. DISPLAY CONVERSION (currency plan — OUT of scope here)       │
│    Soft read + users.displayCurrency + formatCurrencyForDisplay │
└─────────────────────────────────────────────────────────────────┘
```

1. **Store locked pairs in DB** — one row per `(from, to, effectiveDate)`; never mutate invoice snapshots.
2. **USD hub** — expand provider bulk rates to all supported `CurrencyCode` pairs needed for billing (`X→USD`, `USD→X`; skip `from === to`).
3. **Daily Vercel Cron** — production-only GET `/api/fx/refresh` at `0 6 * * *` UTC.
4. **Staff manual refresh** — GraphQL mutation only (permission-gated); never expose `CRON_SECRET` to browser.
5. **Stale monitoring** — ops alert when last successful sync >20h (24h staleness cliff on invoices).

---

## 3. Scope (IN)

| Layer | Surface | Action |
|---|---|---|
| Permissions | `AppPermission` + [`3-system_permissions_and_groups.sql`](../../backend/db/migration/3-system_permissions_and_groups.sql) + incremental migration | `billing.view_exchange_rates`, `billing.refresh_exchange_rates`; grant `super_admin` + `academy_admin` only |
| Enum | `backend/enum/fx/fx-provider.enum.ts` | `FxProvider`: `openexchangerates`, `fixer` |
| DB schema | NEW `fx_sync_runs` table | Sync observability + raw provider payload (once per sync) |
| DB migration | Incremental `bun db generate` | `fx_sync_runs` + permission ALTER TYPE |
| Backend types | `billing.types.ts` + new FX types | `FxSyncRun*`, `ExchangeRateReturnType`, `FxProviderFetchResult` |
| Repo | `billing.repository.ts` + new `fx-sync.repository.ts` | `listLatestExchangeRates`, history, sync run CRUD; fix `updateExchangeRate(changedByUserId: string \| null)`; single-`tx` bulk write |
| Services | `backend/services/fx/` | Factory + OER + Fixer adapters; `fx-ingestion.service.ts`; `fx-rate-query.service.ts` |
| Cron auth | `backend/lib/cron-auth.ts` | `verifyCronSecretAuth` (R1–R11) |
| App route | `app/api/fx/refresh/route.ts` | GET only; Vercel Cron + ops |
| Vercel | `vercel.json` | `crons: [{ path: "/api/fx/refresh", schedule: "0 6 * * *" }]` |
| GraphQL | `fx-ingestion.pothos.ts` | Queries + mutation with `authScopes` |
| Frontend | Admin billing area | Exchange rates page + DataGrid + sync status card |
| Env/docs | `environment.d.ts`, `.env.example`, `APPS.md`, `backend/services/fx/README.md` | FX_PROVIDER, provider keys, CRON_SECRET |
| Tests | Repo, service, route security, GraphQL permission, `@live-fx` provider tests | See §6 |
| Cross-plan | [`.ai/plans/currency/*`](../currency/) | Remove FX ingestion from OUT; add prerequisite |

---

## 4. Scope (OUT)

- Display-time conversion (`formatCurrencyForDisplay`, `displayAmount`, `users.displayCurrency`) — [currency plan](../currency/)
- PG `currency_code` enum on FX columns — currency plan clean-slate
- Automatic provider failover (v1.1 note only)
- FX retention purge job
- Currency hedges admin UI
- Storage cleanup cron migration to `verifyCronSecretAuth`
- Mock/stub FX provider adapters

---

## 5. Locked technical decisions

| Topic | Choice |
|---|---|
| Providers (v1) | **Open Exchange Rates** (`openexchangerates`) + **Fixer/APILayer** (`fixer`) — full implementations, no stubs |
| Provider selection | `FX_PROVIDER` env → `FxRateProviderFactory` (mirrors [`EmailChannelFactory`](../../backend/services/communication/channels/email/EmailChannelFactory.ts)) |
| Rate storage | Relational rows in `currency_exchange_rates`; raw JSON **once** on `fx_sync_runs.providerResponse` (S6 — not per row) |
| Sync transaction | **Single DB transaction** per refresh: running lock → pair writes → audit → complete sync run (C3) |
| Cron scheduler | [`vercel.json`](../../vercel.json) — not an env var |
| Cron HTTP | **GET** `/api/fx/refresh`; auth via `Authorization: Bearer ${CRON_SECRET}` (Vercel auto-injects) |
| Cron secret compare | SHA-256 hash + `timingSafeEqual` (S1) |
| Dev/test cron auth | Require `CRON_SECRET` except `NODE_ENV=test` with fixed secret in `.env.test` (S7) |
| Manual staff refresh | GraphQL `refreshExchangeRates` + `BILLING_REFRESH_EXCHANGE_RATES`; rate limit 3/hour/user (S2) |
| Permissions migration | Incremental SQL with DISABLE TRIGGER pattern (C1) — not seed-only |
| Permission groups | `super_admin` + `academy_admin` only — not parent/teacher/staff defaults |
| Provider HTTP | 10s timeout via `AbortSignal.timeout(10_000)` (P4) |
| Concurrent sync guard | Reject if `fx_sync_runs.status = 'running'` or advisory lock (B3) |
| Idempotency | Skip if success sync within 30 min unless `?force=true` + valid CRON_SECRET (R8) |
| History query | Paginated; max 90-day range; limit ≤100 (S5) |
| Live integration tests | Tagged `@live-fx`; mocked `fetch` in default CI (B5) |
| Currency columns (DB) | Stay `varchar(10)` until currency plan; TS uses `CurrencyCode` at boundaries |

### Cron security rules (R1–R11)

| Rule | Requirement |
|---|---|
| R1 | Production without `CRON_SECRET` → **500** |
| R1b | Non-test env without secret → **401** |
| R2 | Bearer match fail-closed; constant-time |
| R3 | GET only; other methods → **405** |
| R4 | No query-string secret |
| R5 | No user-agent-only auth |
| R6 | Log `x-vercel-cron-schedule` for audit only |
| R7 | Response: `{ success, pairsWritten, pairsFailed, syncRunId }` only |
| R8 | 30-min idempotency skip (+ optional `?force=true`) |
| R9 | `CRON_SECRET` in `validateNoPlaceholderSecrets` |
| R10 | Document in `environment.d.ts` |
| R11 | Route security tests mandatory |

---

## 6. Acceptance criteria

1. `bun tsgo -b --noEmit` — zero FX-ingestion-related errors.
2. `bun biome:check` + lint queue on all touched files — clean.
3. Incremental migration applies: `fx_sync_runs` table + `app_permission` new values + permission rows on existing DB (C1).
4. `bun run scripts/run-test/run-test.ts backend/db/test/repo/billing.repository.test.ts` (and new fx-sync tests) pass.
5. `FxIngestionService.refreshRates` completes in **one transaction**; partial failure rolls back all pair writes (C3).
6. Cron route: no header → 401; wrong secret → 401; valid secret → 200; POST → 405; prod missing secret → 500 (R11).
7. GraphQL: user without permission → forbidden; `academy_admin` with grant → view + refresh works.
8. GraphQL manual refresh rate-limited to 3/hour/user (S2).
9. Vercel Cron documented in `vercel.json` + `backend/services/fx/README.md`.
10. Both providers: `validateConfig()` + `@live-fx` fetch test pass locally with keys in gitignored `.env`.
11. After sync, `getLatestExchangeRate(EGP, USD)` returns row <24h old (invoice path unblocked).
12. `fx_sync_runs` last success visible in admin UI; alert documented when >20h (C4).
13. [`.ai/plans/currency/spec.md`](../currency/spec.md) updated — FX ingestion removed from OUT; prerequisite link added.
14. No plaintext provider keys in committed files (placeholders in `.env.example` only).

---

## 7. Cross-plan updates (mandatory Phase 21)

### [`.ai/plans/currency/spec.md`](../currency/spec.md)

- §4 Scope OUT: **Remove** "FX rate ingestion" bullet
- §3 Scope IN: add prerequisite row linking this plan
- §6: add "fresh FX from ingestion cron, not seed-only"

### [`.ai/plans/currency/plan.md`](../currency/plan.md)

- Add **Prerequisites** section after foundation table
- Phase 15.16: prefer ingestion over static seed in non-dev

### [`.ai/plans/currency/tasks.md`](../currency/tasks.md)

- Prerequisite checkbox at top: fx-ingestion landed

### [`.ai/plans/user-entity-enhancement/ANALYSIS.md`](../user-entity-enhancement/ANALYSIS.md)

- Mark FX ingestion planned/landed with link to this spec

---

## 8. Risk register

| Risk | Mitigation |
|---|---|
| C1 permission trigger | Incremental migration DISABLE TRIGGER + ON CONFLICT |
| C3 partial sync | Single transaction |
| C4 stale rates break invoices | Daily cron + 20h alert runbook |
| S1 timingSafeEqual | Hash-then-compare |
| S2 API quota burn | GraphQL rate limit |
| S6 jsonb bloat | Raw payload on `fx_sync_runs` only |
| B3 concurrent sync | Running status lock |
| B4 single provider | Ops env switch docs |
| B5 CI live API calls | `@live-fx` tag; mock in CI |
| Vercel Hobby drift | ±59 min acceptable vs 24h window |
| Preview no cron | Manual GraphQL + seeds for QA |

---

## 9. Operator setup — API keys (placeholders only)

### Open Exchange Rates

1. Sign up: https://openexchangerates.org/signup
2. Dashboard → **App ID** → `OPENEXCHANGERATES_APP_ID`
3. Verify: `curl "https://openexchangerates.org/api/latest.json?app_id=YOUR_APP_ID"`

### Fixer (APILayer)

1. Sign up: https://apilayer.com/marketplace/fixer-api
2. Dashboard → **API Access Key** → `FIXER_API_KEY`
3. Verify: `curl "https://api.apilayer.com/fixer/latest?access_key=YOUR_KEY"`

### Env files (gitignored — never commit)

Apply to `.env`, `.env.vercel`, `.env.test`, `.env.redis`, and any other `.env*` **except** `.env.example`:

```
FX_PROVIDER=openexchangerates
OPENEXCHANGERATES_APP_ID=<your-oer-app-id>
FIXER_API_KEY=<your-fixer-api-key>
CRON_SECRET=<random-16+-char-secret>
```

Also set `CRON_SECRET`, `FX_PROVIDER`, and provider keys in Vercel project settings (production).

### Integration test policy

- Default CI: mock `fetch` at HTTP boundary
- `@live-fx` tests: run locally or scheduled workflow; skip when env keys missing
- Max 1 live call per provider per test run

---

## 10. Governing rules

| Layer | Mandatory rule files |
|---|---|
| Root | `AGENTS.md` |
| Backend enum/types | `backend/AGENTS.md`, `backend/types/AGENTS.md` |
| DB schema/repo | `backend/db/repo/AGENTS.md`, `.agents/instructions/backend.instructions.md` |
| Services | `backend/services/AGENTS.md` |
| GraphQL | `backend/graphql/AGENTS.md` |
| App route | `app/AGENTS.md` |
| Frontend | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` |
| Tests | `tests.instructions.md` + layer AGENTS.md |
| Shared i18n | `shared/AGENTS.md` |

Cross-cutting: lint queue server (never direct `bun lint`); per-file verification loop; sonar-scan prohibition for sub-agents; DB tests via `run-test` script with `runInRollback`; fix-or-report cross-file rule.
