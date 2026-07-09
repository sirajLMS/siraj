# Localized String UI — Plan

See [spec.md](./spec.md).

## Architecture

```
shared/i18n/routing (locales only — no DB catalog)
        │
frontend/types/localized-string.types.ts   LocalizedString map type
        │
frontend/lib/localized-string.ts           map ↔ rows, resolve, validate
        │
        ├── LocalizedStringInput   dynamic rows: Select adornment + TextField + Add button
        └── LocalizedStringDisplay resolve for read-only
```

**Storage reminder:** JSONB column on each entity row; component edits the map that gets persisted on that column — no joins.

## Phase pipeline

| Phase | Work | Gate |
|-------|------|------|
| 1 | Types + lib (`rowsToLocalizedString`, etc.) + tests | `bun tsgo` + unit tests |
| 2 | `LocalizedStringDisplay` + stories | Storybook |
| 3 | `LocalizedStringInput` + stories | Storybook |
| 4 | i18n (`addTranslation`, validation messages) | — |
| 5 | Index exports + lint | sub-loop |

## Patterns to copy

| From | Copy |
|------|------|
| `CountrySelect.tsx` | `InputAdornment` + `slotProps.input` |
| `LanguageSelector.tsx` | `getLanguageDisplayName`, `languages` list for Select options |
| `TimezoneDisplay.tsx` | Display component + `useLocale()` |
| `backend/db/repo/utils/resolve-localized.ts` | Fallback algorithm |

## File list

| File | Action |
|------|--------|
| `frontend/types/localized-string.types.ts` | Create |
| `frontend/lib/localized-string.ts` | Create — include `localizedStringToRows` / `rowsToLocalizedString` |
| `frontend/lib/localized-string.validation.ts` | Create |
| `frontend/lib/localized-string.test.ts` | Create — map↔rows, duplicate locale guard, required ar |
| `frontend/components/ui/display/LocalizedStringDisplay.tsx` | Create |
| `frontend/components/ui/display/LocalizedStringDisplay.stories.tsx` | Create |
| `frontend/components/ui/input/LocalizedStringInput.tsx` | Create |
| `frontend/components/ui/input/LocalizedStringInput.stories.tsx` | Create |
| `frontend/components/ui/input/index.ts` | Update |
| `frontend/components/ui/display/index.ts` | Update |
| `shared/messages/types/ui/localized-string.ts` | Create |
| `shared/messages/ar/ui/localized-string.ts` | Create |
| `shared/messages/en.ts` | Update |

## Compliance

- `frontend/AGENTS.md` — MUI v9 `sx`, `*Outlined` icons (`AddOutlined`, `CloseOutlined`)
- No locale catalog table or API
