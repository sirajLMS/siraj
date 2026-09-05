# Phase 7 — Durable Webhook Ingest (route + worker + sweeper + lifecycle)

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 7.1–7.5, 7.QL, 7.TE, 7.SEC, 7.SR, 7.IV

## Summary

The v1 strip-and-discard webhook path is replaced end-to-end with persist-first
durable ingest: the route fans every `change` into `whatsapp_webhook_events`
rows BEFORE acking 200, an `after()` tick plus a 5-minute sweeper cron drain
the queue, and per-field handlers project history/echoes/state-sync/inbound
messages into the inbox tables with wamid/chunk/LWW idempotency. The
`account_update` lifecycle (offboard/reconnect/partner-uninstall/disable)
deactivates or re-arms accounts and evicts the per-account adapter through the
Phase 4 factory.

## Files created

| File | Task | Contents |
|---|---|---|
| `backend/services/whatsapp/whatsapp-webhook-inbox.helpers.ts` | 7.2/7.3 | Inbox projections: history chunk ingest (phase/chunk_order dedupe probe, threads→messages, decline routing), `smb_app_state_sync` contacts with LWW, `smb_message_echoes` (revoke-before-original stub via `markRevoked` null-return + stub upsert; edit via `applyEdit`), inbound `messages` branch, media placeholder→follow-up correlation (`attachMedia` flips `mediaPlaceholder`; asset id + mime + sha256 persisted so the actual binary fetch happens inside the 7-day webhook-media window) |
| `backend/services/whatsapp/test/whatsapp-webhook-ingest.test.ts` | 7.TE | 17 tests across 7 describes (history burst+dedupe+decline, contacts LWW, revoke-before-original, media placeholder↔arrival, account_update lifecycle, tolerant capability parsing, worker + sweeper claims) |
| `app/api/cron/whatsapp-webhook-sweep/route.ts` | 7.4 | CRON_SECRET-guarded GET route; calls `WhatsappWebhookHandler.sweepPendingWebhookEvents`; returns tallies JSON; maxDuration 300 |

## Files modified

| File | Task | Change |
|---|---|---|
| `app/api/webhooks/whatsapp/route.ts` | 7.1 | Removed `stripInboundMessages` + its call; removed the 24h Redis identical-body rejection (replaced by the durable-table 5-minute `existsRecentByHash` window inside `persistWebhookChanges`; identical bodies are acked-but-not-inserted inside the window and re-inserted past it with entity-level dedupe). POST now persists event rows BEFORE returning 200 — a persist failure returns 503 so Meta's 7-day retry redelivers instead of dropping the payload. Kept: HMAC (fail→401, NO event insert), 1MB cap, per-IP rate limit, GET verify handshake. `after()` now drains the durable queue via `processPendingWebhookEvents()`. |
| `backend/services/whatsapp/whatsapp-webhook.handler.ts` | 7.2/7.5 | `processPendingWebhookEvents(limit?)` (claim → dispatch → markProcessed / keep-PENDING-on-throw / markFailed for structurally unusable payloads) + `sweepPendingWebhookEvents()` (parkExhausted first, then recursive backoff-drain bounded at 10 rounds). Field dispatch: history/smb_app_state_sync/smb_message_echoes/account_update via inbox helpers; messages field → statuses (existing `handleDeliveryWebhook` path preserved) + new inbound branch; template/quality/capability unchanged. Removed the CLASS_REMINDER analytics fallback for pure inbound statuses (no delivery row → skipped, not fabricated). `account_update` lifecycle: ACCOUNT_OFFBOARDED (markOffboarded + sync FAILED unless COMPLETE + `resetWhatsappChannel(accountId)` eviction), ACCOUNT_RECONNECTED (clearOffboarded + re-arm), PARTNER_APP_UNINSTALLED/PARTNER_REMOVED (deactivate + `disconnection_info.reason` captured in audit metadata), DISABLED_UPDATE (audit only). `business_capability_update` parser now accepts TIER_* strings AND integers (`parseLimitTier`), parses legacy `max_daily_conversation_per_phone` (<v24.0), and tolerates absent caps fields. |
| `backend/db/repo/whatsapp/whatsapp-webhook-event.repository.ts` | 7.4 | Added `claimBatchWithBackoff(limit, baseMs)` — a row claimed N times is re-eligible only after `base*(2^N-1)` ms since receipt (exponential retry cadence), sharing the SKIP LOCKED claim engine via extracted `claimWhere`. |
| `scripts/build/generate-vercel-config.ts` | 7.4 | Registered `/api/cron/whatsapp-webhook-sweep` (`CRON_WHATSAPP_WEBHOOK_SWEEP_SCHEDULE`, default `*/5 * * * *`, alwaysInclude) mirroring the sync-sweep entry. |
| `environment.d.ts` / `.env.example` | 7.4 | Declared `CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE` (existing key was undocumented) + `CRON_WHATSAPP_WEBHOOK_SWEEP_SCHEDULE`. |
| `shared/locale/{en,ar}/dashboard/cron/main.ts` + `shared/locale/types/dashboard/cron.ts` | 7.4 | `whatsappWebhookSweepFailed` in both locales + type schema. |
| `backend/services/whatsapp/index.ts` | — | Barrel adds the two new helper modules. |
| `backend/services/whatsapp/whatsapp-webhook-ingest.helpers.ts` | 7.1 | `resolveAccountByPhoneNumberId` now also accepts top-level `value.phone_number_id` (quality/capability updates place it there; history/inbox values use `metadata.phone_number_id`). |
| `backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts` | 7.TE | Fallback-removal test rewritten (no-delivery-row statuses are skipped, delivery-row ones still update); tier fixtures upgraded to TIER_* string forms; account mocks extended. |
| `backend/db/test/repo/whatsapp/whatsapp-webhook-event.repository.test.ts` | 7.4 | 2 new tests: fresh rows claimable under backoff; recently-retried rows deferred until the delay elapses. |

