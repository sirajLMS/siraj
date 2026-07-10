# Currency Migration — Specification

**Status:** Planning
**Implements:** `.ai/plans/user-entity-enhancement/decisions/03-currency-vs-rate-currency.md` (Decision **3A**)
**Updates:** `.ai/plans/user-entity-enhancement/ANALYSIS.md` § 7.1 + § 2.3 (mark currency as landed)
**Migration strategy:** Inherited Decision **8C** — clean-slate (`bun db cleanGenerate`), no dual-write
**Parent plan:** `.ai/plans/user-entity-enhancement/` (currency slice only — other decisions untouched here)
**Prerequisite:** [`.ai/plans/fx-ingestion/`](../fx-ingestion/spec.md) — FX rate ingestion (provider/cron/observability) has landed; this plan consumes the `currency_exchange_rates` rows it produces. Read fx-ingestion spec.md before implementing the FX read-path fork below.

---

## 1. Problem

This plan implements **ALL of Decision 3A** (`.ai/plans/user-entity-enhancement/decisions/03-currency-vs-rate-currency.md`) — nothing currency-related is out of scope. It builds on the typed-enum foundation that already landed and extends it across the three currency concepts the decision separates:

1. **LOCKED DEFINITION CURRENCY** — typed enum on money entities (the foundation).
2. **USER DISPLAY PREFERENCE** (`users.displayCurrency`) — new column + plumbing + UI control.
3. **LIVE FX read-path** — render-time locked→display conversion honoring `users.displayCurrency`, with the decision's "stale FX → show locked-only" rule.

Currency is stored today as free `varchar(10)` on every money entity (`teachers.rateCurrency`, `parents.currency`, `invoices.currency`, `payments.currency`, `teacher_payments.currency`, `class_instances.rateCurrency`) and on the FX catalog (`currency_exchange_rates.fromCurrency/toCurrency`, `currency_exchange_audit_logs`, `currency_hedges`). There is no `users.displayCurrency` column at all. The FX-convert-on-render read path does NOT exist — `getLatestExchangeRate` is only called from the invoice-insert snapshot path and THROWS on stale rates (it does not return a soft "show locked only" signal). UIs hardcode 3–5-item `<MenuItem>` lists or raw `<TextField>`s, and render money duplicating a `formatCurrency` helper per file with hardcoded `"USD"` defaults.

A typed `CurrencyCode` GraphQL enum was already landed in the prior step (foundation):

- `backend/enum/currency.enum.ts` — 32 codes (all Arabic countries + Turkey + USD/EUR/GBP/CHF/CNY/JPY/INR/CAD/AUD)
- `backend/graphql/pothos/shared/enum.pothos.ts` — `CurrencyCodePothosObject` registered
- codegen: `CurrencyCode` enum in `frontend/graphql/generated/gql/graphql-types.ts` (`926`) and `frontend/graphql/generated/schema.graphql` (`881`)
- `frontend/lib/currency.ts`, `CurrencySelect`, `CurrencyDisplay`, `shared/messages/{types,ar,en}/ui/currency-select.ts` i18n — **foundation only, not wired into money UI yet**

This plan covers ALL of Decision 3A in one clean-slate wave: type every money/FX column; add `users.displayCurrency`; build the FX-convert-on-render read path honoring the stale-FX fallback rule; extend `CURRENCY_CONFIG` with `decimals`; replace every hardcoded list/raw `TextField`/`formatCurrency` site with the typed select + a shared FX-aware render helper.

