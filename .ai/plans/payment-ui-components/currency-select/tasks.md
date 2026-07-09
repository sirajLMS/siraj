# Currency Select UI — Tasks

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Lib

- [ ] Create `frontend/lib/currency.ts` — currencies list, lookup, display name
- [ ] Create `frontend/lib/currency.test.ts`
- [ ] Gate: `bun tsgo` + component tests

## Phase 2 — Display

- [ ] Create `CurrencyDisplay.tsx` + stories
- [ ] Update `display/index.ts`

## Phase 3 — Input

- [ ] Create `CurrencySelect.tsx` + stories (default, filtered, required, Arabic)
- [ ] Update `input/index.ts`

## Phase 4 — i18n

- [ ] Add `ui.currencySelect` messages en/ar

## Phase 5 — Verification

- [ ] `bun biome:check`
- [ ] Lint queue on touched files
