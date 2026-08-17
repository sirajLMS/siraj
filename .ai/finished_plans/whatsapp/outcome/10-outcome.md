# Task 10 Outcome — Permissions Migration

## Summary

Task 10 was completed as part of Task 7 (database schema + permissions) in a prior session. All subtasks verified:

## Subtasks Completed (verified — all pre-existing)

### 10.1 — Permission enum (`backend/enum/permissions/permission.enum.ts`)
- Three `WHATSAPP_*` permissions present (lines 249-252): `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE`
- `WHATSAPP_DISPATCH` intentionally omitted (BL2: no send-mutation in v1)
- Comment documenting the BL2 decision: `// WhatsApp admin (BL2: no whatsapp.dispatch — no send-mutation in v1)`

### 10.2 — Enum migration (`backend/db/migration/8a-whatsapp-permissions-enum.sql`)
- `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS` for all three permissions
- Split into 8a (enum) / 8b (data) to satisfy `check_safe_enum_use` constraint

### 10.3 — Data migration (`backend/db/migration/8b-whatsapp-permissions-data.sql`)
- Inserts 3 permission rows into `permissions` table with localized descriptions (en/ar)
- Disables/re-enables `trg_protect_system_permissions` trigger around INSERTs
- Grants all 3 permissions to `super_admin` group via `group_permissions`
- Uses `ON CONFLICT (key) DO UPDATE` for idempotency

### 10.4 — Custom migrations config (`backend/drizzle/.custom-migrations.json`)
- Both `8a-whatsapp-permissions-enum.sql` and `8b-whatsapp-permissions-data.sql` registered with SHA256 hashes
- Applied folder entries present: `20260731224523_custom_8a-whatsapp-permissions-enum`, `20260731224524_custom_8b-whatsapp-permissions-data`

### 10.5-10.7 — Quality, AGENTS.md compliance
- Enum and migrations follow the 7a/7b pattern. Quality was already verified in Task 7's outcome.

## Files (all pre-existing)
1. `backend/enum/permissions/permission.enum.ts` — 3 WhatsApp permissions added
2. `backend/db/migration/8a-whatsapp-permissions-enum.sql` — 16 lines
3. `backend/db/migration/8b-whatsapp-permissions-data.sql` — 70 lines
4. `backend/drizzle/.custom-migrations.json` — Entries for both migration files
