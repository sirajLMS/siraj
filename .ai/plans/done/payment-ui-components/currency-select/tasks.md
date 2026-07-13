# Currency Select UI — Tasks

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Backend enum + codegen

- [x] Create `backend/enum/currency.enum.ts` — `CurrencyCode` enum (32 codes: all Arabic countries + Turkey + USD/EUR/GBP/CHF/CNY/JPY/INR/CAD/AUD)
- [x] Re-export from `backend/enum/index.ts`
- [x] Register `CurrencyCodePothosObject` in `backend/graphql/pothos/enum.pothos.ts`
- [x] Run `bun run generate:gqlSchema && bun codegen`
- [x] Verify `CurrencyCode` enum in `frontend/common/graphql/generated/gql/graphql-types.ts` + `schema.graphql`

## Phase 2 — Frontend lib

- [x] Create `frontend/lib/currency.ts` — `CurrencyOption`, `currencies` catalog, `getCurrencyByCode`, `getCurrencyDisplayName` (Intl.DisplayNames fallback), `getCurrencyFlag`, `getCurrencySymbol`, `getCurrencyOptions`, `getCurrencyOptionLabel`, `getCurrencyOptionRowLabel`

## Phase 3 — Display

- [x] Create `CurrencyDisplay.tsx` (showFlag, showLabel, showSymbol, showCode, fallback)
- [x] Create `CurrencyDisplay.stories.tsx`
- [x] Update `frontend/components/ui/display/index.ts`

## Phase 4 — Input (5-file split mirroring CountrySelect)

- [x] Create `CurrencySelect.tsx` (thin wrapper)
- [x] Create `CurrencyAutocomplete.tsx` (Autocomplete + start/end adornments: search icon + flag at start, symbol at end)
- [x] Create `CurrencyOptionRow.tsx` (flag + symbol + long name + ISO code)
- [x] Create `currencyAutocompletePopper.ts` (slot-props helpers)
- [x] Create `CurrencySelect.stories.tsx` (Default, EgyptianPound, Empty, Required, FilteredToGcc, Arabic)
- [x] Update `frontend/components/ui/input/index.ts`

## Phase 5 — i18n

- [x] Add `shared/messages/types/ui/currency-select.ts` — `CurrencySelectLabels`
- [x] Wire into `shared/messages/types/ui/index.ts` (import + `UiLabels.currencySelect`)
- [x] Add `shared/messages/ar/ui/currency-select.ts` — Arabic strings
- [x] Re-export from `shared/messages/ar/ui/index.ts`
- [x] Add `currencySelect` block to `shared/messages/en.ts`
- [x] Wire `currencySelect` into `shared/messages/ar/index.ts`

## Phase 6 — Verification

- [x] `bun run generate:gqlSchema` + `bun codegen` clean
- [x] `bun tsgo` — zero currency-related errors (only pre-existing `catalogImageUpload` + `storage.pothos` errors from prior work)
- [x] `biome:check` on touched files — clean
- [x] Lint queue on touched files — 0 errors, 1 Fast-Refresh warning mirroring `CountryOptionRow` precedent

## Out of scope (deferred)

- DB column typed with the enum (no `currency` column exists yet)
- Service-layer currency fields
- Unit test for `getCurrencyDisplayName` fallback — left for a follow-up; the helper mirrors the well-tested `getCountryDisplayName` shape
