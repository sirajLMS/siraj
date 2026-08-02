# R12 Review Fixes Plan

**Date**: 2025-01-10
**Scope**: WhatsApp integration branch — all uncommitted changes
**Reviews**: repo-review, review-uncommitted, review-types (14 parallel agents)

## Summary

14 parallel review agents completed. Findings aggregated across frontend, backend, types, config, security, performance, logic, deploy, and duplication tracks. Only WhatsApp-relevant findings will be fixed (pre-existing non-WhatsApp issues are out of scope).

## Findings to Fix (WhatsApp-Scope Only)

### CRITICAL
- [ ] C1: `sanitizeFailureReason` duplicated in MetaCloudApiAdapter.ts and whatsapp-webhook.handler.ts — extract to shared util
- [ ] C2: `DashboardProfileShell.tsx` imports from `@/backend/` — frontend layer violation (PRE-EXISTING, skip)
- [ ] C3: `DashboardLayoutContainer.tsx` imports from `@/backend/` — frontend layer violation (PRE-EXISTING, skip)

### HIGH
- [ ] H1: `localPairRateLimit` Map unbounded — no eviction/pruning (MetaCloudApiAdapter.ts) — `pruneLocalPairRateLimit` declared but never called
- [ ] H2: Duplicate import of `FETCH_TIMEOUT_MS`/`MAX_CONCURRENT_CALLS` in MetaCloudApiAdapter.ts (lines 24+27)
- [ ] H3: Service manually constructs ReturnType in `syncFromMeta` instead of using repo's `toReturnType` helper (whatsapp-account.service.ts:536-554)
- [ ] H4: Webhook handler manual coercion of `qualityRating` instead of using `coerceQualityRating` (whatsapp-webhook.handler.ts:494-498)
- [ ] H5: TOCTOU race in WABA ID verification — check not atomic with update (whatsapp-webhook.handler.ts:450-460)
- [ ] H6: Redis pair-rate-limit SET NX + GET double round-trip race (MetaCloudApiAdapter.ts:371-416)

### MEDIUM
- [ ] M1: `whatsapp.documents.ts` — imports `gql`/`TypedDocumentNode` from `@apollo/client` instead of `@apollo/client/react`
- [ ] M2: `whatsapp.documents.ts` — 5 mutation documents missing `id` field in return type
- [ ] M3: `whatsapp.documents.ts` — `updateWhatsappAccountMutationDocument` missing `id` field
- [ ] M4: `MetaCloudApiAdapter.ts` — 3 orphaned error code exports never imported anywhere
- [ ] M5: `MetaCloudApiAdapter.ts` — 6+ other orphaned exports (constants) never imported
- [ ] M6: `whatsapp-webhook.handler.ts` — Misleading log "no existing delivery" when rank guard rejects
- [ ] M7: Token rotation retry can exceed concurrency limit — nested `executeWithConcurrencyLimit` (MetaCloudApiAdapter.ts:481-498)
- [ ] M8: `whatsapp-account.service.ts` — Non-atomic read-then-write in updateAccount (stale audit log risk)
- [ ] M9: `next.config.ts` — remotePatterns includes localhost/backend without production guard
- [ ] M10: `whatsapp-webhook.handler.ts` — `batchResolveEventTypes` fallback to CLASS_REMINDER on total DB failure pollutes analytics
- [ ] M11: `whatsapp-webhook.handler.ts` — `resolveRecipientUserId` caches `null` on lookup error (permanent cache miss for batch)
- [ ] M12: `whatsapp-account.service.ts:317-320` — Non-atomic updateAccount findById+update without tx
- [ ] M13: WhatsApp i18n hardcoded strings in communication channel adapters/factories/requests

### LOW
- [ ] L1: PII masking functions duplicated (`maskRecipientId` vs `maskPhoneNumber`) — could unify
- [ ] L2: `throughputLevel` stored without validation (webhook handler)
- [ ] L3: Challenge length limit of 20 chars (minor)
- [ ] L4: `collectAllPages` hardcoded maxPages=50 may truncate
- [ ] L5: `WhatsappChannelFactory.ts` — `ERR_UNKNOWN_PROVIDER` constant could be inlined

## Fix Status
- Total WhatsApp-scope findings: 28
- Fixed: 0 / 28
- Remaining: 28
