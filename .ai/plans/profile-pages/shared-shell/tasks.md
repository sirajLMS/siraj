# Tasks — Shared Profile Shell

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before starting.

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). This module skips backend layers.

## Layer 14 — i18n
- [ ] Read `shared/messages/types/profile.ts` for existing keys
- [ ] Add `profile.shell.*` to `shared/messages/types/profile.ts`
- [ ] Add English strings to `shared/messages/en.ts`
- [ ] Add Arabic strings to `shared/messages/ar/profile.ts`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 15 — UI (`frontend/views/profile/core/`)
- [ ] Read `frontend/views/AGENTS.md` + `frontend.instructions.md` before editing
- [ ] Create `profileTabs.ts` — tab definitions + visibility by audience/scope
- [ ] Create `ProfileTabNav.tsx` — horizontal scroll mobile, tabs desktop
- [ ] Create `ProfileHeader.tsx` — avatar, name, email, role badge
- [ ] Create `ProfileSkeleton.tsx` — section card skeletons
- [ ] Extend `ProfileShell.tsx` — integrate header, tabs, skeleton, error retry
- [ ] Extend `ProfileActionBar.tsx` — optional cancel/save for edit mode
- [ ] Wire `?tab=` query param in ProfilePageClient or containers
- [ ] Mobile responsive layout per spec.md
- [ ] ProfileShell/tab chrome: no `useQuery`/`useMutation` — props from GraphQL-backed containers only

### VERIFY — this layer
- [ ] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 17 — Tests
- [ ] Component test: ProfileTabNav hides Banking for teacher own scope
- [ ] Component test: ProfileTabNav shows Permissions for staff admin only

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 18 — Verification
- [ ] `bun tsgo` on touched files
- [ ] `bun biome:check` on touched files
- [ ] Lint queue on touched files
- [ ] Storybook: `ProfileShell.stories.tsx` (loading/error/loaded)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

