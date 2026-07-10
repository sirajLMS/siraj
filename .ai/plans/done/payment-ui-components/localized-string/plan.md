# Localized String UI — Plan

See [spec.md](./spec.md).

## Architecture

```
shared/i18n/routing (locales only — no DB catalog)
        │
frontend/types/localized-string.types.ts   LocalizedString map type
        │
frontend/lib/localized-string.ts           map set/remove/resolve, hasRequiredLocalizedValue
        │
        ├── LocalizedStringInput (inline)
        │     ├── LocaleAdornmentSwitch   start adornment: LocaleEmoji (flag) + language name + Popover switcher (anim + 500ms green tint)
        │     └── end adornment TextButton → opens LocalizedStringDrawer
        │
        ├── LocalizedStringDrawer         one TextField per ALLOWED_LOCALES (ar, en); Save disabled until valid
        │
        ├── LocalizedStringFormField<T>   react-hook-form Controller wrapper (mirrors PhoneFormField)
        │
        └── LocalizedStringDisplay        resolve for read-only
```

**Storage reminder:** JSONB column on each entity row; component edits the map that gets persisted on that column — no joins.

**Locale policy:** `AppLocale` (`["ar","en"]`) from `@/shared/i18n/routing`. No admin locale catalog, no DB locale table. To add a locale: append to `routing.locales` + `backend/enum/auth.enum.ts` (`AppLanguage`) + `frontend/lib/locale/language/languages.ts`; the drawer auto-renders the new entry. Documented inline in `LocalizedStringDrawer.tsx`.

## Phase pipeline

| Phase | Work | Gate |
|-------|------|------|
| 1 | Types + lib (`setLocalizedString`, `hasRequiredLocalizedValue`, `ALLOWED_LOCALES`) + tests | `bun tsgo` + unit tests |
| 2 | `LocalizedStringDisplay` + stories | Storybook |
| 3 | `LocaleAdornmentSwitch` (LocaleEmoji flag + language name + Popover switcher + anim + 500ms green tint) | Storybook |
| 4 | `LocalizedStringDrawer` (one TextField per ALLOWED_LOCALES, Save-disabled-until-valid) + stories | Storybook |
| 5 | `LocalizedStringInput` (inline TextField wiring adornment + drawer) + stories | Storybook |
| 6 | `LocalizedStringFormField<T>` RH wrapper | tsgo + lint |
| 7 | i18n (`editTranslations`, validation strings en + ar) | — |
| 8 | Index exports + lint | sub-loop |
| 9 | **Mobile** — compact adornments, bottom-sheet drawer, sticky actions, mobile Storybook viewports | Storybook + tsgo |

## Mobile implementation notes

- `useMediaQuery(theme.breakpoints.down("md"))` in `LocalizedStringDrawer` for bottom sheet (mirror `SearchScheduleFilterDrawer`).
- `useMediaQuery(theme.breakpoints.down("sm"))` in `LocalizedStringInput` → `compact` on `LocaleAdornmentSwitch` + icon-only edit `IconButton`.
- Do **not** expose a `variant="mobile"` prop — responsive behavior is internal.
- `paddingBottom: env(safe-area-inset-bottom, 0px)` on drawer footer for notched devices.

## Patterns to copy

