# Currency Migration — Tasks

**Spec:** [`./spec.md`](./spec.md) — **Plan:** [`./plan.md`](./plan.md)
**Tracking convention:** checkboxes below map 1:1 to plan.md phases. Mark `[x]` only after the per-file verification loop (`tsgo` → `biome:check` → lint-queue) passes on every file the phase touched.
**Linting:** ALWAYS go through the lint queue server/client — NEVER run `bun lint` directly. Start the server once at the top of execution:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
```

**Rule files per phase (read EVERY listed file before editing that layer — enforced per spec.md §8):**

| Phase | Layer | Mandatory rule files |
|---|---|---|
| 1, 2, 3 | Backend DB schema / Drizzle / DB tooling | `AGENTS.md` · `backend/AGENTS.md` · `backend/db/repo/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Seeds + Database Access Patterns sections) · drizzle skills (`drizzle-migrations`, `drizzle-responses-and-errors`, `drizzle-generate`) |
| 4 | Backend types | `AGENTS.md` · `backend/types/AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Type Definition Pattern CRITICAL) |
| 5 | Repositories | `AGENTS.md` · `backend/db/repo/AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Repository Layer) |
| 6 | Services | `AGENTS.md` · `backend/services/AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Service Layer) |
| 7 | Pothos | `AGENTS.md` · `backend/graphql/AGENTS.md` · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Pothos/GraphQL) |
| 8 | Codegen | `AGENTS.md` · `frontend/AGENTS.md` · `frontend/graphql/sharedDocuments/AGENTS.md` · `frontend/graphql/AGENTS.md` · `.agents/instructions/{frontend,backend}.instructions.md` (Apollo & GraphQL sections) |
| 9 | Seeds | `AGENTS.md` · `backend/AGENTS.md` (Seeds section) · `.agents/instructions/backend.instructions.md` (Seeds CRITICAL) |
| 10 | Frontend documents | `AGENTS.md` · `frontend/graphql/sharedDocuments/AGENTS.md` · `frontend/graphql/AGENTS.md` · `frontend/AGENTS.md` · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL) |
| 11–13 | Frontend Zod / types / UI | `AGENTS.md` · `frontend/views/AGENTS.md` · `frontend/AGENTS.md` · `.agents/instructions/frontend.instructions.md` (MUI v9, React 19, Apollo, Theme & Styling) |
| 14 | `users.displayCurrency` (Decision 3A part 2) | `AGENTS.md` · `backend/AGENTS.md` · `backend/types/AGENTS.md` (UserReturnType re-apply) · `.agents/instructions/backend.instructions.md` · `backend/db/repo/AGENTS.md` · `backend/services/AGENTS.md` · `backend/graphql/AGENTS.md` · `shared/AGENTS.md` · `frontend/stores/AGENTS.md` · `frontend/views/AGENTS.md` · `frontend/AGENTS.md` · `.agents/instructions/frontend.instructions.md` · `tests.instructions.md` |
| 15 | FX-convert-on-render read path (Decision 3A part 3 + stale-FX rule) | `AGENTS.md` · `backend/AGENTS.md` · `backend/db/repo/AGENTS.md` · `backend/types/AGENTS.md` · `backend/services/AGENTS.md` · `backend/graphql/AGENTS.md` · `shared/AGENTS.md` · `.agents/instructions/frontend.instructions.md` · `frontend/AGENTS.md` · `frontend/views/AGENTS.md` · `tests.instructions.md` |
| 16–17 | Backend repo/logic + service tests | `AGENTS.md` · `tests.instructions.md` (DB + GraphQL test rules) · `backend/db/repo/AGENTS.md` (for repo tests) · `.agents/instructions/backend.instructions.md` |
| 18 | Storybook | `AGENTS.md` · `frontend/views/AGENTS.md` (Storybook Best Practices) · `frontend/stores/AGENTS.md` · `frontend/AGENTS.md` · `.agents/instructions/frontend.instructions.md` (Storybook section) |
| 19 | Plan doc edit | `AGENTS.md` (AI Agent Communication — never create new SUMMARY.md/CHANGES.md; editing existing `ANALYSIS.md` is the documented exception) |
| 20–21 | Quality gate | `AGENTS.md` (Quality Gate Workflow, Sonar-Scan Prohibition, Lint Queue Server) |

---

## Phase 1 — Backend DB enum registration

- [ ] **T1.1** Add `currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode)` to `backend/db/schema/enums.ts` (next to `countryCodeEnum`, line 36). Add `CurrencyCode` import from `@/backend/enum`.
- [ ] **T1.2** Re-export `currencyCodeEnum` from `backend/db/schema/index.ts` (verify pattern vs how `countryCodeEnum` is surfaced).
- [ ] **T1.3** Per-file verify: `tsgo` on `enums.ts` + `schema/index.ts` → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root — lint queue + verification loop) · `backend/AGENTS.md` · `.agents/instructions/backend.instructions.md` (Seeds + Database Access Patterns — `createPgEnumFromEnum` derives PG enum values from the TS enum so values stay synced)

## Phase 2 — Backend DB schema — column types

- [ ] **T2.1** `backend/db/schema/billing.ts:35` — `invoices.currency` → `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()`
- [ ] **T2.2** `backend/db/schema/billing.ts:76` — `payments.currency` → same
- [ ] **T2.3** `backend/db/schema/billing.ts:99` — `currency_exchange_rates.fromCurrency` → `currencyCodeEnum("from_currency").notNull().$type<CurrencyCode>()`
- [ ] **T2.4** `backend/db/schema/billing.ts:100` — `currency_exchange_rates.toCurrency` → same
- [ ] **T2.5** `backend/db/schema/billing.ts:126` — `currency_exchange_audit_logs.fromCurrency` → same (nullable? verify `.notNull()`)
- [ ] **T2.6** `backend/db/schema/billing.ts:127` — `currency_exchange_audit_logs.toCurrency` → same
- [ ] **T2.7** `backend/db/schema/billing.ts:145` — `currency_hedges.currency` → same
- [ ] **T2.8** Add imports for `currencyCodeEnum` + `CurrencyCode` to `billing.ts`
- [ ] **T2.9** `backend/db/schema/teacher-banking.ts:63` — `teacher_payments.currency` → `currencyCodeEnum("currency").notNull().$type<CurrencyCode>()` + imports
- [ ] **T2.10** `backend/db/schema/teachers.ts:32` — `teachers.rateCurrency` → `currencyCodeEnum("rate_currency").$type<CurrencyCode>()` (nullable) + imports
- [ ] **T2.11** `backend/db/schema/parents.ts:24` — `parents.currency` → `currencyCodeEnum("currency").$type<CurrencyCode>()` (nullable) + imports
- [ ] **T2.12** `backend/db/schema/scheduling.ts:152` — `class_instances.rateCurrency` → `currencyCodeEnum("rate_currency").$type<CurrencyCode>()` (nullable) + imports
- [ ] **T2.13** Per-file `tsgo` on all 7 schema files → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/AGENTS.md` (6-layer data flow — schema layer) · `.agents/instructions/backend.instructions.md` (Database schema relations; match PG enums EXACTLY from `backend/db/schema/enums.ts` — `CurrencyCode.EGP === "EGP"`)

## Phase 3 — `bun db cleanGenerate`

