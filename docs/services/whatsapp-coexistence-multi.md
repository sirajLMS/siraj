# WhatsApp Multi-Number Routing + Coexistence (v2) — Canonical Reference

Covers the v2 architecture: purpose-based multi-number routing, per-account channel
adapters, Embedded Signup coexistence onboarding, durable webhook ingest, and the
read-only inbox. The v1 single-number path is documented in
`docs/services/whatsapp-cloud-api.md`; this document supersedes it for routing,
webhook, and onboarding behavior. Plan evidence: `.ai/plans/whatsapp2/`.

## Architecture Map

```
Notification builders          Meta Dashboard webhooks          Read path
        │                              │                              │
        ▼                              ▼                              ▼
NOTIFICATION_TEMPLATE_MAP   app/api/webhooks/whatsapp/route.ts   GraphQL queries
 (purpose per event)        HMAC → persist rows BEFORE 200       whatsappConversations
        │                              │                         whatsappConversationMessages
        ▼                              ▼                         whatsappSyncStatus
communication.service.ts    whatsapp_webhook_events                     │
 dispatchWhatsapp           (durable queue, PROCESSING claim)          ▼
   getChannelForPurpose     whatsapp-webhook.handler.ts          WhatsappInboxService
        │                   processPendingWebhookEvents          (UserPermissionContext in,
        ▼                   field dispatch → inbox helpers        ForbiddenError out)
WhatsappChannelFactory      projects conversations/messages/contacts
 MetaCloudApiAdapter per whatsapp_accounts row
```

## Multi-Number Purpose Routing

- `whatsapp_accounts.purpose` ∈ `GENERAL | STUDENTS | ADVERTISING` (enum
  `WhatsappAccountPurpose` in `backend/enum/whatsapp/`). Every account row has one;
  default is `GENERAL` so v1 tenants behave identically.
- `NOTIFICATION_TEMPLATE_MAP` entries stamp `purpose` into
  `metadata.whatsappTemplate`; dispatch helpers carry it through untouched. The five
  v1 template events all map to `STUDENTS`.
- `CommunicationService.dispatchWhatsapp` resolves the sender via
  `WhatsappChannelFactory.getChannelForPurpose(purpose)`: purpose account →
  `GENERAL` fallback (`logger.warn` fires only when the fallback branch is taken) →
  if neither resolves, fail fast with `whatsapp.noSenderForPurpose`
  (`sendAttempted: false`, `errorCode` propagated on `ChannelDispatchResult`).
- Unknown purpose strings are rejected by the metadata guard
  (`isWhatsappAccountPurposeValue`) — the template is invalidated before any routing.
- Attribution: the resolved account is stamped on the payload (`senderAccountId`,
  `purpose`) and into `notification_deliveries.metadata.senderAccountId`.
- Purpose reassignment goes through the gated mutation `updateWhatsappAccountPurpose`
  (`WHATSAPP_CONFIG_MANAGE`); inactive accounts are rejected with
  `whatsapp.purposeRequiresActive` (activate/credential the number first). The
  generic `updateWhatsappAccount` input deliberately does NOT accept `purpose`.

## Per-Account Adapter + Factory

- `WhatsappChannelFactory` keeps a per-account `Map<accountId, IWhatsappChannel>`
  plus an initialization-promise map (race-safe lazy construct).
- Each `MetaCloudApiAdapter` is constructed with its `accountId` and resolves
  credentials strictly for that account (decrypt-on-demand, 5s in-memory cache,
  cleared on `disconnect()`). There is no cross-account or "first active" fallback
  on the send path.
- `resetWhatsappChannel(accountId?)` evicts per-account or globally, waits for
  in-flight operations, and invalidates the full `WHATSAPP_ENV_CONFIG_KEYS` set —
  **every** `WHATSAPP_*` env-config key the feature reads (`PROVIDER`, `APP_SECRET`,
  `VERIFY_TOKEN`, `WABA_ID`, `ACCESS_TOKEN`, `PHONE_NUMBER_ID`, `API_VERSION` legacy,
  `GRAPH_API_VERSION`, `ES_CONFIG_ID`, `WEBHOOK_BASE_URL`). When adding a
  `WHATSAPP_*` key, extend this set or stale values survive resets.
