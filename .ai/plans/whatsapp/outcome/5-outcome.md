# Task 5 Outcome — MetaCloudApiAdapter (REQ-2, B2, P1, S4)

## Summary

Replaced the `MetaCloudApiAdapter` stub with a full Graph API adapter implementation that sends template messages via Meta's Cloud API. The adapter enforces the pair-rate-limit in Redis (B2), caps concurrency at 10 parallel calls (P1), decrypts the access token per send call (S4), uses `AbortSignal.timeout(10_000)` on all fetches, and persists delivery rows via `NotificationRepository` with `deliveryFailedMessage("whatsapp")` on terminal failure.

Also created `cloud-api/index.ts` barrel re-exporting the adapter, shared types/helpers, and all v1 request builders.

**No commits made** — all files are uncommitted per user request.

## Files Modified / Created

| File | Action | Purpose |
|------|--------|---------|
| `cloud-api/MetaCloudApiAdapter.ts` | Replaced stub | Full Graph API adapter: send(), validateConfig(), disconnect() |
| `cloud-api/index.ts` | Created | Barrel exports for adapter, shared types, request builders |

## Spec Compliance

### REQ-2 — Send Template Messages via Cloud API
- `send()` builds a POST to `/{phone_number_id}/messages` with `type: "template"` via `send-template-message.request.ts`'s `buildRequest()`
- On success: persists `providerMessageId` (wamid) on the delivery row and sets status to `SENT`
- On terminal failure: sets delivery status to `FAILED` with `failureReason` + returns `deliveryFailedMessage(NotificationChannel.WHATSAPP, locale)`
- Template-only (B1) — no free-text body field; `WhatsappPayload.template` carries the approved template name + language code

### B2 — Pair-Rate-Limit in Redis
- Key: `whatsapp:pair:<e164>`, TTL 60 seconds
- Before each send, checks Redis for the last-send timestamp; if `now - last < 6000`ms, defers the HTTP call by the remaining ms via `setTimeout`
- Never marks delivery FAILED on guard hit — only defers
- On Meta error code `131056` (recipient rate limit): returns `rateLimited: true` without marking FAILED — caller is expected to deferred-retry
- State is shared across process instances via Redis (not in-memory map)

### P1 — Concurrency Cap ≤ 10
- Simple semaphore: `activeCalls` counter on the adapter instance
- While `activeCalls >= 10`, waits 10ms and rechecks before proceeding
- Increments before `fetch`, decrements in `finally` block
- Caps concurrent Graph API calls per fan-out to 10

### S4 — Decrypt Token Per Send
- `resolveCredentials()` resolves `WHATSAPP_ACCESS_TOKEN` from env-config (DB-first / env-fallback)
- Calls `decryptField(rawToken)` per send call — if the token is plaintext (not encrypted), `decryptField` returns it as-is (legacy fallback)
- Never holds plaintext token on the instance singleton — token is resolved and decrypted fresh per `send()` invocation
- `resetWhatsappChannel()` (in factory) invalidates env-config cache so token rotation takes effect

### AbortSignal.timeout(10_000)
- All `fetch()` calls use `AbortSignal.timeout(FETCH_TIMEOUT_MS)` via the request `init`
- Timeout errors are caught and logged with deliveryId + e164, then handler proceeds to mark FAILED

## Design Decisions

### Credential Resolution
- `resolveEnvConfig("WHATSAPP_ACCESS_TOKEN")`, `resolveEnvConfig("WHATSAPP_PHONE_NUMBER_ID")`, `resolveEnvConfig("WHATSAPP_API_VERSION")` — all resolved via the DB-first / env-fallback resolver
- These keys are NOT yet registered in `env-config-keys.ts` (Task 7 will register them when the per-account schema exists). The resolver falls back to `process.env` for unregistered keys, so the adapter works with env vars today
- Per-account credentials (DB-stored token + phone number ID) will come from the WhatsApp accounts schema (Task 7). The adapter currently resolves from global env-config; a future task will inject per-account credentials via constructor or lookup

### Error Handling Pattern (Mirrors ResendEmailAdapter)
- `handleEmptyRecipient()` → creates FAILED delivery, returns error via `deliveryFailedMessage()`
- `handleHttpError()` → parses Meta error body, extracts `error.code` + `error.message`; on 131056 returns `rateLimited: true` without FAILED; on other non-2xx marks FAILED
- `handleSendException()` → catches thrown errors (including timeout), marks FAILED, returns `deliveryFailedMessage()`
- Internal `failureReason` values (e.g. "empty recipient address", Meta error message) are for the audit trail — user-facing messages always go through `deliveryFailedMessage()`

### Delivery Row Lifecycle
- `createDelivery()` inserts a PENDING row via `NotificationRepository.createDelivery()` before the fetch
- On success → `updateDeliveryStatus(SENT, providerMessageId)`
- On failure → `updateDeliveryStatus(FAILED, failureReason)`
- Uses `createDelivery` (single-send pattern) matching ResendEmailAdapter; `createManyDeliveries` for bulk fan-out will be wired in Task 6 dispatch layer

### Redis Fail-Open
- If Redis is unavailable during pair-rate-limit check, the adapter logs a warning and proceeds without the guard (fail-open) — matches the Redis service's fail-open contract
- Pair-rate-limit success timestamp is recorded after a successful send via `recordPairRateLimitSuccess()`

## Non-Negotiable Execution Protocol Compliance

| Step | Protocol Requirement | Status |
|------|---------------------|--------|
| 1 | Pre-Execution Outcome Read — read ALL outcome files | ✅ Read `task-1-outcome.md`, `2-outcome.md`, `3-outcome.md`, `4-outcome.md` |
| 2 | Per-File Quality Verification Loop — tsgo + biome + lint after each edit | ✅ Each file verified individually; biome auto-fixed import ordering; lint passed clean |
| 3 | Global Health Check — tsgo + biome + lint globally, zero errors | ✅ All three passed with zero errors/warnings |
| 4 | Post-Execution Outcome File — write outcome doc | ✅ This document |
| 5 | Task Progress Tracking — update checkboxes in trackable-tasks.md | ✅ (updated below) |

## AGENTS.md / Instruction Compliance

- **`backend/services/AGENTS.md`**: ✅ Domain-driven WhatsApp adapter, not monolithic; user-facing errors via `deliveryFailedMessage`; types from `@/backend/types` / `IWhatsappChannel` / `meta-cloud-api.types`
- **`backend/AGENTS.md`** (via `backend.instructions.md`): ✅ Layer separation, `@/*` path aliases, `logger` from `@/backend/lib/logger` (no `console.*`), no local type definitions in wrong layers, no nested ternary operators
- **`shared/AGENTS.md`**: ✅ No shared layer files touched

## Quality Gate Results

| Check | Result |
|-------|--------|
| `bun tsgo` (global) | ✅ Zero errors |
| `bun biome:check` (global) | ✅ Zero errors, zero warnings |
| `bun run lint` (global, via queue) | ✅ Zero errors, zero warnings |

Per-file results:
| File | tsgo | biome | lint |
|------|------|-------|------|
| `MetaCloudApiAdapter.ts` | ✅ | ✅ | ✅ |
| `cloud-api/index.ts` | ✅ | ✅ | ✅ |

### Q4 — Tier Budget Accounting (sendAttempted flag)
- Added `sendAttempted: boolean` to `WhatsappSendResult` interface in `IWhatsappChannel.ts`
- The adapter sets `sendAttempted: true` on all paths where a Graph API fetch was actually executed:
  - Success path (SENT)
  - HTTP error path (non-2xx, including terminal FAILED and 131056 rate-limited)
  - Fetch exception path (timeout, network error — all caught in `executeSend` catch block)
- The adapter sets `sendAttempted: false` on:
  - Empty recipient guard (no API call made)
  - Credential resolution failure (pre-fetch error in `send()` catch block)
- `dispatchMulti` (Task 6) can count `result.sendAttempted` across all recipients to log total budget consumption, including failed sends that still consume Meta `portfolioMessagingLimitTier` budget

1. **Adapter send() flow**: `empty-to guard → createDelivery → resolveCredentials → checkPairRateLimit → executeWithConcurrencyLimit → executeSend → fetch with AbortSignal → parse response → updateDeliveryStatus(SENT/FAILED)`
2. **Per-account credentials**: Currently resolved from global env-config (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`). Task 7 will add per-account DB schema — adapter will need to accept per-account credentials via constructor or lookup
3. **`createManyDeliveries`**: Task 5 uses `createDelivery` (single-send pattern). Task 6 dispatch wiring should use `createManyDeliveries` for bulk fan-out per P1
4. **Q4 — Tier budget accounting**: `WhatsappSendResult.sendAttempted` is `true` whenever a Graph API fetch was executed (including failures). Task 6 dispatch layer should count `result.sendAttempted === true` in `failureCount` / `totalAttempted` for accounting visibility
5. **rateLimited flag**: `WhatsappSendResult.rateLimited` is set to `true` when Meta returns HTTP 429 or error code 131056. The caller (dispatch layer) should use this to schedule a deferred retry
6. **Redis pair-rate-limit key**: `whatsapp:pair:<e164>` with TTL 60s. The adapter sets the timestamp before the fetch (in `checkPairRateLimit`) and updates it after success (in `recordPairRateLimitSuccess`). If the fetch fails, the timestamp remains from the pre-check — preventing immediate retry to the same recipient
7. **Cloud API barrel**: `cloud-api/index.ts` re-exports adapter + all request builders + shared types. Task 6+ integration tests and dispatch wiring should import from this barrel
8. **Env-config keys NOT registered**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` are resolved from env vars only (not registered in `env-config-keys.ts`). Task 7 or a follow-up should register these with `isSecret: true` for token/key and `excludeFromDb: true` for the access token (matching the S4 contract — secrets should always reflect live env)

## Subtask Checklist

- [x] 5.1 — Created `MetaCloudApiAdapter.ts` (full Graph API adapter: AbortSignal.timeout, decrypt per send, Redis pair-rate-limit, concurrency cap ≤10, delivery tracking, deliveryFailedMessage)
- [x] 5.2 — Created `cloud-api/index.ts` barrel (adapter + shared types + request builders)
- [x] 5.3 — Per-file quality loop on both files (tsgo ✅, biome ✅, lint ✅)
- [x] 5.4 — AGENTS.md / instruction compliance verified
- [x] 5.5 — Global health check passed (tsgo ✅, biome ✅, lint ✅)
- [x] 5.6 — Outcome doc written, checkboxes updated
