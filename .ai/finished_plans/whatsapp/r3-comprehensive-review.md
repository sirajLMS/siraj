# Round 3 Comprehensive Review Plan

**Date**: 2025-01-17
**Scope**: Uncommitted WhatsApp integration changes (99 files)
**Skills**: repo-review, review-uncommitted, review-types
**Tracks**: All 6 tracks (security, performance, business-logic, deploy-safety, duplication, dead-code) + types (naming, duplication, consistency, imports, canonical-object, foundation) + frontend conventions + config/env

## Summary

8 of 9 review subagents completed. Found 2 HIGH, 13 MEDIUM, 8 LOW findings across security, business logic, deploy safety, dead code, performance, duplication, types, and config. Key issues: TOCTOU race in webhook UPDATE branch, dead upsert path in webhook handler, schema drift, env-config gaps, and frontend component duplication.

## Findings

### HIGH (2)
- [ ] [HIGH] business-logic: backend/db/repo/notifications/notification.repository.ts:346-394 — TOCTOU race in UPDATE branch: no SELECT FOR UPDATE or advisory lock; two concurrent webhooks can double-apply status
- [ ] [HIGH] business-logic: backend/services/whatsapp/whatsapp-webhook.handler.ts:161-166 — handleMessagesStatus never passes userId/channel/eventType to handleDeliveryWebhook, making the INSERT upsert path dead code; status webhooks that arrive before adapter creates delivery row are silently lost

### MEDIUM (13)
- [ ] [MEDIUM] deploy-safety: backend/db/schema/whatsapp/whatsapp-accounts.ts:24-46 — Schema drift: `max_phone_numbers_per_business` column in migration but absent from Drizzle schema; next generate will DROP COLUMN
- [ ] [MEDIUM] dead-code: backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts:54 — Unreachable throw branch (getWhatsappProvider always returns "cloud_api")
- [ ] [MEDIUM] dead-code: backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts:13-26 — Provider normalization logic is dead (single-literal union type)
- [ ] [MEDIUM] performance: frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts:35-52 — labels object rebuilt every render without useMemo
- [ ] [MEDIUM] config: backend/lib/env-config-keys.ts:588-684 — WHATSAPP_API_VERSION not registered in ENV_CONFIG_KEYS
- [ ] [MEDIUM] config: backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts:88-94 — resetWhatsappChannel omits ACCESS_TOKEN, PHONE_NUMBER_ID, API_VERSION from cache invalidation
- [ ] [MEDIUM] types: backend/types/whatsapp/whatsapp-account.types.ts:20-22 — Redundant displayName re-declaration via intersection
- [ ] [MEDIUM] types: backend/types/whatsapp/whatsapp-account.types.ts:52-59 — Template status/category typed as bare string instead of enums
- [ ] [MEDIUM] types: backend/services/whatsapp/whatsapp-account.service.ts:39-59 — Auth asserts duplicate centralized withAuthResult/withAuthVoid pattern
- [ ] [MEDIUM] business-logic: backend/db/repo/notifications/notification.repository.ts:408-412 — SQL rank guard duplicates STATUS_ORDER with hardcoded literals, no sync with TS map
- [ ] [MEDIUM] duplication: backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts:20-128 — 7 resolvers inline auth pattern instead of using withAuthResult/withAuthVoid
- [ ] [MEDIUM] duplication: frontend/desktop/.../NumbersTab.desktop.tsx + frontend/mobile/.../NumbersTab.mobile.tsx — Duplicated NumbersSnackbar components
- [ ] [MEDIUM] duplication: frontend/desktop/.../OptInTab.desktop.tsx + frontend/mobile/.../OptInTab.mobile.tsx — Near-identical OptInTab components
- [ ] [MEDIUM] duplication: frontend/desktop/.../TemplatesTab.desktop.tsx + frontend/mobile/.../TemplatesTab.mobile.tsx — Duplicated statusChipColor helper

### LOW (8)
- [ ] [LOW] security: backend/services/whatsapp/whatsapp-account.service.ts:226-275 — No input validation on accessToken/twoStepPin (empty strings accepted)
- [ ] [LOW] security: app/api/webhooks/whatsapp/route.ts:119 — Redundant unreachable !appSecret check
- [ ] [LOW] config: .env.example:249 — Stray leading space in WHATSAPP_TEST_TO_PHONE value
- [ ] [LOW] types: backend/types/whatsapp/whatsapp-account.types.ts:24-32 — Fragmented SubmitInput naming convention
- [ ] [LOW] types: backend/types/whatsapp/whatsapp-account.types.ts:38-46 — SetWhatsappAccessTokenInput/SetWhatsappTwoStepPinInput unused at service boundary
- [ ] [LOW] types: backend/services/.../list-message-templates.request.ts + list-phone-numbers.request.ts — Overlapping DTO types
- [ ] [LOW] types: backend/services/.../send-template-message.request.ts:39-48 — Non-exported response body type
- [ ] [LOW] types: backend/graphql/query/whatsapp/whatsapp-account.query.ts:1 — GraphQLError imported from raw "graphql" package
- [ ] [LOW] types: backend/db/repo/whatsapp/whatsapp-account.repository.ts:26-29 — toReturnType doesn't cast to WhatsappAccountReturnType
- [ ] [LOW] business-logic: backend/db/repo/notifications/notification.repository.ts:439 — No test for ON CONFLICT rank guard branch

## Fix Status

- Total findings: 23
- Fixed: 0 / 23
- Remaining: 23
- Commits: NONE (per user request)