| From | Copy |
|------|------|
| `LanguageSelector.tsx` | `Autocomplete` + `InputAdornment` start adornment for languages (if a search-select locale picker is ever needed in drawer for >2 locales) |
| `LanguageSwitcher.tsx` (`frontend/views/dashboard/components/navbar/`) | `Popover` with `LanguageOption`-style rows — **primary pattern for `LocaleAdornmentSwitch`** start adornment switcher |
| `PhoneInput.tsx:148-206` | `slotProps.htmlInput.dir` (rtl/ltr) + start-adornment `IconButton`/`LocaleEmoji` layout + `InputAdornment` gap/spacing |
| `CountryAutocomplete.tsx` | `InputAdornment position="start"` + `LocaleEmoji` + slotProps.input merge with `params.slotProps.input` |
| `PhoneFormField.tsx` | `Controller` + `react-hook-form` wrapper pattern — mirror for `LocalizedStringFormField<T>` |
| `SearchScheduleFilterDrawer.tsx` | **Mobile drawer** — `anchor={isMobile ? "bottom" : "right"}`, `maxHeight: 85vh`, rounded top corners, full width on mobile |
| `ManualInvoiceActions.tsx` | **Mobile actions** — stacked `fullWidth` buttons, `minHeight: 56` touch targets |
| `backend/db/repo/utils/resolve-localized.ts` | Fallback algorithm |

## File list

| File | Action |
|------|--------|
| `frontend/types/localized-string.types.ts` | Create |
| `frontend/lib/localized-string.ts` | Create — `setLocalizedString`, `removeLocalizedString`, `hasRequiredLocalizedValue`, `resolveLocalizedString`, `ALLOWED_LOCALES`, `DEFAULT_CONTENT_LOCALE` exports (no rows helpers) |
| `frontend/lib/localized-string.validation.ts` | Create |
| `frontend/lib/localized-string.test.ts` | Create — set/remove, required locales, no duplicate keys, fallback |
| `frontend/components/ui/input/localizedString/LocaleAdornmentSwitch.tsx` | Create — `LocaleEmoji` (flag) + `getLanguageDisplayName(activeLocale, uiLocale)` + `Popover` switcher (mirrors `LanguageSwitcher`), locale switch + 500ms green tint hook, flag/label refresh on `activeLocale` change |
| `frontend/components/ui/input/localizedString/LocalizedStringDrawer.tsx` | Create — one TextField per `ALLOWED_LOCALES`; Save disabled until `hasRequiredLocalizedValue`; inline doc comment for adding locales |
| `frontend/components/ui/input/localizedString/LocalizedStringInput.tsx` | Create — inline TextField wiring `LocaleAdornmentSwitch` (start) + “Edit translations” `TextButton` (end) → opens Drawer |
| `frontend/components/ui/input/localizedString/LocalizedStringFormField.tsx` | Create — `react-hook-form` `Controller` wrapper, mirrors `PhoneFormField` |
| `frontend/components/ui/input/localizedString/LocalizedStringInput.stories.tsx` | Create — InlineDefault, DrawerOpen, SwitchAnimation, RequiredError, Multiline, ArabicChrome |
| `frontend/components/ui/input/localizedString/LocalizedStringDrawer.stories.tsx` | Create — EmptySaveDisabled, TwoLocales, RequiredError, Multiline |
| `frontend/components/ui/display/LocalizedStringDisplay.tsx` | Create |
| `frontend/components/ui/display/LocalizedStringDisplay.stories.tsx` | Create |
| `frontend/components/ui/input/index.ts` | Update — export Input, Drawer, FormField, LocaleAdornmentSwitch |
| `frontend/components/ui/display/index.ts` | Update |
| `shared/messages/types/ui/localized-string.ts` | Create |
| `shared/messages/ar/ui/localized-string.ts` | Create |
| `shared/messages/en.ts` | Update |

## Compliance

- `frontend/AGENTS.md` — MUI v9 `sx`, `*Outlined` icons (`EditOutlined`, `CloseOutlined`)
- `AppLocale` / `locales` from `@/shared/i18n/routing` (default `ar`); never invent a locale list locally
- No locale catalog table, API, or admin-managed locale list
- Per-row `dir` via `slotProps.htmlInput` (matches `PhoneInput.tsx:148-206`), **not** a top-level `dir` prop
- Mobile drawer mirrors `SearchScheduleFilterDrawer` (`down("md")` bottom sheet); inline compact at `down("sm")`
- No `console.*`; `logger` if needed. `@/` imports only.
