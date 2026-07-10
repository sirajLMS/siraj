# Catalog Image Upload — Tasks

## Phase 0 — Planning

- [x] Create `spec.md`
- [x] Create `plan.md`
- [x] Create `tasks.md`

## Phase 1 — Component

- [x] Create `frontend/components/ui/input/CatalogImageUpload.tsx`
- [x] Implement preview, file pick, type/size validation, remove
- [x] Optional `allowUrlFallback` URL TextField
- [x] Gate: `bun tsgo`

## Phase 2 — Storybook

- [x] Create `CatalogImageUpload.stories.tsx` — WithUrl, MockUpload, ValidationError, UrlFallback, Arabic
- [x] Update `frontend/components/ui/input/index.ts`

## Phase 3 — i18n

- [x] Add `ui.catalogImageUpload` messages (en + ar + types)

## Phase 4 — Verification

- [x] `bun biome:check`
- [x] Lint queue on touched files
