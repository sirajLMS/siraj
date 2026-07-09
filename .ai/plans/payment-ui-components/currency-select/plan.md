# Currency Select UI — Plan

See [spec.md](./spec.md).

## Architecture

```
frontend/lib/currency.ts (catalog + display helpers)
        │
        ├── CurrencySelect   (Autocomplete — copy CountrySelect structure)
        └── CurrencyDisplay  (Typography + symbol/code)
```

## Phase pipeline

| Phase | Work | Gate |
|-------|------|------|
| 1 | `frontend/lib/currency.ts` + test | unit test |
| 2 | `CurrencyDisplay` + stories | Storybook |
| 3 | `CurrencySelect` + stories | Storybook |
| 4 | i18n + exports + lint | sub-loop |

## Patterns to copy

| From | Copy |
|------|------|
| `CountrySelect.tsx` | Autocomplete, renderOption, InputAdornment |
| `CountryDisplay.tsx` | Stack row, fallback |
| `frontend/lib/locale/country/*` | File layout for lookup/display |

## File list

| File | Action |
|------|--------|
| `frontend/lib/currency.ts` | Create |
| `frontend/lib/currency.test.ts` | Create |
| `frontend/components/ui/input/CurrencySelect.tsx` | Create |
| `frontend/components/ui/input/CurrencySelect.stories.tsx` | Create |
| `frontend/components/ui/display/CurrencyDisplay.tsx` | Create |
| `frontend/components/ui/display/CurrencyDisplay.stories.tsx` | Create |
| `frontend/components/ui/input/index.ts` | Update |
| `frontend/components/ui/display/index.ts` | Update |
| `shared/messages/types/ui/currency-select.ts` | Create |
| `shared/messages/ar/ui/currency-select.ts` | Create |
| `shared/messages/en.ts` | Update |

## Payment integration note

When `CurrencyCode` GraphQL enum lands, update `CurrencyType.code` to use codegen type and verify constant list matches enum generator output.