## Verification (7.QL)

Sub-loop `--lifecycle codescene` exit 0 for every touched file:
`route.ts`, `route.test.ts`, `whatsapp-webhook.handler.ts`, `whatsapp-webhook-ingest.helpers.ts`,
`whatsapp-webhook-inbox.helpers.ts`, `backend/services/whatsapp/index.ts`,
`whatsapp-webhook-event.repository.ts` + its test, `whatsapp-webhook-ingest.test.ts`,
`whatsapp-webhook.handler.test.ts`, `app/api/cron/whatsapp-webhook-sweep/route.ts`,
`generate-vercel-config.ts`, both cron locale leaves + the type schema.

Fixes driven by the loop: 9× `no-await-in-loop` in the inbox helpers (loops → `Promise.all`
maps; all writes are wamid/LWW-keyed so parallelism is safe), 1× `no-useless-default-assignment`
+ unused-type fixes in the route test, CodeScene "too many functions" in the handler test
(7.x suites moved into `whatsapp-webhook-ingest.test.ts`), and a SQL cast for the backoff
claim (`timestamptz` param binding needed `::timestamptz`; also `attempts::float` for `power()`).

Full-tree tsgo: zero whatsapp-domain errors (4 remaining errors are foreign in-flight
carryover/classDetails work, unassigned to this plan).

## Test results (7.TE)

All via `bun run test/scripts/run-test.ts`:

| Suite | Result |
|---|---|
| `backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts` (legacy path) | 43 pass / 0 fail — v1 status-delivery assertions green WITHOUT stripInboundMessages (14.4 regression gate seed) |
| `backend/services/whatsapp/test/whatsapp-webhook-ingest.test.ts` (new 7.x) | 17 pass / 0 fail |
| `backend/db/test/repo/whatsapp/whatsapp-webhook-event.repository.test.ts` | 11 pass / 0 fail (incl. backoff claim) |
| `app/api/webhooks/whatsapp/route.test.ts` | 24 pass / 0 fail — incl. HMAC-fail → 401 + no insert, replay-window acked-skip, 503 on persist failure, durable-persist-before-200 ordering |
| Sanity: `whatsapp-channel.test.ts` + `whatsapp-coexistence-sync.test.ts` | 31 + 25 pass |

