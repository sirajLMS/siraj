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

## Files NOT modified (out of scope)
- `shared/constants/env-config-keys.ts` — no WhatsApp key is `excludeFromDb: true`
- `environment.d.ts` — not a Task 2 subtask; registry is canonical
- `backend/lib/env-config-keys.test.ts` — existing test passes (only filters `excludeFromDb: true`)
