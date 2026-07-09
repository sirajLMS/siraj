# Currency Migration — Specification

**Status:** Planning
**Implements:** `.ai/plans/user-entity-enhancement/decisions/03-currency-vs-rate-currency.md` (Decision **3A**)
**Updates:** `.ai/plans/user-entity-enhancement/ANALYSIS.md` § 7.1 + § 2.3 (mark currency as landed)
**Migration strategy:** Inherited Decision **8C** — clean-slate (`bun db cleanGenerate`), no dual-write
**Parent plan:** `.ai/plans/user-entity-enhancement/` (currency slice only — other decisions untouched here)

---

## 1. Problem

Currency is stored as free `varchar(10)` on every money entity (`teachers.rateCurrency`, `parents.currency`, `invoices.currency`, `payments.currency`, `teacher_payments.currency`, `class_instances.rateCurrency`) and on the FX catalog (`currency_exchange_rates.fromCurrency/toCurrency`, `currency_exchange_audit_logs`, `currency_hedges`). UIs hardcode 3–5-item `<MenuItem>` lists or raw `<TextField>`s. There is **no** `CurrencyCode` enum on the DB or GraphQL — every layer is untyped.

A typed `CurrencyCode` GraphQL enum was already landed in the prior step:

- `backend/enum/currency.enum.ts` — 32 codes (all Arabic countries + Turkey + USD/EUR/GBP/CHF/CNY/JPY/INR/CAD/AUD)
- `backend/graphql/pothos/shared/enum.pothos.ts` — `CurrencyCodePothosObject` registered
- codegen: `CurrencyCode` enum in `frontend/graphql/generated/gql/graphql-types.ts` (`926`) and `frontend/graphql/generated/schema.graphql` (`881`)
- `frontend/lib/currency.ts`, `CurrencySelect`, `CurrencyDisplay`, `shared/messages/{types,ar,en}/ui/currency-select.ts` i18n — **foundation only, not wired into money UI yet**

This plan swaps every varchar currency column, every Pothos `t.string`/`t.exposeString` currency field, every hardcoded frontend currency list, and every Zod `z.string()` currency validator over to the typed `CurrencyCode` enum — across all layers — in one clean-slate wave.

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

This slice is **only** part 1 + part 3 typing. Part 2 (`users.displayCurrency`) is deferred to the User Entity Enhancement parent plan — its own `users.displayCurrency` column will be added there when person fields centralize on `users`. **Do NOT add `users.displayCurrency` in this slice.** This slice types the existing money + FX columns only.

## 3. Scope (IN)

Migrate, in one clean-slate wave, every existing currency surface:

| Layer | Surface | Action |
|-------|---------|--------|
| DB schema | 11 currency varchar columns across 7 tables (see plan.md §A) | Replace with `currencyCodeEnum` + Drizzle `.$type<CurrencyCode>()` |
| DB enum | `backend/db/schema/enums.ts` — add `currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode)` | New |
| Backend types | `billing.types.ts`, `teacher.types.ts`, `parent.types.ts`, `profile.types.ts`, `OverdueInvoiceRow`, `audit.repository.ts`, `scheduling/shared.ts`, `state-changes.ts` | `string` → `CurrencyCode` |
| Repositories | Insert/select/update paths on the 7 tables + `report.repository.ts` hardcoded `'EGP'`/`'USD'` CASE | Cast at boundaries; replace literals |
| Services | onboarding (teacher/parent), profile, billing-management, teacher-portal, teacher-banking, class-session | Retype inputs/outputs; keep FX snapshot logic intact |
| GraphQL | All `t.exposeString("currency"|"rateCurrency")` + `t.arg.string(...)` → `t.expose("..." , { type: CurrencyCodePothosObject })` / `t.field({ type: CurrencyCodePothosObject })` (see plan.md §B for the 12 sites) | Swap |
| Codegen | `bun run generate:gqlSchema && bun codegen` | Re-run; surfaces `CurrencyCode` types on generated operations |
| Frontend documents | 3 documents using `$currency: String!/String` → `$currency: CurrencyCode!/CurrencyCode`; other documents just re-select (no var change) | Update 3 docs + regenerate ops |
| Frontend UI | 3 hardcoded `<MenuItem>` lists, 2 raw `<TextField>`s, manual-invoice hardcoded `"USD"` arg — replace with `CurrencySelect` | Re-wire |
| Frontend Zod | 6 schemas `z.string()` → `z.nativeEnum(CurrencyCode)` | Tighten |
| Frontend types | 4 form/view types `string` → `CurrencyCode` | Retype |
| Frontend `"USD"` defaults | Replace literal fallbacks with `CurrencyCode.Usd` import | Compile-safety |
| Seeds | `billing-factory.DEFAULT_INVOICE_CURRENCY`, `seed-teacher-payments`, `seed-currency-hedges`, `seed-currency-exchange-rates` pairs | Use enum |
| Repo + logic tests | `billing.repository.test.ts`, `teacher.repository.test.ts`, `parent.repository.test.ts`, `report.repository.test.ts`, `billing-safeguards.test.ts`, `exchange-rate.test.ts`, etc. — literals → `CurrencyCode.Egp/Usd/Sar`. Run via `bun run scripts/run-test/run-test.ts`. | Update literals |
| Service tests | `profile.service.test.ts`, `parent-profile.service.test.ts`, `teacher-profile.service.test.ts` | Update literals |
| Stories | 6 Storybook fixtures using `"USD"`/`"SAR"` literals | Replace with `CurrencyCode.Usd/Sar` |
| Cleanup | Drop dead `getCurrencyOptionLabel` re-exports from `CurrencyAutocomplete.tsx` if any remain | Lint-pass |

