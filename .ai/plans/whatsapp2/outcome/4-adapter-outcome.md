# Phase 4 — Per-Account Adapter & Factory

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 4.1, 4.2, 4.2a, 4.2b, 4.3, 4.4, 4.5, 4.QL, 4.TE, 4.SEC, 4.SR, 4.IV

## Summary

The channel layer is fully multi-number: one `MetaCloudApiAdapter` instance per
`whatsapp_accounts` row, per-account credential resolution with no cross-account
fallback, pair rate-limit keys namespaced by sender, offboard fail-fast before any
Graph call, Graph API version unified on the env-config key `WHATSAPP_GRAPH_API_VERSION`
(default `v25.0`), and aggregate/per-account health surfaces.

## State on arrival (inherited from the cut-off agent)

Most implementation landed before the cut-off but the repo was in a broken state:
`whatsapp-channel.test.ts` contained a `test.only` debug probe with `Bun.write`
scratch dumps, and its recipient mock carried a `+` prefix rejected by the request
builder (`"Invalid recipient to: must be non-empty numeric string"`). This agent
rewrote the test suite clean and closed the quality loop.

## What exists (4.1–4.5 verified against code)

- **4.1** `WhatsappChannelFactory.ts` — per-account `Map<string, IWhatsappChannel>` +
  `initializationPromises` map; `getWhatsappChannel(accountId)` lazy-cached per account;
  `getChannelForPurpose(purpose)` (purpose account → GENERAL fallback → `null`);
  `resetWhatsappChannel(accountId?)` per-account or global, race-guarded (waits for
  in-flight ops, coalesced reset waiter); `validateWhatsappChannelConfig(accountId)`
  health hook; `whatsappChannel` legacy proxy honors `payload.senderAccountId`, else
  GENERAL default (never "first active of any purpose").
- **4.2** `MetaCloudApiAdapter.ts` — constructor takes `accountId`; `resolveCredentials`
  bound strictly to that account (`WhatsappAccountRepository.findCredentialsById`),
  5s in-memory credentials cache, decrypt-on-demand; pair rate-limit key
  `whatsapp:pair:<sender digits | phoneNumberId>:<recipient>` (Redis w/ local bounded
  fallback); hardcoded `v20.0` removed — `resolveGraphApiVersion()` in
  `backend/lib/whatsapp-constants.ts` resolves `WHATSAPP_GRAPH_API_VERSION` → legacy
  `WHATSAPP_API_VERSION` → `DEFAULT_GRAPH_API_VERSION = "v25.0"`.
- **4.2a/4.2b** `WHATSAPP_GRAPH_API_VERSION` + `WHATSAPP_ES_CONFIG_ID` registered in
  `ENV_CONFIG_KEYS` (`whatsapp` category, plain display, DB-overridable; NOT in the
  shared hidden/constants list); both declared in `environment.d.ts` and `.env.example`.
- **4.3** Offboarding: `WhatsappAccountOffboardedError` (`whatsapp.accountOffboarded`
  in `backend/lib/errors.ts`) thrown in `resolveCredentials` before any Graph call /
  delivery row; surfaced as `sendAttempted: false` + `errorCode`. Adapter eviction via
  `resetWhatsappChannel(accountId)` invoked from deactivate/delete/setAccessToken/
  setTwoStepPin in `whatsapp-account.service.ts`.
