# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Parent Profile

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Complete each layer before the next.

## Layer 1 — Types
- [ ] Read `backend/types/AGENTS.md`
- [ ] Add `AssociatedStudentReturnType` (or extend parent types) for students grid
- [ ] Extend `UnifiedProfileReturnType` with `associatedStudents` array
- [ ] Verify `ParentAdminProfileUpdateInput` covers all billing fields in spec.md
- [ ] `bun tsgo` on type files

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [ ] N/A — students relation exists

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [ ] Read `backend/db/repo/AGENTS.md`
- [ ] Add or extend parent repo method for associated students by parentId
- [ ] Data access only — no permission checks in repo

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [ ] Read `backend/services/AGENTS.md`
- [ ] Load associated students in `ProfileService.getProfileByUserId`
- [ ] Verify `updateOwnProfile.parent` and `updateUserProfile.parent` (full admin input)
- [ ] Localized errors via `getBackendTranslations`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [ ] Read `backend/graphql/AGENTS.md`
- [ ] Add `associatedStudents` nested type using types from `@/backend/types`
- [ ] No local type definitions in pothos files
- [ ] Expose all parent admin fields; every object has `id`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [ ] Resolvers delegate to ProfileService only

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 7 — Codegen (schema)
- [ ] `bun run generate:gqlSchema` → `bun codegen`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 8 — Documents
- [ ] Read `frontend/graphql/sharedDocuments/AGENTS.md`
- [ ] Add `associatedStudents { id ... }` to `profileByUserId` document
- [ ] Add admin billing fields to mutation selection sets

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

## Layer 10 — Frontend types
- [ ] `type ParentProfileData = NonNullable<Operations.ProfileByUserIdQuery['profileByUserId']>` if needed

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [ ] `profile.parent.sections.*` (types, en, ar)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [ ] Read `frontend/views/AGENTS.md`
- [ ] Depends on [shared-shell](../shared-shell/)
- [ ] Create `ParentProfileView.tsx`, `ParentProfileEditForm.tsx`, sections
- [ ] Integrate AssociatedStudentsGrid layout — pass `associatedStudents` from `profileByUserId`
- [ ] Admin billing edit for scope=other — submit `ParentAdminProfileUpdateInput`
- [ ] Wire core fields in edit form
- [ ] Stitch loading/empty/error states
- [ ] Pass `associatedStudents` from `profileByUserId` into grid — grid must not fetch its own data

### VERIFY — this layer
- [ ] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [ ] Service test: parent admin update with billing fields
- [ ] GraphQL test: associated students on profile query

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [ ] tsgo, biome, lint per file; Storybook ParentProfileView

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

