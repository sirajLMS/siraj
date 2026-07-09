# Localized String UI — Tasks

See [plan.md](./plan.md) and [spec.md](./spec.md).

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Types + lib

- [ ] Create `frontend/types/localized-string.types.ts` — `LocalizedString` re-export from `@/backend/types/shared/localized-string.types`, `ALLOWED_LOCALES` from `@/shared/i18n/routing`
- [ ] Create `frontend/lib/localized-string.ts` — `setLocalizedString`, `removeLocalizedString`, `hasRequiredLocalizedValue`, `resolveLocalizedString` (mirror backend `resolve-localized.ts`), `ALLOWED_LOCALES`, `DEFAULT_CONTENT_LOCALE` (no rows helpers)
- [ ] Create `frontend/lib/localized-string.validation.ts` — `localizedStringRequiredSchema(requiredLocales?)`
- [ ] Create `frontend/lib/localized-string.test.ts` — set/remove, required locales (at least one non-empty + required locales present), fallback chain (requested → ar → first → "")
- [ ] Gate: `bun tsgo` + `bun run test:ui:components`

## Phase 2 — Display

- [ ] Create `LocalizedStringDisplay.tsx` + stories (resolve + locale chip)
- [ ] Update `display/index.ts`

## Phase 3 — Locale adornment switch

- [ ] Create `LocaleAdornmentSwitch.tsx` — `LocaleEmoji` + `Popover` switcher (mirror `frontend/views/dashboard/components/navbar/LanguageSwitcher.tsx`)
  - Commit current text → switch active locale → load new locale’s value
  - Switch animation (fade/slide) + 500ms green tint on valid commit; tint skipped if error
- [ ] Minimal story for the adornment component alone

## Phase 4 — Drawer

- [ ] Create `LocalizedStringDrawer.tsx` — one `TextField` per `ALLOWED_LOCALES` (`ar`,`en` today), `dir` via `slotProps.htmlInput.dir`
  - Save disabled while `hasRequiredLocalizedValue(draft, requiredLocales) === false`
  - Cancel reverts to prop `value`
  - Inline doc comment: how to add a locale (routing + enum + languages list)
- [ ] Create `LocalizedStringDrawer.stories.tsx` — EmptySaveDisabled, TwoLocales, RequiredError, Multiline
- [ ] Gate: Storybook

## Phase 5 — Input (wires adornment + drawer)

- [ ] Create `LocalizedStringInput.tsx` — inline `TextField`, `activeLocale = useLocale()` default, start adornment `LocaleAdornmentSwitch`, end adornment `TextButton` “Edit translations” → opens Drawer
  - `onChangeAction(draft)` on every keystroke and on drawer Save
  - `multiline` / `minRows` / `disabled` / `error` / `helperText` passthrough
- [ ] Create `LocalizedStringInput.stories.tsx` — InlineDefault, DrawerOpen, SwitchAnimation, RequiredError, Multiline, ArabicChrome
- [ ] Update `input/index.ts`
- [ ] Gate: Storybook

## Phase 6 — react-hook-form wrapper

- [ ] Create `LocalizedStringFormField.tsx` — `Controller` wrapper mirroring `PhoneFormField.tsx`
- [ ] Gate: `bun tsgo` on the file

## Phase 7 — i18n

- [ ] `ui.localizedString` — `editTranslations`, `cancel`, `save`, `selectLocale`, validation strings (en + ar); also `drawerTitle` override if needed

## Phase 8 — Verification

- [ ] `bun tsgo` + `bun biome:check` + lint queue on all new files