- **4.4** `syncFromMeta` credentials via `resolveGraphApiContext`: active GENERAL
  account's decrypted token first; env-global `WHATSAPP_ACCESS_TOKEN` only as the
  first-account bootstrap path (documented in the helper's JSDoc).
- **4.5** `WhatsappAccountService.isConfigured()` aggregates across active accounts
  (any healthy ⇒ configured); `validateAccountConfig(accountId)` per-account hook;
  GraphQL `isWhatsappConfigured` resolver routes to the aggregate.
## Files changed in this wave

| File | Change |
|---|---|
| `backend/services/communication/test/whatsapp-channel.test.ts` | Full v2 rewrite (29 tests): instance-map caching, per-account reset, purpose resolution, bearer-token isolation, pair-key namespacing + phoneNumberId fallback, token-rotation cache isolation, API-version default/override, offboard fail-fast + eviction, health hooks, 500/131056/401 paths |
| `backend/services/communication/test/pair-rate-limit.test.ts` | Repaired redaction-corrupted mock (`MOCK_SENDER_KEY`, `displayPhoneNumber`) — 3 tests were failing on phone-number placeholder corruption |
| `backend/services/whatsapp/test/whatsapp-optin.test.ts` | Added `WhatsappSyncRequestRepository` + `WhatsappWebhookEventRepository` stubs to the repo-barrel mock (static export checks required by the in-flight coexistence/ingest modules) |
| `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts` | oxlint fixes: `void trackInFlight(...)`, `Promise.all` disconnect loop |
| `backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.ts` | CodeScene "Large Method (79 LoC)" fix: extracted `retryAfterTokenRefresh` from `executeSend` |
| `backend/lib/whatsapp-constants.ts` | `prefer-nullish-coalescing` fix in `resolveGraphApiVersion` (empty-string semantics preserved) |
| `backend/services/whatsapp/index.ts` | **Neutralized a dangling barrel line**: a sibling agent's `export * from "./whatsapp-webhook-inbox.helpers"` referenced a non-existent file, breaking every backend module graph that reaches the whatsapp barrel (incl. all whatsapp tests). Line commented with a note; re-add when the helper file lands. |

Earlier in the day (by the cut-off agent): factory/adapter/service/env-config/errors implementation listed above.

## Verification (4.QL + 4.TE)

Sub-loop `--lifecycle codescene` exit 0 for every Phase 4 file:
`WhatsappChannelFactory.ts`, `MetaCloudApiAdapter.ts`, `cloud-api/requests/index.ts`,
`backend/lib/whatsapp-constants.ts`, `backend/lib/env-config-keys.ts`, `backend/lib/errors.ts`,
`backend/services/whatsapp/whatsapp-account.service.ts`, `backend/services/whatsapp/index.ts`,
`communication/test/whatsapp-channel.test.ts`, `communication/test/pair-rate-limit.test.ts`,
`whatsapp/test/whatsapp-optin.test.ts`. (`environment.d.ts` is outside lint/oxlint scope; tsgo-clean.)

Tests via `bun run test/scripts/run-test.ts` (all green after the barrel repair):
- `whatsapp-channel.test.ts` — **29 pass / 0 fail**
- `pair-rate-limit.test.ts` — **14 pass / 0 fail**
- `whatsapp-webhook.handler.test.ts` — **43 pass / 0 fail** (sanity)
- `whatsapp-optin.test.ts` — **16 pass / 0 fail** (sanity)

## 4.SEC / 4.SR / 4.IV

- **SEC**: credential decryption in-memory only (5s TTL, cleared on `disconnect()`); no
  cross-account token fallback; accountId derived server-side (repo/dispatch), never from
  client input; offboard + inactive + missing all fail before Graph/delivery-row; HMAC/webhook
  concerns unchanged.
- **SR**: `resetWhatsappChannel*` invalidates the full `WHATSAPP_ENV_CONFIG_KEYS` set —
  `WHATSAPP_PROVIDER`, `APP_SECRET`, `VERIFY_TOKEN`, `WABA_ID`, `ACCESS_TOKEN`,
  `PHONE_NUMBER_ID`, legacy `API_VERSION`, `GRAPH_API_VERSION`, `ES_CONFIG_ID` — covering every
  `resolveEnvConfig("WHATSAPP_*")` call site (factory, whatsapp-constants, webhook route,
  account service). No `...input` spreads, no unbounded module state beyond the bounded
  local rate-limit map, enums value-imported, no plan tags in comments. Nothing new for
  `deferred-items.md` (process-local concurrency was already logged as D9-adjacent).
- **IV**: read root `AGENTS.md`, `backend/AGENTS.md`, `backend/services/AGENTS.md`,
  `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`,
  `backend/db/repo/AGENTS.md`; enforced no-console, logger usage, no real provider calls in
  service tests (all Meta traffic mocked via `fetch` spy + mocked repos/Redis).

## Carry-forward for Phases 5/8

1. Phase 5 dispatch should call `getChannelForPurpose(purpose)` and attach
   `senderAccountId` to the payload — the factory already honors it in the proxy path.
2. Phase 8 reads `WHATSAPP_ES_CONFIG_ID` via `resolveEnvConfig` server-side and resets the
   channel after account creation (service already does this in `createAccount`? — no:
   creation resets only when tokens/activation change; ES completion should call
   `resetWhatsappChannel(newAccountId)` explicitly after writing credentials).
3. Barrel hazard: when `whatsapp-webhook-inbox.helpers.ts` lands, restore its export in
   `backend/services/whatsapp/index.ts` (see "Files changed" note).
4. Test hygiene: never write real-looking phone numbers/tokens into tests — the sandbox
   redaction corrupts them on round-trip; use digit-only fakes (`155555*`) and `tok_test_*`.

