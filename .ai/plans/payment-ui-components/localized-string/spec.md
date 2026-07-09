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
| Locales | `AppLocale` from `@/shared/i18n/routing` (`["ar","en"]` today); default `routing.defaultLocale` (`ar`) |
| Input UX | **Single inline `TextField` + Drawer** — not dynamic rows, not tabs |
| Inline input | One MUI `TextField` showing the **currently-edited locale** only. Start adornment = `LocaleEmoji` (clickable, opens locale switcher `Popover`). End adornment = `TextButton` “Edit translations” (opens `Drawer`). |
| Drawer | `Drawer` (anchor right) listing **one `TextField` per `ALLOWED_LOCALES`** (`ar`,`en` today) — no Add-row button. Disable Save until ≥1 non-empty. |
| Locale switch | Clicking the start-adornment `LocaleEmoji` opens a small `Popover` (mirror `LanguageSwitcher` in `frontend/views/dashboard/components/navbar/LanguageSwitcher.tsx`): pick another `AppLocale`. Before switching: write the current text into the map under the current locale, then load the new locale’s value. Animate the input to indicate the locale changed. If the just-written value was valid and no error, briefly tint the input green (500ms) on switch. |
| Per-row `dir` | `slotProps.htmlInput.dir = row.locale === "ar" ? "rtl" : "ltr"` (matches `PhoneInput.tsx:199-205`). |
| Default editing locale | `useLocale()` (the UI display locale) on mount. |
| Required | At least **one** non-empty translation; default `requiredLocales: ["ar"]` for fields like `name` |
| Display | `LocalizedStringDisplay` — `resolveLocalizedString(map, useLocale())` |
| Fallback | Request locale → `ar` → first value → `""` (match backend) |

## Input wireframe

### Inline input (default state — single TextField)

```
Name *
┌─────────────────────────────────────────────────────────┐
│ 🇸🇦 │ فودافون كاش                      [ Edit translations ] │
└─────────────────────────────────────────────────────────┘
helper: At least one translation required · Arabic required for this field
```

- **Start adornment:** `LocaleEmoji` for the **currently-edited** `AppLocale`. Click → opens a small `Popover` listing `ALLOWED_LOCALES` (mirror `LanguageSwitcher`, `frontend/views/dashboard/components/navbar/LanguageSwitcher.tsx`). Selecting a different locale:
  1. Commit the current input value to the map under the current locale (`setLocalizedString(map, currentLocale, text)`).
  2. Load the selected locale’s value from the map into the input.
  3. Play a short switch animation (fade/slide of the `TextField` contents). If the committed value passed `hasRequiredLocalizedValue` and there is no validation error, tint the input border/fill **green for 500ms** before settling.
- **End adornment:** `TextButton` (MUI `<Button variant="text" size="small">`) labelled “Edit translations”. Click → opens the `LocalizedStringDrawer`.
- Default editing locale = `useLocale()` (the active UI display locale) on mount.

### Drawer (full multi-locale editor)

```
┌ Edit translations — Name ─────────────────────────┐
│                                                   │
│ 🇸🇦 العربية *  ┌────────────────────────────────┐ │
│                  │ فودافون كاش                    │ │  dir="rtl"
│                  └────────────────────────────────┘ │
│                                                   │
│ 🇬🇧 English    ┌────────────────────────────────┐ │
│                  │ Vodafone Cash                  │ │  dir="ltr"
│                  └────────────────────────────────┘ │
│                                                   │
│ helper: At least one translation required ·       │
│         Arabic required for this field            │
│                                                   │
│                          [ Cancel ]   [ Save ]     │
└───────────────────────────────────────────────────┘
```

- `Drawer` anchor=`right`, `maxWidth` sm (400–560px). One `TextField` per `ALLOWED_LOCALES` — today exactly `ar` and `en`.
- **No “Add translation” / “Add locale” button** — locales are sourced exclusively from `@/shared/i18n/routing`. Inline doc comment in the drawer file: to add a locale, append to `routing.locales` + `backend/enum/auth.enum.ts` (`AppLanguage`) + `frontend/lib/locale/language/languages.ts`; the drawer renders the new locale automatically.
- `Save` is **disabled** while `hasRequiredLocalizedValue(draft, requiredLocales) === false`. `Cancel` reverts draft to the prop `value`.
- Each row sets `slotProps.htmlInput.dir = locale === "ar" ? "rtl" : "ltr"`.
- Helper text appears **once below the whole control** (not per row): `At least one translation required · Arabic required for this field` (or only the failed clause).

## Internal state ↔ value

The inline input edits **one locale at a time** (the *active editing locale*). The component keeps two pieces of local state:

```ts
activeLocale: AppLocale          // which locale the inline TextField is editing
draft: LocalizedString           // working copy of the map (synced from props.value)
```

- On mount / `value` prop change: `activeLocale ← useLocale()`; `draft ← value`.
- Typing in the inline input: `setLocalizedString(draft, activeLocale, text)`.
- Locale switch via start-adornment `Popover`: commit current text under `activeLocale`, then `activeLocale ← nextLocale`, load `draft[nextLocale] ?? ""` into the input.
- Opening the Drawer: drawer receives `draft` as its own draft; on `Save` it writes back to `draft` and calls `onChangeAction(draft)`.
- On every change (inline input or drawer Save): emit `onChangeAction(draft)` to the parent form.

No row array is used. Old row-array helpers (`localizedStringToRows` / `rowsToLocalizedString`) are **dropped** from the lib spec.

