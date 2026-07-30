# WhatsApp Integration — Requirements (Specs)

**Feature**: WhatsApp Business Cloud API integration for Siraj  
**Version**: 1.1  
**Date**: 2026-07-30  
**Status**: Approved for implementation (post-review; all C/B/S/P/BL/Q findings applied)  
**Related**: [implementation.md](./implementation.md) · [trackable-tasks.md](./trackable-tasks.md)

**Process**: [.agents/spec-process-guide](../../.agents/spec-process-guide/NAVIGATION.md) — Requirements → Design (`implementation.md`) → Tasks (`trackable-tasks.md`)

---

## Introduction

Siraj needs WhatsApp as a fifth notification channel alongside on-app, email, SMS, and push. The integration uses **Meta WhatsApp Cloud API direct** (no BSP markup). On-premises WhatsApp API is deprecated (Oct 2025); Cloud API is the only supported path.

### Feature summary

Add WhatsApp outbound notifications via **pre-approved utility templates** (arbitrary free-text bodies are only legal inside the 24-hour service window), delivery status tracking via webhooks, hybrid credential storage, and an admin Numbers page — without inbound chat or a Templates CRUD UI in v1.

### Business value

- Reach parents and students on WhatsApp for class reminders, lesson reports, invoices, and related utility notifications.
- Delivery lifecycle (`sent` → `delivered` → `read` / `failed`) visible in the existing notification audit trail.
- Administrators configure WhatsApp business numbers and sync state from Meta without a third-party BSP inbox.

### Scope (v1)

| In scope | Out of scope (v2) |
|----------|-------------------|
| `WHATSAPP` notification channel in `CommunicationService` | Inbound chat / supervisor reply UI |
| Template-only sends (v1: no free-text outside 24h window optimization) | Per-event window-aware free-text optimization (BL4 deferred) |
| Meta Cloud API via raw `fetch` (no official Node SDK) | 360dialog / Twilio BSP adapters |
| Reuse `notification_deliveries` for delivery rows + index on `provider_message_id` | Dedicated `whatsapp_message_deliveries` table |
| Hybrid creds: env-config (global) + `whatsapp_accounts` (per-account, encrypted) | Templates admin CRUD page |
| Webhook: status + 4 template lifecycle events + account quality/capability | Periodic template sync cron (one-shot `syncTemplates` remains) |
| Numbers admin page (desktop + mobile tier-isolated) | Multi-WABA admin beyond list + sync |
| Permissions `whatsapp.view` / `whatsapp.config_manage` / `whatsapp.templates_manage` (3 only — see REQ-6) | Paid out-of-window reply toggles |
| Per-user WhatsApp opt-in preference (default OFF) | Opt-in via inbound message parsing |
| AR/EN `whatsapp` locale namespace | |

### Confirmed decisions (stakeholder + post-review)

1. Full product in one PR: channel + Numbers admin + webhooks + tests + permissions + i18n.
2. Delivery storage: existing `notification_deliveries` only, with new partial index on `provider_message_id`.
3. Credentials: hybrid env-config + encrypted DB per account.
4. Webhooks: outbound status only; inbound `messages[]` acknowledged with 200, **stripped at the route level before any logging/audit** (S3), not persisted.
5. Provider: Meta Cloud API only; `WHATSAPP_PROVIDER` env slot fixed to `cloud_api` (forward-compat).
6. Every Graph API call must have a matching `@live-comm` integration test (REQ-9) — builders reduced to the **core set actually invoked by runtime code** (Q1).
7. Template-only sends for all v1 events (BL4 deferred optimization).

### Official integration path
Meta discontinued `WhatsApp/WhatsApp-Nodejs-SDK` (archived June 2023, alpha v0.0.5). Meta docs state community SDKs are not endorsed. **Official path**: HTTPS to `https://graph.facebook.com/v23.0/...`.