Required scenarios covered: burst chunk ingest (multi-message chunk), identical-body retry
accepted+deduped (hasChunk probe + route replay window), short-window replay skip, revoke-before-original
(stub row), media placeholder→arrival (attachMedia + direct upsert), 2593109 decline mapping, offboard
eviction via factory, capability parser tier-string/integer/legacy/absent variants.

## 7.SEC — security audit

- **HMAC fail → 401, NO event insert** — verified by route test (persistWebhookChanges never called on mismatch; same). Payload logs keep the S2 contract (ip/userAgent/contentLength only; body-sensitive strings asserted absent).
- **Replay**: 5-minute exact-hash window via `existsRecentByHash` runs inside the persist step after HMAC; fail-closed on cache... note: probe is DB-backed (whatsapp_webhook_events), NOT Redis — a DB outage fails the persist anyway (503 → Meta retries), so no separate fail-closed cache needed; the old `setNx` Redis nonce was removed.
- **Identity**: inbound/status branches resolve accounts via `metadata.phone_number_id`; lifecycle via WABA + display-number suffix disambiguation; WABA mismatch between entry and stored account is rejected (logged error, no writes).
- **Logging sanitization**: recipient ids masked to last-4; message content never logged — only wamids, ids, counts.

## 7.SR — semantic review

- No read-then-write without lock: claim path is `SELECT FOR UPDATE SKIP LOCKED`; message upserts hit the unique wamid; chunk dedupe via `hasChunk` probe before write; contacts LWW on `metadata.timestamp`.
- No unbounded module state introduced; recipient cache stays request-scoped.
- Env-config keys: only new cron schedule keys, documented in `environment.d.ts`/`.env.example` (also back-filled the missing `CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE` declaration).
- Enum values value-imported (WhatsappSyncStatus, NotificationEventType, etc.); tier strings kept in a local TIER_STRINGS set matching Meta's wire values (runtime guard for untrusted payload — not a domain enum).
- Idempotency/replay gaps: none new discovered → nothing appended to `deferred-items.md`. Media binary download is deliberately out of scope (asset id persisted; fetch deferred to UI read-path within the 7-day webhook media window, per D8).

## 7.IV — instruction verification

Read + complied: root `AGENTS.md`, `app/AGENTS.md`, `backend/AGENTS.md`, `backend/services/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/types/AGENTS.md`, `backend/enum/AGENTS.md`, `shared/AGENTS.md`, `shared/locale/AGENTS.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`. Sub-loop printed instruction pointers rechecked per file. Enforced: no console.\*, barrel rules (`export *` only, ≤1 slash), Neon `queryDb` on reads, `runInRollback` + full tx propagation in repo tests, no `expect().rejects.toThrow` in rollback tests, clean comments (no plan tags), locale dual-leaf + type-schema update for cron error string.

## Carry-forward notes (Phase 8/13)

1. **processPendingWebhookEvents / sweepPendingWebhookEvents** on `WhatsappWebhookHandler` are the ingest entry points; the Cron route `/api/cron/whatsapp-webhook-sweep` drains stale rows with backoff (`claimBatchWithBackoff`, base 60s, max 10 rounds/tick, poison park at 8 attempts).
2. **processEvent** remains public as the in-memory dispatcher (status path + tests); production flow is the durable row path.
3. **Account resolution contracts**: inbox fields need `metadata.phone_number_id`; lifecycle fields are WABA-scoped (`waba_id` + optional `phone_number` suffix match). Unknown fields fall through to debug-level logs (never rejected).
4. **Status updates without delivery rows** are skipped (CLASS_REMINDER analytics fabrication removed — Phase 2.05's M10 mitigation is superseded by this design decision).
5. **7-day media fetch window**: asset ids are persisted fast; the actual binary download is still to be scheduled (D8) — UI expiry notices read `mediaPlaceholder`/`mediaId`.
6. **Replay window** is 5 min exact-hash; past the window identical bodies re-insert and dedupe at the entity layer. Don't reintroduce the 24h rejection — Meta legitimately redelivers history chunks.

