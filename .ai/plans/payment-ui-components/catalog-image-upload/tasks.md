# Catalog Image Upload — Tasks

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Component

- [ ] Create `frontend/components/ui/input/CatalogImageUpload.tsx`
- [ ] Implement preview, file pick, type/size validation, remove
- [ ] Optional `allowUrlFallback` URL TextField
- [ ] Gate: `bun tsgo`

## Phase 2 — Storybook

- [ ] Create `CatalogImageUpload.stories.tsx` — WithUrl, MockUpload, ValidationError, UrlFallback, Arabic
- [ ] Update `frontend/components/ui/input/index.ts`

## Phase 3 — i18n

- [ ] Add `ui.catalogImageUpload` messages (en + ar + types)

## Phase 4 — Verification

- [ ] `bun biome:check`
- [ ] Lint queue on touched files
