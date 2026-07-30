# WhatsApp Integration — Requirements (Specs)

**Feature**: WhatsApp Business Cloud API integration for Siraj  
**Version**: 1.0  
**Date**: 2026-07-30  
**Status**: Approved for implementation  
**Related**: [implementation.md](./implementation.md) · [trackable-tasks.md](./trackable-tasks.md)

**Process**: [.agents/spec-process-guide](../../.agents/spec-process-guide/NAVIGATION.md) — Requirements → Design (`implementation.md`) → Tasks (`trackable-tasks.md`)

---

## Introduction

Siraj needs WhatsApp as a fifth notification channel alongside on-app, email, SMS, and push. The integration uses **Meta WhatsApp Cloud API direct** (no BSP markup). On-premises WhatsApp API is deprecated (Oct 2025); Cloud API is the only supported path.

### Feature summary

Add WhatsApp outbound notifications (utility templates + system events), delivery status tracking via webhooks, hybrid credential storage, and an admin Numbers page — without inbound chat or a Templates CRUD UI in v1.

### Business value

- Reach parents and students on WhatsApp for class reminders, lesson reports, invoices, and related utility notifications.
- Delivery lifecycle (`sent` → `delivered` → `read` / `failed`) visible in the existing notification audit trail.
- Administrators configure WhatsApp business numbers and sync state from Meta without a third-party BSP inbox.

### Scope (v1)

| In scope | Out of scope (v2) |
|----------|-------------------|
| `WHATSAPP` notification channel in `CommunicationService` | Inbound chat / supervisor reply UI |
| Meta Cloud API via raw `fetch` (no official Node SDK) | 360dialog / Twilio BSP adapters |
| Reuse `notification_deliveries` for delivery rows | Dedicated `whatsapp_message_deliveries` table |
| Hybrid creds: env-config (global) + `whatsapp_accounts` (per-account, encrypted) | Templates admin CRUD page |
| Webhook: status + 4 template lifecycle events + account quality/capability | Periodic template sync cron |
| Numbers admin page (desktop + mobile tier-isolated) | Multi-WABA admin beyond list + sync |
| Permissions `whatsapp.*` (8a/8b migration) | Paid out-of-window reply toggles |
| AR/EN `whatsapp` locale namespace | |

### Confirmed decisions (stakeholder)

1. Full product in one PR: channel + Numbers admin + webhooks + tests + permissions + i18n.
2. Delivery storage: existing `notification_deliveries` only.
3. Credentials: hybrid env-config + encrypted DB per account.
4. Webhooks: outbound status only; inbound `messages[]` acknowledged with 200, not persisted.
5. Provider: Meta Cloud API only; `WHATSAPP_PROVIDER` env slot fixed to `cloud_api` (forward-compat).
6. Every Graph API call must have a matching `@live-comm` integration test (R9).

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

1. WHEN `CommunicationService.dispatch` receives a payload with `channel: "whatsapp"` THEN Siraj SHALL route the dispatch to the WhatsApp channel adapter.
2. WHEN a notification is built for an event in `EVENT_CHANNEL_ALLOWLIST` with `WHATSAPP` THEN Siraj SHALL include a WhatsApp payload in the fan-out from `notification-payloads.builders`.
3. WHEN resolving recipient address for `whatsapp` THEN Siraj SHALL use `user.phone` (E.164) as the destination, consistent with SMS.
4. IF `CommunicationChannelType` is extended with `"whatsapp"` THEN the exhaustive `default: never` branch in `CommunicationService.dispatch` SHALL compile only after the `whatsapp` case exists.

**Priority**: High | **Complexity**: Medium  
**Dependencies**: `NotificationChannel.WHATSAPP`, Drizzle enum, Pothos enum, codegen

---

### REQ-2: Send text and template messages via Cloud API

**User story:** As the notification system, I want to send WhatsApp text and pre-approved template messages via Meta Graph API, so that utility notifications reach users outside the 24h service window.

#### Acceptance criteria

