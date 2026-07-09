# Phone Input UI — Tasks

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Lib

- [ ] Check `package.json` for phone parsing library; add if missing
- [ ] Create `frontend/lib/phone.ts`
- [ ] Create `frontend/lib/phone.test.ts` — E.164, region validation, mask
- [ ] Gate: `bun tsgo` + `bun run test:ui:components`

## Phase 2 — Display

- [ ] Create `PhoneDisplay.tsx` + stories (full, masked, empty, Arabic)
- [ ] Update `display/index.ts`

## Phase 3 — Input

- [ ] Create `PhoneInput.tsx` + stories (EG, SA, invalid, required, Arabic)
- [ ] Update `input/index.ts`

## Phase 4 — i18n

- [ ] Add `ui.phoneInput` messages en/ar

## Phase 5 — Verification

- [ ] `bun biome:check`
- [ ] Lint queue on touched files
