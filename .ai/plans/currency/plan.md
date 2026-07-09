# Currency Migration — Implementation Plan

**Spec:** [`./spec.md`](./spec.md)
**Implements:** Decision 3A (locked definition currencies typed across all layers)
**Strategy:** Clean-slate per Decision 8C — `bun db cleanGenerate` (not incremental ALTER)
**Sequence:** strict top-to-bottom phases; each phase completes before the next.
**Verification loop:** per-file `tsgo` → `biome:check` → lint-queue-client BEFORE importing the change anywhere else. Lint via the **lint queue server** (`bun run scripts/lint-queue-server.ts` first; all sub-agents submit via `curl http://localhost:4777/lint`).

---

## Existing foundation (already landed — do NOT re-create)

| File | Status |
|------|--------|
| `backend/enum/currency.enum.ts` (32 codes) | ✓ |
| `backend/graphql/pothos/shared/enum.pothos.ts` — `CurrencyCodePothosObject` | ✓ |
| `backend/enum/index.ts` barrel export | ✓ |
| codegen `CurrencyCode` enum in `frontend/graphql/generated/gql/graphql-types.ts:926` + `schema.graphql` | ✓ |
| `frontend/lib/currency.ts` — `currencies` catalog, helpers | ✓ |
| `frontend/components/ui/input/currencySelect/` (5-file split) | ✓ |
| `frontend/components/ui/display/currencyDisplay/` | ✓ |
| `shared/messages/{types,ar,en}/ui/currency-select.ts` i18n | ✓ |

---

## Phase 1 — Backend DB enum registration

**Goal:** add the PG enum once, no column changes yet.

**Files:**
- `backend/db/schema/enums.ts`

**Edit:**
```ts
// Next to countryCodeEnum (line 36), import CurrencyCode from "@/backend/enum"
export const currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode);
```

Also re-export `currencyCodeEnum` from `backend/db/schema/index.ts` (if that file hand-bundles schema exports — verify pattern against how `countryCodeEnum` is surfaced).

**Verify:** `bun tsgo` clean on `enums.ts` + `index.ts`. No migration yet — Phase 3 regenerates.

_Rules (read before editing):_ `AGENTS.md` (root — lint queue + verification loop) · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Seeds section — enum values must match PG enum exactly, `createPgEnumFromEnum` derives PG values from the TS enum so they stay in sync)

---

## Phase 2 — Backend DB schema — column types

**Goal:** swap every varchar currency column to the typed enum. Clean-slate → no transition, no backfill.

**Files & exact edits (see spec.md §A rollup):**

| File | Line | Column | Old | New |
|------|------|--------|-----|-----|
| `backend/db/schema/billing.ts` | `35` | `invoices.currency` | `varchar("currency", { length: 10 }).notNull()` | `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/billing.ts` | `76` | `payments.currency` | `varchar("currency", { length: 10 }).notNull()` | `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/billing.ts` | `99` | `currency_exchange_rates.fromCurrency` | `varchar("from_currency", { length: 10 }).notNull()` | `currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/billing.ts` | `100` | `currency_exchange_rates.toCurrency` | `varchar("to_currency", { length: 10 }).notNull()` | `currencyCodeEnum("to_currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/billing.ts` | `126` | `currency_exchange_audit_logs.fromCurrency` | same | `currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/billing.ts` | `127` | `currency_exchange_audit_logs.toCurrency` | same | `currencyCodeEnum("to_currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/billing.ts` | `145` | `currency_hedges.currency` | same | `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/teacher-banking.ts` | `63` | `teacher_payments.currency` | same | `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()` |
| `backend/db/schema/teachers.ts` | `32` | `teachers.rateCurrency` | `varchar("rate_currency", { length: 10 })` | `currencyCodeEnum("rate_currency").$type<CurrencyCode>()` (nullable) |
| `backend/db/schema/parents.ts` | `24` | `parents.currency` | `varchar("currency", { length: 10 })` | `currencyCodeEnum("currency").$type<CurrencyCode>()` |
| `backend/db/schema/scheduling.ts` | `152` | `class_instances.rateCurrency` | same | `currencyCodeEnum("rate_currency").$type<CurrencyCode>()` |

Add `import { CurrencyCode } from "@/backend/enum";` and `import { currencyCodeEnum } from "@/backend/db/schema/enums";` to each touched file (verify current import shape).