- Graph API version resolves via `resolveGraphApiVersion()`:
  `WHATSAPP_GRAPH_API_VERSION` → legacy `WHATSAPP_API_VERSION` → default `v25.0`.
  The old hardcoded `v20.0` is gone; all request builders use the helper.
- Offboarding fail-fast: `resolveCredentials` throws `WhatsappAccountOffboardedError`
  (`whatsapp.accountOffboarded`) before any Graph call or delivery row. The
  `offboardedAt` check runs BEFORE the `isActive` check — offboarding also
  deactivates, so checking activity first would swallow the specific error.
- Mutations that touch credentials or lifecycle (`deactivate`, `delete`,
  `setAccessToken`, `setTwoStepPin`, `updateAccountPurpose`, ES completion) call
  `resetWhatsappChannel(accountId)` to evict the cached adapter.
- Legacy proxy: `whatsappChannel` honors `payload.senderAccountId` when set, else
  the active `GENERAL` account — never "first active of any purpose".

## Coexistence Onboarding (Embedded Signup v4)

Coexistence lets a number already registered on the WhatsApp Business app connect to
Cloud API while keeping the phone app usable for the merchant.

Server flow — `WhatsappAccountService.completeEmbeddedSignup` (gated by
`WHATSAPP_CONFIG_MANAGE`):

1. Validate input (numeric `wabaId`/`phoneNumberId` ≤64 chars, `code` ≤2048).
2. Exchange the one-time `code` for a business-integration token
   (`GET /oauth/access_token`) using env-config `WHATSAPP_APP_ID` /
   `WHATSAPP_APP_SECRET`.
3. Resolve the phone number: explicit `phoneNumberId`, else
   `GET /<WABA_ID>/phone_numbers` must yield exactly one.
4. Coexistence confirm: require `is_on_biz_app === true` AND `platform_type ===
   "CLOUD_API"`; anything else → `whatsapp.embeddedSignupFailed`.
5. Duplicate check on `phoneNumberId`; `POST /<WABA_ID>/subscribed_apps` (failure
   tolerated — warn and continue; surfaces later in settings).
6. Create the account row (`onboardingMode: COEXISTENCE`, real token via
   `encryptedText`, `isActive: true`), audit, `resetWhatsappChannel(newId)`.
7. `enqueuePostOnboardingSync` — failure is logged, never rolls back onboarding.

Database unique violations (23505) inside the flow are wrapped into
`WhatsappEmbeddedSignupError` — raw Drizzle errors never escape.

Security: `config_id` (`WHATSAPP_ES_CONFIG_ID`) and the App ID are resolved
server-side via env-config and passed to the client as page props — never client
input, never hardcoded in client bundles. Authorization codes are single-use at
Meta. Meta session events are only honored from the `https://www.facebook.com`
origin.

## Coexistence Sync Lifecycle (smb_app_data)

After onboarding, Meta offers history + contacts sync via
`POST /<PHONE_NUMBER_ID>/smb_app_data` (single-shot per sync type, 24h window).
`WhatsappCoexistenceSyncService` owns this lifecycle; state lives in
`whatsapp_sync_requests` (unique `(accountId, syncType)`) plus account snapshot
columns (`syncStatus`, `syncPhase`, `syncProgress`, `syncDeadlineAt`,
`syncFailureReason`).

- **One-shot enforcement**: `ensure()` inserts-or-returns; the Meta POST happens
  only when `requestId IS NULL`; `recordRequestId` is guarded by
  `WHERE requestId IS NULL`, so a crash between POST and record never double-POSTs —
  a re-run reports `alreadyRequested`.
- **Meta POSTs never run inside a DB transaction** (mid-point R1 finding).
- **Deadline**: `syncDeadlineAt = onboarding + 24h` is stamped even when the POST
  fails so the sweeper always has something to expire. Cron
  `/api/cron/whatsapp-sync-sweep` (default hourly, `CRON_WHATSAPP_SYNC_SWEEP
  _SCHEDULE`) flips expired PENDING rows to FAILED + account
  `FAILED(syncDeadlineExpired)`, and retries outstanding POSTs inside the window.