## `LocalizedStringInput` API (inline control)

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
  /** Drawer title; defaults to `label` */
  readonly drawerTitle?: string;
  /** Disable the end-adornment TextButton + drawer (e.g. read-only mode) */
  readonly disableDrawer?: boolean;
};
```

Sub-components:
- `LocalizedStringDrawer` — exported from the same module; renders one `TextField` per `ALLOWED_LOCALES`, Save disabled until valid.
- `LocaleAdornmentSwitch` — the start-adornment `LocaleEmoji` + `Popover` piece, reusable. Animates the locale switch and the green-success tint.
- `LocalizedStringFormField<T>` (RH) — wrapper mirroring `PhoneFormField`; wires `Controller` so `react-hook-form` consumers don’t have to.

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
DEFAULT_CONTENT_LOCALE // "ar"
ALLOWED_LOCALES         // readonly AppLocale[] — sourced from routing.locales
```

`localizedStringToRows` / `rowsToLocalizedString` are **removed** — the new design edits a single locale at a time and lists locales directly from `ALLOWED_LOCALES` in the drawer; no row↔map conversion is needed.

## Zod helper

```ts
localizedStringRequiredSchema(requiredLocales?: AppLocale[])
// refine: at least one key with non-empty string
// refine: each requiredLocales key present and non-empty
```

## MUI implementation notes

### Inline input

```tsx
<TextField
  value={draft[activeLocale] ?? ""}
  onChange={e => setDraft(setLocalizedString(draft, activeLocale, e.target.value))}
  dir={activeLocale === "ar" ? "rtl" : "ltr"}
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start">
          <LocaleAdornmentSwitch
            activeLocale={activeLocale}
            onChangeAction={handleLocaleSwitch}
          />
        </InputAdornment>
      ),
      endAdornment: disableDrawer ? undefined : (
        <InputAdornment position="end">
          <Button variant="text" size="small" onClick={openDrawer} startIcon={<EditOutlined />}>
            {t("editTranslations")}
          </Button>
        </InputAdornment>
      ),
    },
    htmlInput: { dir: activeLocale === "ar" ? "rtl" : "ltr" },
  }}
/>
```

### Drawer

```tsx
<Drawer anchor="right" open={open} onClose={onCancel}>
  <Stack sx={{ p: 3, gap: 2, minWidth: 400 }}>
    {ALLOWED_LOCALES.map(locale => (
      <TextField
        key={locale}
        label={`${getLanguageDisplayName(locale, uiLocale)}${requiredLocales.includes(locale) ? " *" : ""}`}
        value={drawerDraft[locale] ?? ""}
        onChange={e => setDrawerDraft(setLocalizedString(drawerDraft, locale, e.target.value))}
        multiline={multiline}
        minRows={minRows}
        error={…required-missing…}
        slotProps={{ htmlInput: { dir: locale === "ar" ? "rtl" : "ltr" } }}
      />
    ))}
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
      <Button onClick={onCancel}>{t("cancel")}</Button>
      <Button
        variant="contained"
        disabled={!hasRequiredLocalizedValue(drawerDraft, requiredLocales)}
        onClick={handleSave}
      >
        {t("save")}
      </Button>
    </Box>
  </Stack>
</Drawer>
```

Mirror the `PhoneInput` slotProps pattern (`frontend/components/ui/input/phoneInput/PhoneInput.tsx:148-206`) — pass `htmlInput.dir` via `slotProps.htmlInput`, not as a top-level prop.

### Locale switch animation

Apply the green-success tint with a `key={activeLocale}` remount of the `TextField` (cheap fade-in) plus a transient `sx` class toggled by a `useState` for 500ms:

```ts
const [justSwitched, setJustSwitched] = useState(false);
useEffect(() => {
  if (!justSwitched) return;
  const id = setTimeout(() => setJustSwitched(false), 500);
  return () => clearTimeout(id);
}, [justSwitched]);
```

```tsx
sx={justSwitched && !error ? { "& .MuiOutlinedInput-root": { borderColor: "success.main" } } : undefined}
```

The old `Select` + dynamic “Add translation” row pattern is intentionally **not** implemented.

## Acceptance criteria

1. Inline input renders a single `TextField` for the **currently-edited locale** (default `useLocale()`).
2. Start-adornment `LocaleEmoji` opens a `Popover` (mirror `LanguageSwitcher`); selecting a locale commits the current value, swaps the input content, and animates the switch + 500ms green tint on successful commit.
3. End-adornment `TextButton` “Edit translations” opens a right-anchored `Drawer`.
4. The `Drawer` renders one `TextField` per `ALLOWED_LOCALES` (`ar`, `en` today) with correct per-row `dir`. **No Add-translation button.**
5. `Save` in the Drawer is disabled until `hasRequiredLocalizedValue(draft, requiredLocales)` is true.
6. `required` + `requiredLocales: ["ar"]` shows an error on the Arabic row (and on the inline input when `activeLocale === "ar"`) on blur/submit.
7. `LocalizedStringDisplay` fallback matches backend (unit tests).
8. Storybook: inline single-locale, inline with drawer open, drawer with required error, drawer with multiline, Arabic UI chrome, locale-switch animation.
9. `LocalizedStringFormField<T>` RH wrapper works in `react-hook-form` forms.
10. Exported from `input/index.ts` (Input, Drawer, FormField) and `display/index.ts`.

## Out of scope

- Separate DB table for translations
- Locale catalog / admin-managed locale list
- Rich text / markdown
- GraphQL `LocalizedStringInput` scalar (payment phase uses JSON map on entity mutations)
