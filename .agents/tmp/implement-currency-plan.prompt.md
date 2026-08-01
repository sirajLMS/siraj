# Task: Implement the Currency Migration plan

Implement the **Currency Migration** plan that is already authored under `.ai/plans/currency/`. Do NOT re-author the plan. Execute it phase by phase.

## Plan files (read these in full, in this order, before starting)

1. `.ai/plans/currency/spec.md` — the spec, locking product rules (Decision 3A), in/out scope, technical decisions, acceptance criteria, and §8 "Governing rules" mapping every layer to its mandatory AGENTS.md + instruction files.
2. `.ai/plans/currency/plan.md` — 19 phases, strict top-to-bottom order, each with exact file paths + line numbers + the swap to make, and a `_Rules (read before editing):_ …` footer naming the rule files for that layer.
3. `.ai/plans/currency/tasks.md` — checkbox-per-task tracking (T1.1 … T19.12) mapping 1:1 to plan.md phases, with the same per-phase `_Rules` footers and a top-of-file summary table mapping phases → rule files.

Work through the tasks in `tasks.md` strictly in order. Mark `[x]` as each task's per-file verification loop (`tsgo` → `biome:check` → lint-queue-client) passes. Do NOT advance a phase until every task in it is `[x]`.

## Context from prior chat (you have no memory of this — read it carefully)

### What was already built (foundation — DO NOT re-create)

The `CurrencyCode` GraphQL enum and the consumer-side UI components are already landed. Re-creating any of these is wasted work:

- `backend/enum/currency.enum.ts` — the `CurrencyCode` TS enum with 32 codes (all Arabic-speaking countries + Turkey + USD/EUR/GBP/CHF/CNY/JPY/INR/CAD/AUD)
- `backend/enum/index.ts` — barrel export of `CurrencyCode`
- `backend/graphql/pothos/shared/enum.pothos.ts` — `CurrencyCodePothosObject` is already registered (around line 136)
- codegen outputs: `frontend/common/graphql/generated/gql/graphql-types.ts` (~line 926) and `frontend/common/graphql/generated/schema.graphql` already expose the `CurrencyCode` enum
- `frontend/lib/currency.ts` — single flat file with `CurrencyOption` type, `currencies` catalog (note: EUR uses the EU flag `🇪🇺` + `countryCode: "EU"`), and helpers `getCurrencyByCode`, `getCurrencyFlag`, `getCurrencySymbol`, `getCurrencyDisplayName` (Intl.DisplayNames), `getCurrencyOptions`, `getCurrencyOptionLabel`, `getCurrencyOptionRowLabel`
- `frontend/components/ui/input/currencySelect/` — 5-file split: `CurrencySelect.tsx`, `CurrencyAutocomplete.tsx`, `CurrencyOptionRow.tsx`, `currencyAutocompletePopper.ts`, `CurrencySelect.stories.tsx`. Start + end adornments (search icon + flag) are already wired. Re-exported from `frontend/components/ui/input/index.ts`.
- `frontend/components/ui/display/currencyDisplay/` — `CurrencyDisplay.tsx` + stories. Re-exported from `frontend/components/ui/display/index.ts`.
- `shared/messages/types/ui/currency-select.ts`, `shared/messages/ar/ui/currency-select.ts`, and the `ui.currencySelect` block in `shared/messages/en.ts` — i18n already wired.

### What this plan does

Migrate every free `varchar(10)` currency column, every Pothos `t.string`/`t.exposeString`/`t.arg.string` currency field, every hardcoded frontend currency `<MenuItem>` list / raw `<TextField>`, every Zod `z.string()` currency validator, and every `CurrencyCode`-shape `"USD"` literal — over to the typed `CurrencyCode` GraphQL enum — across all layers — in ONE clean-slate wave. The plan covers:

- types/enums → DB → `bun db cleanGenerate` → repo → db tests → services → Pothos GraphQL → `bun run generate:gqlSchema && bun codegen` → frontend graphql documents → graphql tests → UI components
- 11 varchar currency columns across 7 tables flip to `currencyCodeEnum(...).$type<CurrencyCode>()`
- 12 Pothos currency sites flip to `CurrencyCodePothosObject`
- 3 hardcoded `<MenuItem>` lists + 2 raw `<TextField>`s + manual-invoice hardcoded arg → `<CurrencySelect>`
- 6 Zod schemas tighten `z.string()` → `z.nativeEnum(CurrencyCode)`
- ~24 `"USD"` fallback literals → `CurrencyCode.USD`
- ~103 files touched across 19 phases

### Out of scope (do NOT do)

