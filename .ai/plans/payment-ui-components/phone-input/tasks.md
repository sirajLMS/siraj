# Phone Input UI — Tasks

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Lib

- [x] Check `package.json` for phone parsing library; add if missing
- [x] Create `frontend/lib/phone.ts` (re-exports `shared/lib/phone`)
- [x] Create `shared/lib/phone/phone.test.ts` — E.164, region validation, mask
- [x] Gate: `bun tsgo` + `bun run test:ui:components`

## Phase 2 — Display

- [x] Create `PhoneDisplay.tsx` + stories (full, masked, empty, Arabic)
- [x] Update `display/index.ts`

## Phase 3 — Input

- [x] Create `PhoneInput.tsx` + stories (EG, SA, invalid, required, Arabic)
- [x] Update `input/index.ts`

## Phase 4 — i18n

- [x] Add `ui.phoneInput` messages en/ar

## Phase 5 — Verification

- [x] `bun biome:check`
- [ ] Lint queue on touched files