References:
- [Cloud API overview](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [On-prem sunset](https://developers.facebook.com/docs/whatsapp/on-premises/sunset/)
- [Message API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/)

---

## Requirements

### REQ-1: WhatsApp as notification channel

**User story:** As a system operator, I want Siraj to send WhatsApp messages when notification events allow WhatsApp, so that users receive class and billing updates on WhatsApp.

#### Acceptance criteria

1. WHEN `CommunicationService.dispatch` receives a payload with `channel: "whatsapp"` THEN Siraj SHALL route it to a **dedicated `dispatchWhatsapp` branch** that maps notification metadata to a template send (not the email/sms-shaped `dispatchRecipientChannel`).
2. WHEN a notification is built for an event in `EVENT_CHANNEL_ALLOWLIST` with `WHATSAPP` THEN Siraj SHALL include a WhatsApp payload in the fan-out from `notification-payloads.builders`, carrying `whatsappTemplate: { name, languageCode, params }` in `metadata` (see REQ-2.6).
3. WHEN resolving recipient address for `whatsapp` THEN Siraj SHALL use `user.phone` (E.164) as the destination, consistent with SMS.
4. IF `CommunicationChannelType` is extended with `"whatsapp"` THEN the exhaustive `default: never` branch SHALL compile only after `case "whatsapp"` exists, **and** `CHANNEL_LABELS` in `backend/services/communication/utils.ts` SHALL compile only after a `whatsapp: "WhatsApp"` entry is added (both are forced by the same enum change — the plan's task list must include the `utils.ts` edit).

**Priority**: High | **Complexity**: Medium  
**Dependencies**: `NotificationChannel.WHATSAPP`, Drizzle enum, Pothos enum, codegen

---

### REQ-2: Send template messages via Cloud API

**User story:** As the notification system, I want to send WhatsApp **pre-approved template** messages via Meta Graph API, so that utility notifications reach users outside the 24h service window.

#### Acceptance criteria

1. WHEN the adapter sends a template message THEN Siraj SHALL `POST` to `/{phone_number_id}/messages` with `type: "template"`, `template.name`, `template.language.code`, and `template.components` per Meta schema.
2. WHEN Meta returns success THEN Siraj SHALL persist `providerMessageId` (`wamid`) on the `notification_deliveries` row and set status to `SENT`.
3. IF the same recipient received a message within the last 6 seconds THEN Siraj SHALL **defer the send until the window elapses** (schedule/delay), and SHALL NOT mark the delivery as FAILED on Meta error `131056` without a retry attempt. Rate-limit state SHALL be shared across process instances (Redis via existing `@upstash/redis`, or DB row), not an in-memory map.
4. IF Meta returns an error after retries THEN Siraj SHALL update delivery status to `FAILED` with `failureReason` and SHALL use `deliveryFailedMessage("whatsapp")`.
5. WHEN builds run in parallel for N recipients of the same event THEN Siraj SHALL cap concurrent Graph API calls (≤ 10) and batch delivery-row writes via `createManyDeliveries` (P1).
6. WHEN building the WhatsApp payload per event THEN `notification-payloads.builders.ts` SHALL attach `metadata.whatsappTemplate: { name, languageCode, params }` from a per-event canonical mapping (e.g. `class_reminder_utility_v1`); `languageCode` SHALL be read from the template row synced via `list-message-templates` (B6) — never hardcoded.
7. WHEN `dispatchMulti` fans out to N users THEN Siraj SHALL record that WhatsApp sends consume `portfolioMessagingLimitTier` budget **even on failure** (Q4) — logged with `failureCount` for accounting visibility.

**Priority**: High | **Complexity**: High  
**Dependencies**: REQ-1, REQ-3, typed request builders (REQ-9)

---

### REQ-3: Hybrid credential storage

**User story:** As an administrator, I want global webhook secrets in env-config and per-account tokens in the database, so that secrets are manageable and rotatable without exposing them in GraphQL responses.

#### Acceptance criteria

1. WHEN reading global WhatsApp config THEN Siraj SHALL resolve keys from `env-config-keys` category `whatsapp`: `WHATSAPP_PROVIDER` (plain, `cloud_api`), `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET` (secret), `WHATSAPP_VERIFY_TOKEN` (secret), `WHATSAPP_WABA_ID`, `WHATSAPP_WEBHOOK_BASE_URL`.
2. WHEN storing per-account credentials THEN Siraj SHALL encrypt `accessToken` and `twoStepPin` via `field-encryption.ts` in `whatsapp_accounts`.
3. IF a GraphQL client queries `WhatsappAccount` THEN Siraj SHALL never expose raw encrypted fields or decrypted secrets.
4. WHEN an admin updates access token or PIN THEN Siraj SHALL emit an audit log with secrets masked as `***`.
5. WHEN the adapter runs THEN Siraj SHALL decrypt the access token **per send call**, cache only the ciphertext, and never hold the plaintext on the factory singleton (S4).
6. WHEN `setAccessToken` / `setTwoStepPin` completes THEN Siraj SHALL call `resetWhatsappChannel()` to drop the factory singleton so the new token takes effect without a process restart (S4).

**Priority**: High | **Complexity**: Medium

---

### REQ-4: WhatsApp accounts admin (Numbers)

**User story:** As an admin with `whatsapp.config_manage`, I want to view and sync WhatsApp business numbers from Meta, and update account credentials, so that the channel can send without manual env edits.

#### Acceptance criteria

1. WHEN admin opens WhatsApp settings THEN Siraj SHALL show accounts with `displayPhoneNumber`, `qualityRating`, `portfolioMessagingLimitTier`, `throughputLevel`, `isActive`, `lastWebhookAt`. `portfolioMessagingLimitTier` SHALL store Meta's enum string verbatim (`UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET`) with no transformation (Q5).
2. WHEN admin invokes `syncWhatsappAccountsFromMeta` THEN Siraj SHALL call Graph API list/get phone number endpoints, **following `paging.cursors` until `paging.next` is absent** (P2), and update local rows (R2/R3/R8 field names).
3. WHEN admin edits access token or two-step PIN THEN Siraj SHALL validate permission `WHATSAPP_CONFIG_MANAGE` and persist encrypted values, then call `resetWhatsappChannel()` (S4).
4. WHERE i18n labels are shown for number onboarding THEN Siraj SHALL warn that a number cannot be used simultaneously on WhatsApp Business App (20 mps coexistence cap) and that new WABAs start with 2 number slots until verification (R7).
5. WHEN `syncFromMeta` completes THEN Siraj SHALL also invoke `list-message-templates` and snapshot name/language/category/status onto the audit entry's `metadata` JSON (BL3) — required, not optional — so audit entries for the four template lifecycle webhooks resolve locally.

**Priority**: High | **Complexity**: High  
**Dependencies**: REQ-3, REQ-8

---

### REQ-5: Webhook receiver (verification + events)

**User story:** As the platform, I want to receive Meta webhooks securely, so that delivery status and account/template lifecycle events are processed reliably.

#### Acceptance criteria

1. WHEN Meta sends GET with `hub.verify_token` matching `WHATSAPP_VERIFY_TOKEN` THEN Siraj SHALL return `hub.challenge` as plain text with HTTP 200. Compare SHALL use `crypto.timingSafeEqual` over constant-length buffers (S5). Repeated failures from the same IP SHALL be logged with `(ip, userAgent, contentLength)` only and rate-limited (S1).
2. WHEN Meta sends POST THEN Siraj SHALL read raw body via `await req.text()` BEFORE JSON parse, verify `X-Hub-Signature-256` with HMAC-SHA256 keyed by `WHATSAPP_APP_SECRET`, using `crypto.timingSafeEqual`.
3. IF signature verification fails THEN Siraj SHALL return HTTP 401 and SHALL not parse the body; logs SHALL contain only `(ip, userAgent, contentLength, signaturePrefix)` — never the raw body (S2).
4. WHEN webhook contains `value.statuses[]` THEN Siraj SHALL upsert `notification_deliveries` keyed by `providerMessageId === wamid` (`INSERT … ON CONFLICT DO UPDATE`, P3) with forward-only transitions. Status rank map: `accepted: 0 → sent: 1 → delivered: 2 → read: 3`; `failed: -1`. Transition takes effect iff `newRank > currentRank` OR (`currentRank = -1` AND `newRank > 0` — a delayed `delivered` after a transient `failed` resurrects the row). `deliveredAt` may remain null when `read` arrives without `delivered`; dashboards tolerate that (B3).
5. WHEN webhook field is one of `message_template_status_update`, `template_category_update`, `message_template_quality_update`, `message_template_components_update` THEN Siraj SHALL emit audit log entries (`entityType: WHATSAPP_ACCOUNT`) without persisting templates locally in v1.
6. WHEN webhook is `phone_number_quality_update` THEN Siraj SHALL read `max_daily_conversations_per_business` (not deprecated `old_limit`/`current_limit`) and update `portfolioMessagingLimitTier` on matching accounts; the value SHALL be the raw Meta enum string (Q5).
7. WHEN webhook is `business_capability_update` THEN Siraj SHALL process `max_phone_numbers_per_business` and messaging limit updates (R6).
8. WHEN webhook contains `value.messages[]` (inbound) THEN Siraj SHALL strip those entries **at the route level** before handing the event to the handler/logger (S3) and SHALL return HTTP 200 without persisting them.
9. WHEN POST handler completes verification THEN Siraj SHALL return HTTP 200 quickly and defer DB work via **`after(async () => …)` from `next/server`** (verified available in this repo's Next build at `node_modules/next/dist/server/after`). `queueMicrotask` is forbidden — it is dropped by serverless runtimes and swallows handler rejections (C3). If `after()` import fails at build time, the handler SHALL await the full pipeline synchronously instead.

**Priority**: High | **Complexity**: High  
**Dependencies**: REQ-3, app route `app/api/webhooks/whatsapp/route.ts`

---

### REQ-6: Permissions and audit

**User story:** As a security administrator, I want WhatsApp operations gated by explicit permissions, so that only authorized staff manage numbers and templates sync.

#### Acceptance criteria

1. WHEN permissions are seeded THEN Siraj SHALL add exactly three permissions (Q: `whatsapp.dispatch` is dropped because v1 has no send-mutation to gate — avoids dead permission): `whatsapp.view`, `whatsapp.config_manage`, `whatsapp.templates_manage` via two-phase migration (8a enum / 8b data) mirroring the settings permissions pattern (BL2).
2. WHEN `super_admin` group is seeded THEN Siraj SHALL grant all three WhatsApp permissions.
3. WHEN WhatsApp account or env-config affecting WhatsApp is mutated THEN Siraj SHALL write audit logs with `AuditEntityType` including `WHATSAPP_ACCOUNT`.
4. WHEN `syncTemplates` runs (BL3) THEN audit entry SHALL include the fetched template snapshot (name, language, category, status) in `metadata` for later lifecycle-event reconciliation.

**Priority**: High | **Complexity**: Medium

---

### REQ-7: Internationalization (AR/EN)

**User story:** As an Arabic or English user, I want WhatsApp settings and delivery errors localized, so that the admin UI and notification failures are understandable.

#### Acceptance criteria

1. WHEN rendering WhatsApp admin UI THEN Siraj SHALL use namespace `whatsapp` in `shared/locale/types`, `en`, and `ar`, registered in `message.ts` and `server.ts`.
2. WHEN WhatsApp delivery fails THEN Siraj SHALL use keys in the existing `notifications` namespace for channel-specific failure labels.
3. WHEN localizing template `language.code` for outbound sends THEN Siraj SHALL pull the **exact approved language code from the synced `list-message-templates` payload** (e.g. `ar`, `en_US`, `ar_AR` per Meta's canonical list), never a guessed mapping (B6).

**Priority**: Medium | **Complexity**: Low

---

### REQ-8: GraphQL API for accounts

**User story:** As the frontend admin UI, I want GraphQL queries and mutations for WhatsApp accounts, so that Numbers page can load and sync data.

#### Acceptance criteria

1. WHEN defining Pothos objects THEN Siraj SHALL import types from `backend/types/whatsapp` only (no local Pothos type defs).
2. WHEN exposing account objects THEN Siraj SHALL always include `id` for Apollo cache normalization.
3. WHEN mutations run THEN Siraj SHALL use `withAuthResult` / `withAuthVoid` and delegate to `whatsapp-account.service`.
4. WHEN `updateWhatsappAccount` (or token/PIN mutations) succeeds THEN the mutation SHALL also call `resetWhatsappChannel()` server-side (S4).

**Priority**: High | **Complexity**: Medium

---

### REQ-9: Integration tests for every Graph API call

**User story:** As a developer, I want each Cloud API endpoint wrapped in a typed builder with a `@live-comm` integration test, so that API contract regressions are caught before production.

#### Acceptance criteria

1. WHEN a new `*.request.ts` builder is added under `cloud-api/requests/` THEN a matching `*.integration.test.ts` SHALL exist under `cloud-api/integration/`.
2. WHEN CI runs without `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_TEST_TO_PHONE`, and `WHATSAPP_WABA_ID` THEN integration tests SHALL skip (not fail).
3. WHEN `bun run test:live-comm` runs with credentials THEN tests SHALL hit real Graph API for: **send template**, **list phone numbers**, **get phone number**, **list message templates**, and **pair rate limit defer**. Registering / deregistering / request_code / verify_code / create / delete template builders are **out of scope for v1** — those operations are performed by admins in WhatsApp Manager, so v1 builds no code for them (Q1 alignment with REQ-9.1).
4. WHEN `whatsapp-api-call-coverage.test.ts` runs THEN it SHALL fail if any request builder under `cloud-api/requests/` lacks a paired integration test file.
5. WHEN pair-rate-limit integration test runs THEN it SHALL send 2 template messages to the same recipient inside a 6-second window and assert the **second send is deferred until ≥ 6 s after the first**, not failed with `131056` (B2).

**Priority**: High | **Complexity**: High

---

### REQ-10: Per-user opt-in (legal/compliance)

**User story:** As a compliance owner, I want WhatsApp to default OFF per user until explicit opt-in, so that Siraj never violates Meta's business-initiated messaging policy and triggers quality-rating demotion.

#### Acceptance criteria

1. WHEN `notification-payloads.builders.ts` fans out a WhatsApp payload for a user THEN Siraj SHALL check the per-user channel preference and skip the WhatsApp payload if `whatsappEnabled !== true` (BL1).
2. WHEN a user opts in THEN a `whatsapp_opt_in` event SHALL be recorded to the audit log with `userId`, `timestamp`, and `source` (e.g. `profile_settings`, `admin_override`).
3. WHERE the notification-preferences UI lists channels THEN WhatsApp SHALL appear with copy explaining that opting in requires a verified phone number on file.
4. WHEN `EVENT_CHANNEL_ALLOWLIST` includes `WHATSAPP` for an event THEN the fan-out SHALL still respect the per-user opt-in gate — allowlist is event → channel policy, opt-in is user → channel policy; both must pass.

**Priority**: High | **Complexity**: Medium  
**Dependencies**: REQ-1, REQ-2, user notification-preference storage (extend existing schema)

---

## Non-functional requirements

### Performance

- WHEN sending via adapter THEN Siraj SHALL use `AbortSignal.timeout(10_000)` on Graph API `fetch` calls.
- WHEN fanning out to N recipients THEN Siraj SHALL cap concurrent Graph API calls at 10 and use `createManyDeliveries` for bulk delivery-row writes (P1).
- WHEN syncing accounts/templates from Meta THEN Siraj SHALL follow `paging.cursors.next` until exhausted (P2).
- IF Meta portfolio messaging tier is unverified THEN operations SHALL respect Meta tier 0 limit (250 unique users / 24h) — documented for operators.
- WHEN webhook handler looks up deliveries by `wamid` THEN Siraj SHALL use a partial index on `notification_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL` to avoid sequential scans (B5).

### Security

- WHEN verifying webhooks THEN Siraj SHALL use raw body HMAC verification (never re-serialize JSON for hashing).
- WHEN signature or verify-token mismatch occurs THEN Siraj SHALL log only `(ip, userAgent, contentLength)` — never the body, never the full signature (S2).
- WHEN receiving inbound `value.messages[]` THEN Siraj SHALL strip them at the route before any logging or handler invocation (S3).
- WHEN the GET verify endpoint is probed repeatedly THEN Siraj SHALL rate-limit per IP after N mismatches (S1) — implement via existing middleware or edge config.
- WHEN comparing `hub.verify_token` THEN Siraj SHALL use `crypto.timingSafeEqual` over equal-length buffers (S5).
- WHEN accessing account tokens THEN Siraj SHALL decrypt per call and never hold plaintext on singletons; `resetWhatsappChannel` SHALL be exported and invoked on token mutation (S4).
- WHEN storing tokens THEN Siraj SHALL use AES-256-GCM via `field-encryption.ts`.
- WHEN logging audit entries for secrets THEN Siraj SHALL mask values as `***`.

### Reliability

- WHEN webhook delivery is at-least-once THEN status updates SHALL be **upsert by `wamid`** (`INSERT … ON CONFLICT DO UPDATE`, P3) so out-of-order arrival (webhook before adapter row insert) is safe.
- WHEN status events arrive out of order THEN forward-only state machine with rank map SHALL prevent regression; restart-from-`failed` permitted iff new status rank > 0 (B3).
- WHEN deferring webhook work THEN Siraj SHALL use `after()` from `next/server`, never `queueMicrotask` (C3).
- WHEN pair-rate-limiting THEN state SHALL live in Redis (`@upstash/redis`) or DB, not an in-memory map (B2).
- WHEN account `updatedAt` is needed THEN column SHALL use `$onUpdate(() => new Date())` so repository updates need not set it manually (B4).

### Usability

- WHERE admin Numbers page is shown THEN Siraj SHALL provide desktop and mobile tier-isolated views via `ResponsiveViewSwitch` without `useMediaQuery` in tier files.

---

## Constraints and assumptions

### Technical constraints

- No new npm dependencies for WhatsApp SDK; use `fetch`, `libphonenumber-js`, existing `jose`/`crypto` for HMAC, existing `@upstash/redis` for shared rate-limit state.
- Graph API version: `v23.0` (align with Meta docs at implementation time).
- Drizzle migrations: `db push` only; `db reset` / `cleanGenerate` disabled by repo policy.
- Postgres enum additions: split 8a (enum only) / 8b (data) due to `check_safe_enum_use`.
- Next.js `after()` verified available via `node_modules/next/server.d.ts` export and `next/dist/server/after` module — no fallback import required.

### Business constraints

- Template authoring in v1: WhatsApp Manager (Meta UI). `syncTemplates` mutation is required (BL3) but performs read-only sync — never write — to back audit reconciliation.
- Utility category templates preferred for educational notifications; marketing subject to Meta per-user frequency caps. **v1 sends only `template` payloads**; free-text optimization for service-window replies deferred (BL4).
- Meta requires user opt-in before business-initiated sends; non-compliance downgrades quality and tier. Siraj defaults per-user WhatsApp to OFF until opt-in (REQ-10).

### Assumptions

- Users have valid E.164 `user.phone` for WhatsApp delivery (same as SMS).
- Production webhook URL is public HTTPS reachable by Meta.
- Meta Business Verification will be completed for production scale (tier upgrades).
- Pre-approved utility templates named in `notification-payloads.builders.ts` exist in the WABA before events fan out; Meta error `132012` / `132001` responses surface to `failed` deliveries for admin investigation.

---

## Success criteria

### Definition of done

- [ ] All REQ acceptance criteria satisfied (including new REQ-10)
- [ ] **Quality loop** (tsgo + biome + lint) passes on all modified files
- [ ] `@live-comm` matrix complete (REQ-9) + coverage guard test green
- [ ] `trackable-tasks.md` all phases marked complete
- [ ] GraphQL schema + frontend codegen updated
- [ ] Inbound events provably not logged anywhere (S3 — checked via webhook unit test asserting logger receives only whitelisted fields)

### Acceptance metrics

- Successful template send to test recipient returns `wamid` and webhook advances delivery status
- Second send within 6 s is deferred, not failed (B2)
- Webhook arriving **before** adapter row insert still produces the correct final state (P3 upsert test)
- Transient `failed` followed by `delivered` ends in `delivered` state (B3)
- Admin can sync accounts + templates from Meta and see tier/quality fields, with audit entry containing the template snapshot (BL3)
- Webhook signature rejection returns 401 for tampered payloads, with logs containing only metadata (S2)
- Inbound `messages[]` produces HTTP 200 with zero PII in logs (S3)
- Per-user opt-in gate blocks sends to opted-out users (REQ-10)

---

## Glossary

| Term | Definition |
|------|------------|
| WABA | WhatsApp Business Account — container for phone numbers and templates |
| Cloud API | Meta-hosted WhatsApp Business Platform API (only supported architecture post-2025) |
| wamid | WhatsApp message ID returned by send API; used for status webhook correlation |
| Utility template | Meta category for transactional messages (class reminders, invoice notices) |
| Portfolio messaging limit | Per-business-portfolio daily unique-user cap. Enum verbatim from Meta: `UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET`. Surfaced via `max_daily_conversations_per_business` / `whatsapp_business_manager_messaging_limit` fields. Failed sends still consume budget (Q4). |
| Pair rate limit | Meta limit: ~1 message per recipient per 6 seconds (error `131056`). Siraj defers, never fails (B2). |
| 24-hour service window | Free-text reply window opened by the user's last inbound message. Outside the window, only template sends allowed. v1 always uses templates (BL4). |
| `after()` | `next/server` API for deferred post-response work that survives serverless response flush; replaces `queueMicrotask` (C3). |
| `@live-comm` | Integration tests gated by env credentials; skipped in CI without secrets |
| Opt-in | Per-user WhatsApp consent flag; required by Meta policy before business-initiated sends (REQ-10) |

---

## Requirements review checklist

- [x] User stories have roles, features, benefits
- [x] Acceptance criteria use EARS-style WHEN/IF/THEN/SHALL
- [x] Non-functional requirements addressed
- [x] Out of scope documented
- [x] Traceability to implementation.md and trackable-tasks.md
- [x] Post-review findings applied (C1–C3, B1–B6, S1–S5, P1–P3, BL1–BL4, Q1–Q5)