1. WHEN the adapter sends a text message THEN Siraj SHALL `POST` to `/{phone_number_id}/messages` with `type: "text"` and Bearer token from the active account.
2. WHEN the adapter sends a template message THEN Siraj SHALL `POST` with `type: "template"`, `template.name`, `template.language.code`, and `template.components` per Meta schema.
3. WHEN Meta returns success THEN Siraj SHALL persist `providerMessageId` (`wamid`) on the `notification_deliveries` row and set status to `SENT` (or equivalent lifecycle step).
4. IF the same recipient received a message within the last 6 seconds THEN Siraj SHALL not issue a second HTTP call and SHALL treat the send as rate-limited (Meta pair limit / error `131056` pattern).
5. IF Meta returns an error THEN Siraj SHALL update delivery status to `FAILED` with `failureReason` and SHALL use localized `deliveryFailedMessage("whatsapp")`.

**Priority**: High | **Complexity**: High  
**Dependencies**: REQ-1, REQ-3, typed request builders (R9)

---

### REQ-3: Hybrid credential storage

**User story:** As an administrator, I want global webhook secrets in env-config and per-account tokens in the database, so that secrets are manageable and rotatable without exposing them in GraphQL responses.

#### Acceptance criteria

1. WHEN reading global WhatsApp config THEN Siraj SHALL resolve keys from `env-config-keys` category `whatsapp`: `WHATSAPP_PROVIDER` (plain, `cloud_api`), `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET` (secret), `WHATSAPP_VERIFY_TOKEN` (secret), `WHATSAPP_WABA_ID`, `WHATSAPP_WEBHOOK_BASE_URL`.
2. WHEN storing per-account credentials THEN Siraj SHALL encrypt `accessToken` and `twoStepPin` via `field-encryption.ts` in `whatsapp_accounts`.
3. IF a GraphQL client queries `WhatsappAccount` THEN Siraj SHALL never expose raw encrypted fields or decrypted secrets in the return type.
4. WHEN an admin updates access token or PIN THEN Siraj SHALL emit an audit log with secrets masked as `***`.

**Priority**: High | **Complexity**: Medium

---

### REQ-4: WhatsApp accounts admin (Numbers)

**User story:** As an admin with `whatsapp.config_manage`, I want to view and sync WhatsApp business numbers from Meta, and update account credentials, so that the channel can send without manual env edits.

#### Acceptance criteria

1. WHEN admin opens WhatsApp settings THEN Siraj SHALL show accounts with `displayPhoneNumber`, `qualityRating`, `portfolioMessagingLimitTier`, `throughputLevel`, `isActive`, `lastWebhookAt`.
2. WHEN admin invokes `syncWhatsappAccountsFromMeta` THEN Siraj SHALL call Graph API list/get phone number endpoints and update local rows (R2/R3/R8 field names).
3. WHEN admin edits access token or two-step PIN THEN Siraj SHALL validate permission `WHATSAPP_CONFIG_MANAGE` and persist encrypted values.
4. WHERE i18n labels are shown for number onboarding THEN Siraj SHALL warn that a number cannot be used simultaneously on WhatsApp Business App (20 mps coexistence cap) and that new WABAs start with 2 number slots until verification (R7).

**Priority**: High | **Complexity**: High  
**Dependencies**: REQ-3, REQ-8

---

### REQ-5: Webhook receiver (verification + events)

**User story:** As the platform, I want to receive Meta webhooks securely, so that delivery status and account/template lifecycle events are processed reliably.

#### Acceptance criteria

1. WHEN Meta sends GET with `hub.verify_token` matching `WHATSAPP_VERIFY_TOKEN` THEN Siraj SHALL return `hub.challenge` as plain text with HTTP 200.
2. WHEN Meta sends POST THEN Siraj SHALL read raw body via `await req.text()` BEFORE JSON parse, verify `X-Hub-Signature-256` with HMAC-SHA256 keyed by `WHATSAPP_APP_SECRET`, using `crypto.timingSafeEqual`.
3. IF signature verification fails THEN Siraj SHALL return HTTP 401 and SHALL not parse the body.
4. WHEN webhook contains `value.statuses[]` THEN Siraj SHALL update `notification_deliveries` by `providerMessageId === wamid` with forward-only transitions: `sent` < `delivered` < `read`; `failed` terminal; idempotent duplicates no-op.
5. WHEN webhook field is one of `message_template_status_update`, `template_category_update`, `message_template_quality_update`, `message_template_components_update` THEN Siraj SHALL emit audit log entries (`entityType: WHATSAPP_ACCOUNT`) without persisting templates locally in v1.
6. WHEN webhook is `phone_number_quality_update` THEN Siraj SHALL read `max_daily_conversations_per_business` (not deprecated `old_limit`/`current_limit`) and update `portfolioMessagingLimitTier` on matching accounts (R2/R3).
7. WHEN webhook is `business_capability_update` THEN Siraj SHALL process `max_phone_numbers_per_business` and messaging limit updates (R6).
8. WHEN webhook contains `value.messages[]` (inbound) THEN Siraj SHALL return HTTP 200 and SHALL NOT persist message content.
9. WHEN POST handler completes verification THEN Siraj SHALL return HTTP 200 quickly and defer DB work (e.g. `queueMicrotask`) to avoid Meta 5s timeout.

**Priority**: High | **Complexity**: High  
**Dependencies**: REQ-3, app route `app/api/webhooks/whatsapp/route.ts`

---

### REQ-6: Permissions and audit

**User story:** As a security administrator, I want WhatsApp operations gated by explicit permissions, so that only authorized staff manage numbers and templates sync.

#### Acceptance criteria

1. WHEN permissions are seeded THEN Siraj SHALL add `whatsapp.view`, `whatsapp.config_manage`, `whatsapp.templates_manage`, `whatsapp.dispatch` via two-phase migration (8a enum / 8b data) mirroring settings permissions pattern.
2. WHEN `super_admin` group is seeded THEN Siraj SHALL grant all four WhatsApp permissions.
3. WHEN WhatsApp account or env-config affecting WhatsApp is mutated THEN Siraj SHALL write audit logs with `AuditEntityType` including `WHATSAPP_ACCOUNT`.

**Priority**: High | **Complexity**: Medium

---

### REQ-7: Internationalization (AR/EN)

**User story:** As an Arabic or English user, I want WhatsApp settings and delivery errors localized, so that the admin UI and notification failures are understandable.

#### Acceptance criteria

1. WHEN rendering WhatsApp admin UI THEN Siraj SHALL use namespace `whatsapp` in `shared/locale/types`, `en`, and `ar`, registered in `message.ts` and `server.ts`.
2. WHEN WhatsApp delivery fails THEN Siraj SHALL use keys in the existing `notifications` namespace for channel-specific failure labels.

**Priority**: Medium | **Complexity**: Low

---

### REQ-8: GraphQL API for accounts

**User story:** As the frontend admin UI, I want GraphQL queries and mutations for WhatsApp accounts, so that Numbers page can load and sync data.

#### Acceptance criteria

1. WHEN defining Pothos objects THEN Siraj SHALL import types from `backend/types/whatsapp` only (no local Pothos type defs).
2. WHEN exposing account objects THEN Siraj SHALL always include `id` for Apollo cache normalization.
3. WHEN mutations run THEN Siraj SHALL use `withAuthResult` / `withAuthVoid` and delegate to `whatsapp-account.service`.

**Priority**: High | **Complexity**: Medium

---

### REQ-9: Integration tests for every Graph API call

**User story:** As a developer, I want each Cloud API endpoint wrapped in a typed builder with a `@live-comm` integration test, so that API contract regressions are caught before production.

#### Acceptance criteria

1. WHEN a new `*.request.ts` builder is added under `cloud-api/requests/` THEN a matching `*.integration.test.ts` SHALL exist under `cloud-api/integration/`.
2. WHEN CI runs without `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_TEST_TO_PHONE`, and `WHATSAPP_WABA_ID` THEN integration tests SHALL skip (not fail).
3. WHEN `bun run test:live-comm` runs with credentials THEN tests SHALL hit real Graph API for: send text, send template, register, deregister, request_code, verify_code, list phone numbers, get phone number, list/create/delete message templates, and pair rate limit guard.
4. WHEN `whatsapp-api-call-coverage.test.ts` runs THEN it SHALL fail if any request builder lacks a paired integration test file.