## 4. Scope (OUT)

- **`users.displayCurrency`** — deferred to parent User Entity Enhancement plan (Decision 3A part 2). This slice does NOT add the column.
- **FX rate ingestion** — exchange-rate fetching/caching/staleness rules are unchanged. We only type the `fromCurrency`/`toCurrency` columns.
- **Converting locked → display at render time** — display-conversion rendering is part 2; deferred.
- **New money entities** (wallets, payment links, online accounts) — those tables don't exist yet; out of scope here. When they land per the payment-methods decisions, they should be created with `currencyCodeEnum` from day one.
- **Country-bundled currencies** (`CurrencyType.code` GraphQL enum from the original `currency-select` plan) — already merged; this plan supercedes the "use a string until the GraphQL enum lands" stub.
- **Dropping payment-related deprecated tables** — `payments`/`teacher_payments` keep their existing `currency` column; no table drops in this slice.
- **Renaming `rate_currency` → `currency`** — keep existing column names, only change types. Renames churn the schema and break downstream joiners for zero semantic gain in clean-slate mode.
- **i18n message *keys*** — the existing `currency: "Currency"` / `currencyRequired: "..."` strings stay (they're display labels and still apply post-migration).

## 5. Locked technical decisions

| Topic | Choice |
|-------|--------|
| PG enum name | `currency_code` (snake-case, mirrors `country_code`, `invoice_status`) |
| Enum source | `backend/enum/currency.enum.ts` (already exists, 32 codes) |
| PG enum registration | `createPgEnumFromEnum("currency_code", CurrencyCode)` in `backend/db/schema/enums.ts` — mirrors `countryCodeEnum` |
| Drizzle column type | `currencyCodeEnum("...").notNull()` + `.$type<CurrencyCode>()` for TS-side narrowing (matches existing `countryCodeEnum` usage where TS narrowing is needed) |
| Migration shape (clean-slate) | `bun db cleanGenerate` regenerates the full migration set; no hand-written ALTER for the column-type swap |
| GraphQL enum reference | `CurrencyCodePothosObject` from `backend/graphql/pothos/shared/enum.pothos.ts` (already registered) |
| Pothos field shape | output: `t.expose("currency", { type: CurrencyCodePothosObject })`; input: `t.field({ type: CurrencyCodePothosObject, required: ... })` |
| Frontend lib source-of-truth | `CurrencyCode` from `@/frontend/graphql/generated/gql/graphql-types` (codegen enum — not the backend enum directly, per `backend/enum/AGENTS.md`) |
| Frontend Zod validation | `z.nativeEnum(CurrencyCode)` everywhere currency is parsed from form input |
| Default currency literal | `CurrencyCode.Usd` replaces all `"USD"` fallbacks/hardcodes |
| EGP SQL CASE in report.repo | Replace raw `'EGP'` / `'USD'` literals with `${CurrencyCode.Egp}` / `${CurrencyCode.Usd}` interpolated params (drizzle-safe) OR keep as string literal if `sql<T>` template bypasses typing — see plan.md §6.4 |

## 6. Acceptance criteria

1. `bun tsgo -b --noEmit` — zero currency-related type errors (any remaining errors must be pre-existing and unrelated).
2. `bun biome:check` on every touched file — clean.
3. Lint queue on the full touched file list — 0 errors.
4. `bun db cleanGenerate` produces a fresh migration set that contains `CREATE TYPE currency_code AS ENUM (...)` and column-type changes for the 7 tables.
5. After `cleanGenerate` + seed, all repo tests via `bun run scripts/run-test/run-test.ts <path>` pass (parallel db-test runner ok).
6. All logic tests touching FX (`billing-safeguards`, `exchange-rate`) pass after `fromCurrency`/`toCurrency` literals flip to `CurrencyCode.Usd/Egp`.
7. `bun run generate:gqlSchema && bun codegen` succeeds; the 12 generated-type currency fields now read `Maybe<CurrencyCode>` / `CurrencyCode` (no more `Maybe<Scalars['String']['...']>`).
8. `bun test frontend/graphql/test/` — GraphQL integration tests pass; the one assertion in `profile.documents.test.ts:55` (`expect(mutationSource).toContain("currency")`) still passes.
9. Storybook stories render for `CurrencyDisplay` + `CurrencySelect` (already implemented) AND every money-form story (`TeacherProfileEditForm`, `ParentProfileEditForm`, `ManualInvoice*`, `TeacherOnboardingView`, `ParentOnboardingView`) renders without a hardcoded list.
10. `.ai/plans/user-entity-enhancement/ANALYSIS.md` §2.3 + §7.1 updated to mark the currency slice as "landed — typed enum + typed columns + typed GraphQL"; links to this plan.

## 7. Out of scope (re-iteration)

Nothing in Decision 3A beyond typing columns. FX rate behavior, snapshot policy, "stale FX show locked-only" rule — none of those behaviors change here; only their column types and call-site types do. Behavior-preserving migration.

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
| Pothos (`backend/graphql/pothos/**`) | `backend/graphql/AGENTS.md` + `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Pothos/GraphQL) |
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

- **Backend types**: single canonical type per entity via `$inferSelect`/`$inferInsert` + `Omit<>` ReturnType that **re-applies the enum** (spec §A.5). `CurrencyCode` replaces `string` as the re-applied enum for the 7 typed columns. **Never** create local types in Pothos files.
- **Repositories**: data access ONLY — no business logic, no permission checks, no hardcoded user-facing error strings (use `getBackendTranslations` + `locale?` param). For `report.repository.ts` `'EGP'`/`'USD'` SQL CASE — use `sql<number>` template with `.mapWith(Number)` pattern, NOT raw `CAST`. Repos must use `{Entity}SelectType` / `{Entity}InsertType` from `backend/types/` (not schema types directly).
- **Services**: domain-driven (no monolithic). Import types from `@/backend/types`. Services do data transformations `SubmitInput → InsertType`, `SelectType → ReturnType`. SSR-compatible — must NOT rely on GraphQL context unless passed explicitly. Pass `locale?` through.
- **Pothos**: objectRef uses ReturnType from `backend/types`. `nullable: true` REQUIRED for `CurrencyCode | null` fields (Pothos defaults non-nullable). Resolvers delegate to SERVICES — never repos. Propagate `ctx.locale`. `id` field on every object. Exceptions: input types and collection wrappers allowed as separate types.
- **Frontend documents**: import `gql` + `TypedDocumentNode` from `"@apollo/client"` (NOT `@apollo/client/core`). Import hooks from `"@apollo/client/react"`. Always include `id` field. No `useLazyQuery`. Naming: `{entityName}QueryDocument` / `{entityName}MutationDocument` with `TypedDocumentNode<Operations.X, Types.Y>`. Codegen after ANY schema or document change (`generate:gqlSchema && codegen`).
- **Frontend UI**: MUI v9 style props in `sx` only (no direct `fontWeight`/`mb`/`alignItems` on Typography/Stack/Box/Grid). React 19 — no `FormEvent`. Functional components only. `<RequirePermission>` for permission-gated views. Apollo `useQuery` only (no lazy). Theme callback for colors — no hardcoded hex. `useTranslations` for all user-facing text. Stories auto-wrapped in `NextIntlClientProvider`.
- **Shared**: NEVER import from `@/frontend/**`, `@/backend/**`, `@/app/**` (ESLint-enforced). Deep imports over barrels. i18n message types in `shared/messages/types/` must NOT reference view types or codegen types.
- **Seeds (CRITICAL)**: one `seedOrGet` per table; idempotent (`onConflictDoUpdate` / `onConflictDoNothing`). Match PG enum values EXACTLY from `backend/db/schema/enums.ts` — never guess (e.g. `"EGP"` literal must match the `currency_code` enum value `"EGP"`, which `CurrencyCode.EGP === "EGP"` does). Check constraints before seeding (read `backend/db/schema/*.ts`). After schema change: run `bun db push` or `cleanGenerate` BEFORE `bun db seed`. Return seeded entities downstream.
