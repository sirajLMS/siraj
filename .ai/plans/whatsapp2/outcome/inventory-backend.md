# Backend WhatsApp v1 Inventory (for whatsapp2 planning)

Source: automated read-only exploration of the repo on 2026-09-04. Canonical reference: `docs/services/whatsapp-cloud-api.md`.

## 1. File tree

```
backend/
├── services/
│   ├── communication/channels/whatsapp/
│   │   ├── index.ts                                — barrel: ./cloud-api + ./WhatsappChannelFactory
│   │   ├── WhatsappChannelFactory.ts               — lazy singleton + resetWhatsappChannel() (token rotation, 7 env-key invalidation)
│   │   └── cloud-api/
│   │       ├── MetaCloudApiAdapter.ts              — entire send path (credentials, rate-limit, fetch, delivery rows)
│   │       ├── meta-cloud-api.helpers.ts           — buildGraphUrl, buildAuthHeaders, GraphApiError, extractMetaErrorCode/Message
│   │       └── requests/                           — buildRequest/parseResponse pure fns
│   │           ├── send-template-message.request.ts — POST /{phone_number_id}/messages (template only)
│   │           ├── get-phone-number.request.ts      — GET /{phone_number_id} (tier, quality, throughput)
│   │           ├── list-phone-numbers.request.ts    — GET /{waba_id}/phone_numbers
│   │           ├── list-message-templates.request.ts— GET /{waba_id}/message_templates
│   │           ├── build-paginated-list-request.ts  — generic buildRequest+collectAll factory
│   │           └── collect-all-pages.ts             — cursor-pagination loop (maxPages 50)
│   ├── whatsapp/
│   │   ├── whatsapp-account.service.ts             — CRUD, credentials, syncFromMeta, opt-in, system* helpers (931L)
│   │   ├── whatsapp-webhook.handler.ts             — POST event dispatch by change.field (654L)
│   │   └── test/ whatsapp-optin.test.ts (439L), whatsapp-webhook.handler.test.ts (1025L)
│   ├── notification/
│   │   ├── notification-payloads.builders.ts       — NOTIFICATION_TEMPLATE_MAP (line 87), stamps metadata.whatsappTemplate
│   │   └── notification-dispatch.helpers.ts        — EVENT_CHANNEL_ALLOWLIST (line 40), opt-in gating
│   └── communication/communication.service.ts      — dispatchWhatsapp branch (line 139), channel switch (line 247)
├── db/
│   ├── schema/whatsapp/whatsapp-accounts.ts        — whatsapp_accounts table (one row per phone number; phoneNumberId unique; encryptedText token+PIN; throughputLevel varchar incl. COEXISTENCE; isActive soft-delete; no purpose/role/onboarding columns)
│   ├── schema/communications/communications.ts     — notification_deliveries; partial unique index on provider_message_id (lines 134–136)
│   ├── repo/whatsapp/whatsapp-account.repository.ts— namespace repo (204L): findById, findByPhoneNumberId, findByPhoneNumberIds (batch), findFirstActiveForCredentials, listActive, create, update, setAccessToken, setTwoStepPin, deactivateById
│   └── repo/notifications/notification.repository.ts — createDelivery (253), updateDeliveryStatus (358), handleDeliveryWebhook (645; SELECT FOR UPDATE + dual advisory locks), getDeliveriesByProviderMessageIds (452), rank-guard SQL (552–593)
│   └── repo/notifications/notification-status.constants.ts — DELIVERY_STATUS_RANK {PENDING:0,SENT:1,DELIVERED:2,OPENED:3,FAILED:-1} + isValidStatusTransition (forward-only; failed→anything resurrection)
├── lib/
│   ├── whatsapp-constants.ts                       — FETCH_TIMEOUT_MS, MAX_CONCURRENT_CALLS=10, readErrorBody, resolveGraphApiContextFromEnv
│   ├── whatsapp-coercion.ts, whatsapp-sanitize.ts  — enum coercion, failure-reason redaction
│   └── env-config-keys.ts:915–1046                 — 12 WHATSAPP_* registered keys
├── types/whatsapp/
│   ├── whatsapp-account.types.ts                   — Select/Insert/Return/Update/Submit + template/snapshot types
│   ├── whatsapp-channel.types.ts                   — WhatsappPayload (NO sender/account field), WhatsappSendResult, IWhatsappChannel, WhatsappProvider="cloud_api"
│   ├── whatsapp-cloud-api.types.ts, whatsapp-webhook.types.ts
├── enum/whatsapp/whatsapp.enum.ts                  — re-export of shared Meta enums
└── graphql/
    ├── pothos/whatsapp/whatsapp-account.pothos.ts + __shared__/whatsappAccountFieldHelpers.ts
    ├── query/whatsapp/whatsapp-account.query.ts    — whatsappAccounts, isUserWhatsappOptIn, isWhatsappConfigured
    └── mutation/whatsapp/whatsapp-account.mutation.ts — create/update/delete, setAccessToken, setTwoStepPin, syncFromMeta, setUserOptIn

app/api/webhooks/whatsapp/route.ts (357L) — GET verify + POST HMAC/1MB-cap/replay-nonce/strip-messages/defer
shared/constants/env-config-keys.ts:18–21 — HIDDEN_ENV_CONFIG_KEYS WhatsApp entries
```

