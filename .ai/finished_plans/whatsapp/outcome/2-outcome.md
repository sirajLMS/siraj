# Task 2 — Env-config registry (REQ-3)

## Subtasks completed

### 2.1 — `backend/lib/env-config-keys.ts`
- Added `"whatsapp"` to `EnvConfigCategory` union type.
- Added 6 WhatsApp key descriptors to `ENV_CONFIG_KEYS` array:
  | Key | Secret | Display Strategy | excludeFromDb |
  |-----|--------|-----------------|---------------|
  | WHATSAPP_PROVIDER | no | plain | false |
  | WHATSAPP_APP_ID | no | plain | false |
  | WHATSAPP_APP_SECRET | yes | db_with_mask_only | false |
  | WHATSAPP_VERIFY_TOKEN | yes | db_with_mask_only | false |
  | WHATSAPP_WABA_ID | no | plain | false |
  | WHATSAPP_WEBHOOK_BASE_URL | no | plain | false |
- All 6 keys are DB-manageable (`excludeFromDb: false`), so none are added to `HIDDEN_ENV_CONFIG_KEYS`.
- Bilingual descriptions (en/ar) for all 6 keys.
- `HIDDEN_ENV_CONFIG_KEYS` re-export untouched.

### 2.2 — `backend/types/shared/env-config.types.ts`
- Added `"whatsapp"` to `EnvConfigCategory` union to keep it in sync with the lib copy.
- This is a documented deliberate duplication (file comment lines 10-13) to keep the types layer free of runtime imports.

### 2.3 — Quality loop
- `bun tsgo` — exit 0 (clean)
- `bun biome:check` — exit 0, no fixes applied
- lint-queue-client on both files — exit 0

### 2.4 — AGENTS.md/instruction compliance
- **backend/AGENTS.md**: No violations. Logging rules N/A (no logging in config descriptors). i18n rules N/A (descriptions are bilingual data, not runtime error strings). Import alias pattern followed (`@/shared/constants/env-config-keys`).
- **backend/types/AGENTS.md**: No violations. `EnvConfigCategory` is a shared config union type (not a Drizzle entity type), consistent with existing pattern. No duplicate type definitions.
- **.agents/instructions/backend.instructions.md**: No violations. Single canonical type pattern maintained; no local type definitions in service/Pothos files.

## Files modified
- `backend/lib/env-config-keys.ts` — added `"whatsapp"` category + 6 key descriptors
- `backend/types/shared/env-config.types.ts` — added `"whatsapp"` to `EnvConfigCategory` union

## Files also modified
- `environment.d.ts` — added 6 `WHATSAPP_*` env var declarations to `NodeJS.ProcessEnv` interface, keeping it in sync with the registry per the `env-config-keys.ts` header directive ("Keep this array in sync with environment.d.ts whenever new env keys are added").

## Files NOT modified (out of scope)
- `shared/constants/env-config-keys.ts` — no WhatsApp key is `excludeFromDb: true`
- `backend/lib/env-config-keys.test.ts` — existing test passes (only filters `excludeFromDb: true`)

## CodeScene verification (per-file)
- `backend/lib/env-config-keys.ts` — health score: 10.00 (perfect) ✅
- `backend/types/shared/env-config.types.ts` — health score: 10.00 (perfect) ✅
- `environment.d.ts` — health score: N/A (perfect) ✅

## Review-uncommitted (6-track)
All 6 tracks CLEAN. One finding (duplication track):
- Arabic description for WHATSAPP_VERIFY_TOKEN contained stray Spanish word "verificar" — fixed to `"رمز التحقق لـ GET webhook في واتساب."`.
- Review plan: `.ai/plans/task2-review-plan.md`
- Plan validated via `plan-review` skill — passes all AGENTS.md rules for affected layers.

## Non-Negotiable Execution Protocol compliance

| Step | Status | Evidence |
|------|--------|----------|
| 1. Pre-Execution Outcome Read | ✅ | Read `task-1-outcome.md` before starting Task 2 |
| 2. Per-File Quality Loop | ✅ | tsgo + biome + lint-queue-client run on each file after edit |
| 3. Global Health Check | ✅ | `bun tsgo` exit 0, `bun biome:check` clean, `bun run lint` exit 0 |
| 4. Post-Execution Outcome File | ✅ | This file (updated with CodeScene + review results) |
| 5. Task Progress Tracking | ✅ | Subtasks 2.1–2.4 marked `[x]` in `trackable-tasks.md` |

## Carry-over knowledge for later tasks
- `environment.d.ts` MUST be updated whenever new env keys are added to `ENV_CONFIG_KEYS` (per `env-config-keys.ts` header directive).
- `EnvConfigCategory` is deliberately duplicated between `backend/lib/env-config-keys.ts` and `backend/types/shared/env-config.types.ts` — both copies must stay in sync.
- `isSecret: true` must always pair with `displayStrategy: "db_with_mask_only"`.
- `excludeFromDb: true` keys must also be added to `HIDDEN_ENV_CONFIG_KEYS` in `shared/constants/env-config-keys.ts`.
- All 6 WhatsApp keys are DB-manageable (`excludeFromDb: false`), meaning they can be overridden via the `system_settings` table at runtime.
