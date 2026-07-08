# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Teacher Profile

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Complete each layer before the next.

## Layer 1 — Types (`backend/types/`)
- [x] Read `backend/types/AGENTS.md`
- [x] Verify `TeacherOwnProfileReturnType`, `TeacherProfileReturnType`, `TeacherProfileUpdateInputType` cover spec.md fields
- [x] Extend `profile.types.ts` / `teacher.types.ts` if fields missing (e.g. `status` in admin update)
- [x] Run `bun tsgo` on changed type files

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [x] N/A unless new DB columns required by spec gaps (nationality, countryCode)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [x] N/A — use existing `UserRepository.updateProfileFields`, teacher repos (extended `hasZoomPassword` select)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 4 — Services (`backend/services/`)
- [x] Read `backend/services/AGENTS.md`
- [x] Verify `ProfileService.updateOwnProfile` handles `core` + `teacher.phone/zoomLink`
- [x] Verify `ProfileService.updateUserProfile` handles full `TeacherProfileUpdateInputType`
- [x] Add permission gates per spec (own vs admin fields)
- [x] Mask `nationalId`/`zoomPassword` in service return for admin view
- [x] Run profile.service tests

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos (`backend/graphql/pothos/`)
- [x] Read `backend/graphql/AGENTS.md`
- [x] Ensure pothos uses types from `@/backend/types` — no local definitions
- [x] Expose all spec fields on `teacherOwnProfile` / `teacherAdminProfile`
- [x] Wire `updateUserProfile.teacher` input to `TeacherProfileUpdateInputType`
- [x] Every object exposes `id`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [x] Verify `profile.query.ts` and `profile.mutation.ts` resolvers delegate to ProfileService only

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 7 — Codegen (schema)
- [x] `bun run generate:gqlSchema`
- [x] `bun codegen`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 8 — Documents (`frontend/graphql/sharedDocuments/`)
- [x] Read `frontend/graphql/sharedDocuments/AGENTS.md`
- [x] Update `profile.documents.ts` — all teacher fields in selection sets, every object has `id`
- [x] Use `TypedDocumentNode<Operations.*, Types.*>` pattern

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 9 — Codegen (operations)
- [x] `bun codegen`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 10 — Frontend types (optional)
- [x] Only if needed: `type TeacherProfileData = NonNullable<Operations.ProfileByUserIdQuery['profileByUserId']>`
- [x] Never duplicate backend entity shapes

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [x] Add `profile.teacher.sections.*` and field labels (types, en, ar)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 12 — UI (`frontend/views/profile/teacher/`)
- [x] Read `frontend/views/AGENTS.md`, `frontend.instructions.md`
- [x] Depends on [shared-shell](../shared-shell/) being complete
- [x] Create section components under `sections/`
- [x] Extend `TeacherProfileView.tsx` — all view sections per spec
- [x] Extend `TeacherProfileEditForm.tsx` — wire `core` + own teacher fields
- [x] Create `TeacherAdminEditForm.tsx` — full admin fields (replace hint stub)
- [x] Extend `TeacherProfileContainer.tsx` — mutations, refetch, scope routing
- [x] `AdminOnlySection` hidden when scope=own
- [x] Loading/empty/error states per Stitch state screen IDs
- [x] All reads via `useQuery` + `sharedDocuments/`; writes via `useMutation` only
- [x] No `@/backend/services` or `@/backend/db` imports in profile views
- [x] Presentational sections receive props from query result — no service calls

### VERIFY — this layer
- [x] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [x] `backend/services/profile/teacher-profile.service.test.ts` — teacher own + admin
- [x] `frontend/graphql/sharedDocuments/profile.documents.test.ts` — teacher query fields
- [x] Component test: AdminOnlySection hidden for scope=own

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [x] `bun tsgo`, `bun biome:check`, lint queue per touched file
- [x] Storybook: TeacherProfileView + edit form stories

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan
