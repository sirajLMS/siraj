# Currency Migration — Tasks

**Spec:** [`./spec.md`](./spec.md) — **Plan:** [`./plan.md`](./plan.md)
**Tracking convention:** checkboxes below map 1:1 to plan.md phases. Mark `[x]` only after the per-file verification loop (`tsgo` → `biome:check` → lint-queue) passes on every file the phase touched.
**Linting:** ALWAYS go through the lint queue server/client — NEVER run `bun lint` directly. Start the server once at the top of execution:

```bash
~/.bun/bin/bun run scripts/lint-queue-server.ts &
```

---

## Phase 1 — Backend DB enum registration

- [ ] **T1.1** Add `currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode)` to `backend/db/schema/enums.ts` (next to `countryCodeEnum`, line 36). Add `CurrencyCode` import from `@/backend/enum`.
- [ ] **T1.2** Re-export `currencyCodeEnum` from `backend/db/schema/index.ts` (verify pattern vs how `countryCodeEnum` is surfaced).
- [ ] **T1.3** Per-file verify: `tsgo` on `enums.ts` + `schema/index.ts` → biome → lint-queue.

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

## Phase 3 — `bun db cleanGenerate`

- [ ] **T3.1** Run `bun db cleanGenerate` (select action `8` if interactive; or pipe-arg).
- [ ] **T3.2** Verify the regenerated `backend/drizzle/` contains a migration with `CREATE TYPE currency_code AS ENUM (...)` + the column-type changes on the 11 columns.
- [ ] **T3.3** If one of the hand-written `backend/db/migration/*.sql` files references currency columns, fix it to enum-compatible (clean slate usually wipes+regenerates, but verify).
- ⚠️ Phase 3 seeds may fail until Phase 9 lands — re-run `bun db seed` after Phase 9.

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

## Phase 6 — Services

- [ ] **T6.1** `backend/services/billing/billing-management.service.ts:12, 15, 40-55, 57-72` — type flow for `currency`, `buildInvoiceInsertPayload`, `mapToManualInvoiceResult`.
- [ ] **T6.2** `backend/services/teacher/teacher-onboarding.service.ts:35, 82` — `rateCurrency?: CurrencyCode | null`.
- [ ] **T6.3** `backend/services/parent/parent-onboarding.service.ts:24, 36, 85, 111` — `currency?: CurrencyCode | null` + result mapping.
- [ ] **T6.4** `backend/services/parent/parent-profile.service.ts:59` — pass-through typing flows automatically (verify).
- [ ] **T6.5** `backend/services/profile/profile.service.ts:78` — broaden dispatcher input union as needed for `CurrencyCode`.
- [ ] **T6.6** `backend/services/teacher/teacher-portal.service.ts:52` — `rateCurrency: CurrencyCode | null`.
- [ ] **T6.7** `backend/services/session/class-session.service.ts:234-235` — pass-through typing (verify).
- [ ] **T6.8** Per-file `tsgo` on every touched service → biome → lint-queue.

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

## Phase 8 — Codegen + Schema

- [ ] **T8.1** Run `bun run generate:gqlSchema`.
- [ ] **T8.2** Run `bun codegen`.
- [ ] **T8.3** Verify in `frontend/graphql/generated/schema.graphql` that the 12 currency fields now read `CurrencyCode!`/`CurrencyCode` instead of `String!`/`String`.
- [ ] **T8.4** Verify in `frontend/graphql/generated/gql/graphql-types.ts` that the 12 fields now read `Maybe<CurrencyCode>`/`CurrencyCode`.
- [ ] Do NOT hand-edit generated files.

## Phase 9 — Seeds

- [ ] **T9.1** `backend/db/seeds/lib/billing-factory.ts:41` — `DEFAULT_INVOICE_CURRENCY = CurrencyCode.USD` (+ import).
- [ ] **T9.2** `backend/db/seeds/seed-teacher-payments.ts:42` — replace inline `"USD"` with `DEFAULT_INVOICE_CURRENCY`.
- [ ] **T9.3** `backend/db/seeds/seed-currency-hedges.ts:8-10` — `CurrencyCode.USD / EGP / SAR` (+ import).
- [ ] **T9.4** `backend/db/seeds/seed-currency-exchange-rates.ts` — swap pair source array to `CurrencyCode` tuples; insert flow via `CurrencyExchangeRateInsertType`.
- [ ] **T9.5** `backend/db/seeds/seed-currency-exchange-audit-logs.ts` — verify still compiles (no literal changes).
- [ ] **T9.6** Re-run `bun db seed` after Phase 3 if it failed before — now it should pass.

## Phase 10 — Frontend GraphQL documents