**Verify:** `bun tsgo` on each schema file; schema graph still type-checks.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/AGENTS.md` (6-layer data flow: Schema → Types → Repo → Service → GraphQL → Test) · `backend/db/repo/AGENTS.md` · `.agents/instructions/backend.instructions.md` ("Database schema relations"; match PG enums exactly from `backend/db/schema/enums.ts` — never guess valid values; use `CurrencyCode.EGP === "EGP"`)

---

## Phase 3 — `bun db cleanGenerate`

**Goal:** regenerate a fresh clean migration set containing `CREATE TYPE currency_code AS ENUM (...)` + the 7 column casts.

```bash
bun db cleanGenerate
# Picks "8" from scripts/dbActions — Reset → Extensions → Generate → Migrate → Seed
```

**Expected:** one new migration generating `currency_code` enum + ALTERing the 11 columns. **Do NOT commit the old `backend/drizzle/` history** — cleanGenerate wipes it.

If `cleanGenerate` fails:
- Read `~/.bun/bin/bun run scripts/run-test/run-test.ts --last` or stdout.
- Common cause: an orphan column reference in a hand-written SQL file under `backend/db/migration/`. The `withStatementBreakpoints` helper handles order — confirm any custom SQL referencing currency columns is enum-compatible (it isn't required since clean slate creates fresh).

**Verify:** `bun run dev:safe` boots; `bun db seed` succeeds (seeds updated in Phase 8).

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop) · `.agents/instructions/backend.instructions.md` ("Seeds (CRITICAL)" — schema changes require `push`/cleanGenerate BEFORE `bun db seed`; check constraints by reading `backend/db/schema/*.ts` first; seeds MUST be idempotent via `onConflictDoUpdate`/`onConflictDoNothing`) · `.agents/skills/drizzle-migrations/SKILL.md` + `.agents/skills/drizzle-responses-and-errors/SKILL.md` if `generate` returns non-text output

---

## Phase 4 — Backend types (`backend/types/*.types.ts`)

**Goal:** flow `CurrencyCode` through every type surface.

| File | Lines | Edit |
|------|-------|------|
| `backend/types/billing/billing.types.ts` | `50`, `75`, `113`, `153` | `currency: string` → `currency: CurrencyCode` (and `readonly currency: CurrencyCode`) |
| `backend/types/billing/billing.types.ts` | `39-42` (FX types) | `$inferSelect.derived` now yields `CurrencyCode` automatically — but verify; the `CurrencyExchangeRateSubmitInput` (line `42`) will type its `fromCurrency`/`toCurrency` accordingly. No edits if inferred. |
| `backend/types/teachers/teacher.types.ts` | `51` (`CreateTeacherPaymentInput.currency`) | `string` → `CurrencyCode` |
| `backend/types/teachers/teacher.types.ts` | `193` (`TeacherOwnProfileReturnType.rateCurrency`) | `string \| null` → `CurrencyCode \| null` |
| `backend/types/parents/parent.types.ts` | `171` (`ParentAdminProfile currency`) | → `CurrencyCode \| null` |
| `backend/types/parents/parent.types.ts` | `218` (`ParentProfileUpdateInput.currency`) | → `CurrencyCode \| null` |
| `backend/types/profile/profile.types.ts` | `66` (`ParentAdminProfileUpdateInput.currency`) | → `CurrencyCode \| null` |
| `backend/types/index.ts` | re-export `CurrencyCode` from `@/backend/enum` | Add `CurrencyCode` to barrel |

**Verify:** `bun tsgo` on `backend/types/index.ts` and touched files.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/types/AGENTS.md` (**Single Canonical Object Type Pattern** — `CurrencyCode` is the re-applied enum on `{Entity}ReturnType`; `Omit<>` then re-apply `currency: CurrencyCode`; never create local types in Pothos) · `backend/AGENTS.md` (Type Definition Pattern: `{Entity}SelectType` = `typeof table.$inferSelect`, etc.) · `.agents/instructions/backend.instructions.md` (Type Definition Pattern CRITICAL: ALWAYS import from `@/backend/types` alias, never relative; update `backend/types/index.ts` barrel when adding types)

---

## Phase 5 — Repositories

**Goal:** update insert/select/update paths + the hardcoded SQL CASE literals.

| File | Lines | Edit |
|------|-------|------|
| `backend/db/repo/billing.repository.ts` | `50-56` `resolveExchangeRateSnapshot` | Signature `currency: string` → `CurrencyCode` (or keep widened `string \| CurrencyCode` if the resolver still funnels a string param — prefer strict) |
| `backend/db/repo/billing.repository.ts` | `71-79` `createBillingEntity` | Input `currency: CurrencyCode`; passes through unchanged |
| `backend/db/repo/billing.repository.ts` | `105-110` `getLatestExchangeRate` | `fromCurrency`/`toCurrency: CurrencyCode` |
| `backend/db/repo/billing.repository.ts` | `139-143` `updateExchangeRate` | The FX-update input already uses `CurrencyExchangeRateUpdateInput` from `backend/types` (auto-derived); no edit beyond the type flow |
| `backend/db/repo/billing.repository.ts` | `279-316` `OverdueInvoiceRow.currency` + `fetchOverdueInvoices` | `currency: string` → `currency: CurrencyCode` (select cast already fine; PG casts implicit) |
| `backend/db/repo/billing.repository.ts` | `401-412` `invoiceBaseFields` | `currency: invoices.currency` — same Drizzle typing flows |
| `backend/db/repo/billing.repository.ts` | `414-438` `mapInvoiceRow` | Row type `currency: CurrencyCode` |
| `backend/db/repo/teacher.repository.ts` | `56`, `205`, `242`, `263` | Insert/null-default path: `rateCurrency: input.rateCurrency ?? null` unchanged types flow; mapper param `rateCurrency: CurrencyCode \| null` |
| `backend/db/repo/parent.repository.ts` | `68`, `92`, `270`, `297`, `342` | Same — `currency: CurrencyCode \| null` through insert/select/map/update |
| `backend/db/repo/teacher-banking.repository.ts` | `278` | `currency: input.currency` — already typed via `CurrencyExchangeRateSubmitInput` flow |
| `backend/db/repo/audit.repository.ts` | `310`, `319`, `325-326` (payment-refund), `363-387` (FX audit) | `currency`, `fromCurrency`, `toCurrency` → `CurrencyCode`; metadata-string interpolation can call `.toString()` or relies on TS template-string widening — keep current shape, just narrow the field types |
| `backend/db/repo/scheduling/shared.ts` | `183` | Pass-through flows from schema typing |
| `backend/db/repo/scheduling/state-changes.ts` | `539-540` | Same — `rateCurrency: CurrencyCode \| null` |
| `backend/db/repo/report.repository.ts` | `92-93`, `115-116` | **Hardcoded SQL CASE literals** `'EGP'` / `'USD'`. Two options: (a) keep them as raw SQL string literals inside the `sql<T>` template (drizzle-safe, no TS leakage) — RECOMMENDED; (b) interpolate `${CurrencyCode.Egp}` — verify drizzle bind-param behavior in a `sql<number>` template. Decide in implementation; record in PR description. |

**Verify:** per file `tsgo` + `biome:check` + lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop, fix-or-report cross-file rule) · `backend/db/repo/AGENTS.md` (**data access ONLY**: no business logic, no permission checks, no hardcoded user-facing error strings — use `getBackendTranslations` + `locale?` param; repos must use `{Entity}SelectType`/`{Entity}InsertType` from `backend/types/`, NOT raw schema types; conditional aggregation via `sql<number>` template + `.mapWith(Number)` — never raw `CAST(...)`) · `backend/AGENTS.md` (Repository Layer section) · `.agents/instructions/backend.instructions.md` ("Repository Layer" — when `findMany` complex relations give `SQL<unknown>` errors, revert to `.select().from().leftJoin()` or manual ID-based mapping)

---

## Phase 6 — Services

| File | Lines | Edit |
|------|-------|------|
| `backend/services/billing/billing-management.service.ts` | `12`, `15`, `40-55`, `57-72` | `deriveIdempotencyKey` input `currency: CurrencyCode`; `buildInvoiceInsertPayload` pass-through; `mapToManualInvoiceResult` mapping `currency: created.currency` (typed via repo) |
| `backend/services/teacher/teacher-onboarding.service.ts` | `35`, `82` | `rateCurrency?: CurrencyCode \| null` |
| `backend/services/parent/parent-onboarding.service.ts` | `24`, `36`, `85`, `111` | `currency?: CurrencyCode \| null` |
| `backend/services/parent/parent-profile.service.ts` | `59` | Pass-through `profile.currency` typed via repo |
| `backend/services/profile/profile.service.ts` | `78` | `"currency" in input ? input.currency : undefined` — type comes from the input union; broaden the dispatcher type if needed |
| `backend/services/teacher/teacher-portal.service.ts` | `52` | `rateCurrency: CurrencyCode \| null` |
| `backend/services/session/class-session.service.ts` | `234-235` | Pass-through snapshot `rateCurrency: existing.rateCurrency` typed already |

**No FX behavior change.** `getLatestExchangeRate` is still called from `billing.repository.ts:resolveExchangeRateSnapshot` — its caller signature narrows but the call site is unchanged.

**Verify:** `bun tsgo` clean.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/services/AGENTS.md` (**domain-driven**, no monolithic services; business-logic hub; SSR-compatible — must NOT rely on GraphQL context unless passed explicitly; import types from `@/backend/types`, never ad-hoc; i18n: all user-facing errors via `getBackendTranslations` + `locale?` param; never hardcode error strings) · `backend/AGENTS.md` (Service Layer section — data transformations `SubmitInput → InsertType`, `SelectType → ReturnType`) · `.agents/instructions/backend.instructions.md` ("Service Layer" — never call services outside your domain boundary)

---

## Phase 7 — Pothos GraphQL

**Goal:** swap the 12 `t.string`/`t.exposeString`/`t.arg.string` currency sites to `CurrencyCodePothosObject`.

| File | Line | Field | New shape |
|------|------|-------|-----------|
| `backend/graphql/pothos/billing/billing-management.pothos.ts` | `23` | `ManualInvoiceResult.currency` | `t.expose("currency", { type: CurrencyCodePothosObject })` |
| `backend/graphql/pothos/billing/billing-management.pothos.ts` | `74` | `createManualInvoice.currency` arg | `t.field({ type: CurrencyCodePothosObject, required: true })` |
| `backend/graphql/pothos/billing/billing-management.pothos.ts` | `78-79` | `exchangeRateSnapshot`/`exchangeRateSource` | **Leave as `String`** — numeric rate + free description, not currency codes |
| `backend/graphql/pothos/billing/billing-history.pothos.ts` | `44` | `InvoiceHistoryRow.currency` | `t.expose("currency", { type: CurrencyCodePothosObject })` |
| `backend/graphql/pothos/billing/billing-alerts.pothos.ts` | `13` | `UnpaidInvoiceItem.currency` | `t.expose("currency", { type: CurrencyCodePothosObject })` |
| `backend/graphql/pothos/teachers/teacher-onboarding.pothos.ts` | `68-71` | `TeacherOnboardingInput.rateCurrency` | `t.field({ type: CurrencyCodePothosObject })` (nullable), drop the `maxLength: 512` constraint |
| `backend/graphql/pothos/parents/parent-onboarding.pothos.ts` | `39` | `ParentOnboardingInput.currency` | `t.field({ type: CurrencyCodePothosObject })`, drop `maxLength: 512` |
| `backend/graphql/pothos/parents/parent-onboarding.pothos.ts` | `55` | `ParentOnboardingResult.currency` | `t.expose("currency", { type: CurrencyCodePothosObject })` (nullable) |
| `backend/graphql/pothos/parents/parent-profile.pothos.ts` | `30` | `ParentProfile.currency` | `t.expose("currency", { type: CurrencyCodePothosObject })` (nullable) |
| `backend/graphql/pothos/profile/profile.pothos.ts` | `166` | `ParentAdminProfileUpdateInput.currency` | `t.field({ type: CurrencyCodePothosObject, required: false })` |
| `backend/graphql/pothos/teachers/staff-profile.pothos.ts` | `28` | `TeacherProfileForEdit.rateCurrency` | `t.expose("rateCurrency", { type: CurrencyCodePothosObject, nullable: true, authScopes: { superAdmin: true } })` |
| `backend/graphql/pothos/teachers/staff-profile.pothos.ts` | `57` | `TeacherProfileUpdateInput.rateCurrency` | `t.field({ type: CurrencyCodePothosObject, required: false })`, drop `maxLength: 255` |

**Verify:** `bun tsgo` clean on all touched Pothos files.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/graphql/AGENTS.md` (**Single Canonical Object Type (CRITICAL)** — Pothos objectRef uses `{Entity}ReturnType` from `backend/types/`; never create `{Entity}Definition` / local types in Pothos; `nullable: true` REQUIRED for `CurrencyCode | null` fields — Pothos defaults non-nullable; resolvers delegate to SERVICES not repos; propagate `ctx.locale` to service/repo calls; errors in resolvers via `getBackendTranslations`; `id` field on all objects; exception: input + collection wrapper types allowed) · `backend/AGENTS.md` (GraphQL Layer section) · `.agents/instructions/backend.instructions.md` ("Pothos/GraphQL" — import types from `@/backend/types`; exceptions: input types and collection wrappers allowed; complex computed types may need custom defs but still import base from `backend/types/`)

---

## Phase 8 — Codegen + Schema

**Order matters:**

```bash
bun run generate:gqlSchema   # SDL out of Pothos (consumes Phase 7)
bun codegen                  # FE types from SDL
```

**Expected diffs in `frontend/graphql/generated/`:**
- `schema.graphql` — `currency_code` enum (already there if codegen ran before); the 12 fields change from `String!`/`String` to `CurrencyCode!`/`CurrencyCode`.
- `graphql-types.ts` — the 12 fields listed in spec §K flip to `Maybe<CurrencyCode>` / `CurrencyCode`.

**Do NOT hand-edit generated files.** They will be regenerated by these commands.

_Rules (read before editing):_ `AGENTS.md` (root) · `frontend/AGENTS.md` (Code Quality section + Apollo/GraphQL Codegen rule) · `frontend/graphql/sharedDocuments/AGENTS.md` ("Codegen" — `~/.bun/bin/bun run generate:gqlSchema` THEN `~/.bun/bin/bun codegen` after any schema or document change; types always available post-codegen — never inline type literals) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL → codegen after schema/document changes — both steps required) · `.agents/instructions/backend.instructions.md` ("GraphQL Schema Generation" — both `generate:gqlSchema` AND `codegen` are required)

---

## Phase 9 — Seeds

| File | Line | Edit |
|------|------|------|
| `backend/db/seeds/lib/billing-factory.ts` | `41` | `export const DEFAULT_INVOICE_CURRENCY = CurrencyCode.USD;` (import `CurrencyCode` from `@/backend/enum`) |
| `backend/db/seeds/seed-teacher-payments.ts` | `42` | Use `DEFAULT_INVOICE_CURRENCY` instead of inline `"USD"` |
| `backend/db/seeds/seed-currency-hedges.ts` | `8-10` | `{ currency: CurrencyCode.USD, ... }` / `CurrencyCode.EGP` / `CurrencyCode.SAR` |
| `backend/db/seeds/seed-currency-exchange-rates.ts` | pair input | If it currently maps `string → string` pairs, swap the pair source array to `CurrencyCode` tuples; insert paths flow through typed `CurrencyExchangeRateInsertType` |
| `backend/db/seeds/seed-currency-exchange-audit-logs.ts` | — | No literal changes (derives from existing rows). Verify it still compiles post-typing. |

(Teachers/parents/teacher-banking seeds currently omit currency on insert — no changes needed.)

**Verify:** seeds run as part of `cleanGenerate` in Phase 3. Re-run after this phase if needed:
```bash
bun db seed  # action "2"
```

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/AGENTS.md` (Seeds section) · `.agents/instructions/backend.instructions.md` ("Seeds (CRITICAL)" — one `seedOrGet` function per table in a dedicated file; idempotent via `onConflictDoUpdate`/`onConflictDoNothing`; match PG enum values EXACTLY from `backend/db/schema/enums.ts` — `CurrencyCode.USD === "USD"` so the PG coin stays aligned; check constraints before seeding by reading `backend/db/schema/*.ts`; run schema push/cleanGenerate BEFORE `bun db seed` after any schema change; return seeded entities downstream so other seeders don't re-query; helpers over ~70-80 lines extracted; never `any`/inline types)

---

## Phase 10 — Frontend GraphQL documents

| File | Lines | Edit |
|------|-------|------|
| `frontend/graphql/sharedDocuments/billing-management.documents.ts` | `13` | `$currency: String!` → `$currency: CurrencyCode!` (and the field selection `currency: $currency` is unchanged — type now matches) |
| `frontend/graphql/sharedDocuments/parent-onboarding.documents.ts` | — (mutation input) | `currency` is now `CurrencyCode` on `ParentOnboardingInput` (no var change in doc — the input GraphQL typing uses `ParentOnboardingInput!`). Verify post-codegen. |
| `frontend/graphql/sharedDocuments/billing-alerts.documents.ts` | `16` | Field selection `currency` — output type flips automatically via codegen; no doc edit |
| `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts` | `19`, `53` | Same — no doc edit (field selection only) |
| `frontend/graphql/sharedDocuments/parent-profile.documents.ts` | `30` | No edit |
| `frontend/graphql/sharedDocuments/user-billing-profile.documents.ts` | `34` | No edit |
| `frontend/graphql/sharedDocuments/staff-profile.documents.ts` | `24`, `53` | No edit |
| `frontend/graphql/sharedDocuments/profile.documents.ts` | `24`, `44`, `78`, `179`, `234`, `258` | No edit |
| `frontend/graphql/sharedDocuments/teacher-portal.documents.ts` | `30` | No edit |
| `frontend/graphql/sharedDocuments/profile.documents.test.ts` | `55` | `expect(mutationSource).toContain("currency")` — still passes (substring present). **No edit.** |

**Verify:** `bun codegen` regenerates `frontend/graphql/gql/` ops; re-run after Phase 8 if needed.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop) · `frontend/graphql/sharedDocuments/AGENTS.md` (one file per domain `<domain>.documents.ts`; import `gql` + `TypedDocumentNode` from `"@apollo/client"` NEVER `"@apollo/client/core"`; naming `{entityName}QueryDocument` / `{entityName}MutationDocument` → `TypedDocumentNode<Operations.X, Types.Y>`; **`id` field on EVERY object type in selection sets** for Apollo cache normalization; NO `useLazyQuery`; codegen after any document change) · `frontend/graphql/AGENTS.md` (Type Safety + Document Organization — all ops strongly typed via codegen; never custom inline type literals) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL — import `gql`+`TypedDocumentNode` from `"@apollo/client"` and hooks from `"@apollo/client/react"`; import generated TYPES from `graphql-types.ts` NOT `operations.ts`) · `frontend/AGENTS.md` (Apollo hooks rule)

---

## Phase 11 — Frontend Zod schemas

| File | Line | Edit |
|------|------|------|
| `frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema.ts` | `48` | `rateCurrency: z.nativeEnum(CurrencyCode).min(...)` — `z.nativeEnum` doesn't support `.min`; use `z.nativeEnum(CurrencyCode)` then keep `currencyRequired` message via `.refine(v => !!v, { message: ... })` |
| `frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema.ts` | `26` | `currency: z.nativeEnum(CurrencyCode).refine(v => !!v, { message: "currencyRequired" })` |
| `frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema.ts` | `17` | `currency: z.nativeEnum(CurrencyCode).optional()` (or `.nullable()`) |
| `frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema.ts` | `23` | `currency: z.nativeEnum(CurrencyCode).refine(...)` |
| `frontend/views/dashboard/profile/teacher/teacherProfileFormTypes.ts` | `28`, `52` | `rateCurrency: z.nativeEnum(CurrencyCode).optional()`, `readonly rateCurrency?: CurrencyCode \| null` |
| `frontend/views/dashboard/profile/parent/parentProfileFormTypes.ts` | `23`, `49` | `currency: z.nativeEnum(CurrencyCode).optional()`, `readonly currency?: CurrencyCode \| null` |

**Verify:** per file `tsgo` + biome + lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop) · `frontend/views/AGENTS.md` (form/view types follow domain structure) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL — `graphql-types.ts` is canonical for entity types, NOT `operations.ts`; NEVER inline type literals — always use codegen types; `CurrencyCode` from `@/frontend/graphql/generated/gql/graphql-types`) · `frontend/AGENTS.md` (Zustand-stores + type-consumers rule — if schema/FE misalign, fix the schema or query, never redefine types locally)

---

## Phase 12 — Frontend form/view types

| File | Line | Edit |
|------|------|------|
| `frontend/views/dashboard/teachers/profile/types.ts` | `14` | `readonly currency: CurrencyCode;` |
| `frontend/views/dashboard/parent/types/profile.ts` | `37` | `readonly currency: CurrencyCode;` |

**Verify:** `bun tsgo` clean.

_Rules (read before editing):_ same as Phase 11 — `frontend/views/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (`graphql-types.ts` canonical) + `frontend/AGENTS.md` (no manual type redefinitions).

---

## Phase 13 — Frontend UI wiring (the user-visible payoff)

For each input below, replace the existing component with `<CurrencySelect value={...} onChangeAction={...} />` from `@/frontend/components/ui/input`. For each display below, replace interpolation with `<CurrencyDisplay code={...} showLabel showSymbol />` where the long-label is being shown today.

| # | File | Lines | Change |
|---|------|-------|--------|
| 1 | `frontend/views/dashboard/teachers/onboarding/components/SalaryDetailsSection.tsx` | `69-75` | Replace `<Select><MenuItem>...5 items</Select>` with `<CurrencySelect>` bound to `rateCurrency` form value |
| 2 | `frontend/views/dashboard/teachers/profile/components/SalaryDetailsSection.tsx` | `54-58` | Replace 3-item `<Select>` with `<CurrencySelect>` |
| 3 | `frontend/views/dashboard/admin/parents/onboarding/FeesContractSection.tsx` | `118-124` | Replace 4-item `<Select>` with `<CurrencySelect>` |
| 4 | `frontend/views/dashboard/profile/parent/sections/BillingSection.tsx` | `40`, `70` | Replace raw `<TextField>` with `<CurrencySelect>` (line 40); keep display at `70` (could optionally become `<CurrencyDisplay code={adminData.currency} />`) |
| 5 | `frontend/views/dashboard/profile/teacher/sections/CompensationSection.tsx` | `44`, `62` | Replace raw `<TextField>` with `<CurrencySelect>`; replace `"USD"` fallback (`62`) with `CurrencyCode.USD` |
| 6 | `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView.tsx` | `115` | `rateCurrency: "USD"` → `rateCurrency: CurrencyCode.USD` |
| 7 | `frontend/views/dashboard/teachers/profile/TeacherProfileContainer.tsx` | `80` | `?? "USD"` → `?? CurrencyCode.USD` |
| 8 | `frontend/views/dashboard/teachers/own-profile/TeacherOwnProfileContainer.tsx` | `57` | same |
| 9 | `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer.tsx` | `33` | `currency: "USD"` → `currency: CurrencyCode.USD` |
| 10 | `frontend/views/dashboard/parent/profile/edit/ParentProfileEditContainer.tsx` | `48`, `77` | `?? "USD"` → `?? CurrencyCode.USD` |
| 11 | `frontend/views/dashboard/parent/profile/ParentProfileContainer.tsx` | `69`, `111` | Retype `currency: string \| null` → `CurrencyCode \| null`; `?? ""` becomes `?? CurrencyCode.USD` |
| 12 | `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx` | `149` | `<DetailItem label={t("fields.currency")} value={parent.currency} />` — value is now a `CurrencyCode`; either render via `CurrencyDisplay` or `.toString()` (verify `DetailItem` accepts strings) |
| 13 | `frontend/views/dashboard/profile/parent/ParentProfileContainer.tsx` | `56` | `formData.currency || null` — typed; null-check on enum |
| 14 | `frontend/views/dashboard/profile/parent/ParentProfileEditForm.tsx` | `53`, `72` | `currency: ""` default load — for a typed enum form, change to `currency: null` or `CurrencyCode.USD` (decide based on FormProvider default behavior) |
| 15 | `frontend/views/dashboard/profile/teacher/TeacherAdminEditForm.tsx` | `51`, `72` | Same — `rateCurrency: ""` → `null` or `CurrencyCode.USD` |
| 16 | `frontend/views/dashboard/billing/manual/ManualInvoiceContainer.tsx` | `100` | Replace hardcoded `currency: "USD"` mutation arg with state from a new `<CurrencySelect>` placed in the form |
| 17 | `frontend/views/dashboard/billing/manual/ManualInvoiceDesktopView.tsx` | `85` | `currency="USD"` prop → state value |
| 18 | `frontend/views/dashboard/billing/manual/ManualInvoiceMobileView.tsx` | `68` | same |
| 19 | `frontend/views/dashboard/billing/manual/components/ManualInvoiceFeeField.tsx` | `48` | Replace literal `AED` adornment label with `<CurrencyDisplay code={draftCurrency} showCode showSymbol />` or `getCurrencySymbol(code)` |
| 20 | `frontend/views/dashboard/admin/billing/AdminBillingContainer.tsx` | `47-49`, `163`, `175`, `178` | `formatCurrency(amount, currency)` defaults `"USD"` → `CurrencyCode.USD` |
| 21 | `frontend/views/dashboard/billing/ParentBillingContainer.tsx` | `26-28`, `106`, `116`, `117` | same |
| 22 | `frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx` | `129`, `130` | same |
| 23 | `frontend/views/dashboard/reports/components/PerformanceLedgerCard.tsx` | `28`, `156`, `159` | `formatCurrency` + `EGP`/`USD` literals → `CurrencyCode.EGP/USD` |
| 24 | `frontend/views/dashboard/reports/components/ReportsDataGrid.tsx` | `45`, `151`, `163` | same |
| 25 | `frontend/views/dashboard/reports/components/ReportsTotalsRow.tsx` | `15`, `23` | same |
| 26 | `frontend/views/dashboard/reports/ReportsContainer.tsx` | `355-357` | `egpLabel: "EGP"` etc. — these are ICU label strings, but the underlying field values flow typed. Decide whether to keep as label strings (RECOMMENDED — i18n remains string-typed at the boundary) |
| 27 | `frontend/views/dashboard/components/navbar/UnpaidInvoicesSection.tsx` | `73` | `${item.totalUnpaidAmount} ${item.currency}` — `currency` now `CurrencyCode`; `.toString()` resolves fine. Optional: upgrade to `<CurrencyDisplay code showLabel={false} showCode />` for better UX. |

**Verify per file:** `tsgo` → `biome:check` → lint-queue-client → (optional) `bun test test/ui/components/...` if Storybook stories exist for the touched view.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop, fix-or-report cross-file rule) · `frontend/views/AGENTS.md` (**functional components only**; client data fetching via Apollo `useQuery` with TypedDocumentNodes; no `useLazyQuery`; domain structure under `frontend/views/dashboard/`; `<RequirePermission>` for permission-gated views) · `frontend/AGENTS.md` (MUI v9 — **all style props in `sx`** (`fontWeight`, `mb`, `alignItems`, `gap`, `direction` on Typography/Stack/Box/Grid); React 19 — no `FormEvent`, use `React.SubmitEvent`/`React.SyntheticEvent`; FormData cast `(x as string | null) ?? ""`; Theme & Styling — **no hardcoded colors**, theme callback `sx={theme => ({color: theme.palette.primary.main})}`, use `onPrimary` not `contrastText`; Dashboard UI patterns — `PageContainer`, `AppDataGrid`, `MetricCard`, `StatusBadge`, `PageHeader`/`SectionPanel` no ad-hoc flex; Apollo hooks from `"@apollo/client/react"` not `"@apollo/client"`; NO `useLazyQuery`; `id` field on all selection sets; i18n — `useTranslations` from `next-intl` for ALL user-facing text; logging via `@/frontend/utils/logger` NEVER `console.*`) · `.agents/instructions/frontend.instructions.md` (**MUI v9 breaking changes** — `AutocompleteRenderInputParams.inputProps` removed → use `params.slotProps.htmlInput`; `Typography component` prop invalid → wrapper or `sx`; icon names `*Outline` → `*Outlined` — `CurrencySelect`/`CurrencyAutocomplete` already honor this; Apollo & GraphQL — import `gql`+`TypedDocumentNode` from `"@apollo/client"`, hooks from `"@apollo/client/react"`, ENTITY types from `graphql-types.ts` not `operations.ts`; Context/Provider/hook in separate files for Fast Refresh; no nested ternaries) · The `CurrencySelect`/`CurrencyDisplay` components already built on these rules — consuming views just wire them in

---

## Phase 14 — `users.displayCurrency` (Decision 3A part 2) — schema → types → repo → service → Pothos → documents → store → UI → seed

Decision 3A part 2 is now IN scope. The user-wide display currency preference lives on the `users` row, mirrors `timezone` plumbing throughout, and surfaces a new `<CurrencySelect>` in every role's `AccountSection`. SQL test data + seed never bias toward any currency (default `null`).

| # | Layer | File | Lines | Change |
|---|-------|------|-------|--------|
| 14.1 | DB schema | `backend/db/schema/users.ts` | After line 33 | Add `displayCurrency: currencyCodeEnum("display_currency").$type<CurrencyCode>(),` (nullable, no default). NO extra CHECK — PG enum enforces domain. |
| 14.2 | Backend types | `backend/types/users/user.types.ts` | `17-30` | Add `\| "displayCurrency"` to `Omit`; add `displayCurrency: CurrencyCode \| null;` to the re-applied intersection (mirrors `timezone: IanaTimezone`). Import `CurrencyCode` from `@/backend/enum`. |
| 14.3 | Backend auth utils | `backend/utils/auth.utils.ts` | `14-28` | In `toUserReturnType` return object add `displayCurrency: user.displayCurrency as CurrencyCode \| null,` (mirrors the `timezone` cast line). |
| 14.4 | User repo | `backend/db/repo/users/user.repository.ts` | `49-65` | Add `users.displayCurrency` to `findSafeById` select list. |
| 14.5 | User repo | `backend/db/repo/users/user.repository.ts` | `236-252` | Add `users.displayCurrency` to `updateProfileFields` returning list. |
| 14.6 | User repo | `backend/db/repo/users/user.repository.ts` | after `261-287` | NEW `updateDisplayCurrency(userId, displayCurrency: CurrencyCode, tx?, locale?)`. Mirror `updateTimezone` exactly — same param order (`tx` before `locale`), `getBackendTranslations` for the not-found error, `.set({ displayCurrency, updatedAt: new Date() })`. Skip the `normalizeIanaTimezone`/`isValidIanaTimezone` validation — PG enum enforces domain. Export from repo barrel. |
| 14.7 | Profile service | `backend/services/profile/profile.service.ts` | `78` (`updateProfileFields` dispatcher) | Accept `displayCurrency?: CurrencyCode \| null` in the `SubmitInput`; when present, call `UserRepository.updateDisplayCurrency(userId, displayCurrency, tx, locale)`. Pass `tx` to keep transactional integrity. |
| 14.8 | Pothos — User object | `backend/graphql/pothos/auth/user.pothos.ts` | `17-50` | Add `displayCurrency: t.expose("displayCurrency", { type: CurrencyCodePothosObject, nullable: true })`. `UserReturnType` now carries the field after 14.2. |
| 14.9 | Pothos — profile input | `backend/graphql/pothos/profile/profile.pothos.ts` | `114-122` (`CoreUserProfileFieldsInput`) | Add `displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false })`. Flows into `UpdateOwnProfileInput.core` and `UpdateUserProfileInput.core`. Add `CurrencyCodePothosObject` to import list (line 7-12 sibling). |
| 14.10 | Codegen | (regen) | — | `bun run generate:gqlSchema && bun codegen` — surfaces `displayCurrency: Maybe<CurrencyCode>` on `User`. |
| 14.11 | Frontend documents | `frontend/graphql/sharedDocuments/{user,profile,auth}.documents.ts` (verify exact file caller) | wherever user query selects + profile mutation accepts | Add `displayCurrency` to the user query selection set + `displayCurrency` to `UpdateOwnProfileInput`/`UpdateUserProfileInput.core`. Always include `id` on the user object (already present). |
| 14.12 | Frontend store | `frontend/stores/userStore.ts` | `4-40` | Add `displayCurrency: CurrencyCode \| null;` to `UserState`; initialize `null` in the store; in `setUser`, set `displayCurrency: user?.displayCurrency ?? null`. Mock store (`mockUserStore` Storybook sibling) mirrors the field. Enables ALL client-side money rendering to read `displayCurrency` globally. |
| 14.13 | i18n types | `shared/messages/types/profile.ts` | `59`, `109` (and `staff.fields` block if present) | Add `readonly displayCurrency: string;` to `teacher.fields`, `parent.fields`, `staff.fields`. |
| 14.14 | i18n AR | `shared/messages/ar/profile.ts` | `61`, `111` | Add `displayCurrency: "عملة العرض",`. |
| 14.15 | i18n EN | `shared/messages/en.ts` | `265`, `315` (and staff sibling) | Add `displayCurrency: "Display Currency",`. |
| 14.16 | UI — teacher | `frontend/views/dashboard/profile/teacher/sections/AccountSection.tsx` | `27-46` (edit branch) + view branch | Add a `<Controller name="displayCurrency" ...>` rendering `<CurrencySelect value={...} onChangeAction={...} label={t("fields.displayCurrency")} fullWidth />` in the edit branch; in the view branch add a `<CurrencyDisplay code={userData.displayCurrency} showLabel showSymbol />` (or "Not set" fallback). The user object is fetched by the container and passed down — verify the prop chain. |
| 14.17 | UI — parent | `frontend/views/dashboard/profile/parent/sections/AccountSection.tsx` | (analogous) | Same `CurrencySelect`/`CurrencyDisplay` pattern. |
| 14.18 | UI — staff | `frontend/views/dashboard/profile/staff/sections/AccountSection.tsx` | `27-47` + view branch | Same — staff users also have a `displayCurrency` preference (it's on `users`, role-agnostic). |
| 14.19 | Zod | `frontend/views/dashboard/profile/{teacher,parent,staff}/.../schemas/*.ts` | (profile/account schema) | Add `displayCurrency: z.nativeEnum(CurrencyCode).nullable().optional()` to the profile/account edit schema. |
| 14.20 | Seed | `backend/db/seeds/seed-users.ts` (or factory) | user row inserts | Add `displayCurrency: null` to the default user factory — NO currency bias. |

**Verify per file:** `tsgo` → `biome:check` → lint-queue-client. Then `bun run scripts/run-test/run-test.ts backend/db/test/repo/user.repository.test.ts` for the new `updateDisplayCurrency` round-trip. Then `bun test frontend/graphql/test/profile.documents.test.ts` for the new `displayCurrency` mutation.

**CROSS-FILE DEPENDENCIES (orchestrator-coordinated):**

- The `displayCurrency` field must appear on the `User` GraphQL object (14.8) BEFORE the frontend documents (14.11) can select it — sequencing matters.
- The store change (14.12) must land BEFORE the FX-render call-site swap in Phase 15 reads `useUserStore.displayCurrency`.
- Staff `AccountSection` (14.18) today has no per-row display branch — a small view-mode `<CurrencyDisplay>` row must be added.

_Rules (read before editing):_ `AGENTS.md` (root — lint queue + per-file verification loop + fix-or-report cross-file rule) · `backend/AGENTS.md` (6-layer data flow: Schema → Types → Repo → Service → GraphQL → Test; Type Definition Pattern — `UserReturnType` re-applies the enum) · `backend/types/AGENTS.md` (single canonical `UserReturnType`; `$inferSelect`/`$inferInsert`; **re-apply** `displayCurrency: CurrencyCode | null` mirroring `timezone: IanaTimezone`) · `.agents/instructions/backend.instructions.md` (Type Definition Pattern + Service Layer + Repository Layer — `updateDisplayCurrency` mirrors `updateTimezone` exactly; same `tx`/`locale` param order; `getBackendTranslations` for error strings; no hardcoded user-facing text) · `backend/db/repo/AGENTS.md` (data access only; no business logic; no permission checks) · `backend/services/AGENTS.md` (domain-driven; service does `SubmitInput → InsertType`; pass `tx`; pass `locale?`; SSR-compatible — no GraphQL ctx access unless explicitly passed) · `backend/graphql/AGENTS.md` (`nullable: true` REQUIRED for `CurrencyCode | null`; resolvers delegate to services — never repos; propagate `ctx.locale`; `id` on every object) · `shared/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (i18n message types must NOT reference view types or codegen types — `readonly displayCurrency: string;` only) · `frontend/stores/AGENTS.md` (Zustand store mirrors for `mockUserStore` Storybook) · `frontend/views/AGENTS.md` (`<CurrencySelect>` consumer wiring; `<RequirePermission>` defaults; stories auto-wrapped in `NextIntlClientProvider`) · `frontend/AGENTS.md` (MUI v9 — all style props in `sx`; Apollo hooks from `"@apollo/client/react"`; `id` on selection sets) · `tests.instructions.md` (when editing `user.repository.test.ts` — `runInRollback` always; pass `tx` to all repo calls; never `expect(...).rejects.toThrow()` inside rollback)

---

## Phase 15 — FX-convert-on-render read path (Decision 3A part 3 + stale-FX rule) — repo fork → service → Pothos `DisplayAmount` → frontend lib → UI swap

Decision 3A part 3 + rule 5 (stale FX → show locked only). This is a behavior-ADDING phase (today this read path does not exist). The financial-snapshot insert path keeps its THROW; only the display path forks a soft variant.

| # | Layer | File | Lines | Change |
|---|-------|------|-------|--------|
| 15.1 | Repo (soft FX variant) | `backend/db/repo/billing/billing.repository.ts` | after `102-134` | NEW `getLatestExchangeRateForDisplay(from: CurrencyCode, to: CurrencyCode, tx?, locale?) → Promise<{ rate: string \| null; stale: boolean }>` — returns `{ rate: null, stale: true }` when no row OR row older than 24h; returns `{ rate: latest.rate, stale: false }` when fresh. DOES NOT throw. Mirrors the existing throw-variant's select+ordering but soft on the not-found and stale branches. |
| 15.2 | Backend types | `backend/types/billing.types.ts` | — | NEW `DisplayAmountReturnType = { id: string; amount: string \| null; currency: CurrencyCode; stale: boolean }` (the `id` is a synthetic composite — see 15.4). |
| 15.3 | Service | `backend/services/billing/fx-display.service.ts` | NEW | Export `convertForDisplay(lockedAmount: string, lockedCurrency: CurrencyCode, displayCurrency: CurrencyCode, tx?, locale?) → Promise<DisplayAmountReturnType>`. Logic: (a) if `lockedCurrency === displayCurrency` → `{ amount: lockedAmount, currency: lockedCurrency, stale: false }`; (b) try direct pair via `getLatestExchangeRateForDisplay(locked, display)`; (c) if direct missing/stale → fall back to `locked → USD → display` via two soft calls (USD-hub transitive), multiplying rates; (d) if BOTH legs fail → `{ amount: null, currency: lockedCurrency, stale: true }`. SSR-safe — no GraphQL ctx access. Pass `tx` + `locale?` through. |
| 15.4 | Pothos — DisplayAmount object | `backend/graphql/pothos/billing/fx-display.pothos.ts` (or sibling in `billing.pothos.ts`) | NEW | NEW `DisplayAmountPothosObject = gqlSchemaBuilder.objectRef<DisplayAmountReturnType>("DisplayAmount").implement({ fields: t => ({ id: t.exposeID("id", {}), amount: t.exposeString("amount", { nullable: true }), currency: t.expose("currency", { type: CurrencyCodePothosObject }), stale: t.boolean({ resolve: parent => parent.stale }) }) })`. Carry `id` to keep Apollo cache normalization intact. |
| 15.5 | Pothos — displayAmount fields on money objects | `backend/graphql/pothos/billing/billing-history.pothos.ts`, `backend/graphql/pothos/teachers/teacher-portal.pothos.ts`, `backend/graphql/pothos/parents/parent-profile.pothos.ts` (verify exact files) | wherever invoice rows / hourlyRate / feeAmount are exposed | Add `displayAmount: t.field({ type: DisplayAmountPothosObject, nullable: true, resolve: async (parent, _args, ctx) => { const displayCurrency = ctx.user?.displayCurrency; if (!displayCurrency) return null; return FxDisplayService.convertForDisplay(parent.amount/parent.hourlyRate, parent.currency/parent.rateCurrency, displayCurrency, undefined, ctx.locale); } })`. Resolver delegates to the SERVICE, pulls `ctx.user.displayCurrency` explicitly, propagates `ctx.locale`. |
| 15.6 | Codegen | (regen) | — | `bun run generate:gqlSchema && bun codegen` — surfaces `DisplayAmount` type + `displayAmount` field on money objects. |
| 15.7 | Frontend documents | `frontend/graphql/sharedDocuments/billing-management.documents.ts` + teacher/parent profile documents | money object selections | Add `displayAmount { id amount currency stale }` to the relevant invoice/teacher/parent selection sets. `currency` is `CurrencyCode` now (post-Phase 7 typing). |
| 15.8 | Frontend lib | `frontend/lib/currency.ts` | `14-19` (type) + `28-60` (catalog rows) | Add `readonly decimals: number;` to `CurrencyOption`; populate ISO 4217 minor-unit count for all 32 codes (most = 2; BHD/IQD/JOD/KWD/LYD/OMR/TND = 3; JPY = 0; etc. — verify against ISO spec). |
| 15.9 | Frontend lib | `frontend/lib/currency.ts` | after `getCurrencySymbol` (~`74`) | NEW `getCurrencyDecimals(code: CurrencyCode \| string): number` — fallback `2` if code unknown. |
| 15.10 | Frontend lib | `frontend/lib/currency.ts` (or new `frontend/lib/fx-render.ts`) | NEW | NEW `formatCurrencyForDisplay(amount: string \| number, lockedCurrency: CurrencyCode, displayCurrency: CurrencyCode \| null \| undefined, fxRate: number \| null, stale: boolean, locale?): string`. Logic: (a) `displayCurrency == null \|\| fxRate == null \|\| stale \|\| displayCurrency === lockedCurrency` → render locked only via `Intl.NumberFormat(locale, { style: "currency", currency: lockedCurrency, minimumFractionDigits: getCurrencyDecimals(lockedCurrency), maximumFractionDigits: getCurrencyDecimals(lockedCurrency) })`; (b) otherwise → `"{lockedAmount} (≈ {convertedApprox} {display})"` using the i18n `convertedAmount` template from 15.13 — converted via `amount * fxRate`, rendered with `maximumFractionDigits: 2`. |
| 15.11 | Frontend UI — 5 `formatCurrency` swap | `frontend/views/dashboard/admin/billing/AdminBillingContainer.tsx:47-49,163,175,178` · `frontend/views/dashboard/billing/ParentBillingContainer.tsx:26-28,106,116,117` · `frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx:23-26,129,130` · `frontend/views/dashboard/reports/components/PerformanceLedgerCard.tsx:28,156,159` · `ReportsDataGrid.tsx:45,151,163` · `ReportsTotalsRow.tsx:15,23` | each per-file `formatCurrency` helper + each call site | Replace local `formatCurrency` with `formatCurrencyForDisplay` reading `useUserStore(state => state.displayCurrency)` + the `displayAmount` GraphQL field from 15.7 (`fxRate` derived from `displayAmount.amount / lockedAmount` when not stale; pass `stale`). Delete the per-file `formatCurrency` dedupes. |
| 15.12 | Frontend UI — salary/fee display | `CompensationSection.tsx:44,62` · `SalaryDetailsSection.tsx` (onboarding + profile) · `BillingSection.tsx:65,70` (parent fee display) | money display rows | Replace `{amount} {currency}` interpolation with `formatCurrencyForDisplay` using `displayAmount`/`displayCurrency`. The i18n `baseSalary: "{amount} {currency}"` template (B.5) becomes the locked-only fallback; the new `convertedAmount` template is used when FX is live. |
| 15.13 | i18n — converted-amount template | `shared/messages/types/profile.ts` (teacher block) · `shared/messages/types/dashboard/teachers/own-profile.ts` · `shared/messages/types/dashboard/teachers/profile.ts` | type defs | Add `readonly convertedAmount: string;` next to `baseSalary`. |
| 15.14 | i18n AR + EN converted-amount | `shared/messages/ar/profile.ts:50` · `shared/messages/en.ts:254,2456` · `shared/messages/ar/dashboard/teachers/own-profile.ts:11` | templates | Add `convertedAmount: "{lockedAmount} {lockedCurrency} (≈ {convertedApprox} {displayCurrency})"` (AR localized: `"{lockedAmount} {lockedCurrency} (تقريباً {convertedApprox} {displayCurrency})"`). |
| 15.15 | i18n — stale-fallback | `shared/messages/types/errors/main.ts:24-25` · `shared/messages/ar/errors.ts:15-16` · `shared/messages/en/errors.ts:15-16` | errors block | Add NEW key `displayCurrencyFallback: "Rate unavailable — showing {lockedAmount} {lockedCurrency}"` (AR: `"السعر غير متوفر — عرض {lockedAmount} {lockedCurrency}"`) — used by `formatCurrencyForDisplay` when `stale === true`. The existing `noExchangeRate`/`exchangeRateStale` throw keys stay intact for the financial insert path. |
| 15.16 | Seeds — verify FX pair coverage | `backend/db/seeds/lib` (cursorignored — orchestrator only, codegen via `bun scripts/...`) | `EXCHANGE_PAIRS` | Orchestrator verifies the seeded `EXCHANGE_PAIRS` cardinality. If only USD-anchored pairs exist (likely), the USD-hub transitive path (15.3 step c) handles non-USD pairs. No mandatory change unless a direct pair is required for a demo currency. |

**Verify per file:** `tsgo` → `biome:check` → lint-queue-client → `bun run scripts/run-test/run-test.ts backend/services/billing/fx-display.service.test.ts` (new test). Then `bun test frontend/graphql/test/billing-management.documents.test.ts` (if exists) to confirm `displayAmount` selection round-trips.

**CROSS-FILE DEPENDENCIES (orchestrator-coordinated — NOT per-file sub-agent fixes):**

1. **Reports currency-pair columns** (`ReportsDataGrid.tsx:163`, `ReportsTotalsRow.tsx:23`, `PerformanceLedgerCard.tsx:156` + `backend/db/repo/books/report.repository.ts` + `backend/services/report/report.service.ts`) — the `paidEgp`/`paidUsd` hardcoded column pairs + their backing resolver MUST move to `{ amount, currency }` rows + the `displayAmount` resolver BEFORE the frontend reports can honor `displayCurrency`. This cannot be done by a single per-file sub-agent. Orchestrator coordinates a wave across `report.repository.ts` → `report.service.ts` → reports Pothos resolver → reports documents → reports UI. Report as a follow-up sub-agent wave blocking 15.11's reports portion.
2. **`EXCHANGE_PAIRS` cardinality** (cursorignored file in `backend/db/seeds/lib`) — orchestrator verifies seeded pairs before Phase 15 starts; if a direct `locked→display` pair is missing for a demo currency, the USD-hub transitive path (15.3) handles it.
3. **`shared/` residency of currency config** — default decision: keep `decimals` on `frontend/lib/currency.ts` only; the backend `fx-display.service.ts` trusts `Intl.NumberFormat` defaults for any server-side formatting. If a future service needs deterministic server-side rounding, orchestrator coordinates moving `currencies` to `shared/constants/currency-config.ts` (per `shared/AGENTS.md`).

_Rules (read before editing):_ `AGENTS.md` (root — lint queue + per-file verification loop + fix-or-report cross-file rule) · `backend/AGENTS.md` (6-layer data flow; FX read path is repo → service → Pothos resolver) · `.agents/instructions/backend.instructions.md` (Repository Layer — `getLatestExchangeRateForDisplay` is repo-only for the rate fetch; no business logic in repo; Service Layer — `fx-display.service.ts` is the conversion business logic hub; `SubmitInput → InsertType`/`SelectType → ReturnType` shape) · `backend/db/repo/AGENTS.md` (data access only; the soft FX variant returns `null` not throw — record in the JSDoc that the financial insert path MUST use the throw-variant, not the soft one) · `backend/types/AGENTS.md` (NEW `DisplayAmountReturnType` in `billing.types.ts`; `id` field on the type for Apollo cache normalization) · `backend/services/AGENTS.md` (domain-driven; `fx-display.service.ts` in `billing/` domain; SSR-safe — no GraphQL ctx unless explicitly passed; resolver pulls `ctx.user.displayCurrency` and passes it as a plain arg) · `backend/graphql/AGENTS.md` (resolvers delegate to `FxDisplayService` — never to `billing.repository.ts` directly; `nullable: true` on `displayAmount`; `id` field on `DisplayAmountPothosObject`; propagate `ctx.locale`) · `shared/AGENTS.md` (currency metadata stays on `frontend/lib/currency.ts` for v1; if duplicated to `shared/constants/` later, no `@/frontend/**`/`@/backend/**`/`@/app/**` imports) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL — import `gql`+`TypedDocumentNode` from `"@apollo/client"`, hooks from `"@apollo/client/react"`; `id` on `displayAmount` selection to keep cache normalization; no `useLazyQuery`; ENTITY types from `graphql-types.ts`) · `frontend/AGENTS.md` (MUI v9 — style props in `sx`; theme callback for colors — no hardcoded hex; `useTranslations` for the `convertedAmount`/`displayCurrencyFallback` templates; logging via `@/frontend/utils/logger` NEVER `console.*`) · `frontend/views/AGENTS.md` (functional components; the 5 `formatCurrency` swap files use Apollo `useQuery` already — wire `displayAmount` from the new selection, no lazy queries) · `tests.instructions.md` (NEW `fx-display.service.test.ts` — `runInRollback` always; pass `tx` to all repo/service calls; assert soft-returns not throws; cover the 4 cases: identity, live, stale, USD-hub transitive)

---

## Phase 16 — Backend repo + logic tests

| File | Edit |
|------|------|
| `backend/db/test/repo/billing.repository.test.ts` | Where insert rows specify `currency: "USD"`, change to `CurrencyCode.USD`; assert columns typed |
| `backend/db/test/repo/teacher.repository.test.ts` | `rateCurrency` literals → enum |
| `backend/db/test/repo/parent.repository.test.ts` | `currency` literals → enum |
| `backend/db/test/repo/user.repository.test.ts` | NEW — `updateDisplayCurrency` round-trip (create user → set `CurrencyCode.Usd` → assert returning row → update to `CurrencyCode.Egp` → assert). `runInRollback`; pass `tx`. |
| `backend/db/test/repo/report.repository.test.ts` | No literal changes needed (SQL CASE kept as raw string) — verify still passes |
| `backend/db/test/logic/billing-safeguards.test.ts` | `fromCurrency:"EGP"`, `toCurrency:"USD"` literals → `CurrencyCode.EGP/USD` |
| `backend/db/test/logic/exchange-rate.test.ts` | Same |
| `backend/services/billing/fx-display.service.test.ts` | NEW — assert the 4 cases: (a) `display === locked` ⇒ `{ amount: locked, stale: false }`; (b) live direct pair ⇒ `convertedAmount` returned, `stale: false`; (c) stale pair (effectiveDate older than 24h) ⇒ `{ amount: null, stale: true }`; (d) USD-hub transitive (locked→USD→display when direct pair missing) ⇒ `convertedAmount` returned. `runInRollback`; pass `tx` to all repo/service calls. NEVER `expect(...).rejects.toThrow()` — assert soft returns. |
| `backend/db/test/logic/class_instances_security.test.ts` | Audit currency-typed snapshot assertions |
| `backend/db/test/logic/class_rescheduling.test.ts` | Same |
| `backend/db/test/logic/concurrency.test.ts` | Same |
| `backend/db/test/logic/invoice-restriction.test.ts` | Same |
| `backend/db/test/logic/payment-idempotency.test.ts` | Same |
| `backend/db/test/logic/session-scalability.test.ts` | Same |
| `backend/db/test/logic/teacher_banking_verification.test.ts` | `teacher_payments.currency` literal → enum |
| `backend/db/test/logic/audit-trail.test.ts` | FX audit assertions |

**Run via:**
```bash
bun run scripts/run-test/run-test.ts <test-path>     # single
bun run test:db                                       # parallel (after all edits land)
```

**Critical:** `runInRollback` wrapper preserved (per AGENTS.md). Never `expect(...).rejects.toThrow()` inside rollback — the new FX test asserts soft returns, not throws.

_Rules (read before editing):_ `AGENTS.md` (root — database test rules: `runInRollback` ALWAYS; pass `tx` to ALL repo calls; NEVER `expect(...).rejects.toThrow()` inside rollback — use try/catch `expectRepoError` pattern; run tests via `bun run scripts/run-test/run-test.ts` NOT raw `bun test`; never query seed data — create via `entity-setup.ts` helpers) · `tests.instructions.md` (**Database Tests - Transaction Safety CRITICAL** — mixing `tx` and `db` causes deadlocks; **tx Parameter Position varies per method** — read repo signature before calling e.g. `ParentRepository.getParentProfile(parentId, tx?)` 2nd vs `StorageDbRepository.linkFileToParent(parentId, fileId, usageType, tx?)` 4th; **Entity Setup Helpers signatures VARY** — read `entity-setup.ts` first e.g. `setupStudent(tx, userOverrides, parentOverrides, studentOverrides)` 4 args; never assume table columns — read schema first; assert `.toContain()` on translated message substring NOT raw key; `bun:test` imports not Jest/Vitest; no `any` use `Partial<...>`; `testLogger` not `console.*`; repo tests = 100% coverage; GraphQL integration tests use `testClient.query()` NEVER raw `fetch`; NEVER import backend repos/Drizzle/services in GraphQL tests — interact via GraphQL API only; `setupTestServerLifecycle()` at root of `describe`; Apollo `errorPolicy: "all"` so assert `result.error` not throw; `authenticatedRequest` helper; optional chaining `?.` for `@typescript-eslint/prefer-optional-chain`) · `backend/db/repo/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Repository Layer — applies since these tests exercise repos)

---

## Phase 17 — Backend service tests

| File | Edit |
|------|------|
| `backend/services/profile/profile.service.test.ts` | `34`, `49` `currency: "SAR"` → `CurrencyCode.SAR`; `74` `currency: undefined`; NEW — `displayCurrency` set/get round-trip via `updateProfileFields({ displayCurrency: CurrencyCode.Usd })` |
| `backend/services/profile/parent-profile.service.test.ts` | `15`, `29`, `47`, `62` |
| `backend/services/profile/teacher-profile.service.test.ts` | `25` `rateCurrency: "USD"` → `CurrencyCode.USD` |

_Rules (read before editing):_ `tests.instructions.md` (Coverage & Structure — `bun:test` imports not Jest/Vitest; no `any`; `@/backend/types` types; `testLogger` not `console.*`; Quality section — `bun tsgo` + lint via queue client after test changes, NEVER raw `bun lint`) · `.agents/instructions/backend.instructions.md` (Service Layer + Type Definition Pattern — services import from `@/backend/types`) · `backend/services/AGENTS.md`

---

## Phase 18 — Story fixtures

| File | Line | Edit |
|------|------|------|
| `frontend/views/dashboard/profile/teacher/TeacherProfileView.stories.tsx` | `19`, `40` | `rateCurrency: CurrencyCode.USD`; NEW story variant with `displayCurrency: CurrencyCode.Usd` + live `displayAmount` showing the converted `(≈ X USD)` badge |
| `frontend/views/dashboard/profile/teacher/TeacherProfileEditForm.stories.tsx` | `26` | same |
| `frontend/views/dashboard/profile/parent/ParentProfileView.stories.tsx` | `42` | `currency: CurrencyCode.SAR`; NEW story variant with stale `displayAmount` (`stale: true`) showing the locked-only fallback |
| `frontend/views/dashboard/profile/parent/ParentProfileEditForm.stories.tsx` | `24` | same |
| `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingView.stories.tsx` | `21` | `currency: CurrencyCode.USD` |
| `frontend/views/dashboard/teachers/profile/TeacherProfileView.stories.tsx` | `18` | `currency: CurrencyCode.USD` |
| `frontend/lib/currency.ts` (or `fx-render.ts`) — new Storybook story file | NEW | Stories for `formatCurrencyForDisplay` covering: live FX, stale FX fallback, identity (`display === locked`), missing `displayCurrency` (`null`) |

**Verify:** `bun test test/ui/components/...` (Storybook stories, isolated runner).

_Rules (read before editing):_ `frontend/views/AGENTS.md` (Storybook Best Practices — `<RequirePermission>` defaults to admin via global `StoryWrapper`; ALL stories auto-wrapped in `NextIntlClientProvider` → component MUST use `useTranslations` for locale-toggle compatibility; real `userStore` aliased to `mockUserStore` — prefer mock stores for predictable initial state, including the NEW `displayCurrency: CurrencyCode.Usd | null`; decorators in metadata `decorators` array, NOT wrapping the component in the story function) · `frontend/AGENTS.md` (Storybook section — same rules, repeated) · `frontend/stores/AGENTS.md` (mock store mirrors the new `displayCurrency` field) · `.agents/instructions/frontend.instructions.md` (Storybook — `useUserStore.setState()` for specific perms e.g. Parent vs Teacher; auto `NextIntlClientProvider`; `mockUserStore`; decorators in metadata)

---

## Phase 19 — Update parent plan

**File:** `.ai/plans/user-entity-enhancement/ANALYSIS.md`

**Edits:**
- §2.3 Currency: append "**Status: ENUM + TYPING + DISPLAY-CURRENCY + FX-READ-PATH LANDED** in `.ai/plans/currency/`. FX *ingestion* (fetch source, cron cadence) still deferred to a payment-methods wave; everything else in Decision 3A is landed."
- §7.1 Currency: replace the bullet pointing at Decision 3A with a "✅ Landed" status + link to `.ai/plans/currency/spec.md`.
- §12 Phases row **1** (`Schema: users person fields + CurrencyCode enum + phone custom type`): strike "CurrencyCode enum" AND add "users.displayCurrency column" — both landed in `.ai/plans/currency/` Phases 14-15.
- Add a new entry under §13 Out of scope or a new §15 "Landed slices" listing `.ai/plans/currency/` (full slices: typing + displayCurrency + FX read path) so future waves know not to re-do any of it.

_Rules (read before editing):_ `AGENTS.md` (root — AI Agent Communication: "NEVER create summary markdown files" but **exception**: documentation files that are part of the project structure — `ANALYSIS.md` qualifies as it's part of the existing `.ai/plans/user-entity-enhancement/` plan; do NOT create NEW summary files like SUMMARY.md / CHANGES.md) — this phase only edits an existing plan doc, not a generated summary

---

## Phase 20 — Quality gate

```bash
# 1. Start the lint queue server
~/.bun/bin/bun run scripts/lint-queue-server.ts &

# 2. Final per-file verification for every touched file (sub-agent or sequential)
#    the per-file health loop short-circuits at first failing check
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene

# 3. Full quality gate
bun quality-gate      # tsgo → biome → lint → codescene → sonar-results (uses existing sonar-result.json)
```

**Forbidden:** `bun sonar-scan` (only orchestrator runs sonar). Sub-agents never trigger scans.

---

## Phase 21 — Final verification checklist

- [ ] `bun tsgo -b --noEmit` — 0 currency-related errors (incl. `users.displayCurrency`, `DisplayAmount`, `fx-display.service.ts`)
- [ ] `bun biome:check` — all touched files clean
- [ ] lint queue — 0 errors on touched files
- [ ] `bun db cleanGenerate` — fresh migration set with `currency_code` enum AND a new nullable `display_currency` column on `users`
- [ ] `bun db seed` — seeds run (factory + hedges + FX pairs + `seed-users.displayCurrency = null`)
- [ ] `bun run test:db` — all repo + logic tests pass (incl. new `fx-display.service.test.ts` + `updateDisplayCurrency` round-trip)
- [ ] `bun run test:graphql` — GraphQL integration tests pass (incl. new `displayCurrency` mutation assertion)
- [ ] `bun test test/ui/components/` — Storybook stories render (incl. FX live-conversion + stale-fallback stories)
- [ ] `bun run generate:gqlSchema && bun codegen` — surfaces `CurrencyCode` on all 12 fields + `displayCurrency` on `User` + `DisplayAmount` on money objects
- [ ] `profile.documents.test.ts:55` assertion still green; new `displayCurrency` mutation assertion green
- [ ] ReportsDataGrid/ReportsTotalsRow/PerformanceLedgerCard rendering with typed currency (reports currency-pair cross-file dependency resolved before this phase)
- [ ] Decision 3A rule 2 verified end-to-end: `users.displayCurrency = USD` + teacher locked at `50 EGP` + live FX ⇒ profile shows `50 EGP (≈ X USD)`
- [ ] Decision 3A rule 5 verified end-to-end: stale FX ⇒ UI shows `50 EGP` only (no fabricated conversion); `formatCurrencyForDisplay` honors `stale: true`
- [ ] `.ai/plans/user-entity-enhancement/ANALYSIS.md` updated (typing + displayCurrency + FX read path all marked landed)

---

## Risk register

| Risk | Mitigation |
|------|------------|
| One of the 7 schemas gets missed → broken FK/index | Use the §A rollup table from spec.md as the master list; verify each line in PR diff |
| `report.repository.ts` SQL CASE binds as `unknown` in `sql<T>` | Prefer to keep raw string literals inside the template — record decision in PR description |
| Pothos `t.field({ type, required })` arg-shape confusion | Mirror existing `FieldEnum` patterns from the codegen prior step; verify one Pothos file before rest |
| Backend enum drift between TS enum and PG enum | `createPgEnumFromEnum` derives PG enum from the TS enum (single source — same pattern as `countryCodeEnum`) |
| Generated codegen has stale op files after document edits | Re-run `bun codegen` after Phases 10, 14, and 15; committed `graphql/gql/` artifacts must reflect new types incl. `displayCurrency` + `DisplayAmount` |
| `cleanGenerate` re-creates extension migration + custom logic; verify it does not regress existing custom SQL under `backend/db/migration/` | Inspect after Phase 3; the bundled `combined_custom_logic` migration is regenerated automatically |
| Seeds `seed-teachers`/`seed-parents` currently leave currency null — null enum column requires `.$type<CurrencyCode>()` (already in spec) | Verified nullable typing in Phase 2 |
| `displayCurrency` null default on `users` causes null-check friction in client money rendering | `formatCurrencyForDisplay` treats `displayCurrency == null` as "show locked only" — no special UI; the `CurrencySelect` accepts `null` and shows a "Not set" placeholder |
| FX-convert-on-render `displayAmount` resolver called on every money object fetch → N+1 FX reads | The resolver receives `ctx.user.displayCurrency` (one read per user per request); the service caches the per-pair rate for the duration of the request via memoization in `fx-display.service.ts`. Orchestrator verifies the resolver does NOT issue one FX query per row — batch or memoize. |
| USD-hub transitive path (`locked → USD → display`) succeeds with a single seeded leg if the other leg is missing | `fx-display.service.ts` soft-returns `{ stale: true, amount: null }` if EITHER leg of the USD-hub is missing/stale — conservative, matches Decision 3A rule 5 |
| Reports currency-pair columns CROSS-FILE DEPENDENCY exceeds a single phase | Orchestrator coordinates a dedicated sub-wave BEFORE Phase 15's reports UI swap reaches `ReportsDataGrid`/`ReportsTotalsRow`/`PerformanceLedgerCard` — repo → service → Pothos → documents → UI in sequence. If the wave exceeds budget, fall back to "show locked currency only on reports" for v1 and track the full display conversion as a follow-up. |
| `EXCHANGE_PAIRS` seed cardinality gaps | Orchestrator verifies seeded pairs (cursorignored file in `backend/db/seeds/lib`) before Phase 15; USD-hub transitive path handles missing direct pairs. |
| `shared/` residency of currency metadata | Default: trust `Intl.NumberFormat` server-side; `decimals` stays on `frontend/lib/currency.ts`. If a future service needs deterministic server-side rounding, orchestrator coordinates moving `currencies` to `shared/constants/currency-config.ts` (per `shared/AGENTS.md`, no cross-layer imports). |
| `DisplayAmountPothosObject` Apollo cache normalization | Synthetic `id` composite `displayAmount:<entityId>:<displayCurrency>` — must be unique per (entity, displayCurrency) pair so cache entries invalidate per user-preference change. Orchestrator verifies the resolver emits a stable `id`. |

---

## File-count summary

- DB schema: 8 files (`enums.ts` + 7 touched schema files + `users.ts` for the new `displayCurrency` column)
- Backend types: 5 files (incl. `UserReturnType` `displayCurrency` + `DisplayAmountReturnType`)
- Repositories: 10 files (incl. `getLatestExchangeRateForDisplay` + `updateDisplayCurrency`)
- Services: 8 files (incl. NEW `fx-display.service.ts`)
- Pothos: 11 files (incl. NEW `DisplayAmountPothosObject` + `displayCurrency` field on `User` + `displayAmount` resolvers on money objects)
- Seeds: 4 files (+ `seed-users.ts` `displayCurrency: null`)
- Frontend documents: 1 core file (others auto-update via codegen, all gain `displayAmount` + `displayCurrency` selections)
- Frontend lib: 2 files (`currency.ts` gains `decimals` + `formatCurrencyForDisplay`; optional `fx-render.ts` split)
- Frontend Zod: 6+ files (+ `displayCurrency` profile/account validators)
- Frontend types: 6 files
- Frontend store: 1 file (`userStore.ts` + mock sibling)
- Frontend UI: 27 files (the existing Phase 13 wiring) + 3 `AccountSection` (`teacher`/`parent`/`staff` `displayCurrency` control) = 30 files
- Tests: 16 files (incl. NEW `fx-display.service.test.ts` + `updateDisplayCurrency` round-trip + `displayCurrency` profile service test)
- Stories: 6 existing files + 1 NEW FX-render story file
- i18n: 6 files (`shared/messages/{types,ar,en}` profile + errors for `displayCurrency`/`convertedAmount`/`displayCurrencyFallback`)
- Plan docs: 1 file (`ANALYSIS.md` update — marks typing + displayCurrency + FX read path all landed)

Total ≈ **123 files** touched across 21 phases (full Decision 3A coverage).

---

## File-count summary

- DB schema: 8 files (`enums.ts` + 7 touched schema files)
- Backend types: 5 files
- Repositories: 9 files
- Services: 7 files
- Pothos: 9 files
- Seeds: 4 files
- Frontend documents: 1 file (others auto-update via codegen)
- Frontend Zod: 6 files
- Frontend types: 6 files
- Frontend UI: 27 files
- Tests: 14 files
- Stories: 6 files
- Plan docs: 1 file (ANALYSIS.md update)

Total ≈ **103 files** touched across 19 phases.