## 2. Multi-number-breaking assumptions (current behavior)

- **Factory** (`WhatsappChannelFactory.ts`): module-level singleton, parameterless `new MetaCloudApiAdapter()`; `resetWhatsappChannel()` invalidates only 7 global env keys.
- **Adapter** (`MetaCloudApiAdapter.ts`): `resolveCredentials()` (472–504) → `findFirstActiveForCredentials()` — first-active account is the sender for ALL sends; single-slot 5s credentials cache; **`apiVersion` hardcoded `"v20.0"`** (line 494) while helpers default to 23.0.
- **Pair rate limit**: Redis key `whatsapp:pair:<e164>` keyed by recipient only — must become sender+recipient pair.
- **Split brain**: dispatch resolves per-account DB credentials; admin sync (`syncFromMeta`, service line 767) uses env `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_WABA_ID` globals.
- **`dispatchWhatsapp`** (communication.service.ts:139): reads `metadata.whatsappTemplate`, no sender concept; fails fast `whatsappTemplateMissing`.
- **NOTIFICATION_TEMPLATE_MAP** (notification-payloads.builders.ts:87): 5 utility events (CLASS_REMINDER, CLASS_ACTIVATED, LESSON_REPORT_SUBMITTED, LESSON_REPORT_REVIEWED, INVOICE_GENERATED); unmapped events get no WhatsApp payload.
- **Opt-in**: per-user `userNotificationPreferences` over allowlisted template-mapped events; WhatsApp default-OFF.

## 3. Webhook pipeline (current)

- Route: GET verify (`safeEqual` on hashed buffers), per-IP rate limit; POST: double 1MB body cap, HMAC-SHA256 vs `WHATSAPP_APP_SECRET`, replay nonce `whatsapp:replay:<sha256(body)>` 24h fail-closed (route.ts:236), **`stripInboundMessages()` removes `value.messages[]` (route.ts:166, fn 323–357)**, `after()`-deferred handler, 200 immediately.
- Handler `processEvent` → `collectEntryChanges` (103–121, ALSO defensively deletes `value.messages`) → `processChange` dispatch:
  - `messages` → `handleMessagesStatus` (statuses only; resolve userId via UserRepository.findByPhone; `batchResolveEventTypes` falls back to CLASS_REMINDER — analytics pollution) → `handleDeliveryWebhook`
  - 4 template lifecycle fields → audit only
  - `phone_number_quality_update` / `business_capability_update` → `applyPhoneNumberUpdate` → routes by `value.phone_number_id` → `systemFindByPhoneNumberId` + WABA cross-check (563–570)
  - `account_update` → lastWebhookAt + audit of `verified` only
  - **`smb_message_echoes`, `history`, `smb_app_state_sync`, `contacts`, inbound message bodies → default debug-log; fully ignored.**

## 4. Delivery tracking

Adapter inserts `notification_deliveries` (PENDING) before fetch; on Meta 200 sets SENT + `providerMessageId = wamid`. Webhook side keys on wamid: `handleDeliveryWebhook` = SELECT FOR UPDATE → rank-guard UPDATE, else INSERT … ON CONFLICT on the partial unique index with SQL rank guard. Resurrection = rank clause (FAILED → higher rank allowed); no `tryB3Resurrection` helper remains. The doc's 2 r3 HIGH issues are fixed in current code.

## 5. Already-partial toward multi-number/coexistence

- `whatsapp_accounts` is already one-row-per-number, unique phoneNumberId, per-row encrypted credentials; `syncFromMeta` iterates all numbers.
- Webhook→account routing already per-number with WABA cross-check.
- `throughputLevel` accepts `COEXISTENCE` verbatim (storage only; nothing reads it as behavior switch).

## 6. Gaps whatsapp2 must cover (file → change)

**Multi-number**
1. Sender identity in payload+dispatch: `types/whatsapp/whatsapp-channel.types.ts`, `notification-payloads.builders.ts`, `communication.service.ts:139`.
2. First-active chokepoint: `MetaCloudApiAdapter.resolveCredentials` + `findFirstActiveForCredentials`; per-account credential cache.
3. Singleton factory → per-account (or credential-scoped) instances.
4. Pair rate limit key → sender:recipient.
5. Env-global WABA/token used by sync → migrate sync to per-account credentials.
6. Schema: no purpose/role column; add enum (shared constants) + column + Pothos inputs (`whatsappAccountFieldHelpers.ts`).
7. `apiVersion` hardcoded v20.0 → per-account or newer default.
8. `isWhatsappConfigured`/`validateConfig` only reflect first-active account.

**Coexistence**
9. Inbound destruction: `stripInboundMessages` + defensive delete must become routing to persistence; `handleMessagesStatus` needs real `messages[]` branch.
10. New webhook fields: `smb_message_echoes`, `history`, `smb_app_state_sync`, `contacts` unhandled.
11. No request builders for coexistence endpoints (smb_app_data, register/deregister, ES token exchange).
12. No storage for threads/contacts/history-progress; no repo/service/GraphQL surface.
13. Replay-nonce + 1MB cap sized for status payloads — history chunks are large, Meta retries identical bodies (must not false-reject legitimate retries; currently identical-body retries ARE rejected for 24h — needs idempotent upsert instead).
14. `account_update` must handle coexistence connect/disconnect events.
15. Opt-in model has no analogue for inbound conversations.