- [ ] **T10.1** `frontend/graphql/sharedDocuments/billing-management.documents.ts:13` — `$currency: String!` → `$currency: CurrencyCode!`.
- [ ] **T10.2** Verify (no edit) `parent-onboarding.documents.ts`, `billing-alerts.documents.ts`, `parent-billing-history.documents.ts`, `parent-profile.documents.ts`, `user-billing-profile.documents.ts`, `staff-profile.documents.ts`, `profile.documents.ts`, `teacher-portal.documents.ts` — all unchanged; field selections auto-typed via codegen.
- [ ] **T10.3** Verify `frontend/graphql/sharedDocuments/profile.documents.test.ts:55` (`expect(mutationSource).toContain("currency")`) still passes — no edit.

## Phase 11 — Frontend Zod schemas

- [ ] **T11.1** `frontend/views/dashboard/teachers/onboarding/schemas/teacherOnboardingSchema.ts:48` — `z.nativeEnum(CurrencyCode).refine(v => !!v, { message: validationLabels.currencyRequired })` (add `CurrencyCode` import from `@/frontend/graphql/generated/gql/graphql-types`).
- [ ] **T11.2** `frontend/views/dashboard/admin/parents/onboarding/schemas/parentOnboardingSchema.ts:26` — `z.nativeEnum(CurrencyCode).refine(...)` triggering `currencyRequired`.
- [ ] **T11.3** `frontend/views/dashboard/teachers/profile/schemas/teacherProfileSchema.ts:17` — `z.nativeEnum(CurrencyCode).optional()`.
- [ ] **T11.4** `frontend/views/dashboard/parent/profile/edit/parentProfileEditSchema.ts:23` — `z.nativeEnum(CurrencyCode).refine(...)`.
- [ ] **T11.5** `frontend/views/dashboard/profile/teacher/teacherProfileFormTypes.ts:28, 52` — `z.nativeEnum(CurrencyCode).optional()` + `readonly rateCurrency?: CurrencyCode | null`.
- [ ] **T11.6** `frontend/views/dashboard/profile/parent/parentProfileFormTypes.ts:23, 49` — `z.nativeEnum(CurrencyCode).optional()` + `readonly currency?: CurrencyCode | null`.
- [ ] **T11.7** Per-file `tsgo` → biome → lint-queue on touched schemas.

## Phase 12 — Frontend form/view types

- [ ] **T12.1** `frontend/views/dashboard/teachers/profile/types.ts:14` — `readonly currency: CurrencyCode;`.
- [ ] **T12.2** `frontend/views/dashboard/parent/types/profile.ts:37` — `readonly currency: CurrencyCode;`.
- [ ] **T12.3** Per-file verification.

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

## Phase 14 — Backend repo + logic tests

- [ ] **T14.1** `backend/db/test/repo/billing.repository.test.ts` — `currency: "USD"` literals → `CurrencyCode.USD` (or rely on factory constant).
- [ ] **T14.2** `backend/db/test/repo/teacher.repository.test.ts` — `rateCurrency` literals.
- [ ] **T14.3** `backend/db/test/repo/parent.repository.test.ts` — `currency` literals.
- [ ] **T14.4** `backend/db/test/repo/report.repository.test.ts` — verify still passes (no literal changes needed if SQL CASE kept as raw string).
- [ ] **T14.5** `backend/db/test/logic/billing-safeguards.test.ts` — `fromCurrency:"EGP"` / `toCurrency:"USD"` literals → `CurrencyCode.EGP/USD` (lines ~52-53, 89, 113, 117, 133).
- [ ] **T14.6** `backend/db/test/logic/exchange-rate.test.ts` — `fromCurrency:"USD"` (line 16, 25).
- [ ] **T14.7** `backend/db/test/logic/class_instances_security.test.ts` — audit FX/currency snapshot assertions.
- [ ] **T14.8** `backend/db/test/logic/class_rescheduling.test.ts` — same.
- [ ] **T14.9** `backend/db/test/logic/concurrency.test.ts` — same.
- [ ] **T14.10** `backend/db/test/logic/invoice-restriction.test.ts` — same.
- [ ] **T14.11** `backend/db/test/logic/payment-idempotency.test.ts` — `currency` literal.
- [ ] **T14.12** `backend/db/test/logic/session-scalability.test.ts` — same.
- [ ] **T14.13** `backend/db/test/logic/teacher_banking_verification.test.ts` — `teacher_payments.currency` literal.
- [ ] **T14.14** `backend/db/test/logic/audit-trail.test.ts` — FX audit assertions.
- ⚠️ Use `bun run scripts/run-test/run-test.ts <test-path>` — never raw `bun test` for db tests.
- ⚠️ Preserve `runInRollback`; no `expect(...).rejects.toThrow()` inside rollback.