- [ ] **T3.1** Run `bun db cleanGenerate` (select action `8` if interactive; or pipe-arg).
- [ ] **T3.2** Verify the regenerated `backend/drizzle/` contains a migration with `CREATE TYPE currency_code AS ENUM (...)` + the column-type changes on the 11 columns.
- [ ] **T3.3** If one of the hand-written `backend/db/migration/*.sql` files references currency columns, fix it to enum-compatible (clean slate usually wipes+regenerates, but verify).
- ⚠️ Phase 3 seeds may fail until Phase 9 lands — re-run `bun db seed` after Phase 9.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop) · `.agents/instructions/backend.instructions.md` ("Seeds (CRITICAL)" — schema changes require `push`/`cleanGenerate` BEFORE `bun db seed`) · drizzle skills (`drizzle-migrations`, `drizzle-responses-and-errors`, `drizzle-generate`, `drizzle-hints` if `generate` returns `missing_hints`)

## Phase 4 — Backend types

- [ ] **T4.1** `backend/types/billing/billing.types.ts:50` — `currency: string` → `currency: CurrencyCode`
- [ ] **T4.2** `backend/types/billing/billing.types.ts:75` — `readonly currency: string` → `readonly currency: CurrencyCode`
- [ ] **T4.3** `backend/types/billing/billing.types.ts:113` — same
- [ ] **T4.4** `backend/types/billing/billing.types.ts:153` — `CreateManualInvoiceInput.currency` → `CurrencyCode`
- [ ] **T4.5** `backend/types/billing/billing.types.ts:39-42` — verify FX `CurrencyExchangeRate{Select,Insert}Type` now infer `CurrencyCode` automatically (no manual edit unless the type widen chain breaks)
- [ ] **T4.6** `backend/types/teachers/teacher.types.ts:51` — `CreateTeacherPaymentInput.currency: string` → `CurrencyCode`
- [ ] **T4.7** `backend/types/teachers/teacher.types.ts:193` — `TeacherOwnProfileReturnType.rateCurrency: string | null` → `CurrencyCode | null`
- [ ] **T4.8** `backend/types/parents/parent.types.ts:171` — `ParentAdminProfile.currency: string | null` → `CurrencyCode | null`
- [ ] **T4.9** `backend/types/parents/parent.types.ts:218` — `ParentProfileUpdateInput.currency` → `CurrencyCode | null`
- [ ] **T4.10** `backend/types/profile/profile.types.ts:66` — `ParentAdminProfileUpdateInput.currency` → `CurrencyCode | null`
- [ ] **T4.11** `backend/types/index.ts` — re-export `CurrencyCode` from `@/backend/enum` if not already present
- [ ] **T4.12** Per-file `tsgo` on each touched `backend/types/**.ts` → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/types/AGENTS.md` (**Single Canonical Object Type Pattern** — `CurrencyCode` is the re-applied enum on `{Entity}ReturnType`; `Omit<>` then re-apply `currency: CurrencyCode`; never create local types in Pothos) · `backend/AGENTS.md` (Type Definition Pattern — `{Entity}SelectType` = `typeof table.$inferSelect`) · `.agents/instructions/backend.instructions.md` (Type Definition Pattern CRITICAL: ALWAYS import from `@/backend/types` alias, never relative; update `backend/types/index.ts` barrel)

## Phase 5 — Repositories

- [ ] **T5.1** `backend/db/repo/billing.repository.ts:50-56` — `resolveExchangeRateSnapshot` signature `currency: string` → `CurrencyCode`
- [ ] **T5.2** `backend/db/repo/billing.repository.ts:71-79` — `createBillingEntity` input `currency: CurrencyCode`
- [ ] **T5.3** `backend/db/repo/billing.repository.ts:105-110` — `getLatestExchangeRate` `fromCurrency`/`toCurrency: CurrencyCode`
- [ ] **T5.4** `backend/db/repo/billing.repository.ts:139-143` — `updateExchangeRate` (verify inferred input flow; no edits beyond updates if inferred)
- [ ] **T5.5** `backend/db/repo/billing.repository.ts:279-316` — `OverdueInvoiceRow.currency: CurrencyCode` + `fetchOverdueInvoices` select (casting may need `${x}::currency_code`)
- [ ] **T5.6** `backend/db/repo/billing.repository.ts:401-412` — `invoiceBaseFields` (`currency: invoices.currency`)
- [ ] **T5.7** `backend/db/repo/billing.repository.ts:414-438` — `mapInvoiceRow` row type `currency: CurrencyCode`
- [ ] **T5.8** `backend/db/repo/teacher.repository.ts:56, 205, 242, 263` — Insert + select + mapper; `rateCurrency: CurrencyCode | null`
- [ ] **T5.9** `backend/db/repo/parent.repository.ts:68, 92, 270, 297, 342` — `currency: CurrencyCode | null` through insert/select/map/update
- [ ] **T5.10** `backend/db/repo/teacher-banking.repository.ts:278` — verify `currency: input.currency` type inference via repo
- [ ] **T5.11** `backend/db/repo/audit.repository.ts:310, 319, 325-326, 363-387` — `currency`, `fromCurrency`, `toCurrency` → `CurrencyCode`; metadata-template narrowing
- [ ] **T5.12** `backend/db/repo/scheduling/shared.ts:183` — pass-through (verify typing only)
- [ ] **T5.13** `backend/db/repo/scheduling/state-changes.ts:539-540` — `rateCurrency: CurrencyCode | null`
- [ ] **T5.14** `backend/db/repo/report.repository.ts:92-93, 115-116` — DECISION: keep `'EGP'`/`'USD'` raw SQL string literals inside the `sql<T>` template (drizzle-safe) OR interpolate `${CurrencyCode.Egp}`. Choose option A unless a tsgo/type-assertion requires B. Record choice in this task note.
- [ ] **T5.15** Per-file `tsgo` on every touched repo file → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop, fix-or-report cross-file rule) · `backend/db/repo/AGENTS.md` (**data access ONLY**: no business logic, no permission checks, no hardcoded user-facing error strings — use `getBackendTranslations` + `locale?` param; repos must use `{Entity}SelectType`/`{Entity}InsertType` from `backend/types/`, NOT raw schema types; conditional aggregation via `sql<number>` template + `.mapWith(Number)` — never raw `CAST(...)`) · `backend/AGENTS.md` (Repository Layer) · `.agents/instructions/backend.instructions.md` ("Repository Layer" — when `findMany` complex relations give `SQL<unknown>` errors, revert to `.select().from().leftJoin()` or manual ID-based mapping)

## Phase 6 — Services

- [ ] **T6.1** `backend/services/billing/billing-management.service.ts:12, 15, 40-55, 57-72` — type flow for `currency`, `buildInvoiceInsertPayload`, `mapToManualInvoiceResult`.
- [ ] **T6.2** `backend/services/teacher/teacher-onboarding.service.ts:35, 82` — `rateCurrency?: CurrencyCode | null`.
- [ ] **T6.3** `backend/services/parent/parent-onboarding.service.ts:24, 36, 85, 111` — `currency?: CurrencyCode | null` + result mapping.
- [ ] **T6.4** `backend/services/parent/parent-profile.service.ts:59` — pass-through typing flows automatically (verify).
- [ ] **T6.5** `backend/services/profile/profile.service.ts:78` — broaden dispatcher input union as needed for `CurrencyCode`.
- [ ] **T6.6** `backend/services/teacher/teacher-portal.service.ts:52` — `rateCurrency: CurrencyCode | null`.
- [ ] **T6.7** `backend/services/session/class-session.service.ts:234-235` — pass-through typing (verify).
- [ ] **T6.8** Per-file `tsgo` on every touched service → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/services/AGENTS.md` (**domain-driven**, no monolithic services; business-logic hub; SSR-compatible — must NOT rely on GraphQL context unless passed explicitly; import types from `@/backend/types`, never ad-hoc; i18n: all user-facing errors via `getBackendTranslations` + `locale?` param; never hardcode error strings) · `backend/AGENTS.md` (Service Layer — data transformations `SubmitInput → InsertType`, `SelectType → ReturnType`) · `.agents/instructions/backend.instructions.md` ("Service Layer" — never call services outside your domain boundary)

