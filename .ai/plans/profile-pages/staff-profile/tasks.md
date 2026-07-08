# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Staff Profile

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md).

## Layer 1 — Types
- [x] Read `backend/types/AGENTS.md`
- [x] Add `StaffPermissionGroupReturnType`, `StaffPermissionOverrideReturnType`
- [x] Extend `UnifiedProfileReturnType` with permission arrays for staff
- [x] Fix `UpdateUserProfileInput.staff` to include `status` in types (already there — verify pothos matches)
- [x] `bun tsgo`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [x] N/A — permissions tables exist

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [x] Read `backend/db/repo/AGENTS.md`
- [x] Add repo methods: load permission groups + overrides by userId
- [x] Join `user_permission_groups` → `permission_groups`

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [x] Load permission data in `ProfileService.getProfileByUserId` for staff audience
- [x] Wire `updateUserProfile.staff.status` in ProfileService
- [x] Permission gating: admin edit only for status

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [x] Fix `StaffAdminProfileUpdateInput` pothos object — include `status` (currently reuses own input)
- [x] Add permission group/override object types from `@/backend/types`
- [x] Resolvers → services only

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [x] Verify profile query/mutation resolvers

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
- [x] Add permission groups to staff profile selection in `profile.documents.ts`
- [x] Add `status` to `updateUserProfile.staff` mutation input

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
- [x] Extend gql generated types only if UI needs extra view-model fields

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [x] `profile.staff.sections.*` (types, en, ar)

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [x] Depends on [shared-shell](../shared-shell/)
- [x] Create `StaffProfileView.tsx`, `StaffProfileEditForm.tsx`
- [x] Create `PermissionsSection.tsx` (read-only), `RoleSection.tsx`
- [x] Admin edit with status field; mobile from static Stitch fallback
- [x] Empty permissions state per Stitch `3ba3b57f183b4494906bf3aa407f2bef`
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
- [x] Service test: staff admin update with status
- [x] Component test: PermissionsSection hidden for scope=own

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [x] tsgo, biome, lint; Storybook StaffProfileView

### VERIFY — this layer
- [x] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [x] `bun tsgo` passes
- [x] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [x] Auto-fix violations; re-run until clean — do not proceed to next layer
- [x] Do NOT run codescene or sonar-scan