**Priority**: High | **Complexity**: High

---

## Non-functional requirements

### Performance

- WHEN sending via adapter THEN Siraj SHALL use `AbortSignal.timeout(10_000)` on Graph API `fetch` calls.
- IF Meta portfolio messaging tier is unverified THEN operations SHALL respect Meta tier 0 limit (250 unique users / 24h) — documented for operators, not hard-coded beyond adapter errors.

### Security

- WHEN verifying webhooks THEN Siraj SHALL use raw body HMAC verification (never re-serialize JSON for hashing).
- WHEN logging audit entries for secrets THEN Siraj SHALL mask values as `***`.
- WHEN storing tokens THEN Siraj SHALL use AES-256-GCM via `field-encryption.ts`.

### Reliability

- WHEN webhook delivery is at-least-once THEN status updates SHALL be idempotent by `wamid`.
- WHEN status events arrive out of order THEN forward-only state machine SHALL prevent regression (e.g. `read` before `delivered` is no-op).

### Usability

- WHERE admin Numbers page is shown THEN Siraj SHALL provide desktop and mobile tier-isolated views via `ResponsiveViewSwitch` without `useMediaQuery` in tier files.

---

## Constraints and assumptions

### Technical constraints

- No new npm dependencies for WhatsApp SDK; use `fetch`, `libphonenumber-js`, existing `jose`/`crypto` for HMAC.
- Graph API version: `v23.0` (align with Meta docs at implementation time).
- Drizzle migrations: `db push` only; `db reset` / `cleanGenerate` disabled by repo policy.
- Postgres enum additions: split 8a (enum only) / 8b (data) due to `check_safe_enum_use`.

### Business constraints

- Template authoring in v1: WhatsApp Manager (Meta UI); optional `syncTemplates` mutation hits API without local template table.
- Utility category templates preferred for educational notifications; marketing subject to Meta per-user frequency caps.

### Assumptions

- Users have valid E.164 `user.phone` for WhatsApp delivery (same as SMS).
- Production webhook URL is public HTTPS reachable by Meta.
- Meta Business Verification will be completed for production scale (tier upgrades).

---

## Success criteria

### Definition of done

- [ ] All REQ acceptance criteria satisfied
- [ ] `bun quality-gate` passes
- [ ] `@live-comm` matrix complete (R9) + coverage guard test green
- [ ] `trackable-tasks.md` all phases marked complete
- [ ] GraphQL schema + frontend codegen updated

### Acceptance metrics

- Successful template send to test recipient returns `wamid` and webhook advances delivery status
- Admin can sync accounts from Meta and see tier/quality fields
- Webhook signature rejection returns 401 for tampered payloads

---

## Glossary

| Term | Definition |
|------|------------|
| WABA | WhatsApp Business Account — container for phone numbers and templates |
| Cloud API | Meta-hosted WhatsApp Business Platform API (only supported architecture post-2025) |
| wamid | WhatsApp message ID returned by send API; used for status webhook correlation |
| Utility template | Meta category for transactional messages (class reminders, invoice notices) |
| Portfolio messaging limit | Per-business-portfolio daily unique-user cap (`max_daily_conversations_per_business` / `whatsapp_business_manager_messaging_limit`) |
| Pair rate limit | Meta limit: ~1 message per recipient per 6 seconds (error `131056`) |
| `@live-comm` | Integration tests gated by env credentials; skipped in CI without secrets |

---

## Requirements review checklist

- [x] User stories have roles, features, benefits
- [x] Acceptance criteria use EARS-style WHEN/IF/THEN/SHALL
- [x] Non-functional requirements addressed
- [x] Out of scope documented
- [x] Traceability to implementation.md and trackable-tasks.md
