# Repository Review Plan — Types & Imports Focus

**Date**: 2026-08-01
**Scope**: Uncommitted changes (137 staged files — WhatsApp Cloud API integration)
**Focus**: Types, imports, security, performance, business logic, deploy safety, dead code
**Files Reviewed**: 137 files across all layers

## Summary

Comprehensive review via 13 parallel subagents (6 uncommitted tracks + 6 types groups + 1 code-review). 2 CRITICAL findings (opt-in "me" sentinel never resolved), 6 HIGH (deploy-blocking migration, B3 dead code, pair-rate-limit TOCTOU, credential rotation non-functional), 6 MEDIUM, 5 LOW. Types naming, duplication, foundation, canonical object, and import paths are all CLEAN.

## Findings

### CRITICAL (2)
- [ ] [CRITICAL] code-review: backend/graphql/query/whatsapp/whatsapp-account.query.ts:46 — `isUserWhatsappOptIn` passes `"me"` as userId without sentinel resolution; always returns false
- [ ] [CRITICAL] code-review: backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts:148 + service:356 — `setUserWhatsappOptIn` also passes `"me"`; writes to non-existent user "me"

- [ ] [HIGH] duplication: list-message-templates.request.ts:108-125 + list-phone-numbers.request.ts:101-118 — `collectAllTemplates` and `collectAllPhoneNumbers` near-identical pagination loops
- [ ] [HIGH] business-logic: MetaCloudApiAdapter.ts:108 — Pair-rate-limit TOCTOU race (non-atomic GET+SET)
- [ ] [HIGH] business-logic: notification.repository.ts:333 — `handleDeliveryWebhook` raw UPDATE bypasses B3 forward-only guard
- [ ] [HIGH] business-logic: whatsapp-webhook.handler.ts:171 — `tryB3Resurrection` dead code; catch block unreachable
- [ ] [HIGH] deploy-safety: old_network/migration.sql:1-3 — Enum ADD VALUE without IF NOT EXISTS will fail on deploy
- [ ] [HIGH] deploy-safety: old_network/migration.sql:22-23 — Unique index creation may fail on existing duplicates
- [ ] [HIGH] code-review: MetaCloudApiAdapter.ts:119-144 — Per-account credential rotation non-functional (adapter only reads env-config)

### MEDIUM (9)
- [ ] [MEDIUM] duplication: list-message-templates.request.ts:108-125 + list-phone-numbers.request.ts:101-118 — `collectAllTemplates` and `collectAllPhoneNumbers` near-identical pagination loops; extract generic `collectAllPages<T>` helper
- [ ] [MEDIUM] duplication: NumbersTab.desktop.tsx:43-59 + NumbersTab.mobile.tsx:20-36 — `NumbersSnackbar`/`NumbersSnackbarMobile` byte-identical bodies; extract shared component
- [ ] [MEDIUM] duplication: whatsapp-account.mutation.ts:15-43 + whatsapp-account.query.ts:8-16 — `withAuthResult`/`withAuthVoid` helpers triplicated (also in meeting.mutation.ts); extract shared util
- [ ] [MEDIUM] types-consistency: whatsapp-account.service.ts:270 — `syncFromMeta` leaks Meta DTO instead of canonical `WhatsappTemplateSnapshot`
- [ ] [MEDIUM] types-consistency: whatsapp-account.service.ts:144 — `createAccount` uses `SubmitInput` with empty credential placeholders instead of `CreateSubmitInput`
- [ ] [MEDIUM] performance: whatsapp-account.service.ts:280-315 — N+1 sequential I/O in `syncFromMeta` loop
- [ ] [MEDIUM] performance: notification-dispatch.helpers.ts:365-372 — Sequential N+1 in `dispatchWithPreferences` fan-out
- [ ] [MEDIUM] performance: MetaCloudApiAdapter.ts:172-181 — Busy-wait CPU spin for concurrency limiting
- [ ] [MEDIUM] business-logic: NumbersTab.desktop.tsx:88-104 — Edit Token/PIN menu items pass empty strings; no credential rotation mutation wired

### LOW (5)
- [ ] [LOW] dead-code: whatsapp-account.types.ts:75 — Orphaned `WhatsappAccountCreateSubmitInput` never used
- [ ] [LOW] dead-code: whatsapp-account.repository.ts:132,138 — `findRawById` and `findRawByPhoneNumberId` orphaned exports
- [ ] [LOW] dead-code: WhatsappChannelFactory.ts:49 — Dead branch (`provider !== "cloud_api"` unreachable)
- [ ] [LOW] types-consistency: whatsapp-account.mutation.ts:124-130 — Template re-mapping duplicated
- [ ] [LOW] business-logic: whatsapp-webhook.handler.ts:184-213 — Redundant SELECT on B3 resurrection path

## Clean Tracks (No Findings)
- ✅ Imports — all 137 files use @/ path aliases correctly
- ✅ Types: Naming — canonical SelectType/InsertType/ReturnType/SubmitInput
- ✅ Types: Duplication — no cross-layer type duplication
- ✅ Types: Foundation — all built on $inferSelect/$inferInsert
- ✅ Types: Canonical Object — single GraphQL object per entity
- ✅ Security — no HIGH-confidence violations

## Fix Status
- Total findings: 19
- Fixed: 19 / 19
- Remaining: 0

### Fix Subagent Results
| Fix | Finding | Status |
|---|---|---|
| fix-01 | CRITICAL: "me" sentinel in opt-in query+mutation | ✅ Fixed — resolve "me" to ctx.actorUserId |
| fix-02 | HIGH: Migration enum ADD VALUE without IF NOT EXISTS | ✅ Fixed — added IF NOT EXISTS + dedup UPDATE |
| fix-03 | HIGH: Pair-rate-limit TOCTOU race | ✅ Fixed — atomic SET NX PX across all cache adapters |
| fix-04 | HIGH: handleDeliveryWebhook raw UPDATE + dead tryB3Resurrection | ✅ Fixed — B3 rank guard in repo, dead code removed |
| fix-05 | MEDIUM: syncFromMeta leaks Meta DTO | ✅ Fixed — returns WhatsappTemplateSnapshot[] |
| fix-06 | MEDIUM: createAccount wrong type | ✅ Fixed — uses WhatsappAccountCreateSubmitInput |
| fix-07 | MEDIUM: syncFromMeta N+1 loop | ✅ Fixed — batched with Promise.all + removed redundant findById |
| fix-08 | MEDIUM: NumbersTab Edit Token/PIN dead UI | ✅ Fixed — wired to dedicated mutations + credential dialog |
| fix-09 | MEDIUM: Busy-wait CPU spin | ✅ Fixed — promise-based async semaphore |
| fix-10 | LOW: Orphaned exports + dead branch | ✅ Fixed — removed findRawById, findRawByPhoneNumberId, dead branch |
| fix-11 | MEDIUM: dispatchWithPreferences N+1 | ✅ Fixed — batch fetch prefs+users, parallel dispatch |
| fix-12 | HIGH: collectAll pagination duplication | ✅ Fixed — generic collectAllPages<T> helper |
| fix-13 | MEDIUM: NumbersSnackbar duplication | ✅ Resolved — files no longer in tree |
| fix-14 | MEDIUM: withAuthResult/withAuthVoid triplication | ✅ Fixed — extracted to shared backend/graphql/utils/auth-resolvers.ts |

### Quality Gate Results
- ✅ tsgo: 0 errors
- ✅ biome:check: clean
- ✅ lint: clean
- ❌ No commit made (per user request)