## Phase 15 — Backend service tests

- [ ] **T15.1** `backend/services/profile/profile.service.test.ts:34, 49, 74` — `currency: "SAR"` → `CurrencyCode.SAR`; `currency: undefined` unchanged.
- [ ] **T15.2** `backend/services/profile/parent-profile.service.test.ts:15, 29, 47, 62` — `CurrencyCode.SAR`; verify `formData.currency || null` branch.
- [ ] **T15.3** `backend/services/profile/teacher-profile.service.test.ts:25` — `rateCurrency: CurrencyCode.USD`.

## Phase 16 — Story fixtures

- [ ] **T16.1** `frontend/views/dashboard/profile/teacher/TeacherProfileView.stories.tsx:19, 40` — `rateCurrency: CurrencyCode.USD`.
- [ ] **T16.2** `frontend/views/dashboard/profile/teacher/TeacherProfileEditForm.stories.tsx:26` — same.
- [ ] **T16.3** `frontend/views/dashboard/profile/parent/ParentProfileView.stories.tsx:42` — `currency: CurrencyCode.SAR`.
- [ ] **T16.4** `frontend/views/dashboard/profile/parent/ParentProfileEditForm.stories.tsx:24` — same.
- [ ] **T16.5** `frontend/views/dashboard/admin/parents/onboarding/ParentOnboardingView.stories.tsx:21` — `currency: CurrencyCode.USD`.
- [ ] **T16.6** `frontend/views/dashboard/teachers/profile/TeacherProfileView.stories.tsx:18` — `currency: CurrencyCode.USD`.

## Phase 17 — Update parent plan

- [ ] **T17.1** `.ai/plans/user-entity-enhancement/ANALYSIS.md` §2.3 Currency — append "**Status: ENUM + TYPING LANDED** in `.ai/plans/currency/`. FX ingestion + `users.displayCurrency` still pending."
- [ ] **T17.2** `.ai/plans/user-entity-enhancement/ANALYSIS.md` §7.1 — replace the "DECIDED 3A" callout with a "✅ Landed" status + link to `.ai/plans/currency/spec.md`.
- [ ] **T17.3** `.ai/plans/user-entity-enhancement/ANALYSIS.md` §12 Phases row 1 — strike "CurrencyCode enum" (moved to landed slice).
- [ ] **T17.4** Add a "Landed slices" section pointing at `.ai/plans/currency/`.

## Phase 18 — Quality gate

- [ ] **T18.1** Confirm the lint queue server is running on `http://localhost:4777`.
- [ ] **T18.2** Final per-file verification via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` for every touched file (or batch via orchestrator).
- [ ] **T18.3** Run `bun quality-gate` (tsgo → biome → lint → codescene → sonar-results using existing `.scannerwork/sonar-result.json`).
- [ ] **T18.4** If SONAR_RESULTS fails: use `bun scripts/sonar-manager.ts list-duplicates` / `delete --file <path>` — **never trigger a new scan.**

## Phase 19 — Final verification checklist

- [ ] **T19.1** `bun tsgo -b --noEmit` — 0 currency-related errors.
- [ ] **T19.2** `bun biome:check` — all touched files clean.
- [ ] **T19.3** Lint queue — 0 errors on touched files.
- [ ] **T19.4** `bun db cleanGenerate` — clean migration set with `currency_code` enum.
- [ ] **T19.5** `bun db seed` — seeds run.
- [ ] **T19.6** `bun run test:db` — all repo + logic tests pass.
- [ ] **T19.7** `bun run test:graphql` — GraphQL integration tests pass.
- [ ] **T19.8** `bun test test/ui/components/` — Storybook stories render.
- [ ] **T19.9** `bun run generate:gqlSchema && bun codegen` — surfaces `CurrencyCode` on all 12 fields.
- [ ] **T19.10** `profile.documents.test.ts:55` assertion still green.
- [ ] **T19.11** ReportsDataGrid/ReportsTotalsRow/PerformanceLedgerCard rendering with typed currency.
- [ ] **T19.12** `ANALYSIS.md` updated.

---

## Summary

- **Phases:** 19
- **Files ≈ 103**
- **Foundation assumed already-landed:** backend enum + GraphQL enum registration + codegen + frontend lib + `CurrencySelect`/`CurrencyDisplay` + i18n. (Do NOT re-create — see top of plan.md.)
- **Out-of-scope reminders:** no `users.displayCurrency` column; no FX rate fetching behavior change; no new payment-method tables.
- **Strategy:** clean-slate via `bun db cleanGenerate` (Decision 8C).