- Do NOT add `users.displayCurrency` — that is parent-plan scope (User Entity Enhancement). This slice types existing money + FX columns ONLY.
- Do NOT change FX rate fetching/snapshot/staleness behavior — only the column types and call-site types change.
- Do NOT create new money tables (wallets, payment links, online accounts).
- Do NOT rename `rate_currency` → `currency` (keep existing column names; only change types).
- Do NOT touch the i18n message *keys* (`currency: "Currency"`, `currencyRequired: "..."` stay as display labels).
- `exchangeRateSnapshot` / `exchangeRateSource` stay `String` (numeric rate + free description, not currency codes).
- `report.repository.ts` SQL CASE literals `'EGP'`/`'USD'` — prefer keeping them as raw SQL string literals inside the `sql<T>` template (drizzle-safe, option A). Only interpolate `${CurrencyCode.Egp}` if a typing assertion forces it. Record the choice in the PR description.

### Decisions already made (don't re-litigate)

- PG enum name: `currency_code`, registered via `createPgEnumFromEnum("currency_code", CurrencyCode)` in `backend/db/schema/enums.ts` next to `countryCodeEnum` (mirrors the existing pattern). This derives PG enum values from the TS enum so they stay synced — `CurrencyCode.EGP === "EGP"`.
- Migration strategy: clean-slate via `bun db cleanGenerate` (Decision 8C). No incremental ALTER, no dual-write. `cleanGenerate` is action `8` in `scripts/dbActions/actions.ts` — it wipes `backend/drizzle/`, resets the DB, regenerates the extensions migration + main migration + bundles custom migrations under `backend/db/migration/` into one `combined_custom_logic` migration, migrates, and seeds.
- Frontend lib source-of-truth: `CurrencyCode` from `@/frontend/common/graphql/generated/gql/graphql-types` (codegen enum — NOT the backend enum directly, per `backend/enum/AGENTS.md`).
- Drizzle column shape: `currencyCodeEnum("...").$type<CurrencyCode>()` (nullable ones omit `.notNull()`; required ones add `.notNull()`).

## Rules enforcement (critical — this is the whole point of this plan)

