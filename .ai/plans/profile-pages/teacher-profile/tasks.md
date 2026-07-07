# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Teacher Profile

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Complete each layer before the next.

## Layer 1 — Types (`backend/types/`)
- [ ] Read `backend/types/AGENTS.md`
- [ ] Verify `TeacherOwnProfileReturnType`, `TeacherProfileReturnType`, `TeacherProfileUpdateInputType` cover spec.md fields
- [ ] Extend `profile.types.ts` / `teacher.types.ts` if fields missing (e.g. `status` in admin update)
- [ ] Run `bun tsgo` on changed type files

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [ ] N/A unless new DB columns required by spec gaps (nationality, countryCode)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [ ] N/A — use existing `UserRepository.updateProfileFields`, teacher repos

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 4 — Services (`backend/services/`)
- [ ] Read `backend/services/AGENTS.md`
- [ ] Verify `ProfileService.updateOwnProfile` handles `core` + `teacher.phone/zoomLink`
- [ ] Verify `ProfileService.updateUserProfile` handles full `TeacherProfileUpdateInputType`
- [ ] Add permission gates per spec (own vs admin fields)
- [ ] Mask `nationalId`/`zoomPassword` in service return for admin view
- [ ] Run profile.service tests

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos (`backend/graphql/pothos/`)
- [ ] Read `backend/graphql/AGENTS.md`
- [ ] Ensure pothos uses types from `@/backend/types` — no local definitions
- [ ] Expose all spec fields on `teacherOwnProfile` / `teacherAdminProfile`
- [ ] Wire `updateUserProfile.teacher` input to `TeacherProfileUpdateInputType`
- [ ] Every object exposes `id`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [ ] Verify `profile.query.ts` and `profile.mutation.ts` resolvers delegate to ProfileService only

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 7 — Codegen (schema)
- [ ] `bun run generate:gqlSchema`
- [ ] `bun codegen`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 8 — Documents (`frontend/graphql/sharedDocuments/`)
- [ ] Read `frontend/graphql/sharedDocuments/AGENTS.md`
- [ ] Update `profile.documents.ts` — all teacher fields in selection sets, every object has `id`
- [ ] Use `TypedDocumentNode<Operations.*, Types.*>` pattern

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 9 — Codegen (operations)
- [ ] `bun codegen`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 10 — Frontend types (optional)
- [ ] Only if needed: `type TeacherProfileData = NonNullable<Operations.ProfileByUserIdQuery['profileByUserId']>`
- [ ] Never duplicate backend entity shapes

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [ ] Add `profile.teacher.sections.*` and field labels (types, en, ar)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 12 — UI (`frontend/views/profile/teacher/`)
- [ ] Read `frontend/views/AGENTS.md`, `frontend.instructions.md`
- [ ] Depends on [shared-shell](../shared-shell/) being complete
- [ ] Create section components under `sections/`
- [ ] Extend `TeacherProfileView.tsx` — all view sections per spec
- [ ] Extend `TeacherProfileEditForm.tsx` — wire `core` + own teacher fields
- [ ] Create `TeacherAdminEditForm.tsx` — full admin fields (replace hint stub)
- [ ] Extend `TeacherProfileContainer.tsx` — mutations, refetch, scope routing
- [ ] `AdminOnlySection` hidden when scope=own
- [ ] Loading/empty/error states per Stitch state screen IDs
- [ ] All reads via `useQuery` + `sharedDocuments/`; writes via `useMutation` only
- [ ] No `@/backend/services` or `@/backend/db` imports in profile views
- [ ] Presentational sections receive props from query result — no service calls

### VERIFY — this layer
- [ ] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [ ] `backend/services/profile/profile.service.test.ts` — teacher own + admin
- [ ] `frontend/graphql/test/profile.test.ts` — teacher query fields
- [ ] Component test: AdminOnlySection hidden for scope=own

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [ ] `bun tsgo`, `bun biome:check`, lint queue per touched file
- [ ] Storybook: TeacherProfileView + edit form stories

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