- **Progress**: `recordHistoryProgress` clamps to [0,100]; STREAMING on first
  chunk, COMPLETE at 100; terminal rows are idempotent.
- **Decline**: Meta error `2593109` (history sharing declined) maps to
  `handleHistoryDeclined`; a completed history row outranks a late decline webhook;
  the account flips to `historyDeclined` once contacts reach a terminal state (or
  via `maybeCompleteAccountSync`). Account-level decline reason surfaces as
  `whatsapp.historyDeclined` / `whatsapp.coexistenceTakenByOtherPartner`.

## Durable Webhook Ingest

The v1 strip-and-discard path was replaced with persist-first durable ingest:

- **Persist before 200**: `app/api/webhooks/whatsapp/route.ts` fans every webhook
  `change` into `whatsapp_webhook_events` rows BEFORE acknowledging. A persist
  failure returns 503 so Meta's 7-day retry redelivers instead of a silent drop.
  HMAC failure → 401 with NO insert. The 1MB cap, per-IP rate limit, and GET
  verify handshake are unchanged. `stripInboundMessages` was removed entirely.
- **Replay window**: exact-body `payloadHash` duplicates are acked-but-skipped
  inside a 5-minute window (`existsRecentByHash`, DB-backed). Past the window,
  identical bodies re-insert and are deduped at the entity layer — Meta
  legitimately redelivers history chunks, so never re-introduce a long
  identical-body rejection.
- **Claiming**: `claimBatch` uses `SELECT ... FOR UPDATE SKIP LOCKED`; the claim
  flips rows to `PROCESSING` atomically (R1 claim-race fix). Stale PROCESSING rows
  are reclaimed by `claimBatchWithBackoff` — a row claimed N times re-qualifies
  after `base · 2^(N−1)` ms; `parkExhausted` parks poison rows at the attempt cap.
- **Draining**: `processPendingWebhookEvents` runs in the route's `after()` tick;
  cron `/api/cron/whatsapp-webhook-sweep` (default `*/5`,
  `CRON_WHATSAPP_WEBHOOK_SWEEP_SCHEDULE`) is the backstop. Structurally unusable
  payloads are marked FAILED instead of retried forever.
- **Field dispatch**: `history` (phase/chunk_order dedupe probe, threads→messages
  upserts, progress), `smb_app_state_sync` (contacts with last-writer-wins on
  `metadata.timestamp`), `smb_message_echoes` (echo upsert / revoke / edit;
  revoke-before-original creates a stub row), `messages` (status path preserved,
  plus the new inbound branch), `account_update` + `business_capability_update`
  (lifecycle, below). Unknown fields fall through to debug logs — never reject.
- **Media correlation**: history/echo message rows land with
  `mediaPlaceholder: true` plus the persisted asset id; when the media webhook
  arrives, `attachMedia` flips the placeholder and records the asset. The fetch
  window for the actual binary is 7 days after the media webhook (14 days is the
  history follow-up eligibility cutoff, not a fetch window). The binary download
  itself is deferred (D8) — the UI renders placeholder/expired states.
- **Status updates without a delivery row are skipped.** The v1
  CLASS_REMINDER analytics fallback for pure inbound statuses was removed.

### account_update lifecycle

| Meta event | Effect |
|---|---|
| `ACCOUNT_OFFBOARDED` | `markOffboarded` (deactivate + `offboardedAt`), sync → FAILED unless COMPLETE, `resetWhatsappChannel(accountId)` eviction |
| `ACCOUNT_RECONNECTED` | `clearOffboarded` + re-arm |
| `PARTNER_APP_UNINSTALLED` / `PARTNER_REMOVED` | deactivate; `disconnection_info.reason` captured in audit metadata |
| `DISABLED_UPDATE` | audit only |

Identity: inbox fields resolve accounts via `metadata.phone_number_id`; lifecycle
fields are WABA-scoped (`waba_id` + optional display-number suffix match). A WABA
mismatch between entry and stored account is rejected with no writes.
`business_capability_update` accepts `TIER_*` strings AND integer values
(`parseLimitTier`), the legacy `max_daily_conversation_per_phone` key (webhooks
<v24.0), and tolerates absent caps fields (absence ≠ no cap).

## Per-Pair Rate Limiting

