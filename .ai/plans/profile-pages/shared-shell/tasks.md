# Tasks — Shared Profile Shell

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before starting.

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). This module skips backend layers.

## Layer 14 — i18n
- [x] Read `shared/messages/types/profile.ts` for existing keys
- [x] Add `profile.shell.*` to `shared/messages/types/profile.ts`
- [x] Add English strings to `shared/messages/en.ts`
- [x] Add Arabic strings to `shared/messages/ar/profile.ts`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 15 — UI (`frontend/views/profile/core/`)
- [x] Read `frontend/views/AGENTS.md` + `frontend.instructions.md` before editing
- [x] Create `profileTabs.ts` — tab definitions + visibility by audience/scope
- [x] Create `ProfileTabNav.tsx` — horizontal scroll mobile, tabs desktop
- [x] Create `ProfileHeader.tsx` — avatar, name, email, role badge
- [x] Create `ProfileSkeleton.tsx` — section card skeletons
- [x] Extend `ProfileShell.tsx` — integrate header, tabs, skeleton, error retry
- [x] Extend `ProfileActionBar.tsx` — optional cancel/save for edit mode
- [x] Wire `?tab=` query param in ProfilePageClient or containers
- [x] Mobile responsive layout per spec.md
- [x] ProfileShell/tab chrome: no `useQuery`/`useMutation` — props from GraphQL-backed containers only

### VERIFY — this layer
- [x] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 17 — Tests
- [x] Component test: ProfileTabNav hides Banking for teacher own scope
- [x] Component test: ProfileTabNav shows Permissions for staff admin only

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 18 — Verification
- [x] `bun tsgo` on touched files
- [x] `bun biome:check` on touched files
- [x] Lint queue on touched files
- [x] Storybook: `ProfileShell.stories.tsx` (loading/error/loaded)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan
