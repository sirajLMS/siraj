# Localized String UI — Tasks

See [plan.md](./plan.md) and [spec.md](./spec.md).

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Types + lib

- [ ] Create `frontend/types/localized-string.types.ts`
- [ ] Create `frontend/lib/localized-string.ts` — resolve, set, remove, `localizedStringToRows`, `rowsToLocalizedString`, `hasRequiredLocalizedValue`
- [ ] Create `frontend/lib/localized-string.validation.ts`
- [ ] Create `frontend/lib/localized-string.test.ts` — fallback, rows round-trip, required locales, no duplicate keys
- [ ] Gate: `bun tsgo` + `bun run test:ui:components`

## Phase 2 — Display

- [ ] Create `LocalizedStringDisplay.tsx` + stories
- [ ] Update `display/index.ts`

## Phase 3 — Input

- [ ] Create `LocalizedStringInput.tsx` — adornment locale Select, dynamic rows, Add translation button, per-row remove
- [ ] Create `LocalizedStringInput.stories.tsx` — OneRow, TwoRows, AddDisabledWhenFull, RequiredError, Multiline, Arabic chrome
- [ ] Update `input/index.ts`
- [ ] Gate: Storybook

## Phase 4 — i18n

- [ ] `ui.localizedString` — `addTranslation`, `removeTranslation`, `selectLocale`, validation strings (en + ar)

## Phase 5 — Verification

- [ ] `bun tsgo` + `bun biome:check` + lint queue