## Phase 7 — Pothos GraphQL

- [ ] **T7.1** `backend/graphql/pothos/billing/billing-management.pothos.ts:23` — `ManualInvoiceResult.currency` → `t.expose("currency", { type: CurrencyCodePothosObject })`.
- [ ] **T7.2** `backend/graphql/pothos/billing/billing-management.pothos.ts:74` — `createManualInvoice.currency` arg → `t.field({ type: CurrencyCodePothosObject, required: true })`.
- [ ] **T7.3** Leave lines `78-79` (`exchangeRateSnapshot`/`exchangeRateSource`) as `String`.
- [ ] **T7.4** `backend/graphql/pothos/billing/billing-history.pothos.ts:44` — `InvoiceHistoryRow.currency` → `t.expose`.
- [ ] **T7.5** `backend/graphql/pothos/billing/billing-alerts.pothos.ts:13` — `UnpaidInvoiceItem.currency` → `t.expose`.
- [ ] **T7.6** `backend/graphql/pothos/teachers/teacher-onboarding.pothos.ts:68-71` — `TeacherOnboardingInput.rateCurrency` → `t.field({ type: CurrencyCodePothosObject })`, drop `maxLength: 512`.
- [ ] **T7.7** `backend/graphql/pothos/parents/parent-onboarding.pothos.ts:39` — `ParentOnboardingInput.currency` → `t.field({ type: CurrencyCodePothosObject })`, drop `maxLength: 512`.
- [ ] **T7.8** `backend/graphql/pothos/parents/parent-onboarding.pothos.ts:55` — `ParentOnboardingResult.currency` → `t.expose` (nullable).
- [ ] **T7.9** `backend/graphql/pothos/parents/parent-profile.pothos.ts:30` — `ParentProfile.currency` → `t.expose` (nullable).
- [ ] **T7.10** `backend/graphql/pothos/profile/profile.pothos.ts:166` — `ParentAdminProfileUpdateInput.currency` → `t.field({ type: CurrencyCodePothosObject, required: false })`.
- [ ] **T7.11** `backend/graphql/pothos/teachers/staff-profile.pothos.ts:28` — `TeacherProfileForEdit.rateCurrency` → `t.expose({ type: CurrencyCodePothosObject, nullable: true, authScopes: { superAdmin: true } })`.
- [ ] **T7.12** `backend/graphql/pothos/teachers/staff-profile.pothos.ts:57` — `TeacherProfileUpdateInput.rateCurrency` → `t.field({ type: CurrencyCodePothosObject, required: false })`, drop `maxLength: 255`.
- [ ] **T7.13** Per-file `tsgo` on touched Pothos files → biome → lint-queue.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/graphql/AGENTS.md` (**Single Canonical Object Type (CRITICAL)** — objectRef uses `{Entity}ReturnType` from `backend/types/`; never local `{Entity}Definition`; `nullable: true` REQUIRED for `CurrencyCode | null` — Pothos defaults non-nullable; resolvers delegate to SERVICES not repos; propagate `ctx.locale`; errors via `getBackendTranslations`; `id` on all objects; input + collection wrapper types allowed) · `backend/AGENTS.md` (GraphQL Layer) · `.agents/instructions/backend.instructions.md` ("Pothos/GraphQL" — import types from `@/backend/types`; input + collection wrapper exceptions allowed)

## Phase 8 — Codegen + Schema

- [ ] **T8.1** Run `bun run generate:gqlSchema`.
- [ ] **T8.2** Run `bun codegen`.
- [ ] **T8.3** Verify in `frontend/graphql/generated/schema.graphql` that the 12 currency fields now read `CurrencyCode!`/`CurrencyCode` instead of `String!`/`String`.
- [ ] **T8.4** Verify in `frontend/graphql/generated/gql/graphql-types.ts` that the 12 fields now read `Maybe<CurrencyCode>`/`CurrencyCode`.
- [ ] Do NOT hand-edit generated files.

_Rules (read before editing):_ `AGENTS.md` (root) · `frontend/AGENTS.md` (Code Quality + Apollo/GraphQL Codegen rule) · `frontend/graphql/sharedDocuments/AGENTS.md` ("Codegen" — `~/.bun/bin/bun run generate:gqlSchema` THEN `~/.bun/bin/bun codegen` after any schema or document change; never inline type literals) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL → codegen after schema/document changes — both steps required) · `.agents/instructions/backend.instructions.md` ("GraphQL Schema Generation" — both `generate:gqlSchema` AND `codegen` required)

## Phase 9 — Seeds

- [ ] **T9.1** `backend/db/seeds/lib/billing-factory.ts:41` — `DEFAULT_INVOICE_CURRENCY = CurrencyCode.USD` (+ import).
- [ ] **T9.2** `backend/db/seeds/seed-teacher-payments.ts:42` — replace inline `"USD"` with `DEFAULT_INVOICE_CURRENCY`.
- [ ] **T9.3** `backend/db/seeds/seed-currency-hedges.ts:8-10` — `CurrencyCode.USD / EGP / SAR` (+ import).
- [ ] **T9.4** `backend/db/seeds/seed-currency-exchange-rates.ts` — swap pair source array to `CurrencyCode` tuples; insert flow via `CurrencyExchangeRateInsertType`.
- [ ] **T9.5** `backend/db/seeds/seed-currency-exchange-audit-logs.ts` — verify still compiles (no literal changes).
- [ ] **T9.6** Re-run `bun db seed` after Phase 3 if it failed before — now it should pass.

_Rules (read before editing):_ `AGENTS.md` (root) · `backend/AGENTS.md` (Seeds section) · `.agents/instructions/backend.instructions.md` ("Seeds (CRITICAL)" — one `seedOrGet` per table in a dedicated file; idempotent via `onConflictDoUpdate`/`onConflictDoNothing`; match PG enum values EXACTLY (`CurrencyCode.USD === "USD"`); check constraints by reading `backend/db/schema/*.ts`; run schema push/cleanGenerate BEFORE `bun db seed` after schema change; return seeded entities downstream; helpers over ~70-80 lines extracted; never `any`/inline types)

## Phase 10 — Frontend GraphQL documents

- [ ] **T10.1** `frontend/graphql/sharedDocuments/billing-management.documents.ts:13` — `$currency: String!` → `$currency: CurrencyCode!`.
- [ ] **T10.2** Verify (no edit) `parent-onboarding.documents.ts`, `billing-alerts.documents.ts`, `parent-billing-history.documents.ts`, `parent-profile.documents.ts`, `user-billing-profile.documents.ts`, `staff-profile.documents.ts`, `profile.documents.ts`, `teacher-portal.documents.ts` — all unchanged; field selections auto-typed via codegen.
- [ ] **T10.3** Verify `frontend/graphql/sharedDocuments/profile.documents.test.ts:55` (`expect(mutationSource).toContain("currency")`) still passes — no edit.

_Rules (read before editing):_ `AGENTS.md` (root) · `frontend/graphql/sharedDocuments/AGENTS.md` (one file per domain; import `gql` + `TypedDocumentNode` from `"@apollo/client"` NEVER `"@apollo/client/core"`; naming `{entityName}QueryDocument`/`{entityName}MutationDocument` → `TypedDocumentNode<Operations.X, Types.Y>`; **`id` field on EVERY object type in selection sets** for Apollo cache normalization; NO `useLazyQuery`; codegen after any document change) · `frontend/graphql/AGENTS.md` (Type Safety + Document Organization — all ops strongly typed via codegen; never custom inline type literals) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL — import `gql`+`TypedDocumentNode` from `"@apollo/client"`, hooks from `"@apollo/client/react"`; import TYPES from `graphql-types.ts` NOT `operations.ts`) · `frontend/AGENTS.md` (Apollo hooks rule)

## Phase 11 — Frontend Zod schemas

- [ ] **T11.1** `frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema.ts:48` — `z.nativeEnum(CurrencyCode).refine(v => !!v, { message: validationLabels.currencyRequired })` (add `CurrencyCode` import from `@/frontend/graphql/generated/gql/graphql-types`).
- [ ] **T11.2** `frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema.ts:26` — `z.nativeEnum(CurrencyCode).refine(...)` triggering `currencyRequired`.
- [ ] **T11.3** `frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema.ts:17` — `z.nativeEnum(CurrencyCode).optional()`.
- [ ] **T11.4** `frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema.ts:23` — `z.nativeEnum(CurrencyCode).refine(...)`.
- [ ] **T11.5** `frontend/views/dashboard/profile/teacher/teacherProfileFormTypes.ts:28, 52` — `z.nativeEnum(CurrencyCode).optional()` + `readonly rateCurrency?: CurrencyCode | null`.
- [ ] **T11.6** `frontend/views/dashboard/profile/parent/parentProfileFormTypes.ts:23, 49` — `z.nativeEnum(CurrencyCode).optional()` + `readonly currency?: CurrencyCode | null`.
- [ ] **T11.7** Per-file `tsgo` → biome → lint-queue on touched schemas.

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop) · `frontend/views/AGENTS.md` (form/view types follow domain structure) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL — `graphql-types.ts` is canonical for entity types, NOT `operations.ts`; NEVER inline type literals — always use codegen types; `CurrencyCode` from `@/frontend/graphql/generated/gql/graphql-types`) · `frontend/AGENTS.md` (Zustand-stores + type-consumers rule — if schema/FE misalign, fix the schema or query, never redefine types locally)

## Phase 12 — Frontend form/view types

- [ ] **T12.1** `frontend/views/dashboard/teachers/profile/types.ts:14` — `readonly currency: CurrencyCode;`.
- [ ] **T12.2** `frontend/views/dashboard/parent/types/profile.ts:37` — `readonly currency: CurrencyCode;`.
- [ ] **T12.3** Per-file verification.

_Rules (read before editing):_ same as Phase 11 — `frontend/views/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (`graphql-types.ts` canonical) + `frontend/AGENTS.md` (no manual type redefinitions).

## Phase 13 — Frontend UI wiring

- [ ] **T13.1** `frontend/views/dashboard/teachers/onboarding/components/SalaryDetailsSection.tsx:69-75` — replace `<Select>` + 5×`<MenuItem>` with `<CurrencySelect>` bound to `rateCurrency` form value.
- [ ] **T13.2** `frontend/views/dashboard/teachers/profile/components/SalaryDetailsSection.tsx:54-58` — replace 3-item `<Select>` with `<CurrencySelect>`.
- [ ] **T13.3** `frontend/views/dashboard/admin/parents/onboarding/FeesContractSection.tsx:118-124` — replace 4-item `<Select>` with `<CurrencySelect>`.
- [ ] **T13.4** `frontend/views/dashboard/profile/parent/sections/BillingSection.tsx:40` — replace raw `<TextField>` with `<CurrencySelect>`. Optionally upgrade line `70` display to `<CurrencyDisplay>`.
- [ ] **T13.5** `frontend/views/dashboard/profile/teacher/sections/CompensationSection.tsx:44, 62` — replace raw `<TextField>` with `<CurrencySelect>`; `"USD"` → `CurrencyCode.USD`.
- [ ] **T13.6** `frontend/views/dashboard/teachers/onboarding/TeacherOnboardingView.tsx:115` — `rateCurrency: "USD"` → `CurrencyCode.USD`.
- [ ] **T13.7** `frontend/views/dashboard/teachers/profile/TeacherProfileContainer.tsx:80` — `?? "USD"` → `?? CurrencyCode.USD`.
- [ ] **T13.8** `frontend/views/dashboard/teachers/own-profile/TeacherOwnProfileContainer.tsx:57` — same.
- [ ] **T13.9** `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer.tsx:33` — `currency: "USD"` → `CurrencyCode.USD`.
- [ ] **T13.10** `frontend/views/dashboard/parent/profile/edit/ParentProfileEditContainer.tsx:48, 77` — `?? "USD"` → `?? CurrencyCode.USD`.
- [ ] **T13.11** `frontend/views/dashboard/parent/profile/ParentProfileContainer.tsx:69, 111` — type `currency: CurrencyCode | null`; `?? ""` → `?? CurrencyCode.USD`.
- [ ] **T13.12** `frontend/views/dashboard/parent/profile/ParentProfileDetails.tsx:149` — value type is now `CurrencyCode`. Use `<CurrencyDisplay code={parent.currency} showLabel showCode />` if `DetailItem` accepts a ReactNode; otherwise `.toString()` / cast.
- [ ] **T13.13** `frontend/views/dashboard/profile/parent/ParentProfileContainer.tsx:56` — `formData.currency || null` declared type narrows; verify boolean-coercion of enum works (it doesn't on `0/NONE`-valued enums — fine here, all codes are truthy strings).
- [ ] **T13.14** `frontend/views/dashboard/profile/parent/ParentProfileEditForm.tsx:53, 72` — `currency: ""` default → `null` (or `CurrencyCode.USD`) based on FormProvider behavior with an enum.
- [ ] **T13.15** `frontend/views/dashboard/profile/teacher/TeacherAdminEditForm.tsx:51, 72` — same for `rateCurrency`.
- [ ] **T13.16** `frontend/views/dashboard/billing/manual/ManualInvoiceContainer.tsx:100` — replace hardcoded `currency: "USD"` mutation arg with react-state from a new `<CurrencySelect>` placed in the form.
- [ ] **T13.17** `frontend/views/dashboard/billing/manual/ManualInvoiceDesktopView.tsx:85` — `currency="USD"` prop → state value (drill from parent or pull from `ManualInvoiceDraft`).
- [ ] **T13.18** `frontend/views/dashboard/billing/manual/ManualInvoiceMobileView.tsx:68` — same.
- [ ] **T13.19** `frontend/views/dashboard/billing/manual/components/ManualInvoiceFeeField.tsx:48` — replace literal `AED` adornment with `<CurrencyDisplay code={draftCurrency} showCode showSymbol />` or `getCurrencySymbol(draftCurrency)`.
- [ ] **T13.20** `frontend/views/dashboard/admin/billing/AdminBillingContainer.tsx:47-49, 163, 175, 178` — `formatCurrency` defaults `"USD"` → `CurrencyCode.USD`.
- [ ] **T13.21** `frontend/views/dashboard/billing/ParentBillingContainer.tsx:26-28, 106, 116, 117` — same.
- [ ] **T13.22** `frontend/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx:129, 130` — same.
- [ ] **T13.23** `frontend/views/dashboard/reports/components/PerformanceLedgerCard.tsx:28, 156, 159` — `CurrencyCode.EGP / USD` literals.
- [ ] **T13.24** `frontend/views/dashboard/reports/components/ReportsDataGrid.tsx:45, 151, 163` — same.
- [ ] **T13.25** `frontend/views/dashboard/reports/components/ReportsTotalsRow.tsx:15, 23` — same.
- [ ] **T13.26** `frontend/views/dashboard/reports/ReportsContainer.tsx:355-357` — KEEP the ICU label strings `egpLabel: "EGP"`, `usdLabel: "USD"` as-is (i18n boundary).
- [ ] **T13.27** `frontend/views/dashboard/components/navbar/UnpaidInvoicesSection.tsx:73` — `item.currency` now a `CurrencyCode`; `${...} ${item.currency}`-interpolation still works (TS converts enum member to its string value in template literals). Optional upgrade to `<CurrencyDisplay code showLabel={false} showCode />`.
- [ ] **T13.28** CLEANUP: drop any dead `getCurrencyOptionLabel` re-export from `CurrencyAutocomplete.tsx` / `CurrencyOptionRow.tsx` that was left over from the foundation step (linter flagged "fast refresh only works when a file only exports components").

_Rules (read before editing):_ `AGENTS.md` (root — per-file verification loop, fix-or-report cross-file rule) · `frontend/views/AGENTS.md` (**functional components only**; client data via Apollo `useQuery` with TypedDocumentNodes; no `useLazyQuery`; domain structure; `<RequirePermission>` for permission-gated) · `frontend/AGENTS.md` (MUI v9 — **all style props in `sx`**; React 19 — no `FormEvent`; Theme & Styling — no hardcoded colors, theme callback; Apollo hooks from `"@apollo/client/react"` not `"@apollo/client"`; NO `useLazyQuery`; `id` on all selection sets; i18n via `useTranslations`; logging via `@/frontend/utils/logger` NEVER `console.*`) · `.agents/instructions/frontend.instructions.md` (**MUI v9 breaking changes** — `AutocompleteRenderInputParams.inputProps` removed → `params.slotProps.htmlInput`; `Typography component` prop invalid; icons `*Outline` → `*Outlined`; Apollo & GraphQL — `gql`+`TypedDocumentNode` from `"@apollo/client"`, hooks from `"@apollo/client/react"`, ENTITY types from `graphql-types.ts`; Context/Provider/hook in separate files for Fast Refresh; no nested ternaries)

## Phase 14 — `users.displayCurrency` (Decision 3A part 2) — schema → types → repo → service → Pothos → documents → store → UI → seed

- [ ] **T14.1** `backend/db/schema/users.ts` (after line 33) — add `displayCurrency: currencyCodeEnum("display_currency").$type<CurrencyCode>(),` (nullable, no default). NO extra CHECK.
- [ ] **T14.2** `backend/types/users/user.types.ts:17-30` — `Omit` adds `| "displayCurrency"`; intersection adds `displayCurrency: CurrencyCode | null;` (mirrors `timezone: IanaTimezone`). Import `CurrencyCode` from `@/backend/enum`.
- [ ] **T14.3** `backend/utils/auth.utils.ts:14-28` — in `toUserReturnType` return add `displayCurrency: user.displayCurrency as CurrencyCode | null,`.
- [ ] **T14.4** `backend/db/repo/users/user.repository.ts:49-65` — add `users.displayCurrency` to `findSafeById` select list.
- [ ] **T14.5** `backend/db/repo/users/user.repository.ts:236-252` — add `users.displayCurrency` to `updateProfileFields` returning list.
- [ ] **T14.6** `backend/db/repo/users/user.repository.ts` after `261-287` — NEW `updateDisplayCurrency(userId, displayCurrency: CurrencyCode, tx?, locale?)` mirroring `updateTimezone` exactly. Export from repo barrel.
- [ ] **T14.7** `backend/services/profile/profile.service.ts:78` — `updateProfileFields` dispatcher accepts `displayCurrency?: CurrencyCode | null`; when present calls `UserRepository.updateDisplayCurrency(userId, displayCurrency, tx, locale)`.
- [ ] **T14.8** `backend/graphql/pothos/auth/user.pothos.ts:17-50` — add `displayCurrency: t.expose("displayCurrency", { type: CurrencyCodePothosObject, nullable: true })`.
- [ ] **T14.9** `backend/graphql/pothos/profile/profile.pothos.ts:114-122` — `CoreUserProfileFieldsInput` adds `displayCurrency: t.field({ type: CurrencyCodePothosObject, required: false })`.
- [ ] **T14.10** Regenerate: `bun run generate:gqlSchema && bun codegen` — surfaces `displayCurrency: Maybe<CurrencyCode>` on `User`.
- [ ] **T14.11** `frontend/graphql/sharedDocuments/{user,profile,auth}.documents.ts` — add `displayCurrency` to user query selection; add to `UpdateOwnProfileInput`/`UpdateUserProfileInput.core`. Always include `id`.
- [ ] **T14.12** `frontend/stores/userStore.ts:4-40` — `UserState` adds `displayCurrency: CurrencyCode | null`; initialize `null`; in `setUser` set `displayCurrency: user?.displayCurrency ?? null`. Mock store mirrors the field.
- [ ] **T14.13** `shared/messages/types/profile.ts:59, 109` (and `staff.fields` block) — add `readonly displayCurrency: string;`.
- [ ] **T14.14** `shared/messages/ar/profile.ts:61, 111` — add `displayCurrency: "عملة العرض",`.
- [ ] **T14.15** `shared/messages/en.ts:265, 315` (+ staff sibling) — add `displayCurrency: "Display Currency",`.
- [ ] **T14.16** `frontend/views/dashboard/profile/teacher/sections/AccountSection.tsx:27-46` + view branch — add `<Controller name="displayCurrency">` rendering `<CurrencySelect>` in edit; `<CurrencyDisplay code showLabel showSymbol />` in view.
- [ ] **T14.17** `frontend/views/dashboard/profile/parent/sections/AccountSection.tsx` — same pattern.
- [ ] **T14.18** `frontend/views/dashboard/profile/staff/sections/AccountSection.tsx:27-47` + view branch — same; staff users also have a `displayCurrency` (role-agnostic). Add a small view-mode `<CurrencyDisplay>` row.
- [ ] **T14.19** `frontend/views/dashboard/profile/{teacher,parent,staff}/.../schemas/*.ts` — add `displayCurrency: z.nativeEnum(CurrencyCode).nullable().optional()`.
- [ ] **T14.20** `backend/db/seeds/seed-users.ts` (or factory) — add `displayCurrency: null` default. NO currency bias.
- [ ] **T14.21** Per-file verify: `tsgo` → `biome:check` → lint-queue-client on each touched file.
- [ ] **T14.22** `bun run scripts/run-test/run-test.ts backend/db/test/repo/user.repository.test.ts` — add `updateDisplayCurrency` round-trip test.
- [ ] **T14.23** `bun test frontend/graphql/test/profile.documents.test.ts` — add `displayCurrency` mutation assertion.

**CROSS-FILE DEPENDENCIES (orchestrator-coordinated):** `User` GraphQL field (T14.8) BEFORE frontend documents (T14.11). Store change (T14.12) BEFORE Phase 15 UI swap reads `useUserStore.displayCurrency`. Staff `AccountSection` (T14.18) needs a NEW view-mode `<CurrencyDisplay>` row.

_Rules (read before editing):_ `AGENTS.md` (root — lint queue + per-file verification loop + fix-or-report cross-file rule) · `backend/AGENTS.md` (6-layer data flow) · `backend/types/AGENTS.md` (`UserReturnType` re-applies the enum — mirrors `timezone: IanaTimezone`) · `.agents/instructions/backend.instructions.md` (Type Definition Pattern + Service Layer + Repository Layer) · `backend/db/repo/AGENTS.md` (data access only) · `backend/services/AGENTS.md` (domain-driven; pass `tx`; SSR-safe) · `backend/graphql/AGENTS.md` (`nullable: true`; resolvers delegate to services; `id` on every object) · `shared/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (i18n message types) · `frontend/stores/AGENTS.md` (Zustand + mock store mirror) · `frontend/views/AGENTS.md` · `frontend/AGENTS.md` (MUI v9; Apollo hooks from `"@apollo/client/react"`; `id` on selection sets) · `tests.instructions.md` (`runInRollback`; pass `tx`; no `expect(...).rejects.toThrow()` inside rollback)

## Phase 15 — FX-convert-on-render read path (Decision 3A part 3 + stale-FX rule) — repo fork → service → Pothos `DisplayAmount` → frontend lib → UI swap

- [ ] **T15.1** `backend/db/repo/billing/billing.repository.ts` after `102-134` — NEW `getLatestExchangeRateForDisplay(from: CurrencyCode, to: CurrencyCode, tx?, locale?) → Promise<{ rate: string | null; stale: boolean }>`. Soft returns `{ rate: null, stale: true }` on not-found OR stale; `{ rate: latest.rate, stale: false }` when fresh. DOES NOT throw. JSDoc: financial insert path MUST use the throwing `getLatestExchangeRate`.
- [ ] **T15.2** `backend/types/billing.types.ts` — NEW `DisplayAmountReturnType = { id: string; amount: string | null; currency: CurrencyCode; stale: boolean }`.
- [ ] **T15.3** `backend/services/billing/fx-display.service.ts` NEW — `convertForDisplay(lockedAmount, lockedCurrency, displayCurrency, tx?, locale?) → Promise<DisplayAmountReturnType>`. (a) identity `locked === display`; (b) direct pair via soft repo variant; (c) USD-hub transitive `locked → USD → display`; (d) `{ amount: null, stale: true }` if both legs fail. SSR-safe; no GraphQL ctx; pass `tx` + `locale?`.
- [ ] **T15.4** `backend/graphql/pothos/billing/fx-display.pothos.ts` NEW — `DisplayAmountPothosObject = gqlSchemaBuilder.objectRef<DisplayAmountReturnType>("DisplayAmount").implement({ fields: t => ({ id: t.exposeID("id"), amount: t.exposeString("amount", { nullable: true }), currency: t.expose("currency", { type: CurrencyCodePothosObject }), stale: t.boolean({ resolve: parent => parent.stale }) }) })`.
- [ ] **T15.5** Money-bearing Pothos objects (`billing-history.pothos.ts`, `teacher-portal.pothos.ts`, `parent-profile.pothos.ts` — verify exact files) — add `displayAmount: t.field({ type: DisplayAmountPothosObject, nullable: true, resolve: async (parent, _args, ctx) => { const displayCurrency = ctx.user?.displayCurrency; if (!displayCurrency) return null; return FxDisplayService.convertForDisplay(parent.amount/parent.hourlyRate, parent.currency/parent.rateCurrency, displayCurrency, undefined, ctx.locale); } })`. Synthetic `id` = `displayAmount:<entityId>:<displayCurrency>`.
- [ ] **T15.6** Regenerate: `bun run generate:gqlSchema && bun codegen`.
- [ ] **T15.7** `frontend/graphql/sharedDocuments/{billing-management,teacher-portal,parent-profile}.documents.ts` — add `displayAmount { id amount currency stale }` to money-object selections.
- [ ] **T15.8** `frontend/lib/currency.ts:14-19` (`CurrencyOption`) + `28-60` (catalog rows) — add `readonly decimals: number;`; populate ISO 4217 minor-unit count for all 32 codes (most = 2; BHD/IQD/JOD/KWD/LYD/OMR/TND = 3; JPY = 0).
- [ ] **T15.9** `frontend/lib/currency.ts` after `getCurrencySymbol` (~`74`) — NEW `getCurrencyDecimals(code: CurrencyCode | string): number` (fallback `2`).
- [ ] **T15.10** `frontend/lib/currency.ts` (or new `frontend/lib/fx-render.ts`) — NEW `formatCurrencyForDisplay(amount, lockedCurrency, displayCurrency, fxRate: number | null, stale: boolean, locale?): string`. (a) `displayCurrency == null || fxRate == null || stale || displayCurrency === lockedCurrency` → locked-only via `Intl.NumberFormat` with `getCurrencyDecimals`; (b) else → i18n `convertedAmount` template with `maximumFractionDigits: 2` on the converted value.
- [ ] **T15.11** Frontend `formatCurrency` swap — `AdminBillingContainer.tsx:47-49, 163, 175, 178` · `ParentBillingContainer.tsx:26-28, 106, 116, 117` · `UserBillingProfileContainer.tsx:23-26, 129, 130` · `PerformanceLedgerCard.tsx:28, 156, 159` · `ReportsDataGrid.tsx:45, 151, 163` · `ReportsTotalsRow.tsx:15, 23`. Replace each local `formatCurrency` with `formatCurrencyForDisplay` reading `useUserStore(displayCurrency)` + the `displayAmount` GraphQL field. Delete per-file dedupes.
- [ ] **T15.12** Salary/fee display swap — `CompensationSection.tsx:44, 62` · `SalaryDetailsSection.tsx` (onboarding + profile) · `BillingSection.tsx:65, 70` (parent fee). Replace `{amount} {currency}` interpolation with `formatCurrencyForDisplay`.
- [ ] **T15.13** `shared/messages/types/profile.ts` (teacher block) · `shared/messages/types/dashboard/teachers/own-profile.ts` · `shared/messages/types/dashboard/teachers/profile.ts` — add `readonly convertedAmount: string;`.
- [ ] **T15.14** `shared/messages/ar/profile.ts:50` · `shared/messages/en.ts:254, 2456` · `shared/messages/ar/dashboard/teachers/own-profile.ts:11` — add `convertedAmount: "{lockedAmount} {lockedCurrency} (≈ {convertedApprox} {displayCurrency})"` (AR with "تقريباً").
- [ ] **T15.15** `shared/messages/types/errors/main.ts:24-25` · `shared/messages/ar/errors.ts:15-16` · `shared/messages/en/errors.ts:15-16` — add NEW `displayCurrencyFallback: "Rate unavailable — showing {lockedAmount} {lockedCurrency}"` (AR: `"السعر غير متوفر — عرض {lockedAmount} {lockedCurrency}"`). Existing throw keys stay intact.
- [ ] **T15.16** Orchestrator verifies `EXCHANGE_PAIRS` cardinality in `backend/db/seeds/lib` (cursorignored) before Phase 15 UI swap — USD-hub transitive path handles missing direct pairs.
- [ ] **T15.17** Per-file verify: `tsgo` → `biome:check` → lint-queue-client. Then `bun run scripts/run-test/run-test.ts backend/services/billing/fx-display.service.test.ts` (new test). Then `bun test frontend/graphql/test/billing-management.documents.test.ts` (if exists).

**CROSS-FILE DEPENDENCIES (orchestrator-coordinated — NOT per-file sub-agent fixes):**
1. Reports currency-pair columns (`ReportsDataGrid.tsx:163`, `ReportsTotalsRow.tsx:23`, `PerformanceLedgerCard.tsx:156` + `backend/db/repo/books/report.repository.ts` + `backend/services/report/report.service.ts`) — `paidEgp`/`paidUsd` hardcoded columns + backing resolver MUST move to `{ amount, currency }` rows + `displayAmount` resolver BEFORE the frontend reports can honor `displayCurrency`. Orchestrator coordinates a wave across repo → service → Pothos → documents → UI; blocks T15.11's reports portion.
2. `EXCHANGE_PAIRS` cardinality (cursorignored) — orchestrator verifies before Phase 15 starts.
3. `shared/` residency of currency metadata — default: keep `decimals` on `frontend/lib/currency.ts` only; backend `fx-display.service.ts` trusts `Intl.NumberFormat` defaults.

_Rules (read before editing):_ `AGENTS.md` (root — lint queue + per-file verification loop + fix-or-report cross-file rule) · `backend/AGENTS.md` (6-layer data flow; FX read path = repo → service → Pothos resolver) · `.agents/instructions/backend.instructions.md` (Repository Layer — soft FX variant returns `null` not throw; Service Layer — `fx-display.service.ts` is the conversion business-logic hub) · `backend/db/repo/AGENTS.md` (data access only; soft variant returns `null`; JSDoc notes financial path MUST use throw-variant) · `backend/types/AGENTS.md` (NEW `DisplayAmountReturnType`; `id` field for Apollo cache normalization) · `backend/services/AGENTS.md` (domain-driven; `fx-display.service.ts` in `billing/`; SSR-safe) · `backend/graphql/AGENTS.md` (resolvers delegate to `FxDisplayService`; `nullable: true`; `id` on `DisplayAmountPothosObject`; propagate `ctx.locale`) · `shared/AGENTS.md` (currency metadata stays on `frontend/lib/currency.ts` for v1) · `.agents/instructions/frontend.instructions.md` (Apollo & GraphQL — `id` on `displayAmount` selection; no `useLazyQuery`) · `frontend/AGENTS.md` (MUI v9; theme callback; `useTranslations`; logging via `@/frontend/utils/logger`) · `frontend/views/AGENTS.md` (functional components; 5 `formatCurrency` swap files use Apollo `useQuery` already) · `tests.instructions.md` (NEW `fx-display.service.test.ts` — `runInRollback`; pass `tx`; assert soft returns not throws; cover 4 cases: identity, live, stale, USD-hub transitive)

## Phase 16 — Backend repo + logic tests

- [ ] **T16.1** `backend/db/test/repo/billing.repository.test.ts` — `currency: "USD"` literals → `CurrencyCode.USD` (or rely on factory constant).
- [ ] **T16.2** `backend/db/test/repo/teacher.repository.test.ts` — `rateCurrency` literals.
- [ ] **T16.3** `backend/db/test/repo/parent.repository.test.ts` — `currency` literals.
- [ ] **T16.4** `backend/db/test/repo/user.repository.test.ts` — NEW `updateDisplayCurrency` round-trip: create user → set `CurrencyCode.Usd` → assert returning row → update to `CurrencyCode.Egp` → assert. `runInRollback`; pass `tx`.
- [ ] **T16.5** `backend/db/test/repo/report.repository.test.ts` — verify still passes (no literal changes needed if SQL CASE kept as raw string).
- [ ] **T16.6** `backend/db/test/logic/billing-safeguards.test.ts` — `fromCurrency:"EGP"` / `toCurrency:"USD"` literals → `CurrencyCode.EGP/USD` (lines ~52-53, 89, 113, 117, 133).
- [ ] **T16.7** `backend/db/test/logic/exchange-rate.test.ts` — `fromCurrency:"USD"` (line 16, 25).
- [ ] **T16.8** `backend/services/billing/fx-display.service.test.ts` — NEW — 4 cases: identity (`display === locked`), live direct pair, stale pair (older than 24h), USD-hub transitive (`locked → USD → display`). `runInRollback`; pass `tx`; assert soft returns, NOT throws.
- [ ] **T16.9** `backend/db/test/logic/class_instances_security.test.ts` — audit FX/currency snapshot assertions.
- [ ] **T16.10** `backend/db/test/logic/class_rescheduling.test.ts` — same.
- [ ] **T16.11** `backend/db/test/logic/concurrency.test.ts` — same.
- [ ] **T16.12** `backend/db/test/logic/invoice-restriction.test.ts` — same.
- [ ] **T16.13** `backend/db/test/logic/payment-idempotency.test.ts` — `currency` literal.
- [ ] **T16.14** `backend/db/test/logic/session-scalability.test.ts` — same.
- [ ] **T16.15** `backend/db/test/logic/teacher_banking_verification.test.ts` — `teacher_payments.currency` literal.
- [ ] **T16.16** `backend/db/test/logic/audit-trail.test.ts` — FX audit assertions.
- [ ] **T16.17** Use `bun run scripts/run-test/run-test.ts <test-path>` — never raw `bun test` for db tests.
- [ ] **T16.18** Preserve `runInRollback`; no `expect(...).rejects.toThrow()` inside rollback (the new FX test asserts soft returns, not throws).

_Rules (read before editing):_ `AGENTS.md` (root — DB test rules: `runInRollback` ALWAYS; pass `tx` to ALL repo calls; NEVER `expect(...).rejects.toThrow()` inside rollback — use try/catch `expectRepoError` pattern; run via `bun run scripts/run-test/run-test.ts` NOT raw `bun test`; never query seed data — create via `entity-setup.ts` helpers) · `tests.instructions.md` (**Database Tests - Transaction Safety CRITICAL** — mixing `tx` and `db` causes deadlocks; **tx Parameter Position varies per method** — read repo signature before calling; **Entity Setup Helpers signatures VARY** — read `entity-setup.ts` first e.g. `setupStudent(tx, userOverrides, parentOverrides, studentOverrides)` 4 args; never assume table columns; assert `.toContain()` on translated message substring NOT raw key; `bun:test` imports not Jest/Vitest; no `any` use `Partial<...>`; `testLogger` not `console.*`; repo tests = 100% coverage; GraphQL integration tests use `testClient.query()` NEVER raw `fetch`; NEVER import backend repos/Drizzle/services in GraphQL tests; `setupTestServerLifecycle()` at root of `describe`; Apollo `errorPolicy: "all"` so assert `result.error` not throw; `authenticatedRequest` helper; optional chaining `?.`) · `backend/db/repo/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Repository Layer — applies since these tests exercise repos)

## Phase 17 — Backend service tests

- [ ] **T17.1** `backend/services/profile/profile.service.test.ts:34, 49, 74` — `currency: "SAR"` → `CurrencyCode.SAR`; `currency: undefined` unchanged. NEW — `displayCurrency` set/get round-trip via `updateProfileFields({ displayCurrency: CurrencyCode.Usd })`.
- [ ] **T17.2** `backend/services/profile/parent-profile.service.test.ts:15, 29, 47, 62` — `CurrencyCode.SAR`; verify `formData.currency || null` branch.
- [ ] **T17.3** `backend/services/profile/teacher-profile.service.test.ts:25` — `rateCurrency: CurrencyCode.USD`.

_Rules (read before editing):_ `tests.instructions.md` (Coverage & Structure — `bun:test` imports not Jest/Vitest; no `any`; `@/backend/types` types; `testLogger` not `console.*`; Quality section — `bun tsgo` + lint via queue client after test changes, NEVER raw `bun lint`) · `.agents/instructions/backend.instructions.md` (Service Layer + Type Definition Pattern — services import from `@/backend/types`) · `backend/services/AGENTS.md`

## Phase 18 — Story fixtures

- [ ] **T18.1** `frontend/views/dashboard/profile/teacher/TeacherProfileView.stories.tsx:19, 40` — `rateCurrency: CurrencyCode.USD`; NEW story variant with `displayCurrency: CurrencyCode.Usd` + live `displayAmount` showing the converted `(≈ X USD)` badge.
- [ ] **T18.2** `frontend/views/dashboard/profile/teacher/TeacherProfileEditForm.stories.tsx:26` — same.
- [ ] **T18.3** `frontend/views/dashboard/profile/parent/ParentProfileView.stories.tsx:42` — `currency: CurrencyCode.SAR`; NEW story variant with stale `displayAmount` (`stale: true`) showing the locked-only fallback.
- [ ] **T18.4** `frontend/views/dashboard/profile/parent/ParentProfileEditForm.stories.tsx:24` — same.
- [ ] **T18.5** `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingView.stories.tsx:21` — `currency: CurrencyCode.USD`.
- [ ] **T18.6** `frontend/views/dashboard/teachers/profile/TeacherProfileView.stories.tsx:18` — `currency: CurrencyCode.USD`.
- [ ] **T18.7** NEW story file for `formatCurrencyForDisplay` — covers: live FX, stale FX fallback, identity (`display === locked`), missing `displayCurrency` (`null`).

_Rules (read before editing):_ `frontend/views/AGENTS.md` (Storybook Best Practices — `<RequirePermission>` defaults to admin via global `StoryWrapper`; ALL stories auto-wrapped in `NextIntlClientProvider`; real `userStore` aliased to `mockUserStore` — mirrors the NEW `displayCurrency: CurrencyCode.Usd | null`; decorators in metadata `decorators` array, NOT wrapping component in story function) · `frontend/AGENTS.md` (Storybook section — same rules, repeated) · `frontend/stores/AGENTS.md` (mock store mirrors new `displayCurrency`) · `.agents/instructions/frontend.instructions.md` (Storybook — `useUserStore.setState()` for specific perms; auto `NextIntlClientProvider`; `mockUserStore`; decorators in metadata)

## Phase 19 — Update parent plan

- [ ] **T19.1** `.ai/plans/user-entity-enhancement/ANALYSIS.md` §2.3 Currency — append "**Status: ENUM + TYPING + DISPLAY-CURRENCY + FX-READ-PATH LANDED** in `.ai/plans/currency/`. FX *ingestion* (fetch source, cron cadence) still deferred to a payment-methods wave; everything else in Decision 3A is landed."
- [ ] **T19.2** `.ai/plans/user-entity-enhancement/ANALYSIS.md` §7.1 — replace the "DECIDED 3A" callout with a "✅ Landed" status + link to `.ai/plans/currency/spec.md`.
- [ ] **T19.3** `.ai/plans/user-entity-enhancement/ANALYSIS.md` §12 Phases row 1 — strike "CurrencyCode enum" AND add "users.displayCurrency column" (both landed in Phases 14-15).
- [ ] **T19.4** Add a "Landed slices" section pointing at `.ai/plans/currency/` (full slices: typing + displayCurrency + FX read path) so future waves know not to re-do any of it.

_Rules (read before editing):_ `AGENTS.md` (AI Agent Communication — "NEVER create summary markdown files" but **exception**: documentation files that are part of the project structure; `ANALYSIS.md` qualifies; do NOT create NEW summary files like SUMMARY.md / CHANGES.md) — this phase only edits an existing plan doc

## Phase 20 — Quality gate

- [ ] **T20.1** Confirm the lint queue server is running on `http://localhost:4777`.
- [ ] **T20.2** Final per-file verification via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` for every touched file (or batch via orchestrator).
- [ ] **T20.3** Run `bun quality-gate` (tsgo → biome → lint → codescene → sonar-results using existing `.scannerwork/sonar-result.json`).
- [ ] **T20.4** If SONAR_RESULTS fails: use `bun scripts/sonar-manager.ts list-duplicates` / `delete --file <path>` — **never trigger a new scan.**

_Rules (read before editing):_ `AGENTS.md` (root — **Lint Queue Server**, **Quality Gate Workflow**, **SonarQube Issue Management**, **Sonar-Scan Prohibition**: sub-agents NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts` scan-trigger; only orchestrator handles SONAR stages; read-only `list-duplicates` / `list-files` allowed for orchestrator only; Resolve DUPLICATIONS first; mandatory priority) · `.agents/skills/quality-gate/SKILL.md` + `.agents/skills/quality-loop/SKILL.md` (run quality gate loop until clean)

## Phase 21 — Final verification checklist

- [ ] **T21.1** `bun tsgo -b --noEmit` — 0 currency-related errors (incl. `users.displayCurrency`, `DisplayAmount`, `fx-display.service.ts`).
- [ ] **T21.2** `bun biome:check` — all touched files clean.
- [ ] **T21.3** Lint queue — 0 errors on touched files.
- [ ] **T21.4** `bun db cleanGenerate` — fresh migration set with `currency_code` enum AND a new nullable `display_currency` column on `users`.
- [ ] **T21.5** `bun db seed` — seeds run (factory + hedges + FX pairs + `seed-users.displayCurrency = null`).
- [ ] **T21.6** `bun run test:db` — all repo + logic tests pass (incl. new `fx-display.service.test.ts` + `updateDisplayCurrency` round-trip).
- [ ] **T21.7** `bun run test:graphql` — GraphQL integration tests pass (incl. new `displayCurrency` mutation assertion).
- [ ] **T21.8** `bun test test/ui/components/` — Storybook stories render (incl. FX live-conversion + stale-fallback stories).
- [ ] **T21.9** `bun run generate:gqlSchema && bun codegen` — surfaces `CurrencyCode` on all 12 fields + `displayCurrency` on `User` + `DisplayAmount` on money objects.
- [ ] **T21.10** `profile.documents.test.ts:55` assertion still green; new `displayCurrency` mutation assertion green.
- [ ] **T21.11** ReportsDataGrid/ReportsTotalsRow/PerformanceLedgerCard rendering with typed currency (reports currency-pair cross-file dependency resolved before this phase).
- [ ] **T21.12** Decision 3A rule 2 verified end-to-end: `users.displayCurrency = USD` + teacher locked at `50 EGP` + live FX ⇒ profile shows `50 EGP (≈ X USD)`.
- [ ] **T21.13** Decision 3A rule 5 verified end-to-end: stale FX ⇒ UI shows `50 EGP` only (no fabricated conversion); `formatCurrencyForDisplay` honors `stale: true`.
- [ ] **T21.14** `.ai/plans/user-entity-enhancement/ANALYSIS.md` updated (typing + displayCurrency + FX read path all marked landed).

---

## Summary

- **Phases:** 21 (was 19 — added Phase 14 `users.displayCurrency` + Phase 15 FX-convert-on-render read path; renumbered tail 16-21)
- **Files ≈ 123** (was 103 — added ~20 files across the new surfaces)
- **Foundation assumed already-landed:** backend enum + GraphQL enum registration + codegen + frontend lib + `CurrencySelect`/`CurrencyDisplay` + i18n. (Do NOT re-create — see top of plan.md.)
- **Scope:** FULL Decision 3A — typing locked columns (Phases 1-13) + `users.displayCurrency` (Phase 14) + FX-convert-on-render read path with stale-FX fallback (Phase 15) + `CURRENCY_CONFIG` decimals extension (T15.8-T15.9). FX *ingestion* (fetch source, cron cadence) is the ONLY currency behavior still deferred.
- **Strategy:** clean-slate via `bun db cleanGenerate` (Decision 8C).
- **Cross-file dependencies flagged for orchestrator:** (1) reports currency-pair columns → `{ amount, currency }` schema/repo/service/Pothos/Documents/UI wave; (2) `EXCHANGE_PAIRS` cardinality verification; (3) `shared/` residency of currency metadata (deferred — frontend lib stays source-of-truth for v1).
