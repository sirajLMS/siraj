# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Assigned Students

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Depends on teacher-profile layers 1–9.

## Layer 1 — Types
- [ ] Verify `TeacherAssignedStudentReturnType`, `TeacherAssignedStudentsResult` in `teacher.types.ts`
- [ ] Add to `UnifiedProfileReturnType` as `assignedStudents`
- [ ] `bun tsgo`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 2–3 — Schema / Repository
- [ ] N/A — use existing teacher assignment queries in service/repo

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [ ] Load assigned students in ProfileService (scope=other, audience=teacher)
- [ ] Support pagination args if grid requires it
- [ ] Permission gate: hidden for own scope

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [ ] Add assigned students list type from `@/backend/types`
- [ ] Nested on unified profile with `id` on each row

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [ ] Resolver → ProfileService

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
- [ ] Add `assignedStudents { rows { id name ... } totalCount }` to profile query

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
- [ ] Import row type from `Operations.ProfileByUserIdQuery`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [ ] `profile.students.*` (types, en, ar)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [ ] Depends on [shared-shell](../shared-shell/) + [teacher-profile](../teacher-profile/)
- [ ] Create `AssignedStudentsTab.tsx`, `AssignedStudentsDataGrid.tsx`, `AssignedStudentsCardList.tsx`
- [ ] Grade filter, pagination footer
- [ ] Tab in `profileTabs.ts` — teacher admin only
- [ ] Loading/empty/error per Stitch IDs
- [ ] Assigned students from GraphQL only (`profileByUserId.assignedStudents` or dedicated query + `skip`)

### VERIFY — this layer
- [ ] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [ ] GraphQL test: assigned students on admin teacher profile
- [ ] Component test: tab hidden for own scope

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [ ] tsgo, biome, lint; Storybook grid with sample rows

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

