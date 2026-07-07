# Tasks

> Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md), [ORCHESTRATION.md](../ORCHESTRATION.md), [VERIFY.md](../VERIFY.md).
> Read `.github/instructions/*.instructions.md` for each layer. Use [stitch-assets/](../stitch-assets/) for design.
> Run plan-review before Layer 1 and after Layers 4 + 12.
 — Teacher Banking

Follow [LAYER_PIPELINE.md](../LAYER_PIPELINE.md). Depends on teacher-profile layers 1–9 complete.

## Layer 1 — Types
- [ ] Read `backend/types/AGENTS.md`
- [ ] Add `TeacherBankingSummaryReturnType` — masked fields, verification metadata
- [ ] Add to `UnifiedProfileReturnType` as nullable `bankingSummary`
- [ ] `bun tsgo`

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 2 — Schema / Migration / Seed
- [ ] N/A — `teacher_banking_details_history` exists

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 3 — Repository
- [ ] Read `backend/db/repo/AGENTS.md`
- [ ] Use `TeacherBankingRepository` — active record by teacherId
- [ ] Repo returns raw entities; masking in service layer

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 4 — Services
- [ ] Load banking in ProfileService when scope=other + audience=teacher
- [ ] Mask encrypted fields (beneficiaryName, accountNumber, etc.) before return
- [ ] Permission gate: never return for scope=own
- [ ] Respect banking immutability rules from repository

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 5 — Pothos
- [ ] Add `TeacherBankingSummary` object from `@/backend/types`
- [ ] Nullable on unified profile; admin permission guard on resolver

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 6 — GraphQL ops
- [ ] Resolver delegates to ProfileService

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
- [ ] Add `bankingSummary { id ... }` to profile query (admin paths only)

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
- [ ] Use `Operations.ProfileByUserIdQuery` bankingSummary type directly

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 11 — i18n
- [ ] `profile.banking.*` (types, en, ar)

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 12 — UI
- [ ] Depends on [shared-shell](../shared-shell/) + [teacher-profile](../teacher-profile/)
- [ ] Create `teacher/banking/TeacherBankingTab.tsx`, `TeacherBankingView.tsx`, `TeacherBankingEmptyState.tsx`
- [ ] Tab visible only scope=other in `profileTabs.ts`
- [ ] Mobile layout from static fallback `ccfe165f84ae4bca82b713071d6ffd35`
- [ ] Banking tab data from GraphQL only (`profileByUserId.bankingSummary` or dedicated query + `skip`)

### VERIFY — this layer
- [ ] DATA_POLICY: GraphQL endpoints only — no backend service/repo imports in UI
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 13 — Tests
- [ ] Service test: banking summary null for own scope
- [ ] Service test: masked values for admin scope

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

## Layer 14 — Verification
- [ ] tsgo, biome, lint; Storybook banking view + empty state

### VERIFY — this layer
- [ ] `sub-loop.ts --lifecycle lint` on every file changed this layer
- [ ] `bun tsgo` passes
- [ ] Layer instruction file rules satisfied (see LAYER_PIPELINE.md)
- [ ] Auto-fix violations; re-run until clean — do not proceed to next layer
- [ ] Do NOT run codescene or sonar-scan

