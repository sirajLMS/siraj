# Currency Select UI — Specification

**Status:** Planning  
**Blocks:** Payment catalog admin (`currencyCode` on wallets, links, online accounts)  
**Design:** [payment ui-design README](../payment/ui-design/README.md)

---

## Problem

Catalog rows require `currencyCode` (ISO 4217). No `CurrencySelect` / `CurrencyDisplay` exists. `CurrencyCode` GraphQL enum ships with payment backend — this plan delivers UI **without** waiting for GraphQL by using a frontend currency catalog constant.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Components | `CurrencySelect`, `CurrencyDisplay` |
| Data source | `frontend/lib/currency.ts` — curated list aligned with payment seeds (EGP, SAR, USD, EUR, …) |
| Pattern | Mirror `CountrySelect` / `CountryDisplay` |
| Value | ISO 4217 string (`EGP`, `SAR`) |
| Display | `getCurrencyDisplayName(code, locale)` — symbol + code or localized name |
| GraphQL later | When `CurrencyCode` enum exists, type props as `CurrencyCode` from codegen — constant list must match enum values |

## Initial currency set (v1)

Match payment decision doc seeds:

`EGP`, `SAR`, `USD`, `EUR`, `GBP`, `AED`, `KWD`, `QAR`, `BHD`, `OMR`, `JOD`

Extend list in one file when payment spec adds currencies.

## `CurrencySelect` API

```ts
export type CurrencyType = { code: string; symbol?: string };

export type CurrencySelectProps = {
  readonly currency?: CurrencyType | null;
  readonly setCurrencyAction: (currency: CurrencyType) => void;
  readonly onBlurAction?: () => void;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly label?: string;
  readonly allowedCodes?: readonly string[];  // filter options
  readonly style?: React.CSSProperties;
};
```

## `CurrencyDisplay` API

```ts
export type CurrencyDisplayProps = {
  readonly code?: string | null;
  readonly currency?: CurrencyType;
  readonly showSymbol?: boolean;
  readonly showLabel?: boolean;
  readonly fallback?: string;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
```

## Lib

`frontend/lib/currency.ts`:

- `currencies` array
- `getCurrencyByCode(code)`
- `getCurrencyDisplayName(code, locale)` — use `Intl.DisplayNames` for currency if available, fallback to code

## Storybook

- Default selection EGP
- Filtered `allowedCodes={["EGP", "SAR"]}`
- `CurrencyDisplay` for EGP / SAR
- Arabic globals

## Acceptance criteria

1. Autocomplete searchable by code and display name
2. `CountrySelect`-level UX parity (emoji/symbol adornment optional)
3. Exported from input/display index
4. Unit test for `getCurrencyDisplayName` fallback
5. Quality gate on touched files

## Out of scope

- FX rates
- Auto-pair country → currency (optional helper in payment forms, not this component)
