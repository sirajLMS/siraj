# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Parent Profile

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Complete each layer before the next.

## Layer 1 — Types
- [x] Read `backend/types/AGENTS.md`
- [x] Add `AssociatedStudentReturnType` (or extend parent types) for students grid
- [x] Extend `UnifiedProfileReturnType` with `associatedStudents` array
- [x] Verify `ParentAdminProfileUpdateInput` covers all billing fields in spec.md
- [x] `bun tsgo` on type files

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [x] N/A — students relation exists

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [x] Read `backend/db/repo/AGENTS.md`
- [x] Add or extend parent repo method for associated students by parentId
- [x] Data access only — no permission checks in repo

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [x] Read `backend/services/AGENTS.md`
- [x] Load associated students in `ProfileService.getProfileByUserId`
- [x] Verify `updateOwnProfile.parent` and `updateUserProfile.parent` (full admin input)
- [x] Localized errors via `getBackendTranslations`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [x] Read `backend/graphql/AGENTS.md`
- [x] Add `associatedStudents` nested type using types from `@/backend/types`
- [x] No local type definitions in pothos files
- [x] Expose all parent admin fields; every object has `id`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [x] Resolvers delegate to ProfileService only

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 7 — Codegen (schema)
- [x] `bun run generate:gqlSchema` → `bun codegen`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 8 — Documents
- [x] Read `frontend/graphql/sharedDocuments/AGENTS.md`
- [x] Add `associatedStudents { id ... }` to `profileByUserId` document
- [x] Add admin billing fields to mutation selection sets

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

## Layer 10 — Frontend types
- [x] `type ParentProfileData = NonNullable<Operations.ProfileByUserIdQuery['profileByUserId']>` if needed

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [x] `profile.parent.sections.*` (types, en, ar)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [x] Read `frontend/views/AGENTS.md`
- [x] Depends on [shared-shell](../shared-shell/)
- [x] Create `ParentProfileView.tsx`, `ParentProfileEditForm.tsx`, sections
- [x] Integrate AssociatedStudentsGrid layout — pass `associatedStudents` from `profileByUserId`
- [x] Admin billing edit for scope=other — submit `ParentAdminProfileUpdateInput`
- [x] Wire core fields in edit form
- [x] Stitch loading/empty/error states
- [x] Pass `associatedStudents` from `profileByUserId` into grid — grid must not fetch its own data

### VERIFY — this layer
- [x] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [x] Service test: parent admin update with billing fields
- [x] GraphQL test: associated students on profile query

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [x] tsgo, biome, lint per file; Storybook ParentProfileView

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan
