# WhatsApp Multi-Number & Coexistence (whatsapp2) — Requirements

## Document Information

- **Feature Name**: WhatsApp v2 — Multi-Number Purpose Routing + Business-App Coexistence (Inbox)
- **Target Directory**: `.ai/plans/whatsapp2`
- **Outcome Directory**: `.ai/plans/whatsapp2/outcome/`
  - Ground truth (already present): `inventory-backend.md`, `inventory-frontend.md`, `docs-research-coexistence.md`, `docs-research-multi-number.md`
- **Version**: 1.0
- **Date**: 2026-09-04
- **Author**: Plan author agent
- **Stakeholders**: Academy admins (configure), staff (conversations), students/parents (recipients), Meta (external platform)
- **Related Documents**: [Implementation](./implementation.md) · [Trackable Tasks](./trackable-tasks.md) · [Deferred Items](./deferred-items.md) · canonical v1 refs `docs/services/whatsapp-cloud-api.md` + `docs/frontend/whatsapp-ui-patterns.md`

## Introduction

Siraj's WhatsApp Cloud API integration (v1) sends templates from one effectively-singleton account: a module-level factory builds one adapter, `MetaCloudApiAdapter.resolveCredentials()` picks the first active account for ALL sends, and inbound webhook payload bodies are stripped and discarded at the route. The academy needs (a) multiple business numbers under one WABA — each assigned a **purpose** (ads leads, student notifications, general) with outbound sends routed to the correct number and per-number limits respected — and (b) **coexistence**: numbers onboarded via Embedded Signup v4 that remain usable in the WhatsApp Business app on staff phones, with contacts/history synced once and ongoing echoes/inbound messages persisted into a Settings ▸ WhatsApp **Inbox** tab.

### Feature Summary

Extend WhatsApp v1 to multi-number purpose-routed outbound sending plus one-shot SMB app-data sync and durable inbound/echo ingestion powering a permission-gated Inbox tab.

### Business Value

Segregates risky marketing traffic (ads replies) from trust traffic (exam/attendance notifications) — per-number quality ratings mean one spammy number otherwise degrades whole-portfolio scaling; coexistence lets staff keep using their phones while the academy gains a shared, auditable inbox.

### Scope

**In scope:**
- Multiple registered numbers in one WABA (Meta cap: 2 initially, up to 20 after verification / 2,000 messaging limit, signalled via `business_capability_update.max_phone_numbers_per_business`).
- Per-account **purpose** (`GENERAL` | `ADVERTISING` | `STUDENTS`) driving outbound send routing from `NOTIFICATION_TEMPLATE_MAP` → `dispatchWhatsapp` → per-account adapter.
- Per-account adapter instances/credentials; pair rate limit re-keyed to sender:recipient.
- Coexistence onboarding via Embedded Signup **v4** (`featureType: 'whatsapp_business_app_onboarding'`); v2 deprecated 2026-10-15.
- One-shot 24h-window `smb_app_data` sync (`smb_app_state_sync` + `history`, 3 phases/180 days) enqueued immediately at onboarding success.
- Durable ingest of `history`, `smb_app_state_sync`, `smb_message_echoes`, and inbound `messages` webhooks; idempotent upserts keyed by `wamid` / `(phase, chunk_order)`.
- New **Inbox** tab (`?tab=inbox`): conversation list + message thread, read-only in v1.
- `account_update` lifecycle handling (reconnect/offboard, partner uninstall).

**Out of scope (explicit non-goals):**
- Groups API (explicitly unavailable on coexistence numbers — Logged as backlog).
- Marketing Messages API, calling/SIP, message editing via Cloud API.
- Inbox **reply composer** (inbox is read-only in v1; deferred).
- Free-text/non-template outbound sending v2 (BL4 free-form beyond template catalog).
- Per-recipient opt-in analogues for inbound conversations (conversations always visible to authorized staff).
- Templates query / opt-in audit resolver backfill (pre-existing v1 gap — see `deferred-items.md`).

## Requirements

### Requirement 0: Pre-Implementation Baseline & Execution Protocol

**User Story:** As an executing agent, I want baseline error counts and a deferred-items ledger, so new regressions are distinguishable from pre-existing v1 issues.

#### Acceptance Criteria

1. WHEN implementation begins THEN the executing agent SHALL record baseline counts (`bun tsgo` error count, `bun biome:check` warnings, `bun run scripts/lint-service.ts --json --id baseline`) and write `.ai/plans/whatsapp2/outcome/0-baseline-outcome.md`.
2. WHEN implementation begins THEN the agent SHALL initialize `.ai/plans/whatsapp2/deferred-items.md` from the template with the pre-existing v1 gaps listed in this plan.
3. WHEN any task starts THEN the agent SHALL read ALL files in `.ai/plans/whatsapp2/outcome/` first (they contain Meta platform facts that MUST NOT be re-generated from training data).
4. WHEN any task completes THEN the agent SHALL write `.ai/plans/whatsapp2/outcome/<task-id>-outcome.md` and flip the checkbox in `trackable-tasks.md`.
5. WHEN any file changes THEN the agent SHALL run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` to exit 0 before moving on.

### Requirement 0.5: Translation System & Enum Import Compliance

**User Story:** As a developer, I want compile-time typed translations and value enum imports, so i18n/type errors surface at build time.

#### Acceptance Criteria

1. WHEN client components render user-facing text THEN they SHALL use `useAppTranslation(Translation.<ns>)` with property access (`t.key`), never `t('key')`, never hardcoded strings, never `next-intl`.
2. WHEN server components translate THEN they SHALL use `getTranslations(locale)` (single arg) with property access (e.g. `getTranslations(locale).commonTranslations...`); resolvers SHALL use the zero-arg context translator `ctx.t()` with property access (e.g. `ctx.t().errorsTranslations...`) — never a namespace argument.
3. WHEN a new locale namespace is introduced (`whatsappInbox`) THEN it SHALL be registered in BOTH surfaces per `shared/locale/AGENTS.md`: type schema in `shared/locale/types/whatsappInbox/index.ts`, leaf modules under `shared/locale/{en,ar}/whatsappInbox/` wired into `en/messages.ts` + `ar/messages.ts`, a `shared/locale/namespaces/whatsappInbox/whatsappInbox.namespace.ts` loader via `defineNamespace`, schema registration in `shared/locale/types/message.ts`, and a handle entry in the `Translation` registry (`shared/locale/namespaces/translation.ts`) — with `@/shared/locale/...` aliases only.
4. WHEN enums are used at runtime THEN they SHALL be imported as values (`import { WhatsappAccountPurpose }`), never `import type`.
5. WHEN a new Drizzle pgEnum is added THEN it SHALL be registered via `createPgEnumFromEnum` in `backend/db/schema/enums.ts` (never raw `pgEnum`) and in `backend/graphql/pothos/shared/enum.pothos.ts` via `gqlSchemaBuilder.enumType`.

### Requirement 1: Multi-Number Account Model & Purposes

**User Story:** As an academy admin, I want each registered WhatsApp number to carry a purpose (ads / students / general), so traffic classes are segregated and I can see each number's mode, sync state, and limits.

#### Acceptance Criteria

1. WHEN an account row exists THEN the `whatsapp_accounts` table SHALL carry `purpose` (enum, default `GENERAL`), `onboardingMode` (`CLOUD_API` default | `COEXISTENCE`), sync-state columns (`syncStatus`, `syncPhase`, `syncProgress`, `syncDeadlineAt`, `syncFailureReason`), and `offboardedAt`; per-type Meta `request_id` values SHALL live on `whatsapp_sync_requests` (see Req 5), not on the account row.
2. WHEN the admin edits an account (create/edit dialogs) THEN the system SHALL expose purpose selection and REJECT a purpose assignment on an account that is not active with `whatsapp.purposeRequiresActive`.
3. WHEN more than the portfolio cap of numbers is added THEN Meta's cap behavior applies (cap 2→20 via `business_capability_update`); the system SHALL surface the webhook-reported cap but SHALL NOT implement its own hard cap.
4. WHEN listing accounts THEN the Numbers tab SHALL show purpose chip, onboarding-mode badge (COEXISTENCE warning Alert already exists via `throughputLevel`), and sync progress for coexistence accounts.
5. WHEN an account is soft-deleted THEN sends routed to its purpose SHALL fall back to the `GENERAL` active account, and if none exists the send SHALL fail with `whatsapp.noSenderForPurpose`.

**Additional Details**: Priority: High · Complexity: Medium · Dependencies: schema migration + AppPermission enum migration · Assumes one WABA per tenant (per WABA-scoped templates shared).

### Requirement 2: Purpose-Based Outbound Routing

**User Story:** As the notification pipeline, I want each template event mapped to a purpose and dispatched through the matching number, so ads replies go out from the ads number and class notifications from the students number.

#### Acceptance Criteria

1. WHEN `NOTIFICATION_TEMPLATE_MAP` (`notification-payloads.builders.ts:87`) stamps a payload THEN `metadata.whatsappTemplate` SHALL carry an optional `purpose`; unmapped events default to `GENERAL`.
2. WHEN `dispatchWhatsapp` (`communication.service.ts:139`) executes THEN it SHALL resolve the sending account = active account whose `purpose` matches the payload purpose, with fallback to active `GENERAL` account, else fail fast with `whatsapp.noSenderForPurpose`.
3. WHEN the resolved account is `isActive = false` THEN the system SHALL pick the next account with the same purpose (multi-number within a purpose) or fall back to `GENERAL` — it SHALL NOT silently send from a different purpose without logging a `logger.warn`.
4. WHEN a send executes THEN the pair rate-limit key SHALL become `whatsapp:pair:<senderE164>:<recipientE164>` (Meta limit: 1 msg/6s per (business number, user) pair, error `131056`, retry 4^X backoff) — one number's burst SHALL NOT throttle another's.
5. WHEN per-purpose routing resolves THEN `WhatsappPayload` SHALL carry `senderAccountId` and the delivery row (`notification_deliveries`) SHALL be attributable to the sending number.
6. IF no template exists for the (event, locale) THEN existing fail-fast `whatsappTemplateMissing` behavior SHALL be preserved unchanged.

**Additional Details**: Priority: High · Complexity: Medium · Dependencies: Req 1 (schema), Req 3 (per-account adapters).

### Requirement 3: Per-Account Channel Instances & Credential Isolation

**User Story:** As the platform, I want adapter instances keyed by account with their own credentials and API version, so one number's token rotation or throughput upgrade never affects another.

#### Acceptance Criteria

1. WHEN `WhatsappChannelFactory` is asked for a channel THEN it SHALL return a per-account adapter instance (cache keyed by `accountId`), replacing the module-level singleton; parameterless construction SHALL be removed.
2. WHEN `MetaCloudApiAdapter.resolveCredentials` runs THEN it SHALL resolve via `whatsappAccountRepository.findById(accountId)` (never `findFirstActiveForCredentials`), with a per-account 5s credentials cache.
3. WHEN credentials change or a token rotates THEN `resetWhatsappChannel(accountId)` SHALL invalidate exactly that account's cache entry; env-key invalidation SHALL remain for the env-global path (admin `syncFromMeta` legacy) until Req 6 migrates it.
4. WHEN the Graph API version is needed THEN it SHALL come from a single env-config key (`WHATSAPP_GRAPH_API_VERSION`, registered under the `whatsapp` category in `backend/lib/env-config-keys.ts`, DB-overridable via `env::` settings, default `v25.0` — the current docs example version; `v23.0` remains valid) — the hardcoded `v20.0` at `MetaCloudApiAdapter.ts:494` SHALL be removed; per-number API versions are not a Meta concept.
5. WHEN `isWhatsappConfigured`/`validateConfig` evaluates THEN it SHALL reflect "at least one active account has valid credentials" (aggregate) while a new `whatsappAccountHealth` view exposes per-account validity.
6. IF a coexistence account is offboarded (`ACCOUNT_OFFBOARDED`) THEN its adapter SHALL be evicted and subsequent sends to it SHALL fail fast with `whatsapp.accountOffboarded` (not retried against Graph).

**Additional Details**: Priority: High · Complexity: High · Dependencies: Req 1 schema.

### Requirement 4: Coexistence Onboarding via Embedded Signup v4

**User Story:** As an academy admin, I want to onboard a staff-used Business-app number via Embedded Signup without losing phone-app access, so humans and the system share the same number.

#### Acceptance Criteria

1. WHEN the admin starts onboarding THEN the settings UI SHALL load the Facebook JS SDK with `FB.login({ config_id, response_type: 'code', extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding' } })` — no `version` key: the v4 extras object is purposely empty apart from `setup`/`featureType`, v4 is activated by the v4 Facebook Login for Business Configuration (`config_id`), and `extras.version` accepts only `v4-public-preview, v3-public-preview, v2-public-preview, v3, v2` — and a session-logging `window` message listener filtered to `event.origin` ending `facebook.com` and `data.type === 'WA_EMBEDDED_SIGNUP'`.
2. WHEN the session-logging event arrives THEN the system SHALL handle `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` (payload may contain ONLY `waba_id`), `FINISH`, `CANCEL` (with `current_step`), and `ERROR` distinctly; closing the popup on the final screen counts as success.
3. WHEN the auth `code` is returned THEN the server SHALL exchange it for a business-integration system-user token (`GET /oauth/access_token?client_id…code=…`), store it `encryptedText` on the account, and SKIP phone-number registration (coexistence numbers are already registered).
4. WHEN onboarding succeeds THEN the server SHALL `POST /<WABA_ID>/subscribed_apps` and confirm coexistence via `GET /<PHONE_NUMBER_ID>?fields=is_on_biz_app,platform_type` requiring `is_on_biz_app: true` AND `platform_type: "CLOUD_API"` before marking the account `onboardingMode: COEXISTENCE`.
5. WHEN onboarding completes THEN the system SHALL enqueue the one-shot `smb_app_data` sync IMMEDIATELY (both `smb_app_state_sync` and `history` sync types) because Meta imposes a hard 24-hour post-onboarding window; the enqueue SHALL be retry-safe (see Req 5).
6. IF coexistence prerequisites fail (non-Solution-Partner app, Business app < 2.24.17, user declines connect) THEN the UI SHALL surface the session-logging error/coord step and leave the account in a non-coexistence state without partial writes.
7. IF the number is already onboarded elsewhere (second partner wins) THEN the system SHALL surface `whatsapp.coexistenceTakenByOtherPartner` and SHALL NOT attempt forced re-registration.

**Additional Details**: Priority: High · Complexity: High · Depends on Meta app Dashboard field subscriptions (`messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`) — dashboard-level per Meta docs; plan documents this as an operational prerequisite, not code.

### Requirement 5: One-Shot SMB App-Data Sync

**User Story:** As the system, I want to request contacts + 180-day history exactly once within 24h of onboarding, so the inbox is hydrated without violating Meta's one-shot constraint.

#### Acceptance Criteria

1. WHEN onboarding succeeds THEN the system SHALL POST `{messaging_product:'whatsapp', sync_type:'smb_app_state_sync'}` and separately `{...,'history'}` to `POST /<PHONE_NUMBER_ID>/smb_app_data` and SHALL persist each returned `request_id` (Meta support correlation; NOT echoed in webhooks).
2. IF the sync is not dispatched within 24h of onboarding THEN the state SHALL transition to `FAILED` with reason `syncDeadlineExpired` and the UI SHALL instruct full offboard + ES re-run (Meta does not accept late syncs; each sync_type exactly once per onboarding).
3. IF either sync request errors at POST time THEN the system SHALL retry that request_id-less POST with idempotency via a DB `sync_requests` ledger row (`unique(account_id, sync_type)`) — a retry SHALL NOT double-call Meta after a successful `request_id` was recorded.
4. WHEN history webhooks arrive THEN the system SHALL track `phase` (0: day 0→1; 1: day 1→90; 2: day 90→180), `chunk_order` (dedupe/order key), and `progress` (100 = complete), transitioning `SYNCING → COMPLETE` on progress 100 for both types.
5. WHEN the business declines history sharing (webhook error `2593109`) THEN the state SHALL transition to `FAILED` reason `historyDeclined`, the contacts sync MAY still complete, and the UI SHALL show the "declined" state, not a generic error.
6. WHILE sync is in progress THEN `syncProgress`/`syncPhase` SHALL be queryable for the Numbers tab status badge.

**Additional Details**: Priority: High · Complexity: High · Groups are NEVER synced (Meta excludes them; Groups API unavailable on coexistence numbers).

### Requirement 6: Durable Webhook Ingest (Coexistence Fields + Inbound)

**User Story:** As the system, I want history/echo/contact/inbound webhooks persisted before 200-ack, so Meta redelivery, worker death, and `after()` unreliability cannot lose customer conversations.

#### Acceptance Criteria

1. WHEN a POST webhook arrives THEN the route SHALL verify HMAC-SHA256 + 1MB cap as today, SHALL persist the raw `change` envelope (Drizzle insert into `whatsapp_webhook_events` with processing status `PENDING`) BEFORE returning 200, and SHALL NOT use `stripInboundMessages()` for message-bearing fields.
2. WHEN `after()`-deferred processing runs THEN a worker SHALL claim PENDING events and process them; a periodic sweeper (cron) SHALL re-claim events stuck `PENDING` beyond a TTL — this is the mitigation for `after()`'s non-guaranteed execution on serverless.
3. WHEN Meta retries an identical body THEN the dedupe key SHALL be the payload hash used ONLY as a short-window replay guard (`webhook:replay:<sha256>`, TTL minutes, not 24h) layered with DB idempotency; identical-body retries SHALL be accepted (200) and deduped at the entity level, never 4xx-rejected — the v1 24h reject-all-identical-bodies behavior is REMOVED for coexistence fields because Meta legitimately redelivers identical history chunks.
4. WHEN `history` webhooks arrive THEN messages SHALL be upserted keyed by `wamid` into `whatsapp_messages` (dedupe), conversations keyed by (account, wa_id/BSUID) into `whatsapp_conversations`, and contacts into `whatsapp_contacts`; chunks SHALL be deduped by `(accountId, phase, chunk_order)`.
5. WHEN a message carries `media_placeholder` THEN it SHALL be stored as `mediaPlaceholder: true` without content; the follow-up media webhook SHALL be matched by `wamid` and the row updated; webhook-delivered media asset IDs SHALL be fetched/stored within **7 days** of webhook receipt (Meta expires webhook media IDs after 7 days; the 14-day figure is only the history follow-up eligibility window — media messages sent ≤14 days before onboarding get a follow-up, older media stays `media_placeholder` forever) and expired-media rendering SHALL degrade gracefully.
6. WHEN `smb_app_state_sync` arrives THEN contacts SHALL be upserted keyed by (account, phone/user_id) honoring `action: add | remove` and `metadata.timestamp` last-write-wins.
7. WHEN `smb_message_echoes` arrives THEN echoes SHALL be upserted as outbound messages with `direction: 'echo'`; `type: 'revoke'` SHALL soft-mark the original message `revokedAt`; `type: 'edit'` SHALL store latest content + `editedAt` keyed by `original_message_id`.
8. WHEN inbound `messages` webhooks arrive (user→business, `value.messages[]`) THEN they SHALL be persisted with `direction: 'inbound'` AND the existing status-pipeline (`handleMessagesStatus`) SHALL remain for delivery statuses; the user-resolution fallback to `CLASS_REMINDER` analytics pollution SHALL be removed for pure inbound events that have no delivery row.
9. WHEN a cluster of bursts arrives (up to thousands of messages per webhook) THEN processing SHALL be chunked/batched (e.g. 500-row inserts) and SHALL remain within `after()`/cron time budgets; the 1MB body cap stays at the route because Meta's chunking already splits history payloads.

**Additional Details**: Priority: High · Complexity: High.

### Requirement 7: Account Lifecycle Events (Reconnect/Offboard)

**User Story:** As the system, I want to react to Meta account lifecycle webhooks, so a staff device reinstall doesn't silently break sends.

#### Acceptance Criteria

1. WHEN `account_update` carries `ACCOUNT_OFFBOARDED` THEN the account SHALL be marked offboarded, its adapter evicted, and sends to it SHALL fail fast with `whatsapp.accountOffboarded`; Business-app chat history gaps during reonboarding SHALL be tolerated (minutes, not synced).
2. WHEN `account_update` carries `ACCOUNT_RECONNECTED` THEN the account SHALL return to active with adapter re-instantiation; no sync SHALL be re-requested (one-shot rule — eligibility survives only if reonboarding was automatic).
3. WHEN `PARTNER_APP_UNINSTALLED` arrives THEN the account SHALL be deactivated and a warning SHALL surface in the Numbers tab.
4. WHEN `DISABLED_UPDATE` (`ban_info.waba_ban_state`) arrives THEN a severity-normal alert SHALL be logged and surfaced.
5. WHEN `business_capability_update` reports `max_phone_numbers_per_business` THEN the number cap SHALL be stored/surfaced for admin awareness (informational only). The parser SHALL accept `max_daily_conversations_per_business` as both `TIER_*` strings (`TIER_250/TIER_2K/TIER_10K/TIER_100K/TIER_UNLIMITED`, per the webhook reference) and integer-style values (per messaging-limits docs); on webhooks <v24.0 Meta sends only the deprecated `max_daily_conversation_per_phone`, which SHALL also be parsed. `max_phone_numbers_per_business` (present only while the portfolio is at the initial 250 limit) and `max_phone_numbers_per_waba` (present only when ≠250) are CONDITIONALLY included — absence SHALL NOT be interpreted as "no cap".
6. WHEN `account_update` carries `PARTNER_REMOVED` THEN the payload's `disconnection_info.reason` (`ACCOUNT_DISCONNECTED`, `BUSINESS_DOWNGRADE`, `CHANGE_NUMBER`, `COMPANION_INACTIVITY` ~30d inactive, `PRIMARY_INACTIVITY` ~14d inactive, `USER_RE_REGISTERED`) SHALL be recorded, the account SHALL be marked inactive, and an audit log + admin warning SHALL surface in the Numbers tab.

### Requirement 8: Inbox Tab (Read-Only Conversations)

**User Story:** As a staff member with inbox permission, I want to browse conversations and read thread history, so I have a shared record of what the number discussed with each contact.

#### Acceptance Criteria

1. WHEN a user with `WHATSAPP_INBOX_VIEW` opens Settings ▸ WhatsApp THEN a 4th tab `?tab=inbox` SHALL appear (URL-synced, TAB_IDS/TAB_LABELS/TAB_PERMISSIONS extended); users without it SHALL not see the tab (`RequirePermission`).
2. WHEN the inbox loads THEN it SHALL list conversations for a selected account (or "all numbers" with account column) via `AppDataGrid` (desktop) / `MobileCardList` (mobile) with pagination per `frontend/COMPONENT_PATTERNS.md`.
3. WHEN a conversation is opened THEN the full message thread SHALL render chronologically with inbound/echo/api direction bubbles, `status`, `mediaPlaceholder` fallback, revoked/edited indicators.
4. WHEN media has expired (>7 days since the media follow-up webhook was received — Meta expires webhook media IDs after 7 days) THEN the UI SHALL show an availability notice rather than broken images.
5. WHEN a new inbound/echo arrives WHILE the inbox is open THEN polling or refetch-on-focus SHALL surface it (no WebSocket requirement in v1).
6. IF an unauthorized user hits the inbox query/mutation THEN GraphQL SHALL reject via `PermissionsService.hasPermission(WHATSAPP_INBOX_VIEW)` at resolver + `requirePermission` at service (defense in depth); `WHATSAPP_INBOX_MANAGE` SHALL gate any destructive action (e.g. clear conversation) added later.

**Additional Details**: Priority: High · Complexity: Medium · Reply composer explicitly deferred.

### Non-Goals (Restated)

Groups API; Marketing Messages API; calling; message editing via API; inbox reply composer; free-text outbound (BL4); per-user inbound notification preferences; migration off v1's existing WABA.

## UX/Navigation Requirements (MANDATORY)

### Tab-Level Access (Settings ▸ WhatsApp — route unchanged: `/settings/whatsapp`)

| Tab (`?tab=`) | Purpose | Permission | Roles |
|---|---|---|---|
| `numbers` (existing) | Account CRUD + purpose + coexistence status | `WHATSAPP_CONFIG_MANAGE` | super_admin, academy_admin |
| `templates` (existing) | Template snapshot | `WHATSAPP_TEMPLATES_MANAGE` | super_admin, academy_admin |
| `optin` (existing) | User opt-in prefs | `WHATSAPP_VIEW` | super_admin, academy_admin, staff_default |
| `inbox` (NEW) | Conversations + threads | `WHATSAPP_INBOX_VIEW` | super_admin, academy_admin, staff_default |

### Sidebar

No new sidebar entries: the existing `whatsapp-settings` item under `grp_integrations` (`navigationConfig.ts:709-716`) is unchanged. Only the tab bar gains a 4th entry.

### Role-Based Access Matrix

| Role | Permissions | Visible tabs |
|------|---|---|
| SUPER_ADMIN | all four WhatsApp permissions | numbers, templates, optin, inbox |
| ACADEMY_ADMIN | all four | numbers, templates, optin, inbox |
| STAFF / SUPERVISOR | `WHATSAPP_VIEW` + `WHATSAPP_INBOX_VIEW` | optin, inbox |
| TEACHER / PARENT / STUDENT | none | none (page requires `WHATSAPP_VIEW` server-side) |

### Per-Audience Rendering

| Audience | Prominent content |
|---|---|
| Staff | Inbox conversations + opt-in toggle |
| Academy admin | Numbers (purpose + sync status), templates, inbox |
| Super admin | Everything incl. health/limits |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|---|---|---|
| Numbers card | `NumberCard` + `extraMetadata` incl. purpose + sync % | `MobileCardList` card w/ same badges |
| Inbox list | `AppDataGrid` (`paginationOptions`) | `MobileCardList` |
| Inbox thread | Side-panel / full-width under grid | Full-screen dialog |
| ES onboarding | Embedded Signup modal | Same (responsive FB popup) |

## Cross-Actor Workflow Scenarios (Journeys)

### Actor Table

| Actor | Role / Permission Group | Can Do | Cannot Do |
|---|---|---|---|
| Academy admin | `academy_admin` | assign purposes, onboard coexistence, view inbox | bypass Meta 24h sync window |
| Staff user | `staff_default` | read inbox threads, see opt-in | edit purposes, delete messages, reply from UI (v1) |
| Student/parent (external) | n/a | receive routed notification, reply from own app | see inbox |
| Notification service | system actor | route by purpose, honor per-pair rate limit | exceed 1 msg/6s per pair |
| Meta platform | external | deliver history/echo/inbound webhooks, offboard | send to groups for coexistence numbers |

### Journey J1: Admin configures purposes → notification routes correctly

1. Admin → creates account B ("students" purpose) alongside account A ("ads") → both active rows in `whatsapp_accounts`.
2. System event → CLASS_REMINDER fires → `NOTIFICATION_TEMPLATE_MAP` marks purpose `STUDENTS` → `dispatchWhatsapp` resolves account B → send via B's adapter → delivery row attributed to B.
3. Ad-reply flow → `ADVERTISING` payload → routed via A; the per-pair limit key for a user messaged by both numbers is independent.

### Journey J2: Coexistence onboarding → sync → inbox visibility

1. Admin → clicks "Connect Business App" → ES v4 popup → completes in Business app (may decline history).
2. Backend → exchanges code, stores token, `subscribed_apps`, confirms `is_on_biz_app` + `platform_type: CLOUD_API` → creates account row `onboardingMode: COEXISTENCE`, `syncStatus: NOT_STARTED`.
3. Backend → immediately POSTs both `smb_app_data` sync types → stores `request_id`s → `REQUESTED`.
4. Meta → delivers `smb_app_state_sync` + `history` chunks → durable ingest → conversations/contacts/messages persisted → sync progresses `SYNCING` → progress 100 → `COMPLETE`.
5. Staff → opens Inbox tab → sees synced conversations; declines-history case → `syncHistoryDeclined` badge, contacts-only inbox.

### Journey J3: Staff uses phone app; system mirrors

1. Staff → sends message in WhatsApp Business app/companion device → `smb_message_echoes` webhook → persisted as echo → appears in inbox thread as outbound-from-phone.
2. Contact → replies → inbound `messages` webhook → persisted inbound → thread updates.
3. Staff → revokes a message → `type: revoke` echo → original row marked `revokedAt`.

### Cross-Actor EARS Criteria

- WHEN the admin assigns purpose P to account A and a notification for purpose P fires THEN the delivery SHALL originate from A AND staff viewing billing/logs SHALL attribute it to A AND a recipient on both an ads and a students conversation SHALL receive each from the correct number.
- WHEN staff declines history sharing in the Business app THEN the system SHALL show `syncHistoryDeclined` to admins AND the inbox SHALL still list contacts-synced conversations AND no history SHALL be fabricated.
- WHEN an unauthorized staff user (no `WHATSAPP_INBOX_VIEW`) queries the inbox THEN the resolver SHALL reject AND the tab SHALL be hidden.
- WHEN a coexistence number is offboarded by device change THEN sends to it SHALL fail fast with a surfaced reason AND the admin SHALL be prompted to reconnect, never silently dead-lettered.

## Edge Cases

| # | Scenario | Expected behavior |
|---|---|---|
| EC-1 | Pair rate limit hit on ads number while students number also active | Only the (ads,user) pair is throttled (`131056`, 4^X backoff); students sends unaffected — key is `sender:recipient` |
| EC-2 | Sync request not dispatched within 24h | `syncStatus → FAILED(syncDeadlineExpired)`; UI instructs full offboard + ES retry |
| EC-3 | Business declines history (error `2593109`) | `historyDeclined` state; contacts sync unaffected |
| EC-4 | Inbound message webhook arrives before its history sync or before delivery row | Ingest SHALL upsert independently; no dependency on delivery rows for inbound |
### Edge Cases (continued)

| # | Scenario | Expected behavior |
|---|---|---|
| EC-5 | Meta retries identical webhook body (history chunk redelivery) | Short replay window (minutes) rejects exact duplicates; entity-level wamid upserts make any accepted duplicate a no-op; NEVER 4xx-rejected |
| EC-6 | `after()` handler killed mid-processing (serverless) | Raw event row was persisted pre-200; sweeper cron re-claims PENDING events past TTL and processes them |
| EC-7 | History burst (thousands of messages in one webhook) | Batched inserts; per-field processing is async; 200 returned immediately |
| EC-8 | History media ≤14 days old at onboarding: placeholder arrives, media follow-up webhook never arrives | `mediaPlaceholder` row renders as "media unavailable"; no crash |
| EC-9 | Media fetched >7 days after the media webhook was received (Meta webhook media-ID expiry) | Fetch attempt returns Meta expiry error → UI shows expiry notice; media older than 14 days at onboarding stays `media_placeholder` forever (no follow-up is ever sent) |
| EC-10 | Two admins assign conflicting purpose to the same account concurrently | Optimistic update; last write wins with audit; both clients refetch |
| EC-11 | Number added beyond portfolio cap (2 initially) | Meta rejects at WABA level; UI surfaces Meta error; `business_capability_update` later raises cap to 20 |
| EC-12 | `to` field absent on history message (usernames rollout) | Conversation keyed by `wa_id`, fallback `user_id` (BSUID), fallback `username`; thread SHALL still render |
| EC-13 | Contact removed then re-added | `smb_app_state_sync` actions upsert; `removedAt` toggles; latest timestamp wins via `metadata.timestamp` |
| EC-14 | Same `wamid` appears in BOTH history sync and live echo | Upsert keyed on `wamid` — second insert is a no-op update; single truth row |
| EC-15 | Offboard during active sync | Sync state → `FAILED`; remaining webhooks may still arrive and are ingested (no crash) but no new sync can be requested |
| EC-16 | ES popup abandoned at `PHONE_NUMBER_SETUP` | `CANCEL` event with `current_step` logged; no partial account row created |
| EC-17 | `syncDeadlineAt` crosses daylight-saving / leap | UTC epoch timestamps; no wall-clock math |

## Non-Functional Requirements

### Performance

- WHEN a history chunk with thousands of messages arrives THEN ingest SHALL ack within our design target (<1s) after a single lightweight insert, processing asynchronously. Note: Meta documents NO numeric response-timeout for messaging webhooks (the only ~20s figure appears in the calling FAQ); Meta retries failed deliveries immediately, then with decreasing frequency for up to 7 days — the <1s target is our design choice, not a Meta-imposed limit.
- WHEN the inbox lists conversations THEN pagination SHALL keep p95 < 300ms on 100k messages via `(accountId, lastMessageAt)` index and `(conversationId, timestamp)` index.
- WHEN per-pair rate limiter checks THEN Redis lookup SHALL be O(1) and SHALL NOT introduce cross-number contention.

### Security

- WHEN a webhook body fails HMAC verification THEN the route SHALL 401 and NOT persist.
- WHEN processing stored webhook events THEN raw payloads SHALL be retained only for replay-window debugging and redacted per existing `whatsapp-sanitize` behavior; message content encrypted-at-rest per `encryptedText` convention where sensitive.
- WHEN inbox queries run THEN they SHALL enforce `WHATSAPP_INBOX_VIEW` at resolver + service layers.

### Usability

- WHEN sync declines or expires THEN the Numbers tab SHALL show a StatusBadge with a localized explanation + next action.
- WHEN staff read a thread in Arabic locale THEN message bubbles and direction SHALL render RTL-correct.
- WHEN a number carries coexistence restrictions (broadcast lists disabled, disappearing messages off, etc.) THEN the edit dialog SHALL surface `whatsapp.coexistenceRestrictionsHint` so admins aren't surprised.

### Reliability

- WHEN Meta redelivers THEN no duplicate conversation/message rows SHALL result.
- WHEN the sync request POST fails transiently THEN the retry SHALL be safe because `request_id` is recorded before retries stop and the DB unique `(account_id, sync_type)` prevents a second Meta call.

## Constraints & Assumptions

### Technical Constraints

- Embedded Signup v4 minimum: `featureType 'whatsapp_business_app_onboarding'`; v2 EOL 2026-10-15.
- SMB sync: `smb_app_state_sync` + `history` each exactly once; only within 24h of onboarding; results via webhooks only; groups excluded; history covers 180 days max; webhook media asset IDs must be fetched within 7 days of receipt, and history media follow-ups arrive only for media messages sent ≤14 days before onboarding.
- Meta limits: 2 → 20 numbers per portfolio (cap raised by verification or 2,000-limit achievement); templates WABA-scoped; per-number throughput default 80 msg/s (**coexistence numbers are fixed at 20 mps** — verified in `throughput.md`); pair limit 1 msg/6s per (number,user); registration ≤10/72h (`133016`).
- Business app ≥ 2.24.17; partner must be Solution Partner/Tech Provider; session logging mandatory; `app_only_install` incompatible with coexistence.
- `request_id` is the ONLY sync correlation handle (not echoed in webhooks) → store it, don't rely on it for idempotency.

### Business Constraints

- Number purposes are advisory routing metadata; Meta enforces only per-number limits — quality degradation on the ads number still degrades portfolio scaling eligibility.
- The two surfaced numbers must share one WABA (one bill); moving to multiple WABAs is out of scope.

### Assumptions

- App Dashboard webhook field subscriptions (`messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`) are configured manually; code validates at runtime and surfaces gaps.
- One tenant → one WABA in v2.
- The route's 1MB webhook body cap is an **explicitly-flagged assumption**: docs confirm chunks may contain thousands of messages and give no byte-size limit. Mitigation: verify against a real history sync during onboarding rehearsal and raise the cap if a real chunk approaches it.

## Success Criteria

### Definition of Done
- [ ] All acceptance criteria above are met and covered by tests (repo/service/webhook-handshake + journey).
- [ ] An ads-template event and a student-notification event send from distinct numbers on a multi-number WABA (verified in journey test).
- [ ] A declined-history onboarding lands in `syncHistoryDeclined` without any stack trace.
- [ ] Meta retry of an identical history chunk produces zero duplicate rows (verified by test).
- [ ] `after()`-killed processing is recovered by the sweeper (simulated test).
- [ ] Inbox renders a synced thread in both locales on desktop + mobile.

### Acceptance Metrics
- Zero regressions in existing v1 send path for single-account deployments (existing webhook/status tests stay green).
- Ingest p95 ack < 200ms; processing bounded by sweeper cadence.
- No new tsgo/biome/lint errors vs baseline.

## Glossary

| Term | Definition |
|---|---|
| WABA | WhatsApp Business Account — container for numbers/templates |
| Coexistence | One number used by both WhatsApp Business app and Cloud API |
| Embedded Signup (ES) | Meta-hosted onboarding popup; v4 current |
| SMB app data sync | One-shot contacts+history sync via `smb_app_data` endpoint |
| Echo (`smb_message_echoes`) | Webhook copy of a Business-app-sent message |
| CSW | 24h Customer Service Window (Cloud API free-form window) |
| BSUID | Business-Scoped User ID |
| wamid | Meta message ID (`wamid.*`) — dedupe key |
| Pair rate limit | 1 msg/6s per (business number, user) → error 131056 |