- Redis key: `whatsapp:pair:<sender>|<recipient>` where sender is the account's
  `phoneNumberId` (falls back to display digits) — NOT recipient-only as in v1.
- Redis-backed with a bounded local in-memory fallback map per adapter instance.
- The limit is per (sender, recipient) pair: advertising sends and student
  notifications to the same phone do not consume each other's budget.

## Error Codes (v2 additions)

Domain errors in `backend/lib/errors.ts` (locale keys in the `errors` namespace):

| Code / locale key | When |
|---|---|
| `whatsapp.noSenderForPurpose` / `whatsappNoSenderForPurpose` | Dispatch: neither the purpose account nor GENERAL resolves |
| `whatsapp.accountOffboarded` / `whatsappAccountOffboarded` | Send attempted on an offboarded account (pre-Graph fail-fast) |
| `whatsapp.purposeRequiresActive` / `whatsappPurposeRequiresActive` | Purpose assigned to a number that is not yet active |
| `whatsapp.embeddedSignupFailed` / `whatsappEmbeddedSignupFailed` | Any ES completion failure (token exchange, coexistence confirm, duplicate number, Meta errors) — internals only logged |
| `whatsapp.coexistenceTakenByOtherPartner` / `whatsappCoexistenceTakenByOtherPartner` | Number's coexistence slot is held by another partner app |
| `whatsapp.syncDeadlineExpired` / `whatsappSyncDeadlineExpired` | 24h sync window elapsed before COMPLETE |
| `whatsapp.historyDeclined` / `whatsappHistoryDeclined` | Meta 2593109 history-sharing decline (or late decline after contacts completed) |
| `whatsapp.webhookProcessingFailed` / `whatsappWebhookProcessingFailed` | Durable-ingest processing failure surface |

All are localized via `shared/locale` (`errors` namespace, en+ar); resolvers throw
DomainError subclasses so `extensions.code` carries the stable code to clients.

## Operations Checklist

**Meta App Dashboard webhook field subscriptions** (all required for coexistence):

```
messages, account_update, history, smb_app_state_sync, smb_message_echoes
```

(`business_capability_update` / `phone_number_quality_update` remain subscribed
from v1 — the capability parser handles both modern and legacy shapes.)

- **Env-config keys** (registered in `ENV_CONFIG_KEYS`, whatsapp category):
  `WHATSAPP_GRAPH_API_VERSION` (default v25.0), `WHATSAPP_ES_CONFIG_ID`. Both are
  non-secret and DB-overridable; declared in `environment.d.ts` + `.env.example`.
- **Cron jobs** (`scripts/build/generate-vercel-config.ts` `CRON_DEFINITIONS`,
  both `alwaysInclude: true`): `/api/cron/whatsapp-webhook-sweep` (default `*/5`,
  `CRON_WHATSAPP_WEBHOOK_SWEEP_SCHEDULE`) and `/api/cron/whatsapp-sync-sweep`
  (default hourly, `CRON_WHATSAPP_SYNC_SWEEP_SCHEDULE`). *(Note: exact default
  cadences are in the generator; the keys above control overrides.)*
- **Health**: `isWhatsappConfigured` aggregates across active accounts;
  `validateAccountConfig(accountId)` is the per-account hook.
- **Permissions**: `whatsapp.inbox_view` (grant: super_admin, academy_admin,
  staff_default, supervisor_default), `whatsapp.inbox_manage` (super_admin,
  academy_admin).

## Battle-Tested Notes (do not regress)

- Check `offboardedAt` **before** `isActive` in credential resolution — offboarding
  deactivates, so activity-first masking makes the offboard error unreachable.
- Never run Meta POSTs inside a DB transaction.
- Keep per-request identity server-derived (`metadata.phone_number_id`, repo
  lookups) — no client-supplied account ids on send/onboarding paths.
- Backoff SQL claims need explicit casts (`::timestamptz`, `attempts::float`).
- Mocking a barrel in Bun tests shadows deep imports consumed by code under test;
  omit unrelated keys from barrel mocks instead of whack-a-mole stubbing.
- Never write real-looking phone numbers/tokens into tests — sandbox redaction
  corrupts them on round-trip; use digit-only fakes and `tok_test_*` values.
