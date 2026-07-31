# Uncommitted Changes Review Plan

**Date**: 2026-07-31
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: Full depth — security, performance, business logic, deploy safety, duplication, dead code
**Files Reviewed**: 42 changed files (excluding 24K-line generated snapshot.json)

## Summary

The uncommitted changes extend the `NotificationChannel` enum with `WHATSAPP`, replace the redundant `CommunicationChannelType` string union with the enum directly, eliminate hardcoded English/Arabic strings via i18n, and add notification preference UI plumbing. Three critical issues require immediate attention: a migration SQL that will fail on deploy, an unhandled WHATSAPP dispatch path with the exhaustiveness guard removed, and a dead re-export creating unnecessary public surface.

## Findings

### CRITICAL (3)

- [x] **[CRITICAL] deploy-safety: migration.sql:1-7** — The migration wraps `ALTER TYPE "notification_channel" ADD VALUE 'WHATSAPP'` in a `DO $$ ... $$` block. PostgreSQL rejects `ALTER TYPE ... ADD VALUE` inside a transaction block (a DO block runs in an implicit transaction). This migration will fail on deploy.
  → Fix: Replace the DO block with `ALTER TYPE "notification_channel" ADD VALUE IF NOT EXISTS 'WHATSAPP';` (PG12+ safe form).

- [x] **[CRITICAL] business-logic/deploy-safety: notificationDeliveries.enum.ts:6 + communication.service.ts:69-86** — `NotificationChannel.WHATSAPP` added but `CommunicationService.dispatch()` has no `case NotificationChannel.WHATSAPP:` branch. The exhaustiveness guard `const _exhaustiveCheck: never = payload.channel` was replaced with a runtime `default` that logs+fails. WHATSAPP payloads fall into the default branch. Additionally, `getEventChannels()` returns `[...ALL_ENUM_CHANNELS]` which now includes WHATSAPP for non-allowlisted events.
  → Fix: Restore the `never` exhaustiveness check (`const _exhaustiveCheck: never = payload.channel`) and add a `case NotificationChannel.WHATSAPP:` stub that throws or logs "not implemented" — this makes the missing implementation a compile error rather than a silent runtime failure. Exclude WHATSAPP from `ALL_ENUM_CHANNELS` in notification-dispatch.helpers.ts until a provider exists.

- [x] **[CRITICAL] dead-code/duplication: utils.ts:4** — `export { getServerTranslations };` is an orphaned re-export. No file imports `getServerTranslations` from `@/backend/services/communication/utils` — all callers import directly from `@/shared/locale` or `@/shared/locale/server-graphql`. The utils.ts file only uses `getServerTranslations` internally.
  → Fix: Remove the `export { getServerTranslations }` line. Keep the import for internal use.

### WARNING (8)

- [x] **[WARNING] business-logic/deploy-safety: utils.ts:11** — `deliveryFailedMessage(channel, locale)` now interpolates the raw uppercase enum string ("EMAIL delivery failed") instead of the previous friendly names ("Email delivery failed / Push notification delivery failed"). The `CHANNEL_LABELS` friendly-name map was dropped.
  → Fix: Add localized channel label keys registered across `shared/locale/types/errors/index.ts` + `shared/locale/en/errors/index.ts` + `shared/locale/ar/errors/index.ts` ( Namespace Registration symmetry per shared/AGENTS.md). Pass the localized label string to the translation function instead of the raw uppercase enum value.

- [x] **[WARNING] duplication: suggestion.service.ts:318/322** — Duplicated `getServerTranslations(locale ?? "en").errorsTranslations` call within `markAsDuplicate` — the inner call at line 318 is redundant since the function-level binding at line 322 covers the permission check path.
  → Fix: Remove the inner redundant `getServerTranslations` call at line 318, use the function-scoped `tErrors` binding.

- [x] **[WARNING] duplication: shared/locale/types/errors/index.ts:309-317** — `suggestionAlreadyDuplicate` locale key added to type interface and both ar/en locale bundles but is NOT referenced anywhere in `backend/`. Dead translation string.
  → Fix: Remove `suggestionAlreadyDuplicate` from types, en, and ar files, or wire it up.

