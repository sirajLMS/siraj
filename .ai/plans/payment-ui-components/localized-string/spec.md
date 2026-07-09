# Localized String UI — Specification

**Status:** Planning  
**Blocks:** Payment catalog admin dialogs, permission-group editing, any form with JSONB `LocalizedString` columns  
**Design:** [payment ui-design README](../payment/ui-design/README.md)

---

## Problem

Entity tables store localized copy in **JSONB columns** on the same row (`name`, `description`, …) — not in a separate translations table and not via joins. Example: `supported_mobile_wallets.name` is `jsonb` `$type<LocalizedString>`.

There is no frontend component to edit or display these maps. Backend resolves with `resolveLocalized()`; frontend needs the same lib + a **simple** input control.

## Storage model (locked)

```
supported_mobile_wallets
  name          jsonb  { "ar": "فودافون كاش", "en": "Vodafone Cash" }
  description   jsonb  { "ar": "…", "en": "…" }
  instructions  jsonb  …

permissions.permission_groups
  name          jsonb  …
```

- **No** `localized_strings` table
- **No** locale catalog table — locales come from `@/shared/i18n/routing` (`ar`, `en` today)
- Form value / mutation payload: plain object map `LocalizedString` written into the entity’s JSONB column

## Locked decisions

| Topic | Choice |
|-------|--------|
| Type | `LocalizedString = Partial<Record<AppLocale, string>>` |
| Type file | `frontend/types/localized-string.types.ts` (not `@/backend/types` in components) |
| Input UX | **Dynamic rows** — not fixed ar/en stack, not tabs |
| Row layout | MUI `TextField` with **`InputAdornment` + locale `Select`** at start, text input, optional remove |
| Add row | **Button below** rows: “Add translation” — adds another locale+text pair |
| Locale picker | Only locales from `routing.locales` **not already used** in another row |
| Max rows | `locales.length` (2 today) |
| Min rows | 1 empty row on create; hydrate one row per map entry on edit |
| Required | At least **one** non-empty translation; default `requiredLocales: ["ar"]` for fields like `name` |
| Row `dir` | `rtl` when selected locale is `ar`, else `ltr` |
| Display | `LocalizedStringDisplay` — `resolveLocalizedString(map, useLocale())` |
| Fallback | Request locale → `ar` → first value → `""` (match backend) |

## Input wireframe

```
Name *
┌─────────────────────────────────────────────────────────┐
│ [ العربية ▼ ] │ فودافون كاش                         [×] │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ [ English ▼ ] │ Vodafone Cash                           [×] │
└─────────────────────────────────────────────────────────┘
        [ + Add translation ]

helper: At least one translation required · Arabic required for this field
```

- **Start adornment:** compact `Select` (or `Menu` in adornment) showing `getLanguageDisplayName(locale, uiLocale)` — same lib as `LanguageSelector`
- **Remove `[×]`:** drops that locale from the map; hidden when only one row remains
- **Add button:** disabled when all locales are already assigned

## Internal state ↔ value

Component may use row array internally:

```ts
type LocalizedStringRow = { locale: AppLocale; text: string };
```

On every change: `rows → localizedStringMap` via `setLocalizedString` / omit empty locales.

On mount / `value` prop change: `map → rows` (sorted with `ar` first, then `en`).

## `LocalizedStringInput` API

```ts
export type LocalizedStringInputProps = {
  readonly value: LocalizedString;
  readonly onChangeAction: (value: LocalizedString) => void;
  readonly onBlurAction?: () => void;
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: boolean;
  readonly errorMessage?: string;
  readonly requiredLocales?: readonly AppLocale[];  // default ["ar"] when required field
  readonly required?: boolean;  // at least one non-empty entry
  readonly multiline?: boolean;
  readonly minRows?: number;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
};
```

## `LocalizedStringDisplay` API

Unchanged — read-only resolved string for lists, previews, user-facing pickers (when raw map is available).

```ts
export type LocalizedStringDisplayProps = {
  readonly value?: LocalizedString | null;
  readonly locale?: string;
  readonly fallback?: React.ReactNode;
  readonly typographyVariant?: TypographyProps["variant"];
  readonly sx?: SxProps<Theme>;
};
```

## Lib functions

```ts
resolveLocalizedString(map, locale?): string
setLocalizedString(map, locale, value): LocalizedString
removeLocalizedString(map, locale): LocalizedString
hasRequiredLocalizedValue(map, requiredLocales?): boolean
localizedStringToRows(map): LocalizedStringRow[]
rowsToLocalizedString(rows): LocalizedString
DEFAULT_CONTENT_LOCALE // "ar"
```

## Zod helper

```ts
localizedStringRequiredSchema(requiredLocales?: AppLocale[])
// refine: at least one key with non-empty string
// refine: each requiredLocales key present and non-empty
```

## MUI implementation notes

```tsx
<TextField
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start">
          <Select value={row.locale} … size="small" variant="standard" />
        </InputAdornment>
      ),
      endAdornment: rows.length > 1 ? <IconButton onClick={removeRow}>…</IconButton> : undefined,
    },
    htmlInput: { dir: row.locale === "ar" ? "rtl" : "ltr" },
  }}
/>
<Button startIcon={<AddOutlined />} onClick={addRow} disabled={allLocalesUsed}>
  {t("addTranslation")}
</Button>
```

Mirror `CountrySelect` adornment pattern — not a separate locale catalog component.

## Acceptance criteria

1. Starts with one row; “Add translation” adds second locale row when available
2. Changing locale in adornment moves text between keys in the output map (no duplicate locale keys)
3. Remove row deletes that locale from map
4. `required` + `requiredLocales: ["ar"]` errors when Arabic missing on blur/submit
5. `LocalizedStringDisplay` fallback matches backend (unit tests)
6. Storybook: single row, two rows, required error, multiline, Arabic UI chrome
7. Exported from input/display index barrels

## Out of scope

- Separate DB table for translations
- Locale catalog / admin-managed locale list
- Rich text / markdown
- GraphQL `LocalizedStringInput` scalar (payment phase uses JSON map on entity mutations)
