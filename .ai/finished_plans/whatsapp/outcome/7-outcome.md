# Task 7 Outcome — Database schema (REQ-3, R2/R3/R8, B4, B5, Q5)

## Summary

Created the `whatsapp_accounts` Drizzle table with hybrid credential storage (REQ-3), Meta tier fields stored as raw varchar (Q5), `updatedAt` auto-update hook (B4), and a partial index on `notification_deliveries.provider_message_id` (B5). Added the 3 WhatsApp admin permissions to the `AppPermission` TS enum and applied them via two-phase custom migrations (8a enum + 8b data) with super_admin grants. All quality gates pass and schema is synced to the database.

## Files Created

| File | Purpose |
|------|---------|
| `backend/db/schema/whatsapp/whatsapp-accounts.ts` | `whatsappAccounts` pgTable with all columns per implementation.md §2.1 |
| `backend/db/schema/whatsapp/index.ts` | Barrel export for whatsapp sub-directory |
| `backend/db/migration/8a-whatsapp-permissions-enum.sql` | Phase 1: `ALTER TYPE app_permission ADD VALUE IF NOT EXISTS` for 3 WhatsApp permissions |
| `backend/db/migration/8b-whatsapp-permissions-data.sql` | Phase 2: INSERT permission rows + super_admin grants (trigger disabled/enabled around inserts) |

## Files Modified

| File | Change |
|------|--------|
| `backend/db/schema/index.ts` | Added `export * from "./whatsapp";` barrel export |
| `backend/db/schema/communications/communications.ts` | Replaced full index with partial index `.where(sql\`${table.providerMessageId} IS NOT NULL\`)` (B5) |
| `backend/enum/permissions/permission.enum.ts` | Added `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE` to `AppPermission` enum |

## Auto-Generated Artifacts

The `bun db migrate` command auto-bundled the custom migration SQL files into drizzle migration folders:
- `backend/drizzle/20260731224523_custom_8a-whatsapp-permissions-enum/`
- `backend/drizzle/20260731224524_custom_8b-whatsapp-permissions-data/`
- `backend/drizzle/.custom-migrations.json` was auto-updated by the migration runner

## Schema Design Decisions

### Hybrid Credential Storage (REQ-3)
- `encryptedAccessToken` and `encryptedTwoStepPin` use the `encryptedText` custom Drizzle type from `custom-types.ts`
- This auto-encrypts on write and auto-decrypts on read via `field-encryption.ts`
- Global webhook secrets (app secret, verify token) remain in env-config, not per-account

### Meta Tier Fields (Q5)
- `portfolioMessagingLimitTier` is `varchar(32)` — stores raw Meta enum string verbatim (UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET)
- `throughputLevel` is `varchar(16)` — stores STANDARD / COEXISTENCE / HIGH
- No PostgreSQL enum created — values are stored as-is for exact tier-budget accounting

### updatedAt Auto-Update (B4)
- `updatedAt` uses `.$onUpdate(() => new Date())` so the repository layer never needs to set it manually

### Partial Index (B5)
- `notification_deliveries_provider_message_id_idx` changed from full index to partial index with `WHERE provider_message_id IS NOT NULL`
- This avoids indexing NULL rows (the vast majority of deliveries have no provider message ID)

### Permissions (BL2)
- 3 permissions added: `whatsapp.view`, `whatsapp.config_manage`, `whatsapp.templates_manage`
- `whatsapp.dispatch` intentionally omitted — no send-mutation exists in v1
- Two-phase migration pattern (8a enum + 8b data) mirrors the 7a/7b precedent to satisfy PostgreSQL's `check_safe_enum_use` constraint

### AppPermission Enum Fix
- The `AppPermission` TypeScript enum needed the 3 WhatsApp values added to match the DB enum values introduced by 8a
- Without this, `bun db push` failed with `invalid input value for enum app_permission: "whatsapp.view"` because drizzle-kit's schema-derived enum values didn't include the new ones

## Verification

- `bun tsgo` ✅
- `bun biome:check` ✅ (5 files checked, no fixes needed)
- `bun lint` ✅ (full repo via lint queue server, port 4777)
- `bun db migrate` ✅ — 2 migration folders applied (8a + 8b)
- `bun db push` ✅ — `whatsapp_accounts` table created, partial index applied

## AGENTS.md Compliance

- `backend/db/schema/AGENTS.md`: New sub-directory `whatsapp/` follows the sub-directory convention with its own `index.ts` barrel; top-level barrel updated; `encryptedText` imported from `custom-types.ts` per shared top-level files rule
- `backend/AGENTS.md`: Path aliases used (`@/backend/db/schema/custom-types`, `@/shared/types/localized-string`); no raw SQL DDL in schema files; drizzle ORM only
- `backend/db/test/AGENTS.md`: Migration SQL files are idempotent (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`, `ON CONFLICT DO NOTHING`); trigger disable/enable wrapped in `DO $$ ... EXCEPTION` blocks
