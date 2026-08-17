# Wave 0 — Foundation (i18n + Schema + Types)

## Summary

Wave 0 established the i18n foundation, Zod validation schema, and form types for the billing quota UI. All 7 files pass `sub-loop.ts --lifecycle codescene` (tsgo, oxlint, biome, lint, duplicates, codescene).

## Files Modified (7)

### i18n — Billing Quota Namespace (3 files)
1. `shared/locale/types/dashboard/billing/quota.ts` — Added `statuses.PENDING`, `deleteConfirm` object (title, body, cancel, confirm), `errors.deleteFailed`, `deleteSuccess`, `notFound*` (title, message, backButton), `emptyList*` (message, cta), `insights*` labels (dateRange, kind, status, student, exportSuccess, emptyMessage), `quotaCount(count)` and `ledgerCount(count)` pluralization functions, `fields.validFrom`, `fields.periodDays*` (label, helperText, required), `fields.studentPicker*` (placeholder, noOptions, loading), `fields.validUntilAfterValidFrom`
2. `shared/locale/en/dashboard/billing/quota.ts` — English translations for all new keys
3. `shared/locale/ar/dashboard/billing/quota.ts` — Arabic translations with CLDR plural rules for quotaCount/ledgerCount (zero/one/two/few/many/other)

### i18n — Student Quota Namespace (3 files)
4. `shared/locale/types/dashboard/students/quota.ts` — Added `quotaCount(count)` pluralization, `audience.expiryWarning(days)`, `audience.quotaExhausted`, `audience.eligibleForNextClass`, `audience.notEligibleForNextClass`
5. `shared/locale/en/dashboard/students/quota.ts` — English translations
6. `shared/locale/ar/dashboard/students/quota.ts` — Arabic translations with CLDR rules for expiryWarning

### Schema + Types (2 files)
7. `frontend/common/views/dashboard/billing/quota/schemas/quotaSchema.ts` — Enhanced factory pattern `createQuotaSchema(messages)` returning zod object with `.superRefine()` for:
   - Conditional `periodDays` required when `periodType === CUSTOM`
   - Cross-field `validUntil > validFrom` validation
   - Uses `QuotaKind` enum (PACKAGE/PERIODIC only, NOT ON_DEMAND)
   - Uses `totalClasses` field (NOT `maxClasses`)
8. `frontend/common/views/dashboard/billing/quota/types/quotaForm.types.ts` (NEW) — `BillingQuotaFormState`, `BillingQuotaFormProps`, `formStateToSubmitInput()`, `quotaReturnTypeToFormState()` with type-safe enum mappers using type guards

## Verification Results

All 7 files pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`:
- tsgo: ✅ 0 errors
- oxlint: ✅ 0 warnings
- biome:check: ✅ 0 warnings
- lint:type-aware: ✅ 0 errors
- check:duplicates: ✅ 0 clones
- codescene --file: ✅ 0 warnings

## Pitfalls Encountered & Fixed

1. **oxlint `no-unnecessary-type-conversion`**: `String()` calls on already-string enum types triggered warnings. Fixed by using direct enum value with type guard `isBackendQuotaKindValue(kind)` instead of `String(kind)`.

2. **Type guard pattern for enum safety**: Used `(value: string): value is QuotaKind => (Object.values(QuotaKind) as readonly string[]).includes(value)` to satisfy both `no-unsafe-enum-comparison` and `no-unsafe-type-assertion` oxlint rules.

3. **Arabic CLDR plural rules**: Implemented as `if (count === 0) → if (count === 1) → if (count === 2) → if (count >= 3 && count <= 10) → else` pattern for all pluralization functions.

## Carry-Forward Knowledge

- **Backend enums**: `QuotaKind = { PACKAGE, PERIODIC }` (NO `ON_DEMAND`), `QuotaStatus = { ACTIVE, EXPIRED, ARCHIVED }` (NO `PENDING` yet — schema gap noted in deferred-items), `QuotaPeriodType = { WEEKLY, MONTHLY, CUSTOM }`
- **Schema factory pattern**: `createQuotaSchema(messages: QuotaLabels)` returns zod object. Messages object provides typed error strings from i18n.
- **Form state mapping**: `formStateToSubmitInput()` converts UI form state → `QuotaSubmitInput` (service type). `quotaReturnTypeToFormState()` converts `QuotaReturnType` → form state for edit mode.
- **Locale type pattern**: `types/*.ts` = interface definition, `en/*.ts` = `export const quotaEn: QuotaLabels`, `ar/*.ts` = `export const quotaAr: QuotaLabels`

## Cross-File Dependencies Discovered

- `QuotaStatus.PENDING` does NOT exist in backend enum yet — i18n has it but it's unused until backend adds it. Logged as deferred.
- `quotaForm.types.ts` imports `QuotaSubmitInput` and `QuotaReturnType` from `@/backend/types` — type cascade risk if those types change.

## Requirements Coverage

| Requirement | Task | Status |
|---|---|---|
| R9 (i18n Completeness) | 1.1-1.5 | ✅ All locale keys added |
| R9 (i18n — Pluralization) | 1.3 | ✅ quotaCount/ledgerCount with CLDR |
| R2 (Form — Validation) | 2.1 | ✅ Zod schema with superRefine |
| R2 (Form — Types) | 2.2 | ✅ Form state + mappers |
| R3 (Detail — Delete) | 1.2 | ✅ Delete confirm/error i18n keys |
| R3 (Detail — Not Found) | 1.4 | ✅ NotFound i18n keys |
| R4 (Insights) | 1.5 | ✅ Insights filter/export i18n keys |
| R6 (Audience Views) | 1.5 | ✅ Student quota audience i18n keys |