## 2. Locked product rules (from Decision 3A)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LOCKED DEFINITION CURRENCY                                   │
│    Teacher hourly rate / parent fee / invoice / payout          │
│    Defined in a currency and stay in that currency forever.     │
│    FX up/down must NOT rewrite the agreed amount.               │
├─────────────────────────────────────────────────────────────────┤
│ 2. USER DISPLAY PREFERENCE (`users.displayCurrency`)            │
│    “Show me money in SAR/EGP/USD on the UI.”                    │
│    Mini use: convert locked amounts for viewing only.           │
├─────────────────────────────────────────────────────────────────┤
│ 3. LIVE FX (currency_exchange_rates)                            │
│    Used only to TRANSLATE locked → display for rendering.        │
│    Never mutates the locked definition or settled payment.      │
└─────────────────────────────────────────────────────────────────┘
```

This plan implements all three concepts from Decision 3A in one wave: part 1 (typing locked columns), part 2 (`users.displayCurrency`), and part 3 (the FX-convert-on-render read path with the stale-FX fallback). FX rate *ingestion* (fetching/caching/staleness-window tuning) is the only FX concern left untouched — the decision does not request changes to upload/cron cadence; only the 24h staleness THROW behavior is forked into a soft "show locked only" variant for the display path. The financial-path THROW stays intact so invoice snapshots keep failing loudly on stale FX.

## 3. Scope (IN)

Migrate, in one clean-slate wave, every existing currency surface PLUS the three new surfaces Decision 3A names:

| Layer | Surface | Action |
|-------|---------|--------|
| DB schema | 11 currency varchar columns across 7 tables (see plan.md §A) | Replace with `currencyCodeEnum` + Drizzle `.$type<CurrencyCode>()` |
| DB schema | NEW `users.displayCurrency` column — nullable `currencyCodeEnum("display_currency").$type<CurrencyCode>()`, default `null` (no bias toward any currency) | New (mirrors `users.timezone` row pattern at `backend/db/schema/users.ts:33`) |
| DB enum | `backend/db/schema/enums.ts` — add `currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode)` | New |
| Backend types | `billing.types.ts`, `teacher.types.ts`, `parent.types.ts`, `profile.types.ts`, `OverdueInvoiceRow`, `audit.repository.ts`, `scheduling/shared.ts`, `state-changes.ts` | `string` → `CurrencyCode` |
| Backend types | `UserReturnType` (re-apply `displayCurrency: CurrencyCode \| null`) + `CoreUserProfileFieldsInput`/`UpdateOwnProfileInput.core`/`UpdateUserProfileInput.core` accept `displayCurrency` | New enum field + input |
| Repositories | Insert/select/update paths on the 7 tables + `report.repository.ts` hardcoded `'EGP'`/`'USD'` CASE | Cast at boundaries; replace literals |
| Repositories | NEW `UserRepository.updateDisplayCurrency(userId, displayCurrency, tx?, locale?)` mirroring `updateTimezone` (`backend/db/repo/users/user.repository.ts:261`); add `users.displayCurrency` to `findSafeById` (line 49) and `updateProfileFields` (line 236) projections | New |
| Repositories | NEW soft FX-read variant `getLatestExchangeRateForDisplay(from, to, tx?, locale?)` returning `{ rate, stale }` / `null` instead of throwing; the existing `getLatestExchangeRate` THROW path stays intact for the financial snapshot insert | New — fork (do NOT change the financial-path throw) |
| Services | onboarding (teacher/parent), profile, billing-management, teacher-portal, teacher-banking, class-session | Retype inputs/outputs; keep FX snapshot logic intact |
| Services | NEW `backend/services/billing/fx-display.service.ts` exporting `convertForDisplay(lockedAmount, lockedCurrency, displayCurrency, tx?, locale?) → { convertedAmount: string \| null; rate: string \| null; stale: boolean }` — calls the soft FX variant, USD-hub transitive conversion when direct pair is missing | New |
| Services | `updateProfileFields` dispatcher in `backend/services/profile/profile.service.ts:78` accepts `displayCurrency` | Extend |
| GraphQL | All `t.exposeString("currency"|"rateCurrency")` + `t.arg.string(...)` → `t.expose("..." , { type: CurrencyCodePothosObject })` / `t.field({ type: CurrencyCodePothosObject })` (see plan.md §B for the 12 sites) | Swap |
| GraphQL | NEW `displayCurrency: t.expose("displayCurrency", { type: CurrencyCodePothosObject, nullable: true })` on the `User` Pothos object (`backend/graphql/pothos/auth/user.pothos.ts`); accept `displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false })` on `CoreUserProfileFieldsInput` (`backend/graphql/pothos/profile/profile.pothos.ts:114`) | New |
| GraphQL | NEW `DisplayAmountPothosObject` + a `displayAmount` field on money-bearing objects (Invoice rows, TeacherProfile `displayHourlyRate`, parent billing summary) whose resolver pulls `ctx.user.displayCurrency` and calls `FxDisplayService.convertForDisplay` | New |
| Codegen | `bun run generate:gqlSchema && bun codegen` | Re-run; surfaces `CurrencyCode` + new `displayCurrency` + new `DisplayAmount` types on generated operations |
| Frontend documents | `billing-management.documents.ts:13` `$currency: String!` → `$currency: CurrencyCode!`; the user/profile documents add `displayCurrency` selection + `displayAmount` field selection on money objects | Update + regen |
| Frontend lib | NEW `formatCurrencyForDisplay(amount, lockedCurrency, displayCurrency, fxRateOrNull, locale)` helper in `frontend/lib/currency.ts` (or new `frontend/lib/fx-render.ts`); renders locked-only when `fxRate == null \|\| stale`; renders `"{lockedAmount} (≈ {convertedApprox} {displayCurrency})"` when FX is live | New — replaces the 5 per-file `formatCurrency` duplicates |
| Frontend lib | Add `decimals: number` field to `CurrencyOption` + populate ISO 4217 minor-unit count for all 32 codes (Decision 3A naming row "CURRENCY_CONFIG (symbol, decimals, i18n)"); new `getCurrencyDecimals(code)` helper next to `getCurrencySymbol` | Extend existing catalog |
| Frontend UI | 3 hardcoded `<MenuItem>` lists, 2 raw `<TextField>`s, manual-invoice hardcoded `"USD"` arg — replace with `CurrencySelect` | Re-wire |
| Frontend UI | NEW `<CurrencySelect>` for `displayCurrency` in `AccountSection.tsx` of all three roles (teacher/parent/staff), since it's a user-wide preference not a role-specific one; view-mode `<CurrencyDisplay code={value} showLabel showSymbol />` | New control |
| Frontend UI | Swap 5 `formatCurrency` call sites (`AdminBillingContainer`, `ParentBillingContainer`, `UserBillingProfileContainer`, `PerformanceLedgerCard`, `ReportsDataGrid`, `ReportsTotalsRow`) to `formatCurrencyForDisplay` reading `useUserStore.displayCurrency` | Swap |
| Frontend Zod | 6 schemas `z.string()` → `z.nativeEnum(CurrencyCode)` | Tighten |
| Frontend Zod | `displayCurrency: z.nativeEnum(CurrencyCode).nullable().optional()` on the profile/account form schemas | New |
| Frontend types | 4 form/view types `string` → `CurrencyCode` | Retype |
| Frontend store | `frontend/stores/userStore.ts` `UserState` adds `displayCurrency: CurrencyCode \| null`, initialized `null`, plumbed in `setUser`; mirrors required on `mockUserStore` (Storybook) so client-side money render is globally available | New |
| Frontend `"USD"` defaults | Replace literal fallbacks with `CurrencyCode.Usd` import | Compile-safety |
| Seeds | `billing-factory.DEFAULT_INVOICE_CURRENCY`, `seed-teacher-payments`, `seed-currency-hedges`, `seed-currency-exchange-rates` pairs | Use enum |
| Seeds | `seed-users.ts` adds `displayCurrency: null` default (no currency bias) | New |
| Repo + logic tests | `billing.repository.test.ts`, `teacher.repository.test.ts`, `parent.repository.test.ts`, `report.repository.test.ts`, `billing-safeguards.test.ts`, `exchange-rate.test.ts`, etc. — literals → `CurrencyCode.Egp/Usd/Sar`. Run via `bun run scripts/run-test/run-test.ts`. | Update literals |
| Repo + logic tests | NEW `fx-display.service.test.ts` covering: (a) display === locked ⇒ no conversion needed; (b) live FX ⇒ `convertedAmount` returned; (c) stale FX ⇒ `stale: true, convertedAmount: null`; (d) USD-hub transitive path | New |
| Repo + logic tests | NEW `updateDisplayCurrency` repo test + `displayCurrency` round-trip on the user repo | New |
| Service tests | `profile.service.test.ts`, `parent-profile.service.test.ts`, `teacher-profile.service.test.ts` | Update literals |
| Service tests | `displayCurrency` set/get on the profile service | New |
| Stories | 6 Storybook fixtures using `"USD"`/`"SAR"` literals | Replace with `CurrencyCode.Usd/Sar` |
| Stories | NEW stories for the FX-render helper showing both states: live-conversion and stale-fallback | New |
| i18n | KEEP existing `currency`/`currencyRequired` keys (they apply post-migration); NEW keys: `displayCurrency` label in `profile.{teacher,parent,staff}.fields`; `convertedAmount: "{lockedAmount} {lockedCurrency} (≈ {convertedApprox} {displayCurrency})"` template; `displayCurrencyFallback: "Rate unavailable — showing {lockedAmount} {lockedCurrency}"` for the stale-FX rule | New keys (existing untouched) |
| Cleanup | Drop dead `getCurrencyOptionLabel` re-exports from `CurrencyAutocomplete.tsx` if any remain | Lint-pass |

## 4. Scope (OUT)

- **FX rate *ingestion*** (fetching/caching/cron cadence) — **implemented separately in [`.ai/plans/fx-ingestion/`](../fx-ingestion/spec.md)** (see prerequisite). The existing `getLatestExchangeRate` 24h staleness THROW stays intact for the financial snapshot insert. The display path forks a soft variant; this plan consumes the rates that fx-ingestion lands.
- **New money entities** (wallets, payment links, online accounts) — those tables don't exist yet; out of scope here. When they land per the payment-methods decisions, they should be created with `currencyCodeEnum` + the FX-read `displayAmount` field from day one.
- **Country-bundled currencies** (`CurrencyType.code` GraphQL enum from the original `currency-select` plan) — already merged; this plan supercedes the "use a string until the GraphQL enum lands" stub.
- **Dropping payment-related deprecated tables** — `payments`/`teacher_payments` keep their existing `currency` column; no table drops in this slice.
- **Renaming `rate_currency` → `currency`** — keep existing column names, only change types. Renames churn the schema and break downstream joiners for zero semantic gain in clean-slate mode.
- **`shared/` residency of currency config** — the `frontend/lib/currency.ts` catalog stays on the frontend for now. If a backend service (`fx-display.service.ts`) needs `decimals` for server-side rounding, the orchestrator decides whether to duplicate it into `shared/constants/currency-config.ts` per `shared/AGENTS.md` or to trust `Intl.NumberFormat` defaults server-side. Recorded as a cross-file dependency in plan.md Risk register, NOT a per-phase task here.

## 5. Locked technical decisions

| Topic | Choice |
|-------|--------|
| PG enum name | `currency_code` (snake-case, mirrors `country_code`, `invoice_status`) |
| Enum source | `backend/enum/currency.enum.ts` (already exists, 32 codes) |
| PG enum registration | `createPgEnumFromEnum("currency_code", CurrencyCode)` in `backend/db/schema/enums.ts` — mirrors `countryCodeEnum` |
| Drizzle column type | `currencyCodeEnum("...").notNull()` + `.$type<CurrencyCode>()` for TS-side narrowing (matches existing `countryCodeEnum` usage where TS narrowing is needed) |
| `users.displayCurrency` column | Nullable `currencyCodeEnum("display_currency").$type<CurrencyCode>()`, default `null` (no bias). NO extra CHECK constraint — the PG enum already constrains the domain. Mirrors `users.timezone` column at `backend/db/schema/users.ts:33`. |
| Migration shape (clean-slate) | `bun db cleanGenerate` regenerates the full migration set; no hand-written ALTER for the column-type swap or the new `display_currency` column |
| GraphQL enum reference | `CurrencyCodePothosObject` from `backend/graphql/pothos/shared/enum.pothos.ts` (already registered) |
| Pothos field shape | output: `t.expose("currency", { type: CurrencyCodePothosObject })`; input: `t.field({ type: CurrencyCodePothosObject, required: ... })` |
| `displayCurrency` Pothos shape | `displayCurrency: t.expose("displayCurrency", { type: CurrencyCodePothosObject, nullable: true })` on the `User` object; `displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false })` on `CoreUserProfileFieldsInput` |
| `DisplayAmount` Pothos shape | New `DisplayAmountPothosObject { amount: string \| null; currency: CurrencyCode; stale: boolean }`; resolver pulls `ctx.user.displayCurrency` and calls `FxDisplayService.convertForDisplay` |
| FX read-path fork | `getLatestExchangeRate` (existing) keeps THROWING for the financial snapshot insert. New `getLatestExchangeRateForDisplay` returns `{ rate, stale }` softly. The financial path is NEVER used by the display path. |
| FX conversion hub | USD-hub transitive conversion (locked → USD → display) when the direct `locked→display` pair is missing from `EXCHANGE_PAIRS` — mirrors the one-way `resolveExchangeRateSnapshot` (currency → USD) already in `billing.repository.ts`. Direct pair takes precedence when seeded. |
| Stale-FX rule (Decision 3A rule 5) | `fx-display.service.ts::convertForDisplay` returns `{ convertedAmount: null, stale: true }` when FX is missing/stale. The frontend `formatCurrencyForDisplay` then renders **locked amount + locked currency only** (no fabricated conversion). Behavioral change vs today (today the read path doesn't exist). |
| Frontend lib source-of-truth | `CurrencyCode` from `@/frontend/graphql/generated/gql/graphql-types` (codegen enum — not the backend enum directly, per `backend/enum/AGENTS.md`) |
| Frontend Zod validation | `z.nativeEnum(CurrencyCode)` everywhere currency is parsed from form input; `displayCurrency: z.nativeEnum(CurrencyCode).nullable().optional()` on profile/account schemas |
| Default currency literal | `CurrencyCode.Usd` replaces all `"USD"` fallbacks/hardcodes |
| `CURRENCY_CONFIG (symbol, decimals, i18n)` | Extend `frontend/lib/currency.ts` `CurrencyOption` with `decimals: number` (ISO 4217 minor-unit count) + `getCurrencyDecimals(code)` helper. Used by `formatCurrencyForDisplay` for deterministic locked-amount rounding. The `convertedApprox` display uses `Intl.NumberFormat(code, { maximumFractionDigits: 2 })` (2-dp approximation). |
| EGP SQL CASE in report.repo | Replace raw `'EGP'` / `'USD'` literals with `${CurrencyCode.Egp}` / `${CurrencyCode.Usd}` interpolated params (drizzle-safe) OR keep as string literal if `sql<T>` template bypasses typing — see plan.md §6.4 |
| Reports currency-pair columns | CROSS-FILE dependency: `paidEgp`/`paidUsd` hardcoded column pairs in `ReportsDataGrid`/`ReportsTotalsRow`/`PerformanceLedgerCard` + backing resolver in `backend/db/repo/books/report.repository.ts` must move to `{ amount, currency }` rows + display conversion BEFORE the frontend can honor `displayCurrency` on reports. Recorded in plan.md Risk register. |

## 6. Acceptance criteria

1. `bun tsgo -b --noEmit` — zero currency-related type errors (any remaining errors must be pre-existing and unrelated).
2. `bun biome:check` on every touched file — clean.
3. Lint queue on the full touched file list — 0 errors.
4. `bun db cleanGenerate` produces a fresh migration set that contains `CREATE TYPE currency_code AS ENUM (...)`, column-type changes for the 7 tables, AND a new nullable `display_currency` column on `users`.
5. After `cleanGenerate` + seed, all repo tests via `bun run scripts/run-test/run-test.ts <path>` pass (parallel db-test runner ok).
6. All logic tests touching FX (`billing-safeguards`, `exchange-rate`) pass after `fromCurrency`/`toCurrency` literals flip to `CurrencyCode.Usd/Egp`. The new `fx-display.service.test.ts` covers the soft/stale/USD-hub paths.
7. `bun run generate:gqlSchema && bun codegen` succeeds; the 12 generated-type currency fields now read `Maybe<CurrencyCode>` / `CurrencyCode` (no more `Maybe<Scalars['String']['...']>`); the `User` type surfaces `displayCurrency`; money-bearing objects surface `displayAmount`.
8. `bun test frontend/graphql/test/` — GraphQL integration tests pass; the one assertion in `profile.documents.test.ts:55` (`expect(mutationSource).toContain("currency")`) still passes; new `displayCurrency` update mutation test passes.
9. Storybook stories render for `CurrencyDisplay` + `CurrencySelect` (already implemented), every money-form story (`TeacherProfileEditForm`, `ParentProfileEditForm`, `ManualInvoice*`, `TeacherOnboardingView`, `ParentOnboardingView`) renders without a hardcoded list, AND the new FX-render stories show both live-conversion AND stale-fallback states.
10. **Decision 3A rule 2 (display conversion)** — verified end-to-end: with `users.displayCurrency = USD` set and a teacher locked at `50 EGP` + live FX seeded, the teacher profile shows `50 EGP (≈ X USD)`. With stale/missing FX, shows `50 EGP` only. Behavior verified in `fx-display.service.test.ts` and a Storybook fixture.
11. **Decision 3A rule 5 (stale FX fallback)** — verified: `getLatestExchangeRateForDisplay` returns `{ stale: true, rate: null }` when the latest seeded row is older than 24h; `formatCurrencyForDisplay` renders locked-only.
12. `.ai/plans/user-entity-enhancement/ANALYSIS.md` §2.3 + §7.1 updated to mark BOTH the typing slice AND the display-currency/FX-read-path slice as "landed — typed enum + typed columns + typed GraphQL + `users.displayCurrency` + FX convert-on-render with stale fallback"; links to this plan.

## 7. Out of scope (re-iteration)

Decision 3A is fully in scope. The ONLY currency behaviors left out are:

- **FX rate *ingestion*** (fetch source, cron cadence, cache TTL tuning) — the decision doesn't request changes here; only the read-path fork is new.
- **New money entities** not covered by Decision 3A (wallets, payment links, online accounts) — they don't exist yet and are governed by separate `payment-methods` decisions. When they land they must use `currencyCodeEnum` + the `displayAmount` field from day one.
- **Dropping deprecated payment tables / renaming `rate_currency`** — schema-churn with no semantic gain in clean-slate mode.

Everything else Decision 3A names — locked typing, `users.displayCurrency`, the convert-on-render read path, the stale-FX fallback rule, `CURRENCY_CONFIG (symbol, decimals, i18n)` — is IN scope. This plan supersedes the earlier "OUT" framing.

---

## 8. Governing rules — every layer's AGENTS.md applies

This plan is **layer-enforced**. Every phase in `plan.md` / `tasks.md` carries a `_Rules:` footer that names the controlling rule file(s) for that layer. Implementers MUST read all listed rule files before touching that layer. The canonical rule sources are:

| Layer touched | Mandatory rule files (read before editing) |
|---|---|
| Root / cross-cutting | `AGENTS.md` (always — lint queue server, verification loop, sonar-scan prohibition, fix-or-report cross-file rule) |
| Shared (`shared/**`) | `shared/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (i18n message types) |
| Backend enums / DB schema | `backend/AGENTS.md` + `backend/db/repo/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Seeds section, DB schema section) |
| Backend types (`backend/types/**`) | `backend/types/AGENTS.md` + `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Type Definition Pattern) |
| Repositories (`backend/db/repo/**`) | `backend/db/repo/AGENTS.md` + `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Repository Layer) |
| Services (`backend/services/**`) | `backend/services/AGENTS.md` + `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Service Layer) |
| Pothos (`backend/graphql/pothos/**`) — incl. NEW `DisplayAmountPothosObject` + `displayCurrency` field on `User` + `displayAmount` resolvers | `backend/graphql/AGENTS.md` + `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Pothos/GraphQL) |
| FX-convert-on-render service (`backend/services/billing/fx-display.service.ts`) + soft repo variant (`getLatestExchangeRateForDisplay`) | `backend/services/AGENTS.md` + `backend/db/repo/AGENTS.md` (FX read path stays repo-only for the rate fetch) + `backend/AGENTS.md` |
| Frontend store (`frontend/stores/userStore.ts` + mock store) | `frontend/stores/AGENTS.md` + `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (Zustand stores) |
| `frontend/lib/currency.ts` / new FX-render helper | `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md` |
| Frontend GraphQL documents (`frontend/graphql/sharedDocuments/**`) | `frontend/graphql/sharedDocuments/AGENTS.md` + `frontend/graphql/AGENTS.md` + `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL) |
| Frontend views / components | `frontend/views/AGENTS.md` + `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md` |
| Tests (any `*.test.ts(x)`) | `tests.instructions.md` + the AGENTS.md of the layer being tested |
| Seeds (`backend/db/seeds/**`) | `backend/AGENTS.md` (Seeds section) + `.agents/instructions/backend.instructions.md` (Seeds CRITICAL section) |

### Rules this plan explicitly honors (cross-cutting, from root `AGENTS.md`)

- **Lint queue server**: never `bun run lint` / `bun lint` directly. Run `~/.bun/bin/bun run scripts/lint-queue-server.ts` once at the start, then submit per-file via `POST http://localhost:4777/lint`. Every phase's verification step uses the queue.
- **Per-file verification loop**: after editing a file, run `tsgo` → `biome:check` → lint-queue-client on THAT file BEFORE importing or using the result elsewhere.
- **Sonar-scan prohibition**: sub-agents NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts` (scan-trigger). The orchestrator handles SONAR stages against the existing `.scannerwork/sonar-result.json`. Read-only `list-duplicates` / `list-files` are allowed for the orchestrator only.
- **Fix-or-report cross-file rule**: a sub-agent edit only the file it was assigned. If a fix requires changes to ANOTHER file, the sub-agent reports `CROSS-FILE DEPENDENCY: ...` up to the orchestrator rather than editing the unassigned file.
- **Database test rules**: `runInRollback` always; pass `tx` to ALL repo calls inside a transaction; NEVER `expect(...).rejects.toThrow()` inside rollback (use try/catch `expectRepoError` pattern); run tests via `bun run scripts/run-test/run-test.ts <path>` (never raw `bun test`); never query seed data — create test data via `entity-setup.ts` helpers.
- **AI agent communication**: NEVER create summary markdown files (SUMMARY.md, CHANGES.md, REPORT.md, FIXED.md).

### Layer-specific non-obvious rules honoring (selected — read full files at edit time)

- **Backend types**: single canonical type per entity via `$inferSelect`/`$inferInsert` + `Omit<>` ReturnType that **re-applies the enum** (spec §A.5). `CurrencyCode` replaces `string` as the re-applied enum for the 7 typed columns AND for the new `displayCurrency` on `UserReturnType` (mirrors the existing `timezone: IanaTimezone` re-apply at `backend/types/users/user.types.ts:17-30`). **Never** create local types in Pothos files — `DisplayAmountPothosObject` references `backend/types/billing.types.ts::DisplayAmountReturnType`.
- **Repositories**: data access ONLY — no business logic, no permission checks, no hardcoded user-facing error strings (use `getBackendTranslations` + `locale?` param). For `report.repository.ts` `'EGP'`/`'USD'` SQL CASE — use `sql<number>` template with `.mapWith(Number)` pattern, NOT raw `CAST`. Repos must use `{Entity}SelectType` / `{Entity}InsertType` from `backend/types/` (not schema types directly). NEW `getLatestExchangeRateForDisplay` lives in `backend/db/repo/billing/billing.repository.ts` next to the throwing variant — it is a SOFT read (returns `null`, no throw). NEW `updateDisplayCurrency` mirrors `updateTimezone` (`backend/db/repo/users/user.repository.ts:261`) — same param order.
- **Services**: domain-driven (no monolithic). Import types from `@/backend/types`. Services do data transformations `SubmitInput → InsertType`, `SelectType → ReturnType`. SSR-compatible — must NOT rely on GraphQL context unless passed explicitly. Pass `locale?` through. NEW `fx-display.service.ts` is a `billing/`-domain service; the `displayAmount` Pothos resolver delegates to it (never to the repo directly), passing `ctx.user.displayCurrency` explicitly.
- **Pothos**: objectRef uses ReturnType from `backend/types`. `nullable: true` REQUIRED for `CurrencyCode | null` fields (Pothos defaults non-nullable) — applies to `displayCurrency` on `User`. Resolvers delegate to SERVICES — never repos. Propagate `ctx.locale`. `id` field on every object — the new `DisplayAmountPothosObject` carries `id` (a synthetic `displayAmount:<entityId>:<displayCurrency>` composite). Exceptions: input types and collection wrappers allowed as separate types.
- **Frontend documents**: import `gql` + `TypedDocumentNode` from `"@apollo/client"` (NOT `@apollo/client/core`). Import hooks from `"@apollo/client/react"`. Always include `id` field. No `useLazyQuery`. Naming: `{entityName}QueryDocument` / `{entityName}MutationDocument` with `TypedDocumentNode<Operations.X, Types.Y>`. Codegen after ANY schema or document change (`generate:gqlSchema && codegen`). New `displayAmount` selections must include `id` to keep Apollo cache normalization intact.
- **Frontend UI**: MUI v9 style props in `sx` only (no direct `fontWeight`/`mb`/`alignItems` on Typography/Stack/Box/Grid). React 19 — no `FormEvent`. Functional components only. `<RequirePermission>` for permission-gated views. Apollo `useQuery` only (no lazy). Theme callback for colors — no hardcoded hex. `useTranslations` for all user-facing text. Stories auto-wrapped in `NextIntlClientProvider`. NEW `displayCurrency` `<CurrencySelect>` lives in `AccountSection` of all three roles (user-wide preference, not role-specific); the `<CurrencyDisplay>` view-mode rendering mirrors the existing `<LocaleEmoji>` pattern.
- **Shared**: NEVER import from `@/frontend/**`, `@/backend/**`, `@/app/**` (ESLint-enforced). Deep imports over barrels. i18n message types in `shared/messages/types/` must NOT reference view types or codegen types. The new i18n keys (`displayCurrency`, `convertedAmount`, `displayCurrencyFallback`) follow the existing `currency` / `currencyRequired` shape.
- **Frontend stores**: `frontend/stores/AGENTS.md` — Zustand stores hold cross-page UI state; `userStore.displayCurrency` is the right home for a user-wide money-render preference consumed by `formatCurrencyForDisplay` globally. The Storybook mock store mirrors the field so stories render deterministically.
- **Seeds (CRITICAL)**: one `seedOrGet` per table; idempotent (`onConflictDoUpdate` / `onConflictDoNothing`). Match PG enum values EXACTLY from `backend/db/schema/enums.ts` — never guess (e.g. `"EGP"` literal must match the `currency_code` enum value `"EGP"`, which `CurrencyCode.EGP === "EGP"` does). Check constraints before seeding (read `backend/db/schema/*.ts`). After schema change: run `bun db push` or `cleanGenerate` BEFORE `bun db seed`. Return seeded entities downstream. `seed-users.ts` adds `displayCurrency: null` (NO currency bias) — we do not push any user toward a default currency.
- **FX read path — orchestrator architectural decisions (NOT per-file sub-agent fixes)**:
  1. **Transitive conversion hub** — `fx-display.service.ts::convertForDisplay` should try the direct `locked→display` pair first; if missing, fall back to `locked→USD→display` using the seeded USD-anchored pairs (mirrors `resolveExchangeRateSnapshot` in `billing.repository.ts:56-66`). The orchestrator verifies `EXCHANGE_PAIRS` cardinality in `backend/db/seeds/lib` (cursorignored) before Phase 15 starts.
  2. **Reports currency-pair columns CROSS-FILE DEPENDENCY** — `paidEgp`/`paidUsd` hardcoded column pairs in `ReportsDataGrid.tsx:163`, `ReportsTotalsRow.tsx:23`, `PerformanceLedgerCard.tsx:156` + their backing resolver in `backend/db/repo/books/report.repository.ts` / `backend/services/report/report.service.ts` MUST move to `{ amount, currency }` rows + the `displayAmount` resolver before the frontend can honor `displayCurrency` on reports. Cannot be done by a single per-file sub-agent — orchestrator coordinates a wave across repo → service → Pothos → frontend documents → UI.
  3. **`shared/` residency of currency config** — if `fx-display.service.ts` needs `decimals` server-side, the orchestrator decides whether to duplicate `currencies` into `shared/constants/currency-config.ts` (preferred per `shared/AGENTS.md`) vs trusting `Intl.NumberFormat` defaults server-side. Default choice: trust `Intl` server-side to avoid `shared/` cross-layer coupling drift; keep `decimals` on the frontend catalog only.