- [x] **[WARNING] duplication: shared/locale/types/errors/index.ts:308-309** — `suggestionNotFound` and `suggestionNotFoundWithMessage` have IDENTICAL English and Arabic text ("Suggestion not found."). `suggestionNotFoundWithMessage` is misleading — it has no message interpolation.
  → Fix: Consolidate into a single `suggestionNotFound` key. Remove `suggestionNotFoundWithMessage` from types, en, and ar. Update `suggestion.service.ts` callers to use `tErrors.suggestionNotFound`.

- [x] **[WARNING] duplication: preferencesChannelTabs.mobile.tsx + useNotificationPreferencesTabViewModel.ts** — Both files define identical `CHANNEL_ORDER` arrays (5-element Email→Whatsapp→Push→OnApp→Sms). Drift risk if channel order changes.
  → Fix: Move `CHANNEL_ORDER` to `notificationPreferenceUtils.ts` and import from both files. Ensure the util imports `NotificationChannel` from the GraphQL codegen `@/frontend/common/graphql/generated/gql/graphql-types`, NOT from `@/backend/enum` (per backend/enum/AGENTS.md "Backend-Only" and shared/AGENTS.md layer isolation).

- [x] **[WARNING] deploy-safety: migration.sql:1-7** — No down/rollback migration for the enum value addition. Once applied, the WHATSAPP enum label persists even if the feature is rolled back.
  → Fix: Document that this is conventional for additive enum changes (no action needed beyond documentation).

- [x] **[WARNING] business-logic: complaintResponses.service.ts:33** — `dispatchResponseNotifications` eager-loads translations unconditionally before any path checks. Functionally benign (synchronous in-memory lookup) but changes from lazy to eager evaluation.
  → Fix: Move the `getServerTranslations` call inside the `if (response.emailSent)` block and the final dispatch block where it's actually needed.

- [ ] **[WARNING] duplication: suggestion.service.ts:274/61 + complaintResponses.service.ts:51-77** — 5+ inline `CommunicationService.dispatch` calls build the same `{ userId, title, body, channel, eventType, metadata }` object literal. This is the broader architectural duplication the `notification-payloads.builders.ts` was meant to eliminate.
  → Fix: Out of scope for this review — these are legacy direct-dispatch sites. Flag for future extraction.

### SUGGESTION (2)

- [ ] **[SUGGESTION] duplication: complaint.service.ts** — ~16 repeated `getServerTranslations(locale ?? "en").errorsTranslations` calls. Consider a module-scoped helper function to dedupe the `?? "en"` boilerplate.
  → Fix: Out of scope — cosmetic refactor, not a bug.

- [ ] **[SUGGESTION] duplication: notificationPreferencesConstants.tsx:13** — `NOTIFICATION_CHANNEL_ICONS` and `NOTIFICATION_CHANNEL_ACCENTS` maps are defined in parallel with identical key sets. A single tuple could reduce maintenance.
  → Fix: Out of scope — current typed-record approach is safe.

## Layer Compliance Notes

- **AGENTS.md i18n rule**: All new error strings use `tErrors.*` and notification titles use `tNotifications.*` — COMPLIANT
- **AGENTS.md enum rule**: `CommunicationChannelType` removed, all usages replaced with `NotificationChannel` enum — COMPLIANT
- **AGENTS.md no-duplicate-enums rule**: No duplicate enums created — COMPLIANT
- **AGENTS.md no-hardcoded-colors**: Frontend uses theme constants — COMPLIANT
- **Migration safety**: Migration SQL has a PG transaction-block issue that needs fixing before deploy
- **plan-review validation**: Plan passes all AGENTS.md rules for affected layers
- **i18n key registration**: WARNING-1 fix must register channel label keys across types + en + ar (shared/AGENTS.md Namespace Registration)
- **Frontend enum source**: WARNING-5 fix must use codegen `@/frontend/common/graphql/generated/gql/graphql-types` for `NotificationChannel`, not `@/backend/enum`

## Fix Status

- Total findings: 13
- Fixed: 0 / 13
- Remaining: 13
- Out of scope (flagged for future): 2
