# Task 9 Outcome — WhatsApp Account Service

## Summary

Implemented `WhatsappAccountService` with full CRUD, Meta sync, credential management, and per-user opt-in helpers. All quality gates pass.

## Subtasks Completed

### 9.1 — Service file (`backend/services/whatsapp/whatsapp-account.service.ts`)
- **CRUD**: `listAccounts`, `getAccount`, `createAccount`, `updateAccount`, `deleteAccount` — gated by `WHATSAPP_VIEW` / `WHATSAPP_CONFIG_MANAGE` via `PermissionsService.hasPermission`
- **`syncFromMeta()`**: Cursor-paginated `collectAllPhoneNumbers` + per-ID `buildGetPhoneNumberRequest` to enrich with `portfolioMessagingLimitTier` (stored verbatim, Q5). Also calls `collectAllTemplates` and snapshots `{ name, language, category, status }` onto audit metadata (BL3)
- **`setAccessToken` / `setTwoStepPin`**: Pass plaintext to repository (encryptedText custom type auto-encrypts at driver boundary). Audit logs use `***` for sensitive values. Calls `resetWhatsappChannel()` after each (S4)
- **`isUserWhatsappOptIn(userId)`** / **`setUserWhatsappOptIn(actorUserId, tErrors, userId, enabled, source)`**: Uses existing `NotificationPreferencesRepository` with `NotificationChannel.WHATSAPP` across all `NotificationEventType` values (REQ-10/BL1). Audit entry uses `STATUS_CHANGE` action
- **i18n compliance**: All error messages use `tErrors: ErrorsLabels` parameter (typed translation system). New keys added: `whatsappAccountNotFound`, `whatsappAccessTokenNotConfigured`, `whatsappWabaIdNotConfigured`

### 9.2 — Service barrel (`backend/services/whatsapp/index.ts`)
- Exports `WhatsappAccountService` namespace

### 9.3 — Audit entity type (`backend/types/audit/audit.types.ts`)
- Added `"WHATSAPP_ACCOUNT"` to `AuditEntityType` union

### 9.4 — Per-user opt-in storage
- Uses existing `userNotificationPreferences` table and `NotificationPreferencesRepository.batchUpsert` — no schema changes needed. `WHATSAPP` channel already in `NotificationChannel` enum. Sets preferences for all `NotificationEventType` values.

### 9.5 — Quality loop
- `bun tsgo` ✅ (exit 0)
- `bun biome:check` ✅ (no fixes needed)
- `bun lint` (full repo via queue) ✅ (exit 0)

### 9.6 — AGENTS.md compliance
- **`backend/services/AGENTS.md`**: i18n rule satisfied (all error messages use typed translations via `tErrors: ErrorsLabels`). Namespace pattern followed (`export namespace WhatsappAccountService`). Types imported from `@/backend/types`.
- **`backend/AGENTS.md`**: Applicable rules followed.
- **`.agents/instructions/backend.instructions.md`**: Applicable rules followed.

## Files Modified
1. `backend/services/whatsapp/whatsapp-account.service.ts` — New (350 lines)
2. `backend/services/whatsapp/index.ts` — New (barrel)
3. `backend/services/index.ts` — Added `export * from "@/backend/services/whatsapp";`
4. `backend/types/audit/audit.types.ts` — Added `"WHATSAPP_ACCOUNT"` to `AuditEntityType`
5. `shared/locale/types/errors/index.ts` — Added `whatsappAccountNotFound`, `whatsappAccessTokenNotConfigured`, `whatsappWabaIdNotConfigured`
6. `shared/locale/en/errors/index.ts` — English translations for new keys
7. `shared/locale/ar/errors/index.ts` — Arabic translations for new keys
8. `.ai/plans/whatsapp/trackable-tasks.md` — Task 9 checkboxes marked

## Spec Compliance
- **REQ-4**: `syncFromMeta` discovers and syncs phone numbers from Meta
- **REQ-10/BL1**: Per-user opt-in via notification preferences
- **BL3**: Template snapshot in audit metadata
- **S4**: `resetWhatsappChannel()` called after credential/config changes
- **P2**: Cursor pagination via `collectAllPhoneNumbers` / `collectAllTemplates`
- **Q5**: `portfolioMessagingLimitTier` stored verbatim from Meta response