- EVERY phase in `plan.md` and `tasks.md` ends with a `_Rules (read before editing):_ …` footer. Before editing any file in a phase, READ every rule file named in that footer. Do not skip this. The footers name the specific rule from each file that bites this layer (e.g. Phase 7 cites "Pothos defaults non-nullable so `nullable: true` is REQUIRED for `CurrencyCode | null`"; Phase 14 cites "tx Parameter Position varies per method — read repo signature before calling").
- `spec.md` §8 has the master layer→rule-file table and per-layer non-obvious honors. Re-read it whenever you change layers.
- Cross-cutting rules from root `AGENTS.md` apply to every phase:
  - **Lint queue server**: start the queue server once at the start: `~/.bun/bin/bun run scripts/lint-queue-server.ts &` (listens on `http://localhost:${LINT_QUEUE_PORT}`). `bun run lint` IS the lint queue client — safe to invoke directly. For per-file lint, submit via `curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -H "Content-Type: application/json" -d '{"id":"phaseN","files":["<path1>","<path2>"]}'`.
  - **Per-file verification loop**: after editing a file, run `bun tsgo` → `bun biome:check` → lint-queue-client on THAT file BEFORE importing or using the result elsewhere.
  - **Sonar-scan prohibition**: sub-agents NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts` (scan-trigger). Only the orchestrator handles SONAR stages against the existing `.scannerwork/sonar-result.json`. Read-only `list-duplicates` / `list-files` allow-listed for orchestrator only.
  - **Fix-or-report cross-file rule**: edit only the file you were assigned. If a fix requires changes to ANOTHER file, report `CROSS-FILE DEPENDENCY: Target file: … | Blocked by: … | Rule violated: … | Required fix: …` up; do NOT modify the unassigned file.
  - **Database tests**: `runInRollback` always; pass `tx` to ALL repo calls inside a transaction; NEVER `expect(...).rejects.toThrow()` inside rollback (use try/catch `expectRepoError` pattern); run via `bun run scripts/run-test/run-test.ts <test-path>` NEVER raw `bun test`; never query seed data — create test data via `entity-setup.ts` helpers.
  - **AI agent communication**: NEVER create summary markdown files (SUMMARY.md / CHANGES.md / REPORT.md / FIXED.md). Editing the existing `.ai/plans/user-entity-enhancement/ANALYSIS.md` (Phase 17) is the documented exception.

## Phases at a glance (full detail in plan.md / tasks.md)

1. Backend DB enum registration — `currencyCodeEnum` in `backend/db/schema/enums.ts`
2. Backend DB schema — 11 column-type swaps across 7 tables (`billing.ts`, `teacher-banking.ts`, `teachers.ts`, `parents.ts`, `scheduling.ts`)
3. `bun db cleanGenerate` — regenerate the migration set (`CREATE TYPE currency_code AS ENUM (...)` + the column casts)
4. Backend types — `billing.types.ts`, `teacher.types.ts`, `parent.types.ts`, `profile.types.ts`, `backend/types/index.ts`
5. Repositories — `billing.repository.ts` (incl. the FX hub `getLatestExchangeRate`), `teacher.repository.ts`, `parent.repository.ts`, `teacher-banking.repository.ts`, `audit.repository.ts`, `scheduling/shared.ts`, `scheduling/state-changes.ts`, `report.repository.ts`
6. Services — `billing-management.service.ts`, teacher/parent onboarding, `parent-profile.service.ts`, `profile.service.ts`, `teacher-portal.service.ts`, `class-session.service.ts`
7. Pothos GraphQL — 12 sites flip to `CurrencyCodePothosObject` (output via `t.expose` + input via `t.field`)
8. Codegen: `bun run generate:gqlSchema && bun codegen` — DO NOT hand-edit generated files
9. Seeds — `billing-factory.DEFAULT_INVOICE_CURRENCY`, `seed-teacher-payments.ts`, `seed-currency-hedges.ts`, `seed-currency-exchange-rates.ts`
10. Frontend GraphQL documents — only `billing-management.documents.ts:13` needs a real edit (`$currency: String!` → `$currency: CurrencyCode!`); others are field-selection-only and auto-typed via codegen
11. Frontend Zod schemas — `z.string()` → `z.nativeEnum(CurrencyCode)` + `.refine(...)` for required-currency validation
12. Frontend form/view types — `CurrencyCode` on typed fields
13. Frontend UI wiring — replace 3 hardcoded `<MenuItem>` lists + 2 raw `<TextField>`s + manual-invoice hardcoded arg with `<CurrencySelect>`; ~24 `"USD"` fallback literals → `CurrencyCode.USD`; optional `<CurrencyDisplay>` upgrades
14. Backend repo + logic tests — literals → enum; via `bun run scripts/run-test/run-test.ts`
15. Backend service tests
16. Storybook story fixtures — literals → enum
17. Update `.ai/plans/user-entity-enhancement/ANALYSIS.md` §2.3, §7.1, §12 with a "✅ Landed" status pointing at `.ai/plans/currency/`
18. Quality gate — `bun quality-gate` (orchestrator handles SONAR stages)
19. Final verification checklist (12 items)

## Acceptance criteria (from spec.md §6)

1. `bun tsgo -b --noEmit` — zero currency-related type errors (pre-existing unrelated errors ok)
2. `bun biome:check` on every touched file — clean
3. Lint queue on the full touched file list — 0 errors
4. `bun db cleanGenerate` produces a fresh migration set containing `CREATE TYPE currency_code AS ENUM (...)` + the 7-table column changes
5. After cleanGenerate + seed, all repo tests via `bun run scripts/run-test/run-test.ts` pass
6. All logic tests touching FX (`billing-safeguards`, `exchange-rate`) pass after literal flip
7. `bun run generate:gqlSchema && bun codegen` succeeds; the 12 generated-type currency fields read `Maybe<CurrencyCode>` / `CurrencyCode` (no more `Maybe<Scalars['String']['...']>`)
8. `bun test frontend/common/graphql/test/` passes; `profile.documents.test.ts:55` `expect(mutationSource).toContain("currency")` still green
9. All Storybook stories render
10. `.ai/plans/user-entity-enhancement/ANALYSIS.md` §2.3 + §7.1 updated to mark the currency slice as "landed"

## Working directory & tooling

- Repo root: `/home/ahmed/Projects/siraj`
- Always use `~/.bun/bin/bun` (never npm/yarn/pnpm)
- Alternatives to `npm run` exist; consult `AGENTS.md` (root) "Essential Commands" section for the exact invocation of each script.
- Drizzle MCP server `project-0-siraj-drizzle` is available for `generate` / `push` / `check` if you prefer MCP over the CLI; prefer `bun db cleanGenerate` for this plan since it bundles the custom-logic migrations.
- `.agents/skills/drizzle*/SKILL.md` (migrations, responses-and-errors, generate, hints, push, pull, output-modes) — load the relevant one if `cleanGenerate` returns non-text output or `missing_hints`.

## Start here

1. Read `.agents/skills/quality-gate/SKILL.md` only if you need quality-gate mechanics later — the lint-queue-server must run first.
2. Start the lint queue server in the background: `~/.bun/bin/bun run scripts/lint-queue-server.ts` (block_until_ms: 0).
3. Read `.ai/plans/currency/spec.md` fully, then `plan.md`, then `tasks.md`.
4. Begin Phase 1, task T1.1. Render the per-file verification loop on each file before moving to the next task.

Output a short progress report in chat after each phase completes (which phase, which files touched, which checks passed). Do not create a SUMMARY.md file — chat is the channel. Mark tasks `[x]` in `tasks.md` as you go.
